import {
  ArrowRight,
  BarChart3,
  Building2,
  Crosshair,
  Eye,
  Fingerprint,
  Lock,
  Megaphone,
  Plus,
  Rocket,
  Shield,
  ShieldAlert,
  Swords,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AreaChart, Gauge, Sparkline } from "../components/charts";
import { Avatar, Badge, Button, Label, Modal, Panel, Progress, Segmented } from "../components/ui";
import { useGame } from "../game/GameContext";
import { fmtCompact, fmtMoney, fmtNum, fmtPct } from "../lib/format";
import { cn } from "../lib/cn";

export function Corporate() {
  const { state, dispatch } = useGame();
  const [range, setRange] = useState<"7" | "30" | "all">("30");
  const [investOpen, setInvestOpen] = useState<null | "rnd" | "security" | "pr" | "employees">(null);
  const [investAmount, setInvestAmount] = useState("250000");
  const [espionageTarget, setEspionageTarget] = useState<string | null>(null);
  const [espionageOpen, setEspionageOpen] = useState(false);

  const corp = state.corporate;
  const history = corp.history ?? [corp.valuation * 0.8, corp.valuation];
  const chartData = useMemo(() => {
    if (range === "7") return history.slice(-7);
    if (range === "30") return history.slice(-30);
    return history;
  }, [history, range]);
  const valuationDelta = ((corp.valuation - history[0]) / Math.max(1, history[0])) * 100;
  const rival = corp.rivals.find((r) => r.id === espionageTarget);
  const espionageChance = rival
    ? Math.max(5, Math.min(92, 40 + corp.security * 0.5 - rival.aggression * 0.22))
    : 0;

  const actions = [
    { key: "rnd" as const, label: "R&D program", desc: "Expand product moat and valuation", icon: <Rocket size={15} />, color: "#7CF7C4", value: `${corp.rnd.toFixed(0)}/100` },
    { key: "security" as const, label: "Security", desc: "Reduce espionage and cyber risk", icon: <Shield size={15} />, color: "#B69CFF", value: `${corp.security.toFixed(0)}/100` },
    { key: "pr" as const, label: "Public relations", desc: "Protect reputation and sentiment", icon: <Megaphone size={15} />, color: "#F5C451", value: `${corp.pr.toFixed(0)}/100` },
    { key: "employees" as const, label: "Headcount", desc: "Scale execution capacity", icon: <Users size={15} />, color: "#7FB2FF", value: `${corp.employees} staff` },
  ];

  const divisions = [
    { name: "Axiom Cloud", share: 38, growth: 14.2, color: "#7CF7C4" },
    { name: "Axiom Devices", share: 27, growth: 6.8, color: "#B69CFF" },
    { name: "Axiom Labs", share: 21, growth: 22.4, color: "#F5C451" },
    { name: "Axiom Defense", share: 14, growth: -3.1, color: "#FF8FB1" },
  ];

  return (
    <div className="animate-fade-up">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-mint/70">INFLUENCE / CORPORATE WARFARE</span>
            <Badge variant="mint">
              <span className="h-1 w-1 rounded-full bg-mint" /> PUBLIC · AXI
            </Badge>
          </div>
          <h1 className="mt-2 text-[30px] leading-none text-white md:text-[38px]">{corp.name}</h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-white/40">
            A holding company with a technology problem and a balance sheet. Grow the valuation,
            protect the moat, and decide which rival to hurt first.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setInvestOpen("security")}>
            <Shield size={12} /> Harden security
          </Button>
          <Button variant="primary" size="sm" onClick={() => setInvestOpen("rnd")}>
            <Rocket size={12} /> Deploy R&D
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {[
          { label: "Enterprise valuation", value: fmtMoney(corp.valuation), sub: `${fmtPct(valuationDelta)} since inception`, icon: <Building2 size={13} />, color: "#7CF7C4" },
          { label: "Revenue / tick", value: fmtMoney(corp.revenue), sub: `${state.player.cash >= 0 ? "profitable" : "burning"}` , icon: <TrendingUp size={13} />, color: "#F5C451" },
          { label: "Headcount", value: fmtNum(corp.employees), sub: `${fmtMoney(corp.revenue * 0.16)} payroll`, icon: <Users size={13} />, color: "#B69CFF" },
          { label: "Security posture", value: `${corp.security.toFixed(0)}/100`, sub: `${corp.rivals.filter((r) => r.aggression > 70).length} hostile rivals`, icon: <ShieldAlert size={13} />, color: "#FF8FB1" },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="label">{stat.label}</div>
                <div className="num mt-2 text-[23px] leading-none text-white">{stat.value}</div>
                <div className="mt-2 text-[9.5px] text-white/30">{stat.sub}</div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ color: stat.color, borderColor: `${stat.color}25`, background: `${stat.color}0d` }}>
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
                <Label>Valuation trajectory</Label>
                <div className="mt-2 flex items-end gap-3">
                  <span className="num text-[28px] leading-none text-white">{fmtMoney(corp.valuation)}</span>
                  <span className={cn("num mb-0.5 text-[10px]", valuationDelta >= 0 ? "text-mint" : "text-danger")}>{fmtPct(valuationDelta)}</span>
                </div>
              </div>
              <Segmented value={range} onChange={setRange} options={[{ value: "7", label: "7D" }, { value: "30", label: "30D" }, { value: "all", label: "ALL" }]} />
            </div>
            <div className="mt-4">
              <AreaChart data={chartData} height={180} color="#7CF7C4" format={(v) => fmtMoney(v)} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.05] pt-3 sm:grid-cols-4">
              {[
                ["R&D", `${corp.rnd.toFixed(0)}`, "#7CF7C4"],
                ["Security", `${corp.security.toFixed(0)}`, "#B69CFF"],
                ["PR", `${corp.pr.toFixed(0)}`, "#F5C451"],
                ["PR multiple", `${(corp.valuation / Math.max(1, corp.revenue * 1440)).toFixed(1)}×`, "#7FB2FF"],
              ].map(([label, value, color]) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="h-6 w-0.5 rounded-full" style={{ background: color }} />
                  <div>
                    <div className="text-[8px] text-white/25">{label}</div>
                    <div className="num text-[11px] text-white/65">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div>
                <Label>Rival intelligence</Label>
                <div className="mt-1 text-[13px] text-white/80">Competitive landscape</div>
              </div>
              <Badge variant="danger">
                <Swords size={9} /> {corp.rivals.filter((r) => r.aggression > 65).length} THREATS
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.05] font-mono text-[7.5px] uppercase tracking-wider text-white/25">
                    <th className="px-4 py-2.5 font-normal">Entity</th>
                    <th className="px-3 py-2.5 font-normal">CEO</th>
                    <th className="px-3 py-2.5 font-normal">Net worth</th>
                    <th className="px-3 py-2.5 font-normal">Focus</th>
                    <th className="px-3 py-2.5 font-normal">Aggression</th>
                    <th className="px-3 py-2.5 font-normal">Sentiment</th>
                    <th className="px-3 py-2.5 font-normal" />
                  </tr>
                </thead>
                <tbody>
                  {corp.rivals.map((r) => (
                    <tr key={r.id} className="table-row">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar initials={r.ceo.slice(0, 2)} color={r.color} size={24} />
                          <span className="text-[9.5px] text-white/60">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[8px] uppercase tracking-wider text-white/30">{r.ceo}</td>
                      <td className="num px-3 py-2.5 text-[9px] text-white/50">{fmtMoney(r.netWorth, 1)}</td>
                      <td className="px-3 py-2.5 text-[8.5px] text-white/35">{r.focus}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Progress value={r.aggression} color={r.aggression > 75 ? "#FF6B6B" : "#F5C451"} height={3} className="w-14" />
                          <span className="num text-[8px] text-white/30">{r.aggression}</span>
                        </div>
                      </td>
                      <td className={cn("num px-3 py-2.5 text-[9px]", r.sentiment >= 50 ? "text-mint/65" : r.sentiment >= 20 ? "text-gold/65" : "text-danger/65")}>
                        {r.sentiment.toFixed(0)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => { setEspionageTarget(r.id); setEspionageOpen(true); }}
                          className="rounded border border-white/10 px-2 py-1 font-mono text-[7px] uppercase tracking-wider text-white/35 transition hover:border-danger/40 hover:text-danger"
                        >
                          Espionage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid gap-2 sm:grid-cols-2">
            {actions.map((action) => (
              <button
                key={action.key}
                onClick={() => setInvestOpen(action.key)}
                className="panel panel-hover group flex items-center gap-3 p-3.5 text-left"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border" style={{ color: action.color, borderColor: `${action.color}25`, background: `${action.color}0d` }}>
                  {action.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-white/70">{action.label}</span>
                    <span className="num text-[9px] text-white/35">{action.value}</span>
                  </div>
                  <div className="mt-0.5 text-[8.5px] text-white/25">{action.desc}</div>
                </div>
                <Plus size={13} className="shrink-0 text-white/20 transition group-hover:text-white/60" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 xl:col-span-4">
          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Board posture</Label>
                <div className="mt-1 text-[13px] text-white/80">Operating health</div>
              </div>
              <Badge variant="violet">AXI</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center rounded-lg border border-white/[0.06] bg-white/[0.02] py-2">
                <Gauge value={corp.rnd} size={94} color="#7CF7C4" sublabel="R&D" />
              </div>
              <div className="flex flex-col items-center rounded-lg border border-white/[0.06] bg-white/[0.02] py-2">
                <Gauge value={corp.security} size={94} color="#B69CFF" sublabel="Security" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-[9px]">
                <span className="text-white/30">Public reputation</span>
                <span className="num text-white/55">{corp.pr.toFixed(0)}/100</span>
              </div>
              <Progress value={corp.pr} color="#F5C451" height={3} className="mt-1" />
            </div>
            <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setInvestOpen("pr")}>
              <Megaphone size={11} /> Fund reputation campaign
            </Button>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="border-b border-white/[0.06] px-4 py-3">
              <Label>Divisions</Label>
              <div className="mt-1 text-[13px] text-white/80">Revenue composition</div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {divisions.map((division) => (
                  <div key={division.name}>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-white/35">{division.name}</span>
                      <span className="num text-white/55">{division.share}% · <span className={division.growth >= 0 ? "text-mint/60" : "text-danger/60"}>{fmtPct(division.growth, 1)}</span></span>
                    </div>
                    <Progress value={division.share} max={40} color={division.color} height={4} className="mt-1" />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-end justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                <div>
                  <div className="label">Blended growth</div>
                  <div className="num mt-1 text-[15px] text-mint">+12.4%</div>
                </div>
                <Sparkline data={[20, 28, 24, 35, 32, 41, 38, 48, 45, 54, 52, 61]} height={30} color="#7CF7C4" />
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div>
                <Label>Intercepts</Label>
                <div className="mt-1 text-[13px] text-white/80">Corporate chatter</div>
              </div>
              <Eye size={13} className="text-white/25" />
            </div>
            <div className="max-h-[240px] overflow-y-auto">
              {state.world.news.slice(0, 6).map((item) => (
                <div key={item.id} className="border-b border-white/[0.04] px-4 py-2.5 last:border-0">
                  <div className="flex gap-2">
                    <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", item.tone === "positive" ? "bg-mint" : item.tone === "negative" ? "bg-danger" : "bg-gold")} />
                    <div>
                      <div className="text-[9.5px] leading-relaxed text-white/45">{item.text}</div>
                      <div className="mt-1 font-mono text-[7px] text-white/20">{item.time} ago</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Threat ranking</Label>
                <div className="mt-1 text-[13px] text-white/80">Most likely attacker</div>
              </div>
              <Crosshair size={13} className="text-danger/50" />
            </div>
            <div className="mt-3">
              {corp.rivals
                .slice()
                .sort((a, b) => b.aggression - a.aggression)
                .slice(0, 3)
                .map((r, index) => (
                  <div key={r.id} className="flex items-center gap-2 border-b border-white/[0.04] py-2 last:border-0">
                    <span className="num w-3 text-[8px] text-white/20">{index + 1}</span>
                    <Avatar initials={r.ceo.slice(0, 2)} color={r.color} size={22} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[9px] text-white/55">{r.ceo}</div>
                      <div className="truncate font-mono text-[7px] text-white/20">{r.focus}</div>
                    </div>
                    <span className="num text-[9px] text-danger/70">{r.aggression}</span>
                  </div>
                ))}
            </div>
            <Button variant="danger" size="sm" className="mt-2 w-full" onClick={() => { setEspionageTarget(corp.rivals[0]?.id ?? null); setEspionageOpen(true); }}>
              <Fingerprint size={11} /> Run counter-intelligence
            </Button>
          </Panel>
        </div>
      </div>

      <Modal
        open={!!investOpen}
        onClose={() => setInvestOpen(null)}
        title={investOpen === "rnd" ? "Deploy R&D capital" : investOpen === "security" ? "Harden corporate security" : investOpen === "pr" ? "Fund reputation campaign" : "Expand headcount"}
        subtitle="Capital is deducted immediately. Returns compound over time."
      >
        <div className="label mb-1.5">Allocation</div>
        <input className="field num" type="number" value={investAmount} onChange={(e) => setInvestAmount(e.target.value)} />
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {[100_000, 250_000, 1_000_000].map((value) => (
            <button
              key={value}
              onClick={() => setInvestAmount(String(value))}
              className="rounded-lg border border-white/[0.07] bg-white/[0.02] py-1.5 font-mono text-[8px] text-white/35 transition hover:border-white/20 hover:text-white/60"
            >
              {fmtMoney(value, 0)}
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-[10px] leading-relaxed text-white/35">
          {investOpen === "rnd" && "R&D raises the product moat, enterprise valuation, and long-run growth rate. It does not protect you from a hostile press cycle."}
          {investOpen === "security" && "Security lowers espionage success rates against you and reduces the chance of a catastrophic data breach. It does not reduce heat with regulators."}
          {investOpen === "pr" && "PR spending raises public reputation and corporate sentiment. It can partially offset a media hit, but cannot erase a criminal record."}
          {investOpen === "employees" && "Headcount expands execution capacity and revenue. Each hire adds fixed payroll costs every tick."}
        </div>
        <div className="mt-2 flex justify-between text-[9px] text-white/30">
          <span>Available cash</span>
          <span className="num text-white/60">{fmtMoney(state.player.cash)}</span>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setInvestOpen(null)}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (investOpen === "rnd") dispatch({ type: "RND", amount: Number(investAmount) });
              else if (investOpen) dispatch({ type: "CORP_INVEST", area: investOpen, amount: Number(investAmount) });
              setInvestOpen(null);
            }}
          >
            Deploy {fmtMoney(Number(investAmount) || 0)}
          </Button>
        </div>
      </Modal>

      <Modal open={espionageOpen} onClose={() => setEspionageOpen(false)} title="Authorise espionage" subtitle={rival ? `${rival.name} · led by ${rival.ceo}` : "Select a target"}>
        {rival && (
          <div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Target net worth", fmtMoney(rival.netWorth, 1)],
                ["Aggression", `${rival.aggression}/100`],
                ["Success probability", `${espionageChance.toFixed(0)}%`],
                ["Operation cost", "$100,000"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                  <div className="label">{label}</div>
                  <div className="num mt-1 text-[13px] text-white/75">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-danger/15 bg-danger/[0.04] p-3 text-[10px] leading-relaxed text-white/40">
              On success, you extract up to 0.6% of target net worth and gain product intelligence. On
              failure, heat spikes and the rival becomes more aggressive.
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEspionageOpen(false)}>Abort</Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  dispatch({ type: "ESPIONAGE", rivalId: rival.id });
                  setEspionageOpen(false);
                }}
              >
                <Fingerprint size={11} /> Run operation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
