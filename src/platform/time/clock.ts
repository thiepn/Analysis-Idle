export type ClockAnomaly = "NONE" | "ROLLBACK" | "FORWARD_JUMP";

export interface SanitizedElapsed {
  elapsedMs: number;
  rawElapsedMs: number;
  anomaly: ClockAnomaly;
  capped: boolean;
}

export function sanitizeElapsed(
  previousWallClockMs: number,
  currentWallClockMs: number,
  maximumMs: number,
): SanitizedElapsed {
  if (
    ![previousWallClockMs, currentWallClockMs, maximumMs].every(
      Number.isFinite,
    ) ||
    maximumMs < 0
  )
    throw new TypeError("Clock inputs must be finite and maximum non-negative");
  const raw = currentWallClockMs - previousWallClockMs;
  if (raw < 0)
    return {
      elapsedMs: 0,
      rawElapsedMs: raw,
      anomaly: "ROLLBACK",
      capped: false,
    };
  if (raw > maximumMs)
    return {
      elapsedMs: maximumMs,
      rawElapsedMs: raw,
      anomaly: "FORWARD_JUMP",
      capped: true,
    };
  return { elapsedMs: raw, rawElapsedMs: raw, anomaly: "NONE", capped: false };
}
