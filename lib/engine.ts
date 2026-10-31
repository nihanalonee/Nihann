import { ARCHETYPES, computeNetWorth } from "./seed";
import type {
  ActionResult,
  Agent,
  Bank,
  GameState,
  IspNode,
  LeaderboardRow,
  MediaOutlet,
  Post,
  Toast,
  Token,
  WorldEvent,
} from "./types";

const TAX = 0.003;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const chance = (p: number) => Math.random() < p;
const round = (n: number, digits = 2) => {
  const m = 10 ** digits;
  return Math.round(n * m) / m;
};
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 9999)}`;
const clone = <T,>(value: T): T => structuredClone(value);

function toast(kind: Toast["kind"], title: string, message: string): Omit<Toast, "id"> {
  return { kind, title, message };
}

function pushHistory<T extends { history: number[] }>(item: T, value: number, size = 28) {
  item.history.push(round(value, 4));
  if (item.history.length > size) item.history.shift();
}

function priceOf(token: Token): number {
  return token.credits / Math.max(1, token.supply);
}

function setTokenPrice(token: Token, price: number) {
  const next = Math.max(0.0000001, price);
  token.supply = token.credits / next;
  token.price = next;
  pushHistory(token, next);
}

function buyQuote(token: Token, credits: number) {
  const inWithFee = credits * (1 - TAX);
  const k = token.credits * token.supply;
  const newCredits = token.credits + inWithFee;
  const newSupply = k / newCredits;
  return { tokens: Math.max(0, token.supply - newSupply), avg: credits / Math.max(1e-9, token.supply - newSupply) };
}

function sellQuote(token: Token, amount: number) {
  const k = token.credits * token.supply;
  const newSupply = token.supply + amount;
  const newCredits = k / newSupply;
  const gross = Math.max(0, token.credits - newCredits);
  return { credits: gross * (1 - TAX), avg: gross / Math.max(1e-9, amount) };
}

function eventEffects(state: GameState) {
  return state.events
    .filter((e) => e.expires >= state.day)
    .reduce(
      (acc, e) => {
        acc.pulse += e.pulse;
        acc.sentiment += e.sentiment;
        acc.crime += e.crime;
        acc.regulation += e.regulation;
        return acc;
      },
      { pulse: 0, sentiment: 0, crime: 0, regulation: 0 },
    );
}

function addWirePost(state: GameState, agent: Agent, body: string) {
  const post: Post = {
    id: uid("wire"),
    author: agent.name,
    handle: `@${agent.name.toLowerCase().replace(/[^a-z]+/g, "")}`,
    role: agent.title,
    body,
    sentiment: (agent.sentiment - 50) / 65,
    likes: Math.floor(rand(180, 9_500)),
    replies: Math.floor(rand(20, 1_100)),
    day: state.day,
    tags: [agent.role, "syndicate"],
    verified: agent.wealth > 500_000_000,
  };
  state.wire.unshift(post);
  if (state.wire.length > 60) state.wire.pop();
}

// ── Player actions ──────────────────────────────────────────────────────

export function tradeToken(state: GameState, tokenId: string, side: "buy" | "sell", amount: number): ActionResult {
  const s = clone(state);
  const token = s.tokens.find((t) => t.id === tokenId);
  if (!token) return { state, toast: toast("error", "Asset not found", "That market has already been delisted.") };
  if (token.rugged) return { state, toast: toast("error", "Dead market", `${token.symbol} has been rugged. There is no exit liquidity.`) };
  if (amount <= 0 || !Number.isFinite(amount)) return { state, toast: toast("error", "Invalid order", "Enter a positive amount.") };

  if (side === "buy") {
    if (amount > s.player.cash) return { state, toast: toast("error", "Insufficient credits", "Your cash cannot cover this order.") };
    if (amount < 100) return { state, toast: toast("error", "Order too small", "Minimum order is ₡100.") };
    const quote = buyQuote(token, amount);
    if (quote.tokens <= 0) return { state, toast: toast("error", "No liquidity", "The pool cannot fill this order.") };
    s.player.cash -= amount;
    s.player.holdings[token.id] = (s.player.holdings[token.id] ?? 0) + quote.tokens;
    const oldPrice = token.price;
    token.credits += amount * (1 - TAX);
    token.supply -= quote.tokens;
    setTokenPrice(token, priceOf(token));
    token.volume += amount;
    token.change24h = ((token.price - oldPrice) / oldPrice) * 100;
    token.holders += chance(0.35) ? 1 : 0;
    s.government.treasury += amount * TAX;
    s.player.lastAction = `Bought ${quote.tokens.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token.symbol} for ₡${amount.toLocaleString()}.`;
    s.player.influence = clamp(s.player.influence + 0.05, 0, 100);
    return {
      state: s,
      toast: toast(
        "success",
        `Filled: +${quote.tokens.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token.symbol}`,
        `Avg ${quote.avg.toFixed(4)} · impact ${(token.change24h).toFixed(2)}%`,
      ),
    };
  }

  const held = s.player.holdings[token.id] ?? 0;
  if (amount > held) return { state, toast: toast("error", "Insufficient tokens", `You only hold ${held.toFixed(4)} ${token.symbol}.`) };
  const quote = sellQuote(token, amount);
  if (quote.credits <= 0) return { state, toast: toast("error", "No bid", "The pool has no credits to pay out.") };
  s.player.holdings[token.id] = held - amount;
  s.player.cash += quote.credits;
  const oldPrice = token.price;
  token.credits -= quote.credits / (1 - TAX);
  token.supply += amount;
  setTokenPrice(token, priceOf(token));
  token.volume += quote.credits;
  token.change24h = ((token.price - oldPrice) / oldPrice) * 100;
  s.government.treasury += quote.credits * TAX;
  s.player.lastAction = `Sold ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token.symbol} for ₡${quote.credits.toLocaleString()}.`;
  return {
    state: s,
    toast: toast(
      "success",
      `Filled: ₡${Math.round(quote.credits).toLocaleString()}`,
      `${amount.toFixed(4)} ${token.symbol} sold · avg ${quote.avg.toFixed(4)}`,
    ),
  };
}

export function stakeToken(state: GameState, tokenId: string, amount: number): ActionResult {
  const s = clone(state);
  const token = s.tokens.find((t) => t.id === tokenId);
  if (!token) return { state, toast: toast("error", "Asset not found", "Token unavailable.") };
  const held = s.player.holdings[tokenId] ?? 0;
  if (amount <= 0 || amount > held) return { state, toast: toast("error", "Invalid stake", "You do not hold that many tokens.") };
  s.player.holdings[tokenId] = held - amount;
  s.player.stakes[tokenId] = (s.player.stakes[tokenId] ?? 0) + amount;
  s.player.lastAction = `Staked ${amount.toFixed(2)} ${token.symbol} in the liquidity program.`;
  return { state: s, toast: toast("success", "Stake active", `Earning ~29% APR on ${amount.toFixed(2)} ${token.symbol}.`) };
}

export function unstakeToken(state: GameState, tokenId: string, amount: number): ActionResult {
  const s = clone(state);
  const token = s.tokens.find((t) => t.id === tokenId);
  if (!token) return { state, toast: toast("error", "Asset not found", "Token unavailable.") };
  const staked = s.player.stakes[tokenId] ?? 0;
  if (amount <= 0 || amount > staked) return { state, toast: toast("error", "Invalid unstake", "Not enough staked tokens.") };
  s.player.stakes[tokenId] = staked - amount;
  s.player.holdings[tokenId] = (s.player.holdings[tokenId] ?? 0) + amount;
  s.player.lastAction = `Unstaked ${amount.toFixed(2)} ${token.symbol}.`;
  return { state: s, toast: toast("success", "Stake released", `${amount.toFixed(2)} ${token.symbol} returned to your wallet.`) };
}

export function mintToken(state: GameState, name: string, symbol: string, liquidity: number): ActionResult {
  const s = clone(state);
  const cleanName = name.trim().slice(0, 28);
  const cleanSymbol = symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (cleanName.length < 2 || cleanSymbol.length < 2) return { state, toast: toast("error", "Invalid token", "Name and symbol are required.") };
  if (s.tokens.some((t) => t.symbol === cleanSymbol)) return { state, toast: toast("error", "Symbol taken", `${cleanSymbol} already trades on the DEX.`) };
  if (liquidity < 100_000 || liquidity > s.player.cash - 50_000) {
    return { state, toast: toast("error", "Liquidity required", "Seed at least ₡100,000 while keeping ₡50,000 for the mint fee.") };
  }
  s.player.cash -= liquidity + 50_000;
  const supply = liquidity;
  const token: Token = {
    id: uid("token"),
    name: cleanName,
    symbol: cleanSymbol,
    creator: s.player.name,
    creatorId: "player",
    credits: liquidity,
    supply,
    liquidity,
    volume: 0,
    price: 1,
    change24h: 0,
    holders: 1,
    rugged: false,
    risk: 18,
    color: "#c8ff4d",
    history: [1, 1],
  };
  s.tokens.unshift(token);
  const creatorAllocation = supply * 0.08;
  token.supply -= creatorAllocation;
  setTokenPrice(token, priceOf(token));
  s.player.holdings[token.id] = creatorAllocation;
  s.government.treasury += 50_000;
  s.player.lastAction = `Minted ${cleanSymbol} with ₡${liquidity.toLocaleString()} of pooled liquidity.`;
  return {
    state: s,
    toast: toast("success", `${cleanSymbol} is live`, `Minted with ₡${liquidity.toLocaleString()} liquidity. You were allocated 8% of supply.`),
  };
}

export function tradeStock(state: GameState, corpId: string, side: "buy" | "sell", credits: number): ActionResult {
  const s = clone(state);
  const corp = s.corporations.find((c) => c.id === corpId);
  if (!corp) return { state, toast: toast("error", "Equity not found", "The listing has been suspended.") };
  if (credits <= 0) return { state, toast: toast("error", "Invalid order", "Enter a positive order size.") };
  const shares = s.player.stocks[corp.id] ?? 0;
  if (side === "buy") {
    if (credits > s.player.cash) return { state, toast: toast("error", "Insufficient credits", "Your cash cannot cover this order.") };
    const filled = credits / (corp.sharePrice * 1.004);
    s.player.cash -= credits;
    s.player.stocks[corp.id] = shares + filled;
    corp.sharePrice *= 1 + Math.min(0.012, credits / 90_000_000);
    pushHistory(corp, corp.sharePrice);
    s.player.lastAction = `Bought ${filled.toFixed(2)} shares of ${corp.ticker}.`;
    return { state: s, toast: toast("success", `Bought ${corp.ticker}`, `${filled.toFixed(2)} shares at ₡${corp.sharePrice.toFixed(2)}.`) };
  }
  if (credits > shares * corp.sharePrice) return { state, toast: toast("error", "Insufficient shares", "You cannot sell more than you own.") };
  const sold = credits / corp.sharePrice;
  s.player.cash += credits * 0.996;
  s.player.stocks[corp.id] = shares - sold;
  corp.sharePrice *= 1 - Math.min(0.012, credits / 90_000_000);
  pushHistory(corp, corp.sharePrice);
  s.player.lastAction = `Sold ${sold.toFixed(2)} shares of ${corp.ticker} for ₡${Math.round(credits).toLocaleString()}.`;
  return { state: s, toast: toast("success", `Sold ${corp.ticker}`, `₡${Math.round(credits * 0.996).toLocaleString()} settled after fees.`) };
}

export function buyProperty(state: GameState, districtId: string): ActionResult {
  const s = clone(state);
  const d = s.districts.find((x) => x.id === districtId);
  if (!d) return { state, toast: toast("error", "District not found", "That parcel no longer exists.") };
  if (d.ownerId === "player") return { state, toast: toast("error", "Already yours", "You already hold title.") };
  if (d.ownerId === "gov") return { state, toast: toast("error", "Title restricted", "Municipal land is not for sale. Lobby for a rezoning instead.") };
  const discount = s.player.archetype === "tycoon" ? 0.88 : 1;
  const premium = d.ownerId ? 1.12 : 1;
  const cost = d.price * discount * premium;
  if (cost > s.player.cash) return { state, toast: toast("error", "Financing failed", `You need ₡${Math.round(cost - s.player.cash).toLocaleString()} more.`) };
  s.player.cash -= cost;
  d.ownerId = "player";
  d.ownerName = s.player.name;
  s.player.properties.push(d.id);
  s.player.influence = clamp(s.player.influence + 2, 0, 100);
  s.player.lastAction = `Acquired ${d.name} for ₡${Math.round(cost).toLocaleString()}.`;
  s.wire.unshift({
    id: uid("wire"),
    author: "The Wire",
    handle: "@citywire",
    role: "Market Desk",
    body: `${s.player.name} has acquired ${d.name}. Neighbors describe the move as "inevitable."`,
    sentiment: 0.5,
    likes: Math.floor(rand(200, 2_000)),
    replies: Math.floor(rand(10, 240)),
    day: s.day,
    tags: ["realestate", d.kind.toLowerCase()],
    verified: true,
  });
  return { state: s, toast: toast("success", `${d.name} acquired`, `Title transferred for ₡${Math.round(cost).toLocaleString()}. Rent begins next tick.`) };
}

export function sellProperty(state: GameState, districtId: string): ActionResult {
  const s = clone(state);
  const d = s.districts.find((x) => x.id === districtId);
  if (!d || d.ownerId !== "player") return { state, toast: toast("error", "Not your property", "You do not hold title here.") };
  const proceeds = d.price * 0.96;
  s.player.cash += proceeds;
  s.player.properties = s.player.properties.filter((id) => id !== districtId);
  d.ownerId = null;
  d.ownerName = null;
  s.player.lastAction = `Sold ${d.name} for ₡${Math.round(proceeds).toLocaleString()}.`;
  return { state: s, toast: toast("success", `${d.name} sold`, `₡${Math.round(proceeds).toLocaleString()} settled after transfer tax.`) };
}

const ISP_COSTS: Record<IspNode["kind"], { cost: number; capacity: number; revenue: number; upkeep: number; label: string }> = {
  edge: { cost: 90_000, capacity: 20, revenue: 3_200, upkeep: 850, label: "Edge Node" },
  fiber: { cost: 280_000, capacity: 70, revenue: 14_000, upkeep: 3_600, label: "Fiber Trunk" },
  datacenter: { cost: 780_000, capacity: 180, revenue: 46_000, upkeep: 12_000, label: "Data Center" },
};

export function buildIsp(state: GameState, kind: IspNode["kind"], name: string): ActionResult {
  const s = clone(state);
  const spec = ISP_COSTS[kind];
  if (s.player.cash < spec.cost) return { state, toast: toast("error", "Capex shortfall", `You need ₡${(spec.cost - s.player.cash).toLocaleString()} more to break ground.`) };
  s.player.cash -= spec.cost;
  const node: IspNode = {
    id: uid("isp"),
    name: name.trim().slice(0, 32) || `${spec.label} ${s.isps.filter((n) => n.ownerId === "player").length + 1}`,
    kind,
    ownerId: "player",
    ownerName: s.player.name,
    capacity: spec.capacity,
    load: Math.floor(rand(8, 24)),
    uptime: 99.9,
    latency: kind === "datacenter" ? 8 : kind === "fiber" ? 14 : 26,
    revenuePerDay: spec.revenue,
    upkeep: spec.upkeep,
    builtDay: s.day,
    status: "online",
  };
  s.isps.push(node);
  s.player.lastAction = `Commissioned ${node.name}, a new ${spec.label.toLowerCase()}.`;
  return { state: s, toast: toast("success", `${node.name} online`, `${spec.capacity} Gbps capacity commissioned. Revenue begins next tick.`) };
}

export function upgradeIsp(state: GameState, nodeId: string): ActionResult {
  const s = clone(state);
  const node = s.isps.find((n) => n.id === nodeId && n.ownerId === "player");
  if (!node) return { state, toast: toast("error", "Node not found", "You do not control that asset.") };
  const cost = Math.round(node.capacity * 1_800);
  if (s.player.cash < cost) return { state, toast: toast("error", "Capex shortfall", `Upgrade costs ₡${cost.toLocaleString()}.`) };
  s.player.cash -= cost;
  node.capacity = Math.round(node.capacity * 1.45);
  node.revenuePerDay = Math.round(node.revenuePerDay * 1.38);
  node.upkeep = Math.round(node.upkeep * 1.2);
  node.latency = Math.max(4, node.latency - 1);
  s.player.lastAction = `Expanded ${node.name} to ${node.capacity} Gbps.`;
  return { state: s, toast: toast("success", "Capacity expanded", `${node.name} now moves ${node.capacity} Gbps.`) };
}

export function repairIsp(state: GameState, nodeId: string): ActionResult {
  const s = clone(state);
  const node = s.isps.find((n) => n.id === nodeId && n.ownerId === "player");
  if (!node) return { state, toast: toast("error", "Node not found", "You do not control that asset.") };
  const cost = 18_000;
  if (s.player.cash < cost) return { state, toast: toast("error", "Insufficient credits", "Repair costs ₡18,000.") };
  s.player.cash -= cost;
  node.uptime = 99.9;
  node.status = "online";
  node.load = Math.max(10, node.load - 15);
  s.player.lastAction = `Dispatched engineers to ${node.name}.`;
  return { state: s, toast: toast("success", "Node restored", `${node.name} is back to 99.9% uptime.`) };
}

const MEDIA_COSTS = {
  news: { cost: 120_000, reach: 14, revenue: 3_400, upkeep: 1_500, label: "News Desk" },
  streaming: { cost: 220_000, reach: 22, revenue: 6_200, upkeep: 2_600, label: "Streaming Platform" },
  tv: { cost: 460_000, reach: 38, revenue: 13_500, upkeep: 5_200, label: "TV Network" },
};

export function launchMedia(state: GameState, kind: MediaOutlet["kind"], name: string): ActionResult {
  const s = clone(state);
  const spec = MEDIA_COSTS[kind];
  if (s.player.cash < spec.cost) return { state, toast: toast("error", "Capex shortfall", `You need ₡${(spec.cost - s.player.cash).toLocaleString()} more.`) };
  s.player.cash -= spec.cost;
  const outlet: MediaOutlet = {
    id: uid("media"),
    name: name.trim().slice(0, 34) || `${spec.label} ${s.media.filter((m) => m.ownerId === "player").length + 1}`,
    kind,
    ownerId: "player",
    ownerName: s.player.name,
    reach: spec.reach,
    credibility: 58,
    hype: 42,
    revenuePerDay: spec.revenue,
    upkeep: spec.upkeep,
    shows: [],
  };
  s.media.push(outlet);
  s.player.lastAction = `Launched ${outlet.name}.`;
  return { state: s, toast: toast("success", `${outlet.name} is broadcasting`, `Initial reach ${spec.reach}. Produce a show to grow the audience.`) };
}

export function produceShow(state: GameState, outletId: string, title: string): ActionResult {
  const s = clone(state);
  const outlet = s.media.find((m) => m.id === outletId && m.ownerId === "player");
  if (!outlet) return { state, toast: toast("error", "Outlet not found", "You do not control that network.") };
  const cost = 28_000;
  if (s.player.cash < cost) return { state, toast: toast("error", "Budget shortfall", "A production costs ₡28,000.") };
  s.player.cash -= cost;
  const quality = clamp(Math.round(rand(38, 88) + s.player.reputation / 8), 25, 99);
  const audience = Math.round(outlet.reach * 38_000 * (quality / 65));
  const show = {
    id: uid("show"),
    title: title.trim().slice(0, 42) || "Untitled Pilot",
    quality,
    audience,
    revenue: Math.round(audience * 0.0042),
    day: s.day,
  };
  outlet.shows.unshift(show);
  if (outlet.shows.length > 8) outlet.shows.pop();
  outlet.reach = clamp(outlet.reach + quality / 26, 0, 100);
  outlet.hype = clamp(outlet.hype + 4, 0, 100);
  outlet.revenuePerDay += Math.round(show.revenue * 0.22);
  s.player.lastAction = `Premiered "${show.title}" to ${audience.toLocaleString()} viewers.`;
  return {
    state: s,
    toast: toast(quality > 75 ? "success" : "info", `"${show.title}" premiered`, `Quality ${quality} · ${audience.toLocaleString()} viewers · ₡${show.revenue.toLocaleString()} opening night.`),
  };
}

export function runCampaign(state: GameState, outletId: string, targetId: string, mode: "hype" | "expose"): ActionResult {
  const s = clone(state);
  const outlet = s.media.find((m) => m.id === outletId && m.ownerId === "player");
  if (!outlet) return { state, toast: toast("error", "Outlet not found", "You do not control that network.") };
  const cost = mode === "hype" ? 45_000 : 65_000;
  if (s.player.cash < cost) return { state, toast: toast("error", "Budget shortfall", `This campaign costs ₡${cost.toLocaleString()}.`) };
  const power = (outlet.reach / 55) * (s.player.archetype === "mogul" ? 1.3 : 1);
  s.player.cash -= cost;
  const token = s.tokens.find((t) => t.id === targetId);
  const corp = s.corporations.find((c) => c.id === targetId);
  if (!token && !corp) return { state, toast: toast("error", "Target lost", "That entity no longer exists.") };

  if (token) {
    const swing = (mode === "hype" ? 1 : -1) * rand(0.025, 0.075) * power;
    setTokenPrice(token, token.price * (1 + swing));
    token.change24h = swing * 100;
    token.holders += mode === "hype" ? Math.floor(rand(40, 900)) : -Math.floor(rand(5, 200));
    if (mode === "expose") token.risk = clamp(token.risk + 8, 0, 100);
  } else if (corp) {
    const delta = (mode === "hype" ? 1 : -1) * rand(5, 14) * power;
    corp.sentiment = clamp(corp.sentiment + delta, 0, 100);
    corp.sharePrice *= 1 + delta / 240;
    pushHistory(corp, corp.sharePrice);
  }
  outlet.hype = clamp(outlet.hype + (mode === "hype" ? 6 : 10), 0, 100);
  outlet.credibility = clamp(outlet.credibility + (mode === "hype" ? -2 : 3), 0, 100);
  s.player.reputation = clamp(s.player.reputation + (mode === "hype" ? 1 : 2), 0, 100);
  s.player.heat = clamp(s.player.heat + (mode === "expose" ? 1 : 0), 0, 100);
  const targetName = token?.symbol ?? corp?.ticker ?? "target";
  s.player.lastAction = `${mode === "hype" ? "Ran a hype campaign" : "Published an exposé"} targeting ${targetName}.`;
  s.wire.unshift({
    id: uid("wire"),
    author: outlet.name,
    handle: `@${outlet.name.toLowerCase().replace(/[^a-z]+/g, "")}`,
    role: "Media Desk",
    body:
      mode === "hype"
        ? `The numbers do not lie: ${targetName} is the most important story in the city right now.`
        : `What we found inside ${targetName} will change how you see this market.`,
    sentiment: mode === "hype" ? 0.7 : -0.6,
    likes: Math.floor(rand(500, 14_000)),
    replies: Math.floor(rand(40, 1_900)),
    day: s.day,
    tags: ["media", targetName.toLowerCase()],
    verified: true,
    player: true,
  });
  return {
    state: s,
    toast: toast("success", mode === "hype" ? "Narrative amplified" : "Exposé published", `${outlet.name} moved ${targetName}. Reach ${Math.round(outlet.reach)}.`),
  };
}

export function foundBank(state: GameState, name: string): ActionResult {
  const s = clone(state);
  const cost = s.player.archetype === "banker" ? 455_000 : 650_000;
  if (s.player.cash < cost) return { state, toast: toast("error", "Charter denied", `You need ₡${(cost - s.player.cash).toLocaleString()} more.`) };
  s.player.cash -= cost;
  const bank: Bank = {
    id: uid("bank"),
    name: name.trim().slice(0, 34) || "First Syndicate Bank",
    ownerId: "player",
    ownerName: s.player.name,
    reserves: Math.round(cost * 0.7),
    deposits: 0,
    loans: 0,
    rate: 7.2,
    reputation: 55,
    status: "stable",
    foundedDay: s.day,
  };
  s.banks.push(bank);
  s.player.influence = clamp(s.player.influence + 8, 0, 100);
  s.player.lastAction = `Chartered ${bank.name} with ₡${Math.round(cost * 0.7).toLocaleString()} in reserves.`;
  return { state: s, toast: toast("success", `${bank.name} chartered`, "Deposits will arrive as reputation grows. Keep reserves above 10% of deposits.") };
}

export function takeLoan(state: GameState, bankId: string, principal: number): ActionResult {
  const s = clone(state);
  const bank = s.banks.find((b) => b.id === bankId);
  if (!bank) return { state, toast: toast("error", "Bank not found", "That institution is gone.") };
  if (bank.status === "insolvent") return { state, toast: toast("error", "Bank insolvent", "This institution cannot underwrite new credit.") };
  const worth = computeNetWorth(s);
  const max = Math.max(250_000, worth * 0.45 - s.player.loans.reduce((n, l) => n + l.outstanding, 0));
  if (principal < 100_000) return { state, toast: toast("error", "Loan too small", "Minimum facility is ₡100,000.") };
  if (principal > max) return { state, toast: toast("error", "Underwriting rejected", `Collateral supports up to ₡${Math.round(max).toLocaleString()}.`) };
  const discountedRate = bank.rate * (s.player.archetype === "banker" ? 0.8 : 1);
  const payment = (principal * (discountedRate / 100)) / 365 + principal / 60;
  s.player.cash += principal;
  s.player.loans.push({
    id: uid("loan"),
    bankId,
    bankName: bank.name,
    principal,
    outstanding: principal,
    rate: discountedRate,
    payment: Math.round(payment),
    takenDay: s.day,
  });
  bank.loans += principal;
  bank.reserves -= principal * 0.35;
  s.player.lastAction = `Drew a ₡${principal.toLocaleString()} facility from ${bank.name}.`;
  return { state: s, toast: toast("success", "Credit facility open", `₡${principal.toLocaleString()} disbursed at ${discountedRate.toFixed(1)}%. Daily payment ₡${Math.round(payment).toLocaleString()}.`) };
}

export function repayLoan(state: GameState, loanId: string): ActionResult {
  const s = clone(state);
  const loan = s.player.loans.find((l) => l.id === loanId);
  if (!loan) return { state, toast: toast("error", "Loan not found", "That facility is already closed.") };
  if (s.player.cash < loan.outstanding) return { state, toast: toast("error", "Insufficient credits", `You need ₡${Math.round(loan.outstanding - s.player.cash).toLocaleString()} more.`) };
  const bank = s.banks.find((b) => b.id === loan.bankId);
  s.player.cash -= loan.outstanding;
  if (bank) {
    bank.loans = Math.max(0, bank.loans - loan.outstanding);
    bank.reserves += loan.outstanding;
  }
  s.player.loans = s.player.loans.filter((l) => l.id !== loanId);
  s.player.reputation = clamp(s.player.reputation + 2, 0, 100);
  s.player.lastAction = `Repaid ${loan.bankName} in full.`;
  return { state: s, toast: toast("success", "Facility closed", `₡${Math.round(loan.outstanding).toLocaleString()} repaid to ${loan.bankName}.`) };
}

export function setBankRate(state: GameState, bankId: string, rate: number): ActionResult {
  const s = clone(state);
  const bank = s.banks.find((b) => b.id === bankId && b.ownerId === "player");
  if (!bank) return { state, toast: toast("error", "Bank not found", "You do not control that institution.") };
  bank.rate = clamp(rate, 1, 24);
  s.player.lastAction = `Set ${bank.name}'s deposit rate to ${bank.rate.toFixed(1)}%.`;
  return { state: s, toast: toast("info", "Rate updated", `${bank.name} now pays ${bank.rate.toFixed(1)}% on deposits.` ) };
}

