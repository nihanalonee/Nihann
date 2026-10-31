import type { EventEffect, GameState, WorldEvent } from './types'
import { pick, uid } from './format'
import { marketCap, netWorth } from './economy'

interface EventTemplate {
  title: string
  description: string
  category: WorldEvent['category']
  severity: WorldEvent['severity']
  hue: number
  headline: string
  effects: (state: GameState) => EventEffect[]
  weight: (state: GameState) => number
}

const templates: EventTemplate[] = [
  {
    title: 'Liquidity Crisis',
    description:
      'A mid-sized clearing house failed to meet margin at the open. Credit lines are freezing across the mesh and every bank is pretending it saw this coming.',
    category: 'finance',
    severity: 'high',
    hue: 350,
    headline: 'LIQUIDITY CRISIS: interbank lending freezes after clearing failure',
    effects: () => [
      { kind: 'market', delta: -0.012 },
      { kind: 'token', targetId: 'omni', delta: -0.009 },
      { kind: 'token', targetId: 'luna', delta: -0.018 },
      { kind: 'bank', targetId: 'blackvault', delta: -0.02 },
      { kind: 'bank', targetId: 'meridian', delta: -0.006 },
    ],
    weight: (state) => (state.marketIndex < state.indexHistory[Math.max(0, state.indexHistory.length - 20)] ? 3 : 1),
  },
  {
    title: 'Federal Regulatory Crackdown',
    description:
      'The Financial Crimes Unit executed coordinated subpoenas against six token issuers. Compliance teams are burning documents that were already illegal.',
    category: 'politics',
    severity: 'high',
    hue: 218,
    headline: 'CRACKDOWN: FCU subpoenas six issuers in coordinated dawn raid',
    effects: () => [
      { kind: 'market', delta: -0.008 },
      { kind: 'token', targetId: 'ghost', delta: -0.03 },
      { kind: 'token', targetId: 'neon', delta: -0.022 },
      { kind: 'government', delta: 0.018 },
    ],
    weight: (state) => (state.player.heat > 45 || state.government.regulation > 65 ? 3 : 1),
  },
  {
    title: 'Sovereign AI Allocation',
    description:
      'A Gulf sovereign fund committed $40B to compute infrastructure. Helios is sold out, Lumen Fiber is re-routing capacity, and every founder has a new deck.',
    category: 'tech',
    severity: 'high',
    hue: 42,
    headline: 'SOVEREIGN AI ALLOCATION: $40B flows into compute and fiber',
    effects: () => [
      { kind: 'token', targetId: 'helios', delta: 0.03 },
      { kind: 'district', targetId: 'helix', delta: 0.012 },
      { kind: 'district', targetId: 'databasin', delta: 0.008 },
      { kind: 'isp', targetId: 'lumen', delta: 0.01 },
      { kind: 'market', delta: 0.01 },
    ],
    weight: () => 1.4,
  },
  {
    title: 'Global Supply Chain Collapse',
    description:
      'Two chokepoints closed within six hours. Container rates tripled, Ironworks is idle, and the Narrows is the only market still moving goods.',
    category: 'macro',
    severity: 'critical',
    hue: 24,
    headline: 'SUPPLY CHAIN COLLAPSE: two chokepoints closed, container rates triple',
    effects: () => [
      { kind: 'market', delta: -0.014 },
      { kind: 'district', targetId: 'ironworks', delta: -0.02 },
      { kind: 'district', targetId: 'dockside', delta: -0.018 },
      { kind: 'district', targetId: 'narrows', delta: 0.012 },
      { kind: 'token', targetId: 'void', delta: 0.02 },
    ],
    weight: () => 1,
  },
  {
    title: 'Backbone Bandwidth War',
    description:
      'RexNet throttled transit for three independent ISPs. AetherLink picked up the overflow and Lumen is accusing everyone of sabotage.',
    category: 'infra',
    severity: 'medium',
    hue: 196,
    headline: 'BANDWIDTH WAR: RexNet throttles transit, AetherLink absorbs overflow',
    effects: () => [
      { kind: 'isp', targetId: 'aether', delta: 0.016 },
      { kind: 'isp', targetId: 'rexnet', delta: -0.012 },
      { kind: 'isp', targetId: 'ghostline', delta: -0.008 },
      { kind: 'market', delta: 0.002 },
    ],
    weight: (state) => (state.isps.some((isp) => isp.load > 0.75) ? 2.5 : 1),
  },
  {
    title: 'Media Blackout',
    description:
      'A coordinated deplatforming campaign knocked three networks offline. Vox Meridian is calling it censorship. The Ledger is calling it a product decision.',
    category: 'media',
    severity: 'medium',
    hue: 302,
    headline: 'MEDIA BLACKOUT: three networks deplatformed in coordinated sweep',
    effects: () => [
      { kind: 'media', targetId: 'vox', delta: -0.015 },
      { kind: 'media', targetId: 'blacklight', delta: -0.025 },
      { kind: 'media', targetId: 'signal9', delta: 0.01 },
      { kind: 'government', delta: 0.008 },
    ],
    weight: () => 1,
  },
  {
    title: 'Cartel Offensive',
    description:
      'Black Meridian moved on the Dockside corridor at 3 AM. Two rivals are missing, one warehouse is ash, and VOID is trading at a premium.',
    category: 'crime',
    severity: 'high',
    hue: 338,
    headline: 'CARTEL OFFENSIVE: Black Meridian seizes Dockside corridor',
    effects: () => [
      { kind: 'district', targetId: 'dockside', delta: -0.01 },
      { kind: 'district', targetId: 'narrows', delta: 0.008 },
      { kind: 'token', targetId: 'void', delta: 0.026 },
      { kind: 'token', targetId: 'ghost', delta: 0.018 },
      { kind: 'government', delta: 0.006 },
    ],
    weight: (state) => (state.syndicates.some((syndicate) => syndicate.heat > 65) ? 2.2 : 1),
  },
  {
    title: 'Flash Crash',
    description:
      'A mispriced oracle liquidated $180M in twelve seconds. The exchange is “investigating.” The liquidated are not waiting for the report.',
    category: 'finance',
    severity: 'critical',
    hue: 350,
    headline: 'FLASH CRASH: oracle error liquidates $180M in twelve seconds',
    effects: () => [
      { kind: 'market', delta: -0.02 },
      { kind: 'token', targetId: 'neon', delta: -0.05 },
      { kind: 'token', targetId: 'ghost', delta: -0.035 },
      { kind: 'token', targetId: 'omni', delta: -0.012 },
      { kind: 'bank', targetId: 'blackvault', delta: -0.018 },
    ],
    weight: (state) => (state.volatility > 55 ? 2.4 : 0.7),
  },
  {
    title: 'Meme Mania',
    description:
      'A ten-second clip of Kaito Mercer eating a gold leaf donut sent retail into a frenzy. NEON is up 30% on no fundamental change whatsoever.',
    category: 'tech',
    severity: 'medium',
    hue: 286,
    headline: 'MEME MANIA: NEON rips 30% after Mercer’s gold donut video',
    effects: () => [
      { kind: 'token', targetId: 'neon', delta: 0.045 },
      { kind: 'token', targetId: 'omni', delta: 0.004 },
      { kind: 'media', targetId: 'neonpulse', delta: 0.012 },
      { kind: 'market', delta: 0.006 },
    ],
    weight: (state) => (state.tokens.find((token) => token.id === 'neon')?.momentum ?? 0) > 0 ? 2 : 0.8,
  },
  {
    title: 'Undersea Cable Cut',
    description:
      'A fiber trunk in the Atlantic went dark. Latency spiked 40ms across the mesh, mining yield dropped, and someone is already selling the repair contract.',
    category: 'infra',
    severity: 'high',
    hue: 196,
    headline: 'CABLE CUT: Atlantic trunk dark, mesh latency spikes 40ms',
    effects: () => [
      { kind: 'isp', targetId: 'aether', delta: -0.012 },
      { kind: 'isp', targetId: 'rexnet', delta: -0.015 },
      { kind: 'isp', targetId: 'lumen', delta: -0.008 },
      { kind: 'token', targetId: 'helios', delta: -0.014 },
      { kind: 'market', delta: -0.005 },
    ],
    weight: () => 0.8,
  },
  {
    title: 'Election Shock',
    description:
      'A reformist bloc took the council by two seats. The new majority is promising transparency, which is the one thing every institution in this city cannot survive.',
    category: 'politics',
    severity: 'medium',
    hue: 218,
    headline: 'ELECTION SHOCK: reform bloc takes council, promises transparency',
    effects: () => [
      { kind: 'government', delta: 0.02 },
      { kind: 'market', delta: -0.004 },
      { kind: 'bank', targetId: 'blackvault', delta: -0.012 },
      { kind: 'district', targetId: 'oldtown', delta: 0.006 },
    ],
    weight: () => 0.9,
  },
  {
    title: 'Insider Data Leak',
    description:
      'Two terabytes of boardroom audio hit the wire at once. Three executives resigned by lunch. The market is pricing the silence that follows.',
    category: 'media',
    severity: 'high',
    hue: 12,
    headline: 'DATA LEAK: 2TB of boardroom audio hits the wire, three executives resign',
    effects: () => [
      { kind: 'media', targetId: 'vox', delta: -0.018 },
      { kind: 'media', targetId: 'ledger', delta: 0.014 },
      { kind: 'token', targetId: 'neon', delta: -0.016 },
      { kind: 'market', delta: -0.003 },
    ],
    weight: () => 1.1,
  },
]

