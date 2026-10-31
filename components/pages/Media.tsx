'use client'

import { useState } from 'react'
import {
  ArrowUpRight,
  Eye,
  Flame,
  Image as ImageIcon,
  Megaphone,
  Newspaper,
  Play,
  Plus,
  Radio,
  RadioTower,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Tv,
  Users,
} from 'lucide-react'
import { useGame } from '../GameProvider'
import { AreaChart, Avatar, Badge, Gauge, Panel, Progress, SectionHeading, Sparkline, StatCard, Tabs } from '../ui'
import { classNames, money, num, pct } from '@/lib/format'
import { tokenChange } from '@/lib/economy'
import { createNetwork, launchShow, runExpose, runFakeNews, runPropaganda } from '@/lib/actions'
import type { MediaStation } from '@/lib/types'

const imagery: Record<string, string> = {
  signal9: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=70',
  vox: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=70',
  ledger: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=70',
  neonpulse: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=900&q=70',
  blacklight: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=70',
}

function series(base: number, seed: number, amplitude = 0.08, points = 36): number[] {
  return Array.from({ length: points }, (_, index) => {
    const wave = Math.sin(index * 0.5 + seed) * amplitude + Math.sin(index * 0.19 + seed * 2) * amplitude * 0.55
    return Math.max(0.01, base + wave)
  })
}

