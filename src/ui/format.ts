const compactNumber = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
  notation: "compact",
  compactDisplay: "short",
});

const ordinaryNumber = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
});

export function formatGameNumber(value: number): string {
  if (!Number.isFinite(value)) return "Unavailable";
  const absolute = Math.abs(value);
  return absolute >= 10_000
    ? compactNumber.format(value)
    : ordinaryNumber.format(value);
}

export function formatRate(value: number): string {
  if (!Number.isFinite(value)) return "Unavailable";
  if (value === 0) return "0 / second";
  return `${value < 0.01 ? value.toFixed(3) : value.toFixed(2)} / second`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0)
    return "No estimate";
  if (seconds < 60) return `${Math.ceil(seconds)} sec`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.ceil(seconds % 60);
    return remainder > 0 ? `${minutes} min ${remainder} sec` : `${minutes} min`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.ceil((seconds % 3600) / 60);
  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

export function formatElapsed(milliseconds: number): string {
  return formatDuration(Math.max(0, milliseconds) / 1000);
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
