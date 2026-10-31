import type { ActionResult, Corporation, FeedPost, GameState, MediaStation, Token, WorldEvent } from './types'
import { clamp, pick, uid } from './format'
import { leverage, netWorth, portfolioValue } from './economy'
import { forceBankRun } from './simulation'
import { createInitialState } from './seed'
import { generateLocalEvent } from './world-events'
import { publishWirePost } from './supabase'

const GOD_EMAIL = 'mirajx132@gmail.com'

function fail(state: GameState, title: string, message: string): ActionResult {
  return { state, toast: { title, message, tone: 'bad' } }
}

function ok(state: GameState, title: string, message: string): ActionResult {
  return { state, toast: { title, message, tone: 'good' } }
}

function clone(state: GameState): GameState {
  return structuredClone(state)
}

function log(state: GameState, message: string) {
  state.log = [`DAY ${state.day} ${String(state.hour).padStart(2, '0')}:00 — ${message}`, ...state.log].slice(0, 60)
}

function notify(state: GameState, title: string, message: string, tone: 'good' | 'bad' | 'warn' | 'info') {
  state.notifications = [
    { id: uid('ntf'), title, message, tone, day: state.day, hour: state.hour },
    ...state.notifications,
  ].slice(0, 14)
}

function post(
  state: GameState,
  input: Partial<FeedPost> & { author: string; handle: string; content: string },
): FeedPost {
  const item: FeedPost = {
    id: uid('post'),
    author: input.author,
    handle: input.handle,
    avatarHue: input.avatarHue ?? state.player.avatarHue,
    content: input.content,
    sentiment: input.sentiment ?? 0,
    likes: input.likes ?? Math.floor(Math.random() * 400) + 20,
    replies: input.replies ?? Math.floor(Math.random() * 40),
    day: state.day,
    hour: state.hour,
    tags: input.tags ?? [],
    verified: input.verified ?? false,
    source: input.source ?? 'player',
    kind: input.kind ?? 'social',
  }
  state.feed = [item, ...state.feed].slice(0, 70)
  return item
}

function syncHeat(state: GameState) {
  const syndicate = state.syndicates.find((item) => item.playerOwned)
  if (syndicate) {
    syndicate.heat = clamp(state.player.heat, 0, 100)
    syndicate.influence = clamp(state.player.influence, 0, 100)
    syndicate.cash = state.player.dirtyCash
  }
}

function playerIsp(state: GameState) {
  return state.isps.find((isp) => isp.playerOwned)
}

function playerMedia(state: GameState) {
  return state.media.find((station) => station.playerOwned)
}

function holdingFor(state: GameState, tokenId: string) {
  return state.player.holdings.find((holding) => holding.tokenId === tokenId)
}

export function buyToken(previous: GameState, tokenId: string, usd: number): ActionResult {
  if (!Number.isFinite(usd) || usd <= 0) return fail(previous, 'INVALID ORDER', 'Enter a positive order size.')
  if (usd > previous.player.cash) return fail(previous, 'INSUFFICIENT CASH', 'Your liquid balance cannot cover this order.')
  const state = clone(previous)
  const token = state.tokens.find((item) => item.id === tokenId)
  if (!token) return fail(previous, 'TOKEN NOT FOUND', 'The asset no longer exists on this mesh.')
  if (token.rugged) return fail(previous, 'DEAD MARKET', 'This token has been rugged. There is no exit liquidity.')
  const fee = usd * 0.003 + state.gasPrice * 0.0004
  const slippage = (usd / Math.max(token.liquidity, 1)) * 0.62
  const execution = token.price * (1 + slippage)
  const units = (usd - fee) / Math.max(execution, 0.0000001)
  state.player.cash -= usd
  token.price = token.price * (1 + slippage * 0.55)
  token.liquidity += usd * 0.72
  token.volume24h += usd
  token.holders += 1
  const holding = holdingFor(state, tokenId)
  if (holding) {
    const totalUnits = holding.units + units
    holding.avgCost = (holding.avgCost * holding.units + execution * units) / Math.max(totalUnits, 1)
    holding.units = totalUnits
  } else {
    state.player.holdings.push({ tokenId, units, avgCost: execution, staked: 0, pending: 0 })
  }
  state.player.xp += 8
  state.player.actions += 1
  log(state, `Bought ${units.toLocaleString('en-US', { maximumFractionDigits: 2 })} $${token.symbol} for ${Math.round(usd).toLocaleString('en-US')} USD.`)
  return ok(state, 'ORDER FILLED', `Bought ${units.toLocaleString('en-US', { maximumFractionDigits: 2 })} $${token.symbol} at $${execution.toFixed(4)}.`)
}

export function sellToken(previous: GameState, tokenId: string, units: number): ActionResult {
  if (!Number.isFinite(units) || units <= 0) return fail(previous, 'INVALID ORDER', 'Enter a positive unit amount.')
  const state = clone(previous)
  const token = state.tokens.find((item) => item.id === tokenId)
  const holding = holdingFor(state, tokenId)
  if (!token || !holding) return fail(previous, 'POSITION NOT FOUND', 'You do not hold this asset.')
  if (units > holding.units) return fail(previous, 'INSUFFICIENT UNITS', 'You cannot sell more than your liquid position.')
  const notional = units * token.price
  const slippage = (notional / Math.max(token.liquidity, 1)) * 0.58
  const execution = token.price * (1 - slippage)
  const gross = units * execution
  const fee = gross * 0.004 + state.gasPrice * 0.0004
  state.player.cash += gross - fee
  token.price = Math.max(0.000001, token.price * (1 - slippage * 0.55))
  token.liquidity = Math.max(10_000, token.liquidity - gross * 0.55)
  token.volume24h += gross
  holding.units -= units
  if (holding.units < 0.000001) state.player.holdings = state.player.holdings.filter((item) => item.tokenId !== tokenId)
  state.player.xp += 6
  state.player.actions += 1
  log(state, `Sold ${units.toLocaleString('en-US', { maximumFractionDigits: 2 })} $${token.symbol} for ${Math.round(gross).toLocaleString('en-US')} USD.`)
  return ok(state, 'ORDER FILLED', `Sold ${units.toLocaleString('en-US', { maximumFractionDigits: 2 })} $${token.symbol} at $${execution.toFixed(4)}.`)
}

export function stakeToken(previous: GameState, tokenId: string, units: number): ActionResult {
  const state = clone(previous)
  const token = state.tokens.find((item) => item.id === tokenId)
  const holding = holdingFor(state, tokenId)
  if (!token || !holding) return fail(previous, 'POSITION NOT FOUND', 'You do not hold this asset.')
  if (units <= 0 || units > holding.units) return fail(previous, 'INVALID STAKE', 'Choose an amount within your liquid position.')
  holding.units -= units
  holding.staked += units
  token.staked += units
  log(state, `Staked ${units.toLocaleString('en-US', { maximumFractionDigits: 2 })} $${token.symbol} at ${token.apr.toFixed(1)}% APR.`)
  return ok(state, 'STAKE ACTIVE', `${units.toLocaleString('en-US', { maximumFractionDigits: 2 })} $${token.symbol} is now earning ${token.apr.toFixed(1)}% APR.`)
}

export function unstakeToken(previous: GameState, tokenId: string, units: number): ActionResult {
  const state = clone(previous)
  const token = state.tokens.find((item) => item.id === tokenId)
  const holding = holdingFor(state, tokenId)
  if (!token || !holding) return fail(previous, 'POSITION NOT FOUND', 'You do not hold this asset.')
  if (units <= 0 || units > holding.staked) return fail(previous, 'INVALID UNSTAKE', 'Choose an amount within your staked position.')
  holding.staked -= units
  holding.units += units
  token.staked = Math.max(0, token.staked - units)
  log(state, `Unstaked ${units.toLocaleString('en-US', { maximumFractionDigits: 2 })} $${token.symbol}.`)
  return ok(state, 'STAKE RELEASED', `${units.toLocaleString('en-US', { maximumFractionDigits: 2 })} $${token.symbol} returned to your liquid position.`)
}

