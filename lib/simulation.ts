import type { EventEffect, FeedPost, GameState, NPC, Tone, Token, WorldEvent } from './types'
import { clamp, normalRandom, pick, uid } from './format'
import { dailyIncome, leverage, marketCap, netWorth } from './economy'
import { eventPostContent, generateLocalEvent, randomRumor } from './world-events'

const MAX_FEED = 70
const MAX_HISTORY = 120

function addLog(state: GameState, line: string) {
  state.log = [`DAY ${state.day} ${String(state.hour).padStart(2, '0')}:00 — ${line}`, ...state.log].slice(0, 60)
}

function notify(state: GameState, title: string, message: string, tone: Tone) {
  state.notifications = [
    { id: uid('ntf'), title, message, tone, day: state.day, hour: state.hour },
    ...state.notifications,
  ].slice(0, 14)
}

function post(
  state: GameState,
  input: Partial<FeedPost> & { author: string; handle: string; content: string },
) {
  const item: FeedPost = {
    id: uid('post'),
    author: input.author,
    handle: input.handle,
    avatarHue: input.avatarHue ?? 174,
    content: input.content,
    sentiment: input.sentiment ?? 0,
    likes: input.likes ?? Math.floor(Math.random() * 2400) + 40,
    replies: input.replies ?? Math.floor(Math.random() * 280),
    day: state.day,
    hour: state.hour,
    tags: input.tags ?? [],
    verified: input.verified ?? false,
    source: input.source ?? 'npc',
    kind: input.kind ?? 'social',
  }
  state.feed = [item, ...state.feed].slice(0, MAX_FEED)
}

function effectValue(state: GameState, kind: EventEffect['kind'], targetId?: string): number {
  return state.events
    .filter((event) => event.endsDay >= state.day)
    .reduce((total, event) => {
      const matching = event.effects.filter(
        (effect) => effect.kind === kind && (!effect.targetId || effect.targetId === targetId),
      )
      return total + matching.reduce((sum, effect) => sum + effect.delta, 0)
    }, 0)
}

function eventForToken(state: GameState, tokenId: string): number {
  return effectValue(state, 'token', tokenId)
}

function randomHexHue(): number {
  const hues = [12, 24, 42, 122, 142, 164, 174, 196, 218, 286, 302, 338, 352]
  return pick(hues)
}

function newNpcToken(state: GameState, npc: NPC): Token | null {
  if (state.tokens.length >= 11) return null
  const symbols = ['AURA', 'SABLE', 'HEX', 'DRIFT', 'ECHO', 'PRISM', 'FLUX', 'ONYX', 'RIFT', 'ZERO']
  const used = new Set(state.tokens.map((token) => token.symbol))
  const symbol = symbols.find((item) => !used.has(item))
  if (!symbol) return null
  const price = Number((0.01 + Math.random() * 3).toFixed(4))
  const liquidity = Math.round(180_000 + Math.random() * 900_000)
  const token: Token = {
    id: uid('tok'),
    symbol,
    name: `${npc.name.split(' ')[0]} ${symbol}`,
    price,
    fairValue: price * (0.8 + Math.random() * 0.5),
    liquidity,
    supply: Math.round(20_000_000 + Math.random() * 200_000_000),
    creator: npc.name,
    creatorId: npc.id,
    creatorType: 'npc',
    volatility: 0.07 + Math.random() * 0.12,
    momentum: 0.02 + Math.random() * 0.03,
    history: Array.from({ length: 40 }, () => Number((price * (0.8 + Math.random() * 0.4)).toFixed(4))),
    volume24h: Math.round(liquidity * (0.2 + Math.random())),
    holders: Math.round(2_000 + Math.random() * 30_000),
    staked: 0,
    apr: 10 + Math.random() * 35,
    rugged: false,
    hue: npc.avatarHue,
    description: `A freshly minted ${npc.archetype.toLowerCase()} vehicle. The whitepaper is a landing page and a promise.`,
  }
  token.history[token.history.length - 1] = price
  state.tokens.push(token)
  post(state, {
    author: npc.name,
    handle: npc.handle,
    avatarHue: npc.avatarHue,
    content: `Launched $${symbol}. Not a token — a permissionless coordination layer for people who understand the future. Liquidity is live. Do not be late.`,
    sentiment: 58,
    verified: true,
    kind: 'market',
    tags: [`$${symbol}`, 'launch'],
  })
  addLog(state, `${npc.name} launched $${symbol} with ${Math.round(liquidity / 1000)}K liquidity.`)
  return token
}