export function generateLocalEvent(state: GameState): WorldEvent {
  const total = templates.reduce((sum, template) => sum + template.weight(state), 0)
  let roll = Math.random() * total
  let chosen = templates[0]
  for (const template of templates) {
    roll -= template.weight(state)
    if (roll <= 0) {
      chosen = template
      break
    }
  }
  const severityDays = chosen.severity === 'critical' ? 4 : chosen.severity === 'high' ? 6 : 8
  return {
    id: uid('evt'),
    title: chosen.title,
    description: chosen.description,
    category: chosen.category,
    severity: chosen.severity,
    startedDay: state.day,
    endsDay: state.day + severityDays,
    effects: chosen.effects(state),
    source: 'local',
    hue: chosen.hue,
    headline: chosen.headline,
  }
}

export const rumorLines = [
  'Three funds just moved stablecoins into cold storage. Nobody is saying why.',
  'A Dockside warehouse changed ownership twice in one hour. Both buyers used the same lawyer.',
  'RexNet is quietly buying dark fiber under a shell company in Ironworks.',
  'The FCU requested server logs from AetherLink. The request was withdrawn four minutes later.',
  'Black Vault is offering 9.1% on a 30-day note. That is not a yield. That is a warning.',
  'A Signal 9 producer was seen leaving Vox Meridian with a hard drive and no security escort.',
  'The Narrows police patrol was rerouted for the third night in a row. The same three blocks are now unpoliced.',
  'Lumen Fiber filed a patent for latency-based pricing. The patent office is reviewing it as a weapon.',
  'Someone minted a token called OMNILIFE and rugged it in ninety seconds. The logo was a screenshot of this terminal.',
  'Kaito Mercer’s wallet moved 40M NEON to an address that has never sold. That is either conviction or a trap.',
  'Mayor Cruz cancelled her public schedule. City Hall says it is “routine.” City Hall has never had a routine day.',
  'A private jet filed a flight plan from OmniLife to a jurisdiction with no extradition treaty. Tail number is leased by Meridian Trust.',
]

export function randomRumor(): string {
  return pick(rumorLines)
}

export function eventPostContent(event: WorldEvent): string {
  return `${event.headline}. ${event.description.split('.')[0]}.`
}
