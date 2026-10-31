"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";

export function Panel({
  children,
  className = "",
  flat = false,
}: {
  children: React.ReactNode;
  className?: string;
  flat?: boolean;
}) {
  return <section className={`${flat ? "panel-flat" : "panel"} ${className}`}>{children}</section>;
}

export function SectionTitle({
  eyebrow,
  title,
  action,
  icon,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-2.5">
        {icon && <div className="mt-0.5 text-acid">{icon}</div>}
        <div>
          {eyebrow && (
            <p className="mono text-[9px] uppercase tracking-[0.22em] text-muted">{eyebrow}</p>
          )}
          <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  accent,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-line/60 bg-abyss/50 px-3.5 py-3 ${className}`}>
      <p className="mono text-[9px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mono mt-1.5 text-[17px] font-semibold leading-none" style={{ color: accent }}>
        {value}
      </p>
      {sub && <div className="mt-1.5 text-[10.5px] text-muted">{sub}</div>}
    </div>
  );
}

export function Sparkline({
  data,
  color = "#c9ff4d",
  height = 46,
  width = 160,
  fill = true,
  strokeWidth = 1.5,
  className = "",
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  fill?: boolean;
  strokeWidth?: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  if (!data.length) return <div style={{ height }} className={className} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min;
  const pad = 2;
  const points = data.map((value, i) => {
    const x = pad + (i / Math.max(1, data.length - 1)) * (width - pad * 2);
    const y = span === 0 ? height / 2 : pad + (1 - (value - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${pad},${height} ${line} ${width - pad},${height}`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      role="img"
      aria-label="Price history"
    >
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <polygon points={area} fill={`url(#g-${id})`} />}
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Progress({
  value,
  max = 100,
  color = "#c9ff4d",
  height = 4,
  className = "",
}: {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`overflow-hidden rounded-full bg-line/80 ${className}`} style={{ height }}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}55` }}
      />
    </div>
  );
}

export function Delta({ value, className = "" }: { value: number; className?: string }) {
  const positive = value >= 0;
  return (
    <span
      className={`mono inline-flex items-center gap-0.5 text-[10.5px] ${positive ? "text-mint" : "text-danger"} ${className}`}
    >
      {positive ? "▲" : "▼"} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <button className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div
        className={`panel rise relative z-10 w-full ${width} max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-b-xl`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line/60 bg-panel/95 px-5 py-4 backdrop-blur-xl">
          <div>
            {eyebrow && <p className="mono text-[9px] uppercase tracking-[0.22em] text-acid">{eyebrow}</p>}
            <h3 className="mt-0.5 text-[16px] font-semibold tracking-[-0.02em]">{title}</h3>
          </div>
          <button onClick={onClose} className="btn-ghost rounded-md p-1.5" aria-label="Close dialog">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className = "",
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={`inline-flex rounded-lg border border-line/70 bg-void/60 p-0.5 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-[6px] px-2.5 py-1 text-[10.5px] font-medium transition-colors ${
            value === option.value
              ? "bg-line-bright/70 text-ink"
              : "text-muted hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
