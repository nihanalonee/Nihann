import type {
  Agent,
  Archetype,
  Bank,
  Corporation,
  District,
  GameState,
  Government,
  IspNode,
  Law,
  MediaOutlet,
  Player,
  Post,
  Syndicate,
  Token,
  WorldEvent,
} from "./types";

export const ARCHETYPES: Record<
  Archetype,
  {
    label: string;
    tagline: string;
    description: string;
    cash: number;
    influence: number;
    heat: number;
    reputation: number;
    perks: string[];
  }
> = {
  tycoon: {
    label: "Tycoon",
    tagline: "Own the ground beneath them.",
    description:
      "A dealmaker with a nose for distressed assets. Property is cheaper, rents run hotter, and the city listens when you speak.",
    cash: 2_400_000,
    influence: 28,
    heat: 4,
    reputation: 54,
    perks: ["-12% property acquisition", "+18% property rent"],
  },
  banker: {
    label: "Banker",
    tagline: "Liquidity is a weapon.",
    description:
      "You understand that every empire is a spreadsheet with a pulse. Loans are cheaper and your first bank costs less.",
    cash: 3_100_000,
    influence: 38,
    heat: 2,
    reputation: 61,
    perks: ["-30% bank charter cost", "-20% loan interest"],
  },
  hacker: {
    label: "Ghost",
    tagline: "The grid is your inheritance.",
    description:
      "You were never in the room. You were in the walls. Heat decays faster and every intrusion cuts deeper.",
    cash: 2_050_000,
    influence: 17,
    heat: 18,
    reputation: 33,
    perks: ["-35% heat gain", "+15% hack yield"],
  },
  mogul: {
    label: "Mogul",
    tagline: "Reality is a broadcast.",
    description:
      "Attention is the only scarce asset. Your outlets earn more and your narratives move markets harder.",
    cash: 2_300_000,
    influence: 45,
    heat: 3,
    reputation: 48,
    perks: ["+22% media income", "+30% propaganda potency"],
  },
};

const corporations: Corporation[] = [
  {
    id: "helix",
    name: "Helix Dynamics",
    ticker: "HELX",
    sector: "Biotech",
    owner: "Dr. Imani Vale",
    ownerId: "agent-vale",
    sharePrice: 184.2,
    sharesOutstanding: 12_400_000,
    sentiment: 71,
    revenue: 4_200_000,
    description: "Synthetic organ printing and black-site longevity research.",
    color: "#61f7c1",
    history: [172, 175, 173, 179, 181, 178, 184.2],
  },
  {
    id: "arcl",
    name: "ArcLight Energy",
    ticker: "ARCL",
    sector: "Energy",
    owner: "Jin Tao",
    ownerId: "agent-jin",
    sharePrice: 62.8,
    sharesOutstanding: 38_000_000,
    sentiment: 52,
    revenue: 9_800_000,
    description: "Fusion micro-grids for the districts that the state forgot.",
    color: "#ffb347",
    history: [66, 65, 64, 63, 64, 63, 62.8],
  },
  {
    id: "nova",
    name: "Nova Aerospace",
    ticker: "NOVA",
    sector: "Aerospace",
    owner: "Yuri Volkov",
    ownerId: "agent-yuri",
    sharePrice: 311.5,
    sharesOutstanding: 6_200_000,
    sentiment: 64,
    revenue: 6_100_000,
    description: "Orbital logistics and private surveillance constellations.",
    color: "#8ea8ff",
    history: [298, 301, 307, 304, 309, 313, 311.5],
  },
  {
    id: "voss",
    name: "Voss Media Group",
    ticker: "VOSS",
    sector: "Media",
    owner: "Dorian Voss",
    ownerId: "agent-voss",
    sharePrice: 91.4,
    sharesOutstanding: 22_000_000,
    sentiment: 43,
    revenue: 5_400_000,
    description: "Nine networks. One narrative. Yours, if you can afford it.",
    color: "#ff7ab6",
    history: [96, 94, 97, 95, 93, 92, 91.4],
  },
  {
    id: "krnl",
    name: "Kernel Systems",
    ticker: "KRNL",
    sector: "Infrastructure",
    owner: "Sable Mori",
    ownerId: "agent-sable",
    sharePrice: 147.9,
    sharesOutstanding: 11_000_000,
    sentiment: 77,
    revenue: 3_900_000,
    description: "The switch fabric underneath half the city's internet traffic.",
    color: "#b6ff4d",
    history: [138, 141, 139, 144, 146, 145, 147.9],
  },
  {
    id: "merd",
    name: "Meridian Bank",
    ticker: "MERD",
    sector: "Finance",
    owner: "Vale Okonkwo",
    ownerId: "agent-vale",
    sharePrice: 44.2,
    sharesOutstanding: 54_000_000,
    sentiment: 38,
    revenue: 12_600_000,
    description: "Systemically important. That is the whole business model.",
    color: "#c9d1ff",
    history: [47, 46, 45, 46, 45, 44.8, 44.2],
  },
];

