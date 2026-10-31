import type { Bank, Corporation, GameState, ISP, MediaStation, Token } from './types'
import { clamp } from './format'

export function holdingUnits(state: GameState, tokenId: string): number {
  const holding = state.player.holdings.find((item) => item.tokenId === tokenId)
  if (!holding) return 0
  return holding.units + holding.staked
}

export function tokenValue(state: GameState, tokenId: string): number {
  const token = state.tokens.find((item) => item.id === tokenId)
  if (!token) return 0
  const holding = state.player.holdings.find((item) => item.tokenId === tokenId)
  if (!holding) return 0
  return (holding.units + holding.staked) * token.price + holding.pending
}

export function portfolioValue(state: GameState): number {
  return state.player.holdings.reduce((total, holding) => {
    const token = state.tokens.find((item) => item.id === holding.tokenId)
    if (!token) return total
    return total + (holding.units + holding.staked) * token.price + holding.pending
  }, 0)
}

export function ispValue(isp: ISP): number {
  return isp.capacity * 182_000 + isp.dataCenters * 240_000 + isp.nodes * 38_000
}

export function mediaValue(station: MediaStation): number {
  return station.reach * 720_000 * (station.credibility / 100) + station.shows * 64_000
}

export function bankEquity(bank: Bank): number {
  return Math.max(0, bank.reserves + bank.deposits - bank.loans)
}

export function corporationValue(corp: Corporation): number {
  return corp.playerShares * corp.sharePrice
}

export function districtValue(state: GameState): number {
  return state.districts.reduce((total, district) => total + district.owned * district.value, 0)
}

export function debtValue(state: GameState): number {
  return Object.values(state.player.debts).reduce((total, value) => total + value, 0)
}

export function netWorth(state: GameState): number {
  const isps = state.isps.filter((isp) => isp.playerOwned).reduce((total, isp) => total + ispValue(isp), 0)
  const stations = state.media.filter((station) => station.playerOwned).reduce((total, station) => total + mediaValue(station), 0)
  const banks = state.banks.filter((bank) => bank.playerOwned).reduce((total, bank) => total + bankEquity(bank) * 0.35, 0)
  const corps = state.corporations.reduce((total, corp) => total + corporationValue(corp), 0)
  return (
    state.player.cash +
    state.player.dirtyCash * 0.78 +
    portfolioValue(state) +
    isps +
    stations +
    banks +
    corps +
    districtValue(state) +
    state.player.legalFund -
    debtValue(state)
  )
}

export function liquidNetWorth(state: GameState): number {
  return state.player.cash + portfolioValue(state) + state.player.dirtyCash * 0.78
}

export function leverage(bank: Bank): number {
  return bank.loans / Math.max(1, bank.reserves)
}

export function bankRisk(bank: Bank): number {
  return clamp((leverage(bank) - 4) * 9 + (100 - bank.reserves / Math.max(1, bank.deposits) * 100) * 0.4, 0, 100)
}

export function allocation(state: GameState) {
  const isps = state.isps.filter((isp) => isp.playerOwned).reduce((total, isp) => total + ispValue(isp), 0)
  const stations = state.media.filter((station) => station.playerOwned).reduce((total, station) => total + mediaValue(station), 0)
  const banks = state.banks.filter((bank) => bank.playerOwned).reduce((total, bank) => total + bankEquity(bank) * 0.35, 0)
  const corps = state.corporations.reduce((total, corp) => total + corporationValue(corp), 0)
  const tokens = portfolioValue(state)
  const property = districtValue(state)
  const cash = state.player.cash + state.player.legalFund
  return [
    { label: 'Liquid cash', value: cash, hue: 174 },
    { label: 'Token book', value: tokens, hue: 286 },
    { label: 'Infrastructure', value: isps, hue: 196 },
    { label: 'Media reach', value: stations, hue: 302 },
    { label: 'Equities', value: corps, hue: 42 },
    { label: 'Banking', value: banks, hue: 218 },
    { label: 'District deeds', value: property, hue: 142 },
  ].filter((item) => item.value > 0)
}

export function dailyIncome(state: GameState): number {
  const isp = state.isps.filter((item) => item.playerOwned).reduce((total, item) => total + item.revenue, 0)
  const media = state.media.filter((item) => item.playerOwned).reduce((total, item) => total + item.revenue, 0)
  const corps = state.corporations.reduce((total, corp) => {
    const ownership = corp.playerShares / Math.max(1, corp.sharesOutstanding)
    return total + corp.revenue * 0.035 * ownership
  }, 0)
  const banks = state.banks.filter((bank) => bank.playerOwned).reduce((total, bank) => {
    return total + bank.loans * (bank.rate / 100) / 365
  }, 0)
  const property = state.districts.reduce((total, district) => total + district.owned * district.value * (district.yield / 100) / 365, 0)
  return isp + media + corps + banks + property
}

export function totalAssets(state: GameState): number {
  return netWorth(state) + debtValue(state)
}

export function ownership(corp: Corporation): number {
  return (corp.playerShares / Math.max(1, corp.sharesOutstanding)) * 100
}

export function tokenChange(token: Token, lookback = 12): number {
  if (token.history.length < 2) return 0
  const start = token.history[Math.max(0, token.history.length - 1 - lookback)]
  if (!start) return 0
  return ((token.price - start) / start) * 100
}

export function corpChange(corp: Corporation, lookback = 12): number {
  if (corp.history.length < 2) return 0
  const start = corp.history[Math.max(0, corp.history.length - 1 - lookback)]
  if (!start) return 0
  return ((corp.sharePrice - start) / start) * 100
}

export function marketCap(state: GameState): number {
  return state.tokens.reduce((total, token) => total + token.price * token.supply, 0)
}

export function heatLabel(heat: number): { label: string; tone: 'good' | 'warn' | 'bad' } {
  if (heat >= 75) return { label: 'BURNING', tone: 'bad' }
  if (heat >= 50) return { label: 'HOT', tone: 'warn' }
  if (heat >= 25) return { label: 'WARM', tone: 'warn' }
  return { label: 'COOL', tone: 'good' }
}

export function engineStatusLabel(state: GameState): string {
  if (state.engineStatus === 'grok') return 'GROK LIVE'
  if (state.engineStatus === 'connecting') return 'SYNCING'
  return 'LOCAL AI'
}