export function claimRewards(previous: GameState, tokenId: string): ActionResult {
  const state = clone(previous)
  const holding = holdingFor(state, tokenId)
  if (!holding || holding.pending < 1) return fail(previous, 'NOTHING TO CLAIM', 'Staking rewards have not accrued yet.')
  const amount = holding.pending
  state.player.cash += amount
  holding.pending = 0
  log(state, `Claimed ${Math.round(amount).toLocaleString('en-US')} USD in staking rewards.`)
  return ok(state, 'REWARDS CLAIMED', `${Math.round(amount).toLocaleString('en-US')} USD moved to liquid cash.`)
}

export function mintToken(previous: GameState, name: string, symbol: string, liquidity: number): ActionResult {
  const cleanName = name.trim()
  const cleanSymbol = symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
  if (cleanName.length < 2 || cleanSymbol.length < 2) return fail(previous, 'INVALID TOKEN', 'Name and symbol are required.')
  if (previous.tokens.some((token) => token.symbol === cleanSymbol)) return fail(previous, 'SYMBOL TAKEN', `$${cleanSymbol} already exists on this mesh.`)
  if (!Number.isFinite(liquidity) || liquidity < 50_000) return fail(previous, 'LIQUIDITY TOO LOW', 'Minimum initial liquidity is $50,000.')
  const cost = liquidity + 75_000
  if (cost > previous.player.cash) return fail(previous, 'INSUFFICIENT CASH', `Minting costs ${Math.round(cost).toLocaleString('en-US')} USD including the protocol fee.`)
  const state = clone(previous)
  const supply = 10_000_000
  const price = liquidity / (supply * 0.4)
  const token: Token = {
    id: uid('tok'),
    symbol: cleanSymbol,
    name: cleanName,
    price,
    fairValue: price * 1.08,
    liquidity,
    supply,
    creator: state.player.name,
    creatorId: 'player',
    creatorType: 'player',
    volatility: 0.16,
    momentum: 0.03,
    history: Array.from({ length: 36 }, (_, index) => Number((price * (0.82 + (index / 36) * 0.18)).toFixed(6))),
    volume24h: liquidity * 0.4,
    holders: 1,
    staked: 0,
    apr: 24,
    rugged: false,
    hue: state.player.avatarHue,
    description: `A player-issued asset. ${cleanName} is backed by liquidity and the credibility of its creator.`,
  }
  state.tokens.push(token)
  state.player.cash -= cost
  state.player.holdings.push({
    tokenId: token.id,
    units: supply * 0.2,
    avgCost: price * 0.8,
    staked: 0,
    pending: 0,
  })
  state.player.xp += 40
  state.player.actions += 1
  log(state, `Minted $${cleanSymbol} with ${Math.round(liquidity / 1000)}K liquidity.`)
  post(state, {
    author: state.player.name,
    handle: state.player.handle,
    avatarHue: state.player.avatarHue,
    content: `$${cleanSymbol} is live. ${cleanName}. Liquidity locked. The thesis is simple: attention is the only asset that compounds.`,
    sentiment: 55,
    verified: true,
    source: 'player',
    kind: 'market',
    tags: [`$${cleanSymbol}`, 'launch'],
  })
  return ok(state, 'TOKEN MINTED', `$${cleanSymbol} is live with ${Math.round(liquidity / 1000)}K liquidity. You hold 20% of supply.`)
}

export function rugPull(previous: GameState, tokenId: string): ActionResult {
  const state = clone(previous)
  const token = state.tokens.find((item) => item.id === tokenId)
  if (!token) return fail(previous, 'TOKEN NOT FOUND', 'This asset no longer exists.')
  if (token.creatorId !== 'player') return fail(previous, 'NOT YOUR TOKEN', 'You can only rug a token you created.')
  if (token.rugged) return fail(previous, 'ALREADY RUGGED', 'There is nothing left to drain.')
  const proceeds = token.liquidity * 0.82
  state.player.cash += proceeds * 0.55
  state.player.dirtyCash += proceeds * 0.45
  token.price = Math.max(0.000001, token.price * 0.018)
  token.liquidity = Math.max(1_000, token.liquidity * 0.025)
  token.rugged = true
  token.momentum = -0.2
  state.player.heat = clamp(state.player.heat + 18, 0, 100)
  state.player.reputation = clamp(state.player.reputation - 14, 0, 100)
  state.player.influence = clamp(state.player.influence + 5, 0, 100)
  syncHeat(state)
  post(state, {
    author: 'The Ledger',
    handle: '@theledger',
    avatarHue: 218,
    content: `$${token.symbol} liquidity vanished in a single block. The creator’s wallet is empty. The community is not amused.`,
    sentiment: -78,
    verified: true,
    kind: 'scandal',
    tags: [`$${token.symbol}`, 'rugpull'],
  })
  log(state, `Rugged $${token.symbol}. Proceeds routed through privacy rails.`)
  return {
    state,
    toast: { title: 'LIQUIDITY DRAINED', message: `$${token.symbol} collapsed. You extracted ${Math.round(proceeds).toLocaleString('en-US')} USD. Heat +18.`, tone: 'warn' },
  }
}

export function flashLoan(previous: GameState, tokenId: string): ActionResult {
  const state = clone(previous)
  const token = state.tokens.find((item) => item.id === tokenId)
  if (!token || token.rugged) return fail(previous, 'NO LIQUIDITY', 'This pool cannot support a flash loan.')
  const successChance = clamp(0.52 + state.player.influence / 400 + (state.congestion - 50) / 500, 0.2, 0.88)
  if (Math.random() < successChance) {
    const profit = token.liquidity * (0.012 + Math.random() * 0.024)
    state.player.cash += profit
    token.price *= 1 + Math.random() * 0.01
    state.player.influence = clamp(state.player.influence + 2, 0, 100)
    state.player.heat = clamp(state.player.heat + 5, 0, 100)
    syncHeat(state)
    log(state, `Flash-loan arbitrage on $${token.symbol} netted ${Math.round(profit).toLocaleString('en-US')} USD.`)
    return ok(state, 'ARBITRAGE COMPLETE', `Flash loan repaid. Net profit: ${Math.round(profit).toLocaleString('en-US')} USD.`)
  }
  const loss = Math.min(state.player.cash, token.liquidity * 0.008 + 30_000)
  state.player.cash -= loss
  state.player.heat = clamp(state.player.heat + 9, 0, 100)
  syncHeat(state)
  log(state, `Flash-loan attack on $${token.symbol} failed. Loss ${Math.round(loss).toLocaleString('en-US')} USD.`)
  return {
    state,
    toast: { title: 'ARBITRAGE REVERTED', message: `The transaction reverted. You lost ${Math.round(loss).toLocaleString('en-US')} USD in gas and slippage.`, tone: 'bad' },
  }
}

export function buyShares(previous: GameState, corpId: string, usd: number): ActionResult {
  if (usd <= 0) return fail(previous, 'INVALID ORDER', 'Enter a positive order size.')
  if (usd > previous.player.cash) return fail(previous, 'INSUFFICIENT CASH', 'Your liquid balance cannot cover this order.')
  const state = clone(previous)
  const corp = state.corporations.find((item) => item.id === corpId)
  if (!corp) return fail(previous, 'EQUITY NOT FOUND', 'This listing no longer exists.')
  const fee = usd * 0.002
  const slippage = (usd / Math.max(corp.sharePrice * corp.sharesOutstanding, 1)) * 0.7
  const execution = corp.sharePrice * (1 + slippage)
  const shares = (usd - fee) / execution
  state.player.cash -= usd
  corp.playerShares += shares
  corp.sharePrice = corp.sharePrice * (1 + slippage * 0.4)
  const ownership = (corp.playerShares / corp.sharesOutstanding) * 100
  if (ownership >= 50 && !corp.raided) {
    corp.raided = true
    state.player.influence = clamp(state.player.influence + 8, 0, 100)
    notify(state, 'HOSTILE CONTROL', `You now control ${corp.name}. Board seats and dividends are yours.`, 'good')
    log(state, `Acquired control of ${corp.name} (${ownership.toFixed(1)}%).`)
  }
  state.player.actions += 1
  log(state, `Bought ${shares.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${corp.ticker} shares for ${Math.round(usd).toLocaleString('en-US')} USD.`)
  return ok(state, 'EQUITY FILLED', `${shares.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${corp.ticker} shares at $${execution.toFixed(2)}. Ownership ${ownership.toFixed(2)}%.`)
}