export function injectReserves(state: GameState, bankId: string, amount: number): ActionResult {
  const s = clone(state);
  const bank = s.banks.find((b) => b.id === bankId && b.ownerId === "player");
  if (!bank) return { state, toast: toast("error", "Bank not found", "You do not control that institution.") };
  if (amount <= 0 || amount > s.player.cash) return { state, toast: toast("error", "Invalid transfer", "Enter an amount within your cash balance.") };
  s.player.cash -= amount;
  bank.reserves += amount;
  bank.status = bank.reserves / Math.max(1, bank.deposits) < 0.05 ? "strained" : "stable";
  s.player.lastAction = `Injected ₡${amount.toLocaleString()} into ${bank.name}.`;
  return { state: s, toast: toast("success", "Liquidity injected", `₡${amount.toLocaleString()} added to ${bank.name}'s reserves.`) };
}

export function underworldOp(
  state: GameState,
  op: "hack" | "smuggle" | "launder" | "bribe" | "heist",
  targetId?: string,
): ActionResult {
  const s = clone(state);
  const hackerDiscount = s.player.archetype === "hacker" ? 0.85 : 1;
  s.player.heat = clamp(s.player.heat, 0, 100);
  if (s.player.heat >= 100) return { state, toast: toast("error", "You are burned", "Lie low. Your face is on every screen in the city.") };

  if (op === "hack") {
    const cost = Math.round(26_000 * hackerDiscount);
    if (s.player.cash < cost) return { state, toast: toast("error", "Insufficient credits", `Intrusion costs ₡${cost.toLocaleString()}.`) };
    s.player.cash -= cost;
    const targetCorp = s.corporations.find((c) => c.id === targetId);
    const success = chance(0.56 + (s.player.archetype === "hacker" ? 0.15 : 0));
    if (success) {
      const loot = Math.round(rand(45_000, 210_000) * (s.player.archetype === "hacker" ? 1.15 : 1));
      s.player.cash += loot;
      s.player.heat = clamp(s.player.heat + 9 * (s.player.archetype === "hacker" ? 0.65 : 1), 0, 100);
      if (targetCorp) {
        targetCorp.sharePrice *= 0.985;
        targetCorp.sentiment = clamp(targetCorp.sentiment - 4, 0, 100);
        pushHistory(targetCorp, targetCorp.sharePrice);
      }
      s.player.reputation = clamp(s.player.reputation + 1, 0, 100);
      s.player.lastAction = `Breached ${targetCorp?.ticker ?? "a rival network"} and extracted ₡${loot.toLocaleString()}.`;
      return { state: s, toast: toast("success", "Intrusion successful", `Exfiltrated ₡${loot.toLocaleString()}. Heat +${Math.round(9 * (s.player.archetype === "hacker" ? 0.65 : 1))}.`) };
    }
    s.player.heat = clamp(s.player.heat + 18, 0, 100);
    s.player.reputation = clamp(s.player.reputation - 1, 0, 100);
    s.player.lastAction = "Left fingerprints in a honeypot. The intrusion failed.";
    return { state: s, toast: toast("error", "Intrusion failed", "The target ran a honeypot. Heat +18.") };
  }

  if (op === "smuggle") {
    const cost = 44_000;
    if (s.player.cash < cost) return { state, toast: toast("error", "Insufficient credits", "A run requires ₡44,000 in front money.") };
    s.player.cash -= cost;
    if (chance(0.62)) {
      const payout = Math.round(rand(95_000, 270_000));
      s.player.cash += payout;
      s.player.heat = clamp(s.player.heat + 7, 0, 100);
      s.player.lastAction = `Moved a container through the Docks and cleared ₡${payout.toLocaleString()}.`;
      return { state: s, toast: toast("success", "Cargo cleared", `The manifest held. ₡${payout.toLocaleString()} net.`) };
    }
    s.player.heat = clamp(s.player.heat + 16, 0, 100);
    s.player.lastAction = "A customs drone flagged the container. The cargo is gone.";
    return { state: s, toast: toast("error", "Shipment seized", "Customs impounded the cargo. Heat +16.") };
  }

  if (op === "launder") {
    const cost = 52_000;
    if (s.player.cash < cost) return { state, toast: toast("error", "Insufficient credits", "The broker requires ₡52,000 upfront.") };
    s.player.cash -= cost;
    const reduction = Math.round(rand(9, 17));
    s.player.heat = clamp(s.player.heat - reduction, 0, 100);
    s.player.lastAction = `Ran clean money through three shell companies. Heat -${reduction}.`;
    return { state: s, toast: toast("success", "Ledger cleaned", `Heat reduced by ${reduction}. The broker keeps the fee.`) };
  }

  if (op === "bribe") {
    const cost = 120_000;
    if (s.player.cash < cost) return { state, toast: toast("error", "Insufficient credits", "The official's price is ₡120,000.") };
    s.player.cash -= cost;
    if (chance(0.86)) {
      s.player.heat = clamp(s.player.heat - 22, 0, 100);
      s.player.influence = clamp(s.player.influence + 6, 0, 100);
      s.government.approval = clamp(s.government.approval - 1, 0, 100);
      s.player.lastAction = "Made a campaign contribution to a grateful public servant.";
      return { state: s, toast: toast("success", "Access purchased", "Heat -22 · Influence +6. No receipt was issued.") };
    }
    s.player.heat = clamp(s.player.heat + 12, 0, 100);
    s.player.reputation = clamp(s.player.reputation - 7, 0, 100);
    s.player.lastAction = "The official was wearing a wire. The conversation is now evidence.";
    return { state: s, toast: toast("error", "Sting operation", "The bribe was recorded. Heat +12 · Reputation -7.") };
  }

  const cost = 75_000;
  if (s.player.cash < cost) return { state, toast: toast("error", "Insufficient credits", "The crew needs ₡75,000. ") };
  if (s.player.heat > 70) return { state, toast: toast("warning", "Too hot", "Your crew refuses to move while you are under this much surveillance.") };
  s.player.cash -= cost;
  if (chance(0.34)) {
    const loot = Math.round(rand(300_000, 1_250_000));
    s.player.cash += loot;
    s.player.heat = clamp(s.player.heat + 26, 0, 100);
    s.player.reputation = clamp(s.player.reputation - 2, 0, 100);
    s.player.lastAction = `Pulled a vault job on ${s.banks.find((b) => b.id === targetId)?.name ?? "a Meridian branch"} for ₡${loot.toLocaleString()}.`;
    return { state: s, toast: toast("success", "Vault compromised", `The crew walked out with ₡${loot.toLocaleString()}. Heat +26.`) };
  }
  const fine = Math.round(rand(30_000, 90_000));
  s.player.cash = Math.max(0, s.player.cash - fine);
  s.player.heat = clamp(s.player.heat + 31, 0, 100);
  s.player.reputation = clamp(s.player.reputation - 4, 0, 100);
  s.player.lastAction = "The vault job went wrong. Two crew members were arrested.";
  return { state: s, toast: toast("error", "Job blown", `You paid ₡${fine.toLocaleString()} in cleanup and lost the crew. Heat +31.`) };
}

