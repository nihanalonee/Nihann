"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  Banknote,
  Building2,
  CircleDollarSign,
  Landmark,
  Percent,
  ShieldCheck,
  Timer,
  Vault,
} from "lucide-react";
import { useGame } from "../GameProvider";
import { Modal, Panel, Progress, SectionTitle, Stat } from "../ui";
import { credits, pct } from "@/lib/format";
import { foundBank, injectReserves, repayLoan, setBankRate, takeLoan } from "@/lib/engine";
import type { Bank } from "@/lib/types";

export function BankingView() {
  const { state, act } = useGame();
  const [foundOpen, setFoundOpen] = useState(false);
  const [loanBank, setLoanBank] = useState<Bank | null>(null);
  const [injectBank, setInjectBank] = useState<Bank | null>(null);
  if (!state) return null;

  const ownBanks = state.banks.filter((b) => b.ownerId === "player");
  const bankAssets = ownBanks.reduce((n, b) => n + Math.max(0, b.reserves - b.loans * 0.06), 0);
  const debt = state.player.loans.reduce((n, l) => n + l.outstanding, 0);
  const central = state.banks[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-acid" />
            <p className="mono text-[9px] uppercase tracking-[0.26em] text-acid">Banking & credit</p>
          </div>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.035em] sm:text-[30px]">Liquidity is a weapon.</h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            Charter a bank, set deposit rates, underwrite credit, and manage reserves. Fractional banking is
            profitable until everyone asks for their money on the same afternoon.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => setLoanBank(state.banks.find((b) => b.ownerId !== "player") ?? null)}>
            <ArrowDownToLine className="h-3.5 w-3.5" /> Draw credit
          </button>
          <button className="btn btn-primary" onClick={() => setFoundOpen(true)}>
            <Landmark className="h-3.5 w-3.5" /> Charter bank
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="Liquid cash" value={credits(state.player.cash, true)} accent="#c9ff4d" sub={<span className="text-muted">Ready to deploy</span>} />
        <Stat label="Outstanding debt" value={credits(debt, true)} accent={debt > 0 ? "#ff625c" : undefined} sub={<span className="text-muted">{state.player.loans.length} facilities open</span>} />
        <Stat label="Bank equity" value={credits(bankAssets, true)} accent="#8fa8ff" sub={<span className="text-muted">{ownBanks.length} chartered institution{ownBanks.length === 1 ? "" : "s"}</span>} />
        <Stat label="Policy rate" value={`${central?.rate.toFixed(1) ?? "6.4"}%`} accent="#ffb454" sub={<span className="text-muted">Meridian benchmark</span>} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <Panel className="p-4 sm:p-5">
          <SectionTitle
            eyebrow="Your institutions"
            title="Chartered banks"
            icon={<Vault className="h-4 w-4" />}
            action={
              <button className="btn btn-ghost px-1.5 py-1 text-[10px]" onClick={() => setFoundOpen(true)}>
                + New charter
              </button>
            }
          />
          {ownBanks.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-line/70 p-6 text-center">
              <Landmark className="mx-auto h-6 w-6 text-dim" />
              <p className="mt-2 text-[12px] font-medium text-ink/80">You do not own a bank yet.</p>
              <p className="mx-auto mt-1 max-w-sm text-[10.5px] leading-relaxed text-muted">
                A charter costs {state.player.archetype === "banker" ? "₡455,000" : "₡650,000"} and seeds reserves at
                70%. Deposits arrive as reputation grows; lending earns the spread.
              </p>
              <button className="btn btn-primary mt-3 py-1.5 text-[10.5px]" onClick={() => setFoundOpen(true)}>
                Apply for a charter
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {ownBanks.map((bank) => (
                <OwnBankCard key={bank.id} bank={bank} onInject={() => setInjectBank(bank)} />
              ))}
            </div>
          )}

          <div className="mt-4 rounded-lg border border-line/60 bg-abyss/40 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember" />
              <p className="text-[10px] leading-relaxed text-muted">
                <span className="text-ember">Reserve rule:</span> keep reserves above 8% of deposits. Below 4% the bank
                is insolvent and depositors may run. A run freezes withdrawals and damages reputation city-wide.
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <SectionTitle eyebrow="Credit market" title="Open facilities" icon={<Banknote className="h-4 w-4" />} />
          <div className="mt-3 space-y-2">
            {state.banks.map((bank) => {
              const ratio = (bank.reserves / Math.max(1, bank.deposits)) * 100;
              return (
                <div key={bank.id} className="rounded-lg border border-line/60 bg-abyss/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[11.5px] font-semibold">{bank.name}</p>
                        {bank.ownerId === "player" && <span className="chip border-acid/25 px-1 py-0 text-[7px] text-acid">yours</span>}
                      </div>
                      <p className="mono mt-0.5 text-[8.5px] text-dim">{bank.ownerName}</p>
                    </div>
                    <span
                      className={`mono rounded px-1.5 py-0.5 text-[8px] uppercase ${
                        bank.status === "stable" ? "bg-mint/10 text-mint" : bank.status === "strained" ? "bg-ember/10 text-ember" : "bg-danger/10 text-danger"
                      }`}
                    >
                      {bank.status}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <p className="mono text-[7.5px] uppercase tracking-[0.1em] text-dim">Rate</p>
                      <p className="mono mt-0.5 text-[11px]">{bank.rate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="mono text-[7.5px] uppercase tracking-[0.1em] text-dim">Reserves</p>
                      <p className="mono mt-0.5 text-[10px]">{credits(bank.reserves, true)}</p>
                    </div>
                    <div>
                      <p className="mono text-[7.5px] uppercase tracking-[0.1em] text-dim">Reserve ratio</p>
                      <p className={`mono mt-0.5 text-[10px] ${ratio < 5 ? "text-danger" : ratio < 9 ? "text-ember" : "text-mint"}`}>{ratio.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="w-2/3">
                      <Progress value={Math.min(100, ratio / 20 * 100)} color={ratio < 5 ? "#ff625c" : ratio < 9 ? "#ffb454" : "#63f7c3"} height={2.5} />
                    </div>
                    <button
                      className="btn btn-ghost px-1.5 py-0.5 text-[9.5px] text-acid"
                      disabled={bank.status === "insolvent"}
                      onClick={() => setLoanBank(bank)}
                    >
                      Borrow <ArrowUpRight className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line/60 px-4 py-3">
          <SectionTitle eyebrow="Balance sheet" title="Your debt facilities" icon={<Percent className="h-4 w-4" />} />
          <span className="chip">{state.player.loans.length} open</span>
        </div>
        {state.player.loans.length === 0 ? (
          <div className="p-6 text-center">
            <ShieldCheck className="mx-auto h-5 w-5 text-dim" />
            <p className="mt-2 text-[11.5px] text-muted">No debt. A clean balance sheet is either discipline or unused capacity.</p>
            <button className="btn mt-3 py-1.5 text-[10.5px]" onClick={() => setLoanBank(state.banks.find((b) => b.ownerId !== "player") ?? null)}>
              Draw your first facility
            </button>
          </div>
        ) : (
          <div className="divide-y divide-line/30">
            {state.player.loans.map((loan) => (
              <div key={loan.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-semibold">{loan.bankName}</p>
                  <p className="mono mt-0.5 text-[8.5px] text-dim">
                    {loan.rate.toFixed(1)}% · drawn day {loan.takenDay} · daily {credits(loan.payment)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mono text-[8px] uppercase tracking-[0.1em] text-dim">Outstanding</p>
                  <p className="mono mt-0.5 text-[12px] text-danger">{credits(loan.outstanding)}</p>
                </div>
                <div className="w-28">
                  <Progress value={(1 - loan.outstanding / loan.principal) * 100} color="#63f7c3" height={4} />
                  <p className="mono mt-1 text-right text-[8px] text-dim">{Math.max(0, Math.round((1 - loan.outstanding / loan.principal) * 100))}% repaid</p>
                </div>
                <button
                  className="btn py-1.5 text-[10px]"
                  disabled={state.player.cash < loan.outstanding}
                  onClick={() => act((s) => repayLoan(s, loan.id))}
                >
                  Repay {credits(loan.outstanding, true)}
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Modal open={foundOpen} onClose={() => setFoundOpen(false)} eyebrow="Charter application" title="Found a bank" width="max-w-md">
        <FoundBankForm onDone={() => setFoundOpen(false)} />
      </Modal>

      <Modal open={!!loanBank} onClose={() => setLoanBank(null)} eyebrow="Underwriting" title={loanBank?.name ?? "Credit facility"} width="max-w-md">
        {loanBank && <LoanForm bank={loanBank} onDone={() => setLoanBank(null)} />}
      </Modal>

      <Modal open={!!injectBank} onClose={() => setInjectBank(null)} eyebrow="Capital injection" title={injectBank?.name ?? "Bank"} width="max-w-md">
        {injectBank && <InjectForm bank={injectBank} onDone={() => setInjectBank(null)} />}
      </Modal>
    </div>
  );
}

function OwnBankCard({ bank, onInject }: { bank: Bank; onInject: () => void }) {
  const { state, act } = useGame();
  const [rate, setRate] = useState(bank.rate);
  if (!state) return null;
  const ratio = (bank.reserves / Math.max(1, bank.deposits)) * 100;
  return (
    <div className="rounded-xl border border-line/60 bg-abyss/50 p-3.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12.5px] font-semibold">{bank.name}</p>
          <p className="mono mt-0.5 text-[8.5px] text-dim">Chartered day {bank.foundedDay} · Reputation {Math.round(bank.reputation)}</p>
        </div>
        <span className={`mono rounded px-1.5 py-0.5 text-[8px] uppercase ${bank.status === "stable" ? "bg-mint/10 text-mint" : bank.status === "strained" ? "bg-ember/10 text-ember" : "bg-danger/10 text-danger"}`}>
          {bank.status}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div>
          <p className="mono text-[7.5px] uppercase tracking-[0.1em] text-dim">Reserves</p>
          <p className="mono mt-0.5 text-[11px]">{credits(bank.reserves, true)}</p>
        </div>
        <div>
          <p className="mono text-[7.5px] uppercase tracking-[0.1em] text-dim">Deposits</p>
          <p className="mono mt-0.5 text-[11px]">{credits(bank.deposits, true)}</p>
        </div>
        <div>
          <p className="mono text-[7.5px] uppercase tracking-[0.1em] text-dim">Loans</p>
          <p className="mono mt-0.5 text-[11px]">{credits(bank.loans, true)}</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="mono text-[8px] uppercase tracking-[0.12em] text-dim">Reserve ratio</span>
          <span className={`mono text-[9px] ${ratio < 5 ? "text-danger" : ratio < 9 ? "text-ember" : "text-mint"}`}>
            {ratio.toFixed(1)}% {ratio < 8 ? "· below rule" : "· compliant"}
          </span>
        </div>
        <Progress value={Math.min(100, ratio / 20 * 100)} color={ratio < 5 ? "#ff625c" : ratio < 9 ? "#ffb454" : "#63f7c3"} height={3} className="mt-1.5" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2">
          <span className="mono text-[8px] uppercase tracking-[0.1em] text-dim">Deposit rate</span>
          <input
            type="range"
            min={1}
            max={20}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="range flex-1"
          />
          <span className="mono w-10 text-right text-[10px] text-acid">{rate.toFixed(1)}%</span>
        </div>
        <button className="btn py-1 text-[9.5px]" onClick={() => act((s) => setBankRate(s, bank.id, rate))}>
          Apply rate
        </button>
        <button className="btn py-1 text-[9.5px]" onClick={onInject}>
          <CircleDollarSign className="h-3 w-3" /> Inject
        </button>
      </div>
    </div>
  );
}

function FoundBankForm({ onDone }: { onDone: () => void }) {
  const { state, act } = useGame();
  const [name, setName] = useState("");
  if (!state) return null;
  const cost = state.player.archetype === "banker" ? 455_000 : 650_000;
  return (
    <div className="space-y-3">
      <p className="text-[10.5px] leading-relaxed text-muted">
        A charter grants a deposit-taking license, a board seat, and +8 influence. Reserves are seeded at 70% of
        the charter cost; the rest is regulatory capital that never comes back.
      </p>
      <div>
        <label className="mono mb-1 block text-[8.5px] uppercase tracking-[0.14em] text-dim">Institution name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="First Syndicate Bank" maxLength={34} />
      </div>
      <div className="rounded-lg border border-line/60 bg-abyss/50 p-3 space-y-1 text-[10px]">
        <div className="flex justify-between"><span className="text-muted">Charter cost</span><span className="mono">{credits(cost)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Seeded reserves</span><span className="mono text-mint">{credits(cost * 0.7)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Your cash after</span><span className="mono">{credits(state.player.cash - cost)}</span></div>
      </div>
      {state.player.archetype === "banker" && <p className="mono text-[9px] text-ice">Banker perk applied: 30% charter discount.</p>}
      <button
        className="btn btn-primary w-full"
        disabled={state.player.cash < cost}
        onClick={() => {
          act((s) => foundBank(s, name));
          onDone();
        }}
      >
        <Landmark className="h-3.5 w-3.5" /> {state.player.cash < cost ? "Insufficient capital" : "Sign the charter"}
      </button>
    </div>
  );
}

function LoanForm({ bank, onDone }: { bank: Bank; onDone: () => void }) {
  const { state, act } = useGame();
  const [amount, setAmount] = useState("500000");
  if (!state) return null;
  const principal = Math.max(0, Number(amount) || 0);
  const rate = bank.rate * (state.player.archetype === "banker" ? 0.8 : 1);
  const payment = (principal * (rate / 100)) / 365 + principal / 60;
  const existing = state.player.loans.reduce((n, l) => n + l.outstanding, 0);
  const collateral = Math.max(250_000, (state.player.cash + state.player.properties.length * 1_200_000) * 0.45 - existing);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-line/60 bg-abyss/50 p-3">
        <div>
          <p className="mono text-[8px] uppercase tracking-[0.12em] text-dim">Offered rate</p>
          <p className="mono mt-1 text-[16px] text-acid">{rate.toFixed(1)}%</p>
        </div>
        <div className="text-right">
          <p className="mono text-[8px] uppercase tracking-[0.12em] text-dim">Reserve ratio</p>
          <p className="mono mt-1 text-[12px]">{(bank.reserves / Math.max(1, bank.deposits) * 100).toFixed(1)}%</p>
        </div>
      </div>
      <div>
        <label className="mono mb-1 block text-[8.5px] uppercase tracking-[0.14em] text-dim">Principal</label>
        <div className="relative">
          <span className="mono pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-dim">₡</span>
          <input className="input pl-7" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" />
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {[250_000, 500_000, 1_000_000].map((v) => (
            <button key={v} className="chip hover:border-acid/30 hover:text-acid" onClick={() => setAmount(String(v))}>{credits(v, true)}</button>
          ))}
          <button className="chip hover:border-acid/30 hover:text-acid" onClick={() => setAmount(String(Math.floor(collateral)))}>max</button>
        </div>
      </div>
      <div className="rounded-lg border border-line/60 bg-abyss/50 p-3 space-y-1 text-[10px]">
        <div className="flex justify-between"><span className="text-muted">Daily payment</span><span className="mono">{credits(payment)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Amortization</span><span className="mono">60 days</span></div>
        <div className="flex justify-between"><span className="text-muted">Collateral headroom</span><span className="mono text-mint">{credits(collateral)}</span></div>
      </div>
      <p className="text-[9.5px] leading-relaxed text-dim">
        Missed payments increase heat and damage reputation. Debt is subtracted from net worth immediately.
      </p>
      <button
        className="btn btn-primary w-full"
        disabled={principal < 100_000 || principal > collateral}
        onClick={() => {
          act((s) => takeLoan(s, bank.id, principal));
          onDone();
        }}
      >
        <Timer className="h-3.5 w-3.5" /> Draw {credits(principal, true)}
      </button>
    </div>
  );
}

function InjectForm({ bank, onDone }: { bank: Bank; onDone: () => void }) {
  const { state, act } = useGame();
  const [amount, setAmount] = useState("250000");
  if (!state) return null;
  const value = Math.max(0, Number(amount) || 0);
  return (
    <div className="space-y-3">
      <p className="text-[10.5px] leading-relaxed text-muted">
        Move personal cash into {bank.name}&apos;s reserve account. This strengthens the reserve ratio but does not
        create deposits. Cash leaves your personal balance and appears in bank equity.
      </p>
      <div className="relative">
        <span className="mono pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-dim">₡</span>
        <input className="input pl-7" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" />
      </div>
      <div className="flex gap-1.5">
        {[100_000, 250_000, 500_000].map((v) => (
          <button key={v} className="chip hover:border-acid/30 hover:text-acid" onClick={() => setAmount(String(v))}>{credits(v, true)}</button>
        ))}
      </div>
      <button
        className="btn btn-primary w-full"
        disabled={value <= 0 || value > state.player.cash}
        onClick={() => {
          act((s) => injectReserves(s, bank.id, value));
          onDone();
        }}
      >
        <Building2 className="h-3.5 w-3.5" /> Inject {credits(value, true)}
      </button>
    </div>
  );
}
