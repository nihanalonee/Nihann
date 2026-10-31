import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createInitialState } from '../lib/seed'
import {
  buildNode,
  buyToken,
  deposit,
  godSpawn,
  postToWire,
  sellToken,
  setProfile,
  withdraw,
} from '../lib/actions'

test('buyToken debits cash and credits a holding', () => {
  const state = createInitialState()
  const startingCash = state.player.cash
  const before = state.player.holdings.find((holding) => holding.tokenId === 'neon')
  const result = buyToken(state, 'neon', 10_000)

  assert.ok(result.state.player.cash < startingCash)
  const after = result.state.player.holdings.find((holding) => holding.tokenId === 'neon')
  assert.ok(after)
  assert.ok(after!.units > (before?.units ?? 0))
  assert.equal(result.toast?.title, 'ORDER FILLED')
})

test('buyToken rejects oversized and non-positive orders', () => {
  const state = createInitialState()
  assert.equal(buyToken(state, 'neon', state.player.cash + 1).state, state)
  assert.equal(buyToken(state, 'neon', 0).state, state)
})

test('sellToken cannot exceed the liquid position', () => {
  const state = createInitialState()
  const holding = state.player.holdings.find((item) => item.tokenId === 'neon')
  assert.ok(holding)
  const result = sellToken(state, 'neon', holding!.units / 2)
  assert.ok(result.state.player.cash > state.player.cash)
  assert.equal(sellToken(state, 'neon', holding!.units + 1).state, state)
})

test('deposit and withdraw move value through a bank', () => {
  const state = createInitialState()
  const deposited = deposit(state, 'meridian', 100_000)
  assert.equal(deposited.state.player.deposits.meridian, 100_000)
  assert.equal(deposited.state.player.cash, state.player.cash - 100_000)

  const withdrawn = withdraw(deposited.state, 'meridian', 40_000)
  assert.equal(withdrawn.state.player.deposits.meridian, 60_000)
  assert.equal(withdrawn.state.player.cash, state.player.cash - 60_000)
})

test('postToWire publishes locally and grows the feed', () => {
  const state = createInitialState()
  const result = postToWire(state, 'The mesh remembers every ledger.')
  assert.equal(result.state.feed.length, state.feed.length + 1)
  assert.equal(result.state.feed[0].content, 'The mesh remembers every ledger.')
  assert.equal(result.state.feed[0].source, 'player')
  assert.equal(result.toast?.title, 'TRANSMISSION SENT')
})

test('god actions are gated by profile email', () => {
  const locked = createInitialState()
  locked.player.godMode = false
  assert.equal(godSpawn(locked, 1_000_000).state, locked)

  const unlocked = createInitialState()
  const result = godSpawn(unlocked, 1_000_000)
  assert.equal(result.state.player.cash, unlocked.player.cash + 1_000_000)
  assert.equal(result.toast?.title, 'LIQUIDITY SPAWNED')
})

test('setProfile grants and revokes god mode from the admin email', () => {
  const state = createInitialState()
  const revoked = setProfile(state, 'Miraj', 'operator@example.com')
  assert.equal(revoked.state.player.godMode, false)

  const restored = setProfile(revoked.state, 'Miraj', 'mirajx132@gmail.com')
  assert.equal(restored.state.player.godMode, true)
  assert.equal(restored.toast?.title, 'GOD MODE UNLOCKED')
})

test('buildNode expands the player ISP and charges cash', () => {
  const state = createInitialState()
  const before = state.isps.find((isp) => isp.playerOwned)
  assert.ok(before)
  const result = buildNode(state)
  const after = result.state.isps.find((isp) => isp.playerOwned)
  assert.equal(after!.nodes, before!.nodes + 1)
  assert.ok(after!.capacity > before!.capacity)
  assert.equal(result.state.player.cash, state.player.cash - 180_000)
})