const tokens: Token[] = [
  {
    id: "omni",
    name: "OmniCoin",
    symbol: "OMNI",
    creator: "The Syndicate",
    creatorId: "protocol",
    credits: 21_400_000,
    supply: 500_000,
    liquidity: 21_400_000,
    volume: 3_900_000,
    price: 42.8,
    change24h: 6.4,
    holders: 182_401,
    rugged: false,
    risk: 8,
    color: "#c8ff4d",
    history: [38.1, 39.4, 38.8, 40.2, 41.5, 41.2, 42.8],
  },
  {
    id: "void",
    name: "VoidCash",
    symbol: "VOID",
    creator: "Sable Mori",
    creatorId: "agent-sable",
    credits: 1_920_000,
    supply: 1_350_000,
    liquidity: 1_920_000,
    volume: 840_000,
    price: 1.42,
    change24h: -3.8,
    holders: 44_202,
    rugged: false,
    risk: 38,
    color: "#8ea8ff",
    history: [1.52, 1.49, 1.51, 1.47, 1.45, 1.47, 1.42],
  },
  {
    id: "neon",
    name: "NeonYield",
    symbol: "NEON",
    creator: "Mara Kessler",
    creatorId: "agent-mara",
    credits: 7_830_000,
    supply: 900_000,
    liquidity: 7_830_000,
    volume: 1_740_000,
    price: 8.7,
    change24h: 12.1,
    holders: 91_337,
    rugged: false,
    risk: 22,
    color: "#ff7ab6",
    history: [7.2, 7.4, 7.1, 7.9, 8.2, 8.5, 8.7],
  },
  {
    id: "ash",
    name: "AshToken",
    symbol: "ASH",
    creator: "Alistair Crowe",
    creatorId: "agent-crowe",
    credits: 73_000,
    supply: 10_500_000,
    liquidity: 73_000,
    volume: 412_000,
    price: 0.00695,
    change24h: 48.6,
    holders: 18_209,
    rugged: false,
    risk: 84,
    color: "#ff6b4a",
    history: [0.0041, 0.0047, 0.0044, 0.0055, 0.0061, 0.0058, 0.00695],
  },
  {
    id: "gov",
    name: "CivicDAO",
    symbol: "GOV",
    creator: "Civic Foundation",
    creatorId: "gov",
    credits: 2_180_000,
    supply: 1_000_000,
    liquidity: 2_180_000,
    volume: 296_000,
    price: 2.18,
    change24h: -1.2,
    holders: 37_891,
    rugged: false,
    risk: 14,
    color: "#61f7c1",
    history: [2.21, 2.2, 2.17, 2.19, 2.16, 2.2, 2.18],
  },
  {
    id: "pulse",
    name: "PulseMedia",
    symbol: "PULSE",
    creator: "Dorian Voss",
    creatorId: "agent-voss",
    credits: 861_000,
    supply: 980_000,
    liquidity: 861_000,
    volume: 188_000,
    price: 0.879,
    change24h: -6.7,
    holders: 26_440,
    rugged: false,
    risk: 31,
    color: "#ffb347",
    history: [0.94, 0.93, 0.91, 0.9, 0.92, 0.9, 0.879],
  },
];

