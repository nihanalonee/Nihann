import type {
  Asset,
  GameState,
  Rival,
  UnderworldState,
  WorldEvent,
} from "../types";

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const rand = (min: number, max: number) => min + Math.random() * (max - min);

export const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

export const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

export const uid = (prefix = "id") =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const round2 = (value: number) => Math.round(value * 100) / 100;

export const roundPrice = (value: number) => {
  if (value < 0.01) return Math.round(value * 1_000_000) / 1_000_000;
  if (value < 1) return Math.round(value * 10_000) / 10_000;
  return Math.round(value * 100) / 100;
};

export function netWorth(state: GameState): number {
  const holdingsValue = Object.entries(state.holdings).reduce((sum, [id, holding]) => {
    const asset = state.assets.find((a) => a.id === id);
    return sum + (asset ? asset.price * holding.qty : 0);
  }, 0);
  const propertyValue = state.districts.filter((d) => d.owned).reduce((sum, d) => sum + d.price, 0);
  const corporateValue = state.corporate.founded ? state.corporate.valuation : 0;
  const bankValue = state.bank.founded
    ? Math.max(0, state.bank.reserves + state.bank.loans - state.bank.deposits - state.bank.bonds)
    : 0;
  const mediaValue = state.media.channels.reduce((sum, c) => sum + c.reach * 0.32, 0);
  const ispValue = state.isp.subscribers * 2.4 + state.isp.nodes.length * 180_000;
  return Math.round(
    state.player.cash + holdingsValue + propertyValue + corporateValue + bankValue + mediaValue + ispValue,
  );
}

export function bankEquity(state: GameState) {
  return Math.max(
    0,
    state.bank.reserves + state.bank.loans - state.bank.deposits - state.bank.bonds,
  );
}

export function marketCap(asset: Asset) {
  if (asset.kind === "crypto") return (asset.supply ?? 0) * asset.price;
  return asset.price * 18_000_000;
}

export function portfolioValue(state: GameState) {
  return Object.entries(state.holdings).reduce((sum, [id, holding]) => {
    const asset = state.assets.find((a) => a.id === id);
    return sum + (asset ? asset.price * holding.qty : 0);
  }, 0);
}

export function priceChange(asset: Asset) {
  return ((asset.price - asset.prevClose) / asset.prevClose) * 100;
}

export function historyChange(asset: Asset, points = 24) {
  const start = asset.history[Math.max(0, asset.history.length - points)] ?? asset.price;
  return ((asset.price - start) / start) * 100;
}

export function liquidityFor(asset: Asset) {
  if (asset.kind === "crypto") return asset.liquidity ?? 500_000;
  return 6_000_000 + asset.price * 20_000;
}

// ---------------------------------------------------------------------------
// Market
// ---------------------------------------------------------------------------

export function runMarketTick(state: GameState) {
  const sentiment = state.world.sentiment;
  const volatility = state.world.volatility;

  for (const asset of state.assets) {
    const isCrypto = asset.kind === "crypto";
    // Keep sentiment directional but bounded, and pull price back toward the
    // session anchor so a long-running world does not hyperinflate.
    const bias = clamp(
      (sentiment - 50) / 4200 + (asset.sentiment - 50) / 6500,
      -0.012,
      0.012,
    );
    const vol = asset.volatility * (0.55 + volatility / 180) * (isCrypto ? 1.15 : 1);
    const shock = (Math.random() - 0.5) * 2 * vol;
    const meanRevert = ((asset.prevClose - asset.price) / Math.max(asset.prevClose, 0.0001)) * 0.03;
    const next = Math.max(isCrypto ? 0.00005 : 0.8, asset.price * (1 + bias + shock + meanRevert));
    asset.price = roundPrice(next);
    asset.history.push(asset.price);
    if (asset.history.length > 96) asset.history.shift();
    asset.sentiment = clamp(asset.sentiment + (Math.random() - 0.5) * 1.8, -100, 100);
  }

  const weighted = state.assets.reduce((sum, asset) => {
    const prev = asset.history[asset.history.length - 2] ?? asset.price;
    return sum + (asset.price / prev - 1);
  }, 0) / state.assets.length;

  state.world.index = round2(Math.max(100, state.world.index * (1 + weighted * 0.55)));
  state.world.indexHistory.push(state.world.index);
  if (state.world.indexHistory.length > 96) state.world.indexHistory.shift();
  state.world.sentiment = clamp(state.world.sentiment + (Math.random() - 0.48) * 1.1, 2, 98);
  state.world.volatility = clamp(
    state.world.volatility + (Math.random() - 0.5) * 1.6 + Math.abs(weighted) * 38,
    8,
    98,
  );
}

