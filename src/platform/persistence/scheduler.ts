export interface TimerServices {
  now(): number;
  setTimer(callback: () => void, delayMs: number): unknown;
  clearTimer(handle: unknown): void;
}

export const SAVE_DEBOUNCE_MS = 1_000;
export const SAVE_MAXIMUM_DELAY_MS = 10_000;

export class SaveScheduler {
  private dirtySinceMs: number | null = null;
  private timer: unknown = null;

  public constructor(
    private readonly services: TimerServices,
    private readonly persist: () => void | Promise<void>,
  ) {}

  public markAcceptedCommand(): void {
    const now = this.services.now();
    this.dirtySinceMs ??= now;
    if (this.timer !== null) this.services.clearTimer(this.timer);
    const maximumAt = this.dirtySinceMs + SAVE_MAXIMUM_DELAY_MS;
    const runAt = Math.min(now + SAVE_DEBOUNCE_MS, maximumAt);
    this.timer = this.services.setTimer(
      () => void this.flush(),
      Math.max(0, runAt - now),
    );
  }

  public async flush(): Promise<void> {
    if (this.timer !== null) this.services.clearTimer(this.timer);
    this.timer = null;
    if (this.dirtySinceMs === null) return;
    await this.persist();
    this.dirtySinceMs = null;
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