function npcMove(state: GameState) {
  const npc = pick(state.npcs)
  const playerMedia = state.media.filter((item) => item.playerOwned)
  const playerIsp = state.isps.filter((item) => item.playerOwned)
  const playerSyndicate = state.syndicates.find((item) => item.playerOwned)
  const roll = Math.random()
  const aggression = npc.aggression

  if (roll < 0.2 && state.tokens.length < 11) {
    newNpcToken(state, npc)
    return
  }

  if (roll < 0.42) {
    const token = pick(state.tokens.filter((item) => !item.rugged))
    const direction = Math.random() < 0.55 ? 1 : -1
    const magnitude = (0.025 + Math.random() * 0.06) * (direction > 0 ? 1 : 1.4) * (0.6 + aggression * 0.6)
    token.price = Math.max(0.00001, token.price * (1 + direction * magnitude))
    token.momentum = direction * magnitude * 0.55
    token.volume24h *= 1 + Math.random() * 0.35
    const verb = direction > 0 ? 'accumulating' : 'taking profits'
    post(state, {
      author: npc.name,
      handle: npc.handle,
      avatarHue: npc.avatarHue,
      content: `I am ${verb} $${token.symbol}. The crowd wants a narrative. I want the order book.`,
      sentiment: direction > 0 ? 52 : -22,
      verified: true,
      kind: 'market',
      tags: [`$${token.symbol}`],
    })
    addLog(state, `${npc.name} ${direction > 0 ? 'bought' : 'sold'} $${token.symbol}, moving the tape ${(magnitude * 100).toFixed(1)}%.`)
    return
  }

  if (roll < 0.58 && playerMedia.length) {
    const station = pick(playerMedia)
    station.sentiment = clamp(station.sentiment - (6 + Math.random() * 12), 0, 100)
    station.credibility = clamp(station.credibility - (2 + Math.random() * 5), 0, 100)
    post(state, {
      author: npc.name,
      handle: npc.handle,
      avatarHue: npc.avatarHue,
      content: `A source inside ${station.name} says the editorial board is for sale. I have the receipts. I always have the receipts.`,
      sentiment: -48,
      verified: npc.aggression > 0.6,
      kind: 'scandal',
      tags: [station.name, 'media'],
    })
    addLog(state, `${npc.name} launched a narrative attack on ${station.name}.`)
    return
  }

  if (roll < 0.7 && playerIsp.length) {
    const isp = pick(playerIsp)
    const success = Math.random() < clamp(0.7 - isp.security / 200 + aggression * 0.2, 0.1, 0.9)
    if (success) {
      isp.uptime = clamp(isp.uptime - (2 + Math.random() * 5), 90, 100)
      isp.security = clamp(isp.security - (3 + Math.random() * 6), 0, 100)
      isp.latency += 8 + Math.random() * 20
      post(state, {
        author: npc.name,
        handle: npc.handle,
        avatarHue: npc.avatarHue,
        content: `${isp.name} is down in three districts. Funny how these things happen when you stop paying for protection.`,
        sentiment: -36,
        verified: false,
        kind: 'crime',
        tags: [isp.name, 'cyber'],
      })
      addLog(state, `${npc.name} breached ${isp.name}. Uptime fell to ${isp.uptime.toFixed(2)}%.`)
    } else {
      addLog(state, `${npc.name} attempted a breach on ${isp.name} and failed.`)
    }
    return
  }

  if (roll < 0.82) {
    state.government.regulation = clamp(state.government.regulation + 1 + Math.random() * 3, 0, 100)
    state.government.approval = clamp(state.government.approval - 1 + Math.random() * 2, 0, 100)
    post(state, {
      author: npc.name,
      handle: npc.handle,
      avatarHue: npc.avatarHue,
      content: `Regulation is not the enemy of markets. Uncertainty is. I am simply helping the Senate reduce uncertainty.`,
      sentiment: 8,
      verified: true,
      kind: 'news',
      tags: ['policy'],
    })
    addLog(state, `${npc.name} lobbied City Hall. Regulation pressure rose.`)
    return
  }

  if (roll < 0.92 && playerSyndicate) {
    playerSyndicate.heat = clamp(playerSyndicate.heat + 3 + Math.random() * 6, 0, 100)
    playerSyndicate.influence = clamp(playerSyndicate.influence - 1 - Math.random() * 3, 0, 100)
    post(state, {
      author: npc.name,
      handle: npc.handle,
      avatarHue: npc.avatarHue,
      content: `The Nihann Syndicate is getting sloppy. Sloppy is a gift. I accept gifts.`,
      sentiment: -28,
      verified: false,
      kind: 'crime',
      tags: ['underworld', 'Nihann'],
    })
    addLog(state, `${npc.name} moved against the Nihann Syndicate. Heat rose.`)
    return
  }

  const corp = pick(state.corporations)
  corp.sharePrice = Math.max(1, corp.sharePrice * (1 + (Math.random() - 0.4) * 0.03))
  corp.growth = clamp(corp.growth + (Math.random() - 0.45) * 2, -30, 60)
  addLog(state, `${npc.name} rebalanced a position in ${corp.ticker}.`)
}

