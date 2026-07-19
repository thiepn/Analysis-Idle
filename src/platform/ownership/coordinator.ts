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

export class WriterCoordinator {
  public constructor(
    private readonly tabId: string,
    private readonly services: OwnershipServices,
    private readonly leaseDurationMs = 15_000,
  ) {}

  public async acquire(): Promise<OwnershipResult> {
    if (
      this.services.requestWebLock &&
      (await this.services.requestWebLock("analysis-idle:v2:writer"))
    )
      return {
        writer: true,
        method: "web-lock",
        diagnostic: "Web Lock acquired",
      };
    const now = this.services.now();
    const existingText = this.services.storage.getItem(SAVE_KEYS.lease);
    const existing = existingText ? (JSON.parse(existingText) as Lease) : null;
    if (existing && existing.expiresAtMs > now && existing.tabId !== this.tabId)
      return {
        writer: false,
        method: "passive",
        diagnostic: `Writer lease held by ${existing.tabId}`,
      };
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
    return {
      writer: true,
      method: "lease",
      diagnostic: existing
        ? "Expired lease recovered"
        : "Fallback lease acquired",
    };
  }

  public renew(): boolean {
    const current = this.services.storage.getItem(SAVE_KEYS.lease);
    if (!current || (JSON.parse(current) as Lease).tabId !== this.tabId)
      return false;
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
    if (current && (JSON.parse(current) as Lease).tabId === this.tabId)
      this.services.storage.removeItem(SAVE_KEYS.lease);
  }
}
