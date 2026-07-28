import type { StorageLike } from "../persistence/local-storage";
import type { OwnershipServices } from "./coordinator";

interface OwnershipMessage {
  type: "claim" | "release" | "conflict";
  tabId: string;
  expiresAtMs: number;
  targetTabId?: string;
}

interface ChannelLike {
  postMessage(message: OwnershipMessage): void;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<OwnershipMessage>) => void,
  ): void;
  removeEventListener(
    type: "message",
    listener: (event: MessageEvent<OwnershipMessage>) => void,
  ): void;
  close(): void;
}

export interface BrowserOwnershipEnvironment {
  locks?: LockManager;
  createChannel?: (name: string) => ChannelLike;
  setTimer: (callback: () => void, delayMs: number) => unknown;
  clearTimer: (handle: unknown) => void;
}

export interface BrowserOwnershipAdapter {
  services: OwnershipServices;
  setWriter(writer: boolean): void;
  close(): void;
}

function defaultEnvironment(): BrowserOwnershipEnvironment {
  const environment: BrowserOwnershipEnvironment = {
    setTimer: (callback, delayMs) => window.setTimeout(callback, delayMs),
    clearTimer: (handle) => window.clearTimeout(handle as number),
  };
  if (typeof navigator !== "undefined" && "locks" in navigator)
    environment.locks = navigator.locks;
  if (typeof BroadcastChannel !== "undefined")
    environment.createChannel = (name) => new BroadcastChannel(name);
  return environment;
}

export function createBrowserOwnershipAdapter(
  tabId: string,
  storage: StorageLike,
  now: () => number,
  environment: BrowserOwnershipEnvironment = defaultEnvironment(),
): BrowserOwnershipAdapter {
  let writer = false;
  let releaseHeldLock: (() => void) | null = null;
  let pendingClaim: ((conflict: boolean) => void) | null = null;
  let pendingTimer: unknown = null;
  const channel = environment.createChannel?.("analysis-idle:v2:ownership");

  const finishClaim = (conflict: boolean) => {
    if (!pendingClaim) return;
    const resolve = pendingClaim;
    pendingClaim = null;
    if (pendingTimer !== null) environment.clearTimer(pendingTimer);
    pendingTimer = null;
    resolve(conflict);
  };
  const onMessage = (event: MessageEvent<OwnershipMessage>) => {
    const message = event.data;
    if (!message || message.tabId === tabId) return;
    if (message.type === "conflict" && message.targetTabId === tabId) {
      finishClaim(true);
      return;
    }
    if (message.type === "claim") {
      const winsTie = pendingClaim !== null && tabId < message.tabId;
      if (writer || winsTie)
        channel?.postMessage({
          type: "conflict",
          tabId,
          targetTabId: message.tabId,
          expiresAtMs: now() + 15_000,
        });
      else if (pendingClaim !== null) finishClaim(true);
    }
  };
  channel?.addEventListener("message", onMessage);

  const requestWebLock = environment.locks
    ? (name: string) =>
        new Promise<boolean>((resolve) => {
          let answered = false;
          void environment
            .locks!.request(
              name,
              { mode: "exclusive", ifAvailable: true },
              async (lock) => {
                if (!lock) {
                  answered = true;
                  resolve(false);
                  return;
                }
                answered = true;
                resolve(true);
                await new Promise<void>((release) => {
                  releaseHeldLock = release;
                });
              },
            )
            .catch(() => {
              if (!answered) resolve(false);
            });
        })
    : undefined;

  const broadcast = channel
    ? (message: {
        type: "claim" | "release";
        tabId: string;
        expiresAtMs: number;
      }) =>
        new Promise<boolean>((resolve) => {
          finishClaim(false);
          pendingClaim = resolve;
          channel.postMessage(message);
          pendingTimer = environment.setTimer(() => finishClaim(false), 40);
        })
    : undefined;

  return {
    services: {
      storage,
      now,
      ...(requestWebLock ? { requestWebLock } : {}),
      ...(broadcast ? { broadcast } : {}),
      releaseWebLock: () => {
        releaseHeldLock?.();
        releaseHeldLock = null;
      },
    },
    setWriter(next) {
      writer = next;
    },
    close() {
      if (writer)
        channel?.postMessage({
          type: "release",
          tabId,
          expiresAtMs: now(),
        });
      writer = false;
      finishClaim(false);
      releaseHeldLock?.();
      releaseHeldLock = null;
      channel?.removeEventListener("message", onMessage);
      channel?.close();
    },
  };
}