const districts: District[] = [
  {
    id: "apex",
    name: "Apex Financial",
    kind: "Financial",
    price: 8_400_000,
    basePrice: 8_400_000,
    rentPerDay: 2_940,
    crime: 12,
    police: 88,
    demand: 94,
    ownerId: "agent-vale",
    ownerName: "Vale Okonkwo",
    color: "#c8ff4d",
    description: "Glass towers, quiet rooms, and decisions that price the rest of the city.",
    history: [8.0, 8.1, 8.2, 8.3, 8.5, 8.4, 8.4],
  },
  {
    id: "ghost",
    name: "Ghost Quarter",
    kind: "Tech Hub",
    price: 5_600_000,
    basePrice: 5_600_000,
    rentPerDay: 1_960,
    crime: 22,
    police: 58,
    demand: 88,
    ownerId: "agent-sable",
    ownerName: "Sable Mori",
    color: "#61f7c1",
    description: "Server farms in old textile mills. Nobody asks what the machines are thinking.",
    history: [5.2, 5.3, 5.5, 5.4, 5.6, 5.5, 5.6],
  },
  {
    id: "neon",
    name: "Neon Row",
    kind: "Entertainment",
    price: 3_200_000,
    basePrice: 3_200_000,
    rentPerDay: 1_120,
    crime: 38,
    police: 52,
    demand: 76,
    ownerId: null,
    ownerName: null,
    color: "#ff7ab6",
    description: "A hundred screens selling the same dream. The ad revenue pays for the police.",
    history: [3.0, 3.05, 3.1, 3.15, 3.1, 3.2, 3.2],
  },
  {
    id: "foundry",
    name: "The Foundry",
    kind: "Industrial",
    price: 1_800_000,
    basePrice: 1_800_000,
    rentPerDay: 630,
    crime: 28,
    police: 44,
    demand: 63,
    ownerId: "agent-jin",
    ownerName: "Jin Tao",
    color: "#ffb347",
    description: "Robotic assembly lines with a human maintenance crew that keeps shrinking.",
    history: [1.85, 1.84, 1.82, 1.79, 1.8, 1.81, 1.8],
  },
  {
    id: "helix",
    name: "Helix Park",
    kind: "Residential",
    price: 2_400_000,
    basePrice: 2_400_000,
    rentPerDay: 840,
    crime: 15,
    police: 72,
    demand: 81,
    ownerId: null,
    ownerName: null,
    color: "#8ea8ff",
    description: "Gated lawns, private clinics, and a waiting list measured in generations.",
    history: [2.3, 2.32, 2.35, 2.37, 2.38, 2.4, 2.4],
  },
  {
    id: "docks",
    name: "The Docks",
    kind: "Logistics",
    price: 1_100_000,
    basePrice: 1_100_000,
    rentPerDay: 385,
    crime: 64,
    police: 30,
    demand: 57,
    ownerId: "agent-crowe",
    ownerName: "Alistair Crowe",
    color: "#ff6b4a",
    description: "Shipping containers that arrive full and leave empty. The manifests are fiction.",
    history: [1.02, 1.04, 1.06, 1.05, 1.08, 1.09, 1.1],
  },
  {
    id: "civic",
    name: "Civic Center",
    kind: "Government",
    price: 6_800_000,
    basePrice: 6_800_000,
    rentPerDay: 2_380,
    crime: 9,
    police: 95,
    demand: 90,
    ownerId: "gov",
    ownerName: "Municipal Authority",
    color: "#c9d1ff",
    description: "Marble corridors where permits are issued, priced, and occasionally lost.",
    history: [6.6, 6.62, 6.7, 6.72, 6.75, 6.78, 6.8],
  },
  {
    id: "ashfall",
    name: "Ashfall",
    kind: "Slums",
    price: 420_000,
    basePrice: 420_000,
    rentPerDay: 147,
    crime: 82,
    police: 18,
    demand: 34,
    ownerId: null,
    ownerName: null,
    color: "#9b8cff",
    description: "The district the map forgets until an election. Cheap land, expensive silence.",
    history: [0.4, 0.41, 0.405, 0.41, 0.415, 0.42, 0.42],
  },
];

