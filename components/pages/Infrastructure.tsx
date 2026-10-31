'use client'

import { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Cable,
  Cpu,
  Gauge,
  Globe2,
  HardDrive,
  Lock,
  Network,
  RadioTower,
  Server,
  Shield,
  ShieldAlert,
  Signal,
  Wifi,
  Wrench,
  Zap,
} from 'lucide-react'
import { useGame } from '../GameProvider'
import { Badge, KV, Panel, Progress, SectionHeading, Sparkline, StatCard, Tabs } from '../ui'
import { classNames, money, num } from '@/lib/format'
import { buildDataCenter, buildNode, hackIsp, hardenNetwork, repairNetwork, setIspPrice, upgradeBackbone } from '@/lib/actions'

function series(base: number, seed: number, amplitude = 0.08, points = 32): number[] {
  return Array.from({ length: points }, (_, index) => {
    const wave = Math.sin(index * 0.52 + seed) * amplitude + Math.sin(index * 0.17 + seed * 2) * amplitude * 0.6
    return Math.max(0.01, base + wave)
  })
}

function Topology() {
  const { state } = useGame()
  const isp = state.isps.find((item) => item.playerOwned)
  const nodes = [
    { id: 'helix', label: 'HELIX PARK', x: 300, y: 42 },
    { id: 'aurora', label: 'AURORA', x: 455, y: 84 },
    { id: 'meridian', label: 'MERIDIAN', x: 510, y: 178 },
    { id: 'dockside', label: 'DOCKSIDE', x: 438, y: 266 },
    { id: 'narrows', label: 'NARROWS', x: 300, y: 292 },
    { id: 'southgate', label: 'SOUTHGATE', x: 164, y: 266 },
    { id: 'ironworks', label: 'IRONWORKS', x: 94, y: 178 },
    { id: 'oldtown', label: 'OLD TOWN', x: 150, y: 84 },
    { id: 'databasin', label: 'DATA BASIN', x: 300, y: 168 },
  ]
  return (
    <div className="relative overflow-hidden border border-ink-600/35 bg-ink-950/70 p-2">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(63,227,192,0.09),transparent_60%)]" />
      <svg viewBox="0 0 600 330" className="relative z-10 h-auto w-full">
        <defs>
          <radialGradient id="core-glow">
            <stop offset="0%" stopColor="#3fe3c0" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#1fc9a8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1fc9a8" stopOpacity="0" />
          </radialGradient>
          <pattern id="topo-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(74,103,128,0.1)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="600" height="330" fill="url(#topo-grid)" />
        <circle cx="300" cy="168" r="92" fill="none" stroke="rgba(63,227,192,0.12)" strokeDasharray="2 8" />
        <circle cx="300" cy="168" r="132" fill="none" stroke="rgba(74,103,128,0.14)" strokeDasharray="1 10" />
        <circle cx="300" cy="168" r="48" fill="url(#core-glow)" opacity="0.5" />
        {nodes.filter((node) => node.id !== 'databasin').map((node) => (
          <g key={node.id}>
            <line x1="300" y1="168" x2={node.x} y2={node.y} stroke={node.id === 'databasin' ? '#3fe3c0' : 'rgba(63,227,192,0.28)'} strokeWidth="1" className="animate-dash" />
            <circle cx={node.x} cy={node.y} r="4.2" fill={node.id === 'helix' || node.id === 'dockside' ? '#3fe3c0' : '#7cc4ff'} opacity="0.9" />
            <circle cx={node.x} cy={node.y} r="8" fill="none" stroke={node.id === 'helix' || node.id === 'dockside' ? 'rgba(63,227,192,0.28)' : 'rgba(124,196,255,0.22)'} />
            <text x={node.x} y={node.y - 12} textAnchor="middle" fill="#7f95aa" fontSize="7" fontFamily="monospace" letterSpacing="0.1em">{node.label}</text>
          </g>
        ))}
        <g>
          <rect x="264" y="132" width="72" height="72" rx="4" fill="rgba(63,227,192,0.07)" stroke="rgba(63,227,192,0.55)" />
          <rect x="276" y="144" width="48" height="10" rx="1" fill="rgba(63,227,192,0.16)" stroke="rgba(63,227,192,0.4)" strokeWidth="0.6" />
          <rect x="276" y="160" width="48" height="10" rx="1" fill="rgba(63,227,192,0.12)" stroke="rgba(63,227,192,0.32)" strokeWidth="0.6" />
          <rect x="276" y="176" width="48" height="10" rx="1" fill="rgba(63,227,192,0.08)" stroke="rgba(63,227,192,0.28)" strokeWidth="0.6" />
          <circle cx="282" cy="188" r="1.6" fill="#3fe3c0" className="animate-blink" />
          <text x="300" y="220" textAnchor="middle" fill="#3fe3c0" fontSize="8" fontFamily="monospace" letterSpacing="0.14em">AETHER CORE</text>
          <text x="300" y="232" textAnchor="middle" fill="#5f7489" fontSize="7" fontFamily="monospace">{isp ? `${isp.capacity.toFixed(1)} TBPS · ${isp.latency.toFixed(0)}MS` : 'OFFLINE'}</text>
        </g>
        {Array.from({ length: 4 }).map((_, index) => {
          const angle = (index / 4) * Math.PI * 2 + 0.5
          const x = 300 + Math.cos(angle) * 104
          const y = 168 + Math.sin(angle) * 104
          return <rect key={index} x={x - 4} y={y - 4} width="8" height="8" fill="rgba(124,196,255,0.5)" stroke="rgba(124,196,255,0.8)" strokeWidth="0.6" />
        })}
        <text x="12" y="320" fill="#465a6e" fontSize="7" fontFamily="monospace" letterSpacing="0.12em">TOPOLOGY · FIBER ROUTES · DATA CENTERS</text>
      </svg>
    </div>
  )
}

