import { useId, useMemo, useState } from "react";
import { cn } from "../lib/cn";

function pathFromValues(values: number[], width: number, height: number, pad = 2) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = pad + (1 - (value - min) / range) * (height - pad * 2);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function Sparkline({
  data,
  color = "#7CF7C4",
  width = 120,
  height = 34,
  strokeWidth = 1.4,
  fill = true,
  className,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  fill?: boolean;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const values = data.length > 1 ? data : [0, 1];
  const line = pathFromValues(values, width, height);
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      style={{ width: "100%", height }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#spark-${id})`} />}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function AreaChart({
  data,
  height = 210,
  color = "#7CF7C4",
  format = (value: number) => value.toFixed(2),
  showGrid = true,
  showLabels = true,
  className,
}: {
  data: number[];
  height?: number;
  color?: string;
  format?: (value: number) => string;
  showGrid?: boolean;
  showLabels?: boolean;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const values = data.length > 1 ? data : [1, 1];
  const width = 800;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 18;
  const usableHeight = height - padding * 2;

  const points = values.map((value, index) => ({
    x: (index / Math.max(1, values.length - 1)) * width,
    y: padding + (1 - (value - min) / range) * usableHeight,
    value,
  }));

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const last = points[points.length - 1];
  const first = points[0];
  const active = hover !== null ? points[hover] : null;
  const positive = last.value >= first.value;

  return (
    <div className={cn("relative", className)}>
      {showLabels && (
        <div className="pointer-events-none absolute left-0 top-0 z-10 flex w-full justify-between">
          <span className="num text-[9px] text-white/30">{format(max)}</span>
          <span
            className="num text-[9px]"
            style={{ color }}
          >
            {format(last.value)}
          </span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full cursor-crosshair"
        style={{ height }}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
          setHover(Math.round(ratio * (points.length - 1)));
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="55%" stopColor={color} stopOpacity="0.06" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id={`glow-${id}`}>
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {showGrid &&
          [0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              x2={width}
              y1={padding + ratio * usableHeight}
              y2={padding + ratio * usableHeight}
              stroke="rgba(255,255,255,0.055)"
              strokeWidth="1"
              strokeDasharray="2 6"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={ratio * width}
            x2={ratio * width}
            y1="0"
            y2={height}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={area} fill={`url(#area-${id})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          filter={`url(#glow-${id})`}
        />
        <line
          x1={0}
          x2={width}
          y1={last.y}
          y2={last.y}
          stroke={color}
          strokeOpacity="0.12"
          strokeDasharray="3 5"
          vectorEffect="non-scaling-stroke"
        />
        {active && (
          <>
            <line
              x1={active.x}
              x2={active.x}
              y1="0"
              y2={height}
              stroke="rgba(255,255,255,0.22)"
              strokeDasharray="3 4"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={active.x} cy={active.y} r="3.2" fill={color} vectorEffect="non-scaling-stroke" />
          </>
        )}
        <circle cx={last.x} cy={last.y} r="3" fill="#06080D" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
      {active && (
        <div
          className="pointer-events-none absolute top-5 z-20 -translate-x-1/2 rounded-lg border border-white/10 bg-[#0b1019]/95 px-2.5 py-1.5 shadow-card"
          style={{ left: `${(active.x / width) * 100}%` }}
        >
          <div className="num text-[11px] text-white">{format(active.value)}</div>
          <div className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-white/30">
            Index {hover}
          </div>
        </div>
      )}
    </div>
  );
}

export function CandleChart({
  data,
  height = 220,
  color = "#7CF7C4",
  format = (value: number) => value.toFixed(2),
}: {
  data: number[];
  height?: number;
  color?: string;
  format?: (value: number) => string;
}) {
  const width = 800;
  const padding = 14;
  const candles = useMemo(() => {
    const chunk = Math.max(2, Math.ceil(data.length / 32));
    const result: Array<{ o: number; c: number; h: number; l: number }> = [];
    for (let i = 0; i < data.length; i += chunk) {
      const slice = data.slice(i, i + chunk);
      if (!slice.length) continue;
      result.push({
        o: slice[0],
        c: slice[slice.length - 1],
        h: Math.max(...slice),
        l: Math.min(...slice),
      });
    }
    return result;
  }, [data]);

  const min = Math.min(...candles.map((c) => c.l));
  const max = Math.max(...candles.map((c) => c.h));
  const range = max - min || 1;
  const slot = width / Math.max(1, candles.length);
  const bodyWidth = Math.max(2, slot * 0.56);
  const y = (value: number) => padding + (1 - (value - min) / range) * (height - padding * 2);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute right-0 top-0 z-10 flex flex-col items-end gap-7">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="num text-[8px] text-white/20">
            {format(max - (range / 3) * i)}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1="0"
            x2={width}
            y1={padding + (i / 4) * (height - padding * 2)}
            y2={padding + (i / 4) * (height - padding * 2)}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="2 6"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {candles.map((candle, index) => {
          const x = index * slot + slot / 2;
          const up = candle.c >= candle.o;
          const stroke = up ? color : "#FF6B6B";
          const top = y(Math.max(candle.o, candle.c));
          const bottom = y(Math.min(candle.o, candle.c));
          return (
            <g key={index}>
              <line
                x1={x}
                x2={x}
                y1={y(candle.h)}
                y2={y(candle.l)}
                stroke={stroke}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                opacity="0.65"
              />
              <rect
                x={x - bodyWidth / 2}
                y={top}
                width={bodyWidth}
                height={Math.max(1.4, bottom - top)}
                fill={up ? stroke : "rgba(6,8,13,0.7)"}
                stroke={stroke}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                opacity={up ? 0.72 : 0.9}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function Donut({
  slices,
  size = 128,
  thickness = 12,
  center,
  className,
}: {
  slices: Array<{ label: string; value: number; color: string }>;
  size?: number;
  thickness?: number;
  center?: React.ReactNode;
  className?: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thickness} />
        {slices.map((slice) => {
          const length = (slice.value / total) * circumference;
          const element = (
            <circle
              key={slice.label}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(0, length - 1.2)} ${circumference - length + 1.2}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += length;
          return element;
        })}
      </svg>
      {center && <div className="absolute inset-0 flex flex-col items-center justify-center">{center}</div>}
    </div>
  );
}

export function Gauge({
  value,
  color = "#7CF7C4",
  size = 132,
  label,
  sublabel,
}: {
  value: number;
  color?: string;
  size?: number;
  label?: string;
  sublabel?: string;
}) {
  const radius = 42;
  const circumference = Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg viewBox="0 0 100 56" className="w-full">
        <path
          d="M 8 50 A 42 42 0 0 1 92 50"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 8 50 A 42 42 0 0 1 92 50"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ filter: `drop-shadow(0 0 5px ${color}66)`, transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="-mt-5 text-center">
        <div className="num text-[20px] text-white">{label ?? Math.round(clamped)}</div>
        {sublabel && <div className="label mt-1">{sublabel}</div>}
      </div>
    </div>
  );
}

export function MiniBars({
  data,
  color = "#7CF7C4",
  height = 38,
  className,
}: {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}) {
  const max = Math.max(...data, 1);
  return (
    <div className={cn("flex items-end gap-[3px]", className)} style={{ height }}>
      {data.map((value, index) => (
        <div
          key={index}
          className="flex-1 rounded-sm transition-all duration-500"
          style={{
            height: `${Math.max(8, (value / max) * 100)}%`,
            background: color,
            opacity: 0.25 + (value / max) * 0.65,
          }}
        />
      ))}
    </div>
  );
}
