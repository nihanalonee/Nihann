import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Building2,
  FileWarning,
  Gauge as GaugeIcon,
  Landmark,
  Percent,
  Plus,
  ShieldCheck,
  TrendingUp,
  Users,
  Vault,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AreaChart, Donut, Gauge, MiniBars } from "../components/charts";
import { Badge, Button, Label, Modal, Panel, Progress, Segmented } from "../components/ui";
import { useGame } from "../game/GameContext";
import { fmtMoney, fmtNum, fmtPct } from "../lib/format";
import { cn } from "../lib/cn";

const BORROWERS = [
  { name: "Meridian Freight", share: 0.27, rate: 8.4, risk: 18, status: "Current", sector: "Logistics" },
  { name: "Vane Capital SPV", share: 0.22, rate: 12.8, risk: 64, status: "Watch", sector: "Holding" },
  { name: "Neon Retail Co-op", share: 0.18, rate: 9.1, risk: 31, status: "Current", sector: "Retail" },
  { name: "Helix Park Labs", share: 0.14, rate: 7.6, risk: 12, status: "Current", sector: "Biotech" },
  { name: "Dockside Holdings", share: 0.11, rate: 15.4, risk: 77, status: "Delinquent", sector: "Shipping" },
  { name: "District Infra Fund", share: 0.08, rate: 5.2, risk: 8, status: "Current", sector: "Public" },
];