export function sellShares(previous: GameState, corpId: string, shares: number): ActionResult {
  const state = clone(previous)
  const corp = state.corporations.find((item) => item.id === corpId)
  if (!corp) return fail(previous, 'EQUITY NOT FOUND', 'This listing no longer exists.')
  if (shares <= 0 || shares > corp.playerShares) return fail(previous, 'INVALID ORDER', 'Choose an amount within your position.')
  const notional = shares * corp.sharePrice
  const slippage = (notional / Math.max(corp.sharePrice * corp.sharesOutstanding, 1)) * 0.6
  const execution = corp.sharePrice * (1 - slippage)
  const gross = shares * execution
  state.player.cash += gross * 0.998
  corp.playerShares -= shares
  corp.sharePrice = Math.max(0.5, corp.sharePrice * (1 - slippage * 0.35))
  state.player.actions += 1
  log(state, `Sold ${shares.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${corp.ticker} shares.`)
  return ok(state, 'EQUITY SOLD', `${shares.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${corp.ticker} shares sold at $${execution.toFixed(2)}.`)
}

export function corporateRaid(previous: GameState, corpId: string): ActionResult {
  const state = clone(previous)
  const corp = state.corporations.find((item) => item.id === corpId)
  if (!corp) return fail(previous, 'EQUITY NOT FOUND', 'This listing no longer exists.')
  const cost = Math.round(corp.sharePrice * corp.sharesOutstanding * 0.035 + 500_000)
  if (state.player.cash < cost) return fail(previous, 'RAID UNDERFUNDED', `A board raid requires ${Math.round(cost / 1000).toLocaleString('en-US')}K in liquid capital.`)
  const success = Math.random() < clamp(0.48 + state.player.influence / 350 + (100 - corp.growth) / 500, 0.2, 0.9)
  state.player.cash -= cost
  if (success) {
    const seized = corp.sharesOutstanding * (0.08 + Math.random() * 0.08)
    corp.playerShares = Math.min(corp.sharesOutstanding, corp.playerShares + seized)
    corp.sharePrice *= 1.06
    state.player.influence = clamp(state.player.influence + 6, 0, 100)
    state.player.heat = clamp(state.player.heat + 8, 0, 100)
    syncHeat(state)
    log(state, `Board raid on ${corp.name} succeeded. Seized ${seized.toLocaleString('en-US', { maximumFractionDigits: 0 })} shares.`)
    return ok(state, 'BOARD RAID SUCCESSFUL', `You seized ${seized.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${corp.ticker} shares for ${Math.round(cost / 1000)}K.`)
  }
  state.player.heat = clamp(state.player.heat + 14, 0, 100)
  state.player.reputation = clamp(state.player.reputation - 5, 0, 100)
  syncHeat(state)
  log(state, `Board raid on ${corp.name} failed. Legal and advisory costs: ${Math.round(cost / 1000)}K.`)
  return {
    state,
    toast: { title: 'BOARD RAID FAILED', message: `The target’s defense held. You burned ${Math.round(cost / 1000)}K and raised heat.`, tone: 'bad' },
  }
}

export function deposit(previous: GameState, bankId: string, amount: number): ActionResult {
  if (amount <= 0) return fail(previous, 'INVALID DEPOSIT', 'Enter a positive amount.')
  if (amount > previous.player.cash) return fail(previous, 'INSUFFICIENT CASH', 'Your liquid balance cannot cover this deposit.')
  const state = clone(previous)
  const bank = state.banks.find((item) => item.id === bankId)
  if (!bank) return fail(previous, 'BANK NOT FOUND', 'This institution is not on the mesh.')
  if (bank.status === 'collapsed') return fail(previous, 'BANK CLOSED', 'This bank has collapsed. Deposits are frozen.')
  state.player.cash -= amount
  state.player.deposits[bankId] = (state.player.deposits[bankId] ?? 0) + amount
  bank.deposits += amount
  bank.reserves += amount * 0.9
  state.player.actions += 1
  log(state, `Deposited ${Math.round(amount).toLocaleString('en-US')} USD into ${bank.name}.`)
  return ok(state, 'DEPOSIT CLEARED', `${Math.round(amount).toLocaleString('en-US')} USD deposited at ${bank.rate.toFixed(1)}% APR.`)
}

export function withdraw(previous: GameState, bankId: string, amount: number): ActionResult {
  const state = clone(previous)
  const bank = state.banks.find((item) => item.id === bankId)
  if (!bank) return fail(previous, 'BANK NOT FOUND', 'This institution is not on the mesh.')
  const balance = state.player.deposits[bankId] ?? 0
  if (amount <= 0 || amount > balance) return fail(previous, 'INVALID WITHDRAWAL', 'Choose an amount within your deposit.')
  if (bank.status === 'collapsed') return fail(previous, 'DEPOSITS FROZEN', 'A receiver has frozen this bank. Withdrawals are unavailable.')
  const available = Math.min(amount, bank.reserves * 0.92)
  if (available < 1) return fail(previous, 'RESERVES EXHAUSTED', 'The bank cannot honor a withdrawal right now. This is how runs begin.')
  state.player.cash += available
  state.player.deposits[bankId] = balance - available
  bank.deposits -= available
  bank.reserves -= available
  state.player.actions += 1
  log(state, `Withdrew ${Math.round(available).toLocaleString('en-US')} USD from ${bank.name}.`)
  return ok(state, 'WITHDRAWAL CLEARED', `${Math.round(available).toLocaleString('en-US')} USD returned to liquid cash.`)
}

export function takeLoan(previous: GameState, bankId: string, amount: number): ActionResult {
  if (amount <= 0) return fail(previous, 'INVALID LOAN', 'Enter a positive loan amount.')
  const state = clone(previous)
  const bank = state.banks.find((item) => item.id === bankId)
  if (!bank) return fail(previous, 'BANK NOT FOUND', 'This institution is not on the mesh.')
  if (bank.status === 'collapsed') return fail(previous, 'BANK CLOSED', 'This bank cannot underwrite new credit.')
  const capacity = Math.min(bank.reserves * 0.45, netWorth(state) * 0.45)
  if (amount > capacity) return fail(previous, 'UNDERWRITING REFUSED', `This institution can extend at most ${Math.round(capacity / 1000)}K against your balance sheet.`)
  bank.loans += amount
  bank.reserves -= amount
  state.player.cash += amount
  state.player.debts[bankId] = (state.player.debts[bankId] ?? 0) + amount
  state.player.heat = clamp(state.player.heat + 2, 0, 100)
  syncHeat(state)
  state.player.actions += 1
  log(state, `Borrowed ${Math.round(amount).toLocaleString('en-US')} USD from ${bank.name} at ${bank.rate.toFixed(1)}%.`)
  return ok(state, 'CREDIT FACILITY OPEN', `${Math.round(amount).toLocaleString('en-US')} USD borrowed at ${bank.rate.toFixed(1)}% APR.`)
}

export function repayLoan(previous: GameState, bankId: string, amount: number): ActionResult {
  const state = clone(previous)
  const bank = state.banks.find((item) => item.id === bankId)
  const debt = state.player.debts[bankId] ?? 0
  if (!bank) return fail(previous, 'BANK NOT FOUND', 'This institution is not on the mesh.')
  if (amount <= 0 || debt <= 0) return fail(previous, 'NOTHING TO REPAY', 'There is no outstanding debt at this institution.')
  const payment = Math.min(amount, debt, state.player.cash)
  if (payment <= 0) return fail(previous, 'INSUFFICIENT CASH', 'Your liquid balance cannot cover this payment.')
  state.player.cash -= payment
  state.player.debts[bankId] = Math.max(0, debt - payment)
  bank.loans = Math.max(0, bank.loans - payment)
  bank.reserves += payment
  state.player.actions += 1
  log(state, `Repaid ${Math.round(payment).toLocaleString('en-US')} USD to ${bank.name}.`)
  return ok(state, 'DEBT SERVICED', `${Math.round(payment).toLocaleString('en-US')} USD repaid.`)
}