function issueWarrant(state: GameState) {
  const existing = state.government.warrants.find(
    (warrant) => warrant.targetId === 'player' && warrant.status === 'active',
  )
  if (existing) return
  state.government.warrants.unshift({
    id: uid('war'),
    targetId: 'player',
    targetName: state.player.name,
    reason: pick([
      'Unlicensed securities issuance',
      'Money laundering through shell corporations',
      'Criminal racketeering and bribery',
      'Cyber intrusion against critical infrastructure',
    ]),
    severity: state.player.heat > 85 ? 'high' : 'medium',
    issuedDay: state.day,
    status: 'active',
  })
  notify(state, 'ARREST WARRANT ISSUED', 'The Financial Crimes Unit has opened a formal case against you.', 'bad')
  addLog(state, 'An arrest warrant was issued for the player.')
  post(state, {
    author: 'The Ledger',
    handle: '@theledger',
    avatarHue: 218,
    content: `The FCU has issued a warrant tied to the Nihann Syndicate. Sources say the filing names “a network of shell companies” and at least one sitting official.`,
    sentiment: -44,
    verified: true,
    kind: 'news',
    tags: ['warrant', 'FCU'],
  })
}

function serveWarrant(state: GameState) {
  const warrant = state.government.warrants.find(
    (item) => item.targetId === 'player' && item.status === 'active',
  )
  if (!warrant) return
  const fine = Math.round(state.player.cash * (warrant.severity === 'high' ? 0.18 : 0.09))
  const legal = Math.min(state.player.legalFund, fine)
  state.player.legalFund -= legal
  state.player.cash = Math.max(0, state.player.cash - (fine - legal))
  state.player.reputation = clamp(state.player.reputation - 12, 0, 100)
  state.player.heat = clamp(state.player.heat - 32, 0, 100)
  const syndicate = state.syndicates.find((item) => item.playerOwned)
  if (syndicate) syndicate.heat = clamp(syndicate.heat - 32, 0, 100)
  warrant.status = 'served'
  notify(state, 'WARRANT SERVED', `You paid ${Math.round(fine / 1000)}K in fines and legal fees. Heat reduced.`, 'bad')
  addLog(state, `Warrant served. Fines and legal costs: ${Math.round(fine / 1000)}K.`)
}