const isps: IspNode[] = [
  {
    id: "isp-meridian",
    name: "Meridian Backbone",
    kind: "datacenter",
    ownerId: "agent-vale",
    ownerName: "Vale Okonkwo",
    capacity: 100,
    load: 71,
    uptime: 99.7,
    latency: 18,
    revenuePerDay: 48_000,
    upkeep: 22_000,
    builtDay: 0,
    status: "online",
  },
  {
    id: "isp-ghost",
    name: "Ghostwire Relay",
    kind: "fiber",
    ownerId: "agent-sable",
    ownerName: "Sable Mori",
    capacity: 60,
    load: 83,
    uptime: 98.1,
    latency: 9,
    revenuePerDay: 31_000,
    upkeep: 9_000,
    builtDay: 0,
    status: "online",
  },
  {
    id: "isp-dock",
    name: "Dockside Dark Fiber",
    kind: "edge",
    ownerId: "agent-crowe",
    ownerName: "Alistair Crowe",
    capacity: 30,
    load: 44,
    uptime: 94.2,
    latency: 31,
    revenuePerDay: 14_000,
    upkeep: 3_000,
    builtDay: 0,
    status: "degraded",
  },
];

const media: MediaOutlet[] = [
  {
    id: "med-voss",
    name: "Voss Broadcast",
    kind: "tv",
    ownerId: "agent-voss",
    ownerName: "Dorian Voss",
    reach: 82,
    credibility: 31,
    hype: 74,
    revenuePerDay: 64_000,
    upkeep: 28_000,
    shows: [
      {
        id: "show-1",
        title: "The Night Ledger",
        quality: 78,
        audience: 4_200_000,
        revenue: 21_000,
        day: 0,
      },
    ],
  },
  {
    id: "med-cipher",
    name: "The Daily Cipher",
    kind: "news",
    ownerId: "agent-dorian",
    ownerName: "Dorian Voss",
    reach: 61,
    credibility: 72,
    hype: 48,
    revenuePerDay: 22_000,
    upkeep: 8_000,
    shows: [],
  },
  {
    id: "med-pulse",
    name: "Pulse Streaming",
    kind: "streaming",
    ownerId: "agent-vale",
    ownerName: "Vale Okonkwo",
    reach: 54,
    credibility: 66,
    hype: 58,
    revenuePerDay: 29_000,
    upkeep: 11_000,
    shows: [],
  },
];

const banks: Bank[] = [
  {
    id: "bank-meridian",
    name: "Meridian Central",
    ownerId: "agent-vale",
    ownerName: "Vale Okonkwo",
    reserves: 220_000_000,
    deposits: 940_000_000,
    loans: 710_000_000,
    rate: 6.4,
    reputation: 84,
    status: "stable",
    foundedDay: 0,
  },
  {
    id: "bank-ash",
    name: "Ashfall Credit Union",
    ownerId: "agent-crowe",
    ownerName: "Alistair Crowe",
    reserves: 4_100_000,
    deposits: 61_000_000,
    loans: 58_700_000,
    rate: 14.8,
    reputation: 29,
    status: "strained",
    foundedDay: 0,
  },
  {
    id: "bank-voss",
    name: "Voss Capital",
    ownerId: "agent-voss",
    ownerName: "Dorian Voss",
    reserves: 71_000_000,
    deposits: 288_000_000,
    loans: 210_000_000,
    rate: 8.1,
    reputation: 63,
    status: "stable",
    foundedDay: 0,
  },
];

