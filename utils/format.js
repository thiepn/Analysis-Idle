export function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const absoluteValue = Math.abs(value);

  if (absoluteValue < 1000) {
    return formatSmallNumber(value);
  }

  if (absoluteValue < 1000000) {
    return `${formatCompact(value / 1000)}K`;
  }

  if (absoluteValue < 1000000000) {
    return `${formatCompact(value / 1000000)}M`;
  }

  if (absoluteValue < 1000000000000) {
    return `${formatCompact(value / 1000000000)}B`;
  }

  return value.toExponential(2).replace("+", "");
}

function formatSmallNumber(value) {
  if (Number.isInteger(value) || Math.abs(value) >= 10) {
    return Math.floor(value).toString();
  }

  return value.toFixed(1).replace(/\.0$/, "");
}

function formatCompact(value) {
  const absoluteValue = Math.abs(value);
  const decimals = absoluteValue >= 100 ? 0 : absoluteValue >= 10 ? 1 : 2;

  return value.toFixed(decimals).replace(/\.0+$/, "");
}