function bankRun(state: GameState, bankId: string) {
  const bank = state.banks.find((item) => item.id === bankId)
  if (!bank || bank.status === 'collapsed') return
  bank.status = 'collapsed'
  bank.deposits *= 0.42
  bank.reserves *= 0.18
  bank.loans *= 0.62
  const playerDeposit = state.player.deposits[bank.id] ?? 0
  if (playerDeposit > 0) {
    const lost = playerDeposit * 0.72
    state.player.deposits[bank.id] = playerDeposit - lost
    notify(state, 'BANK RUN', `${bank.name} collapsed. ${Math.round(lost / 1000)}K of your deposits were lost.`, 'bad')
  } else {
    notify(state, 'BANK RUN', `${bank.name} collapsed after a coordinated withdrawal wave.`, 'bad')
  }
  addLog(state, `${bank.name} collapsed. Deposits frozen and marked down 58%.`)
  post(state, {
    author: 'The Ledger',
    handle: '@theledger',
    avatarHue: 218,
    content: `BREAKING: ${bank.name} has collapsed. The bank run began at 09:14 and was over by 09:41. Regulators are calling it “contained.”`,
    sentiment: -62,
    verified: true,
    kind: 'news',
    tags: [bank.name, 'bankrun'],
  })
  const event: WorldEvent = {
    id: uid('evt'),
    title: `${bank.name} Collapse`,
    description: `A coordinated bank run drained ${bank.name} in under thirty minutes. The loan book is being marked down and depositors are lining up in the rain.`,
    category: 'finance',
    severity: 'critical',
    startedDay: state.day,
    endsDay: state.day + 4,
    effects: [
      { kind: 'market', delta: -0.014 },
      { kind: 'bank', targetId: bank.id, delta: -0.02 },
      { kind: 'government', delta: 0.014 },
    ],
    source: 'local',
    hue: 350,
    headline: `BANK RUN: ${bank.name} collapses in thirty minutes`,
  }
  state.events = [event, ...state.events].slice(0, 5)
}

function tickTokens(state: GameState) {
  const marketEffect = effectValue(state, 'market')
  const playerHoldings = new Map(state.player.holdings.map((holding) => [holding.tokenId, holding]))
  for (const token of state.tokens) {
    if (token.rugged) {
      token.price = Math.max(0.000001, token.price * 0.985)
      token.history.push(Number(token.price.toFixed(token.price < 1 ? 6 : 2)))
      if (token.history.length > MAX_HISTORY) token.history.shift()
      continue
    }
    const eventDelta = eventForToken(state, token.id)
    const meanReversion = ((token.fairValue - token.price) / Math.max(token.price, 0.000001)) * 0.006
    const noise = normalRandom() * token.volatility * 0.075
    const momentum = token.momentum * 0.36
    const total = meanReversion + noise + momentum + eventDelta * 0.11 + marketEffect * 0.55
    const change = clamp(total, -0.16, 0.16)
    token.price = Math.max(0.000001, token.price * (1 + change))
    token.momentum = clamp(token.momentum * 0.84 + normalRandom() * token.volatility * 0.05 + eventDelta * 0.04, -0.18, 0.18)
    token.fairValue = Math.max(0.000001, token.fairValue * (1 + normalRandom() * 0.004 + eventDelta * 0.03))
    token.volume24h = Math.max(10_000, token.volume24h * (0.96 + Math.random() * 0.09) + Math.abs(change) * token.liquidity * 0.4)
    token.holders = Math.max(100, Math.round(token.holders * (1 + (Math.random() - 0.48) * 0.006)))
    token.staked = Math.max(0, token.staked * (1 + (Math.random() - 0.5) * 0.01))
    token.history.push(Number(token.price.toFixed(token.price < 1 ? 6 : 2)))
    if (token.history.length > MAX_HISTORY) token.history.shift()

    const holding = playerHoldings.get(token.id)
    if (holding && holding.staked > 0) {
      holding.pending += (holding.staked * token.price * (token.apr / 100)) / (365 * 24)
    }
  }
}

function tickCorporations(state: GameState) {
  const marketEffect = effectValue(state, 'market')
  for (const corp of state.corporations) {
    const meanReversion = ((corp.fairValue - corp.sharePrice) / Math.max(corp.sharePrice, 1)) * 0.004
    const noise = normalRandom() * corp.volatility * 0.06
    const growth = corp.growth / 100 / (365 * 24)
    const change = clamp(meanReversion + noise + growth + marketEffect * 0.5, -0.12, 0.12)
    corp.sharePrice = Math.max(0.5, corp.sharePrice * (1 + change))
    corp.fairValue = Math.max(0.5, corp.fairValue * (1 + normalRandom() * 0.003 + growth * 0.5))
    corp.history.push(Number(corp.sharePrice.toFixed(2)))
    if (corp.history.length > MAX_HISTORY) corp.history.shift()
  }
}