export function lobbyGovernment(state: GameState, action: "deregulate" | "subsidize" | "immunity" | "donate"): ActionResult {
  const s = clone(state);
  if (action === "donate") {
    const cost = 100_000;
    if (s.player.cash < cost) return { state, toast: toast("error", "Insufficient credits", "A meaningful donation starts at ₡100,000.") };
    s.player.cash -= cost;
    s.player.influence = clamp(s.player.influence + 4, 0, 100);
    s.player.reputation = clamp(s.player.reputation + 1, 0, 100);
    s.government.treasury += cost;
    s.player.lastAction = "Donated to the Civic Renewal Fund. A plaque is being engraved.";
    return { state: s, toast: toast("success", "Civic patron", "Influence +4 · Reputation +1.") };
  }
  if (action === "deregulate") {
    const cost = 180_000;
    if (s.player.cash < cost) return { state, toast: toast("error", "Insufficient credits", "Lobbying costs ₡180,000.") };
    s.player.cash -= cost;
    if (chance(0.62)) {
      s.government.regulation = clamp(s.government.regulation - 7, 0, 100);
      s.player.heat = clamp(s.player.heat - 6, 0, 100);
      s.player.influence = clamp(s.player.influence + 3, 0, 100);
      s.player.lastAction = "Convinced the council that oversight is a form of stagnation.";
      return { state: s, toast: toast("success", "Rule softened", "Regulation -7 · Heat -6 · Influence +3.") };
    }
    s.government.approval = clamp(s.government.approval - 2, 0, 100);
    s.player.lastAction = "The deregulation push died in committee. Someone leaked your memo.";
    return { state: s, toast: toast("warning", "Bill stalled", "The committee buried it. Approval -2.") };
  }
  if (action === "subsidize") {
    const cost = 140_000;
    if (s.player.cash < cost) return { state, toast: toast("error", "Insufficient credits", "The subsidy lobby costs ₡140,000.") };
    s.player.cash -= cost;
    s.districts.forEach((d) => {
      if (d.ownerId === "player") d.price *= 1.04;
    });
    s.player.influence = clamp(s.player.influence + 2, 0, 100);
    s.player.lastAction = "Won a targeted property subsidy for your holdings.";
    return { state: s, toast: toast("success", "Subsidy passed", "Your properties revalued +4%.") };
  }
  const cost = 240_000 * Math.max(1, s.government.warrants);
  if (s.government.warrants === 0) return { state, toast: toast("info", "No warrants", "There is nothing to quash. For now.") };
  if (s.player.cash < cost) return { state, toast: toast("error", "Insufficient credits", `Quashing ${s.government.warrants} warrant(s) costs ₡${cost.toLocaleString()}.`) };
  s.player.cash -= cost;
  s.government.warrants = 0;
  s.player.heat = clamp(s.player.heat - 30, 0, 100);
  s.player.lastAction = "Quietly resolved every outstanding warrant.";
  return { state: s, toast: toast("success", "Records sealed", "All warrants withdrawn. Heat -30.") };
}

