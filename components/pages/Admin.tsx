'use client'

import { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Banknote,
  Building2,
  Check,
  CircleDollarSign,
  Coins,
  Command,
  Crown,
  Database,
  Flame,
  Gauge,
  KeyRound,
  Landmark,
  Lock,
  Network,
  Power,
  Radio,
  RotateCcw,
  ShieldAlert,
  Skull,
  Sparkles,
  Terminal,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { useGame } from '../GameProvider'
import {
  Badge,
  KV,
  Panel,
  Progress,
  SectionHeading,
  Sparkline,
  StatCard,
} from '../ui'
import { classNames, money, num } from '@/lib/format'
import { engineStatusLabel, marketCap, netWorth } from '@/lib/economy'
import {
  godCrashMarket,
  godEvent,
  godMax,
  godPump,
  godReset,
  godSpawn,
  godWipe,
} from '@/lib/actions'
import type { GameState } from '@/lib/types'

type WipeKind = 'bank' | 'isp' | 'media' | 'corp'

function series(base: number, seed: number, amplitude = 8, points = 32): number[] {
  return Array.from({ length: points }, (_, index) => {
    const wave = Math.sin(index * 0.45 + seed) * amplitude + Math.sin(index * 0.18 + seed * 2) * amplitude * 0.55
    return Math.max(0.01, base + wave)
  })
}

function AccessDenied() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="panel w-full max-w-xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center border border-rose-400/30 bg-rose-400/5">
          <Lock size={26} className="text-rose-300" />
        </div>
        <div className="label mt-5 text-rose-300">ACCESS DENIED</div>
        <h1 className="mt-2 text-[24px] font-semibold tracking-tight text-fog-100">Root terminal locked</h1>
        <p className="mx-auto mt-2 max-w-md text-[11px] leading-relaxed text-fog-500">
          This console is reserved for the server owner profile. Authenticate by opening your operator profile and setting the email to the root identity.
        </p>
        <div className="mt-5 border border-ink-600/40 bg-ink-950/70 p-3 text-left font-mono text-[10px] text-fog-400">
          <div><span className="text-fog-600">$</span> omnilife auth --email <span className="text-mint-300">mirajx132@gmail.com</span></div>
          <div className="mt-1 text-fog-600"># expected: GOD MODE UNLOCKED</div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Badge tone="bad" pulse>LOCKED</Badge>
          <Badge tone="info">STANDARD PROFILE</Badge>
        </div>
      </div>
    </div>
  )
}