export function foundBank(previous: GameState, name: string): ActionResult {
  const clean = name.trim()
  if (clean.length < 3) return fail(previous, 'NAME REQUIRED', 'Give your institution a name.')
  const cost = 1_500_000
  if (previous.player.cash < cost) return fail(previous, 'INSUFFICIENT CAPITAL', 'Founding a bank requires $1.5M in liquid capital.')
  if (previous.banks.some((bank) => bank.playerOwned)) return fail(previous, 'LICENSE EXISTS', 'You already operate a licensed depository.')
  const state = clone(previous)
  state.player.cash -= cost
  state.banks.push({
    id: uid('bank'),
    name: clean,
    ownerId: 'player',
    ownerName: state.player.name,
    reserves: cost,
    deposits: 0,
    loans: 0,
    rate: 6.2,
    status: 'stable',
    hue: state.player.avatarHue,
    history: [0.1, 0.1, 0.1],
    playerOwned: true,
  })
  state.player.influence = clamp(state.player.influence + 6, 0, 100)
  state.player.actions += 1
  log(state, `Founded ${clean}. Charter approved by City Hall.`)
  notify(state, 'BANKING LICENSE APPROVED', `${clean} is now accepting deposits. Set your rate and build the loan book.`, 'good')
  return ok(state, 'BANK FOUNDED', `${clean} opened with $1.5M in reserves.`)
}

export function setBankRate(previous: GameState, bankId: string, rate: number): ActionResult {
  const state = clone(previous)
  const bank = state.banks.find((item) => item.id === bankId)
  if (!bank || !bank.playerOwned) return fail(previous, 'NOT AUTHORIZED', 'You do not control this institution.')
  bank.rate = clamp(rate, 0.5, 18)
  log(state, `${bank.name} deposit rate set to ${bank.rate.toFixed(1)}%.`)
  return ok(state, 'RATE UPDATED', `${bank.name} now pays ${bank.rate.toFixed(1)}% APR on deposits.`)
}

export function injectReserves(previous: GameState, bankId: string, amount: number): ActionResult {
  const state = clone(previous)
  const bank = state.banks.find((item) => item.id === bankId)
  if (!bank || !bank.playerOwned) return fail(previous, 'NOT AUTHORIZED', 'You do not control this institution.')
  if (amount <= 0 || amount > state.player.cash) return fail(previous, 'INSUFFICIENT CASH', 'Your liquid balance cannot cover this injection.')
  state.player.cash -= amount
  bank.reserves += amount
  log(state, `Injected ${Math.round(amount).toLocaleString('en-US')} USD into ${bank.name} reserves.`)
  return ok(state, 'RESERVES INJECTED', `${Math.round(amount).toLocaleString('en-US')} USD added to ${bank.name}. Leverage improved.`)
}

export function triggerBankRun(previous: GameState, bankId: string): ActionResult {
  const bank = previous.banks.find((item) => item.id === bankId)
  if (!bank) return fail(previous, 'BANK NOT FOUND', 'This institution is not on the mesh.')
  if (bank.playerOwned) return fail(previous, 'SELF-SABOTAGE BLOCKED', 'You cannot run your own bank from this terminal.')
  if (bank.status === 'collapsed') return fail(previous, 'ALREADY COLLAPSED', 'This bank is already in receivership.')
  if (previous.player.influence < 45) return fail(previous, 'NOT ENOUGH INFLUENCE', 'Coordinating a run requires 45 influence.')
  if (previous.player.dirtyCash < 100_000) return fail(previous, 'INSUFFICIENT DIRTY CASH', 'You need $100K in dirty cash to seed the panic.')
  const state = clone(previous)
  state.player.influence -= 45
  state.player.dirtyCash -= 100_000
  const success = Math.random() < clamp(0.38 + leverage(bank) / 40 + state.player.heat / 400, 0.15, 0.9)
  if (!success) {
    state.player.heat = clamp(state.player.heat + 10, 0, 100)
    syncHeat(state)
    log(state, `Attempted to trigger a run on ${bank.name}. The panic did not catch.`)
    return {
      state,
      toast: { title: 'RUN FAILED TO CATCH', message: `${bank.name} calmed depositors. You burned 100K dirty cash and 45 influence.`, tone: 'bad' },
    }
  }
  const runState = forceBankRun(state, bankId)
  return {
    state: runState,
    toast: { title: 'BANK RUN TRIGGERED', message: `${bank.name} collapsed under coordinated withdrawals.`, tone: 'warn' },
  }
}

export function buildNode(previous: GameState): ActionResult {
  const cost = 180_000
  if (previous.player.cash < cost) return fail(previous, 'INSUFFICIENT CASH', 'A fiber node costs $180K.')
  const state = clone(previous)
  const isp = playerIsp(state)
  if (!isp) return fail(previous, 'NO NETWORK', 'You do not own an ISP.')
  state.player.cash -= cost
  isp.nodes += 1
  isp.capacity += 2.2
  isp.security = clamp(isp.security + 1, 0, 100)
  isp.revenue = Math.round((isp.capacity * isp.load * isp.pricePerTbps * (isp.uptime / 100)) / 24)
  state.player.actions += 1
  log(state, `Built a fiber node in ${pick(['Helix Park', 'Data Basin', 'Southgate', 'Old Town'])}. Capacity +2.2 Tbps.`)
  return ok(state, 'FIBER NODE ONLINE', 'AetherLink capacity increased by 2.2 Tbps.')
}

export function buildDataCenter(previous: GameState): ActionResult {
  const cost = 520_000
  if (previous.player.cash < cost) return fail(previous, 'INSUFFICIENT CASH', 'A data center costs $520K.')
  const state = clone(previous)
  const isp = playerIsp(state)
  if (!isp) return fail(previous, 'NO NETWORK', 'You do not own an ISP.')
  state.player.cash -= cost
  isp.dataCenters += 1
  isp.capacity += 5.5
  isp.security = clamp(isp.security + 2, 0, 100)
  isp.revenue = Math.round((isp.capacity * isp.load * isp.pricePerTbps * (isp.uptime / 100)) / 24)
  state.player.actions += 1
  log(state, 'Commissioned a new data center in Data Basin. Capacity +5.5 Tbps.')
  return ok(state, 'DATA CENTER ONLINE', 'AetherLink added 5.5 Tbps of capacity and hardened its edge.')
}

export function upgradeBackbone(previous: GameState): ActionResult {
  const cost = 340_000
  if (previous.player.cash < cost) return fail(previous, 'INSUFFICIENT CASH', 'A backbone upgrade costs $340K.')
  const state = clone(previous)
  const isp = playerIsp(state)
  if (!isp) return fail(previous, 'NO NETWORK', 'You do not own an ISP.')
  state.player.cash -= cost
  isp.latency = Math.max(3, isp.latency - 2.4)
  isp.security = clamp(isp.security + 4, 0, 100)
  isp.uptime = clamp(isp.uptime + 0.02, 0, 100)
  state.player.actions += 1
  log(state, 'Upgraded AetherLink backbone routing. Latency improved.')
  return ok(state, 'BACKBONE UPGRADED', 'Latency reduced and route security hardened.')
}

export function repairNetwork(previous: GameState): ActionResult {
  const state = clone(previous)
  const isp = playerIsp(state)
  if (!isp) return fail(previous, 'NO NETWORK', 'You do not own an ISP.')
  const cost = Math.round(20_000 + (100 - isp.uptime) * 12_000)
  if (state.player.cash < cost) return fail(previous, 'INSUFFICIENT CASH', `Repair requires ${Math.round(cost / 1000)}K.`)
  state.player.cash -= cost
  isp.uptime = 99.96
  isp.latency = Math.max(4, isp.latency * 0.72)
  isp.security = clamp(isp.security + 3, 0, 100)
  state.player.actions += 1
  log(state, `Repaired AetherLink network for ${Math.round(cost / 1000)}K. Uptime restored.`)
  return ok(state, 'NETWORK RESTORED', 'Uptime is back to 99.96%. Latency normalized.')
}

