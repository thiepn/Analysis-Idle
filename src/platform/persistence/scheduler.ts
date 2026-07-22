export interface TimerServices {
  now(): number;
  setTimer(callback: () => void, delayMs: number): unknown;
  clearTimer(handle: unknown): void;
}

export const SAVE_DEBOUNCE_MS = 1_000;
export const SAVE_MAXIMUM_DELAY_MS = 10_000;
export const SAVE_PASSIVE_CHECKPOINT_MS = 30_000;

export class SaveScheduler {
  private dirtySinceMs: number | null = null;
  private timer: unknown = null;
  private revision = 0;
  private inFlight: Promise<void> | null = null;

  public constructor(
    private readonly services: TimerServices,
    private readonly persist: () => void | Promise<void>,
  ) {}

  public markAcceptedCommand(): void {
    this.revision += 1;
    const now = this.services.now();
    this.dirtySinceMs ??= now;
    if (this.timer !== null) this.services.clearTimer(this.timer);
    const maximumAt = this.dirtySinceMs + SAVE_MAXIMUM_DELAY_MS;
    const runAt = Math.min(now + SAVE_DEBOUNCE_MS, maximumAt);
    this.timer = this.services.setTimer(
      () => void this.flush().catch(() => undefined),
      Math.max(0, runAt - now),
    );
  }

  public async flush(): Promise<void> {
    if (this.inFlight) return this.inFlight;
    if (this.timer !== null) this.services.clearTimer(this.timer);
    this.timer = null;
    if (this.dirtySinceMs === null) return;
    const savingRevision = this.revision;
    this.inFlight = (async () => {
      await this.persist();
      if (this.revision === savingRevision) {
        this.dirtySinceMs = null;
      } else {
        const now = this.services.now();
        if (this.timer !== null) this.services.clearTimer(this.timer);
        this.timer = this.services.setTimer(
          () => void this.flush().catch(() => undefined),
          SAVE_DEBOUNCE_MS,
        );
        this.dirtySinceMs ??= now;
      }
    })();
    try {
      await this.inFlight;
    } finally {
      this.inFlight = null;
    }
  }

  public isDirty(): boolean {
    return this.dirtySinceMs !== null;
  }
}

export interface LifecycleTarget {
  visibilityState: string;
  addEventListener(
    type: "visibilitychange" | "pagehide",
    listener: () => void,
  ): void;
  removeEventListener(
    type: "visibilitychange" | "pagehide",
    listener: () => void,
  ): void;
}

export function registerPersistenceCheckpoints(
  target: LifecycleTarget,
  checkpoint: () => void,
): () => void {
  const visibility = () => {
    if (target.visibilityState === "hidden") checkpoint();
  };
  const pageHide = () => checkpoint();
  target.addEventListener("visibilitychange", visibility);
  target.addEventListener("pagehide", pageHide);
  return () => {
    target.removeEventListener("visibilitychange", visibility);
    target.removeEventListener("pagehide", pageHide);
  };
}
