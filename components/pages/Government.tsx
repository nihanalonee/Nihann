'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Banknote,
  BadgeDollarSign,
  Building2,
  Check,
  CircleDollarSign,
  FileWarning,
  Gavel,
  HandCoins,
  Landmark,
  Megaphone,
  Percent,
  Receipt,
  Scale,
  Shield,
  ShieldAlert,
  Siren,
  TrendingUp,
  Users,
  Vote,
  Wallet,
  X,
} from 'lucide-react'
import { useGame } from '../GameProvider'
import {
  AreaChart,
  Avatar,
  Badge,
  Donut,
  Gauge,
  KV,
  Panel,
  Progress,
  SectionHeading,
  StatCard,
} from '../ui'
import { classNames, money } from '@/lib/format'
import {
  bribeOfficial,
  dismissWarrant,
  fundCampaign,
  lobby,
  requestBailout,
} from '@/lib/actions'

function series(base: number, seed: number, amplitude = 6, points = 36): number[] {
  return Array.from({ length: points }, (_, index) => {
    const wave = Math.sin(index * 0.42 + seed) * amplitude + Math.sin(index * 0.19 + seed * 1.7) * amplitude * 0.6
    const drift = (index - points) * 0.16
    return Math.max(0, Math.min(100, base + wave + drift))
  })
}

function approvalTone(value: number): 'good' | 'warn' | 'bad' {
  if (value >= 60) return 'good'
  if (value >= 40) return 'warn'
  return 'bad'
}