function IspTable({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const { state } = useGame()
  return (
    <Panel className="overflow-hidden" eyebrow="TRANSIT PROVIDERS" title="Backbone operators" dense>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr className="border-b border-ink-600/35 text-left">
              <th className="label py-2 font-normal">Network</th>
              <th className="label py-2 text-right font-normal">Capacity</th>
              <th className="label py-2 text-right font-normal">Load</th>
              <th className="label py-2 text-right font-normal">Latency</th>
              <th className="label py-2 text-right font-normal">Uptime</th>
              <th className="label py-2 text-right font-normal">Revenue</th>
              <th className="label py-2 pl-3 text-right font-normal">Security</th>
            </tr>
          </thead>
          <tbody>
            {state.isps.map((isp) => {
              const active = isp.id === selectedId
              return (
                <tr key={isp.id} onClick={() => onSelect(isp.id)} className={classNames('cursor-pointer border-b border-ink-600/20 last:border-0', active ? 'bg-mint-400/6' : 'hover:bg-ink-800/30')}>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center border" style={{ borderColor: `hsla(${isp.hue}, 70%, 60%, 0.3)`, background: `hsla(${isp.hue}, 70%, 50%, 0.07)` }}>
                        <Wifi size={13} style={{ color: `hsl(${isp.hue}, 78%, 68%)` }} />
                      </span>
                      <div><div className="text-[10px] font-medium text-fog-200">{isp.name}{isp.playerOwned && <span className="ml-1 text-[8px] text-mint-400">YOURS</span>}</div><div className="micro">{isp.ownerName}</div></div>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-fog-300">{isp.capacity.toFixed(1)} Tbps</td>
                  <td className={classNames('py-2.5 text-right font-mono text-[10px]', isp.load > 0.9 ? 'text-rose-300' : isp.load > 0.75 ? 'text-amber-300' : 'text-mint-300')}>{(isp.load * 100).toFixed(0)}%</td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-fog-400">{isp.latency.toFixed(0)} ms</td>
                  <td className={classNames('py-2.5 text-right font-mono text-[10px]', isp.uptime < 99 ? 'text-rose-300' : 'text-fog-300')}>{isp.uptime.toFixed(2)}%</td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-fog-400">{money(isp.revenue, true)}</td>
                  <td className="w-24 py-2.5 pl-3"><div className="flex items-center justify-end gap-2"><span className="mono text-[9px] text-fog-500">{isp.security}</span><div className="w-10"><Progress value={isp.security} hue={isp.security > 60 ? 174 : 42} height={3} /></div></div></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function NetworkControl({ ispId }: { ispId: string }) {
  const { state, runAction } = useGame()
  const isp = state.isps.find((item) => item.id === ispId) ?? state.isps[0]
  const [price, setPrice] = useState(String(isp?.pricePerTbps ?? 1240))
  const isMine = isp?.playerOwned
  const load = isp ? isp.load * 100 : 0
  const uptime = isp?.uptime ?? 0
  const health = Math.max(0, Math.min(100, uptime * 0.7 + (100 - load) * 0.3))

  return (
    <Panel
      eyebrow={`${isp?.ownerName.toUpperCase()} · ${isp?.nodes ?? 0} NODES`}
      title={isp?.name ?? 'Network'}
      action={<Badge tone={isMine ? 'good' : 'info'}>{isMine ? 'CONTROLLED' : 'THIRD PARTY'}</Badge>}
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Capacity</div><div className="stat-value mt-1 text-[14px] text-fog-100">{isp?.capacity.toFixed(1)} Tbps</div></div>
        <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Utilization</div><div className={classNames('stat-value mt-1 text-[14px]', load > 90 ? 'text-rose-300' : load > 75 ? 'text-amber-300' : 'text-mint-300')}>{load.toFixed(0)}%</div></div>
        <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Latency</div><div className="stat-value mt-1 text-[14px] text-fog-100">{isp?.latency.toFixed(0)} ms</div></div>
        <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Uptime</div><div className={classNames('stat-value mt-1 text-[14px]', uptime < 99 ? 'text-rose-300' : 'text-mint-300')}>{uptime.toFixed(2)}%</div></div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px]"><span className="text-fog-500">Network health</span><span className="mono text-fog-200">{health.toFixed(0)} / 100</span></div>
        <Progress value={health} hue={health > 65 ? 174 : health > 40 ? 42 : 350} className="mt-1.5" height={5} glow={health < 45} />
      </div>

      <div className="mt-3 h-10">
        <Sparkline data={series((isp?.load ?? 0.5) * 100, 3, 7)} hue={isp?.hue ?? 174} height={40} />
      </div>

      {isMine ? (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" className="btn py-2 text-[9px]" onClick={() => runAction((current) => buildNode(current))}><Cable size={11} /> Build node</button>
            <button type="button" className="btn py-2 text-[9px]" onClick={() => runAction((current) => buildDataCenter(current))}><Server size={11} /> Data center</button>
            <button type="button" className="btn py-2 text-[9px]" onClick={() => runAction((current) => upgradeBackbone(current))}><Zap size={11} /> Upgrade route</button>
            <button type="button" className="btn py-2 text-[9px]" onClick={() => runAction((current) => repairNetwork(current))}><Wrench size={11} /> Repair</button>
          </div>
          <button type="button" className="btn w-full py-1.5 text-[9px]" onClick={() => runAction((current) => hardenNetwork(current))}><Shield size={11} /> Harden security · $260K</button>
          <div className="border-t border-ink-600/30 pt-2">
            <div className="flex items-center justify-between"><span className="label">Transit price</span><span className="mono text-[10px] text-mint-300">${Number(price).toFixed(0)}/Tbps</span></div>
            <input type="range" min="400" max="3200" step="20" value={price} onChange={(event) => setPrice(event.target.value)} className="mt-1.5 w-full accent-mint-400" />
            <button type="button" className="btn mt-1.5 w-full py-1.5 text-[9px]" onClick={() => runAction((current) => setIspPrice(current, Number(price)))}>Set transit price</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-[10px]"><span className="text-fog-500">Security rating</span><span className="mono text-fog-200">{isp?.security} / 100</span></div>
          <Progress value={isp?.security ?? 0} hue={isp && isp.security > 60 ? 174 : 42} height={4} />
          <button type="button" className="btn btn-danger w-full py-2 text-[9px]" onClick={() => runAction((current) => hackIsp(current, isp.id))}>
            <ShieldAlert size={11} /> Breach network · $80K dirty
          </button>
          <p className="text-[9px] leading-relaxed text-fog-500">A successful intrusion degrades uptime and load. A failed one leaves forensic evidence and raises heat.</p>
        </div>
      )}
    </Panel>
  )
}

function EconomicsPanel() {
  const { state } = useGame()
  const isp = state.isps.find((item) => item.playerOwned)
  const capacity = state.isps.reduce((sum, item) => sum + item.capacity, 0)
  const load = state.isps.reduce((sum, item) => sum + item.load * item.capacity, 0) / Math.max(1, capacity)
  return (
    <Panel eyebrow="MESH ECONOMICS" title="Bandwidth & compute">
      <div className="grid grid-cols-2 gap-2">
        <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">System capacity</div><div className="stat-value mt-1 text-[14px] text-fog-100">{capacity.toFixed(1)} Tbps</div></div>
        <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Weighted load</div><div className={classNames('stat-value mt-1 text-[14px]', load > 0.85 ? 'text-rose-300' : 'text-fog-100')}>{(load * 100).toFixed(0)}%</div></div>
        <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Gas price</div><div className="stat-value mt-1 text-[14px] text-amber-300">{state.gasPrice.toFixed(1)}</div></div>
        <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Congestion</div><div className="stat-value mt-1 text-[14px] text-fog-100">{state.congestion.toFixed(0)}%</div></div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-[10px]"><span className="text-fog-500">Your network revenue / day</span><span className="mono text-mint-300">{money(isp?.revenue ?? 0, true)}</span></div>
        <div className="flex items-center justify-between text-[10px]"><span className="text-fog-500">Data centers</span><span className="mono text-fog-200">{isp?.dataCenters ?? 0}</span></div>
        <div className="flex items-center justify-between text-[10px]"><span className="text-fog-500">Transit price</span><span className="mono text-fog-200">${isp?.pricePerTbps.toFixed(0) ?? 0}/Tbps</span></div>
      </div>
      <div className="mt-3 border-t border-ink-600/30 pt-3">
        <div className="flex items-start gap-2">
          <Cpu size={13} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="text-[9px] leading-relaxed text-fog-500">Mining yield, DEX execution and media streaming all degrade when mesh load exceeds 90%. Your ISP is not a side business. It is the floor under every other asset.</p>
        </div>
      </div>
    </Panel>
  )
}

function ThreatPanel() {
  const { state } = useGame()
  const isp = state.isps.find((item) => item.playerOwned)
  const security = isp?.security ?? 0
  const logs = state.log.filter((line) => /breach|intrusion|AetherLink|network|uptime|hack/i.test(line)).slice(0, 5)
  return (
    <Panel eyebrow="ATTACK SURFACE" title="Cyber threat monitor" action={<Badge tone={security > 60 ? 'good' : 'bad'}>{security > 60 ? 'HARDENED' : 'EXPOSED'}</Badge>}>
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(74,103,128,0.2)" strokeWidth="5" />
            <circle cx="32" cy="32" r="26" fill="none" stroke={security > 60 ? '#3fe3c0' : '#f7b34a'} strokeWidth="5" strokeDasharray={163} strokeDashoffset={163 * (1 - security / 100)} strokeLinecap="round" />
          </svg>
          <span className="absolute stat-value text-[13px] text-fog-100">{security}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-fog-200">Security rating</div>
          <div className="micro mt-0.5">{security > 60 ? 'Zero-trust routing active' : 'Legacy perimeter exposed'}</div>
          <div className="mt-2 flex gap-2">
            <span className="chip chip-rose">HEAT {Math.round(state.player.heat)}</span>
            <span className="chip">{state.isps.filter((item) => !item.playerOwned).length} RIVALS</span>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {logs.length === 0 ? (
          <div className="border border-dashed border-ink-600/40 p-3 text-center text-[9px] text-fog-500">No intrusion attempts logged.</div>
        ) : (
          logs.map((line, index) => (
            <div key={index} className="border-l border-rose-400/30 pl-2 text-[9px] leading-relaxed text-fog-500">{line}</div>
          ))
        )}
      </div>
    </Panel>
  )
}

export function InfrastructurePage() {
  const { state } = useGame()
  const [selectedId, setSelectedId] = useState(state.isps.find((item) => item.playerOwned)?.id ?? state.isps[0]?.id ?? 'aether')
  const playerIsp = state.isps.find((item) => item.playerOwned)
  const totalCapacity = state.isps.reduce((sum, item) => sum + item.capacity, 0)
  const avgUptime = state.isps.reduce((sum, item) => sum + item.uptime, 0) / Math.max(1, state.isps.length)
  const avgLatency = state.isps.reduce((sum, item) => sum + item.latency, 0) / Math.max(1, state.isps.length)

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="FIBER · DATA CENTERS · BANDWIDTH"
        title="Infrastructure"
        description="Own the physical layer. When your backbone goes down, every digital business in your empire goes down with it."
        action={<Badge tone={playerIsp && playerIsp.uptime > 99.5 ? 'good' : 'warn'} pulse>{playerIsp ? `${playerIsp.uptime.toFixed(2)}% UPTIME` : 'NO NETWORK'}</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Your capacity" value={`${playerIsp?.capacity.toFixed(1) ?? '0'} Tbps`} sub={`${playerIsp?.nodes ?? 0} fiber nodes · ${playerIsp?.dataCenters ?? 0} data centers`} icon={<Network size={15} />} hue={174} spark={series((playerIsp?.load ?? 0.5) * 100, 1, 8)} />
        <StatCard label="Mesh load" value={`${(state.congestion).toFixed(0)}%`} sub="Congestion across all providers" icon={<Activity size={15} />} hue={42} spark={series(state.congestion, 2, 6)} />
        <StatCard label="Average latency" value={`${avgLatency.toFixed(0)} ms`} sub={`System capacity ${totalCapacity.toFixed(1)} Tbps`} icon={<Signal size={15} />} hue={196} spark={series(avgLatency, 4, 4)} />
        <StatCard label="Uptime" value={`${avgUptime.toFixed(2)}%`} sub="Weighted across licensed backbones" icon={<Server size={15} />} hue={142} spark={series(avgUptime - 98, 5, 0.4)} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-4 xl:col-span-8">
          <Panel eyebrow="PHYSICAL LAYER" title="AetherLink backbone topology" action={<Badge tone="good">{playerIsp?.capacity.toFixed(1)} TBPS</Badge>}>
            <Topology />
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div><div className="micro">Fiber nodes</div><div className="mono mt-0.5 text-[11px] text-fog-200">{playerIsp?.nodes ?? 0}</div></div>
              <div><div className="micro">Data centers</div><div className="mono mt-0.5 text-[11px] text-fog-200">{playerIsp?.dataCenters ?? 0}</div></div>
              <div><div className="micro">Security</div><div className="mono mt-0.5 text-[11px] text-fog-200">{playerIsp?.security ?? 0} / 100</div></div>
              <div><div className="micro">Daily revenue</div><div className="mono mt-0.5 text-[11px] text-mint-300">{money(playerIsp?.revenue ?? 0, true)}</div></div>
            </div>
          </Panel>
          <IspTable selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="col-span-12 space-y-4 xl:col-span-4">
          <NetworkControl ispId={selectedId} />
          <EconomicsPanel />
          <ThreatPanel />
        </div>
      </div>
    </div>
  )
}