// ---------------------------------------------------------------------------
// World engine — local fallback Dungeon Master
// ---------------------------------------------------------------------------

interface EventTemplate {
  title: string;
  summary: string;
  severity: WorldEvent["severity"];
  category: WorldEvent["category"];
  effects: string[];
  weight: number;
}

const TEMPLATES: EventTemplate[] = [
  {
    title: "Global Supply Chain Collapse",
    summary:
      "A cascading port failure in the eastern corridor has stranded 400,000 containers. Industrial order books are bleeding and every logistics contract is being repriced in real time.",
    severity: "high",
    category: "macro",
    effects: ["ARK -9%", "NVA +3%", "Dockside demand -12", "Volatility +8"],
    weight: 10,
  },
  {
    title: "AI Tech Boom",
    summary:
      "A breakthrough in on-device inference is repricing the entire technology stack. Capital is rotating out of industrials and into anything with a model layer.",
    severity: "high",
    category: "tech",
    effects: ["OMN +8%", "ZNT +4%", "Sentiment +10", "Tech valuations expand"],
    weight: 12,
  },
  {
    title: "Regulatory Crackdown",
    summary:
      "The Digital Assets Bureau has executed simultaneous warrants on six DEX operators. Compliance teams are freezing withdrawals while prosecutors build a money-laundering case.",
    severity: "critical",
    category: "regulation",
    effects: ["Crypto -12%", "Regulatory pressure +14", "Heat +6", "Volatility +12"],
    weight: 9,
  },
  {
    title: "Central Bank Emergency Cut",
    summary:
      "The clearing council has cut the policy rate by 75 basis points. Risk assets are ripping, bank margins are compressing, and leverage is back on the menu.",
    severity: "medium",
    category: "macro",
    effects: ["VLT +5%", "Stocks +4%", "Lending rates -1.2%", "Sentiment +7"],
    weight: 8,
  },
  {
    title: "Backbone Blackout",
    summary:
      "A fibre cut between Meridian and Neon Row has taken two backbone segments offline. Latency is spiking, mining pools are hashing blind, and the DEX is rejecting orders.",
    severity: "high",
    category: "infrastructure",
    effects: ["ISP load +28", "ISP reputation -7", "GAS +9%", "Cyber threat +10"],
    weight: 8,
  },
  {
    title: "Media Leak: The Vane Tapes",
    summary:
      "A four-hour audio leak allegedly captures Silas Vane discussing price-fixing with a regulator. Every newsroom in the city is chasing the story.",
    severity: "high",
    category: "media",
    effects: ["Vane sentiment -22", "ZNT +6%", "Media reach +8%", "Government approval -4"],
    weight: 7,
  },
  {
    title: "Meme Liquidity Cascade",
    summary:
      "A single wallet has dumped 12% of MEMA supply into an already thin pool. Liquidations are cascading and the timeline has turned feral.",
    severity: "medium",
    category: "macro",
    effects: ["MEMA -26%", "Crypto volatility +14", "Retail sentiment -8"],
    weight: 7,
  },
  {
    title: "Cartel Truce Declared",
    summary:
      "The Archivist and the Dockside syndicates have agreed a temporary truce. Street violence is down, but the quiet is being used to move product at scale.",
    severity: "low",
    category: "crime",
    effects: ["City heat -10", "Smuggling margins +15%", "Police patrols -6"],
    weight: 6,
  },
  {
    title: "Sovereign Wealth Inflow",
    summary:
      "An unnamed sovereign fund has deployed $4.2B into district real estate. Property demand is spiking across Meridian and Helix Park.",
    severity: "medium",
    category: "macro",
    effects: ["Property demand +12", "Meridian price +6%", "VLT +2%", "Sentiment +5"],
    weight: 6,
  },
  {
    title: "Deepfake Governance Scandal",
    summary:
      "A synthetic video of Governor Vale endorsing a private prison contract has gone viral. It is fake. It is also too late.",
    severity: "high",
    category: "media",
    effects: ["Government approval -12", "Media credibility -8", "Public trust -7", "Regulatory pressure +4"],
    weight: 6,
  },
  {
    title: "Stablecoin De-Peg Event",
    summary:
      "A mid-cap stablecoin has broken its peg after a reserve attestation failed. Treasury desks are unwinding collateral into OMX and gas fees are spiking.",
    severity: "critical",
    category: "macro",
    effects: ["SYN -18%", "OMX +6%", "GAS +14%", "Bank deposits -3%"],
    weight: 5,
  },
  {
    title: "Election Year Spending Spree",
    summary:
      "The district government has announced a stimulus package ahead of the vote. Infrastructure contractors and media companies are the first to price it in.",
    severity: "medium",
    category: "regulation",
    effects: ["ISP demand +9", "Media revenue +8%", "Approval +6", "Corp tax -1"],
    weight: 6,
  },
];