const syndicates: Syndicate[] = [
  {
    id: "pale",
    name: "The Pale Court",
    boss: "Alistair Crowe",
    specialty: "Smuggling & racketeering",
    power: 78,
    wealth: 1_400_000_000,
    heat: 61,
    color: "#ff6b4a",
  },
  {
    id: "ghostwire",
    name: "Ghostwire Collective",
    boss: "Sable Mori",
    specialty: "Cyber-intrusion & data brokerage",
    power: 64,
    wealth: 820_000_000,
    heat: 44,
    color: "#8ea8ff",
  },
  {
    id: "dockside",
    name: "Dockside Kings",
    boss: "Mara Kessler",
    specialty: "Laundering & protection",
    power: 51,
    wealth: 390_000_000,
    heat: 37,
    color: "#b6ff4d",
  },
];

const agents: Agent[] = [
  {
    id: "agent-vale",
    name: "Vale Okonkwo",
    title: "The Vulture",
    role: "banker",
    hue: 78,
    wealth: 3_400_000_000,
    aggression: 71,
    sentiment: 52,
    lastAction: "Quietly accumulated Meridian debt at 61 cents on the dollar.",
    status: "Hunting distressed assets",
  },
  {
    id: "agent-sable",
    name: "Sable Mori",
    title: "Ghostwire",
    role: "hacker",
    hue: 214,
    wealth: 1_150_000_000,
    aggression: 84,
    sentiment: 44,
    lastAction: "Rotated three botnets through Ghost Quarter before dawn.",
    status: "Scanning for weak ports",
  },
  {
    id: "agent-voss",
    name: "Dorian Voss",
    title: "The Anchor",
    role: "mogul",
    hue: 326,
    wealth: 2_100_000_000,
    aggression: 62,
    sentiment: 38,
    lastAction: "Killed a story. Sold the silence as a documentary.",
    status: "Manufacturing consensus",
  },
  {
    id: "agent-nadia",
    name: "Nadia Rahim",
    title: "The Regulator",
    role: "politician",
    hue: 160,
    wealth: 310_000_000,
    aggression: 48,
    sentiment: 61,
    lastAction: "Introduced the Crypto Transparency Act to a standing ovation.",
    status: "Drafting new leverage",
  },
  {
    id: "agent-jin",
    name: "Jin Tao",
    title: "Fiber Baron",
    role: "tycoon",
    hue: 32,
    wealth: 1_670_000_000,
    aggression: 57,
    sentiment: 66,
    lastAction: "Bought a bankrupt backbone for the price of its copper.",
    status: "Laying cable under the river",
  },
  {
    id: "agent-crowe",
    name: "Alistair Crowe",
    title: "Prince of Ash",
    role: "boss",
    hue: 14,
    wealth: 940_000_000,
    aggression: 91,
    sentiment: 22,
    lastAction: "Moved forty containers through Customs without a manifest.",
    status: "Collecting favors",
  },
  {
    id: "agent-mara",
    name: "Mara Kessler",
    title: "The Broker",
    role: "tycoon",
    hue: 105,
    wealth: 760_000_000,
    aggression: 66,
    sentiment: 57,
    lastAction: "Matched a laundering order with a shell company in three minutes.",
    status: "Balancing ledgers",
  },
  {
    id: "agent-yuri",
    name: "Yuri Volkov",
    title: "The Oligarch",
    role: "tycoon",
    hue: 246,
    wealth: 4_800_000_000,
    aggression: 74,
    sentiment: 47,
    lastAction: "Moved a satellite constellation into a rival's orbital slot.",
    status: "Expanding the sky",
  },
];

const events: WorldEvent[] = [
  {
    id: "event-seed-1",
    title: "Quiet liquidity crisis",
    description:
      "Ashfall Credit Union is buying time with overnight paper. Depositors have started asking questions in public.",
    category: "market",
    severity: "major",
    pulse: -4,
    sentiment: -8,
    crime: 3,
    regulation: 0,
    day: 1,
    expires: 4,
    source: "system",
  },
  {
    id: "event-seed-2",
    title: "Fiber cut under the river",
    description:
      "A maintenance barge severed two trunk lines. Dockside traffic is rerouting through Ghost Quarter at a premium.",
    category: "infrastructure",
    severity: "minor",
    pulse: -1,
    sentiment: -2,
    crime: 1,
    regulation: 0,
    day: 1,
    expires: 3,
    source: "system",
  },
];