function tickDistricts(state: GameState) {
  const marketEffect = effectValue(state, 'market')
  const syndicateHeat = state.syndicates.reduce((max, item) => Math.max(max, item.heat), 0)
  for (const district of state.districts) {
    const eventDelta = effectValue(state, 'district', district.id)
    const marketPull = marketEffect * 0.8 + (state.marketIndex / 4286.42 - 1) * 0.002
    const demandPull = ((district.demand - 65) / 100) * 0.0015
    const crimeDrag = district.crime > 60 ? -0.0012 : 0.0004
    district.value = Math.max(50_000, district.value * (1 + clamp(marketPull + demandPull + crimeDrag + eventDelta * 0.1, -0.03, 0.03)))
    const policeEffect = (district.police - 50) / 100 * 0.004
    const crimePull = (syndicateHeat - 40) / 100 * 0.003 + eventDelta * 0.05
    district.crime = clamp(district.crime + crimePull - policeEffect + (Math.random() - 0.5) * 0.4, 0, 100)
    district.police = clamp(district.police + (state.government.approval - 50) / 5000 + (Math.random() - 0.5) * 0.2, 0, 100)
    district.demand = clamp(district.demand + (marketEffect * 20) + (Math.random() - 0.5) * 0.5, 0, 100)
  }
}

function tickBanks(state: GameState) {
  for (const bank of state.banks) {
    const eventDelta = effectValue(state, 'bank', bank.id)
    if (bank.status === 'collapsed') {
      bank.history.push(Number(leverage(bank).toFixed(2)))
      if (bank.history.length > MAX_HISTORY) bank.history.shift()
      continue
    }
    const interest = (bank.loans * (bank.rate / 100)) / (365 * 24)
    bank.reserves += interest * 0.62
    bank.loans += interest * 0.1
    const flow = (Math.random() - 0.48) * bank.deposits * 0.0008
    bank.deposits = Math.max(0, bank.deposits + flow)
    bank.reserves = Math.max(0, bank.reserves - flow * 0.2 + eventDelta * bank.reserves * 0.08)
    const lev = leverage(bank)
    if (lev > 9.5) bank.status = 'critical'
    else if (lev > 6.5) bank.status = 'watch'
    else bank.status = 'stable'
    if (bank.status === 'critical' && Math.random() < 0.018) bankRun(state, bank.id)
    if (bank.playerOwned) {
      const profit = (bank.loans * (bank.rate / 100)) / (365 * 24) * 0.32
      state.player.cash += profit
    }
    bank.history.push(Number(lev.toFixed(2)))
    if (bank.history.length > MAX_HISTORY) bank.history.shift()
  }
}

function tickIsps(state: GameState) {
  const marketEffect = effectValue(state, 'market')
  for (const isp of state.isps) {
    const eventDelta = effectValue(state, 'isp', isp.id)
    const demand = 0.5 + state.congestion / 220 + marketEffect * 1.4 + eventDelta * 0.1
    isp.load = clamp(isp.load + (demand - isp.load) * 0.04 + (Math.random() - 0.5) * 0.008, 0.1, 1.35)
    if (isp.load > 0.94) {
      isp.uptime = clamp(isp.uptime - (0.02 + (isp.load - 0.94) * 0.4), 92, 100)
      isp.latency = clamp(isp.latency + 0.4, 4, 220)
    } else {
      isp.uptime = clamp(isp.uptime + 0.006, 92, 100)
      isp.latency = clamp(isp.latency - 0.1 + (isp.load > 0.8 ? 0.2 : 0), 4, 220)
    }
    isp.revenue = Math.round((isp.capacity * isp.load * isp.pricePerTbps * (isp.uptime / 100)) / 24)
    if (isp.playerOwned) state.player.cash += isp.revenue
  }
}

function tickMedia(state: GameState) {
  for (const station of state.media) {
    const eventDelta = effectValue(state, 'media', station.id)
    station.reach = Math.max(0.05, station.reach * (1 + (Math.random() - 0.48) * 0.004 + eventDelta * 0.01))
    station.credibility = clamp(station.credibility + (60 - station.credibility) * 0.002 + eventDelta * 2, 0, 100)
    station.sentiment = clamp(station.sentiment + (Math.random() - 0.5) * 0.9 + eventDelta * 3, 0, 100)
    station.revenue = Math.round(station.reach * 12_000 * (station.credibility / 100) * (0.6 + station.sentiment / 250))
    if (station.playerOwned) state.player.cash += station.revenue / 24
    if (Math.random() < 0.008) {
      station.headlines = [
        `${station.name}: ${randomRumor()}`,
        ...station.headlines,
      ].slice(0, 5)
    }
  }
}

