export function credits(value: number, compact = false): string {
  if (!Number.isFinite(value)) return "₡0";
  const abs = Math.abs(value);
  if (compact && abs >= 1_000_000_000) return `₡${(value / 1_000_000_000).toFixed(2)}B`;
  if (compact && abs >= 1_000_000) return `₡${(value / 1_000_000).toFixed(2)}M`;
  if (compact && abs >= 10_000) return `₡${(value / 1_000).toFixed(1)}K`;
  return `₡${Math.round(value).toLocaleString("en-US")}`;
}

export function number(value: number, digits = 0): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function compact(value: number, digits = 1): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(digits)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(digits)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(digits)}K`;
  return value.toFixed(digits);
}

export function price(value: number): string {
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (value >= 1) return value.toFixed(2);
  if (value >= 0.01) return value.toFixed(4);
  return value.toFixed(6);
}

export function pct(value: number, digits = 2): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function timeAgo(day: number, currentDay: number): string {
  const delta = Math.max(0, currentDay - day);
  if (delta === 0) return "now";
  if (delta === 1) return "1d";
  if (delta < 7) return `${delta}d`;
  return `${Math.ceil(delta / 7)}w`;
}

export function heatLabel(heat: number): string {
  if (heat < 20) return "Invisible";
  if (heat < 40) return "Noticed";
  if (heat < 60) return "Tracked";
  if (heat < 80) return "Hunted";
  return "Burned";
}
