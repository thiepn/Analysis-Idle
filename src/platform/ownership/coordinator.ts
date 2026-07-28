import { SAVE_KEYS, type StorageLike } from "../persistence/local-storage";

export type OwnershipMethod =
  "web-lock" | "broadcast-lease" | "lease" | "passive";
export interface OwnershipResult {
  writer: boolean;
  method: OwnershipMethod;
  diagnostic: string;
}

export interface OwnershipServices {
  storage: StorageLike;
  now: () => number;
  requestWebLock?: (name: string) => Promise<boolean>;
  releaseWebLock?: () => void;
  broadcast?: (message: {
    type: "claim" | "release";
    tabId: string;
    expiresAtMs: number;
  }) => Promise<boolean>;
}

interface Lease {
  tabId: string;
  expiresAtMs: number;
}

function parseLease(text: string | null): Lease | null {
  if (!text) return null;
  try {
    const value = JSON.parse(text) as Partial<Lease>;
    return typeof value.tabId === "string" &&
      value.tabId.length > 0 &&
      typeof value.expiresAtMs === "number" &&
      Number.isFinite(value.expiresAtMs)
      ? { tabId: value.tabId, expiresAtMs: value.expiresAtMs }
      : null;
  } catch {
    return null;
  }
}

export class WriterCoordinator {
  public constructor(
    private readonly tabId: string,
    private readonly services: OwnershipServices,
    private readonly leaseDurationMs = 15_000,
  ) {}

  public async acquire(): Promise<OwnershipResult> {
    const now = this.services.now();
    const existingText = this.services.storage.getItem(SAVE_KEYS.lease);
    const existing = parseLease(existingText);
    if (existing && existing.expiresAtMs > now && existing.tabId !== this.tabId)
      return {
        writer: false,
        method: "passive",
        diagnostic: `Writer lease held by ${existing.tabId}`,
      };
    if (
      this.services.requestWebLock &&
      (await this.services.requestWebLock("analysis-idle:v2:writer"))
    ) {
      this.writeLease(now);
      return {
        writer: true,
        method: "web-lock",
        diagnostic: "Web Lock acquired",
      };
    }
    const lease: Lease = {
      tabId: this.tabId,
      expiresAtMs: now + this.leaseDurationMs,
    };
    if (this.services.broadcast) {
      const conflict = await this.services.broadcast({
        type: "claim",
        ...lease,
      });
      if (conflict)
        return {
          writer: false,
          method: "passive",
          diagnostic: "BroadcastChannel reported an active writer",
        };
      this.services.storage.setItem(SAVE_KEYS.lease, JSON.stringify(lease));
      return {
        writer: true,
        method: "broadcast-lease",
        diagnostic: "Broadcast claim and fallback lease acquired",
      };
    }
    this.services.storage.setItem(SAVE_KEYS.lease, JSON.stringify(lease));
    if (
      parseLease(this.services.storage.getItem(SAVE_KEYS.lease))?.tabId !==
      this.tabId
    )
      return {
        writer: false,
        method: "passive",
        diagnostic: "Fallback lease claim lost to another tab",
      };
    return {
      writer: true,
      method: "lease",
      diagnostic: existing
        ? "Expired lease recovered"
        : "Fallback lease acquired",
    };
  }

  private writeLease(now: number): void {
    this.services.storage.setItem(
      SAVE_KEYS.lease,
      JSON.stringify({
        tabId: this.tabId,
        expiresAtMs: now + this.leaseDurationMs,
      }),
    );
  }

  public renew(): boolean {
    const current = this.services.storage.getItem(SAVE_KEYS.lease);
    if (parseLease(current)?.tabId !== this.tabId) return false;
    this.services.storage.setItem(
      SAVE_KEYS.lease,
      JSON.stringify({
        tabId: this.tabId,
        expiresAtMs: this.services.now() + this.leaseDurationMs,
      }),
    );
    return true;
  }

  public release(): void {
    const current = this.services.storage.getItem(SAVE_KEYS.lease);
    if (parseLease(current)?.tabId === this.tabId)
      this.services.storage.removeItem(SAVE_KEYS.lease);
    this.services.releaseWebLock?.();
  }
}