export function postToWire(state: GameState, body: string): ActionResult {
  const s = clone(state);
  const clean = body.trim().slice(0, 280);
  if (clean.length < 2) return { state, toast: toast("error", "Empty transmission", "Write something the city can react to.") };
  const post: Post = {
    id: uid("post"),
    author: s.player.name,
    handle: `@${s.player.handle}`,
    role: `${ARCHETYPES[s.player.archetype].label} · Player`,
    body: clean,
    sentiment: 0.4,
    likes: Math.floor(rand(20, 400)),
    replies: Math.floor(rand(2, 60)),
    day: s.day,
    tags: ["player", "wire"],
    verified: s.player.reputation > 60,
    player: true,
  };
  s.wire.unshift(post);
  s.player.reputation = clamp(s.player.reputation + 0.5, 0, 100);
  s.player.lastAction = "Posted to the Wire.";
  return { state: s, toast: toast("success", "Transmission live", "Your post is propagating across the city feed.") };
}

export function adminAction(
  state: GameState,
  action: "grant" | "pump" | "crash" | "clear" | "event" | "advance" | "collapse",
  targetId?: string,
): ActionResult {
  const s = clone(state);
  if (!s.adminUnlocked) return { state, toast: toast("error", "Access denied", "God Mode is not unlocked for this identity.") };
  if (action === "grant") {
    s.player.cash += 10_000_000;
    return { state: s, toast: toast("success", "Treasury opened", "₡10,000,000 minted into your personal account.") };
  }
  if (action === "pump" || action === "crash") {
    const token = s.tokens.find((t) => t.id === targetId);
    if (!token) return { state, toast: toast("error", "Asset not found", "Select a live token.") };
    setTokenPrice(token, token.price * (action === "pump" ? 1.8 : 0.42));
    token.change24h = action === "pump" ? 80 : -58;
    return { state: s, toast: toast("warning", "Market overridden", `${token.symbol} forcibly ${action === "pump" ? "pumped" : "crashed"}.`) };
  }
  if (action === "clear") {
    s.player.heat = 0;
    s.government.warrants = 0;
    s.player.reputation = Math.max(s.player.reputation, 90);
    return { state: s, toast: toast("success", "Identity scrubbed", "Heat and warrants cleared. Reputation restored.") };
  }
  if (action === "event") {
    const template = WORLD_EVENTS[Math.floor(Math.random() * WORLD_EVENTS.length)];
    const event = materializeEvent(template, s.day, "grok");
    s.events.unshift(event);
    applyEventShock(s, event);
    return { state: s, toast: toast("warning", "World event injected", event.title) };
  }
  if (action === "advance") {
    let next = s;
    for (let i = 0; i < 5; i++) next = tickWorld(next);
    return { state: next, toast: toast("info", "Time skip", "Five simulated days have passed.") };
  }
  const agent = s.agents[Math.floor(Math.random() * s.agents.length)];
  agent.wealth *= 0.58;
  agent.status = "Margin called · assets frozen";
  agent.sentiment = 12;
  addWirePost(s, agent, "We are evaluating strategic alternatives. That is all I can say.");
  return { state: s, toast: toast("warning", "Rival crippled", `${agent.name}'s empire lost 42% of its value.`) };
}

