'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  Banknote,
  Building2,
  ChevronRight,
  CircleDollarSign,
  Cpu,
  Flame,
  Gauge,
  Landmark,
  Network,
  Radio,
  Shield,
  Skull,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { useGame } from '../GameProvider'
import { AreaChart, Avatar, Badge, Donut, Delta, Panel, Progress, SectionHeading, Sparkline, StatCard } from '../ui'
import { ago, classNames, money, num, pct, tokenPrice, trendOf } from '@/lib/format'
import {
  allocation,
  dailyIncome,
  districtValue,
  engineStatusLabel,
  heatLabel,
  marketCap,
  netWorth,
  tokenChange,
} from '@/lib/economy'
import { buyDistrict } from '@/lib/actions'
import type { District } from '@/lib/types'

function MarketOverview() {
  const { state } = useGame()
  const [range, setRange] = useState(72)
  const data = state.indexHistory.slice(-range)
  const change = trendOf(data, Math.min(data.length - 1, 24))
  const volume = state.tokens.reduce((sum, token) => sum + token.volume24h, 0)
  const markers = state.events.slice(0, 3).map((event, index) => ({
    index: Math.max(0, data.length - 5 - index * 11),
    label: event.title,
    hue: event.hue,
  }))

  return (
    <Panel
      className="col-span-12 xl:col-span-8"
      eyebrow="OMNI-COMPOSITE · LIVE TAPE"
      title="Global Market Index"
      action={
        <div className="flex items-center gap-1">
          {[24, 48, 72].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={classNames(
                'border px-2 py-1 font-mono text-[9px] tracking-wider transition-colors',
                range === value ? 'border-mint-400/45 bg-mint-400/8 text-mint-300' : 'border-ink-600/40 text-fog-500 hover:text-fog-200',
              )}
            >
              {value === 24 ? '1D' : value === 48 ? '2D' : '3D'}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="stat-value text-[34px] font-semibold leading-none text-fog-100">{state.marketIndex.toFixed(2)}</span>
            <Delta value={change} className="text-[13px]" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={change >= 0 ? 'good' : 'bad'}>{change >= 0 ? 'RISK-ON' : 'RISK-OFF'}</Badge>
            <span className="micro">VOL {state.volatility.toFixed(0)}</span>
            <span className="h-2.5 w-px bg-ink-600" />
            <span className="micro">GAS {state.gasPrice.toFixed(1)}</span>
            <span className="h-2.5 w-px bg-ink-600" />
            <span className="micro">CONG {state.congestion.toFixed(0)}%</span>
          </div>
        </div>
        <div className="text-right">
          <div className="micro">Market cap</div>
          <div className="stat-value mt-0.5 text-[15px] text-fog-200">{money(marketCap(state), true)}</div>
        </div>
      </div>

      <div className="mt-4">
        <AreaChart data={data} hue={174} height={236} markers={markers} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-600/30 pt-4 sm:grid-cols-4">
        <div>
          <div className="micro">24h volume</div>
          <div className="stat-value mt-1 text-[13px] text-fog-200">{money(volume, true)}</div>
        </div>
        <div>
          <div className="micro">Active events</div>
          <div className="stat-value mt-1 text-[13px] text-amber-300">{state.events.length}</div>
        </div>
        <div>
          <div className="micro">Tokens live</div>
          <div className="stat-value mt-1 text-[13px] text-fog-200">{state.tokens.filter((token) => !token.rugged).length}</div>
        </div>
        <div>
          <div className="micro">Equities</div>
          <div className="stat-value mt-1 text-[13px] text-fog-200">{state.corporations.length}</div>
        </div>
      </div>
    </Panel>
  )
}

function AllocationPanel() {
  const { state } = useGame()
  const segments = allocation(state)
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1
  return (
    <Panel className="col-span-12 xl:col-span-4" eyebrow="CAPITAL STACK" title="Portfolio allocation">
      <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col">
        <Donut segments={segments} size={168} thickness={15} centerLabel="TOTAL EXPOSURE" centerValue={money(total, true)} />
        <div className="w-full space-y-2.5">
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center gap-2.5">
              <span className="h-2 w-2 shrink-0" style={{ background: `hsl(${segment.hue}, 78%, 58%)` }} />
              <span className="flex-1 truncate text-[11px] text-fog-400">{segment.label}</span>
              <span className="mono text-[10px] text-fog-200">{money(segment.value, true)}</span>
              <span className="w-9 text-right font-mono text-[9px] text-fog-500">{((segment.value / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-ink-600/30 pt-3">
        <div>
          <div className="micro">Daily income</div>
          <div className="stat-value mt-1 text-[13px] text-mint-300">{money(dailyIncome(state), true)}</div>
        </div>
        <div className="text-right">
          <div className="micro">Deeds</div>
          <div className="stat-value mt-1 text-[13px] text-fog-200">{money(districtValue(state), true)}</div>
        </div>
      </div>
    </Panel>
  )
}

function DistrictMap() {
  const { state, runAction } = useGame()
  const [selectedId, setSelectedId] = useState('meridian')
  const selected = state.districts.find((district) => district.id === selectedId) ?? state.districts[0]
  const totalCrime = state.districts.reduce((sum, district) => sum + district.crime, 0) / state.districts.length
  const totalValue = state.districts.reduce((sum, district) => sum + district.value * (district.owned || 1), 0)

  return (
    <Panel
      className="col-span-12 xl:col-span-7"
      eyebrow="LIVING CITY · 10 DISTRICTS"
      title="District intelligence"
      action={<Badge tone="warn" pulse>CRIME {totalCrime.toFixed(0)}</Badge>}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_190px]">
        <div className="relative overflow-hidden border border-ink-600/35 bg-ink-950/70 p-2">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(63,227,192,0.06),transparent_65%)]" />
          <svg viewBox="0 0 640 360" className="relative z-10 h-auto w-full">
            <defs>
              <pattern id="city-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(74,103,128,0.12)" strokeWidth="0.6" />
              </pattern>
              <filter id="district-glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect x="0" y="0" width="640" height="360" fill="url(#city-grid)" />
            {[122, 246, 312].map((y) => (
              <line key={`h-${y}`} x1="10" x2="630" y1={y} y2={y} stroke="rgba(74,103,128,0.24)" strokeWidth="2" strokeDasharray="1 6" />
            ))}
            {[154, 328, 466].map((x) => (
              <line key={`v-${x}`} x1={x} x2={x} y1="10" y2="350" stroke="rgba(74,103,128,0.2)" strokeWidth="2" strokeDasharray="1 6" />
            ))}
            {state.districts.map((district) => {
              const active = district.id === selected?.id
              return (
                <g key={district.id} onClick={() => setSelectedId(district.id)} className="cursor-pointer" role="button" aria-label={district.name}>
                  <rect
                    x={district.x}
                    y={district.y}
                    width={district.w}
                    height={district.h}
                    rx="3"
                    fill={`hsla(${district.hue}, 62%, 24%, ${active ? 0.62 : 0.34})`}
                    stroke={active ? 'rgba(63,227,192,0.9)' : `hsla(${district.hue}, 68%, 62%, 0.38)`}
                    strokeWidth={active ? 1.6 : 0.8}
                    filter={active ? 'url(#district-glow)' : undefined}
                    style={{ transition: 'fill 200ms ease, stroke 200ms ease' }}
                  />
                  <rect x={district.x + 6} y={district.y + 6} width={Math.max(8, (district.w - 12) * (1 - district.crime / 130))} height="2" fill={`hsla(${district.hue}, 70%, 65%, 0.7)`} />
                  <text x={district.x + 8} y={district.y + 23} fill="#d2e0ec" fontSize="9" fontFamily="monospace" letterSpacing="0.04em">
                    {district.name.toUpperCase()}
                  </text>
                  <text x={district.x + 8} y={district.y + 36} fill="#7f95aa" fontSize="7.5" fontFamily="monospace">
                    {money(district.value, true)} · CRIME {Math.round(district.crime)}
                  </text>
                  <circle cx={district.x + district.w - 12} cy={district.y + 12} r={active ? 3.4 : 2.4} fill={`hsl(${district.hue}, 82%, 64%)`} className={active ? 'animate-pulse-soft' : undefined} />
                </g>
              )
            })}
          </svg>
          <div className="relative z-10 mt-1 flex items-center justify-between px-1 text-[9px] text-fog-600">
            <span className="mono tracking-wider">LIVE PROPERTY & CRIME LAYER</span>
            <span className="mono">{money(totalValue, true)} TOTAL</span>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="border border-ink-600/35 bg-ink-900/55 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="micro">{selected.archetype}</div>
                <div className="mt-0.5 text-[14px] font-semibold text-fog-100">{selected.name}</div>
              </div>
              <span className="h-2 w-2 rounded-full" style={{ background: `hsl(${selected.hue}, 82%, 62%)`, boxShadow: `0 0 10px hsla(${selected.hue}, 82%, 62%, 0.8)` }} />
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-fog-500">{selected.description}</p>
            <div className="mt-3 space-y-2">
              <div>
                <div className="flex justify-between text-[9px] text-fog-500"><span>Property value</span><span className="mono text-fog-200">{money(selected.value, true)}</span></div>
                <Progress value={(selected.value / 4_000_000) * 100} hue={selected.hue} className="mt-1" height={4} />
              </div>
              <div>
                <div className="flex justify-between text-[9px] text-fog-500"><span>Crime rate</span><span className="mono text-rose-300">{Math.round(selected.crime)}</span></div>
                <Progress value={selected.crime} hue={350} className="mt-1" height={4} />
              </div>
              <div>
                <div className="flex justify-between text-[9px] text-fog-500"><span>Police presence</span><span className="mono text-azure-300">{Math.round(selected.police)}</span></div>
                <Progress value={selected.police} hue={200} className="mt-1" height={4} />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-ink-600/30 pt-2">
              <span className="micro">Owned {selected.owned} · Yield {selected.yield.toFixed(1)}%</span>
              <button
                type="button"
                className="btn px-2 py-1 text-[9px]"
                onClick={() => runAction((current) => buyDistrict(current, selected.id))}
              >
                Buy deed
              </button>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="border border-ink-600/30 bg-ink-900/40 p-2">
              <div className="micro">Avg crime</div>
              <div className="stat-value mt-0.5 text-[13px] text-rose-300">{totalCrime.toFixed(0)}</div>
            </div>
            <div className="border border-ink-600/30 bg-ink-900/40 p-2">
              <div className="micro">Demand</div>
              <div className="stat-value mt-0.5 text-[13px] text-mint-300">{(state.districts.reduce((sum, district) => sum + district.demand, 0) / state.districts.length).toFixed(0)}</div>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function WorldEnginePanel() {
  const { state } = useGame()
  const status = engineStatusLabel(state)
  return (
    <Panel
      className="col-span-12 xl:col-span-5"
      eyebrow="AUTONOMOUS DIRECTOR"
      title="AI World Engine"
      action={<Badge tone={state.engineStatus === 'grok' ? 'violet' : 'info'} pulse>{status}</Badge>}
    >
      <div className="border border-ink-600/35 bg-ink-900/45 p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center border border-violet-400/30 bg-violet-400/8">
            <Sparkles size={15} className="text-violet-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium text-fog-200">Director is scanning the mesh</div>
            <div className="micro mt-0.5">Macro · Crime · Media · Infrastructure</div>
          </div>
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-violet-400" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div><div className="micro">Sync</div><div className="mono mt-0.5 text-[10px] text-fog-200">T+{Math.max(0, state.tick - state.lastEngineSync)}</div></div>
          <div><div className="micro">Events</div><div className="mono mt-0.5 text-[10px] text-fog-200">{state.events.length} active</div></div>
          <div><div className="micro">Source</div><div className="mono mt-0.5 text-[10px] text-fog-200">{state.engineStatus === 'grok' ? 'GROK' : 'LOCAL'}</div></div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {state.events.slice(0, 3).map((event) => (
          <div key={event.id} className="border border-ink-600/35 bg-ink-950/45 p-3 transition-colors hover:border-ink-500/50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: `hsl(${event.hue}, 82%, 62%)`, boxShadow: `0 0 8px hsla(${event.hue}, 82%, 62%, 0.8)` }} />
                <span className="font-mono text-[10px] font-semibold tracking-wider text-fog-100">{event.title}</span>
              </div>
              <span className="micro shrink-0" style={{ color: `hsl(${event.hue}, 70%, 70%)` }}>{event.severity.toUpperCase()}</span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-fog-500">{event.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {event.effects.slice(0, 3).map((effect, index) => (
                <span key={index} className="border border-ink-600/35 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-fog-500">
                  {effect.kind} {effect.targetId ?? 'market'} {effect.delta >= 0 ? '+' : ''}{(effect.delta * 100).toFixed(1)}%
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Link href="/markets" className="mt-3 flex items-center justify-between border-t border-ink-600/30 pt-3 text-[10px] text-fog-500 transition-colors hover:text-mint-300">
        <span className="font-mono uppercase tracking-wider">Trace event impact in markets</span>
        <ArrowUpRight size={12} />
      </Link>
    </Panel>
  )
}

function EmpireAssets() {
  const { state } = useGame()
  const isp = state.isps.find((item) => item.playerOwned)
  const media = state.media.find((item) => item.playerOwned)
  const bank = state.banks.find((item) => item.playerOwned)
  const syndicate = state.syndicates.find((item) => item.playerOwned)
  const heat = heatLabel(state.player.heat)

  const cards = [
    {
      title: isp?.name ?? 'No ISP',
      subtitle: 'FIBER BACKBONE',
      hue: 174,
      icon: Network,
      href: '/infrastructure',
      metrics: isp
        ? [
            ['Capacity', `${isp.capacity.toFixed(1)} Tbps`],
            ['Load', `${(isp.load * 100).toFixed(0)}%`],
            ['Uptime', `${isp.uptime.toFixed(2)}%`],
            ['Daily', money(isp.revenue, true)],
          ]
        : [],
      progress: isp ? isp.load * 100 : 0,
      note: isp ? `${isp.nodes} nodes · ${isp.dataCenters} data centers` : 'Build your first backbone',
    },
    {
      title: media?.name ?? 'No network',
      subtitle: 'MEDIA REACH',
      hue: 302,
      icon: Radio,
      href: '/media',
      metrics: media
        ? [
            ['Reach', `${media.reach.toFixed(1)}M`],
            ['Credibility', `${media.credibility.toFixed(0)}`],
            ['Sentiment', `${media.sentiment.toFixed(0)}`],
            ['Daily', money(media.revenue, true)],
          ]
        : [],
      progress: media?.credibility ?? 0,
      note: media ? `${media.shows} shows · ${media.type}` : 'Launch a network',
    },
    {
      title: bank?.name ?? 'No bank license',
      subtitle: 'DEPOSITORY',
      hue: 218,
      icon: Landmark,
      href: '/banking',
      metrics: bank
        ? [
            ['Reserves', money(bank.reserves, true)],
            ['Deposits', money(bank.deposits, true)],
            ['Loans', money(bank.loans, true)],
            ['Rate', `${bank.rate.toFixed(1)}%`],
          ]
        : [
            ['Charter', '$1.5M'],
            ['Status', 'Unlicensed'],
            ['Deposits', '—'],
            ['Rate', '—'],
          ],
      progress: bank ? Math.min(100, (bank.reserves / Math.max(1, bank.deposits)) * 100) : 0,
      note: bank ? `Leverage ${(bank.loans / Math.max(1, bank.reserves)).toFixed(1)}x` : 'Found your own bank',
    },
    {
      title: syndicate?.name ?? 'The Syndicate',
      subtitle: 'UNDERWORLD',
      hue: 338,
      icon: Skull,
      href: '/underworld',
      metrics: [
        ['Heat', `${Math.round(state.player.heat)}`],
        ['Influence', `${Math.round(state.player.influence)}`],
        ['Dirty cash', money(state.player.dirtyCash, true)],
        ['Ops', `${syndicate?.operations ?? 0}`],
      ],
      progress: state.player.heat,
      note: `${heat.label} · ${state.player.reputation.toFixed(0)} reputation`,
    },
  ]

  return (
    <Panel className="col-span-12 xl:col-span-7" eyebrow="NIHANN HOLDINGS" title="Asset empire">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.subtitle} href={card.href} className="group border border-ink-600/35 bg-ink-900/35 p-3 transition-all hover:border-mint-400/30 hover:bg-ink-800/50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center border" style={{ borderColor: `hsla(${card.hue}, 70%, 60%, 0.3)`, background: `hsla(${card.hue}, 70%, 50%, 0.08)` }}>
                    <Icon size={13} style={{ color: `hsl(${card.hue}, 78%, 68%)` }} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-medium text-fog-100">{card.title}</div>
                    <div className="micro mt-0.5">{card.subtitle}</div>
                  </div>
                </div>
                <ChevronRight size={12} className="mt-1 text-fog-600 transition-transform group-hover:translate-x-0.5 group-hover:text-mint-300" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {card.metrics.map(([label, value]) => (
                  <div key={label}>
                    <div className="micro">{label}</div>
                    <div className="mono mt-0.5 text-[10px] text-fog-200">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2.5">
                <Progress value={card.progress} hue={card.hue} height={3} />
                <div className="mt-1.5 text-[9px] text-fog-500">{card.note}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </Panel>
  )
}

function WirePanel() {
  const { state } = useGame()
  return (
    <Panel
      className="col-span-12 xl:col-span-5"
      eyebrow="SERVER-WIDE SIGNAL"
      title="The Wire"
      action={<Link href="/wire" className="btn btn-ghost px-2 py-1 text-[9px]">Open feed <ChevronRight size={11} /></Link>}
    >
      <div className="space-y-3">
        {state.feed.slice(0, 4).map((post) => (
          <div key={post.id} className="flex gap-2.5 border-b border-ink-600/25 pb-3 last:border-0 last:pb-0">
            <Avatar name={post.author} hue={post.avatarHue} size={30} verified={post.verified} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="truncate text-[11px] font-medium text-fog-200">{post.author}</span>
                <span className="truncate font-mono text-[9px] text-fog-600">{post.handle}</span>
                <span className="ml-auto shrink-0 text-[9px] text-fog-600">{ago(post.day, post.hour, state.day, state.hour)}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-fog-400">{post.content}</p>
              <div className="mt-1.5 flex items-center gap-3 text-[9px] text-fog-600">
                <span>♥ {num(post.likes)}</span>
                <span>↳ {num(post.replies)}</span>
                {post.tags.slice(0, 2).map((tag) => <span key={tag} className="text-mint-400/60">#{tag}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function RivalsPanel() {
  const { state } = useGame()
  const rivals = [...state.npcs].sort((a, b) => b.wealth - a.wealth).slice(0, 5)
  return (
    <Panel className="col-span-12 xl:col-span-5" eyebrow="AUTONOMOUS TYCOONS" title="Rival intelligence">
      <div className="space-y-2">
        {rivals.map((npc, index) => (
          <div key={npc.id} className="flex items-center gap-2.5 border border-ink-600/30 bg-ink-900/35 p-2.5">
            <span className="w-4 shrink-0 font-mono text-[9px] text-fog-600">{String(index + 1).padStart(2, '0')}</span>
            <Avatar name={npc.name} hue={npc.avatarHue} size={30} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-medium text-fog-200">{npc.name}</span>
                <span className="shrink-0 font-mono text-[10px] text-fog-300">{money(npc.wealth, true)}</span>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="micro truncate">{npc.archetype}</span>
                <span className={classNames('font-mono text-[8px]', npc.aggression > 0.75 ? 'text-rose-300' : npc.aggression > 0.55 ? 'text-amber-300' : 'text-mint-300')}>
                  AGG {Math.round(npc.aggression * 100)}
                </span>
              </div>
              <div className="mt-1 h-0.5 w-full bg-ink-800">
                <div className={classNames('h-full', npc.aggression > 0.75 ? 'bg-rose-400' : npc.aggression > 0.55 ? 'bg-amber-400' : 'bg-mint-400')} style={{ width: `${npc.aggression * 100}%` }} />
              </div>
              <div className="mt-1 truncate text-[9px] text-fog-500">{npc.lastAction}</div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function MoversPanel() {
  const { state } = useGame()
  const tokens = [...state.tokens].sort((a, b) => tokenChange(b) - tokenChange(a)).slice(0, 6)
  return (
    <Panel
      className="col-span-12 xl:col-span-7"
      eyebrow="RISK ASSETS"
      title="Market movers"
      action={<Link href="/markets" className="btn btn-ghost px-2 py-1 text-[9px]">Full market <ChevronRight size={11} /></Link>}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse">
          <thead>
            <tr className="border-b border-ink-600/35 text-left">
              <th className="label py-2 font-normal">Asset</th>
              <th className="label py-2 text-right font-normal">Price</th>
              <th className="label py-2 text-right font-normal">24h</th>
              <th className="label py-2 text-right font-normal">Volume</th>
              <th className="label py-2 text-right font-normal">Trend</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => {
              const change = tokenChange(token)
              return (
                <tr key={token.id} className="border-b border-ink-600/20 last:border-0 hover:bg-ink-800/30">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center border font-mono text-[8px] font-bold" style={{ borderColor: `hsla(${token.hue}, 70%, 60%, 0.3)`, color: `hsl(${token.hue}, 78%, 70%)`, background: `hsla(${token.hue}, 70%, 50%, 0.06)` }}>
                        {token.symbol.slice(0, 2)}
                      </span>
                      <div>
                        <div className="font-mono text-[10px] font-semibold text-fog-200">${token.symbol}</div>
                        <div className="micro">{token.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-fog-200">{tokenPrice(token.price)}</td>
                  <td className={classNames('py-2.5 text-right font-mono text-[10px]', change >= 0 ? 'text-mint-300' : 'text-rose-300')}>{pct(change)}</td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-fog-400">{money(token.volume24h, true)}</td>
                  <td className="w-20 py-2.5 pl-3">
                    <div className="h-5">
                      <Sparkline data={token.history.slice(-20)} hue={token.hue} height={20} fill={false} strokeWidth={1.2} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function QuickActions() {
  const { state } = useGame()
  const actions = [
    { href: '/markets', label: 'Mint token', icon: CircleDollarSign, hue: 286 },
    { href: '/banking', label: 'Found bank', icon: Landmark, hue: 218 },
    { href: '/infrastructure', label: 'Build node', icon: Network, hue: 174 },
    { href: '/media', label: 'Launch show', icon: Radio, hue: 302 },
    { href: '/underworld', label: 'Launder cash', icon: Skull, hue: 338 },
    { href: '/government', label: 'Lobby council', icon: Landmark, hue: 42 },
  ]
  return (
    <Panel className="col-span-12" eyebrow="FAST EXECUTION" title="Quick actions">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.label} href={action.href} className="group flex items-center gap-2 border border-ink-600/35 bg-ink-900/35 p-2.5 transition-colors hover:border-mint-400/30 hover:bg-ink-800/45">
              <div className="flex h-7 w-7 items-center justify-center border" style={{ borderColor: `hsla(${action.hue}, 70%, 60%, 0.28)`, background: `hsla(${action.hue}, 70%, 50%, 0.07)` }}>
                <Icon size={13} style={{ color: `hsl(${action.hue}, 78%, 68%)` }} />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[10px] font-medium text-fog-200">{action.label}</div>
                <div className="micro mt-0.5">Execute</div>
              </div>
            </Link>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink-600/30 pt-3">
        <span className="text-[10px] text-fog-500">World time advances every 3 seconds. {state.player.actions} actions executed this cycle.</span>
        <Link href="/wire" className="btn btn-primary px-3 py-1.5 text-[9px]">
          <Activity size={11} /> Transmit to The Wire
        </Link>
      </div>
    </Panel>
  )
}

export function Dashboard() {
  const { state } = useGame()
  const worth = netWorth(state)
  const worthChange = trendOf(state.player.netWorthHistory, 12)
  const income = dailyIncome(state)
  const heat = heatLabel(state.player.heat)

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow={`SERVER 01 · DAY ${state.day} · REAL-TIME ECONOMY`}
        title="Command Center"
        description="Every district, token, bank, network and syndicate on this server is live. The AI director is already moving against you."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="good" pulse>WORLD LIVE</Badge>
            <Link href="/markets" className="btn btn-primary px-3 py-2 text-[9px]">
              <TrendingUp size={12} /> Trade the tape
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Net worth" value={money(worth, true)} sub="All assets · all liabilities" change={worthChange} icon={<CircleDollarSign size={15} />} hue={174} spark={state.player.netWorthHistory.slice(-40)} />
        <StatCard label="Liquid cash" value={money(state.player.cash, true)} sub={`${money(state.player.dirtyCash, true)} dirty off-book`} icon={<Banknote size={15} />} hue={142} spark={state.player.netWorthHistory.slice(-40).map((value) => value * 0.12)} />
        <StatCard label="Daily income" value={money(income, true)} sub={`${state.isps.filter((item) => item.playerOwned).length + state.media.filter((item) => item.playerOwned).length} operating assets`} icon={<Zap size={15} />} hue={42} spark={state.indexHistory.slice(-40).map((value) => value * 0.02)} />
        <StatCard label="Influence" value={Math.round(state.player.influence)} sub={`${heat.label} heat · ${Math.round(state.player.reputation)} reputation`} icon={<Users size={15} />} hue={286} spark={state.player.netWorthHistory.slice(-40).map((value, index) => value * 0.001 + index)} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <MarketOverview />
        <AllocationPanel />
        <DistrictMap />
        <WorldEnginePanel />
        <EmpireAssets />
        <WirePanel />
        <MoversPanel />
        <RivalsPanel />
        <QuickActions />
      </div>
    </div>
  )
}
