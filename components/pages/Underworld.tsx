'use client'

import { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Banknote,
  Briefcase,
  CircleDollarSign,
  Crosshair,
  Eye,
  Flame,
  Gauge as GaugeIcon,
  HandCoins,
  Landmark,
  Package,
  ShieldAlert,
  Skull,
  Truck,
  Users,
  Vault,
  Wallet,
  Zap,
} from 'lucide-react'
import { useGame } from '../GameProvider'
import {
  AreaChart,
  Avatar,
  Badge,
  Gauge,
  KV,
  Panel,
  Progress,
  SectionHeading,
  Sparkline,
  StatCard,
} from '../ui'
import { classNames, money } from '@/lib/format'
import { heatLabel } from '@/lib/economy'
import {
  bribeOfficial,
  cyberHeist,
  dismissWarrant,
  launder,
  payLegal,
  racketeer,
  smuggle,
} from '@/lib/actions'

function series(base: number, seed: number, amplitude = 8, points = 36): number[] {
  return Array.from({ length: points }, (_, index) => {
    const wave = Math.sin(index * 0.48 + seed) * amplitude + Math.sin(index * 0.17 + seed * 2) * amplitude * 0.55
    const drift = (index - points) * 0.12
    return Math.max(0, Math.min(100, base + wave + drift))
  })
}

function heatTone(heat: number): 'good' | 'warn' | 'bad' {
  if (heat >= 70) return 'bad'
  if (heat >= 40) return 'warn'
  return 'good'
}

function HeatCommand() {
  const { state } = useGame()
  const heat = state.player.heat
  const meta = heatLabel(heat)
  const seizure = Math.min(28, 5 + heat / 5)
  const police = Math.min(100, heat * 0.82 + state.districts.reduce((sum, district) => sum + district.police, 0) / Math.max(1, state.districts.length) * 0.18)
  const forensics = Math.min(100, heat * 0.64 + state.government.regulation * 0.3)
  const informants = Math.min(100, heat * 0.48 + state.government.officials.filter((official) => !official.bribed).length * 6)
  const history = series(heat, 3, 7)

  return (
    <Panel
      eyebrow="EXPOSURE · FORENSICS · POLICE ATTENTION"
      title="Heat signature"
      action={<Badge tone={meta.tone} pulse={heat >= 40}>{meta.label}</Badge>}
    >
      <div className="grid gap-4 lg:grid-cols-[190px_1fr]">
        <div className="flex flex-col items-center justify-center border border-ink-600/35 bg-ink-900/40 p-3">
          <Gauge value={heat} label="Heat index" hue={heatTone(heat) === 'bad' ? 350 : heatTone(heat) === 'warn' ? 42 : 174} size={150} sub={`${Math.round(heat)} / 100`} />
          <div className="mt-2 w-full">
            <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Seizure risk</span><span className="mono text-rose-300">{seizure.toFixed(1)}%</span></div>
            <Progress value={seizure * 3.5} hue={350} className="mt-1.5" height={4} glow={seizure > 18} />
          </div>
        </div>

        <div>
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-ink-600/30 bg-ink-900/40 p-2.5">
              <div className="micro">Police attention</div>
              <div className="stat-value mt-1 text-[14px] text-fog-100">{police.toFixed(0)}</div>
            </div>
            <div className="border border-ink-600/30 bg-ink-900/40 p-2.5">
              <div className="micro">Forensic trail</div>
              <div className="stat-value mt-1 text-[14px] text-fog-100">{forensics.toFixed(0)}</div>
            </div>
            <div className="border border-ink-600/30 bg-ink-900/40 p-2.5">
              <div className="micro">Informant pressure</div>
              <div className="stat-value mt-1 text-[14px] text-fog-100">{informants.toFixed(0)}</div>
            </div>
          </div>
          <div className="mt-3 h-[132px]">
            <AreaChart data={history} hue={heatTone(heat) === 'bad' ? 350 : 42} height={132} valueFormatter={(value) => `${value.toFixed(0)} heat`} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-ink-600/30 pt-2">
            <KV label="Dirty cash" value={money(state.player.dirtyCash, true)} />
            <KV label="Legal fund" value={money(state.player.legalFund, true)} />
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-fog-500">
            Heat above 70 invites raids, freezes and warrants. Bribes and legal defense are the only reliable ways down.
          </p>
        </div>
      </div>
    </Panel>
  )
}