// ── World simulation ────────────────────────────────────────────────────

const WORLD_EVENTS: { title: string; description: string; category: WorldEvent["category"]; severity: WorldEvent["severity"]; pulse: number; sentiment: number; crime: number; regulation: number }[] = [
  {
    title: "Global supply chain collapse",
    description: "Three ports closed overnight. Input costs are spiking and the Foundry is running on fumes.",
    category: "market",
    severity: "critical",
    pulse: -7,
    sentiment: -11,
    crime: 4,
    regulation: 3,
  },
  {
    title: "Regulatory crackdown",
    description: "The city auditor has opened a sweep of unregistered token issuers and offshore shell entities.",
    category: "policy",
    severity: "major",
    pulse: -4,
    sentiment: -6,
    crime: -5,
    regulation: 12,
  },
  {
    title: "AI tech boom",
    description: "A new inference architecture just cut compute costs by 60%. Ghost Quarter is repricing everything.",
    category: "market",
    severity: "major",
    pulse: 9,
    sentiment: 8,
    crime: -2,
    regulation: -2,
  },
  {
    title: "Bank run at Ashfall Credit",
    description: "Depositors are queuing around the block. The central bank is deciding whether to intervene.",
    category: "market",
    severity: "critical",
    pulse: -8,
    sentiment: -10,
    crime: 6,
    regulation: 5,
  },
  {
    title: "Leaked Voss tape",
    description: "An unaired segment shows the anchor coaching a minister through a corruption hearing. The clip is everywhere.",
    category: "media",
    severity: "major",
    pulse: -3,
    sentiment: 4,
    crime: 1,
    regulation: 2,
  },
  {
    title: "Undersea cable severed",
    description: "A coordinated cut took out two backbone routes. Latency is climbing across every district.",
    category: "infrastructure",
    severity: "major",
    pulse: -2,
    sentiment: -5,
    crime: 2,
    regulation: 0,
  },
  {
    title: "Municipal election upset",
    description: "A reformist bloc just took three council seats. Every license in the city is suddenly under review.",
    category: "policy",
    severity: "major",
    pulse: 1,
    sentiment: 5,
    crime: -3,
    regulation: 8,
  },
  {
    title: "Meme-coin mania",
    description: "Retail is piling into anything with a dog on it. Liquidity is thin and conviction is thinner.",
    category: "market",
    severity: "minor",
    pulse: 6,
    sentiment: 7,
    crime: 1,
    regulation: -1,
  },
  {
    title: "Ghostwire ransomware strike",
    description: "Hospitals, brokerages, and one very unlucky bakery are offline. Ransom demands are denominated in VOID.",
    category: "crime",
    severity: "critical",
    pulse: -5,
    sentiment: -4,
    crime: 9,
    regulation: 4,
  },
  {
    title: "Sovereign wealth fund enters the city",
    description: "A silent allocation is buying prime property and infrastructure at any ask. Valuations are moving fast.",
    category: "market",
    severity: "major",
    pulse: 8,
    sentiment: 6,
    crime: -1,
    regulation: 0,
  },
  {
    title: "Tax amnesty window opens",
    description: "For seventy-two hours, undeclared corporate income can be normalized without penalty. Everyone is suddenly pious.",
    category: "policy",
    severity: "minor",
    pulse: 3,
    sentiment: 2,
    crime: -4,
    regulation: -3,
  },
  {
    title: "AI-generated anchor scandal",
    description: "A deepfaked broadcast moved $400M before anyone checked the source. Trust in media just took a hit.",
    category: "media",
    severity: "major",
    pulse: -4,
    sentiment: -7,
    crime: 2,
    regulation: 6,
  },
];

