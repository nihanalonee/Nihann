export type Tone = 'good' | 'bad' | 'warn' | 'info'

export type AssetKind =
  | 'token'
  | 'district'
  | 'bank'
  | 'isp'
  | 'media'
  | 'syndicate'
  | 'government'
  | 'market'

export interface EventEffect {
  kind: AssetKind
  targetId?: string
  delta: number
  note?: string
}

export interface WorldEvent {
  id: string
  title: string
  description: string
  category: 'macro' | 'tech' | 'crime' | 'politics' | 'media' | 'finance' | 'infra'
  severity: 'low' | 'medium' | 'high' | 'critical'
  startedDay: number
  endsDay: number
  effects: EventEffect[]
  source: 'local' | 'grok' | 'player' | 'npc'
  hue: number
  headline: string
}

export interface Token {
  id: string
  symbol: string
  name: string
  price: number
  fairValue: number
  liquidity: number
  supply: number
  creator: string
  creatorId: string
  creatorType: 'player' | 'npc' | 'protocol' | 'syndicate'
  volatility: number
  momentum: number
  history: number[]
  volume24h: number
  holders: number
  staked: number
  apr: number
  rugged: boolean
  hue: number
  description: string
}

export interface Holding {
  tokenId: string
  units: number
  avgCost: number
  staked: number
  pending: number
}

export interface Player {
  name: string
  handle: string
  email: string
  avatarHue: number
  cash: number
  dirtyCash: number
  influence: number
  reputation: number
  heat: number
  netWorthHistory: number[]
  holdings: Holding[]
  deposits: Record<string, number>
  debts: Record<string, number>
  legalFund: number
  xp: number
  level: number
  godMode: boolean
  actions: number
}

export interface District {
  id: string
  name: string
  archetype: 'Financial' | 'Tech' | 'Industrial' | 'Slums' | 'Luxury' | 'Port' | 'Civic' | 'Entertainment'
  value: number
  crime: number
  police: number
  demand: number
  description: string
  hue: number
  x: number
  y: number
  w: number
  h: number
  owned: number
  yield: number
}

export interface Corporation {
  id: string
  name: string
  ticker: string
  sector: string
  ownerId: string
  ownerName: string
  sharePrice: number
  fairValue: number
  sharesOutstanding: number
  playerShares: number
  revenue: number
  growth: number
  volatility: number
  history: number[]
  hue: number
  description: string
  raided: boolean
}

export interface Bank {
  id: string
  name: string
  ownerId: string
  ownerName: string
  reserves: number
  deposits: number
  loans: number
  rate: number
  status: 'stable' | 'watch' | 'critical' | 'collapsed'
  hue: number
  history: number[]
  playerOwned: boolean
}

export interface ISP {
  id: string
  name: string
  ownerId: string
  ownerName: string
  capacity: number
  load: number
  latency: number
  uptime: number
  nodes: number
  dataCenters: number
  pricePerTbps: number
  revenue: number
  hue: number
  security: number
  playerOwned: boolean
}

export interface MediaStation {
  id: string
  name: string
  ownerId: string
  ownerName: string
  reach: number
  credibility: number
  sentiment: number
  revenue: number
  shows: number
  type: 'TV' | 'Streaming' | 'News' | 'Underground'
  hue: number
  headlines: string[]
  playerOwned: boolean
}

export interface Syndicate {
  id: string
  name: string
  leader: string
  heat: number
  influence: number
  operations: number
  cash: number
  specialty: string
  hue: number
  playerOwned: boolean
}

export interface Official {
  id: string
  name: string
  role: string
  loyalty: number
  bribePrice: number
  bribed: boolean
  influence: number
}

export interface Warrant {
  id: string
  targetId: string
  targetName: string
  reason: string
  severity: 'low' | 'medium' | 'high'
  issuedDay: number
  status: 'active' | 'served' | 'dismissed'
}

export interface Regulation {
  id: string
  title: string
  description: string
  passedDay: number
  active: boolean
}

export interface Government {
  taxRate: number
  regulation: number
  approval: number
  budget: number
  stimulus: number
  officials: Official[]
  warrants: Warrant[]
  regulations: Regulation[]
}

export interface FeedPost {
  id: string
  author: string
  handle: string
  avatarHue: number
  content: string
  sentiment: number
  likes: number
  replies: number
  day: number
  hour: number
  tags: string[]
  verified: boolean
  source: 'player' | 'npc' | 'system' | 'grok'
  kind: 'market' | 'scandal' | 'news' | 'social' | 'crime' | 'media'
}

export interface NPC {
  id: string
  name: string
  handle: string
  archetype: string
  wealth: number
  aggression: number
  strategy: string
  lastAction: string
  avatarHue: number
  mood: number
}

export interface Notification {
  id: string
  title: string
  message: string
  tone: Tone
  day: number
  hour: number
}

export interface GameState {
  version: number
  tick: number
  day: number
  hour: number
  player: Player
  districts: District[]
  tokens: Token[]
  banks: Bank[]
  corporations: Corporation[]
  isps: ISP[]
  media: MediaStation[]
  syndicates: Syndicate[]
  government: Government
  feed: FeedPost[]
  events: WorldEvent[]
  npcs: NPC[]
  marketIndex: number
  indexHistory: number[]
  gasPrice: number
  congestion: number
  volatility: number
  engineStatus: 'local' | 'grok' | 'connecting'
  lastEngineSync: number
  notifications: Notification[]
  log: string[]
  createdAt: number
}

export interface Toast {
  id: string
  title: string
  message: string
  tone: Tone
}

export interface ActionResult {
  state: GameState
  toast?: { title: string; message: string; tone: Tone }
}