function NetworkTable({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const { state } = useGame()
  return (
    <Panel className="overflow-hidden" eyebrow="AUDIENCE & CREDIBILITY" title="Media landscape" dense>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr className="border-b border-ink-600/35 text-left">
              <th className="label py-2 font-normal">Network</th>
              <th className="label py-2 text-right font-normal">Reach</th>
              <th className="label py-2 text-right font-normal">Credibility</th>
              <th className="label py-2 text-right font-normal">Sentiment</th>
              <th className="label py-2 text-right font-normal">Shows</th>
              <th className="label py-2 text-right font-normal">Revenue</th>
              <th className="label py-2 pl-3 text-right font-normal">Trend</th>
            </tr>
          </thead>
          <tbody>
            {state.media.map((station) => {
              const active = station.id === selectedId
              return (
                <tr key={station.id} onClick={() => onSelect(station.id)} className={classNames('cursor-pointer border-b border-ink-600/20 last:border-0', active ? 'bg-mint-400/6' : 'hover:bg-ink-800/30')}>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center border" style={{ borderColor: `hsla(${station.hue}, 70%, 60%, 0.3)`, background: `hsla(${station.hue}, 70%, 50%, 0.07)` }}>
                        <Tv size={13} style={{ color: `hsl(${station.hue}, 78%, 68%)` }} />
                      </span>
                      <div><div className="text-[10px] font-medium text-fog-200">{station.name}{station.playerOwned && <span className="ml-1 text-[8px] text-mint-400">YOURS</span>}</div><div className="micro">{station.ownerName} · {station.type}</div></div>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-fog-300">{station.reach.toFixed(2)}M</td>
                  <td className={classNames('py-2.5 text-right font-mono text-[10px]', station.credibility > 70 ? 'text-mint-300' : station.credibility > 40 ? 'text-amber-300' : 'text-rose-300')}>{station.credibility.toFixed(0)}</td>
                  <td className={classNames('py-2.5 text-right font-mono text-[10px]', station.sentiment > 55 ? 'text-mint-300' : station.sentiment > 35 ? 'text-amber-300' : 'text-rose-300')}>{station.sentiment.toFixed(0)}</td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-fog-400">{station.shows}</td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-fog-400">{money(station.revenue, true)}</td>
                  <td className="w-20 py-2.5 pl-3"><div className="h-5"><Sparkline data={series(station.reach, station.credibility, 0.05)} hue={station.hue} height={20} fill={false} strokeWidth={1.2} /></div></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function StationDetail({ station }: { station: MediaStation }) {
  const { state, runAction } = useGame()
  const [exposeTarget, setExposeTarget] = useState(state.corporations[0]?.id ?? '')
  const [propagandaToken, setPropagandaToken] = useState(state.tokens[0]?.id ?? '')
  const avgSentiment = state.feed.reduce((sum, post) => sum + post.sentiment, 0) / Math.max(1, state.feed.length)

  return (
    <Panel
      eyebrow={`${station.type.toUpperCase()} · ${station.ownerName.toUpperCase()}`}
      title={station.name}
      action={<Badge tone={station.playerOwned ? 'good' : 'info'}>{station.playerOwned ? 'CONTROLLED' : 'RIVAL'}</Badge>}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_190px]">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="micro">Monthly reach</div>
              <div className="stat-value mt-0.5 text-[28px] font-semibold text-fog-100">{station.reach.toFixed(2)}M</div>
            </div>
            <div className="flex items-center gap-4">
              <div><div className="micro">Credibility</div><div className="stat-value mt-0.5 text-[13px] text-fog-200">{station.credibility.toFixed(0)}</div></div>
              <div><div className="micro">Sentiment</div><div className="stat-value mt-0.5 text-[13px] text-fog-200">{station.sentiment.toFixed(0)}</div></div>
            </div>
          </div>
          <div className="mt-3 h-[150px]"><AreaChart data={series(station.reach, station.credibility, 0.08)} hue={station.hue} height={150} showAxis={false} valueFormatter={(value) => `${value.toFixed(2)}M`} /></div>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-ink-600/30 pt-3 sm:grid-cols-4">
            <div><div className="micro">Revenue / day</div><div className="mono mt-0.5 text-[10px] text-fog-200">{money(station.revenue, true)}</div></div>
            <div><div className="micro">Shows</div><div className="mono mt-0.5 text-[10px] text-fog-200">{station.shows}</div></div>
            <div><div className="micro">Audience sentiment</div><div className={classNames('mono mt-0.5 text-[10px]', avgSentiment >= 0 ? 'text-mint-300' : 'text-rose-300')}>{avgSentiment.toFixed(0)}</div></div>
            <div><div className="micro">Share of voice</div><div className="mono mt-0.5 text-[10px] text-fog-200">{((station.reach / Math.max(1, state.media.reduce((sum, item) => sum + item.reach, 0))) * 100).toFixed(1)}%</div></div>
          </div>
          <div className="mt-3 space-y-2">
            {station.headlines.map((headline, index) => (
              <div key={index} className="flex items-start gap-2 border-l border-ink-600/50 pl-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full" style={{ background: `hsl(${station.hue}, 80%, 60%)` }} />
                <span className="text-[10px] leading-relaxed text-fog-400">{headline}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="border border-ink-600/35 bg-ink-900/40 p-2.5">
            <Gauge value={station.credibility} label="Credibility" hue={station.credibility > 60 ? 174 : 42} size={112} />
          </div>
          <div className="border border-ink-600/35 bg-ink-900/40 p-2.5">
            <Gauge value={station.sentiment} label="Sentiment" hue={station.sentiment > 55 ? 174 : 350} size={112} />
          </div>
        </div>
      </div>

      {station.playerOwned ? (
        <div className="mt-4 border-t border-ink-600/30 pt-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" className="btn py-2 text-[9px]" onClick={() => runAction((current) => launchShow(current))}><Play size={11} /> Launch new show · $60K</button>
            <button type="button" className="btn py-2 text-[9px]" onClick={() => runAction((current) => runFakeNews(current))}><ShieldAlert size={11} /> Plant fake story · $40K dirty</button>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="border border-ink-600/30 bg-ink-900/40 p-2.5">
              <div className="label mb-1.5">Propaganda target</div>
              <select className="input py-1.5 text-[10px]" value={propagandaToken} onChange={(event) => setPropagandaToken(event.target.value)}>
                {state.tokens.filter((token) => !token.rugged).map((token) => <option key={token.id} value={token.id}>${token.symbol} · {token.name}</option>)}
              </select>
              <button type="button" className="btn btn-primary mt-2 w-full py-1.5 text-[9px]" onClick={() => runAction((current) => runPropaganda(current, propagandaToken))}><Megaphone size={11} /> Run campaign · $120K</button>
            </div>
            <div className="border border-ink-600/30 bg-ink-900/40 p-2.5">
              <div className="label mb-1.5">Exposé target</div>
              <select className="input py-1.5 text-[10px]" value={exposeTarget} onChange={(event) => setExposeTarget(event.target.value)}>
                {state.corporations.map((corp) => <option key={corp.id} value={corp.id}>{corp.ticker} · {corp.name}</option>)}
                {state.media.filter((item) => !item.playerOwned).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <button type="button" className="btn mt-2 w-full py-1.5 text-[9px]" onClick={() => runAction((current) => runExpose(current, exposeTarget))}><Newspaper size={11} /> Air exposé · $90K</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between border-t border-ink-600/30 pt-3">
          <span className="text-[10px] text-fog-500">Rival network. You can target it with an exposé from your own station.</span>
          <button type="button" className="btn btn-danger px-3 py-1.5 text-[9px]" onClick={() => runAction((current) => runExpose(current, station.id))}><Flame size={11} /> Expose</button>
        </div>
      )}
    </Panel>
  )
}

function NarrativeMarket() {
  const { state } = useGame()
  const sorted = [...state.tokens].sort((a, b) => tokenChange(b) - tokenChange(a))
  return (
    <Panel eyebrow="PUBLIC SENTIMENT" title="Narrative market" action={<Badge tone="violet">MEDIA-DRIVEN</Badge>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          {sorted.slice(0, 5).map((token) => {
            const change = tokenChange(token)
            const sentiment = Math.max(0, Math.min(100, 50 + change * 2))
            return (
              <div key={token.id}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2"><span className="font-mono text-[10px] text-fog-200">${token.symbol}</span><span className="micro">{token.name}</span></div>
                  <div className="flex items-center gap-2"><span className={classNames('mono text-[9px]', change >= 0 ? 'text-mint-300' : 'text-rose-300')}>{pct(change)}</span><span className="mono text-[9px] text-fog-500">{sentiment.toFixed(0)}</span></div>
                </div>
                <Progress value={sentiment} hue={sentiment > 55 ? 174 : sentiment > 40 ? 42 : 350} className="mt-1.5" height={4} />
              </div>
            )
          })}
        </div>
        <div className="space-y-2">
          {state.media.slice(0, 4).map((station) => (
            <div key={station.id} className="flex items-center gap-2.5 border border-ink-600/30 bg-ink-900/35 p-2">
              <div className="relative h-9 w-12 shrink-0 overflow-hidden border border-ink-600/40">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-55"
                  style={{ backgroundImage: `linear-gradient(180deg, rgba(5,7,11,0.1), rgba(5,7,11,0.72)), url(${imagery[station.id] ?? imagery.signal9})` }}
                />
                <div className="absolute inset-0 flex items-center justify-center"><Radio size={11} style={{ color: `hsl(${station.hue}, 78%, 70%)` }} /></div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[10px] text-fog-200">{station.name}</div>
                <div className="micro">{station.reach.toFixed(1)}M reach · {station.credibility.toFixed(0)} cred</div>
              </div>
              <div className="text-right"><div className="micro">SOV</div><div className="mono text-[9px] text-fog-300">{((station.reach / Math.max(1, state.media.reduce((sum, item) => sum + item.reach, 0))) * 100).toFixed(0)}%</div></div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}

function MediaControl() {
  const { state, runAction } = useGame()
  const station = state.media.find((item) => item.playerOwned)
  const [name, setName] = useState('Sovereign Broadcast')
  const [type, setType] = useState<MediaStation['type']>('Streaming')

  if (station) {
    return (
      <Panel eyebrow="YOUR NETWORK" title={station.name} action={<Badge tone="good">ON AIR</Badge>}>
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Reach</div><div className="stat-value mt-1 text-[14px] text-fog-100">{station.reach.toFixed(2)}M</div></div>
          <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Revenue / day</div><div className="stat-value mt-1 text-[14px] text-mint-300">{money(station.revenue, true)}</div></div>
          <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Credibility</div><div className="stat-value mt-1 text-[14px] text-fog-100">{station.credibility.toFixed(0)}</div></div>
          <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Sentiment</div><div className="stat-value mt-1 text-[14px] text-fog-100">{station.sentiment.toFixed(0)}</div></div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px]"><span className="text-fog-500">Share of voice</span><span className="mono text-fog-200">{((station.reach / Math.max(1, state.media.reduce((sum, item) => sum + item.reach, 0))) * 100).toFixed(1)}%</span></div>
        <Progress value={(station.reach / Math.max(1, state.media.reduce((sum, item) => sum + item.reach, 0))) * 100} hue={station.hue} className="mt-1.5" height={4} />
        <div className="mt-3 space-y-2">
          <button type="button" className="btn btn-primary w-full py-2 text-[9px]" onClick={() => runAction((current) => launchShow(current))}><Play size={11} /> Launch new show · $60K</button>
          <button type="button" className="btn w-full py-2 text-[9px]" onClick={() => runAction((current) => runFakeNews(current))}><ShieldAlert size={11} /> Plant fake story · $40K dirty</button>
        </div>
        <div className="mt-3 flex items-start gap-2 border border-amber-400/20 bg-amber-400/5 p-2.5">
          <AlertTriangleIcon />
          <p className="text-[9px] leading-relaxed text-amber-200/70">Propaganda moves price. Credibility is the only asset that cannot be bought back at a discount.</p>
        </div>
      </Panel>
    )
  }

  return (
    <Panel eyebrow="BROADCAST LICENSE" title="Launch a network">
      <p className="text-[11px] leading-relaxed text-fog-500">A network costs $900K. Start small, build reach, then weaponize the narrative.</p>
      <label className="mt-3 block"><span className="label mb-1.5 block">Network name</span><input className="input" value={name} onChange={(event) => setName(event.target.value)} maxLength={30} /></label>
      <label className="mt-3 block"><span className="label mb-1.5 block">Format</span>
        <select className="input" value={type} onChange={(event) => setType(event.target.value as MediaStation['type'])}>
          <option value="Streaming">Streaming</option>
          <option value="TV">TV</option>
          <option value="News">News</option>
          <option value="Underground">Underground</option>
        </select>
      </label>
      <button type="button" className="btn btn-primary mt-3 w-full py-2.5" onClick={() => runAction((current) => createNetwork(current, name, type))}><Plus size={12} /> Apply for license</button>
    </Panel>
  )
}

function AlertTriangleIcon() {
  return <ShieldAlert size={13} className="mt-0.5 shrink-0 text-amber-300" />
}

export function MediaPage() {
  const { state } = useGame()
  const [selectedId, setSelectedId] = useState(state.media.find((item) => item.playerOwned)?.id ?? state.media[0]?.id ?? 'signal9')
  const selected = state.media.find((item) => item.id === selectedId) ?? state.media[0]
  const totalReach = state.media.reduce((sum, item) => sum + item.reach, 0)
  const avgCred = state.media.reduce((sum, item) => sum + item.credibility, 0) / Math.max(1, state.media.length)
  const avgSentiment = state.media.reduce((sum, item) => sum + item.sentiment, 0) / Math.max(1, state.media.length)
  const revenue = state.media.reduce((sum, item) => sum + item.revenue, 0)

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="TV · STREAMING · NARRATIVE WARFARE"
        title="Media Empire"
        description="Control the narrative. Build reach, manufacture consent, expose rivals, and survive the credibility cost of your own propaganda."
        action={<Badge tone="violet" pulse>{totalReach.toFixed(1)}M AUDIENCE</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total reach" value={`${totalReach.toFixed(1)}M`} sub={`${state.media.length} networks on air`} icon={<Users size={15} />} hue={302} spark={series(totalReach, 1, 0.4)} />
        <StatCard label="Avg credibility" value={`${avgCred.toFixed(0)}`} sub="Audience trust across the market" icon={<Eye size={15} />} hue={174} spark={series(avgCred, 2, 4)} />
        <StatCard label="Avg sentiment" value={`${avgSentiment.toFixed(0)}`} sub="Public mood toward your assets" icon={<TrendingUp size={15} />} hue={42} spark={series(avgSentiment, 3, 4)} />
        <StatCard label="Daily ad revenue" value={money(revenue, true)} sub="Across all licensed networks" icon={<RadioTower size={15} />} hue={286} spark={series(revenue / 1000, 4, 4)} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-4 xl:col-span-8">
          <NetworkTable selectedId={selected.id} onSelect={setSelectedId} />
          <StationDetail station={selected} />
        </div>
        <div className="col-span-12 space-y-4 xl:col-span-4">
          <MediaControl />
          <NarrativeMarket />
        </div>
      </div>

      <Panel eyebrow="NARRATIVE ASSETS" title="Broadcast gallery">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {state.media.map((station) => (
            <button key={station.id} type="button" onClick={() => setSelectedId(station.id)} className="group relative overflow-hidden border border-ink-600/35 text-left transition-colors hover:border-mint-400/35">
              <div className="relative h-24 overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `linear-gradient(180deg, rgba(5,7,11,0.15), rgba(5,7,11,0.88)), url(${imagery[station.id] ?? imagery.signal9})` }} />
                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <div className="flex items-center gap-1.5"><ImageIcon size={9} className="text-fog-400" /><span className="font-mono text-[8px] uppercase tracking-wider text-fog-400">{station.type}</span></div>
                  <div className="mt-0.5 truncate text-[11px] font-medium text-fog-100">{station.name}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 p-2.5">
                <div><div className="micro">Reach</div><div className="mono text-[9px] text-fog-200">{station.reach.toFixed(1)}M</div></div>
                <div><div className="micro">Cred</div><div className="mono text-[9px] text-fog-200">{station.credibility.toFixed(0)}</div></div>
              </div>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  )
}