const AGENT_ACTIONS = [
  "quietly accumulated a stake in a rival's distressed debt.",
  "announced a joint venture, then bought the partner's patents.",
  "moved three shell companies to a jurisdiction with no extradition treaty.",
  "leaked a competitor's earnings to a friendly analyst.",
  "funded a mayoral recall campaign over dinner.",
  "acquired a bankrupt ISP for the value of its spectrum licenses.",
  "shorted a token for six hours, then published a glowing report.",
  "hired the journalist who was investigating them.",
  "rerouted traffic through a private exchange during peak hours.",
  "cut a backroom deal to keep a regulator off the board.",
];

function materializeEvent(
  template: (typeof WORLD_EVENTS)[number],
  day: number,
  source: WorldEvent["source"],
): WorldEvent {
  return {
    id: uid("event"),
    title: template.title,
    description: template.description,
    category: template.category,
    severity: template.severity,
    pulse: template.pulse,
    sentiment: template.sentiment,
    crime: template.crime,
    regulation: template.regulation,
    day,
    expires: day + Math.floor(rand(3, 7)),
    source,
  };
}

export function applyEventShock(state: GameState, event: WorldEvent) {
  state.events.unshift(event);
  if (state.events.length > 8) state.events.pop();
  state.tokens.forEach((t) => {
    if (t.rugged) return;
    setTokenPrice(t, t.price * (1 + (event.pulse / 100) * rand(0.4, 1.5)));
  });
  state.corporations.forEach((c) => {
    c.sentiment = clamp(c.sentiment + event.sentiment * 0.4, 0, 100);
    c.sharePrice *= 1 + event.sentiment / 700;
    pushHistory(c, c.sharePrice);
  });
  state.districts.forEach((d) => {
    d.crime = clamp(d.crime + event.crime, 0, 100);
    d.price *= 1 + event.pulse / 900;
    pushHistory(d, d.price);
  });
  state.government.regulation = clamp(state.government.regulation + event.regulation, 0, 100);
  state.economy = clamp(state.economy + event.pulse * 0.8, 0, 100);
}

