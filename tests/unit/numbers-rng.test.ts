import { describe, expect, it } from "vitest";
import {
  deserializeGameNumber,
  gameNumber,
  gnAdd,
  gnClamp,
  gnCompare,
  gnDivide,
  gnMultiply,
  gnPow,
  gnSubtract,
  serializeGameNumber,
} from "../../src/engine/numbers/game-number";
import { createRng, drawUint32 } from "../../src/engine/rng/xoshiro";

describe("GameNumber", () => {
  it("rejects non-finite, negative state, and the migration threshold", () => {
    expect(() => gameNumber(Number.NaN)).toThrow();
    expect(() => gameNumber(Number.POSITIVE_INFINITY)).toThrow();
    expect(() => gameNumber(-1)).toThrow();
    expect(() => gameNumber(1e280)).toThrow();
  });

  it("uses explicit subtraction and division policies", () => {
    expect(gnAdd(gameNumber(2), gameNumber(3))).toBe(5);
    expect(() => gnSubtract(gameNumber(2), gameNumber(3))).toThrow();
    expect(gnSubtract(gameNumber(2), gameNumber(3), "clampZero")).toBe(0);
    expect(() => gnDivide(gameNumber(1), gameNumber(0))).toThrow();
  });

  it("round trips canonical strings", () => {
    const value = gameNumber(1234.56789);
    expect(deserializeGameNumber(serializeGameNumber(value))).toBe(value);
    expect(() => deserializeGameNumber("1;alert(1)")).toThrow();
    expect(() => deserializeGameNumber("01")).toThrow();
    expect(() => deserializeGameNumber("1.0")).toThrow();
  });

  it("covers precision, arithmetic, comparison, and clamp boundaries", () => {
    expect(gameNumber(9.999e279)).toBe(9.999e279);
    expect(gameNumber(1e-300)).toBe(1e-300);
    let repeated = gameNumber(0);
    for (let index = 0; index < 10; index += 1)
      repeated = gnAdd(repeated, gameNumber(0.1));
    expect(repeated).toBe(1);
    expect(gnMultiply(gameNumber(3), gameNumber(4))).toBe(12);
    expect(gnPow(gameNumber(3), 3)).toBe(27);
    expect(gnCompare(gameNumber(2), gameNumber(3))).toBe(-1);
    expect(gnClamp(gameNumber(5), gameNumber(1), gameNumber(4))).toBe(4);
    expect(() =>
      gnClamp(gameNumber(2), gameNumber(3), gameNumber(1)),
    ).toThrow();
  });
});

describe("xoshiro128** RNG", () => {
  it("matches the known seed fixture and serializes draw count", () => {
    let state = createRng(12_345);
    const values: number[] = [];
    for (let index = 0; index < 5; index += 1) {
      const draw = drawUint32(state);
      values.push(draw.value);
      state = draw.state;
    }
    expect(values).toEqual([
      730019377, 4128587028, 1639393097, 98561626, 4120998832,
    ]);
    expect(state.draws).toBe(5);
    expect(drawUint32(structuredClone(state))).toEqual(drawUint32(state));
  });
});