function tickGovernment(state: GameState) {
  const gov = state.government
  gov.approval = clamp(gov.approval + (Math.random() - 0.5) * 0.5 + (gov.stimulus > 0 ? 0.2 : 0), 0, 100)
  gov.regulation = clamp(gov.regulation + (Math.random() - 0.49) * 0.2, 0, 100)
  gov.budget += gov.taxRate * 1_200_000 / 24
  for (const official of gov.officials) {
    official.loyalty = clamp(official.loyalty + (Math.random() - 0.51) * 0.3, 0, 100)
    if (official.bribed) official.loyalty = clamp(official.loyalty + 0.05, 0, 100)
  }
  const heat = state.player.heat
  if (heat > 72 && Math.random() < 0.02) issueWarrant(state)
  const active = gov.warrants.find((item) => item.targetId === 'player' && item.status === 'active')
  if (active) {
    const protection = gov.officials.find((official) => official.id === 'reed' && official.bribed)
    if (protection && Math.random() < 0.35) {
      active.status = 'dismissed'
      notify(state, 'WARRANT DISMISSED', 'Director Reed buried the case. Your retainer was well spent.', 'good')
      addLog(state, 'Warrant dismissed after Director Reed intervened.')
    } else if (Math.random() < 0.07) {
      serveWarrant(state)
    }
  }
  if (Math.random() < 0.004) {
    const regulation = pick([
      {
        title: 'Algorithmic Trading Levy',
        description: 'A 0.04% levy on every automated DEX trade above $10K.',
      },
      {
        title: 'Media Ownership Cap',
        description: 'No single entity may control more than 30% of citywide audience share.',
      },
      {
        title: 'Backbone Security Audit',
        description: 'Critical ISPs must submit to quarterly penetration testing.',
      },
      {
        title: 'Shell Company Registry',
        description: 'Beneficial ownership must be disclosed for all entities above $1M in assets.',
      },
    ])
    gov.regulations = [
      {
        id: uid('reg'),
        title: regulation.title,
        description: regulation.description,
        passedDay: state.day,
        active: true,
      },
      ...gov.regulations,
    ].slice(0, 8)
    notify(state, 'NEW REGULATION', `${regulation.title} passed the council.`, 'warn')
    addLog(state, `Council passed ${regulation.title}.`)
  }
}

function tickSyndicates(state: GameState) {
  for (const syndicate of state.syndicates) {
    const eventDelta = effectValue(state, 'government')
    syndicate.heat = clamp(syndicate.heat - 0.18 + (Math.random() - 0.5) * 0.25 + eventDelta * 8, 0, 100)
    syndicate.influence = clamp(syndicate.influence + (Math.random() - 0.5) * 0.2, 0, 100)
    syndicate.cash += syndicate.operations * 1_200 * (0.6 + Math.random() * 0.8)
    if (syndicate.playerOwned) {
      state.player.heat = syndicate.heat
      state.player.dirtyCash += syndicate.operations * 900 * (0.5 + Math.random())
    }
  }
}

function tickDebts(state: GameState) {
  for (const [bankId, debt] of Object.entries(state.player.debts)) {
    const bank = state.banks.find((item) => item.id === bankId)
    const rate = bank?.rate ?? 6
    state.player.debts[bankId] = debt * (1 + rate / 100 / (365 * 24))
  }
}

function tickFeed(state: GameState) {
  state.feed = state.feed.map((item) => ({
    ...item,
    likes: item.likes + Math.floor(Math.random() * 9),
    replies: item.replies + (Math.random() < 0.12 ? 1 : 0),
  }))
  if (Math.random() < 0.055) {
    const npc = pick(state.npcs)
    post(state, {
      author: npc.name,
      handle: npc.handle,
      avatarHue: npc.avatarHue,
      content: randomRumor(),
      sentiment: Math.round((Math.random() - 0.4) * 80),
      verified: npc.aggression > 0.6,
      kind: pick(['social', 'market', 'news']),
      tags: pick([['markets'], ['underworld'], ['policy'], ['infra'], ['media']]),
    })
  }
}

