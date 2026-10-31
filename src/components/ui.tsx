import { X } from "lucide-react";
import {
  useEffect,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";

export function Panel({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return <div className={cn("panel", hover && "panel-hover", className)}>{children}</div>;
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("label", className)}>{children}</div>;
}

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "mint" | "danger" | "gold" | "violet";
  className?: string;
}) {
  const styles = {
    default: "chip",
    mint: "chip chip-mint",
    danger: "chip chip-danger",
    gold: "chip chip-gold",
    violet: "chip chip-violet",
  }[variant];
  return <span className={cn(styles, className)}>{children}</span>;
}

export function Dot({ color = "#7CF7C4", pulse = false }: { color?: string; pulse?: boolean }) {
  return (
    <span
      className={cn("inline-block h-1.5 w-1.5 rounded-full", pulse && "animate-pulse-dot")}
      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}

export function Button({
  children,
  variant = "ghost",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "gold";
  size?: "sm" | "md";
}) {
  return (
    <button
      className={cn(
        "btn",
        `btn-${variant}`,
        size === "sm" && "px-2.5 py-1.5 text-[11px]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Progress({
  value,
  max = 100,
  color = "#7CF7C4",
  height = 5,
  className,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-white/[0.06]", className)}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          background: color,
          boxShadow: `0 0 14px ${color}55`,
        }}
      />
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string; icon?: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-white/[0.07] bg-black/25 p-0.5",
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[9.5px] uppercase tracking-wider transition",
            value === option.value
              ? "bg-white/[0.08] text-white shadow-sm"
              : "text-white/35 hover:text-white/70",
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  delta,
  accent = "#7CF7C4",
  icon,
  spark,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  accent?: string;
  icon?: ReactNode;
  spark?: ReactNode;
}) {
  return (
    <div className="stat-card group">
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="label">{label}</div>
          <div className="num mt-2 text-[25px] font-medium leading-none text-white">{value}</div>
          <div className="mt-2.5 flex items-center gap-2">
            {delta !== undefined && (
              <span
                className={cn(
                  "num rounded px-1.5 py-0.5 text-[9.5px]",
                  delta >= 0 ? "bg-mint/10 text-mint" : "bg-danger/10 text-danger",
                )}
              >
                {delta >= 0 ? "+" : ""}
                {delta.toFixed(2)}%
              </span>
            )}
            {sub && <span className="text-[10px] text-white/35">{sub}</span>}
          </div>
        </div>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg border"
          style={{
            borderColor: `${accent}22`,
            background: `${accent}0d`,
            color: accent,
          }}
        >
          {icon}
        </div>
      </div>
      {spark && <div className="relative z-10 mt-3">{spark}</div>}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <div className="label text-mint/70">{eyebrow}</div>
        <h1 className="mt-1.5 text-[30px] leading-none text-white md:text-[36px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-white/40">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "panel animate-fade-up relative z-10 w-full overflow-hidden border-white/10 bg-[#0a0f18] shadow-card",
          width,
        )}
      >
        <div className="flex items-start justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <h3 className="text-[16px] text-white">{title}</h3>
            {subtitle && <p className="mt-1 text-[11px] text-white/35">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 p-1.5 text-white/40 transition hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function Avatar({
  initials,
  color = "#7CF7C4",
  size = 34,
  className,
}: {
  initials: string;
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border font-mono font-semibold",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.3,
        color,
        background: `${color}14`,
        borderColor: `${color}30`,
      }}
    >
      {initials}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/30">
        {icon}
      </div>
      <div className="text-sm text-white/70">{title}</div>
      <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-white/35">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-white/40">
      {children}
    </kbd>
  );
}
