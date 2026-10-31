export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function money(value: number, compact = false): string {
  if (!Number.isFinite(value)) return '$0'
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (compact) {
    if (abs >= 1_000_000_000_000) return `${sign}$${(abs / 1_000_000_000_000).toFixed(2)}T`
    if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
    if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`
    return `${sign}$${abs.toFixed(0)}`
  }
  return `${sign}$${abs.toLocaleString('en-US', {
    maximumFractionDigits: abs >= 100 ? 0 : 2,
    minimumFractionDigits: abs >= 100 ? 0 : 2,
  })}`
}

export function tokenPrice(value: number): string {
  if (value >= 1000) return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  if (value >= 1) return `$${value.toFixed(2)}`
  if (value >= 0.01) return `$${value.toFixed(4)}`
  return `$${value.toFixed(6)}`
}

export function num(value: number, digits = 0): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

export function pct(value: number, digits = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`
}

export function signed(value: number, digits = 0): string {
  return `${value >= 0 ? '+' : ''}${num(value, digits)}`
}

export function short(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`
  return `${sign}${abs.toFixed(0)}`
}

export function clock(day: number, hour: number): string {
  const h = ((hour % 24) + 24) % 24
  const suffix = h < 12 ? 'AM' : 'PM'
  const display = h % 12 === 0 ? 12 : h % 12
  return `DAY ${String(day).padStart(3, '0')} · ${String(display).padStart(2, '0')}:00 ${suffix}`
}

export function ago(day: number, hour: number, nowDay: number, nowHour: number): string {
  const delta = (nowDay - day) * 24 + (nowHour - hour)
  if (delta <= 0) return 'now'
  if (delta < 24) return `${delta}h ago`
  return `${Math.floor(delta / 24)}d ago`
}

export function trendOf(history: number[], lookback = 12): number {
  if (history.length < 2) return 0
  const end = history[history.length - 1]
  const start = history[Math.max(0, history.length - 1 - lookback)]
  if (!start) return 0
  return ((end - start) / start) * 100
}

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

export function clampText(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

export function normalRandom(): number {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

export function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function toneClass(tone: 'good' | 'bad' | 'warn' | 'info'): string {
  if (tone === 'good') return 'text-emerald-300'
  if (tone === 'bad') return 'text-rose-300'
  if (tone === 'warn') return 'text-amber-300'
  return 'text-cyan-300'
}

export function severityHue(severity: 'low' | 'medium' | 'high' | 'critical'): number {
  if (severity === 'critical') return 350
  if (severity === 'high') return 18
  if (severity === 'medium') return 42
  return 172
}