export function Banking() {
  const { state, dispatch } = useGame();
  const [amount, setAmount] = useState("");
  const [range, setRange] = useState<"7" | "30" | "all">("30");
  const [bondOpen, setBondOpen] = useState(false);
  const [bondAmount, setBondAmount] = useState("500000");
  const [stressOpen, setStressOpen] = useState(false);
  const [underwriteOpen, setUnderwriteOpen] = useState(false);
  const [borrower, setBorrower] = useState(BORROWERS[0].name);
  const [loanAmount, setLoanAmount] = useState("250000");
  const [loanRate, setLoanRate] = useState("9.4");

  const bank = state.bank;
  const reserveActual = (bank.reserves / Math.max(1, bank.deposits)) * 100;
  const equity = Math.max(0, bank.reserves + bank.loans - bank.deposits - bank.bonds);
  const leverage = (bank.deposits + bank.bonds) / Math.max(1, equity);
  const coverage = (bank.reserves / Math.max(1, bank.loans)) * 100;
  const runRisk = Math.min(99, Math.max(2, 100 - reserveActual * 2.4 + bank.runs * 7));
  const statusTone =
    bank.status === "stable"
      ? "text-mint border-mint/25 bg-mint/[0.07]"
      : bank.status === "strained"
        ? "text-gold border-gold/25 bg-gold/[0.07]"
        : "text-danger border-danger/25 bg-danger/[0.07]";

  const chartData = useMemo(() => {
    if (range === "7") return bank.history.slice(-7);
    if (range === "30") return bank.history.slice(-30);
    return bank.history;
  }, [bank.history, range]);

  const total = Number(amount) || 0;
  const cash = state.player.cash;

  return (
    <div className="animate-fade-up">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-mint/70">EMPIRE / FINANCIAL INSTITUTIONS</span>
            <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[8px] uppercase tracking-wider", statusTone)}>
              <span className="h-1 w-1 rounded-full bg-current" /> {bank.status}
            </span>
          </div>
          <h1 className="mt-2 text-[30px] leading-none text-white md:text-[38px]">{bank.name}</h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-white/40">
            Fractional reserve banking, loan underwriting and liquidity management. Every dollar of
            deposits is a promise — and a liability.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setBondOpen(true)}>
            <Banknote size={12} /> Issue bond
          </Button>
          <Button variant="danger" size="sm" onClick={() => setStressOpen(true)}>
            <AlertTriangle size={12} /> Stress test
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {[
          { label: "Total deposits", value: fmtMoney(bank.deposits), sub: `${fmtNum(12_400 + Math.round(bank.deposits / 180))} accounts`, icon: <Users size={13} />, color: "#7CF7C4" },
          { label: "Reserves", value: fmtMoney(bank.reserves), sub: `${reserveActual.toFixed(1)}% actual ratio`, icon: <Vault size={13} />, color: "#F5C451" },
          { label: "Loan book", value: fmtMoney(bank.loans), sub: `${coverage.toFixed(0)}% reserve coverage`, icon: <Landmark size={13} />, color: "#B69CFF" },
          { label: "Shareholder equity", value: fmtMoney(equity), sub: `${leverage.toFixed(2)}× leverage`, icon: <TrendingUp size={13} />, color: "#7FB2FF" },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="label">{stat.label}</div>
                <div className="num mt-2 text-[23px] leading-none text-white">{stat.value}</div>
                <div className="mt-2 text-[9.5px] text-white/30">{stat.sub}</div>
              </div>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg border"
                style={{ color: stat.color, borderColor: `${stat.color}25`, background: `${stat.color}0d` }}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-12">
        <div className="space-y-3 xl:col-span-8">
          <Panel className="p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Label>Balance sheet / capital formation</Label>
                <div className="mt-2 flex items-end gap-3">
                  <span className="num text-[28px] leading-none text-white">{fmtMoney(equity)}</span>
                  <span className="num mb-0.5 text-[10px] text-mint">+{fmtMoney(bank.capital * 0.002, 2)} / tick</span>
                </div>
              </div>
              <Segmented
                value={range}
                onChange={setRange}
                options={[
                  { value: "7", label: "7D" },
                  { value: "30", label: "30D" },
                  { value: "all", label: "ALL" },
                ]}
              />
            </div>
            <div className="mt-4">
              <AreaChart data={chartData} height={190} color="#7CF7C4" format={(v) => fmtMoney(v)} />
            </div>
            <div className="mt-4 grid gap-3 border-t border-white/[0.05] pt-3 sm:grid-cols-3">
              <div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-white/30">Deposits</span>
                  <span className="num text-white/60">{fmtMoney(bank.deposits)}</span>
                </div>
                <Progress value={bank.deposits} max={bank.deposits + bank.bonds + bank.reserves} color="#7CF7C4" height={4} className="mt-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-white/30">Loans</span>
                  <span className="num text-white/60">{fmtMoney(bank.loans)}</span>
                </div>
                <Progress value={bank.loans} max={bank.deposits + bank.bonds + bank.reserves} color="#B69CFF" height={4} className="mt-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-white/30">Bonds</span>
                  <span className="num text-white/60">{fmtMoney(bank.bonds)}</span>
                </div>
                <Progress value={bank.bonds} max={bank.deposits + bank.bonds + bank.reserves} color="#F5C451" height={4} className="mt-1.5" />
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
              <div>
                <Label>Credit book</Label>
                <div className="mt-1 text-[13px] text-white/80">Underwritten exposure</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="danger">{BORROWERS.filter((b) => b.status !== "Current").length} WATCHLIST</Badge>
                <Button variant="primary" size="sm" onClick={() => setUnderwriteOpen(true)}>
                  <Plus size={11} /> Underwrite
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[660px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.05] font-mono text-[7.5px] uppercase tracking-wider text-white/25">
                    <th className="px-4 py-2.5 font-normal">Borrower</th>
                    <th className="px-3 py-2.5 font-normal">Sector</th>
                    <th className="px-3 py-2.5 font-normal">Exposure</th>
                    <th className="px-3 py-2.5 font-normal">Rate</th>
                    <th className="px-3 py-2.5 font-normal">Risk</th>
                    <th className="px-3 py-2.5 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {BORROWERS.map((row) => {
                    const exposure = bank.loans * row.share;
                    return (
                      <tr key={row.name} className="table-row">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Building2 size={11} className="text-white/25" />
                            <span className="text-[10px] text-white/65">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[8px] uppercase tracking-wider text-white/30">{row.sector}</td>
                        <td className="num px-3 py-2.5 text-[9.5px] text-white/55">{fmtMoney(exposure)}</td>
                        <td className="num px-3 py-2.5 text-[9px] text-white/45">{row.rate.toFixed(1)}%</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Progress value={row.risk} color={row.risk > 60 ? "#FF6B6B" : row.risk > 30 ? "#F5C451" : "#7CF7C4"} height={3} className="w-14" />
                            <span className="num text-[8px] text-white/35">{row.risk}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-wider",
                              row.status === "Current"
                                ? "bg-mint/10 text-mint/75"
                                : row.status === "Watch"
                                  ? "bg-gold/10 text-gold/75"
                                  : "bg-danger/10 text-danger/75",
                            )}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="space-y-3 xl:col-span-4">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div>
                <Label>Deposit window</Label>
                <div className="mt-1 text-[13px] text-white/80">Treasury operations</div>
              </div>
              <Vault size={13} className="text-white/25" />
            </div>
            <div className="p-4">
              <div className="flex justify-between text-[9px] text-white/30">
                <span>Amount</span>
                <span className="num">Liquid {fmtMoney(cash)}</span>
              </div>
              <div className="mt-1.5 flex items-center rounded-lg border border-white/10 bg-black/30 px-2.5">
                <span className="font-mono text-[11px] text-white/30">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="num w-full bg-transparent py-2 text-[16px] text-white outline-none placeholder:text-white/15"
                />
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1">
                {[10, 25, 50, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setAmount(String(Math.round(cash * (pct / 100))))}
                    className="rounded border border-white/[0.07] py-1 font-mono text-[8px] text-white/30 transition hover:border-white/20 hover:text-white/60"
                  >
                    {pct === 100 ? "MAX" : `${pct}%`}
                  </button>
                ))}
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    dispatch({ type: "BANK_DEPOSIT", amount: total });
                    setAmount("");
                  }}
                  disabled={total <= 0 || total > cash}
                >
                  <ArrowDownToLine size={11} /> Deposit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    dispatch({ type: "BANK_WITHDRAW", amount: total });
                    setAmount("");
                  }}
                  disabled={total <= 0 || total > bank.reserves}
                >
                  <ArrowUpFromLine size={11} /> Withdraw
                </Button>
              </div>
              <div className="mt-3 space-y-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                <div className="flex justify-between text-[9px]">
                  <span className="text-white/30">Deposit rate</span>
                  <span className="num text-mint/70">{bank.depositRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-white/30">Lending rate</span>
                  <span className="num text-white/60">{bank.lendingRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-white/30">Net interest margin</span>
                  <span className="num text-gold/70">{(bank.lendingRate - bank.depositRate).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Policy levers</Label>
                <div className="mt-1 text-[13px] text-white/80">Risk parameters</div>
              </div>
              <GaugeIcon size={13} className="text-white/25" />
            </div>
            <div className="mt-4 space-y-4">
              {[
                { key: "reserveRatio" as const, label: "Target reserve ratio", value: bank.reserveRatio, min: 5, max: 60, suffix: "%", color: "#7CF7C4" },
                { key: "lendingRate" as const, label: "Lending rate", value: bank.lendingRate, min: 2, max: 30, suffix: "%", color: "#B69CFF" },
                { key: "depositRate" as const, label: "Deposit rate", value: bank.depositRate, min: 0, max: 15, suffix: "%", color: "#F5C451" },
              ].map((rate) => (
                <div key={rate.key}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40">{rate.label}</span>
                    <span className="num text-[11px] text-white/70">
                      {rate.value.toFixed(1)}
                      {rate.suffix}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={rate.min}
                    max={rate.max}
                    step={0.5}
                    value={rate.value}
                    onChange={(e) => dispatch({ type: "SET_BANK_RATE", key: rate.key, value: Number(e.target.value) })}
                    className="mt-1.5 w-full accent-mint"
                  />
                  <div className="flex justify-between font-mono text-[7px] text-white/20">
                    <span>{rate.min}{rate.suffix}</span>
                    <span>{rate.max}{rate.suffix}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-white/30">Outstanding bonds</span>
                <span className="num text-white/60">{fmtMoney(bank.bonds)}</span>
              </div>
              <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setBondOpen(true)}>
                <Banknote size={11} /> Raise debt capital
              </Button>
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Solvency monitor</Label>
                <div className="mt-1 text-[13px] text-white/80">Run probability</div>
              </div>
              <span className={cn("num text-[11px]", runRisk > 55 ? "text-danger" : runRisk > 30 ? "text-gold" : "text-mint")}>
                {runRisk.toFixed(0)}%
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center rounded-lg border border-white/[0.06] bg-white/[0.02] py-2">
                <Gauge value={reserveActual} size={96} color={reserveActual < 8 ? "#FF6B6B" : "#7CF7C4"} sublabel="Reserve ratio" />
              </div>
              <div className="flex flex-col items-center rounded-lg border border-white/[0.06] bg-white/[0.02] py-2">
                <Gauge value={coverage} size={96} color={coverage < 25 ? "#F5C451" : "#7FB2FF"} sublabel="Coverage" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg border border-danger/15 bg-danger/[0.04] px-2.5 py-2">
              <div className="flex items-center gap-1.5 text-[9px] text-danger/70">
                <FileWarning size={11} /> {bank.runs} runs recorded
              </div>
              <span className="font-mono text-[7px] uppercase tracking-wider text-danger/40">FDIC: NONE</span>
            </div>
            <Button variant="danger" size="sm" className="mt-2 w-full" onClick={() => setStressOpen(true)}>
              <AlertTriangle size={11} /> Simulate bank run
            </Button>
          </Panel>
        </div>
      </div>

      <Panel className="mt-3 p-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <Label>Liquidity profile</Label>
            <div className="mt-1 text-[13px] text-white/80">Deposit flight sensitivity</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-mint" />
              <span className="text-[9px] text-white/35">Retail</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              <span className="text-[9px] text-white/35">Corporate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-danger" />
              <span className="text-[9px] text-white/35">Hot money</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <Donut
            slices={[
              { label: "Retail", value: 44, color: "#7CF7C4" },
              { label: "Corporate", value: 37, color: "#F5C451" },
              { label: "Hot money", value: 19, color: "#FF6B6B" },
            ]}
            size={84}
            thickness={10}
          />
          <div className="grid flex-1 grid-cols-3 gap-2">
            {[
              ["Retail deposits", "44%", "sticky · insured"],
              ["Corporate deposits", "37%", "rate sensitive"],
              ["Hot money", "19%", "first to run"],
            ].map(([label, value, sub]) => (
              <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                <div className="label">{label}</div>
                <div className="num mt-1 text-[16px] text-white/75">{value}</div>
                <div className="mt-0.5 text-[8px] text-white/25">{sub}</div>
              </div>
            ))}
          </div>
          <MiniBars data={[18, 24, 21, 30, 26, 34, 31, 42, 38, 46, 44, 51]} color="#7CF7C4" height={44} className="hidden w-40 lg:flex" />
        </div>
      </Panel>

      <Modal open={bondOpen} onClose={() => setBondOpen(false)} title="Issue corporate bond" subtitle="Raise reserves against future interest obligations.">
        <div className="label mb-1.5">Principal</div>
        <input className="field num" type="number" value={bondAmount} onChange={(e) => setBondAmount(e.target.value)} />
        <div className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-[10px] leading-relaxed text-white/35">
          Bonds increase reserves and liabilities in equal measure. They improve liquidity coverage
          but reduce net equity. Coupon obligations accrue automatically.
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setBondOpen(false)}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              dispatch({ type: "ISSUE_BOND", amount: Number(bondAmount) });
              setBondOpen(false);
            }}
          >
            Issue {fmtMoney(Number(bondAmount) || 0)}
          </Button>
        </div>
      </Modal>

      <Modal open={stressOpen} onClose={() => setStressOpen(false)} title="Simulate a bank run" subtitle="This will permanently drain reserves.">
        <div className="flex gap-3 rounded-lg border border-danger/20 bg-danger/[0.05] p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
          <div className="text-[11px] leading-relaxed text-white/55">
            A coordinated withdrawal will remove between 18% and 42% of deposits. If reserves fall
            below 4% of deposits, {bank.name} will be classified as collapsed. There is no deposit
            insurance in this city.
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setStressOpen(false)}>Stand down</Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              dispatch({ type: "TRIGGER_RUN" });
              setStressOpen(false);
            }}
          >
            Trigger the run
          </Button>
        </div>
      </Modal>

      <Modal open={underwriteOpen} onClose={() => setUnderwriteOpen(false)} title="Underwrite a facility" subtitle="Extend credit against the bank's balance sheet.">
        <div className="label mb-1.5">Borrower</div>
        <select className="field" value={borrower} onChange={(e) => setBorrower(e.target.value)}>
          {BORROWERS.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
        </select>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <div className="label mb-1.5">Principal</div>
            <input className="field num" type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />
          </div>
          <div>
            <div className="label mb-1.5">Coupon %</div>
            <input className="field num" type="number" step="0.1" value={loanRate} onChange={(e) => setLoanRate(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ["New exposure", fmtMoney(bank.loans + (Number(loanAmount) || 0))],
            ["Deposit base", fmtMoney(bank.deposits + (Number(loanAmount) || 0) * 0.4)],
            ["Risk weighting", borrower === "Vane Capital SPV" ? "125%" : "75%"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
              <div className="label">{label}</div>
              <div className="num mt-1 text-[11px] text-white/65">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setUnderwriteOpen(false)}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              dispatch({
                type: "UNDERWRITE",
                borrower,
                amount: Number(loanAmount),
                rate: Number(loanRate),
              });
              setUnderwriteOpen(false);
            }}
          >
            Sign facility
          </Button>
        </div>
      </Modal>
    </div>
  );
}
