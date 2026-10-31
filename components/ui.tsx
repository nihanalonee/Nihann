'use client'

import { useEffect, useId, useMemo, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { classNames, initials, money, num, pct, trendOf } from '@/lib/format'

export function Panel({
  children,
  className,
  title,
  eyebrow,
  action,
  dense = false,
  flat = false,
}: {
  children: ReactNode
  className?: string
  title?: ReactNode
  eyebrow?: ReactNode
  action?: ReactNode
  dense?: boolean
  flat?: boolean
}) {
  return (
    <section className={classNames('panel relative overflow-hidden', flat && 'panel-flat', dense ? 'p-4' : 'p-5', className)}>
      {(title || action || eyebrow) && (
        <header className="relative z-10 mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && <div className="label mb-1.5">{eyebrow}</div>}
            {title && <h2 className="truncate text-[15px] font-semibold tracking-tight text-fog-100">{title}</h2>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className="relative z-10">{children}</div>
    </section>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <div className="label mb-2">{eyebrow}</div>}
        <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-fog-100 sm:text-[26px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-fog-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({
  label,
  value,
  sub,
  change,
  icon,
  hue = 174,
  spark,
  className,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  change?: number
  icon?: ReactNode
  hue?: number
  spark?: number[]
  className?: string
}) {
  return (
    <div className={classNames('panel group relative overflow-hidden p-4', className)}>
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-80"
        style={{ background: `hsla(${hue}, 80%, 55%, 0.16)`, opacity: 0.55 }}
      />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="label">{label}</div>
        {icon && <div className="text-fog-500 transition-colors group-hover:text-fog-300">{icon}</div>}
      </div>
      <div className="stat-value relative z-10 mt-2 text-[25px] font-semibold text-fog-100">{value}</div>
      <div className="relative z-10 mt-1 flex items-center justify-between gap-2">
        <div className="min-w-0 text-[11px] text-fog-400">{sub}</div>
        {typeof change === 'number' && <Delta value={change} />}
      </div>
      {spark && spark.length > 2 && (
        <div className="relative z-10 mt-3 h-8">
          <Sparkline data={spark} hue={hue} height={32} />
        </div>
      )}
    </div>
  )
}

export function Delta({ value, suffix = '%', className }: { value: number; suffix?: string; className?: string }) {
  const positive = value >= 0
  return (
    <span
      className={classNames(
        'mono inline-flex items-center gap-0.5 text-[11px] font-semibold',
        positive ? 'text-mint-300' : 'text-rose-300',
        className,
      )}
    >
      <span className="text-[9px]">{positive ? '▲' : '▼'}</span>
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  )
}

export function Progress({
  value,
  hue = 174,
  className,
  height = 5,
  glow = false,
}: {
  value: number
  hue?: number
  className?: string
  height?: number
  glow?: boolean
}) {
  const width = Math.min(100, Math.max(0, value))
  return (
    <div className={classNames('relative w-full overflow-hidden bg-ink-800', className)} style={{ height }}>
      <div
        className="h-full transition-all duration-700 ease-out"
        style={{
          width: `${width}%`,
          background: `linear-gradient(90deg, hsla(${hue}, 78%, 42%, 0.75), hsl(${hue}, 82%, 62%))`,
          boxShadow: glow ? `0 0 12px hsla(${hue}, 80%, 55%, 0.55)` : undefined,
        }}
      />
    </div>
  )
}

export function Gauge({
  value,
  label,
  hue = 174,
  size = 128,
  sub,
}: {
  value: number
  label: string
  hue?: number
  size?: number
  sub?: string
}) {
  const clamped = Math.min(100, Math.max(0, value))
  const radius = 48
  const circumference = Math.PI * radius
  const offset = circumference * (1 - clamped / 100)
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size * 0.66 }}>
        <svg viewBox="0 0 120 70" className="h-full w-full overflow-visible">
          <path d="M 12 62 A 48 48 0 0 1 108 62" fill="none" stroke="rgba(74,103,128,0.24)" strokeWidth="8" strokeLinecap="round" />
          <path
            d="M 12 62 A 48 48 0 0 1 108 62"
            fill="none"
            stroke={`hsl(${hue}, 82%, 60%)`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 6px hsla(${hue}, 80%, 55%, 0.55))` }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <div className="stat-value text-[24px] font-semibold text-fog-100">{Math.round(clamped)}</div>
          {sub && <div className="micro">{sub}</div>}
        </div>
      </div>
      <div className="label mt-1.5 text-center">{label}</div>
    </div>
  )
}

function smoothPath(values: number[], width: number, height: number, pad = 1): string {
  if (values.length === 0) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values.map((value, index) => ({
    x: pad + (index / Math.max(1, values.length - 1)) * (width - pad * 2),
    y: pad + (1 - (value - min) / span) * (height - pad * 2),
  }))
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i]
    const next = points[i + 1]
    const midX = (current.x + next.x) / 2
    path += ` C ${midX.toFixed(2)} ${current.y.toFixed(2)}, ${midX.toFixed(2)} ${next.y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`
  }
  return path
}

export function Sparkline({
  data,
  hue = 174,
  height = 40,
  className,
  fill = true,
  strokeWidth = 1.6,
}: {
  data: number[]
  hue?: number
  height?: number
  className?: string
  fill?: boolean
  strokeWidth?: number
}) {
  const id = useId().replace(/:/g, '')
  const width = 100
  const path = smoothPath(data, width, height, 1)
  const area = `${path} L ${width - 1} ${height - 1} L 1 ${height - 1} Z`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={classNames('h-full w-full', className)} aria-hidden>
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${hue}, 82%, 58%)`} stopOpacity="0.32" />
          <stop offset="100%" stopColor={`hsl(${hue}, 82%, 58%)`} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#spark-${id})`} />}
      <path d={path} fill="none" stroke={`hsl(${hue}, 84%, 62%)`} strokeWidth={strokeWidth} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function AreaChart({
  data,
  hue = 174,
  height = 220,
  className,
  showGrid = true,
  showAxis = true,
  valueFormatter,
  markers,
}: {
  data: number[]
  hue?: number
  height?: number
  className?: string
  showGrid?: boolean
  showAxis?: boolean
  valueFormatter?: (value: number) => string
  markers?: Array<{ index: number; label: string; hue?: number }>
}) {
  const id = useId().replace(/:/g, '')
  const width = 600
  const padX = 8
  const padTop = 14
  const padBottom = showAxis ? 26 : 8
  const chartHeight = height - padTop - padBottom
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const points = data.map((value, index) => ({
    x: padX + (index / Math.max(1, data.length - 1)) * (width - padX * 2),
    y: padTop + (1 - (value - min) / span) * chartHeight,
    value,
  }))
  let path = ''
  if (points.length) {
    path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
    for (let i = 0; i < points.length - 1; i += 1) {
      const current = points[i]
      const next = points[i + 1]
      const midX = (current.x + next.x) / 2
      path += ` C ${midX.toFixed(2)} ${current.y.toFixed(2)}, ${midX.toFixed(2)} ${next.y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`
    }
  }
  const area = points.length ? `${path} L ${points[points.length - 1].x.toFixed(2)} ${height - padBottom} L ${points[0].x.toFixed(2)} ${height - padBottom} Z` : ''
  const last = points[points.length - 1]
  const first = points[0]
  const change = first && last && first.value ? ((last.value - first.value) / first.value) * 100 : 0
  const format = valueFormatter ?? ((value: number) => money(value, true))

  return (
    <div className={classNames('relative w-full', className)} style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={`area-${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={`hsl(${hue}, 82%, 58%)`} stopOpacity="0.28" />
            <stop offset="65%" stopColor={`hsl(${hue}, 82%, 58%)`} stopOpacity="0.06" />
            <stop offset="100%" stopColor={`hsl(${hue}, 82%, 58%)`} stopOpacity="0" />
          </linearGradient>
        </defs>
        {showGrid &&
          [0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={padX}
              x2={width - padX}
              y1={padTop + chartHeight * ratio}
              y2={padTop + chartHeight * ratio}
              stroke="rgba(74,103,128,0.14)"
              strokeDasharray="3 5"
            />
          ))}
        {area && <path d={area} fill={`url(#area-${id})`} />}
        {path && <path d={path} fill="none" stroke={`hsl(${hue}, 84%, 62%)`} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
        {markers?.map((marker) => {
          const point = points[Math.min(points.length - 1, Math.max(0, marker.index))]
          if (!point) return null
          return (
            <g key={`${marker.label}-${marker.index}`}>
              <line x1={point.x} x2={point.x} y1={padTop} y2={height - padBottom} stroke={`hsla(${marker.hue ?? hue}, 80%, 60%, 0.35)`} strokeDasharray="2 4" />
              <circle cx={point.x} cy={point.y} r="3.4" fill={`hsl(${marker.hue ?? hue}, 85%, 64%)`} />
            </g>
          )
        })}
        {last && <circle cx={last.x} cy={last.y} r="4" fill={`hsl(${hue}, 86%, 66%)`} stroke="#05070b" strokeWidth="2" />}
      </svg>
      {showAxis && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-1 text-[9px] text-fog-500">
          <span>{format(min)}</span>
          <span className="mono text-fog-400">{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
          <span>{format(max)}</span>
        </div>
      )}
    </div>
  )
}

export function CandleChart({ data, hue = 174, height = 260 }: { data: number[]; hue?: number; height?: number }) {
  const width = 600
  const padTop = 12
  const padBottom = 24
  const chartHeight = height - padTop - padBottom
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const count = data.length
  const step = (width - 16) / Math.max(1, count)
  const bodyWidth = Math.max(1.5, step * 0.52)
  const candles = data.map((close, index) => {
    const open = index === 0 ? close : data[index - 1]
    const noise = Math.abs(Math.sin(index * 12.9898 + close * 0.017)) * 0.004
    const high = Math.max(open, close) * (1 + noise)
    const low = Math.min(open, close) * (1 - noise)
    return { open, close, high, low }
  })
  const y = (value: number) => padTop + (1 - (value - min) / span) * chartHeight
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full">
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
        <line key={ratio} x1="8" x2={width - 8} y1={padTop + chartHeight * ratio} y2={padTop + chartHeight * ratio} stroke="rgba(74,103,128,0.13)" strokeDasharray="3 5" />
      ))}
      {candles.map((candle, index) => {
        const x = 8 + index * step + step / 2
        const positive = candle.close >= candle.open
        const color = positive ? `hsl(${hue}, 82%, 60%)` : 'hsl(350, 82%, 62%)'
        const bodyTop = y(Math.max(candle.open, candle.close))
        const bodyHeight = Math.max(1.2, Math.abs(y(candle.open) - y(candle.close)))
        return (
          <g key={index} opacity={0.92}>
            <line x1={x} x2={x} y1={y(candle.high)} y2={y(candle.low)} stroke={color} strokeWidth="0.8" opacity="0.55" />
            <rect x={x - bodyWidth / 2} y={bodyTop} width={bodyWidth} height={bodyHeight} fill={color} opacity={positive ? 0.8 : 0.72} />
          </g>
        )
      })}
      <text x="8" y={height - 8} fill="#5f7489" fontSize="9" fontFamily="monospace">OPEN</text>
      <text x={width - 8} y={height - 8} fill="#5f7489" fontSize="9" fontFamily="monospace" textAnchor="end">NOW</text>
    </svg>
  )
}

export function Donut({
  segments,
  size = 150,
  thickness = 14,
  centerLabel,
  centerValue,
}: {
  segments: Array<{ label: string; value: number; hue: number }>
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(74,103,128,0.18)" strokeWidth={thickness} />
        {segments.map((segment) => {
          const length = (segment.value / total) * circumference
          const dash = `${Math.max(0, length - 2)} ${circumference}`
          const element = (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={`hsl(${segment.hue}, 78%, 58%)`}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          )
          offset += length
          return element
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {centerValue && <div className="stat-value text-[18px] font-semibold text-fog-100">{centerValue}</div>}
        {centerLabel && <div className="micro mt-1 max-w-[80px]">{centerLabel}</div>}
      </div>
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  width = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  children: ReactNode
  width?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className={classNames('panel animate-rise relative z-10 w-full overflow-hidden border-ink-500/40 sm:rounded-sm', width)}>
        <div className="flex items-start justify-between gap-4 border-b border-ink-600/40 p-5">
          <div>
            {eyebrow && <div className="label mb-1.5">{eyebrow}</div>}
            <h3 className="text-[16px] font-semibold tracking-tight text-fog-100">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost h-8 w-8 p-0" aria-label="Close dialog">
            <X size={15} />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
  wrap = false,
}: {
  tabs: Array<{ id: string; label: string; count?: number }>
  active: string
  onChange: (id: string) => void
  className?: string
  wrap?: boolean
}) {
  return (
    <div
      className={classNames(
        'scrollbar-none flex gap-1 border-b border-ink-600/40 pb-px',
        wrap ? 'flex-wrap' : 'overflow-x-auto',
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={classNames(
            'relative shrink-0 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors',
            active === tab.id ? 'text-mint-300' : 'text-fog-500 hover:text-fog-200',
          )}
        >
          {tab.label}
          {typeof tab.count === 'number' && <span className="ml-1.5 text-[9px] text-fog-600">{tab.count}</span>}
          {active === tab.id && <span className="absolute inset-x-2 bottom-0 h-px bg-mint-400 shadow-[0_0_8px_rgba(63,227,192,0.8)]" />}
        </button>
      ))}
    </div>
  )
}

export function Avatar({ name, hue = 174, size = 34, verified = false }: { name: string; hue?: number; size?: number; verified?: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full border text-[11px] font-semibold"
        style={{
          borderColor: `hsla(${hue}, 70%, 60%, 0.4)`,
          background: `radial-gradient(circle at 30% 20%, hsla(${hue}, 80%, 60%, 0.35), hsla(${hue}, 50%, 20%, 0.4))`,
          color: `hsl(${hue}, 80%, 82%)`,
        }}
      >
        {initials(name)}
      </div>
      {verified && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-ink-950 bg-mint-400 text-[7px] font-bold text-ink-950">
          ✓
        </span>
      )}
    </div>
  )
}

export function Badge({ children, tone = 'info', pulse = false }: { children: ReactNode; tone?: 'good' | 'bad' | 'warn' | 'info' | 'violet'; pulse?: boolean }) {
  const toneClass =
    tone === 'good'
      ? 'chip-mint'
      : tone === 'bad'
        ? 'chip-rose'
        : tone === 'warn'
          ? 'chip-amber'
          : tone === 'violet'
            ? 'chip-violet'
            : ''
  return (
    <span className={classNames('chip', toneClass)}>
      {pulse && <span className={classNames('h-1.5 w-1.5 rounded-full animate-pulse-soft', tone === 'bad' ? 'bg-rose-400' : tone === 'warn' ? 'bg-amber-400' : 'bg-mint-400')} />}
      {children}
    </span>
  )
}

export function KV({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={classNames('flex items-center justify-between gap-3 border-b border-ink-600/25 py-2 last:border-0', className)}>
      <span className="text-[11px] text-fog-500">{label}</span>
      <span className="mono text-[11px] text-fog-200">{value}</span>
    </div>
  )
}

export function EmptyState({ title, description, icon }: { title: string; description: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-ink-600/50 bg-ink-900/30 px-6 py-10 text-center">
      {icon && <div className="mb-3 text-fog-600">{icon}</div>}
      <div className="text-[13px] font-medium text-fog-200">{title}</div>
      <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-fog-500">{description}</p>
    </div>
  )
}

export function MiniStat({ label, value, tone }: { label: string; value: ReactNode; tone?: 'good' | 'bad' | 'warn' }) {
  return (
    <div className="min-w-0">
      <div className="micro">{label}</div>
      <div className={classNames('stat-value mt-1 text-[13px] font-semibold', tone === 'good' ? 'text-mint-300' : tone === 'bad' ? 'text-rose-300' : tone === 'warn' ? 'text-amber-300' : 'text-fog-100')}>{value}</div>
    </div>
  )
}

export function ChangeLabel({ data, className }: { data: number[]; className?: string }) {
  const change = trendOf(data)
  return <Delta value={change} className={className} />
}

export function TickerValue({ value, change }: { value: string; change: number }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="mono text-[11px] text-fog-200">{value}</span>
      <span className={classNames('mono text-[10px]', change >= 0 ? 'text-mint-300' : 'text-rose-300')}>{pct(change)}</span>
    </span>
  )
}

export function MetricGrid({ items }: { items: Array<{ label: string; value: string; tone?: 'good' | 'bad' | 'warn' }> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <MiniStat key={item.label} label={item.label} value={item.value} tone={item.tone} />
      ))}
    </div>
  )
}

export function useMoney(value: number, compact = true) {
  return useMemo(() => money(value, compact), [value, compact])
}

export function NumberFlow({ value, digits = 0 }: { value: number; digits?: number }) {
  return <span className="num">{num(value, digits)}</span>
}