export function createLocalEvent(state: GameState): WorldEvent {
  const weights = TEMPLATES.map((t) => {
    let weight = t.weight;
    if (t.category === "regulation" && state.government.regulatoryPressure > 60) weight += 5;
    if (t.category === "crime" && state.underworld.heat > 60) weight += 5;
    if (t.category === "tech" && state.world.sentiment > 60) weight += 3;
    if (t.category === "infrastructure" && state.isp.uptime < 99) weight += 4;
    return weight;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  let template = TEMPLATES[0];
  for (let i = 0; i < TEMPLATES.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) {
      template = TEMPLATES[i];
      break;
    }
  }
  return {
    id: uid("evt"),
    title: template.title,
    summary: template.summary,
    severity: template.severity,
    category: template.category,
    effects: template.effects,
    tick: state.world.tick,
    day: state.world.day,
    source: "local",
  };
}

function shockAsset(state: GameState, id: string, pct: number) {
  const asset = state.assets.find((a) => a.id === id);
  if (!asset) return;
  asset.price = Math.max(0.00005, roundPrice(asset.price * (1 + pct / 100)));
  asset.history.push(asset.price);
  if (asset.history.length > 96) asset.history.shift();
  asset.sentiment = clamp(asset.sentiment + pct / 2, -100, 100);
}

export function applyWorldEvent(state: GameState, event: WorldEvent) {
  state.world.sentiment = clamp(state.world.sentiment + (event.severity === "critical" ? -6 : 3), 2, 98);
  state.world.volatility = clamp(
    state.world.volatility + (event.severity === "critical" ? 14 : event.severity === "high" ? 8 : 3),
    8,
    98,
  );

  switch (event.title) {
    case "Global Supply Chain Collapse": {
      shockAsset(state, "ark", -9);
      shockAsset(state, "nva", 3);
      const dockside = state.districts.find((d) => d.id === "dockside");
      if (dockside) {
        dockside.demand = clamp(dockside.demand - 12, 1, 100);
        dockside.price = Math.round(dockside.price * 0.97);
      }
      state.world.sentiment -= 8;
      break;
    }
    case "AI Tech Boom": {
      shockAsset(state, "omn", 8);
      shockAsset(state, "znt", 4);
      state.world.sentiment += 10;
      state.corporate.valuation = Math.round(state.corporate.valuation * 1.04);
      break;
    }
    case "Regulatory Crackdown": {
      state.assets.filter((a) => a.kind === "crypto").forEach((a) => shockAsset(state, a.id, -12));
      state.government.regulatoryPressure = clamp(state.government.regulatoryPressure + 14, 0, 100);
      state.underworld.heat = clamp(state.underworld.heat + 6, 0, 100);
      state.world.volatility += 12;
      break;
    }
    case "Central Bank Emergency Cut": {
      state.assets.filter((a) => a.kind === "stock").forEach((a) => shockAsset(state, a.id, 4));
      state.bank.lendingRate = Math.max(2, state.bank.lendingRate - 1.2);
      state.world.sentiment += 7;
      break;
    }
    case "Backbone Blackout": {
      state.isp.nodes.forEach((n) => {
        n.load = clamp(n.load + 28, 0, 140);
        n.health = clamp(n.health - 11, 0, 100);
        n.status = n.health < 20 ? "offline" : n.health < 55 ? "degraded" : "online";
      });
      state.isp.reputation = clamp(state.isp.reputation - 7, 0, 100);
      shockAsset(state, "gas", 9);
      state.world.cyberThreat = clamp(state.world.cyberThreat + 10, 0, 100);
      break;
    }
    case "Media Leak: The Vane Tapes": {
      const vane = state.corporate.rivals.find((r) => r.id === "rival-1");
      if (vane) vane.sentiment = clamp(vane.sentiment - 22, -100, 100);
      shockAsset(state, "znt", 6);
      state.media.channels.forEach((c) => {
        c.reach = Math.round(c.reach * 1.08);
        c.credibility = clamp(c.credibility + 3, 0, 100);
      });
      state.government.approval = clamp(state.government.approval - 4, 0, 100);
      break;
    }
    case "Meme Liquidity Cascade": {
      shockAsset(state, "mema", -26);
      state.world.volatility += 14;
      state.world.sentiment -= 8;
      break;
    }
    case "Cartel Truce Declared": {
      state.underworld.heat = clamp(state.underworld.heat - 10, 0, 100);
      state.districts.forEach((d) => {
        if (d.crime > 30) d.crime = clamp(d.crime - 4, 0, 100);
        d.police = clamp(d.police - 3, 0, 100);
      });
      break;
    }
    case "Sovereign Wealth Inflow": {
      state.districts.forEach((d) => {
        d.demand = clamp(d.demand + 12, 1, 100);
      });
      ["meridian", "helix"].forEach((id) => {
        const d = state.districts.find((x) => x.id === id);
        if (d) d.price = Math.round(d.price * 1.06);
      });
      shockAsset(state, "vlt", 2);
      state.world.sentiment += 5;
      break;
    }
    case "Deepfake Governance Scandal": {
      state.government.approval = clamp(state.government.approval - 12, 0, 100);
      state.media.channels.forEach((c) => (c.credibility = clamp(c.credibility - 8, 0, 100)));
      state.media.publicTrust = clamp(state.media.publicTrust - 7, 0, 100);
      state.government.regulatoryPressure = clamp(state.government.regulatoryPressure + 4, 0, 100);
      break;
    }
    case "Stablecoin De-Peg Event": {
      shockAsset(state, "syn", -18);
      shockAsset(state, "omx", 6);
      shockAsset(state, "gas", 14);
      state.bank.deposits = Math.round(state.bank.deposits * 0.97);
      state.bank.reserves = Math.round(state.bank.reserves * 0.97);
      break;
    }
    case "Election Year Spending Spree": {
      state.isp.subscribers = Math.round(state.isp.subscribers * 1.05);
      state.media.channels.forEach((c) => (c.revenue = Math.round(c.revenue * 1.08)));
      state.government.approval = clamp(state.government.approval + 6, 0, 100);
      state.government.corpTax = Math.max(5, state.government.corpTax - 1);
      break;
    }
    default: {
      // Grok-generated event: prefer explicit model-supplied shocks, then fall
      // back to a coherent category-level shock.
      const crypto = state.assets.filter((a) => a.kind === "crypto");
      const stocks = state.assets.filter((a) => a.kind === "stock");
      const direction = event.severity === "critical" ? -1 : Math.random() > 0.45 ? 1 : -1;
      if (event.shocks && Object.keys(event.shocks).length > 0) {
        for (const [id, pct] of Object.entries(event.shocks)) {
          shockAsset(state, id, pct);
        }
        state.world.sentiment = clamp(
          state.world.sentiment + direction * (event.severity === "critical" ? 5 : 2),
          2,
          98,
        );
      } else if (event.category === "regulation") {
        crypto.forEach((a) => shockAsset(state, a.id, direction * rand(5, 14)));
        state.government.regulatoryPressure = clamp(
          state.government.regulatoryPressure + Math.abs(direction) * 8,
          0,
          100,
        );
      } else if (event.category === "tech") {
        shockAsset(state, "omn", 7);
        shockAsset(state, "znt", 4);
      } else if (event.category === "infrastructure") {
        state.isp.nodes.forEach((n) => (n.health = clamp(n.health - 8, 0, 100)));
        state.world.cyberThreat = clamp(state.world.cyberThreat + 8, 0, 100);
      } else if (event.category === "crime") {
        state.underworld.heat = clamp(state.underworld.heat + 6, 0, 100);
        state.districts.forEach((d) => (d.crime = clamp(d.crime + 1.5, 0, 100)));
      } else if (event.category === "media") {
        state.media.channels.forEach((c) => (c.credibility = clamp(c.credibility - 4, 0, 100)));
        state.media.publicTrust = clamp(state.media.publicTrust - 3, 0, 100);
      } else {
        stocks.forEach((a) => shockAsset(state, a.id, direction * rand(1.5, 6)));
        crypto.forEach((a) => shockAsset(state, a.id, direction * rand(3, 10)));
      }
      break;
    }
  }

  state.world.events.unshift(event);
  state.world.events = state.world.events.slice(0, 12);
  const tone = event.severity === "critical" ? "negative" : event.category === "tech" ? "positive" : "neutral";
  state.world.news.unshift({
    id: uid("news"),
    text: event.title,
    tone,
    time: "now",
  });
  state.world.news = state.world.news.slice(0, 8);
  state.world.nextEventIn = randInt(7, 14);

  // Grok also issues a concrete order to one of the autonomous rivals. This is
  // what makes the NPCs feel like they are reading the same world state.
  const directive = event.directive;
  if (directive) {
    const rival =
      state.corporate.rivals.find((item) => item.name === directive.rival) ??
      state.corporate.rivals.find((item) => item.ceo === directive.rival);
    const target = state.assets.find(
      (asset) =>
        asset.id === directive.target ||
        asset.ticker.toLowerCase() === (directive.target ?? "").toLowerCase(),
    );

    if (rival) {
      switch (directive.action) {
        case "accumulate":
          if (target) shockAsset(state, target.id, rand(2.5, 7));
          rival.netWorth = Math.round(rival.netWorth * (1 + rand(0.002, 0.008)));
          break;
        case "dump":
          if (target) shockAsset(state, target.id, -rand(3, 9));
          rival.netWorth = Math.round(rival.netWorth * (1 - rand(0.001, 0.005)));
          state.world.sentiment = clamp(state.world.sentiment - rand(1, 3), 2, 98);
          break;
        case "lobby":
          state.government.regulatoryPressure = clamp(
            state.government.regulatoryPressure + rand(3, 8),
            0,
            100,
          );
          state.government.approval = clamp(state.government.approval - rand(0, 2), 0, 100);
          break;
        case "cyber":
          state.world.cyberThreat = clamp(state.world.cyberThreat + rand(4, 10), 0, 100);
          state.isp.nodes.forEach((node) => {
            node.health = clamp(node.health - rand(1, 5), 0, 100);
          });
          break;
        case "media":
          state.media.channels.forEach((channel) => {
            channel.credibility = clamp(channel.credibility - rand(1, 4), 0, 100);
          });
          state.player.reputation = clamp(state.player.reputation - rand(1, 3), 0, 100);
          break;
        case "acquire":
          state.corporate.valuation = Math.round(
            state.corporate.valuation * (1 - rand(0.004, 0.016)),
          );
          rival.netWorth = Math.round(rival.netWorth * (1 + rand(0.004, 0.012)));
          break;
      }
      state.world.news.unshift({
        id: uid("news"),
        text: `${rival.ceo} (${rival.name}) ${directive.action}s ${directive.target ?? "the market"}`,
        tone: directive.action === "accumulate" ? "positive" : "negative",
        time: "now",
      });
      state.world.news = state.world.news.slice(0, 8);
      state.toasts.push({
        id: uid("toast"),
        message: `Rival move · ${rival.name}: ${directive.rationale || directive.action}`,
        tone: "info",
      });
    }
  }
}

// ---------------------------------------------------------------------------
// NPC behaviour
// ---------------------------------------------------------------------------

const NPC_POSTS = [
  {
    author: "Silas Vane",
    handle: "silasvane",
    role: "Chairman, Vane Capital",
    color: "#F5C451",
    verified: true,
    content: [
      "I see the retail crowd is discovering leverage again. Adorable. The clearing desk thanks you for your donation.",
      "Axiom's burn rate is a public document. So is my patience. One of them runs out this quarter.",
      "Anyone selling OMN into this strength is negotiating against the wrong balance sheet.",
    ],
    tags: ["$OMN", "Markets"],
  },
  {
    author: "The Archivist",
    handle: "0xarchivist",
    role: "Syndicate · unverified",
    color: "#FF6B6B",
    verified: false,
    content: [
      "Every audit trail is a story someone chose to write. I prefer to edit.",
      "ZRO is not a privacy coin. It is an honesty coin. It just happens to be honest about who is lying.",
      "Dockside port authority changed its rotation schedule at 03:00. Amateur hour.",
    ],
    tags: ["$ZRO", "Dockside"],
  },
  {
    author: "Kenji Mori",
    handle: "kenjimori",
    role: "CEO, Kuro Media Group",
    color: "#FF8FB1",
    verified: true,
    content: [
      "Ratings are not a popularity contest. They are a record of what the city is afraid of this week.",
      "Signal 9 calls it investigative journalism. I call it a content strategy with a legal budget.",
      "The Media Integrity Levy is a tax on attention. Attention is the only asset that cannot be printed.",
    ],
    tags: ["Media", "$ZNT"],
  },
  {
    author: "Dr. Imani Cross",
    handle: "imanicross",
    role: "CEO, Helix Biotech",
    color: "#B69CFF",
    verified: true,
    content: [
      "Our Phase III readout is in two weeks. The market is pricing certainty. The market is wrong.",
      "Regulatory capture is not a conspiracy. It is a line item.",
      "Helix Park is the only district in this city where the silence is actually expensive.",
    ],
    tags: ["$HLX", "Biotech"],
  },
  {
    author: "Neon Ghost",
    handle: "neonghost",
    role: "Anonymous · 0x8f...2c1",
    color: "#7CF7C4",
    verified: false,
    content: [
      "Someone just moved 1.2M OMX off a cold wallet into a fresh DEX pair. No KYC. No sleep.",
      "The city's backbone has a single point of failure and it is owned by a man who collects vintage cars.",
      "MEMA's top 10 wallets hold 63%. The community is not the community.",
    ],
    tags: ["$OMX", "DEX"],
  },
  {
    author: "Governor Ada Vale",
    handle: "adavale",
    role: "Governor · District 1",
    color: "#7FB2FF",
    verified: true,
    content: [
      "Tonight I am signing the infrastructure transparency order. The pipes belong to the public.",
      "A city that cannot regulate its own data centres has outsourced its sovereignty.",
      "To the executives who called my office today: the answer is still no. Try a better argument.",
    ],
    tags: ["Policy", "Infrastructure"],
  },
];

export function createNpcPost(state: GameState) {
  const npc = pick(NPC_POSTS);
  const content = pick(npc.content);
  const mentions = state.assets.filter((a) => Math.random() > 0.7).slice(0, 1).map((a) => a.ticker);
  const tags = [...npc.tags, ...mentions.map((m) => `$${m}`)];
  return {
    id: uid("post"),
    author: npc.author,
    handle: npc.handle,
    role: npc.role,
    content,
    time: "now",
    likes: randInt(120, 4_800),
    replies: randInt(12, 480),
    reposts: randInt(8, 320),
    sentiment: pick(["bullish", "bearish", "neutral", "chaotic"] as const),
    tags,
    verified: npc.verified,
    color: npc.color,
  };
}

export function npcAction(state: GameState) {
  const rival = pick(state.corporate.rivals);
  const roll = Math.random();
  if (roll < 0.22) {
    // Rival pumps or dumps an asset.
    const target = pick(state.assets);
    const direction = Math.random() > 0.5 ? 1 : -1;
    const pct = direction * rand(1.5, 7) * (rival.aggression / 80);
    target.price = Math.max(0.00005, roundPrice(target.price * (1 + pct / 100)));
    target.history.push(target.price);
    if (target.history.length > 96) target.history.shift();
    state.world.news.unshift({
      id: uid("news"),
      text: `${rival.ceo} ${direction > 0 ? "accumulates" : "dumps"} ${target.ticker}`,
      tone: direction > 0 ? "positive" : "negative",
      time: "now",
    });
  } else if (roll < 0.4) {
    // Rival buys influence.
    state.government.regulatoryPressure = clamp(
      state.government.regulatoryPressure + rand(-3, 4),
      0,
      100,
    );
  } else if (roll < 0.55) {
    // Competitive pressure.
    state.corporate.valuation = Math.round(state.corporate.valuation * (1 - rand(0.001, 0.009)));
    state.corporate.rivals.forEach((r: Rival) => (r.netWorth *= 1 + rand(-0.002, 0.008)));
  } else if (roll < 0.7) {
    // Cyber probing.
    state.world.cyberThreat = clamp(state.world.cyberThreat + rand(1, 5), 0, 100);
    state.isp.nodes.forEach((n) => (n.health = clamp(n.health - rand(0.2, 1.4), 0, 100)));
  }
  state.world.news = state.world.news.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Tick
// ---------------------------------------------------------------------------

export function simulateTick(state: GameState) {
  if (state.world.paused) return;
  state.world.tick += 1;
  if (state.world.tick % 48 === 0) {
    state.world.day += 1;
    state.stats.daysSurvived += 1;
    // Roll the daily reference price. The 24h change column now measures the
    // current session rather than drifting from the seed forever.
    state.assets.forEach((asset) => {
      asset.prevClose = asset.price;
    });
  }
  const phaseTick = state.world.tick % 48;
  state.world.phase = phaseTick < 5 ? "Pre-Market" : phaseTick > 40 ? "After-Hours" : "Open";

  runMarketTick(state);

  // ISP operations
  const isp = state.isp;
  isp.nodes.forEach((node) => {
    const district = state.districts.find((d) => d.id === node.districtId);
    const congestion = node.load / Math.max(1, node.capacity);
    node.load = clamp(node.load + (Math.random() - 0.48) * 7, 4, node.capacity * 1.4);
    if (congestion > 0.92) node.health = clamp(node.health - rand(0.6, 1.8), 0, 100);
    else if (node.health < 100 && isp.autoRepair) node.health = clamp(node.health + 0.35, 0, 100);
    node.status = node.health <= 0 ? "offline" : node.health < 45 || node.load > node.capacity ? "degraded" : "online";
    node.latency = Math.max(2, Math.round(3 + node.load / Math.max(1, node.capacity) * 14 + (100 - node.health) * 0.12 + (district ? district.crime * 0.03 : 0)));
  });
  const onlineNodes = isp.nodes.filter((n) => n.status !== "offline").length;
  const capacity = isp.nodes.reduce((s, n) => s + n.capacity, 0);
  const load = isp.nodes.reduce((s, n) => s + n.load, 0);
  const quality = onlineNodes / Math.max(1, isp.nodes.length);
  isp.uptime = round2(clamp(isp.uptime + (quality - 0.82) * 0.012, 95, 100));
  const pricePressure = 1 - clamp((isp.pricePerGb - 0.45) / 1.7, 0, 0.8);
  const subscriberDelta = Math.round(isp.subscribers * (quality - 0.72) * 0.0016 * pricePressure);
  isp.subscribers = Math.max(1000, isp.subscribers + subscriberDelta);
  isp.reputation = clamp(isp.reputation + (quality - 0.75) * 0.18, 0, 100);
  const ispRevenue = Math.round(isp.subscribers * isp.pricePerGb * 0.07);
  state.player.cash += ispRevenue;
  state.stats.lifetimeEarnings += ispRevenue;

  // Bank
  if (state.bank.founded) {
    const bank = state.bank;
    const interestIncome = (bank.loans * bank.lendingRate) / 100 / 1440;
    const interestExpense = (bank.deposits * bank.depositRate) / 100 / 1440;
    bank.capital += interestIncome - interestExpense;
    bank.loans += interestIncome * 0.25;
    bank.deposits += interestExpense;
    const ratio = (bank.reserves / Math.max(1, bank.deposits)) * 100;
    bank.status =
      ratio < 4 ? "critical" : ratio < bank.reserveRatio ? "strained" : "stable";
    bank.history.push(Math.round(bank.capital));
    if (bank.history.length > 48) bank.history.shift();
    if (bank.status === "critical" && Math.random() < 0.035) {
      const drained = Math.round(bank.deposits * rand(0.12, 0.32));
      bank.deposits -= drained;
      bank.reserves = Math.max(0, bank.reserves - drained);
      bank.runs += 1;
      state.world.news.unshift({
        id: uid("news"),
        text: `Run on ${bank.name}: ${isMoney(drained)} withdrawn in minutes`,
        tone: "negative",
        time: "now",
      });
      state.toasts.push({
        id: uid("toast"),
        message: `Bank run detected at ${bank.name}. ${isMoney(drained)} drained.`,
        tone: "error",
      });
    }
    if (bank.status === "critical" && bank.reserves <= 0) {
      bank.status = "collapsed";
      bank.capital = 0;
    }
  }

  // Media
  state.media.channels.forEach((channel) => {
    const drift = (state.media.publicTrust - 50) / 5000;
    channel.reach = Math.max(10_000, Math.round(channel.reach * (1 + drift + rand(-0.004, 0.009))));
    channel.credibility = clamp(channel.credibility + rand(-0.25, 0.25), 0, 100);
    const revenue = Math.round(channel.reach * 0.012 * (0.5 + channel.credibility / 100) + channel.shows.reduce((s, show) => s + show.revenue * 0.02, 0));
    channel.revenue = revenue;
    state.player.cash += revenue;
    state.stats.lifetimeEarnings += revenue;
  });
  state.media.campaigns = state.media.campaigns
    .map((c) => ({ ...c, status: state.world.tick - c.createdAt > 18 ? "completed" as const : c.status }))
    .slice(0, 12);

  // Corporate operations
  const corp = state.corporate;
  if (corp.founded) {
    const growth = ((state.world.sentiment - 50) / 2200 + corp.rnd / 9000 + corp.pr / 12000 - corp.rivals.reduce((s, r) => s + r.aggression, 0) / 400000);
    corp.valuation = Math.max(250_000, Math.round(corp.valuation * (1 + growth + rand(-0.003, 0.006))));
    if (!corp.history) corp.history = [corp.valuation];
    corp.history.push(corp.valuation);
    if (corp.history.length > 64) corp.history.shift();
    const revenue = Math.round((corp.employees * 900 + corp.rnd * 1200) * (0.8 + state.world.sentiment / 250));
    corp.revenue = revenue;
    state.player.cash += Math.round(revenue * 0.16);
    state.stats.lifetimeEarnings += Math.round(revenue * 0.16);
  }
  corp.rivals.forEach((r) => {
    r.netWorth = Math.round(r.netWorth * (1 + rand(-0.004, 0.011)));
    r.sentiment = clamp(r.sentiment + rand(-1, 1), -100, 100);
  });

  // Underworld
  state.underworld.heat = clamp(state.underworld.heat - 0.22 - state.underworld.protection * 0.02, 0, 100);
  if (state.underworld.laundering > 0 && state.underworld.dirtyCash > 0) {
    const washed = Math.min(state.underworld.dirtyCash, Math.round(state.underworld.laundering * 0.06));
    state.underworld.dirtyCash -= washed;
    state.player.cash += Math.round(washed * 0.82);
    state.underworld.heat = clamp(state.underworld.heat + 0.08, 0, 100);
  }
  if (state.underworld.heat > 72 && Math.random() < 0.012) {
    state.underworld.warrants += 1;
    state.government.warrants += 1;
    state.world.news.unshift({
      id: uid("news"),
      text: "Grand jury issues sealed warrant tied to syndicate operations",
      tone: "negative",
      time: "now",
    });
  }

  // Government
  state.government.regulatoryPressure = clamp(
    state.government.regulatoryPressure + rand(-0.25, 0.3) + (state.underworld.heat > 50 ? 0.08 : 0),
    0,
    100,
  );
  state.government.bills.forEach((bill) => {
    if (bill.status === "voting") {
      bill.votes = clamp(bill.votes + randInt(-1, 2), 0, 100);
      if (bill.votes >= 50) {
        bill.status = "passed";
        state.world.news.unshift({
          id: uid("news"),
          text: `Bill passed: ${bill.title}`,
          tone: "neutral",
          time: "now",
        });
      } else if (bill.votes < 18) {
        bill.status = "rejected";
      }
    }
  });
  if (state.government.warrants > 0 && Math.random() < 0.004) {
    state.government.warrants = Math.max(0, state.government.warrants - 1);
    state.underworld.warrants = Math.max(0, state.underworld.warrants - 1);
  }

  // Districts drift
  state.districts.forEach((district) => {
    district.crime = clamp(district.crime + rand(-0.25, 0.25) + (state.underworld.heat - 40) / 900, 0, 100);
    district.demand = clamp(district.demand + rand(-0.2, 0.2) + (state.world.sentiment - 50) / 800, 1, 100);
    const target = district.basePrice * (0.65 + district.demand / 180) * (1.18 - district.crime / 260);
    district.price = Math.max(50_000, Math.round(district.price * 0.998 + target * 0.002));
    if (district.owned) {
      const income = Math.round(district.income * (0.7 + district.demand / 220) * (1 - district.crime / 300));
      state.player.cash += income;
      state.stats.lifetimeEarnings += income;
    }
  });

  // World event scheduling and NPC life
  state.world.nextEventIn -= 1;
  if (state.world.nextEventIn <= 0) {
    applyWorldEvent(state, createLocalEvent(state));
  }
  if (state.world.tick % 6 === 0) npcAction(state);
  if (state.world.tick % 9 === 0) {
    state.posts.unshift(createNpcPost(state));
    state.posts = state.posts.slice(0, 40);
  }
  state.posts.forEach((post) => {
    post.likes += Math.random() < 0.35 ? randInt(1, 22) : 0;
    post.replies += Math.random() < 0.1 ? 1 : 0;
  });

  // XP / levelling
  state.player.xp += 0.12;
  if (state.player.xp >= 100) {
    state.player.xp -= 100;
    state.player.level += 1;
    state.player.influence += 45;
    state.player.prestige += 1;
  }

  // Ledger and net worth
  const worth = netWorth(state);
  state.stats.netWorthHistory.push(worth);
  if (state.stats.netWorthHistory.length > 96) state.stats.netWorthHistory.shift();
  state.stats.peakNetWorth = Math.max(state.stats.peakNetWorth, worth);
  state.lastSaved = Date.now();

  state.toasts = state.toasts.slice(-4);
}

export function isMoney(value: number) {
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${Math.round(value)}`;
}

export function crimeSuccessChance(op: UnderworldState["operations"][number], heat: number) {
  return clamp(op.risk + heat * 0.45 + op.heat * 0.4, 2, 92);
}