const laws: Law[] = [
  {
    id: "law-1",
    title: "Crypto Transparency Act",
    summary: "All token issuers must disclose treasury wallets above $1M.",
    status: "proposed",
    effect: "Raises compliance costs; reduces rug-pull risk.",
    votes: 48,
  },
  {
    id: "law-2",
    title: "District Surveillance Expansion",
    summary: "Additional camera grid across the Docks and Ashfall.",
    status: "active",
    effect: "Crime falls in target districts; heat gain +8%.",
    votes: 71,
  },
  {
    id: "law-3",
    title: "Foreign Media Ownership Cap",
    summary: "Caps foreign ownership of broadcast licenses at 24%.",
    status: "proposed",
    effect: "Limits media acquisitions; credibility increases.",
    votes: 36,
  },
  {
    id: "law-4",
    title: "Industrial Subsidy Bill",
    summary: "Tax credits for automated manufacturing in the Foundry.",
    status: "active",
    effect: "Industrial property values rise 3% per day.",
    votes: 64,
  },
];

const government: Government = {
  taxRate: 2.4,
  corporateTax: 18,
  regulation: 46,
  treasury: 8_400_000_000,
  approval: 41,
  warrants: 0,
  laws,
  nextElection: 48,
};

const wire: Post[] = [
  {
    id: "post-1",
    author: "Dorian Voss",
    handle: "@theanchor",
    role: "Media Mogul",
    body: "A free press is priceless. That is why ours costs $9.99 a month.",
    sentiment: 0.2,
    likes: 4821,
    replies: 902,
    day: 1,
    tags: ["media", "voss"],
    verified: true,
  },
  {
    id: "post-2",
    author: "Sable Mori",
    handle: "@ghostwire",
    role: "Ghostwire Collective",
    body: "Your bank's security audit passed. I read the report before your board did.",
    sentiment: -0.3,
    likes: 12_402,
    replies: 2_311,
    day: 1,
    tags: ["security", "meridian"],
    verified: true,
  },
  {
    id: "post-3",
    author: "Nadia Rahim",
    handle: "@nadia_rahim",
    role: "City Regulator",
    body: "The Crypto Transparency Act is not against innovation. It is against disappearing with everyone's money.",
    sentiment: 0.6,
    likes: 7_230,
    replies: 1_882,
    day: 1,
    tags: ["policy", "crypto"],
    verified: true,
  },
  {
    id: "post-4",
    author: "Mara Kessler",
    handle: "@ledgerqueen",
    role: "Broker",
    body: "Three calls. Two shell companies. One very clean quarter. The city runs on paperwork.",
    sentiment: 0.1,
    likes: 3_102,
    replies: 441,
    day: 1,
    tags: ["underworld", "finance"],
    verified: true,
  },
  {
    id: "post-5",
    author: "Jin Tao",
    handle: "@darkfiber",
    role: "Fiber Baron",
    body: "Bandwidth is the only utility that gets cheaper until it becomes a weapon.",
    sentiment: 0.4,
    likes: 2_004,
    replies: 318,
    day: 1,
    tags: ["telecom", "arcl"],
    verified: false,
  },
];

function blankPlayer(): Player {
  return {
    id: "player",
    name: "Unnamed Operator",
    handle: "operator",
    email: "",
    archetype: "tycoon",
    cash: 2_400_000,
    influence: 28,
    reputation: 54,
    heat: 4,
    day: 1,
    netWorthHistory: [],
    holdings: {},
    stakes: {},
    stocks: {},
    properties: [],
    loans: [],
    perks: [],
    lastAction: "Arrived in the city with a clean identity and a dangerous idea.",
  };
}

