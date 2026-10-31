'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Building2,
  ChevronRight,
  Landmark,
  LockKeyhole,
  Percent,
  Shield,
  ShieldAlert,
  TrendingDown,
  Wallet,
} from 'lucide-react'
import { useGame } from '../GameProvider'
import { AreaChart, Badge, Delta, KV, Panel, Progress, SectionHeading, StatCard, Tabs } from '../ui'
import { classNames, money, num, pct } from '@/lib/format'
import { bankRisk, leverage } from '@/lib/economy'
import { deposit, foundBank, injectReserves, repayLoan, setBankRate, takeLoan, triggerBankRun, withdraw } from '@/lib/actions'

function riskTone(status: string) {
  if (status === 'collapsed') return 'bad' as const
  if (status === 'critical') return 'bad' as const
  if (status === 'watch') return 'warn' as const
  return 'good' as const
}

function BankTable({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const { state } = useGame()
  return (
    <Panel className="overflow-hidden" eyebrow="SYSTEMIC INSTITUTIONS" title="Bank balance sheets" dense>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="border-b border-ink-600/35 text-left">
              <th className="label py-2 font-normal">Institution</th>
              <th className="label py-2 text-right font-normal">Reserves</th>
              <th className="label py-2 text-right font-normal">Deposits</th>
              <th className="label py-2 text-right font-normal">Loans</th>
              <th className="label py-2 text-right font-normal">Rate</th>
              <th className="label py-2 text-right font-normal">Leverage</th>
              <th className="label py-2 pl-3 text-right font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {state.banks.map((bank) => {
              const active = bank.id === selectedId
              const lev = leverage(bank)
              return (
                <tr key={bank.id} onClick={() => onSelect(bank.id)} className={classNames('cursor-pointer border-b border-ink-600/20 last:border-0', active ? 'bg-mint-400/6' : 'hover:bg-ink-800/30')}>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center border" style={{ borderColor: `hsla(${bank.hue}, 70%, 60%, 0.3)`, background: `hsla(${bank.hue}, 70%, 50%, 0.07)` }}>
                        <Landmark size={13} style={{ color: `hsl(${bank.hue}, 78%, 68%)` }} />
                      </span>
                      <div>
                        <div className="text-[10px] font-medium text-fog-200">{bank.name}{bank.playerOwned && <span className="ml-1 text-[8px] text-mint-400">YOURS</span>}</div>
                        <div className="micro">{bank.ownerName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-fog-300">{money(bank.reserves, true)}</td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-fog-400">{money(bank.deposits, true)}</td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-fog-400">{money(bank.loans, true)}</td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-fog-300">{bank.rate.toFixed(1)}%</td>
                  <td className={classNames('py-2.5 text-right font-mono text-[10px]', lev > 9 ? 'text-rose-300' : lev > 6 ? 'text-amber-300' : 'text-mint-300')}>{lev.toFixed(1)}x</td>
                  <td className="py-2.5 pl-3 text-right"><Badge tone={riskTone(bank.status)}>{bank.status.toUpperCase()}</Badge></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function BankDetail({ bankId }: { bankId: string }) {
  const { state, runAction } = useGame()
  const [amount, setAmount] = useState('250000')
  const [tab, setTab] = useState<'deposit' | 'credit'>('deposit')
  const bank = state.banks.find((item) => item.id === bankId) ?? state.banks[0]
  const numericAmount = Math.max(0, Number(amount) || 0)
  const depositBalance = state.player.deposits[bank.id] ?? 0
  const debt = state.player.debts[bank.id] ?? 0
  const lev = leverage(bank)
  const risk = bankRisk(bank)
  const interest = depositBalance * (bank.rate / 100)

  return (
    <Panel
      eyebrow={`${bank.ownerName.toUpperCase()} · ${bank.playerOwned ? 'PLAYER CONTROLLED' : 'THIRD PARTY'}`}
      title={bank.name}
      action={<Badge tone={riskTone(bank.status)} pulse={bank.status !== 'stable'}>{bank.status.toUpperCase()}</Badge>}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="micro">Loan-to-reserve leverage</div>
              <div className={classNames('stat-value mt-0.5 text-[30px] font-semibold', lev > 9 ? 'text-rose-300' : lev > 6 ? 'text-amber-300' : 'text-mint-300')}>{lev.toFixed(2)}x</div>
            </div>
            <div className="text-right">
              <div className="micro">Run risk</div>
              <div className="stat-value mt-0.5 text-[14px] text-fog-200">{risk.toFixed(0)} / 100</div>
            </div>
          </div>
          <div className="mt-3 h-[170px]">
            <AreaChart data={bank.history} hue={lev > 9 ? 350 : lev > 6 ? 42 : 174} height={170} valueFormatter={(value) => `${value.toFixed(1)}x`} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-ink-600/30 pt-3 sm:grid-cols-4">
            <KV label="Reserves" value={money(bank.reserves, true)} />
            <KV label="Deposits" value={money(bank.deposits, true)} />
            <KV label="Loans" value={money(bank.loans, true)} />
            <KV label="Rate" value={`${bank.rate.toFixed(1)}%`} />
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px]"><span className="text-fog-500">Capital adequacy</span><span className="mono text-fog-300">{Math.min(100, (bank.reserves / Math.max(1, bank.deposits)) * 100).toFixed(1)}%</span></div>
            <Progress value={Math.min(100, (bank.reserves / Math.max(1, bank.deposits)) * 100)} hue={lev > 9 ? 350 : 174} className="mt-1.5" height={5} />
          </div>
        </div>

        <div className="border border-ink-600/35 bg-ink-900/45 p-3">
          <Tabs
            tabs={[{ id: 'deposit', label: 'Deposit' }, { id: 'credit', label: 'Credit' }]}
            active={tab}
            onChange={(id) => setTab(id as typeof tab)}
          />
          <div className="mt-3">
            <div className="label mb-1.5">Amount</div>
            <input className="input text-[12px]" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
            <div className="mt-2 grid grid-cols-3 gap-1">
              {['100000', '500000', '1000000'].map((value) => (
                <button key={value} type="button" onClick={() => setAmount(value)} className="border border-ink-600/35 py-1 font-mono text-[8px] tracking-wider text-fog-500 hover:border-mint-400/40 hover:text-mint-300">{Number(value) / 1000}K</button>
              ))}
            </div>
          </div>

          {tab === 'deposit' ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-[10px]"><span className="text-fog-500">Your deposit</span><span className="mono text-fog-200">{money(depositBalance, true)}</span></div>
              <div className="flex items-center justify-between text-[10px]"><span className="text-fog-500">Annual interest</span><span className="mono text-mint-300">{money(interest, true)}</span></div>
              <div className="flex gap-1.5">
                <button type="button" className="btn btn-primary flex-1 py-2 text-[9px]" onClick={() => runAction((current) => deposit(current, bank.id, numericAmount))}><ArrowDownToLine size={11} /> Deposit</button>
                <button type="button" className="btn flex-1 py-2 text-[9px]" onClick={() => runAction((current) => withdraw(current, bank.id, numericAmount))}><ArrowUpFromLine size={11} /> Withdraw</button>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-[10px]"><span className="text-fog-500">Outstanding debt</span><span className="mono text-rose-300">{money(debt, true)}</span></div>
              <div className="flex items-center justify-between text-[10px]"><span className="text-fog-500">Max facility</span><span className="mono text-fog-300">{money(Math.min(bank.reserves * 0.45, 25_000_000), true)}</span></div>
              <div className="flex gap-1.5">
                <button type="button" className="btn btn-primary flex-1 py-2 text-[9px]" onClick={() => runAction((current) => takeLoan(current, bank.id, numericAmount))}><Banknote size={11} /> Borrow</button>
                <button type="button" className="btn flex-1 py-2 text-[9px]" onClick={() => runAction((current) => repayLoan(current, bank.id, numericAmount))}><Wallet size={11} /> Repay</button>
              </div>
            </div>
          )}

          {!bank.playerOwned && bank.status !== 'collapsed' && (
            <button type="button" className="btn btn-danger mt-3 w-full py-2 text-[9px]" onClick={() => runAction((current) => triggerBankRun(current, bank.id))}>
              <ShieldAlert size={11} /> Seed a bank run
            </button>
          )}
          {bank.status === 'collapsed' && (
            <div className="mt-3 flex items-start gap-2 border border-rose-400/25 bg-rose-400/5 p-2.5">
              <LockKeyhole size={13} className="mt-0.5 shrink-0 text-rose-300" />
              <p className="text-[9px] leading-relaxed text-rose-200/70">Receivership active. Deposits are frozen. Withdrawals are unavailable.</p>
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}

function PlayerBankPanel() {
  const { state, runAction } = useGame()
  const bank = state.banks.find((item) => item.playerOwned)
  const [name, setName] = useState('Nihann Depository')
  const [rate, setRate] = useState(String(bank?.rate ?? 6.2))
  const [injection, setInjection] = useState('250000')

  if (!bank) {
    return (
      <Panel eyebrow="CHARTER APPLICATION" title="Found your own bank">
        <p className="text-[11px] leading-relaxed text-fog-500">
          A banking license costs $1.5M. You set the deposit rate, underwrite the loan book, and absorb the consequences when depositors lose confidence.
        </p>
        <label className="mt-4 block">
          <span className="label mb-1.5 block">Institution name</span>
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} maxLength={32} />
        </label>
        <div className="mt-3 flex items-center justify-between border border-ink-600/35 bg-ink-900/45 p-2.5 text-[10px]">
          <span className="text-fog-500">Charter capital</span>
          <span className="mono text-fog-100">$1,500,000</span>
        </div>
        <button type="button" className="btn btn-primary mt-3 w-full py-2.5" onClick={() => runAction((current) => foundBank(current, name))}>
          <Building2 size={12} /> Apply for charter
        </button>
        <div className="mt-3 flex items-start gap-2 border border-amber-400/20 bg-amber-400/5 p-2.5">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="text-[9px] leading-relaxed text-amber-200/70">Fractional reserve banking is legal here. Over-leverage and a coordinated run will still destroy you.</p>
        </div>
      </Panel>
    )
  }

  const risk = bankRisk(bank)
  const lev = leverage(bank)
  return (
    <Panel eyebrow="YOUR CHARTER" title={bank.name} action={<Badge tone={riskTone(bank.status)}>{bank.status.toUpperCase()}</Badge>}>
      <div className="grid grid-cols-2 gap-2">
        <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Reserves</div><div className="stat-value mt-1 text-[14px] text-fog-100">{money(bank.reserves, true)}</div></div>
        <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Deposits</div><div className="stat-value mt-1 text-[14px] text-fog-100">{money(bank.deposits, true)}</div></div>
        <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Leverage</div><div className={classNames('stat-value mt-1 text-[14px]', lev > 9 ? 'text-rose-300' : lev > 6 ? 'text-amber-300' : 'text-mint-300')}>{lev.toFixed(2)}x</div></div>
        <div className="border border-ink-600/30 bg-ink-900/40 p-2.5"><div className="micro">Run risk</div><div className="stat-value mt-1 text-[14px] text-fog-100">{risk.toFixed(0)}</div></div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between"><span className="label">Deposit rate</span><span className="mono text-[11px] text-mint-300">{Number(rate).toFixed(1)}%</span></div>
        <input type="range" min="1" max="18" step="0.1" value={rate} onChange={(event) => setRate(event.target.value)} className="mt-2 w-full accent-mint-400" />
        <div className="mt-1 flex justify-between font-mono text-[8px] text-fog-600"><span>1%</span><span>18%</span></div>
        <button type="button" className="btn mt-2 w-full py-1.5 text-[9px]" onClick={() => runAction((current) => setBankRate(current, bank.id, Number(rate)))}>Set rate</button>
      </div>

      <div className="mt-3">
        <div className="label mb-1.5">Inject reserves</div>
        <div className="flex gap-1.5">
          <input className="input flex-1 py-1.5 text-[10px]" value={injection} onChange={(event) => setInjection(event.target.value)} inputMode="decimal" />
          <button type="button" className="btn px-2 py-1 text-[9px]" onClick={() => runAction((current) => injectReserves(current, bank.id, Math.max(0, Number(injection) || 0)))}>Inject</button>
        </div>
      </div>

      <div className="mt-3 border-t border-ink-600/30 pt-3">
        <div className="flex items-center justify-between text-[10px]"><span className="text-fog-500">Loan book</span><span className="mono text-fog-200">{money(bank.loans, true)}</span></div>
        <div className="mt-1 flex items-center justify-between text-[10px]"><span className="text-fog-500">Daily profit</span><span className="mono text-mint-300">{money((bank.loans * (bank.rate / 100)) / 365, true)}</span></div>
      </div>
    </Panel>
  )
}

function ContagionPanel() {
  const { state } = useGame()
  const sorted = [...state.banks].sort((a, b) => bankRisk(b) - bankRisk(a))
  return (
    <Panel eyebrow="SYSTEMIC RISK" title="Contagion monitor">
      <div className="space-y-3">
        {sorted.map((bank) => {
          const risk = bankRisk(bank)
          const lev = leverage(bank)
          return (
            <div key={bank.id}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[11px] text-fog-200">{bank.name}</div>
                  <div className="micro mt-0.5">{lev.toFixed(1)}x leverage · {bank.status}</div>
                </div>
                <span className={classNames('font-mono text-[10px]', risk > 65 ? 'text-rose-300' : risk > 40 ? 'text-amber-300' : 'text-mint-300')}>{risk.toFixed(0)}</span>
              </div>
              <Progress value={risk} hue={risk > 65 ? 350 : risk > 40 ? 42 : 174} className="mt-1.5" height={4} glow={risk > 65} />
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-start gap-2 border border-rose-400/20 bg-rose-400/5 p-2.5">
        <TrendingDown size={13} className="mt-0.5 shrink-0 text-rose-300" />
        <p className="text-[9px] leading-relaxed text-rose-200/70">A single critical bank run can cascade through the interbank market. The city has bailed out one institution this decade. It is not eager to do it again.</p>
      </div>
    </Panel>
  )
}

export function BankingPage() {
  const { state } = useGame()
  const [selectedId, setSelectedId] = useState(state.banks[0]?.id ?? 'meridian')
  const totalDeposits = state.banks.reduce((sum, bank) => sum + bank.deposits, 0)
  const totalReserves = state.banks.reduce((sum, bank) => sum + bank.reserves, 0)
  const totalLoans = state.banks.reduce((sum, bank) => sum + bank.loans, 0)
  const avgRate = state.banks.reduce((sum, bank) => sum + bank.rate, 0) / Math.max(1, state.banks.length)
  const critical = state.banks.filter((bank) => bank.status === 'critical' || bank.status === 'collapsed').length

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="FRACTIONAL RESERVE · CREDIT · CONTAGION"
        title="Banking"
        description="Deposit, lend, leverage and survive. Your bank is only solvent until the queue reaches the door."
        action={<Badge tone={critical > 0 ? 'bad' : 'good'} pulse>{critical} INSTITUTION{critical === 1 ? '' : 'S'} AT RISK</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="System deposits" value={money(totalDeposits, true)} sub={`${state.banks.length} licensed institutions`} icon={<Landmark size={15} />} hue={218} spark={state.banks[0]?.history.map((value) => value * 1000)} />
        <StatCard label="Reserves" value={money(totalReserves, true)} sub={`${((totalReserves / Math.max(1, totalDeposits)) * 100).toFixed(1)}% coverage`} icon={<Shield size={15} />} hue={174} spark={state.banks[1]?.history.map((value) => value * 1000)} />
        <StatCard label="Loan book" value={money(totalLoans, true)} sub={`${(totalLoans / Math.max(1, totalReserves)).toFixed(1)}x system leverage`} icon={<Banknote size={15} />} hue={42} spark={state.banks[2]?.history.map((value) => value * 1000)} />
        <StatCard label="Avg deposit rate" value={`${avgRate.toFixed(1)}%`} sub="Across the licensed market" icon={<Percent size={15} />} hue={286} spark={state.banks[3]?.history.map((value) => value * 1000)} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-4 xl:col-span-8">
          <BankTable selectedId={selectedId} onSelect={setSelectedId} />
          <BankDetail bankId={selectedId} />
        </div>
        <div className="col-span-12 space-y-4 xl:col-span-4">
          <PlayerBankPanel />
          <ContagionPanel />
        </div>
      </div>
    </div>
  )
}