export function hardenNetwork(previous: GameState): ActionResult {
  const cost = 260_000
  if (previous.player.cash < cost) return fail(previous, 'INSUFFICIENT CASH', 'A security hardening program costs $260K.')
  const state = clone(previous)
  const isp = playerIsp(state)
  if (!isp) return fail(previous, 'NO NETWORK', 'You do not own an ISP.')
  state.player.cash -= cost
  isp.security = clamp(isp.security + 14, 0, 100)
  state.player.actions += 1
  log(state, 'Deployed zero-trust routing and threat detection across AetherLink.')
  return ok(state, 'SECURITY HARDENED', 'AetherLink security rating increased by 14 points.')
}

export function setIspPrice(previous: GameState, price: number): ActionResult {
  const state = clone(previous)
  const isp = playerIsp(state)
  if (!isp) return fail(previous, 'NO NETWORK', 'You do not own an ISP.')
  isp.pricePerTbps = clamp(price, 400, 3_200)
  log(state, `AetherLink transit price set to $${isp.pricePerTbps}/Tbps.`)
  return ok(state, 'PRICING UPDATED', `Transit is now $${Math.round(isp.pricePerTbps)} per Tbps.`)
}

export function hackIsp(previous: GameState, targetId: string): ActionResult {
  const state = clone(previous)
  const target = state.isps.find((isp) => isp.id === targetId)
  if (!target) return fail(previous, 'TARGET NOT FOUND', 'This network is not on the mesh.')
  if (target.playerOwned) return fail(previous, 'TARGET IS YOURS', 'You cannot hack your own backbone.')
  if (state.player.dirtyCash < 80_000) return fail(previous, 'INSUFFICIENT DIRTY CASH', 'The intrusion crew requires $80K.')
  state.player.dirtyCash -= 80_000
  const success = Math.random() < clamp(0.55 + (100 - target.security) / 220 + state.player.influence / 500, 0.15, 0.92)
  if (success) {
    target.uptime = clamp(target.uptime - (3 + Math.random() * 6), 88, 100)
    target.load = clamp(target.load + 0.08, 0, 1.3)
    target.security = clamp(target.security - 4, 0, 100)
    state.player.heat = clamp(state.player.heat + 7, 0, 100)
    state.player.influence = clamp(state.player.influence + 2, 0, 100)
    syncHeat(state)
    post(state, {
      author: 'Zero Day Collective',
      handle: '@zeroday',
      avatarHue: 122,
      content: `${target.name} is bleeding packets. The backbone is not a fortress. It is a habit.`,
      sentiment: -25,
      verified: false,
      kind: 'crime',
      tags: [target.name, 'cyber'],
    })
    log(state, `Breached ${target.name}. Uptime down to ${target.uptime.toFixed(2)}%.`)
    return { state, toast: { title: 'INTRUSION SUCCESSFUL', message: `${target.name} uptime fell to ${target.uptime.toFixed(2)}%. Heat +7.`, tone: 'warn' } }
  }
  state.player.heat = clamp(state.player.heat + 14, 0, 100)
  state.player.reputation = clamp(state.player.reputation - 4, 0, 100)
  syncHeat(state)
  log(state, `Failed intrusion against ${target.name}. Forensic trail traced back to Nihann.`)
  return { state, toast: { title: 'INTRUSION FAILED', message: `The target traced the attack. Heat +14, reputation -4.`, tone: 'bad' } }
}

export function buyDistrict(previous: GameState, districtId: string): ActionResult {
  const state = clone(previous)
  const district = state.districts.find((item) => item.id === districtId)
  if (!district) return fail(previous, 'DISTRICT NOT FOUND', 'This district is not on the map.')
  const cost = Math.round(district.value * 0.22)
  if (state.player.cash < cost) return fail(previous, 'INSUFFICIENT CASH', `A property package here costs ${Math.round(cost / 1000)}K.`)
  state.player.cash -= cost
  district.owned += 1
  state.player.actions += 1
  log(state, `Acquired a property package in ${district.name} for ${Math.round(cost / 1000)}K.`)
  return ok(state, 'DEED TRANSFERRED', `You now hold ${district.owned} package(s) in ${district.name}. Yield ${district.yield.toFixed(1)}%.`)
}

export function createNetwork(previous: GameState, name: string, type: MediaStation['type']): ActionResult {
  const clean = name.trim()
  if (clean.length < 3) return fail(previous, 'NAME REQUIRED', 'Give your network a name.')
  const cost = 900_000
  if (previous.player.cash < cost) return fail(previous, 'INSUFFICIENT CASH', 'Launching a network requires $900K.')
  const state = clone(previous)
  state.player.cash -= cost
  state.media.push({
    id: uid('media'),
    name: clean,
    ownerId: 'player',
    ownerName: state.player.name,
    reach: 0.45,
    credibility: 62,
    sentiment: 55,
    revenue: 3_200,
    shows: 0,
    type,
    hue: state.player.avatarHue,
    headlines: ['A new signal enters the noise'],
    playerOwned: true,
  })
  state.player.influence = clamp(state.player.influence + 5, 0, 100)
  state.player.actions += 1
  log(state, `Launched ${clean} as a ${type} network.`)
  return ok(state, 'NETWORK LAUNCHED', `${clean} is on air with 450K initial reach.`)
}

export function launchShow(previous: GameState): ActionResult {
  const cost = 60_000
  if (previous.player.cash < cost) return fail(previous, 'INSUFFICIENT CASH', 'A new show costs $60K.')
  const state = clone(previous)
  const station = playerMedia(state)
  if (!station) return fail(previous, 'NO NETWORK', 'You do not own a media network.')
  state.player.cash -= cost
  station.shows += 1
  station.reach += 0.14 + Math.random() * 0.18
  station.credibility = clamp(station.credibility + 1.5, 0, 100)
  station.sentiment = clamp(station.sentiment + 2, 0, 100)
  station.headlines = [`${station.name} greenlights a new original series`, ...station.headlines].slice(0, 5)
  state.player.actions += 1
  log(state, `${station.name} launched a new original show. Reach +${(0.14).toFixed(2)}M.`)
  return ok(state, 'SHOW GREENLIT', `${station.name} added a new show. Reach is now ${station.reach.toFixed(2)}M.`)
}

