export type ViewId =
  | "overview"
  | "city"
  | "markets"
  | "banking"
  | "media"
  | "telecom"
  | "underworld"
  | "government"
  | "wire"
  | "admin";

export type Archetype = "tycoon" | "banker" | "hacker" | "mogul";

export interface Player {
  id: "player";
  name: string;
  handle: string;
  email: string;
  archetype: Archetype;
  cash: number;
  influence: number;
  reputation: number;
  heat: number;
  day: number;
  netWorthHistory: { day: number; value: number }[];
  holdings: Record<string, number>;
  stakes: Record<string, number>;
  stocks: Record<string, number>;
  properties: string[];
  loans: Loan[];
  perks: string[];
  lastAction: string;
}

export interface Corporation {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  owner: string;
  ownerId: string;
  sharePrice: number;
  sharesOutstanding: number;
  sentiment: number;
  revenue: number;
  description: string;
  color: string;
  history: number[];
}

export interface Token {
  id: string;
  name: string;
  symbol: string;
  creator: string;
  creatorId: string;
  credits: number;
  supply: number;
  liquidity: number;
  volume: number;
  price: number;
  change24h: number;
  holders: number;
  rugged: boolean;
  risk: number;
  color: string;
  history: number[];
}

export interface District {
  id: string;
  name: string;
  kind: string;
  price: number;
  basePrice: number;
  rentPerDay: number;
  crime: number;
  police: number;
  demand: number;
  ownerId: string | null;
  ownerName: string | null;
  color: string;
  description: string;
  history: number[];
}

export interface IspNode {
  id: string;
  name: string;
  kind: "edge" | "fiber" | "datacenter";
  ownerId: string;
  ownerName: string;
  capacity: number;
  load: number;
  uptime: number;
  latency: number;
  revenuePerDay: number;
  upkeep: number;
  builtDay: number;
  status: "online" | "degraded" | "offline";
}

export interface Show {
  id: string;
  title: string;
  quality: number;
  audience: number;
  revenue: number;
  day: number;
}

export interface MediaOutlet {
  id: string;
  name: string;
  kind: "tv" | "streaming" | "news";
  ownerId: string;
  ownerName: string;
  reach: number;
  credibility: number;
  hype: number;
  revenuePerDay: number;
  upkeep: number;
  shows: Show[];
}

export interface Bank {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  reserves: number;
  deposits: number;
  loans: number;
  rate: number;
  reputation: number;
  status: "stable" | "strained" | "insolvent";
  foundedDay: number;
}

export interface Loan {
  id: string;
  bankId: string;
  bankName: string;
  principal: number;
  outstanding: number;
  rate: number;
  payment: number;
  takenDay: number;
}

export interface Syndicate {
  id: string;
  name: string;
  boss: string;
  specialty: string;
  power: number;
  wealth: number;
  heat: number;
  color: string;
}

export interface Agent {
  id: string;
  name: string;
  title: string;
  role: "tycoon" | "banker" | "hacker" | "mogul" | "politician" | "boss";
  hue: number;
  wealth: number;
  aggression: number;
  sentiment: number;
  lastAction: string;
  status: string;
}

export interface WorldEvent {
  id: string;
  title: string;
  description: string;
  category: "market" | "policy" | "crime" | "media" | "infrastructure" | "ai";
  severity: "minor" | "major" | "critical" | "black-swan";
  pulse: number;
  sentiment: number;
  crime: number;
  regulation: number;
  day: number;
  expires: number;
  source: "grok" | "system";
}

export interface Post {
  id: string;
  author: string;
  handle: string;
  role: string;
  body: string;
  sentiment: number;
  likes: number;
  replies: number;
  day: number;
  tags: string[];
  verified: boolean;
  player?: boolean;
}

export interface Law {
  id: string;
  title: string;
  summary: string;
  status: "active" | "proposed" | "vetoed";
  effect: string;
  votes: number;
}

export interface Government {
  taxRate: number;
  corporateTax: number;
  regulation: number;
  treasury: number;
  approval: number;
  warrants: number;
  laws: Law[];
  nextElection: number;
}

export interface Toast {
  id: string;
  kind: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
}

export interface GameState {
  version: 1;
  started: boolean;
  player: Player;
  corporations: Corporation[];
  tokens: Token[];
  districts: District[];
  isps: IspNode[];
  media: MediaOutlet[];
  banks: Bank[];
  syndicates: Syndicate[];
  agents: Agent[];
  events: WorldEvent[];
  wire: Post[];
  government: Government;
  day: number;
  speed: 0 | 1 | 2 | 4;
  economy: number;
  adminUnlocked: boolean;
  lastTickAt: number;
  seed: number;
  toasts: Toast[];
}

export interface ActionResult {
  state: GameState;
  toast?: Omit<Toast, "id">;
}

export interface LeaderboardRow {
  id: string;
  name: string;
  title: string;
  wealth: number;
  isPlayer: boolean;
  hue: number;
}