function RootConsole() {
  const { state, runAction } = useGame()
  const [amount, setAmount] = useState('10000000')
  const numeric = Math.max(0, Number(amount) || 0)

  return (
    <Panel eyebrow="ROOT · DIRECT STATE MUTATION" title="Root console" action={<Badge tone="bad" pulse>UNRESTRICTED</Badge>}>
      <div className="border border-ink-600/40 bg-ink-950/80 p-3 font-mono text-[9px] leading-relaxed">
        <div className="text-fog-600">OMNILIFE ROOT SHELL · SERVER 01 · SESSION {String(state.tick).padStart(5, '0')}</div>
        <div className="mt-2 text-mint-300">root@omnilife:~$ status --world</div>
        <div className="mt-1 text-fog-400">day={state.day} hour={state.hour} entities={state.tokens.length + state.banks.length + state.corporations.length + state.isps.length + state.media.length + state.syndicates.length}</div>
        <div className="text-fog-400">index={state.marketIndex.toFixed(2)} volatility={state.volatility.toFixed(0)} gas={state.gasPrice.toFixed(1)}</div>
        <div className="text-fog-400">player={state.player.handle} god={state.player.godMode ? 'true' : 'false'}</div>
        <div className="mt-2 text-mint-300">root@omnilife:~$ <span className="animate-blink">█</span></div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label className="block">
            <span className="label mb-1.5 block">Spawn liquid capital</span>
            <input className="input text-[12px]" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
          </label>
          <div className="mt-2 grid grid-cols-3 gap-1">
            {['1000000', '10000000', '100000000'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(value)}
                className="border border-ink-600/35 py-1 font-mono text-[8px] tracking-wider text-fog-500 hover:border-rose-400/40 hover:text-rose-300"
              >
                {Number(value) / 1_000_000}M
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end">
          <button type="button" className="btn btn-danger w-full py-2.5 text-[9px] sm:w-auto" onClick={() => runAction((current) => godSpawn(current, numeric))}>
            <Coins size={12} /> Spawn cash
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <button type="button" className="btn py-2 text-[9px]" onClick={() => runAction((current) => godMax(current))}>
          <Crown size={11} /> Total capture
        </button>
        <button type="button" className="btn py-2 text-[9px]" onClick={() => runAction((current) => godEvent(current))}>
          <Sparkles size={11} /> Inject event
        </button>
        <button type="button" className="btn btn-danger py-2 text-[9px]" onClick={() => runAction((current) => godCrashMarket(current))}>
          <TrendingDown size={11} /> Crash market
        </button>
      </div>

      <div className="mt-3 flex items-start gap-2 border border-rose-400/20 bg-rose-400/5 p-2.5">
        <ShieldAlert size={12} className="mt-0.5 shrink-0 text-rose-300" />
        <p className="text-[9px] leading-relaxed text-rose-200/70">Every command mutates live server state and is written to the audit log. There is no undo except a full reset.</p>
      </div>
    </Panel>
  )
}

function MarketOverrides() {
  const { state, runAction } = useGame()
  const [tokenId, setTokenId] = useState(state.tokens[0]?.id ?? '')
  const token = state.tokens.find((item) => item.id === tokenId) ?? state.tokens[0]

  return (
    <Panel eyebrow="PRICE · MOMENTUM · LIQUIDITY" title="Market overrides" action={<Badge tone="warn">{state.tokens.length} ASSETS</Badge>}>
      <div className="grid gap-3 sm:grid-cols-[1fr_190px]">
        <div>
          <label className="block">
            <span className="label mb-1.5 block">Target asset</span>
            <select className="input py-2 text-[10px]" value={token?.id ?? ''} onChange={(event) => setTokenId(event.target.value)}>
              {state.tokens.map((item) => (
                <option key={item.id} value={item.id}>${item.symbol} · {item.name} · ${item.price.toFixed(4)}</option>
              ))}
            </select>
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" className="btn py-2 text-[9px]" onClick={() => token && runAction((current) => godPump(current, token.id, 'pump'))}>
              <TrendingUp size={11} /> Pump +75%
            </button>
            <button type="button" className="btn btn-danger py-2 text-[9px]" onClick={() => token && runAction((current) => godPump(current, token.id, 'crash'))}>
              <TrendingDown size={11} /> Crash -68%
            </button>
          </div>
        </div>
        <div className="border border-ink-600/35 bg-ink-900/40 p-3">
          <div className="micro">Selected price</div>
          <div className="stat-value mt-1 text-[18px] font-semibold text-fog-100">${token?.price.toFixed(4) ?? '0.0000'}</div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Liquidity</span><span className="mono text-fog-300">{money(token?.liquidity ?? 0, true)}</span></div>
            <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Momentum</span><span className={classNames('mono', (token?.momentum ?? 0) >= 0 ? 'text-mint-300' : 'text-rose-300')}>{((token?.momentum ?? 0) * 100).toFixed(1)}%</span></div>
            <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Holders</span><span className="mono text-fog-300">{num(token?.holders ?? 0)}</span></div>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function entityList(state: GameState, kind: WipeKind): Array<{ id: string; label: string; sub: string }> {
  if (kind === 'bank') return state.banks.map((bank) => ({ id: bank.id, label: bank.name, sub: `${money(bank.reserves, true)} reserves · ${bank.status}` }))
  if (kind === 'isp') return state.isps.map((isp) => ({ id: isp.id, label: isp.name, sub: `${isp.capacity.toFixed(1)} Tbps · ${isp.uptime.toFixed(2)}% uptime` }))
  if (kind === 'media') return state.media.map((station) => ({ id: station.id, label: station.name, sub: `${station.reach.toFixed(2)}M reach · ${station.type}` }))
  return state.corporations.map((corp) => ({ id: corp.id, label: `${corp.ticker} · ${corp.name}`, sub: `$${corp.sharePrice.toFixed(2)} · ${money(corp.sharePrice * corp.sharesOutstanding, true)} cap` }))
}

function EntityWiper() {
  const { state, runAction } = useGame()
  const [kind, setKind] = useState<WipeKind>('bank')
  const entities = entityList(state, kind)
  const [selected, setSelected] = useState(entities[0]?.id ?? '')
  const current = entities.find((entity) => entity.id === selected) ?? entities[0]

  const switchKind = (next: WipeKind) => {
    setKind(next)
    setSelected(entityList(state, next)[0]?.id ?? '')
  }

  const kinds: Array<{ id: WipeKind; label: string; icon: typeof Landmark }> = [
    { id: 'bank', label: 'Banks', icon: Landmark },
    { id: 'isp', label: 'ISPs', icon: Network },
    { id: 'media', label: 'Media', icon: Radio },
    { id: 'corp', label: 'Equities', icon: Building2 },
  ]

  return (
    <Panel eyebrow="ENTITY DELETION · STATE PURGE" title="Wipe an entity" action={<Badge tone="bad">DESTRUCTIVE</Badge>}>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {kinds.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => switchKind(item.id)}
              className={classNames(
                'flex items-center justify-center gap-1.5 border py-2 font-mono text-[8px] uppercase tracking-wider transition-colors',
                kind === item.id ? 'border-rose-400/45 bg-rose-400/10 text-rose-200' : 'border-ink-600/35 text-fog-500 hover:text-fog-200',
              )}
            >
              <Icon size={10} /> {item.label}
            </button>
          )
        })}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <select className="input py-2 text-[10px]" value={current?.id ?? ''} onChange={(event) => setSelected(event.target.value)}>
          {entities.length === 0 && <option value="">No entities</option>}
          {entities.map((entity) => (
            <option key={entity.id} value={entity.id}>{entity.label} · {entity.sub}</option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-danger py-2 text-[9px]"
          disabled={!current}
          onClick={() => current && runAction((state) => godWipe(state, kind, current.id))}
        >
          <Trash2 size={11} /> Wipe {kind}
        </button>
      </div>

      {current && (
        <div className="mt-2 flex items-center justify-between border border-ink-600/30 bg-ink-900/35 p-2.5">
          <div><div className="text-[10px] text-fog-200">{current.label}</div><div className="micro mt-0.5">{current.sub}</div></div>
          <AlertTriangle size={13} className="text-amber-300" />
        </div>
      )}
      <p className="mt-2 text-[9px] leading-relaxed text-fog-500">Banks collapse, ISPs go dark, networks lose reach, equities are repriced to zero. Player positions are not compensated.</p>
    </Panel>
  )
}

function WorldOverview() {
  const { state } = useGame()
  const counts = [
    { label: 'Tokens', value: state.tokens.length, hue: 286, icon: CircleDollarSign },
    { label: 'Banks', value: state.banks.length, hue: 218, icon: Landmark },
    { label: 'Equities', value: state.corporations.length, hue: 42, icon: Building2 },
    { label: 'ISPs', value: state.isps.length, hue: 174, icon: Network },
    { label: 'Networks', value: state.media.length, hue: 302, icon: Radio },
    { label: 'Syndicates', value: state.syndicates.length, hue: 338, icon: Skull },
    { label: 'Districts', value: state.districts.length, hue: 142, icon: Database },
    { label: 'NPCs', value: state.npcs.length, hue: 196, icon: Users },
  ]

  return (
    <Panel eyebrow="SIMULATION TOPOLOGY" title="World state" action={<Badge tone="info">{state.events.length} EVENTS</Badge>}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {counts.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="border border-ink-600/30 bg-ink-900/35 p-2.5">
              <div className="flex items-center justify-between">
                <span className="micro">{item.label}</span>
                <Icon size={11} style={{ color: `hsl(${item.hue}, 78%, 68%)` }} />
              </div>
              <div className="stat-value mt-1 text-[16px] text-fog-100">{item.value}</div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="border border-ink-600/30 bg-ink-900/35 p-2.5"><div className="micro">Market cap</div><div className="mono mt-1 text-[11px] text-fog-200">{money(marketCap(state), true)}</div></div>
        <div className="border border-ink-600/30 bg-ink-900/35 p-2.5"><div className="micro">Volatility</div><div className="mono mt-1 text-[11px] text-amber-300">{state.volatility.toFixed(0)} / 100</div></div>
        <div className="border border-ink-600/30 bg-ink-900/35 p-2.5"><div className="micro">Your net worth</div><div className="mono mt-1 text-[11px] text-mint-300">{money(netWorth(state), true)}</div></div>
      </div>

      <div className="mt-3 space-y-2">
        {state.events.slice(0, 3).map((event) => (
          <div key={event.id} className="border-l-2 pl-2.5" style={{ borderColor: `hsl(${event.hue}, 80%, 60%)` }}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-fog-200">{event.title}</span>
              <Badge tone={event.severity === 'critical' ? 'bad' : event.severity === 'high' ? 'warn' : 'info'}>{event.severity.toUpperCase()}</Badge>
            </div>
            <div className="micro mt-0.5">{event.category} · day {event.startedDay} → {event.endsDay} · {event.source}</div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function RootStatus() {
  const { state } = useGame()
  return (
    <Panel eyebrow="OPERATOR · PRIVILEGED" title="Root status" action={<Badge tone="bad" pulse>GOD MODE</Badge>}>
      <div className="flex items-center gap-3 border border-rose-400/20 bg-rose-400/5 p-3">
        <div className="flex h-10 w-10 items-center justify-center border border-rose-400/30 bg-ink-950/50"><KeyRound size={17} className="text-rose-300" /></div>
        <div className="min-w-0">
          <div className="truncate text-[11px] font-medium text-fog-100">{state.player.name}</div>
          <div className="micro truncate">{state.player.email}</div>
        </div>
      </div>
      <div className="mt-3">
        <KV label="Liquid cash" value={money(state.player.cash, true)} />
        <KV label="Dirty cash" value={money(state.player.dirtyCash, true)} />
        <KV label="Influence" value={`${Math.round(state.player.influence)} / 100`} />
        <KV label="Reputation" value={`${Math.round(state.player.reputation)} / 100`} />
        <KV label="Heat" value={`${Math.round(state.player.heat)} / 100`} />
        <KV label="Level / XP" value={`${state.player.level} · ${num(state.player.xp)}`} />
        <KV label="Actions executed" value={num(state.player.actions)} />
        <KV label="Engine" value={engineStatusLabel(state)} />
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Heat</span><span className="mono text-fog-300">{Math.round(state.player.heat)}%</span></div>
        <Progress value={state.player.heat} hue={350} className="mt-1.5" height={4} glow={state.player.heat > 60} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="chip chip-rose"><Flame size={10} /> {state.government.warrants.filter((warrant) => warrant.status === 'active').length} WARRANTS</span>
        <span className="chip"><Gauge size={10} /> {state.government.officials.filter((official) => official.bribed).length} OWNED</span>
      </div>
    </Panel>
  )
}

function AuditTrail() {
  const { state } = useGame()
  const logs = state.log.slice(0, 14)
  return (
    <Panel eyebrow="IMMUTABLE · LOCAL" title="Audit trail" action={<Badge tone="info">TAIL -14</Badge>}>
      <div className="max-h-[340px] space-y-1.5 overflow-y-auto">
        {logs.length === 0 && <div className="text-[9px] text-fog-500">No commands recorded.</div>}
        {logs.map((line, index) => (
          <div key={index} className={classNames('border-l pl-2 font-mono text-[8px] leading-relaxed', line.includes('[GOD]') ? 'border-rose-400/50 text-rose-200/80' : 'border-ink-600/40 text-fog-500')}>
            {line}
          </div>
        ))}
      </div>
    </Panel>
  )
}

function DangerZone() {
  const { state, runAction } = useGame()
  const [armed, setArmed] = useState(false)
  return (
    <Panel eyebrow="IRREVERSIBLE" title="Danger zone" action={<Badge tone="bad" pulse>ROOT ONLY</Badge>}>
      <div className="space-y-2">
        <div className="flex items-start gap-2 border border-rose-400/20 bg-rose-400/5 p-2.5">
          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-rose-300" />
          <p className="text-[9px] leading-relaxed text-rose-200/70">Resetting restores the genesis seed. Every position, bank, token, network and relationship is destroyed. God mode remains active.</p>
        </div>
        <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">World age</span><span className="mono text-fog-300">DAY {state.day} · TICK {state.tick}</span></div>
        <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Saved locally</span><span className="mono text-fog-300">YES</span></div>
        {armed ? (
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" className="btn py-2 text-[9px]" onClick={() => setArmed(false)}>Cancel</button>
            <button type="button" className="btn btn-danger py-2 text-[9px]" onClick={() => { runAction((current) => godReset(current)); setArmed(false) }}>
              <RotateCcw size={11} /> Confirm reset
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-danger w-full py-2 text-[9px]" onClick={() => setArmed(true)}>
            <Power size={11} /> Arm world reset
          </button>
        )}
      </div>
    </Panel>
  )
}

export function AdminPage() {
  const { state } = useGame()
  if (!state.player.godMode) return <AccessDenied />

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="ROOT · SERVER 01 · UNRESTRICTED"
        title="God Mode"
        description="Direct access to the simulation kernel. Spawn capital, reprice markets, erase entities, inject world events, and rewrite the political order."
        action={<Badge tone="bad" pulse><Terminal size={10} /> ROOT ACCESS</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Liquid cash" value={money(state.player.cash, true)} sub="Unrestricted mint authority" icon={<Banknote size={15} />} hue={142} spark={series(60, 1, 10)} />
        <StatCard label="Influence" value={`${Math.round(state.player.influence)}`} sub="Political and social leverage" icon={<Users size={15} />} hue={286} spark={series(state.player.influence, 2, 8)} />
        <StatCard label="Heat" value={`${Math.round(state.player.heat)}`} sub="Exposure across every agency" icon={<Flame size={15} />} hue={350} spark={series(state.player.heat, 3, 9)} />
        <StatCard label="World tick" value={`${state.tick}`} sub={`Day ${state.day} · ${engineStatusLabel(state)}`} icon={<Activity size={15} />} hue={196} spark={series(50, 4, 7)} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-4 xl:col-span-8">
          <RootConsole />
          <MarketOverrides />
          <EntityWiper />
          <WorldOverview />
        </div>
        <div className="col-span-12 space-y-4 xl:col-span-4">
          <RootStatus />
          <AuditTrail />
          <DangerZone />
          <Panel eyebrow="ROOT PROTOCOL" title="Operator notice">
            <div className="space-y-2">
              <div className="flex items-start gap-2"><Check size={12} className="mt-0.5 shrink-0 text-mint-300" /><p className="text-[9px] leading-relaxed text-fog-500">All actions execute against the live local save. The AI director will react on the next tick.</p></div>
              <div className="flex items-start gap-2"><Zap size={12} className="mt-0.5 shrink-0 text-amber-300" /><p className="text-[9px] leading-relaxed text-fog-500">Market overrides also post to The Wire as engine-origin signals, so NPCs and media may amplify them.</p></div>
              <div className="flex items-start gap-2"><Command size={12} className="mt-0.5 shrink-0 text-violet-300" /><p className="text-[9px] leading-relaxed text-fog-500">God mode is bound to the root email. Change the profile email to revoke access immediately.</p></div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
