import type { EventEffect, GameState, WorldEvent } from './types'
import { summarizeState } from './simulation'
import { clamp } from './format'

export interface EngineEvent {
  title: string
  description: string
  category: WorldEvent['category']
  severity: WorldEvent['severity']
  effects: EventEffect[]
  headline: string
  hue: number
  source: 'local' | 'grok'
}

export interface EngineResponse {
  ok: boolean
  source: 'local' | 'grok'
  model?: string
  event?: EngineEvent
  error?: string
}

const categories: WorldEvent['category'][] = ['macro', 'tech', 'crime', 'politics', 'media', 'finance', 'infra']
const severities: WorldEvent['severity'][] = ['low', 'medium', 'high', 'critical']
const kinds: EventEffect['kind'][] = ['token', 'district', 'bank', 'isp', 'media', 'syndicate', 'government', 'market']

export async function checkEngine(): Promise<{ ok: boolean; source: 'local' | 'grok' }> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4500)
    const response = await fetch('/api/health', { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timer)
    if (!response.ok) return { ok: false, source: 'local' }
    const data = (await response.json()) as { ok?: boolean; grok?: boolean }
    return { ok: Boolean(data.ok), source: data.grok ? 'grok' : 'local' }
  } catch {
    return { ok: false, source: 'local' }
  }
}

export async function requestWorldEvent(state: GameState): Promise<EngineEvent | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12_000)
    const response = await fetch('/api/world-engine', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        snapshot: summarizeState(state),
        instruction:
          'Generate one new macroeconomic, criminal, political, media or infrastructure event for this living MMO. Return JSON only.',
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!response.ok) return null
    const data = (await response.json()) as EngineResponse
    if (!data.ok || !data.event) return null
    return sanitize(data.event, data.source)
  } catch {
    return null
  }
}

function sanitize(raw: EngineEvent, source: 'local' | 'grok'): EngineEvent {
  const category = categories.includes(raw.category) ? raw.category : 'macro'
  const severity = severities.includes(raw.severity) ? raw.severity : 'medium'
  const effects = Array.isArray(raw.effects)
    ? raw.effects
        .filter((effect) => effect && kinds.includes(effect.kind) && Number.isFinite(effect.delta))
        .slice(0, 5)
        .map((effect) => ({
          kind: effect.kind,
          targetId: typeof effect.targetId === 'string' ? effect.targetId : undefined,
          delta: clamp(effect.delta, -0.06, 0.06),
          note: typeof effect.note === 'string' ? effect.note.slice(0, 80) : undefined,
        }))
    : []
  return {
    title: String(raw.title ?? 'Untitled Event').slice(0, 90),
    description: String(raw.description ?? 'The world engine produced an unclassified event.').slice(0, 420),
    category,
    severity,
    effects,
    headline: String(raw.headline ?? raw.title ?? 'WORLD EVENT').slice(0, 120).toUpperCase(),
    hue: Number.isFinite(raw.hue) ? clamp(raw.hue, 0, 360) : 174,
    source,
  }
}