function PolicyPulse() {
  const { state } = useGame()
  const government = state.government
  const approval = government.approval
  const regulation = government.regulation
  const tax = government.taxRate

  return (
    <Panel
      eyebrow="FISCAL POLICY · REGULATORY PRESSURE"
      title="City policy pulse"
      action={<Badge tone={approvalTone(approval)} pulse>{approvalTone(approval) === 'good' ? 'STABLE' : approvalTone(approval) === 'warn' ? 'PRESSURE' : 'FRAGILE'}</Badge>}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="micro">Public approval</div>
              <div className="stat-value mt-0.5 text-[30px] font-semibold text-fog-100">{approval.toFixed(1)}%</div>
            </div>
            <div className="flex items-center gap-4">
              <div><div className="micro">Regulation</div><div className="stat-value mt-0.5 text-[13px] text-fog-200">{regulation.toFixed(0)} / 100</div></div>
              <div><div className="micro">Tax rate</div><div className="stat-value mt-0.5 text-[13px] text-amber-300">{tax.toFixed(1)}%</div></div>
            </div>
          </div>
          <div className="mt-3 h-[160px]">
            <AreaChart data={series(approval, 5, 5)} hue={approvalTone(approval) === 'bad' ? 350 : approvalTone(approval) === 'warn' ? 42 : 174} height={160} valueFormatter={(value) => `${value.toFixed(0)}%`} />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 border-t border-ink-600/30 pt-3">
            <div><div className="micro">Capital formation</div><div className="mono mt-0.5 text-[10px] text-mint-300">{Math.max(0, 100 - tax * 1.6 - regulation * 0.45).toFixed(0)}</div></div>
            <div><div className="micro">Market risk</div><div className="mono mt-0.5 text-[10px] text-amber-300">{(regulation * 0.6 + tax * 1.2).toFixed(0)}</div></div>
            <div><div className="micro">Public trust</div><div className="mono mt-0.5 text-[10px] text-fog-200">{(approval * 0.7 + (100 - regulation) * 0.3).toFixed(0)}</div></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center justify-center border border-ink-600/35 bg-ink-900/40 p-2">
            <Gauge value={approval} label="Approval" hue={approvalTone(approval) === 'bad' ? 350 : approvalTone(approval) === 'warn' ? 42 : 174} size={116} />
          </div>
          <div className="flex flex-col items-center justify-center border border-ink-600/35 bg-ink-900/40 p-2">
            <Gauge value={regulation} label="Regulation" hue={regulation > 65 ? 350 : regulation > 45 ? 42 : 174} size={116} />
          </div>
          <div className="col-span-2 border border-ink-600/35 bg-ink-900/40 p-2.5">
            <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Effective tax take</span><span className="mono text-amber-300">{(tax + regulation * 0.12).toFixed(1)}%</span></div>
            <Progress value={Math.min(100, (tax + regulation * 0.12) * 2.2)} hue={42} className="mt-1.5" height={4} />
            <div className="mt-2 flex items-center justify-between text-[9px]"><span className="text-fog-500">Stimulus deployed</span><span className="mono text-mint-300">{money(government.stimulus, true)}</span></div>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function OfficialsGrid() {
  const { state, runAction } = useGame()
  const officials = [...state.government.officials].sort((a, b) => b.influence - a.influence)

  return (
    <Panel eyebrow="CITY HALL · OFFICIALS" title="Power brokers" action={<Badge tone="warn">{officials.filter((official) => official.bribed).length}/{officials.length} CAPTURED</Badge>}>
      <div className="grid gap-2 sm:grid-cols-2">
        {officials.map((official) => (
          <div key={official.id} className={classNames('border bg-ink-900/35 p-3', official.bribed ? 'border-mint-400/30' : 'border-ink-600/35')}>
            <div className="flex items-start gap-2">
              <Avatar name={official.name} hue={official.bribed ? 174 : official.loyalty > 45 ? 42 : 350} size={32} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-medium text-fog-200">{official.name}</div>
                <div className="micro truncate">{official.role}</div>
              </div>
              <Badge tone={official.bribed ? 'good' : 'info'}>{official.bribed ? 'OWNED' : 'CLEAN'}</Badge>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div><div className="micro">Influence</div><div className="mono mt-0.5 text-[10px] text-fog-300">{official.influence}</div></div>
              <div><div className="micro">Loyalty</div><div className="mono mt-0.5 text-[10px] text-fog-300">{official.loyalty}</div></div>
            </div>
            <Progress value={official.loyalty} hue={official.bribed ? 174 : official.loyalty > 45 ? 42 : 350} className="mt-1.5" height={3} />

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="font-mono text-[8px] tracking-wider text-fog-500">{official.bribed ? 'RETAINER ACTIVE' : `RETAINER ${money(official.bribePrice, true)}`}</span>
              {official.bribed ? (
                <span className="flex items-center gap-1 font-mono text-[8px] text-mint-400"><Check size={9} /> ALIGNED</span>
              ) : (
                <button
                  type="button"
                  className="btn px-2 py-1 text-[8px]"
                  onClick={() => runAction((current) => bribeOfficial(current, official.id))}
                >
                  <HandCoins size={9} /> Compromise
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function InfluenceOperations() {
  const { state, runAction } = useGame()
  const failingBank = state.banks.find((bank) => bank.playerOwned && (bank.status === 'critical' || bank.status === 'collapsed'))
  const marketDown = state.marketIndex < state.indexHistory[Math.max(0, state.indexHistory.length - 24)] * 0.88
  const eligible = Boolean(failingBank) || marketDown

  return (
    <Panel eyebrow="LOBBYING · CAMPAIGNS · BAILOUTS" title="Influence operations" action={<Badge tone="violet">{Math.round(state.player.influence)} INFLUENCE</Badge>}>
      <div className="space-y-2">
        <div className="border border-ink-600/35 bg-ink-900/35 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2"><Megaphone size={13} className="text-azure-300" /><span className="text-[11px] text-fog-200">Lobbying package</span></div>
            <span className="chip">$250K</span>
          </div>
          <p className="mt-1.5 text-[9px] leading-relaxed text-fog-500">Regulation -3.5, transaction tax -0.4%, approval +1, influence +5.</p>
          <button type="button" className="btn mt-2 w-full py-2 text-[9px]" onClick={() => runAction((current) => lobby(current))}>
            <Landmark size={11} /> Lobby City Hall
          </button>
        </div>

        <div className="border border-ink-600/35 bg-ink-900/35 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2"><Vote size={13} className="text-violet-300" /><span className="text-[11px] text-fog-200">Campaign contribution</span></div>
            <span className="chip chip-violet">$500K</span>
          </div>
          <p className="mt-1.5 text-[9px] leading-relaxed text-fog-500">Influence +12, approval +2, heat -3. Buy goodwill before you need it.</p>
          <button type="button" className="btn mt-2 w-full py-2 text-[9px]" onClick={() => runAction((current) => fundCampaign(current))}>
            <BadgeDollarSign size={11} /> Fund campaign
          </button>
        </div>

        <div className="border border-ink-600/35 bg-ink-900/35 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2"><Siren size={13} className={eligible ? 'text-rose-300' : 'text-fog-500'} /><span className="text-[11px] text-fog-200">Emergency bailout</span></div>
            <span className={classNames('chip', eligible ? 'chip-rose' : '')}>30 INFLUENCE</span>
          </div>
          <p className="mt-1.5 text-[9px] leading-relaxed text-fog-500">
            {eligible ? 'A systemic failure qualifies. The council can still refuse on moral-hazard grounds.' : 'Requires a failing player bank or a market index down 12% over 24 ticks.'}
          </p>
          <button
            type="button"
            className={classNames('btn mt-2 w-full py-2 text-[9px]', eligible && 'btn-danger')}
            disabled={!eligible}
            onClick={() => runAction((current) => requestBailout(current))}
          >
            <Banknote size={11} /> Request bailout
          </button>
        </div>
      </div>
    </Panel>
  )
}

function RegulationsPanel() {
  const { state } = useGame()
  const regulations = state.government.regulations
  return (
    <Panel eyebrow="STATUTE BOOK" title="Active regulations" action={<Badge tone="warn">{regulations.filter((item) => item.active).length} IN FORCE</Badge>}>
      <div className="space-y-2">
        {regulations.length === 0 && <div className="border border-dashed border-ink-600/40 p-3 text-center text-[9px] text-fog-500">No regulations on the books.</div>}
        {regulations.map((regulation, index) => (
          <div key={regulation.id} className="flex items-start gap-2.5 border border-ink-600/30 bg-ink-900/35 p-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-ink-600/40 bg-ink-800/50 font-mono text-[9px] text-fog-400">
              {String(index + 1).padStart(2, '0')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-medium text-fog-200">{regulation.title}</span>
                <Badge tone={regulation.active ? 'warn' : 'info'}>{regulation.active ? 'ACTIVE' : 'REPEALED'}</Badge>
              </div>
              <p className="mt-1 text-[9px] leading-relaxed text-fog-500">{regulation.description}</p>
              <div className="micro mt-1">Passed day {regulation.passedDay}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-start gap-2 border border-amber-400/20 bg-amber-400/5 p-2.5">
        <FileWarning size={12} className="mt-0.5 shrink-0 text-amber-300" />
        <p className="text-[9px] leading-relaxed text-amber-200/70">Regulation raises the cost of every aggressive move. Lobbying is cheaper than compliance, until it isn&apos;t.</p>
      </div>
    </Panel>
  )
}

function WarrantsPanel() {
  const { state, runAction } = useGame()
  const warrants = state.government.warrants
  const active = warrants.filter((warrant) => warrant.status === 'active')
  const playerWarrant = active.find((warrant) => warrant.targetId === 'player')

  return (
    <Panel eyebrow="LAW ENFORCEMENT" title="Warrant docket" action={<Badge tone={active.length ? 'bad' : 'good'}>{active.length} ACTIVE</Badge>}>
      <div className="space-y-2">
        {warrants.length === 0 && <div className="border border-dashed border-ink-600/40 p-3 text-center text-[9px] text-fog-500">The docket is empty.</div>}
        {warrants.slice(0, 6).map((warrant) => (
          <div key={warrant.id} className={classNames('border-l-2 pl-2.5', warrant.status === 'active' ? 'border-rose-400/60' : warrant.status === 'dismissed' ? 'border-mint-400/40' : 'border-amber-400/40')}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[10px] text-fog-200">{warrant.targetName}</div>
                <div className="micro mt-0.5">DAY {warrant.issuedDay} · {warrant.severity.toUpperCase()}</div>
              </div>
              <Badge tone={warrant.status === 'active' ? 'bad' : warrant.status === 'dismissed' ? 'good' : 'warn'}>{warrant.status.toUpperCase()}</Badge>
            </div>
            <p className="mt-1 text-[9px] leading-relaxed text-fog-500">{warrant.reason}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-danger mt-3 w-full py-2 text-[9px]"
        disabled={!playerWarrant}
        onClick={() => runAction((current) => dismissWarrant(current))}
      >
        <Gavel size={11} /> {playerWarrant ? 'Dismiss your warrant' : 'No warrant on you'}
      </button>
      <p className="mt-2 text-[8px] leading-relaxed text-fog-500">Dismissal requires a retained Director Reed or $500K legal fund. Costs 8 influence.</p>
    </Panel>
  )
}

function BudgetPanel() {
  const { state } = useGame()
  const government = state.government
  const budget = government.budget
  const taxRevenue = state.corporations.reduce((sum, corp) => sum + corp.revenue, 0) * (government.taxRate / 100)
  const captured = government.officials.filter((official) => official.bribed).length
  const clean = government.officials.length - captured

  return (
    <Panel eyebrow="PUBLIC LEDGER" title="City budget" action={<Badge tone={budget > 0 ? 'good' : 'bad'}>{budget > 0 ? 'SOLVENT' : 'DEFICIT'}</Badge>}>
      <div className="stat-value text-[24px] font-semibold text-fog-100">{money(budget, true)}</div>
      <div className="micro mt-1">Treasury balance · fiscal year {Math.max(1, Math.floor(state.day / 90))}</div>
      <Progress value={Math.min(100, (budget / 100_000_000_000) * 100)} hue={budget > 0 ? 174 : 350} className="mt-2" height={5} glow={budget < 0} />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Tax revenue / day</div><div className="mono mt-1 text-[11px] text-mint-300">{money(taxRevenue, true)}</div></div>
        <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Stimulus</div><div className="mono mt-1 text-[11px] text-amber-300">{money(government.stimulus, true)}</div></div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-ink-600/30 pt-3">
        <span className="label">Balance of power</span>
        <span className="mono text-[9px] text-fog-500">{captured} CAPTURED · {clean} CLEAN</span>
      </div>
      <div className="mt-2 flex items-center gap-4">
        <Donut
          segments={[
            { label: 'Captured', value: Math.max(0.01, captured), hue: 174 },
            { label: 'Clean', value: Math.max(0.01, clean), hue: 350 },
          ]}
          size={104}
          thickness={11}
          centerValue={`${Math.round((captured / Math.max(1, captured + clean)) * 100)}%`}
          centerLabel="CAPTURE"
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Approval</span><span className="mono text-fog-200">{government.approval.toFixed(1)}%</span></div>
          <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Regulation</span><span className="mono text-fog-200">{government.regulation.toFixed(0)}</span></div>
          <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Tax rate</span><span className="mono text-fog-200">{government.taxRate.toFixed(1)}%</span></div>
          <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Officials owned</span><span className="mono text-mint-300">{captured}</span></div>
        </div>
      </div>
    </Panel>
  )
}

function CouncilWatch() {
  const { state } = useGame()
  const approval = state.government.approval
  const regulation = state.government.regulation
  const signals = [
    { label: 'Public approval', value: `${approval.toFixed(1)}%`, tone: approval >= 55 ? 'good' : approval >= 40 ? 'warn' : 'bad' },
    { label: 'Regulatory pressure', value: `${regulation.toFixed(0)} / 100`, tone: regulation <= 45 ? 'good' : regulation <= 65 ? 'warn' : 'bad' },
    { label: 'Tax burden', value: `${state.government.taxRate.toFixed(1)}%`, tone: state.government.taxRate <= 20 ? 'good' : state.government.taxRate <= 27 ? 'warn' : 'bad' },
    { label: 'Council mood', value: approval > 50 ? 'COOPERATIVE' : 'HOSTILE', tone: approval > 50 ? 'good' : 'bad' },
  ] as const

  return (
    <Panel eyebrow="EARLY WARNING" title="Council watch">
      <div className="space-y-2">
        {signals.map((signal) => (
          <div key={signal.label} className="flex items-center justify-between border-b border-ink-600/25 py-1.5 last:border-0">
            <span className="text-[10px] text-fog-500">{signal.label}</span>
            <span className={classNames('mono text-[9px]', signal.tone === 'good' ? 'text-mint-300' : signal.tone === 'warn' ? 'text-amber-300' : 'text-rose-300')}>{signal.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-start gap-2 border border-violet-400/20 bg-violet-400/5 p-2.5">
        <Scale size={12} className="mt-0.5 shrink-0 text-violet-300" />
        <p className="text-[9px] leading-relaxed text-violet-200/70">Capture is not control. Every official you own is a liability the moment the public starts counting.</p>
      </div>
    </Panel>
  )
}

export function GovernmentPage() {
  const { state } = useGame()
  const government = state.government
  const activeWarrants = government.warrants.filter((warrant) => warrant.status === 'active').length
  const captured = government.officials.filter((official) => official.bribed).length

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="TAXATION · REGULATION · POLITICAL CAPTURE"
        title="Government"
        description="The city writes the rules, then sells the exceptions. Lobby the council, compromise the officials, and make the law work for your balance sheet."
        action={<Badge tone={captured >= 3 ? 'bad' : captured > 0 ? 'warn' : 'info'} pulse>{captured} OFFICIAL{captured === 1 ? '' : 'S'} CAPTURED</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Public approval" value={`${government.approval.toFixed(1)}%`} sub="Council and citizen confidence" icon={<Vote size={15} />} hue={approvalTone(government.approval) === 'bad' ? 350 : approvalTone(government.approval) === 'warn' ? 42 : 174} spark={series(government.approval, 1, 5)} />
        <StatCard label="Regulation index" value={`${government.regulation.toFixed(0)}`} sub={`${government.regulations.filter((item) => item.active).length} statutes in force`} icon={<Scale size={15} />} hue={government.regulation > 65 ? 350 : 42} spark={series(government.regulation, 2, 5)} />
        <StatCard label="Transaction tax" value={`${government.taxRate.toFixed(1)}%`} sub="Applied to taxable market activity" icon={<Percent size={15} />} hue={286} spark={series(government.taxRate * 4, 3, 6)} />
        <StatCard label="Treasury" value={money(government.budget, true)} sub={`${activeWarrants} active warrant${activeWarrants === 1 ? '' : 's'} on the docket`} icon={<Building2 size={15} />} hue={government.budget > 0 ? 174 : 350} spark={series(Math.min(100, government.budget / 1_000_000_000), 4, 4)} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-4 xl:col-span-8">
          <PolicyPulse />
          <OfficialsGrid />
          <RegulationsPanel />
        </div>
        <div className="col-span-12 space-y-4 xl:col-span-4">
          <InfluenceOperations />
          <WarrantsPanel />
          <BudgetPanel />
          <CouncilWatch />
        </div>
      </div>
    </div>
  )
}
