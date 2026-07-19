export type GameNumber = number & { readonly __gameNumber: unique symbol };
export type SubtractionPolicy =
  "rejectNegative" | "clampZero" | "allowNegative";

export const GAME_NUMBER_MIGRATION_THRESHOLD = 1e280;

function normalize(value: number): number {
  if (!Number.isFinite(value))
    throw new RangeError("GameNumber must be finite");
  if (Math.abs(value) >= GAME_NUMBER_MIGRATION_THRESHOLD)
    throw new RangeError("GameNumber migration threshold reached");
  if (Object.is(value, -0)) return 0;
  return Number(value.toPrecision(15));
}

export function gameNumber(
  value: number,
  options: { allowNegative?: boolean } = {},
): GameNumber {
  const normalized = normalize(value);
  if (!options.allowNegative && normalized < 0)
    throw new RangeError("GameNumber state value cannot be negative");
  return normalized as GameNumber;
}

export const GN_ZERO = gameNumber(0);
export const GN_ONE = gameNumber(1);

export function gnAdd(left: GameNumber, right: GameNumber): GameNumber {
  return gameNumber(left + right, { allowNegative: left + right < 0 });
}

export function gnSubtract(
  left: GameNumber,
  right: GameNumber,
  policy: SubtractionPolicy = "rejectNegative",
): GameNumber {
  const result = left - right;
  if (result < 0 && policy === "rejectNegative")
    throw new RangeError("GameNumber subtraction would be negative");
  if (result < 0 && policy === "clampZero") return GN_ZERO;
  return gameNumber(result, { allowNegative: policy === "allowNegative" });
}

export function gnMultiply(left: GameNumber, right: GameNumber): GameNumber {
  return gameNumber(left * right, { allowNegative: left * right < 0 });
}

export function gnDivide(left: GameNumber, right: GameNumber): GameNumber {
  if (right === 0) throw new RangeError("GameNumber division by zero");
  return gameNumber(left / right, { allowNegative: left / right < 0 });
}

export function gnPow(base: GameNumber, exponent: number): GameNumber {
  if (!Number.isFinite(exponent))
    throw new RangeError("GameNumber exponent must be finite");
  return gameNumber(base ** exponent, {
    allowNegative: base < 0 && Number.isInteger(exponent),
  });
}

export function gnMin(left: GameNumber, right: GameNumber): GameNumber {
  return left <= right ? left : right;
}

export function gnMax(left: GameNumber, right: GameNumber): GameNumber {
  return left >= right ? left : right;
}

export function gnCompare(left: GameNumber, right: GameNumber): -1 | 0 | 1 {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function gnEqual(left: GameNumber, right: GameNumber): boolean {
  return left === right;
}

export function gnClamp(
  value: GameNumber,
  minimum: GameNumber,
  maximum: GameNumber,
): GameNumber {
  if (minimum > maximum)
    throw new RangeError("Invalid GameNumber clamp bounds");
  return gnMin(gnMax(value, minimum), maximum);
}

export function serializeGameNumber(value: GameNumber): string {
  return value.toString();
}

export function deserializeGameNumber(value: string): GameNumber {
  if (
    value.trim() === "" ||
    !/^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value)
  )
    throw new TypeError("Invalid GameNumber string");
  return gameNumber(Number(value), { allowNegative: value.startsWith("-") });
}

export function gameNumberPercent(part: GameNumber, whole: GameNumber): number {
  if (whole === 0)
    throw new RangeError("Percentage denominator cannot be zero");
  const value = (part / whole) * 100;
  if (!Number.isFinite(value))
    throw new RangeError("Percentage must be finite");
  return Number(value.toPrecision(12));
}

export function toDisplayNumber(value: GameNumber): number {
  return value;
}