function tickEvents(state: GameState) {
  state.events = state.events.filter((event) => event.endsDay >= state.day)
  if (state.events.length < 3 && Math.random() < 0.035) {
    const event = generateLocalEvent(state)
    state.events = [event, ...state.events].slice(0, 5)
    post(state, {
      author: 'OmniLife Wire',
      handle: '@wire',
      avatarHue: event.hue,
      content: eventPostContent(event),
      sentiment: event.severity === 'critical' ? -48 : -12,
      verified: true,
      source: 'system',
      kind: 'news',
      tags: [event.category, 'world-engine'],
    })
    notify(state, event.title.toUpperCase(), event.description, event.severity === 'critical' ? 'bad' : 'warn')
    addLog(state, `World event: ${event.title}.`)
  }
}

function dayRollover(state: GameState) {
  state.day += 1
  state.hour = 0
  const income = dailyIncome(state)
  const tax = Math.min(state.player.cash * 0.02, income * (state.government.taxRate / 100))
  state.player.cash = Math.max(0, state.player.cash - tax)

  const dividends = state.corporations.reduce((total, corp) => {
    const share = corp.playerShares / Math.max(1, corp.sharesOutstanding)
    return total + (corp.revenue * 0.035 * share) / 365
  }, 0)
  const propertyYield = state.districts.reduce(
    (total, district) => total + (district.owned * district.value * (district.yield / 100)) / 365,
    0,
  )
  state.player.cash += dividends + propertyYield

  for (const [bankId, deposit] of Object.entries(state.player.deposits)) {
    const bank = state.banks.find((item) => item.id === bankId)
    if (!bank || bank.status === 'collapsed') continue
    state.player.deposits[bankId] = deposit * (1 + bank.rate / 100 / 365)
  }

  state.player.xp += 120
  state.player.level = Math.max(1, Math.floor(1 + Math.sqrt(state.player.xp / 140)))
  if (state.player.heat > 55) state.player.reputation = clamp(state.player.reputation - 0.6, 0, 100)
  else state.player.reputation = clamp(state.player.reputation + 0.3, 0, 100)

  notify(
    state,
    'DAILY LEDGER CLOSED',
    `Tax ${Math.round(tax / 1000)}K · Dividends ${Math.round(dividends / 1000)}K · Property ${Math.round(propertyYield / 1000)}K`,
    'info',
  )
  addLog(state, `Daily close: tax ${Math.round(tax / 1000)}K, dividends ${Math.round(dividends / 1000)}K, property ${Math.round(propertyYield / 1000)}K.`)
}

export function advance(previous: GameState): GameState {
  const state: GameState = structuredClone(previous)
  state.tick += 1
  state.hour += 1
  if (state.hour >= 24) dayRollover(state)

  tickEvents(state)
  tickTokens(state)
  tickCorporations(state)
  tickDistricts(state)
  tickBanks(state)
  tickIsps(state)
  tickMedia(state)
  tickGovernment(state)
  tickSyndicates(state)
  tickDebts(state)
  tickFeed(state)

  if (Math.random() < 0.14) npcMove(state)

  const tokenDrift = state.tokens.reduce((total, token) => {
    const last = token.history[token.history.length - 2] ?? token.price
    return total + (token.price / Math.max(last, 0.000001) - 1)
  }, 0) / Math.max(1, state.tokens.length)
  const corpDrift = state.corporations.reduce((total, corp) => {
    const last = corp.history[corp.history.length - 2] ?? corp.sharePrice
    return total + (corp.sharePrice / Math.max(last, 0.5) - 1)
  }, 0) / Math.max(1, state.corporations.length)
  const marketMove = tokenDrift * 0.55 + corpDrift * 0.45 + effectValue(state, 'market') * 0.12
  state.marketIndex = Math.max(100, state.marketIndex * (1 + clamp(marketMove, -0.05, 0.05)))
  state.indexHistory.push(Number(state.marketIndex.toFixed(2)))
  if (state.indexHistory.length > MAX_HISTORY) state.indexHistory.shift()

  const avgVol = state.tokens.reduce((total, token) => total + token.volatility, 0) / Math.max(1, state.tokens.length)
  state.volatility = clamp(state.volatility + (avgVol * 100 - state.volatility) * 0.08 + (Math.random() - 0.5) * 2, 8, 96)
  const avgLoad = state.isps.reduce((total, isp) => total + isp.load, 0) / Math.max(1, state.isps.length)
  state.congestion = clamp(state.congestion + (avgLoad * 100 - state.congestion) * 0.1 + (Math.random() - 0.5) * 2, 5, 100)
  state.gasPrice = Math.max(3, Math.round((12 + state.congestion * 0.62 + state.volatility * 0.18) * 10) / 10)

  const worth = netWorth(state)
  state.player.netWorthHistory.push(Number(worth.toFixed(0)))
  if (state.player.netWorthHistory.length > 96) state.player.netWorthHistory.shift()
  state.player.actions = Math.max(0, state.player.actions)

  if (state.player.godMode && state.player.email.toLowerCase() !== 'mirajx132@gmail.com') {
    state.player.godMode = false
  }

  return state
}

