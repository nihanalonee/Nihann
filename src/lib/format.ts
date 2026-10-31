export const fmtMoney = (value: number, decimals = 2) => {
  if (!Number.isFinite(value)) return "$0.00";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(decimals)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(decimals)}M`;
  if (abs >= 10_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toLocaleString("en-US", {
    minimumFractionDigits: abs < 100 ? decimals : 0,
    maximumFractionDigits: abs < 100 ? decimals : 0,
  })}`;
};

export const fmtFullMoney = (value: number) =>
  `${value < 0 ? "-" : ""}$${Math.abs(Math.round(value)).toLocaleString("en-US")}`;

export const fmtPrice = (value: number) => {
  if (value < 0.01) return `$${value.toFixed(5)}`;
  if (value < 1) return `$${value.toFixed(4)}`;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const fmtNum = (value: number, decimals = 0) =>
  value.toLocaleString("en-US", { maximumFractionDigits: decimals });

export const fmtCompact = (value: number) => {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${Math.round(value)}`;
};

export const fmtPct = (value: number, decimals = 2) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;

export const fmtTime = (date = new Date()) =>
  date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

export const fmtDate = (date = new Date()) =>
  date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

export const signedClass = (value: number) =>
  value > 0 ? "text-mint" : value < 0 ? "text-danger" : "text-white/60";