function LaunderTerminal() {
  const { state, runAction } = useGame()
  const [amount, setAmount] = useState('250000')
  const numeric = Math.max(0, Number(amount) || 0)
  const fee = 0.155
  const expected = numeric * (1 - fee)
  const seizure = Math.min(28, 5 + state.player.heat / 5)

  return (
    <Panel eyebrow="CLEANING · PRIVACY RAILS · SHELLS" title="Laundering terminal" action={<Badge tone="warn">OFF-BOOK</Badge>}>
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <div>
          <label className="block">
            <span className="label mb-1.5 block">Amount to clean</span>
            <input className="input text-[13px]" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
          </label>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {['100000', '250000', '500000'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(value)}
                className="border border-ink-600/35 py-1 font-mono text-[8px] tracking-wider text-fog-500 hover:border-mint-400/40 hover:text-mint-300"
              >
                {Number(value) / 1000}K
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(String(Math.floor(state.player.dirtyCash)))}
              className="border border-ink-600/35 py-1 font-mono text-[8px] tracking-wider text-fog-500 hover:border-mint-400/40 hover:text-mint-300"
            >
              ALL
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div><div className="micro">Expected clean</div><div className="mono mt-1 text-[11px] text-mint-300">{money(expected, true)}</div></div>
            <div><div className="micro">Routing fee</div><div className="mono mt-1 text-[11px] text-fog-200">~{(fee * 100).toFixed(1)}%</div></div>
            <div><div className="micro">Seizure risk</div><div className={classNames('mono mt-1 text-[11px]', seizure > 18 ? 'text-rose-300' : 'text-amber-300')}>{seizure.toFixed(1)}%</div></div>
          </div>

          <button
            type="button"
            className="btn btn-primary mt-3 w-full py-2.5 text-[9px]"
            onClick={() => runAction((current) => launder(current, numeric))}
          >
            <Vault size={12} /> Route funds through shells
          </button>
        </div>

        <div className="border border-ink-600/35 bg-ink-900/40 p-3">
          <div className="flex items-center gap-2">
            <Wallet size={13} className="text-amber-300" />
            <span className="label">Dirty balance</span>
          </div>
          <div className="stat-value mt-2 text-[20px] font-semibold text-amber-300">{money(state.player.dirtyCash, true)}</div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Shell companies</span><span className="mono text-fog-300">{2 + state.player.level}</span></div>
            <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Privacy rails</span><span className="mono text-fog-300">MIXER-07</span></div>
            <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Cash reserve</span><span className="mono text-mint-300">{money(state.player.cash, true)}</span></div>
          </div>
          <div className="mt-3 border-t border-ink-600/30 pt-2">
            <div className="flex items-start gap-2">
              <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-300" />
              <p className="text-[8px] leading-relaxed text-amber-200/60">Each run raises heat slightly. A seizure burns the entire transfer.</p>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function CrimeOperations() {
  const { state, runAction } = useGame()
  const targets = state.banks.filter((bank) => !bank.playerOwned && bank.status !== 'collapsed')
  const [targetId, setTargetId] = useState(targets[0]?.id ?? '')
  const target = state.banks.find((bank) => bank.id === targetId) ?? targets[0]

  return (
    <Panel eyebrow="SMUGGLING · RACKETS · CYBER" title="Active operations" action={<Badge tone="bad">{state.syndicates.find((item) => item.playerOwned)?.operations ?? 0} RUNS</Badge>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-ink-600/35 bg-ink-900/35 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2"><Truck size={14} className="text-amber-300" /><span className="text-[11px] font-medium text-fog-200">Dockside smuggling</span></div>
            <span className="chip chip-amber">50K DIRTY</span>
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-fog-500">Move cargo through the port. Clean profit, but customs are watching every manifest.</p>
          <div className="mt-2 flex items-center justify-between text-[9px]"><span className="text-fog-500">Payout range</span><span className="mono text-mint-300">$90K – $220K</span></div>
          <button type="button" className="btn mt-2 w-full py-2 text-[9px]" onClick={() => runAction((current) => smuggle(current))}>
            <Package size={11} /> Launch run
          </button>
        </div>

        <div className="border border-ink-600/35 bg-ink-900/35 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2"><Briefcase size={14} className="text-rose-300" /><span className="text-[11px] font-medium text-fog-200">Protection racket</span></div>
            <span className="chip chip-rose">8 INFLUENCE</span>
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-fog-500">Collect from storefronts in the Narrows. Reliable income, visible heat.</p>
          <div className="mt-2 flex items-center justify-between text-[9px]"><span className="text-fog-500">Payout range</span><span className="mono text-mint-300">$28K – $66K</span></div>
          <button type="button" className="btn mt-2 w-full py-2 text-[9px]" onClick={() => runAction((current) => racketeer(current))}>
            <HandCoins size={11} /> Collect tribute
          </button>
        </div>
      </div>

      <div className="mt-3 border border-ink-600/35 bg-ink-900/35 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2"><Crosshair size={14} className="text-violet-300" /><span className="text-[11px] font-medium text-fog-200">Cyber heist</span></div>
          <span className="chip chip-violet">150K DIRTY</span>
        </div>
        <p className="mt-2 text-[9px] leading-relaxed text-fog-500">Breach a rival bank&apos;s settlement layer. A successful run moves reserves into dirty cash; a failed one leaves a forensic signature.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
          <select className="input py-2 text-[10px]" value={target?.id ?? ''} onChange={(event) => setTargetId(event.target.value)}>
            {targets.length === 0 && <option value="">No viable targets</option>}
            {targets.map((bank) => (
              <option key={bank.id} value={bank.id}>{bank.name} · {money(bank.reserves, true)} reserves</option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-danger py-2 text-[9px]"
            disabled={!target}
            onClick={() => target && runAction((current) => cyberHeist(current, target.id))}
          >
            <Skull size={11} /> Breach
          </button>
        </div>
        {target && (
          <div className="mt-2 flex items-center justify-between text-[9px]">
            <span className="text-fog-500">Estimated loot</span>
            <span className="mono text-mint-300">{money(target.reserves * 0.04, true)}</span>
          </div>
        )}
      </div>
    </Panel>
  )
}

function SyndicateBoard() {
  const { state } = useGame()
  const sorted = [...state.syndicates].sort((a, b) => b.influence - a.influence)
  const maxInfluence = Math.max(1, ...sorted.map((item) => item.influence))

  return (
    <Panel eyebrow="CRIMINAL MARKET · INFLUENCE RANK" title="Syndicate board" dense>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse">
          <thead>
            <tr className="border-b border-ink-600/35 text-left">
              <th className="label py-2 font-normal">#</th>
              <th className="label py-2 font-normal">Syndicate</th>
              <th className="label py-2 font-normal">Specialty</th>
              <th className="label py-2 text-right font-normal">Influence</th>
              <th className="label py-2 text-right font-normal">Heat</th>
              <th className="label py-2 text-right font-normal">Ops</th>
              <th className="label py-2 pl-3 text-right font-normal">Cash</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((syndicate, index) => (
              <tr key={syndicate.id} className={classNames('border-b border-ink-600/20 last:border-0', syndicate.playerOwned ? 'bg-mint-400/6' : 'hover:bg-ink-800/30')}>
                <td className="py-2.5 font-mono text-[10px] text-fog-500">{String(index + 1).padStart(2, '0')}</td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <Avatar name={syndicate.name} hue={syndicate.hue} size={26} />
                    <div>
                      <div className="text-[10px] font-medium text-fog-200">{syndicate.name}{syndicate.playerOwned && <span className="ml-1 text-[8px] text-mint-400">YOURS</span>}</div>
                      <div className="micro">{syndicate.leader}</div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 text-[9px] text-fog-400">{syndicate.specialty}</td>
                <td className="py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-14"><Progress value={(syndicate.influence / maxInfluence) * 100} hue={syndicate.hue} height={3} /></div>
                    <span className="mono w-6 text-[9px] text-fog-300">{Math.round(syndicate.influence)}</span>
                  </div>
                </td>
                <td className={classNames('py-2.5 text-right font-mono text-[9px]', syndicate.heat > 65 ? 'text-rose-300' : syndicate.heat > 40 ? 'text-amber-300' : 'text-mint-300')}>{Math.round(syndicate.heat)}</td>
                <td className="py-2.5 text-right font-mono text-[9px] text-fog-400">{syndicate.operations}</td>
                <td className="py-2.5 pl-3 text-right font-mono text-[9px] text-fog-300">{money(syndicate.cash, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function BriberyNetwork() {
  const { state, runAction } = useGame()
  const officials = [...state.government.officials].sort((a, b) => a.bribePrice - b.bribePrice)

  return (
    <Panel eyebrow="CITY HALL · PAYROLL" title="Bribery network" action={<Badge tone="warn">{officials.filter((official) => official.bribed).length}/{officials.length} OWNED</Badge>}>
      <div className="space-y-2">
        {officials.map((official) => (
          <div key={official.id} className="border border-ink-600/30 bg-ink-900/40 p-2.5">
            <div className="flex items-center gap-2">
              <Avatar name={official.name} hue={official.bribed ? 174 : 42} size={26} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[10px] text-fog-200">{official.name}</div>
                <div className="micro truncate">{official.role}</div>
              </div>
              <Badge tone={official.bribed ? 'good' : 'info'}>{official.bribed ? 'OWNED' : 'CLEAN'}</Badge>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="micro">Loyalty</span>
                <div className="w-14"><Progress value={official.loyalty} hue={official.bribed ? 174 : 42} height={3} /></div>
                <span className="mono text-[8px] text-fog-400">{official.loyalty}</span>
              </div>
              {official.bribed ? (
                <span className="font-mono text-[8px] tracking-wider text-mint-400">RETAINER ACTIVE</span>
              ) : (
                <button
                  type="button"
                  className="btn px-2 py-1 text-[8px]"
                  onClick={() => runAction((current) => bribeOfficial(current, official.id))}
                >
                  Bribe · {money(official.bribePrice, true)}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[9px] leading-relaxed text-fog-500">A retained official lowers heat immediately and gives you leverage when a warrant lands.</p>
    </Panel>
  )
}

function LegalPanel() {
  const { state, runAction } = useGame()
  const [amount, setAmount] = useState('500000')
  const numeric = Math.max(0, Number(amount) || 0)
  const playerWarrants = state.government.warrants.filter((warrant) => warrant.targetId === 'player' && warrant.status === 'active')
  const allActive = state.government.warrants.filter((warrant) => warrant.status === 'active')

  return (
    <Panel eyebrow="DEFENSE · WARRANTS · LEVERAGE" title="Legal apparatus" action={<Badge tone={playerWarrants.length ? 'bad' : 'good'}>{playerWarrants.length} ON YOU</Badge>}>
      <div className="grid grid-cols-2 gap-2">
        <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Legal fund</div><div className="stat-value mt-1 text-[14px] text-fog-100">{money(state.player.legalFund, true)}</div></div>
        <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Active warrants</div><div className="stat-value mt-1 text-[14px] text-fog-100">{allActive.length}</div></div>
      </div>

      <label className="mt-3 block">
        <span className="label mb-1.5 block">Fund defense counsel</span>
        <input className="input py-2 text-[11px]" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
      </label>
      <button type="button" className="btn mt-2 w-full py-2 text-[9px]" onClick={() => runAction((current) => payLegal(current, numeric))}>
        <Landmark size={11} /> Move to legal fund
      </button>

      <div className="mt-3 space-y-2 border-t border-ink-600/30 pt-3">
        {allActive.length === 0 && <div className="border border-dashed border-ink-600/40 p-3 text-center text-[9px] text-fog-500">No active warrants on the grid.</div>}
        {allActive.slice(0, 4).map((warrant) => (
          <div key={warrant.id} className="border-l border-rose-400/35 pl-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-fog-200">{warrant.targetName}</span>
              <Badge tone={warrant.severity === 'high' ? 'bad' : 'warn'}>{warrant.severity.toUpperCase()}</Badge>
            </div>
            <div className="mt-0.5 text-[9px] leading-relaxed text-fog-500">{warrant.reason}</div>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-danger mt-3 w-full py-2 text-[9px]" onClick={() => runAction((current) => dismissWarrant(current))}>
        <ShieldAlert size={11} /> Dismiss your warrant
      </button>
      <p className="mt-2 text-[8px] leading-relaxed text-fog-500">Requires a retained Director Reed or $500K in the legal fund. Dismissal costs 8 influence.</p>
    </Panel>
  )
}

function OperationsLog() {
  const { state } = useGame()
  const entries = state.log.filter((line) => /launder|smuggl|racket|heist|warrant|bribe|retain|heat|intrusion|rug|legal/i.test(line)).slice(0, 9)

  return (
    <Panel eyebrow="BLACK LEDGER" title="Operations log" action={<Badge tone="info">LIVE</Badge>}>
      <div className="space-y-2">
        {entries.length === 0 && <div className="border border-dashed border-ink-600/40 p-3 text-center text-[9px] text-fog-500">No covert activity logged yet.</div>}
        {entries.map((line, index) => (
          <div key={index} className="flex items-start gap-2 border-b border-ink-600/20 pb-2 last:border-0 last:pb-0">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-rose-400/70" />
            <span className="font-mono text-[8px] leading-relaxed text-fog-500">{line}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-ink-600/30 pt-2">
        <span className="micro">Syndicate cash</span>
        <span className="mono text-[10px] text-amber-300">{money(state.syndicates.find((item) => item.playerOwned)?.cash ?? 0, true)}</span>
      </div>
    </Panel>
  )
}

function HeatPlaybook() {
  const { state } = useGame()
  const steps = [
    { title: 'Clean the cash', detail: 'Launder dirty balances before heat compounds.', done: state.player.dirtyCash < 100_000 },
    { title: 'Buy silence', detail: 'Retain an official to blunt investigations.', done: state.government.officials.some((official) => official.bribed) },
    { title: 'Build the fund', detail: 'Keep $500K ready for emergency defense.', done: state.player.legalFund >= 500_000 },
    { title: 'Stay under 50', detail: 'Heat below 50 avoids sustained police attention.', done: state.player.heat < 50 },
  ]

  return (
    <Panel eyebrow="FIELD MANUAL" title="Survival checklist">
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.title} className="flex items-start gap-2 border border-ink-600/30 bg-ink-900/35 p-2.5">
            <span className={classNames('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border font-mono text-[8px]', step.done ? 'border-mint-400/40 text-mint-300' : 'border-ink-600/50 text-fog-600')}>
              {step.done ? '✓' : '·'}
            </span>
            <div>
              <div className="text-[10px] text-fog-200">{step.title}</div>
              <div className="micro mt-0.5 normal-case tracking-normal">{step.detail}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-start gap-2 border border-rose-400/20 bg-rose-400/5 p-2.5">
        <Eye size={12} className="mt-0.5 shrink-0 text-rose-300" />
        <p className="text-[9px] leading-relaxed text-rose-200/70">The city does not forget. Every operation leaves a trace that the Financial Crimes Unit can read.</p>
      </div>
    </Panel>
  )
}

export function UnderworldPage() {
  const { state } = useGame()
  const heat = state.player.heat
  const meta = heatLabel(heat)
  const playerSyndicate = state.syndicates.find((item) => item.playerOwned)
  const activeWarrants = state.government.warrants.filter((warrant) => warrant.status === 'active').length

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="HEAT · LAUNDERING · SYNDICATE POWER"
        title="The Underworld"
        description="Dirty capital is leverage with a timer. Move it, hide it, and buy the silence that keeps the city looking the other way."
        action={<Badge tone={meta.tone} pulse>{meta.label} · HEAT {Math.round(heat)}</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Dirty cash" value={money(state.player.dirtyCash, true)} sub="Off-book · untaxed · traceable" icon={<Wallet size={15} />} hue={42} spark={series(heat, 1, 6)} />
        <StatCard label="Heat index" value={`${Math.round(heat)}`} sub={`${meta.label} · seizure risk ${Math.min(28, 5 + heat / 5).toFixed(1)}%`} icon={<Flame size={15} />} hue={heat >= 50 ? 350 : 42} spark={series(heat, 2, 9)} />
        <StatCard label="Syndicate influence" value={`${Math.round(playerSyndicate?.influence ?? state.player.influence)}`} sub={`${playerSyndicate?.operations ?? 0} operations on the board`} icon={<Skull size={15} />} hue={286} spark={series(playerSyndicate?.influence ?? 40, 3, 6)} />
        <StatCard label="Active warrants" value={`${activeWarrants}`} sub={`${state.government.officials.filter((official) => official.bribed).length} officials compromised`} icon={<GaugeIcon size={15} />} hue={activeWarrants ? 350 : 174} spark={series(activeWarrants * 20 + 20, 4, 5)} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-4 xl:col-span-8">
          <HeatCommand />
          <LaunderTerminal />
          <CrimeOperations />
          <SyndicateBoard />
        </div>
        <div className="col-span-12 space-y-4 xl:col-span-4">
          <LegalPanel />
          <BriberyNetwork />
          <HeatPlaybook />
          <OperationsLog />
        </div>
      </div>
    </div>
  )
}
