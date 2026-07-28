import { naturalNumbersContent } from "../src/content";
import { envelope, reduceCommand, type GameCommand } from "../src/engine";
import {
  createInitialState,
  type GameState,
} from "../src/engine/state/game-state";
import type { StorageLike } from "../src/platform/persistence/local-storage";

export function dispatch(state: GameState, command: GameCommand): GameState {
  const result = reduceCommand(
    state,
    envelope(command, state.sequence + 1, "test"),
    naturalNumbersContent,
  );
  if (!result.accepted)
    throw new Error(`${result.reason.code}: ${result.reason.message}`);
  return result.state;
}

export const initialState = (seed = 12_345) =>
  createInitialState(naturalNumbersContent, seed);

export class MemoryStorage implements StorageLike {
  public readonly values = new Map<string, string>();
  public failWrites = false;
  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  public setItem(key: string, value: string): void {
    if (this.failWrites)
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    this.values.set(key, value);
  }
  public removeItem(key: string): void {
    this.values.delete(key);
  }
}