export function tickWorld(state: GameState): GameState {
  const s = clone(state);
  s.day += 1;
  const effects = eventEffects(s);
  const economyDrift = (effects.pulse + (s.government.regulation > 70 ? -2 : 1)) * 0.15;
  s.economy = clamp(s.economy + economyDrift + rand(-0.8, 0.9), 0, 100);

  // Markets
  for (const token of s.tokens) {
    if (token.rugged) {
      token.change24h = 0;
      continue;
    }
    const drift = rand(-2.8, 3.25) + effects.pulse * 0.22 + (s.economy - 50) * 0.018;
    const old = token.price;
    setTokenPrice(token, old * (1 + drift / 100));
    token.change24h = drift;
    token.volume = Math.max(0, token.volume * rand(0.86, 1.15) + Math.abs(drift) * token.liquidity * 0.02);
    token.holders = Math.max(1, token.holders + Math.floor(rand(-90, 260)));
    if (token.risk > 60 && token.creatorId !== "player" && chance(token.risk / 3200)) {
      token.rugged = true;
      setTokenPrice(token, token.price * 0.07);
      token.change24h = -93;
      s.wire.unshift({
        id: uid("wire"),
        author: "The Wire",
        handle: "@citywire",
        role: "Breaking",
        body: `${token.symbol} liquidity was pulled. The creator's wallet is empty and the community is not taking questions.`,
        sentiment: -0.9,
        likes: Math.floor(rand(1_000, 20_000)),
        replies: Math.floor(rand(100, 3_000)),
        day: s.day,
        tags: ["rugpull", token.symbol.toLowerCase()],
        verified: true,
      });
    }
  }

  for (const corp of s.corporations) {
    const drift = rand(-1.4, 1.6) + (corp.sentiment - 50) / 90 + effects.pulse * 0.04;
    corp.sharePrice = Math.max(0.5, corp.sharePrice * (1 + drift / 100));
    corp.sentiment = clamp(corp.sentiment + rand(-2, 2) + effects.sentiment * 0.06, 0, 100);
    pushHistory(corp, corp.sharePrice);
  }

  for (const d of s.districts) {
    const pressure = (d.demand - d.crime * 0.7 - s.government.regulation * 0.08) / 11000;
    const subsidy = s.government.laws.find((l) => l.id === "law-4" && l.status === "active") && d.kind === "Industrial" ? 0.003 : 0;
    d.price = Math.max(d.basePrice * 0.28, d.price * (1 + pressure + subsidy + rand(-0.003, 0.003)));
    d.crime = clamp(d.crime + rand(-1.4, 1.6) + effects.crime * 0.12 - d.police / 300, 0, 100);
    d.demand = clamp(d.demand + rand(-1.2, 1.4) - d.crime / 90, 0, 100);
    d.rentPerDay = Math.round(d.price * 0.00035 * (d.ownerId === "player" && s.player.archetype === "tycoon" ? 1.18 : 1));
    pushHistory(d, d.price);
  }

  // Passive income and costs
  let income = 0;
  for (const d of s.districts.filter((x) => x.ownerId === "player")) {
    income += d.rentPerDay;
    s.player.cash += d.rentPerDay;
  }
  for (const node of s.isps) {
    const load = clamp(node.load + rand(-6, 9), 4, 125);
    node.load = load;
    if (load > node.capacity * 1.08) {
      node.uptime = clamp(node.uptime - rand(0.2, 1.1), 80, 99.9);
      node.status = node.uptime < 94 ? "offline" : "degraded";
    } else {
      node.uptime = clamp(node.uptime + rand(0, 0.18), 0, 99.9);
      node.status = node.uptime > 98 ? "online" : "degraded";
    }
    const revenue = Math.round(node.revenuePerDay * (node.uptime / 100) * (load / Math.max(1, node.capacity)) * 1.35 - node.upkeep);
    node.revenuePerDay = Math.max(0, node.revenuePerDay + Math.round(rand(-300, 500)));
    if (node.ownerId === "player") {
      s.player.cash += revenue;
      income += Math.max(0, revenue);
    }
  }
  for (const outlet of s.media) {
    const reachDrift = rand(-0.6, 0.8) + outlet.hype / 900;
    outlet.reach = clamp(outlet.reach + reachDrift, 0, 100);
    outlet.credibility = clamp(outlet.credibility + rand(-0.5, 0.5), 0, 100);
    outlet.hype = clamp(outlet.hype - rand(0.2, 1.1), 0, 100);
    const revenue = Math.round(outlet.revenuePerDay * (outlet.reach / 40) * (outlet.credibility / 60) - outlet.upkeep);
    outlet.revenuePerDay = Math.max(0, outlet.revenuePerDay + Math.round(rand(-200, 450)));
    for (const show of outlet.shows) show.audience = Math.round(show.audience * rand(0.94, 1.04));
    if (outlet.ownerId === "player") {
      const take = Math.max(0, revenue) * (s.player.archetype === "mogul" ? 1.22 : 1);
      s.player.cash += take;
      income += take;
    }
  }

  // Banks and credit
  for (const bank of s.banks) {
    const depositFlow = bank.ownerId === "player" ? rand(40_000, 260_000) * (bank.reputation / 60) : rand(-2_000_000, 3_000_000);
    bank.deposits = Math.max(0, bank.deposits + depositFlow);
    bank.reserves = Math.max(0, bank.reserves + depositFlow * 0.08);
    const interest = (bank.loans * (bank.rate / 100)) / 365;
    bank.loans += interest;
    bank.reserves += interest;
    if (bank.ownerId === "player") {
      const spread = Math.round(interest * 0.72);
      s.player.cash += spread;
      income += spread;
    }
    const ratio = bank.reserves / Math.max(1, bank.deposits);
    bank.status = ratio < 0.04 ? "insolvent" : ratio < 0.08 ? "strained" : "stable";
    if (bank.status === "insolvent" && chance(0.28)) {
      bank.reputation = clamp(bank.reputation - 25, 0, 100);
      s.wire.unshift({
        id: uid("wire"),
        author: "The Wire",
        handle: "@citywire",
        role: "Breaking",
        body: `${bank.name} has frozen withdrawals. The central bank is holding an emergency session.`,
        sentiment: -0.8,
        likes: Math.floor(rand(500, 8_000)),
        replies: Math.floor(rand(100, 2_000)),
        day: s.day,
        tags: ["banking", "bankrun"],
        verified: true,
      });
    }
  }

  for (const loan of [...s.player.loans]) {
    if (s.player.cash >= loan.payment) {
      s.player.cash -= loan.payment;
      loan.outstanding = Math.max(0, loan.outstanding - loan.payment * 0.94);
    } else {
      loan.outstanding *= 1 + loan.rate / 100 / 365;
      s.player.heat = clamp(s.player.heat + 2, 0, 100);
      s.player.reputation = clamp(s.player.reputation - 0.8, 0, 100);
    }
    if (loan.outstanding <= 1) {
      s.player.loans = s.player.loans.filter((l) => l.id !== loan.id);
    }
  }

  // Staking yield
  for (const [tokenId, amount] of Object.entries(s.player.stakes)) {
    const token = s.tokens.find((t) => t.id === tokenId);
    if (!token || token.rugged) continue;
    const yield_ = amount * token.price * 0.0008;
    s.player.cash += yield_;
    income += yield_;
  }

  // Taxes and upkeep
  const tax = Math.round(income * (s.government.taxRate / 100));
  s.player.cash -= tax;
  s.government.treasury += tax;

  // Heat and law enforcement
  const heatDecay = s.player.archetype === "hacker" ? 3.4 : 2.1;
  s.player.heat = clamp(s.player.heat - heatDecay + effects.crime * 0.18, 0, 100);
  if (s.player.heat > 82 && chance(0.28)) {
    s.government.warrants += 1;
    s.player.heat = clamp(s.player.heat - 8, 0, 100);
    s.wire.unshift({
      id: uid("wire"),
      author: "City Enforcement Bulletin",
      handle: "@civic_alert",
      role: "Public Notice",
      body: `An arrest warrant has been issued for an unnamed associate of ${s.player.name}. Authorities describe the subject as "cooperative until they weren't."`,
      sentiment: -0.5,
      likes: Math.floor(rand(80, 900)),
      replies: Math.floor(rand(20, 300)),
      day: s.day,
      tags: ["warrant", "crime"],
      verified: true,
    });
  }
  if (s.government.warrants >= 3) {
    const fine = Math.round(s.player.cash * 0.08);
    s.player.cash -= fine;
    s.government.warrants = 0;
    s.player.heat = 20;
    s.player.reputation = clamp(s.player.reputation - 8, 0, 100);
    s.wire.unshift({
      id: uid("wire"),
      author: "The Wire",
      handle: "@citywire",
      role: "Breaking",
      body: `${s.player.name} settled a multi-count indictment with an undisclosed payment. The file has been sealed.`,
      sentiment: -0.4,
      likes: Math.floor(rand(400, 5_000)),
      replies: Math.floor(rand(50, 1_000)),
      day: s.day,
      tags: ["crime", "settlement"],
      verified: true,
    });
  }

  // Autonomous masterminds
  const actors = [...s.agents].sort(() => Math.random() - 0.5).slice(0, 2);
  for (const agent of actors) {
    const swing = rand(-1, 1) * agent.aggression;
    agent.wealth = Math.max(25_000_000, agent.wealth * (1 + swing / 190));
    agent.sentiment = clamp(agent.sentiment + rand(-5, 5), 0, 100);
    agent.lastAction = AGENT_ACTIONS[Math.floor(Math.random() * AGENT_ACTIONS.length)];
    agent.status = swing > 0 ? "Expanding" : "Consolidating";
    if (chance(0.22)) {
      addWirePost(s, agent, agent.lastAction.charAt(0).toUpperCase() + agent.lastAction.slice(1));
    }
    if (chance(0.12)) {
      const target = s.tokens[Math.floor(Math.random() * s.tokens.length)];
      if (!target.rugged) {
        setTokenPrice(target, target.price * (1 + (swing / 100) * 0.8));
        target.change24h = swing * 0.8;
      }
    }
  }

  // NPC wire chatter
  if (chance(0.42)) {
    const agent = s.agents[Math.floor(Math.random() * s.agents.length)];
    const lines = [
      `Anyone else seeing the ${s.tokens[Math.floor(Math.random() * s.tokens.length)]?.symbol ?? "market"} order flow? Somebody knows something.`,
      "Liquidity is a rumor until it is tested.",
      `The ${s.districts[Math.floor(Math.random() * s.districts.length)]?.name ?? "city"} zoning board is cheaper than it looks.`,
      "Every regulator has a price. The honest ones just charge more.",
      "If your bank needs a stress test, it is already failing.",
      "The best acquisitions are the ones nobody knows are for sale.",
    ];
    addWirePost(s, agent, lines[Math.floor(Math.random() * lines.length)]);
  }

  // World events
  if (s.events.filter((e) => e.expires >= s.day).length < 3 && chance(0.2)) {
    const used = new Set(s.events.map((e) => e.title));
    const pool = WORLD_EVENTS.filter((e) => !used.has(e.title));
    const template = (pool.length ? pool : WORLD_EVENTS)[Math.floor(Math.random() * (pool.length || WORLD_EVENTS.length))];
    applyEventShock(s, materializeEvent(template, s.day, "system"));
  }
  s.events = s.events.filter((e) => e.expires >= s.day - 1).slice(0, 8);

  // Government drift
  s.government.approval = clamp(s.government.approval + rand(-1.1, 1.2) - s.government.regulation / 300, 0, 100);
  s.government.regulation = clamp(s.government.regulation + effects.regulation * 0.1, 0, 100);
  if (s.day >= s.government.nextElection) {
    s.government.nextElection = s.day + 48;
    const shift = s.government.approval > 50 ? 3 : -4;
    s.government.approval = clamp(s.government.approval + shift, 0, 100);
    s.wire.unshift({
      id: uid("wire"),
      author: "Civic Center",
      handle: "@citygov",
      role: "Election Desk",
      body: `The council election concluded with ${shift > 0 ? "a mandate for continuity" : "a rebuke of the incumbent bloc"}. Turnout was 31%.`,
      sentiment: shift > 0 ? 0.3 : -0.2,
      likes: Math.floor(rand(100, 2_000)),
      replies: Math.floor(rand(20, 500)),
      day: s.day,
      tags: ["election", "policy"],
      verified: true,
    });
  }

  // Trim
  s.player.influence = clamp(s.player.influence + 0.15, 0, 100);
  s.player.reputation = clamp(s.player.reputation + (income > 0 ? 0.1 : -0.1), 0, 100);
  s.player.day = s.day;
  const worth = computeNetWorth(s);
  const last = s.player.netWorthHistory[s.player.netWorthHistory.length - 1];
  if (!last || last.day !== s.day) {
    s.player.netWorthHistory.push({ day: s.day, value: worth });
    if (s.player.netWorthHistory.length > 48) s.player.netWorthHistory.shift();
  }
  s.lastTickAt = Date.now();
  return s;
}

export function leaderboard(state: GameState): LeaderboardRow[] {
  const rows: LeaderboardRow[] = state.agents.map((a) => ({
    id: a.id,
    name: a.name,
    title: a.title,
    wealth: a.wealth,
    isPlayer: false,
    hue: a.hue,
  }));
  rows.push({
    id: "player",
    name: state.player.name,
    title: ARCHETYPES[state.player.archetype].label,
    wealth: computeNetWorth(state),
    isPlayer: true,
    hue: 78,
  });
  return rows.sort((a, b) => b.wealth - a.wealth);
}

export function totalPassiveIncome(state: GameState): number {
  const rent = state.districts.filter((d) => d.ownerId === "player").reduce((n, d) => n + d.rentPerDay, 0);
  const isp = state.isps.filter((n) => n.ownerId === "player").reduce((n, x) => n + Math.max(0, x.revenuePerDay - x.upkeep), 0);
  const media = state.media.filter((m) => m.ownerId === "player").reduce((n, x) => n + Math.max(0, x.revenuePerDay - x.upkeep), 0);
  return Math.round(rent + isp + media);
}

export function assetValue(state: GameState): number {
  return computeNetWorth(state) - state.player.cash + state.player.loans.reduce((n, l) => n + l.outstanding, 0);
}