export function applyWorldEvent(previous: GameState, incoming: Omit<WorldEvent, 'id' | 'startedDay' | 'endsDay'>): GameState {
  const state: GameState = structuredClone(previous)
  const event: WorldEvent = {
    ...incoming,
    id: uid('evt'),
    startedDay: state.day,
    endsDay: state.day + (incoming.severity === 'critical' ? 4 : incoming.severity === 'high' ? 6 : 8),
  }
  state.events = [event, ...state.events].slice(0, 5)
  state.engineStatus = event.source === 'grok' ? 'grok' : state.engineStatus
  state.lastEngineSync = state.tick
  post(state, {
    author: event.source === 'grok' ? 'Grok World Engine' : 'OmniLife Wire',
    handle: event.source === 'grok' ? '@grok' : '@wire',
    avatarHue: event.hue,
    content: eventPostContent(event),
    sentiment: event.severity === 'critical' ? -54 : -14,
    verified: true,
    source: event.source === 'grok' ? 'grok' : 'system',
    kind: 'news',
    tags: [event.category, 'world-engine'],
  })
  notify(state, event.title.toUpperCase(), event.description, event.severity === 'critical' ? 'bad' : 'warn')
  addLog(state, `World engine event: ${event.title}.`)
  return state
}

export function forceBankRun(previous: GameState, bankId: string): GameState {
  const state: GameState = structuredClone(previous)
  bankRun(state, bankId)
  return state
}

export function summarizeState(state: GameState) {
  return {
    day: state.day,
    hour: state.hour,
    marketIndex: Number(state.marketIndex.toFixed(2)),
    volatility: Number(state.volatility.toFixed(1)),
    gasPrice: state.gasPrice,
    heat: Math.round(state.player.heat),
    reputation: Math.round(state.player.reputation),
    netWorth: Math.round(netWorth(state)),
    marketCap: Math.round(marketCap(state)),
    tokens: state.tokens.slice(0, 6).map((token) => ({
      symbol: token.symbol,
      price: token.price,
      change: Number(((token.price / (token.history[token.history.length - 13] ?? token.price) - 1) * 100).toFixed(2)),
      rugged: token.rugged,
    })),
    banks: state.banks.map((bank) => ({
      name: bank.name,
      status: bank.status,
      leverage: Number(leverage(bank).toFixed(2)),
    })),
    isps: state.isps.map((isp) => ({
      name: isp.name,
      load: Number(isp.load.toFixed(2)),
      uptime: Number(isp.uptime.toFixed(2)),
      playerOwned: isp.playerOwned,
    })),
    media: state.media.map((station) => ({
      name: station.name,
      sentiment: Math.round(station.sentiment),
      credibility: Math.round(station.credibility),
      playerOwned: station.playerOwned,
    })),
    activeEvents: state.events.map((event) => ({ title: event.title, severity: event.severity })),
    playerSyndicate: state.syndicates.find((syndicate) => syndicate.playerOwned)?.name ?? 'none',
  }
}
