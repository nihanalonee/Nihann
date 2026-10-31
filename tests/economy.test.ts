import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  allocation,
  bankRisk,
  dailyIncome,
  debtValue,
  heatLabel,
  leverage,
  netWorth,
  portfolioValue,
  tokenChange,
} from '../lib/economy'
import { clamp, clock, money, pct, tokenPrice, trendOf } from '../lib/format'
import { createInitialState } from '../lib/seed'

test('format helpers render money, prices, percentages and clocks', () => {
  assert.equal(money(1_234, true), '$1.2K')
  assert.equal(money(-1_234, true), '-$1.2K')
  assert.equal(money(2_500_000), '$2,500,000')
  assert.equal(tokenPrice(142.3), '$142.30')
  assert.equal(tokenPrice(0.0842), '$0.0842')
  assert.equal(tokenPrice(0.0001234), '$0.000123')
  assert.equal(pct(2.345), '+2.3%')
  assert.equal(pct(-4.2), '-4.2%')
  assert.equal(clock(42, 13), 'DAY 042 · 01:00 PM')
  assert.equal(clamp(120, 0, 100), 100)
  assert.equal(trendOf([100, 110, 121]), 21)
})

test('seeded world has the expected living systems', () => {
  const state = createInitialState()
  assert.equal(state.version, 7)
  assert.equal(state.districts.length, 10)
  assert.ok(state.tokens.length >= 6)
  assert.ok(state.banks.length >= 4)
  assert.ok(state.isps.some((isp) => isp.playerOwned))
  assert.ok(state.media.some((station) => station.playerOwned))
  assert.ok(state.syndicates.some((syndicate) => syndicate.playerOwned))
  assert.equal(state.player.godMode, true)
  assert.equal(state.player.influence, 100)
})

test('net worth and allocation account for the player portfolio', () => {
  const state = createInitialState()
  const worth = netWorth(state)
  assert.ok(Number.isFinite(worth))
  assert.ok(worth > 0)
  assert.equal(debtValue(state), 0)
  assert.ok(portfolioValue(state) > 0)

  const slices = allocation(state)
  assert.ok(slices.length >= 5)
  assert.ok(slices.every((slice) => slice.value > 0))
  assert.ok(dailyIncome(state) >= 0)
})

test('bank leverage and risk reflect the seeded loan book', () => {
  const state = createInitialState()
  const blackVault = state.banks.find((bank) => bank.id === 'blackvault')
  assert.ok(blackVault)
  assert.ok(Math.abs(leverage(blackVault!) - 728 / 64) < 1e-9)
  assert.equal(bankRisk(blackVault!) > 50, true)
  assert.equal(bankRisk(state.banks[0]) >= 0, true)
  assert.equal(bankRisk(state.banks[0]) <= 100, true)
})

test('heat labels map to the expected severity bands', () => {
  assert.deepEqual(heatLabel(10), { label: 'COOL', tone: 'good' })
  assert.deepEqual(heatLabel(30), { label: 'WARM', tone: 'warn' })
  assert.deepEqual(heatLabel(55), { label: 'HOT', tone: 'warn' })
  assert.deepEqual(heatLabel(90), { label: 'BURNING', tone: 'bad' })
})

test('token change is measured against recent history', () => {
  const state = createInitialState()
  const token = state.tokens[0]
  const change = tokenChange(token, 12)
  assert.ok(Number.isFinite(change))
  assert.equal(tokenChange({ ...token, history: [] }), 0)
})
