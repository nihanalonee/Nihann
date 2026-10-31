import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createInitialState } from '../lib/seed'
import { advance, applyWorldEvent, forceBankRun, summarizeState } from '../lib/simulation'
import type { WorldEvent } from '../lib/types'

test('advance is immutable and moves the clock one tick', () => {
  const before = createInitialState()
  const snapshot = JSON.stringify(before)
  const after = advance(before)

  assert.equal(JSON.stringify(before), snapshot, 'advance must not mutate its input')
  assert.equal(after.tick, before.tick + 1)
  assert.equal(after.hour, before.hour + 1)
  assert.notEqual(after, before)
  assert.ok(after.player.netWorthHistory.length >= before.player.netWorthHistory.length)
})

test('advance rolls the day over after hour 23', () => {
  const state = createInitialState()
  state.hour = 23
  const next = advance(state)
  assert.equal(next.day, state.day + 1)
  assert.equal(next.hour, 0)
})

test('forceBankRun collapses a bank and writes a Wire post', () => {
  const state = createInitialState()
  const bank = state.banks.find((item) => item.id === 'blackvault')
  assert.ok(bank)
  const next = forceBankRun(state, 'blackvault')
  const collapsed = next.banks.find((item) => item.id === 'blackvault')
  assert.equal(collapsed?.status, 'collapsed')
  assert.ok(collapsed!.reserves < bank!.reserves)
  assert.ok(next.feed[0].content.includes('Black Vault'))
  assert.ok(next.events[0].title.includes('Black Vault'))
})

test('applyWorldEvent registers an event, feed post and notification', () => {
  const state = createInitialState()
  const incoming: Omit<WorldEvent, 'id' | 'startedDay' | 'endsDay'> = {
    title: 'Test Shock',
    description: 'A test shock ripples through the mesh.',
    category: 'finance',
    severity: 'high',
    effects: [{ kind: 'market', delta: -0.01 }],
    source: 'grok',
    hue: 42,
    headline: 'TEST SHOCK: markets reprice',
  }
  const next = applyWorldEvent(state, incoming)
  assert.equal(next.events[0].title, 'Test Shock')
  assert.equal(next.events[0].source, 'grok')
  assert.equal(next.engineStatus, 'grok')
  assert.equal(next.feed[0].source, 'grok')
  assert.equal(next.notifications[0].title, 'TEST SHOCK')
})

test('summarizeState returns an engine-safe snapshot', () => {
  const summary = summarizeState(createInitialState())
  assert.equal(summary.day, 42)
  assert.ok(summary.tokens.length > 0)
  assert.ok(summary.banks.length > 0)
  assert.ok(summary.isps.length > 0)
  assert.equal(summary.playerSyndicate, 'Nihann Syndicate')
  assert.equal(JSON.stringify(summary).includes('undefined'), false)
})