export function createInitialState(
  profile?: Partial<Pick<Player, "name" | "handle" | "email" | "archetype">>,
): GameState {
  const archetype = profile?.archetype ?? "tycoon";
  const preset = ARCHETYPES[archetype];
  const player: Player = {
    ...blankPlayer(),
    name: profile?.name?.trim() || "Unnamed Operator",
    handle:
      profile?.handle?.trim().replace(/^@/, "") ||
      profile?.name?.trim().toLowerCase().replace(/\s+/g, "_") ||
      "operator",
    email: profile?.email?.trim().toLowerCase() ?? "",
    archetype,
    cash: preset.cash,
    influence: preset.influence,
    reputation: preset.reputation,
    heat: preset.heat,
    perks: [...preset.perks],
  };

  const seedDistricts = structuredClone(districts);
  const seedIsps = structuredClone(isps);
  const seedMedia = structuredClone(media);

  if (archetype === "tycoon") {
    const helix = seedDistricts.find((d) => d.id === "helix")!;
    helix.ownerId = "player";
    helix.ownerName = player.name;
    player.properties.push("helix");
  }

  if (archetype === "mogul") {
    seedMedia.push({
      id: "med-player",
      name: "Static Channel",
      kind: "streaming",
      ownerId: "player",
      ownerName: player.name,
      reach: 18,
      credibility: 54,
      hype: 61,
      revenuePerDay: 4_800,
      upkeep: 2_000,
      shows: [],
    });
  }

  if (archetype === "hacker") {
    seedIsps.push({
      id: "isp-player",
      name: "Null Route",
      kind: "edge",
      ownerId: "player",
      ownerName: player.name,
      capacity: 20,
      load: 12,
      uptime: 97.4,
      latency: 11,
      revenuePerDay: 3_600,
      upkeep: 900,
      builtDay: 1,
      status: "online",
    });
  }

  if (archetype === "banker") {
    player.cash -= 0;
  }

  const state: GameState = {
    version: 1,
    started: Boolean(profile),
    player,
    corporations: structuredClone(corporations),
    tokens: structuredClone(tokens),
    districts: seedDistricts,
    isps: seedIsps,
    media: seedMedia,
    banks: structuredClone(banks),
    syndicates: structuredClone(syndicates),
    agents: structuredClone(agents),
    events: structuredClone(events),
    wire: structuredClone(wire),
    government: structuredClone(government),
    day: 1,
    speed: 1,
    economy: 62,
    adminUnlocked: false,
    lastTickAt: Date.now(),
    seed: 7741,
    toasts: [],
  };

  const worth = computeNetWorth(state);
  state.player.netWorthHistory = [
    { day: 0, value: worth },
    { day: 1, value: worth },
  ];
  return state;
}

export function computeNetWorth(state: GameState): number {
  const p = state.player;
  let total = p.cash;
  for (const [tokenId, amount] of Object.entries(p.holdings)) {
    const token = state.tokens.find((t) => t.id === tokenId);
    if (token && !token.rugged) total += amount * token.price;
  }
  for (const [tokenId, amount] of Object.entries(p.stakes)) {
    const token = state.tokens.find((t) => t.id === tokenId);
    if (token && !token.rugged) total += amount * token.price;
  }
  for (const [corpId, shares] of Object.entries(p.stocks)) {
    const corp = state.corporations.find((c) => c.id === corpId);
    if (corp) total += shares * corp.sharePrice;
  }
  for (const id of p.properties) {
    const district = state.districts.find((d) => d.id === id);
    if (district) total += district.price;
  }
  for (const node of state.isps.filter((n) => n.ownerId === "player")) {
    total += node.capacity * 8_000;
  }
  for (const outlet of state.media.filter((m) => m.ownerId === "player")) {
    total += outlet.reach * 9_000;
  }
  for (const bank of state.banks.filter((b) => b.ownerId === "player")) {
    total += Math.max(0, bank.reserves - bank.loans * 0.06);
  }
  for (const loan of p.loans) total -= loan.outstanding;
  return Math.round(total);
}

export const PLAYER_START_DAY = 1;
