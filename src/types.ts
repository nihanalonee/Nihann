export type AssetKind = "stock" | "crypto";

export interface Asset {
  id: string;
  name: string;
  ticker: string;
  kind: AssetKind;
  price: number;
  prevClose: number;
  history: number[];
  sector: string;
  volatility: number;
  sentiment: number;
  supply?: number;
  liquidity?: number;
  creator?: string;
  description: string;
  color: string;
}

export interface Holding {
  qty: number;
  avgCost: number;
}

export interface District {
  id: string;
  name: string;
  type: string;
  price: number;
  basePrice: number;
  crime: number;
  demand: number;
  police: number;
  owned: boolean;
  income: number;
  color: string;
  description: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface IspNode {
  id: string;
  name: string;
  districtId: string;
  capacity: number;
  load: number;
  health: number;
  status: "online" | "degraded" | "offline";
  latency: number;
  tier: number;
}

export interface IspState {
  name: string;
  nodes: IspNode[];
  subscribers: number;
  uptime: number;
  pricePerGb: number;
  reputation: number;
  autoRepair: boolean;
}

export interface BankState {
  founded: boolean;
  name: string;
  deposits: number;
  reserves: number;
  loans: number;
  reserveRatio: number;
  lendingRate: number;
  depositRate: number;
  bonds: number;
  status: "stable" | "strained" | "critical" | "collapsed";
  capital: number;
  runs: number;
  history: number[];
}

export interface Show {
  id: string;
  title: string;
  genre: string;
  rating: number;
  cost: number;
  revenue: number;
}

export interface MediaChannel {
  id: string;
  name: string;
  type: "TV" | "Streaming" | "Podcast";
  reach: number;
  credibility: number;
  revenue: number;
  shows: Show[];
  color: string;
}

export interface Campaign {
  id: string;
  channelId: string;
  target: string;
  tone: "hype" | "hit" | "spin";
  budget: number;
  reach: number;
  createdAt: number;
  status: "live" | "completed";
}

export interface MediaState {
  channels: MediaChannel[];
  campaigns: Campaign[];
  publicTrust: number;
}

export interface CrimeOperation {
  id: string;
  name: string;
  description: string;
  risk: number;
  minReward: number;
  maxReward: number;
  heat: number;
  cooldown: number;
  lastRun: number;
  category: "heist" | "cyber" | "launder" | "bribe" | "smuggle";
}

export interface UnderworldState {
  crew: number;
  heat: number;
  dirtyCash: number;
  laundering: number;
  protection: number;
  warrants: number;
  operations: CrimeOperation[];
}

export interface Rival {
  id: string;
  name: string;
  ceo: string;
  netWorth: number;
  focus: string;
  aggression: number;
  color: string;
  sentiment: number;
}

export interface CorporateState {
  founded: boolean;
  name: string;
  sector: string;
  valuation: number;
  employees: number;
  rnd: number;
  security: number;
  pr: number;
  revenue: number;
  history?: number[];
  rivals: Rival[];
}

export interface Bill {
  id: string;
  title: string;
  description: string;
  status: "proposed" | "voting" | "passed" | "rejected";
  votes: number;
  impact: string;
  category: string;
}

export interface GovernmentState {
  taxRate: number;
  corpTax: number;
  regulatoryPressure: number;
  treasury: number;
  approval: number;
  bills: Bill[];
  warrants: number;
  bailouts: number;
}

export interface RivalDirective {
  rival: string;
  action: "accumulate" | "dump" | "lobby" | "cyber" | "media" | "acquire";
  target?: string;
  rationale: string;
}

export interface WorldEvent {
  id: string;
  title: string;
  summary: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "macro" | "tech" | "crime" | "regulation" | "media" | "infrastructure";
  effects: string[];
  tick: number;
  day: number;
  source: "grok" | "local";
  shocks?: Record<string, number>;
  directive?: RivalDirective;
}

export interface NewsItem {
  id: string;
  text: string;
  tone: "positive" | "negative" | "neutral";
  time: string;
}

export interface WorldState {
  day: number;
  tick: number;
  phase: "Pre-Market" | "Open" | "After-Hours";
  sentiment: number;
  volatility: number;
  cyberThreat: number;
  index: number;
  indexHistory: number[];
  events: WorldEvent[];
  news: NewsItem[];
  nextEventIn: number;
  engineMode: "grok" | "local";
  paused: boolean;
}

export interface PlayerState {
  name: string;
  email: string;
  handle: string;
  avatar: string;
  cash: number;
  influence: number;
  reputation: number;
  credit: number;
  xp: number;
  level: number;
  prestige: number;
  isAdmin: boolean;
}

export interface Post {
  id: string;
  author: string;
  handle: string;
  role: string;
  content: string;
  time: string;
  likes: number;
  replies: number;
  reposts: number;
  sentiment: "bullish" | "bearish" | "neutral" | "chaotic";
  tags: string[];
  verified: boolean;
  color: string;
  liked?: boolean;
  isPlayer?: boolean;
}

export interface Toast {
  id: string;
  message: string;
  tone: "success" | "error" | "info" | "warning";
}

export interface LedgerEntry {
  id: string;
  label: string;
  amount: number;
  kind: "income" | "expense" | "trade" | "crime" | "system";
  time: string;
}

export interface GameStats {
  netWorthHistory: number[];
  totalTrades: number;
  lifetimeEarnings: number;
  crimesCommitted: number;
  campaignsRun: number;
  daysSurvived: number;
  peakNetWorth: number;
}

export interface GameState {
  version: number;
  player: PlayerState;
  assets: Asset[];
  holdings: Record<string, Holding>;
  districts: District[];
  isp: IspState;
  bank: BankState;
  media: MediaState;
  underworld: UnderworldState;
  corporate: CorporateState;
  government: GovernmentState;
  world: WorldState;
  posts: Post[];
  ledger: LedgerEntry[];
  toasts: Toast[];
  stats: GameStats;
  lastSaved: number;
}

export type PageId =
  | "overview"
  | "market"
  | "banking"
  | "infrastructure"
  | "media"
  | "underworld"
  | "corporate"
  | "wire"
  | "government"
  | "godmode";