export function runPropaganda(previous: GameState, tokenId: string): ActionResult {
  const cost = 120_000
  if (previous.player.cash < cost) return fail(previous, 'INSUFFICIENT CASH', 'A narrative campaign costs $120K.')
  const state = clone(previous)
  const station = playerMedia(state)
  const token = state.tokens.find((item) => item.id === tokenId)
  if (!station) return fail(previous, 'NO NETWORK', 'You do not own a media network.')
  if (!token || token.rugged) return fail(previous, 'TARGET UNAVAILABLE', 'Choose a live token to amplify.')
  state.player.cash -= cost
  const success = Math.random() < clamp(0.58 + station.credibility / 300 + state.player.influence / 500, 0.2, 0.92)
  if (success) {
    const lift = 0.06 + Math.random() * 0.1
    token.price *= 1 + lift
    token.momentum += lift * 0.35
    token.volume24h *= 1.4
    station.sentiment = clamp(station.sentiment + 4, 0, 100)
    station.credibility = clamp(station.credibility - 3, 0, 100)
    state.player.heat = clamp(state.player.heat + 3, 0, 100)
    syncHeat(state)
    post(state, {
      author: station.name,
      handle: `@${station.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      avatarHue: station.hue,
      content: `Why $${token.symbol} is the most misunderstood asset on the mesh. A Signal 9 investigation.`,
      sentiment: 52,
      verified: true,
      source: 'player',
      kind: 'media',
      tags: [`$${token.symbol}`, station.name],
    })
    log(state, `Ran a propaganda campaign for $${token.symbol}. Price +${(lift * 100).toFixed(1)}%.`)
    return { state, toast: { title: 'NARRATIVE DEPLOYED', message: `$${token.symbol} rose ${(lift * 100).toFixed(1)}%. Credibility -3.`, tone: 'warn' } }
  }
  station.credibility = clamp(station.credibility - 8, 0, 100)
  state.player.heat = clamp(state.player.heat + 5, 0, 100)
  syncHeat(state)
  log(state, `Propaganda campaign for $${token.symbol} failed. Audience rejected the framing.`)
  return { state, toast: { title: 'NARRATIVE REJECTED', message: 'The audience saw through it. Credibility -8, heat +5.', tone: 'bad' } }
}

export function runExpose(previous: GameState, targetId: string): ActionResult {
  const cost = 90_000
  if (previous.player.cash < cost) return fail(previous, 'INSUFFICIENT CASH', 'An investigation costs $90K.')
  const state = clone(previous)
  const station = playerMedia(state)
  if (!station) return fail(previous, 'NO NETWORK', 'You do not own a media network.')
  const corp = state.corporations.find((item) => item.id === targetId)
  const mediaTarget = state.media.find((item) => item.id === targetId)
  if (!corp && !mediaTarget) return fail(previous, 'TARGET NOT FOUND', 'Choose a listed company or rival network.')
  if (mediaTarget?.playerOwned) return fail(previous, 'TARGET IS YOURS', 'You cannot expose your own network.')
  state.player.cash -= cost
  const success = Math.random() < clamp(0.55 + station.credibility / 250, 0.2, 0.92)
  if (success) {
    if (corp) {
      corp.sharePrice *= 0.91
      corp.growth = clamp(corp.growth - 2.2, -30, 60)
      corp.fairValue *= 0.94
    }
    if (mediaTarget) {
      mediaTarget.credibility = clamp(mediaTarget.credibility - 12, 0, 100)
      mediaTarget.sentiment = clamp(mediaTarget.sentiment - 8, 0, 100)
    }
    station.credibility = clamp(station.credibility + 3, 0, 100)
    station.reach += 0.08
    state.player.reputation = clamp(state.player.reputation + 3, 0, 100)
    post(state, {
      author: station.name,
      handle: `@${station.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      avatarHue: station.hue,
      content: `EXPOSED: The documents ${corp ? corp.name : mediaTarget?.name} did not want you to read. Tonight, 9 PM.`,
      sentiment: -40,
      verified: true,
      source: 'player',
      kind: 'scandal',
      tags: ['investigation', station.name],
    })
    log(state, `Aired an exposé on ${corp?.name ?? mediaTarget?.name}.`)
    return ok(state, 'EXPOSÉ AIRED', `${corp?.name ?? mediaTarget?.name} took a reputational hit. Your credibility rose.`)
  }
  station.credibility = clamp(station.credibility - 7, 0, 100)
  state.player.reputation = clamp(state.player.reputation - 2, 0, 100)
  log(state, `Exposé on ${corp?.name ?? mediaTarget?.name} failed fact-check.`)
  return { state, toast: { title: 'EXPOSÉ PULLED', message: 'The story failed legal review. Credibility -7.', tone: 'bad' } }
}

export function runFakeNews(previous: GameState): ActionResult {
  const cost = 40_000
  if (previous.player.dirtyCash < cost) return fail(previous, 'INSUFFICIENT DIRTY CASH', 'A black-budget story costs $40K in dirty cash.')
  const state = clone(previous)
  const station = playerMedia(state)
  const token = pick(state.tokens.filter((item) => !item.rugged))
  if (!station) return fail(previous, 'NO NETWORK', 'You do not own a media network.')
  if (!token) return fail(previous, 'NO TARGET', 'There is no live token to target.')
  state.player.dirtyCash -= cost
  const positive = Math.random() < 0.5
  const swing = 0.08 + Math.random() * 0.12
  token.price *= positive ? 1 + swing : 1 - swing
  token.momentum += (positive ? 1 : -1) * swing * 0.3
  station.credibility = clamp(station.credibility - 8, 0, 100)
  station.sentiment = clamp(station.sentiment + (positive ? 5 : -5), 0, 100)
  state.player.heat = clamp(state.player.heat + 8, 0, 100)
  syncHeat(state)
  post(state, {
    author: station.name,
    handle: `@${station.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    avatarHue: station.hue,
    content: `Sources confirm: $${token.symbol} ${positive ? 'has secured a sovereign partnership' : 'is under federal investigation'}. More at 11.`,
    sentiment: positive ? 48 : -52,
    verified: false,
    source: 'player',
    kind: 'scandal',
    tags: [`$${token.symbol}`, 'breaking'],
  })
  log(state, `Published a fabricated story on $${token.symbol}. Price moved ${positive ? '+' : '-'}${(swing * 100).toFixed(1)}%.`)
  return { state, toast: { title: 'STORY PLANTED', message: `$${token.symbol} moved ${positive ? '+' : '-'}${(swing * 100).toFixed(1)}%. Credibility -8, heat +8.`, tone: 'warn' } }
}

export function launder(previous: GameState, amount: number): ActionResult {
  if (amount <= 0) return fail(previous, 'INVALID AMOUNT', 'Enter a positive amount.')
  if (amount > previous.player.dirtyCash) return fail(previous, 'INSUFFICIENT DIRTY CASH', 'You cannot launder more than you hold.')
  const state = clone(previous)
  const seized = Math.random() < clamp(0.05 + state.player.heat / 500, 0.05, 0.28)
  if (seized) {
    state.player.dirtyCash -= amount
    state.player.heat = clamp(state.player.heat + 9, 0, 100)
    syncHeat(state)
    log(state, `Laundering operation intercepted. ${Math.round(amount).toLocaleString('en-US')} USD seized.`)
    return { state, toast: { title: 'TRANSACTION SEIZED', message: `${Math.round(amount / 1000)}K dirty cash was intercepted. Heat +9.`, tone: 'bad' } }
  }
  const fee = 0.14 + Math.random() * 0.05
  const clean = amount * (1 - fee)
  state.player.dirtyCash -= amount
  state.player.cash += clean
  state.player.heat = clamp(state.player.heat + amount / 250_000, 0, 100)
  state.player.influence = clamp(state.player.influence + 1, 0, 100)
  syncHeat(state)
  log(state, `Laundered ${Math.round(amount / 1000)}K dirty cash at ${(fee * 100).toFixed(1)}% fee.`)
  return ok(state, 'FUNDS CLEANED', `${Math.round(clean).toLocaleString('en-US')} USD moved to liquid cash.`)
}

export function bribeOfficial(previous: GameState, officialId: string): ActionResult {
  const state = clone(previous)
  const official = state.government.officials.find((item) => item.id === officialId)
  if (!official) return fail(previous, 'OFFICIAL NOT FOUND', 'This official is not on the payroll grid.')
  if (official.bribed) return fail(previous, 'ALREADY COMPROMISED', `${official.name} is already in your pocket.`)
  if (state.player.cash < official.bribePrice) return fail(previous, 'INSUFFICIENT CASH', `The retainer is ${Math.round(official.bribePrice / 1000)}K.`)
  state.player.cash -= official.bribePrice
  official.bribed = true
  official.loyalty = clamp(official.loyalty + 28, 0, 100)
  state.player.heat = clamp(state.player.heat - 12, 0, 100)
  state.player.influence = clamp(state.player.influence + 4, 0, 100)
  state.player.reputation = clamp(state.player.reputation - 2, 0, 100)
  syncHeat(state)
  state.player.actions += 1
  log(state, `Retained ${official.name} for ${Math.round(official.bribePrice / 1000)}K. Heat -12.`)
  return ok(state, 'OFFICIAL RETAINED', `${official.name} is now aligned with your interests. Heat -12, influence +4.`)
}

export function smuggle(previous: GameState): ActionResult {
  const cost = 50_000
  if (previous.player.dirtyCash < cost) return fail(previous, 'INSUFFICIENT DIRTY CASH', 'A smuggling run requires $50K in dirty cash.')
  const state = clone(previous)
  state.player.dirtyCash -= cost
  const success = Math.random() < clamp(0.62 - state.player.heat / 300, 0.2, 0.9)
  if (success) {
    const profit = 90_000 + Math.random() * 130_000
    state.player.dirtyCash += profit
    state.player.heat = clamp(state.player.heat + 5, 0, 100)
    syncHeat(state)
    log(state, `Smuggling run cleared Dockside. Profit ${Math.round(profit / 1000)}K.`)
    return ok(state, 'RUN CLEARED', `Cargo moved through Dockside. Dirty cash +${Math.round(profit / 1000)}K.`)
  }
  state.player.heat = clamp(state.player.heat + 13, 0, 100)
  syncHeat(state)
  log(state, 'Smuggling run intercepted at Dockside. Cargo lost.')
  return { state, toast: { title: 'RUN INTERCEPTED', message: 'Customs seized the cargo. Heat +13.', tone: 'bad' } }
}

export function racketeer(previous: GameState): ActionResult {
  if (previous.player.influence < 8) return fail(previous, 'NOT ENOUGH INFLUENCE', 'Racketeering requires 8 influence.')
  const state = clone(previous)
  state.player.influence -= 8
  const take = 28_000 + Math.random() * 38_000
  state.player.dirtyCash += take
  state.player.heat = clamp(state.player.heat + 5, 0, 100)
  const syndicate = state.syndicates.find((item) => item.playerOwned)
  if (syndicate) syndicate.operations += 1
  syncHeat(state)
  state.player.actions += 1
  log(state, `Racketeering operation in ${pick(['The Narrows', 'Dockside', 'Southgate'])} collected ${Math.round(take / 1000)}K.`)
  return ok(state, 'PROTECTION RUN', `Collected ${Math.round(take / 1000)}K in dirty cash. Heat +5.`)
}

export function payLegal(previous: GameState, amount: number): ActionResult {
  if (amount <= 0 || amount > previous.player.cash) return fail(previous, 'INVALID TRANSFER', 'Enter an amount within your liquid cash.')
  const state = clone(previous)
  state.player.cash -= amount
  state.player.legalFund += amount
  log(state, `Moved ${Math.round(amount / 1000)}K into the legal defense fund.`)
  return ok(state, 'LEGAL FUND FUNDED', `${Math.round(amount / 1000)}K is now available for legal defense.`)
}

export function cyberHeist(previous: GameState, bankId: string): ActionResult {
  const cost = 150_000
  if (previous.player.dirtyCash < cost) return fail(previous, 'INSUFFICIENT DIRTY CASH', 'The crew requires $150K upfront.')
  const state = clone(previous)
  const bank = state.banks.find((item) => item.id === bankId)
  if (!bank || bank.status === 'collapsed') return fail(previous, 'TARGET UNAVAILABLE', 'This bank cannot be breached.')
  if (bank.playerOwned) return fail(previous, 'TARGET IS YOURS', 'You cannot heist your own bank.')
  state.player.dirtyCash -= cost
  const success = Math.random() < clamp(0.28 + (100 - bank.reserves / Math.max(1, bank.deposits) * 100) / 300 + state.player.influence / 600, 0.1, 0.72)
  if (success) {
    const loot = Math.min(bank.reserves * (0.03 + Math.random() * 0.05), 18_000_000)
    bank.reserves -= loot
    state.player.dirtyCash += loot
    state.player.heat = clamp(state.player.heat + 16, 0, 100)
    syncHeat(state)
    log(state, `Cyber heist on ${bank.name} extracted ${Math.round(loot / 1_000_000)}M.`)
    return { state, toast: { title: 'HEIST COMPLETE', message: `${Math.round(loot / 1_000_000)}M moved to dirty cash. Heat +16.`, tone: 'warn' } }
  }
  state.player.heat = clamp(state.player.heat + 20, 0, 100)
  syncHeat(state)
  log(state, `Cyber heist on ${bank.name} failed. Forensics found the entry vector.`)
  return { state, toast: { title: 'HEIST FAILED', message: 'The bank traced the intrusion. Heat +20.', tone: 'bad' } }
}

export function lobby(previous: GameState): ActionResult {
  const cost = 250_000
  if (previous.player.cash < cost) return fail(previous, 'INSUFFICIENT CASH', 'A lobbying package costs $250K.')
  const state = clone(previous)
  state.player.cash -= cost
  state.government.regulation = clamp(state.government.regulation - 3.5, 0, 100)
  state.government.taxRate = clamp(state.government.taxRate - 0.4, 5, 35)
  state.government.approval = clamp(state.government.approval + 1, 0, 100)
  state.player.influence = clamp(state.player.influence + 5, 0, 100)
  state.player.actions += 1
  log(state, 'Lobbied City Hall for lighter regulation and tax relief.')
  return ok(state, 'LOBBYING COMPLETE', 'Regulation pressure fell 3.5 points and the transaction tax was trimmed.')
}

export function fundCampaign(previous: GameState): ActionResult {
  const cost = 500_000
  if (previous.player.cash < cost) return fail(previous, 'INSUFFICIENT CASH', 'A campaign contribution costs $500K.')
  const state = clone(previous)
  state.player.cash -= cost
  state.player.influence = clamp(state.player.influence + 12, 0, 100)
  state.government.approval = clamp(state.government.approval + 2, 0, 100)
  state.player.heat = clamp(state.player.heat - 3, 0, 100)
  syncHeat(state)
  state.player.actions += 1
  log(state, 'Funded a civic campaign. Influence +12.')
  return ok(state, 'CAMPAIGN FUNDED', 'Influence +12, approval +2, heat -3.')
}

export function dismissWarrant(previous: GameState): ActionResult {
  const state = clone(previous)
  const warrant = state.government.warrants.find((item) => item.targetId === 'player' && item.status === 'active')
  if (!warrant) return fail(previous, 'NO ACTIVE WARRANT', 'There is no warrant to dismiss.')
  const reed = state.government.officials.find((official) => official.id === 'reed')
  if (!reed?.bribed && state.player.legalFund < 500_000) return fail(previous, 'NO LEVERAGE', 'Bribe Director Reed or fund a $500K legal defense.')
  if (!reed?.bribed) state.player.legalFund -= 500_000
  warrant.status = 'dismissed'
  state.player.influence = clamp(state.player.influence - 8, 0, 100)
  state.player.reputation = clamp(state.player.reputation + 4, 0, 100)
  log(state, 'Warrant dismissed through legal and political pressure.')
  return ok(state, 'WARRANT DISMISSED', 'The case has been buried. Influence -8.')
}

export function requestBailout(previous: GameState): ActionResult {
  const state = clone(previous)
  const failingBank = state.banks.find((bank) => bank.playerOwned && (bank.status === 'critical' || bank.status === 'collapsed'))
  const marketDown = state.marketIndex < state.indexHistory[Math.max(0, state.indexHistory.length - 24)] * 0.88
  if (!failingBank && !marketDown) return fail(previous, 'NO QUALIFYING CRISIS', 'The city only bails out systemic failures.')
  if (state.player.influence < 30) return fail(previous, 'NOT ENOUGH INFLUENCE', 'A bailout request requires 30 influence.')
  state.player.influence -= 30
  const success = Math.random() < clamp(0.42 + state.player.influence / 300 + state.government.approval / 400, 0.2, 0.85)
  if (success) {
    const amount = failingBank ? Math.round(failingBank.deposits * 0.18) : 12_000_000 + Math.random() * 28_000_000
    state.player.cash += amount
    state.government.budget -= amount
    state.government.approval = clamp(state.government.approval - 4, 0, 100)
    state.government.stimulus += amount
    if (failingBank) {
      failingBank.reserves += amount * 0.6
      failingBank.status = 'watch'
    }
    log(state, `Secured a ${Math.round(amount / 1_000_000)}M bailout package.`)
    return { state, toast: { title: 'BAILOUT APPROVED', message: `${Math.round(amount / 1_000_000)}M injected. Approval -4.`, tone: 'warn' } }
  }
  state.government.approval = clamp(state.government.approval - 2, 0, 100)
  log(state, 'Bailout request rejected by the council.')
  return { state, toast: { title: 'BAILOUT REJECTED', message: 'The council called it moral hazard. Influence spent.', tone: 'bad' } }
}

export function postToWire(previous: GameState, content: string): ActionResult {
  const clean = content.trim()
  if (clean.length < 2) return fail(previous, 'EMPTY TRANSMISSION', 'Write something the mesh can react to.')
  if (clean.length > 420) return fail(previous, 'TRANSMISSION TOO LONG', 'Keep posts under 420 characters.')
  const state = clone(previous)
  state.player.influence = clamp(state.player.influence + 1, 0, 100)
  state.player.xp += 4
  const item = post(state, {
    author: state.player.name,
    handle: state.player.handle,
    avatarHue: state.player.avatarHue,
    content: clean,
    sentiment: 18,
    verified: true,
    source: 'player',
    kind: 'social',
    tags: ['wire'],
  })
  // Mirror the transmission to the optional Supabase Realtime backend. The
  // local simulation never waits on the network; failures are silent.
  void publishWirePost(item)
  log(state, 'Posted to The Wire.')
  return ok(state, 'TRANSMISSION SENT', 'Your post is live on The Wire.')
}

export function setProfile(previous: GameState, name: string, email: string): ActionResult {
  const cleanName = name.trim() || previous.player.name
  const cleanEmail = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return fail(previous, 'INVALID EMAIL', 'Enter a valid email address.')
  const state = clone(previous)
  state.player.name = cleanName
  state.player.handle = `@${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18) || 'operator'}`
  state.player.email = cleanEmail
  state.player.godMode = cleanEmail === GOD_EMAIL
  log(state, `Profile updated for ${cleanName}.`)
  if (state.player.godMode) {
    return { state, toast: { title: 'GOD MODE UNLOCKED', message: 'The server admin terminal is now available.', tone: 'warn' } }
  }
  return ok(state, 'PROFILE UPDATED', `Identity synced as ${cleanName}.`)
}

export function godSpawn(previous: GameState, amount: number): ActionResult {
  if (!previous.player.godMode) return fail(previous, 'ACCESS DENIED', 'God mode is not active for this profile.')
  const state = clone(previous)
  state.player.cash += amount
  state.player.dirtyCash += amount * 0.25
  log(state, `[GOD] Spawned ${Math.round(amount / 1_000_000)}M in liquidity.`)
  return ok(state, 'LIQUIDITY SPAWNED', `${Math.round(amount / 1_000_000)}M added to your balance.`)
}

export function godPump(previous: GameState, tokenId: string, direction: 'pump' | 'crash'): ActionResult {
  if (!previous.player.godMode) return fail(previous, 'ACCESS DENIED', 'God mode is not active for this profile.')
  const state = clone(previous)
  const token = state.tokens.find((item) => item.id === tokenId)
  if (!token) return fail(previous, 'TOKEN NOT FOUND', 'This asset does not exist.')
  token.price *= direction === 'pump' ? 1.75 : 0.32
  token.momentum = direction === 'pump' ? 0.12 : -0.16
  token.history[token.history.length - 1] = token.price
  post(state, {
    author: 'Grok World Engine',
    handle: '@grok',
    avatarHue: direction === 'pump' ? 42 : 350,
    content: direction === 'pump' ? `$${token.symbol} is being repriced by a sovereign bid. Do not fight the tape.` : `$${token.symbol} just lost its bid. The order book is a crime scene.`,
    sentiment: direction === 'pump' ? 64 : -72,
    verified: true,
    source: 'grok',
    kind: 'market',
    tags: [`$${token.symbol}`, 'godmode'],
  })
  log(state, `[GOD] ${direction === 'pump' ? 'Pumped' : 'Crashed'} $${token.symbol}.`)
  return ok(state, direction === 'pump' ? 'TOKEN PUMPED' : 'TOKEN CRASHED', `$${token.symbol} moved to $${token.price.toFixed(4)}.`)
}

export function godCrashMarket(previous: GameState): ActionResult {
  if (!previous.player.godMode) return fail(previous, 'ACCESS DENIED', 'God mode is not active for this profile.')
  const state = clone(previous)
  for (const token of state.tokens) {
    token.price *= 0.55
    token.momentum = -0.14
    token.history[token.history.length - 1] = token.price
  }
  for (const corp of state.corporations) {
    corp.sharePrice *= 0.68
    corp.history[corp.history.length - 1] = corp.sharePrice
  }
  state.marketIndex *= 0.72
  state.indexHistory[state.indexHistory.length - 1] = state.marketIndex
  state.volatility = 92
  const cascade: WorldEvent = {
    id: uid('evt'),
    title: 'Server-Wide Liquidation Cascade',
    description: 'An admin-level margin call wiped 45% from every risk asset on the mesh. The order books are empty and the city is on fire.',
    category: 'finance',
    severity: 'critical',
    startedDay: state.day,
    endsDay: state.day + 3,
    effects: [{ kind: 'market', delta: -0.02 }],
    source: 'grok',
    hue: 350,
    headline: 'LIQUIDATION CASCADE: every risk asset down 45%',
  }
  state.events = [cascade, ...state.events].slice(0, 5)
  log(state, '[GOD] Triggered a server-wide liquidation cascade.')
  return { state, toast: { title: 'MARKET CRASHED', message: 'Every risk asset is down sharply. Volatility at 92.', tone: 'warn' } }
}

export function godWipe(previous: GameState, kind: 'bank' | 'isp' | 'media' | 'corp', id: string): ActionResult {
  if (!previous.player.godMode) return fail(previous, 'ACCESS DENIED', 'God mode is not active for this profile.')
  const state = clone(previous)
  if (kind === 'bank') {
    const bank = state.banks.find((item) => item.id === id)
    if (bank) {
      bank.status = 'collapsed'
      bank.reserves = 0
      bank.deposits = 0
      bank.loans = 0
    }
  }
  if (kind === 'isp') {
    const isp = state.isps.find((item) => item.id === id)
    if (isp) {
      isp.uptime = 0
      isp.load = 0
      isp.capacity = 0.1
    }
  }
  if (kind === 'media') {
    const station = state.media.find((item) => item.id === id)
    if (station) {
      station.reach = 0.01
      station.credibility = 0
    }
  }
  if (kind === 'corp') {
    const corp = state.corporations.find((item) => item.id === id)
    if (corp) {
      corp.sharePrice = 0.5
      corp.fairValue = 0.5
      corp.history[corp.history.length - 1] = 0.5
    }
  }
  log(state, `[GOD] Wiped ${kind} ${id}.`)
  return { state, toast: { title: 'ENTITY WIPED', message: `${kind.toUpperCase()} ${id} has been erased from the mesh.`, tone: 'warn' } }
}

export function godEvent(previous: GameState): ActionResult {
  if (!previous.player.godMode) return fail(previous, 'ACCESS DENIED', 'God mode is not active for this profile.')
  const state = clone(previous)
  const event = generateLocalEvent(state)
  event.source = 'grok'
  state.events = [event, ...state.events].slice(0, 5)
  post(state, {
    author: 'Grok World Engine',
    handle: '@grok',
    avatarHue: event.hue,
    content: event.headline,
    sentiment: event.severity === 'critical' ? -64 : -22,
    verified: true,
    source: 'grok',
    kind: 'news',
    tags: [event.category, 'world-engine'],
  })
  log(state, `[GOD] Injected world event: ${event.title}.`)
  return { state, toast: { title: 'WORLD EVENT INJECTED', message: event.title, tone: 'warn' } }
}

export function godMax(previous: GameState): ActionResult {
  if (!previous.player.godMode) return fail(previous, 'ACCESS DENIED', 'God mode is not active for this profile.')
  const state = clone(previous)
  state.player.influence = 100
  state.player.reputation = 100
  state.player.heat = 0
  state.government.officials = state.government.officials.map((official) => ({ ...official, bribed: true, loyalty: 100 }))
  state.government.warrants = state.government.warrants.map((warrant) => ({ ...warrant, status: 'dismissed' as const }))
  syncHeat(state)
  log(state, '[GOD] Maximum influence and total political capture applied.')
  return ok(state, 'TOTAL CAPTURE', 'Influence 100, reputation 100, heat 0, every official compromised.')
}

export function godReset(previous: GameState): ActionResult {
  if (!previous.player.godMode) return fail(previous, 'ACCESS DENIED', 'God mode is not active for this profile.')
  const state = createInitialState()
  state.player.godMode = true
  state.log = ['[GOD] World reset to genesis.', ...state.log]
  return ok(state, 'WORLD RESET', 'The simulation has been restored to genesis state.')
}

export function resetGame(previous: GameState): ActionResult {
  const state = createInitialState()
  state.player.godMode = state.player.email.toLowerCase() === GOD_EMAIL
  return ok(state, 'SIMULATION RESET', 'A fresh world has been seeded.')
}
