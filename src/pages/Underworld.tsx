import {
  AlertOctagon,
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  Crosshair,
  EyeOff,
  Fingerprint,
  Handshake,
  HardHat,
  Landmark,
  Lock,
  Network,
  RefreshCw,
  Ship,
  Skull,
  Terminal,
  Users,
  Vault,
} from "lucide-react";
import { useState } from "react";
import { Donut, Gauge, MiniBars } from "../components/charts";
import { Badge, Button, Label, Modal, Panel, Progress } from "../components/ui";
import { useGame } from "../game/GameContext";
import { crimeSuccessChance } from "../game/engine";
import { fmtMoney, fmtNum } from "../lib/format";
import { cn } from "../lib/cn";
import type { CrimeOperation } from "../types";

const CATEGORY_META: Record<CrimeOperation["category"], { icon: React.ReactNode; color: string; label: string }> = {
  heist: { icon: <Vault size={15} />, color: "#F5C451", label: "Physical" },
  cyber: { icon: <Terminal size={15} />, color: "#B69CFF", label: "Cyber" },
  smuggle: { icon: <Ship size={15} />, color: "#7FB2FF", label: "Logistics" },
  bribe: { icon: <Handshake size={15} />, color: "#FF8FB1", label: "Influence" },
  launder: { icon: <RefreshCw size={15} />, color: "#7CF7C4", label: "Laundering" },
};

export function Underworld() {
  const { state, dispatch } = useGame();
  const [launderAmount, setLaunderAmount] = useState("");
  const [bribeOpen, setBribeOpen] = useState(false);
  const [selectedOp, setSelectedOp] = useState<string | null>(null);
  const [crewOpen, setCrewOpen] = useState(false);

  const uw = state.underworld;
  const amount = Number(launderAmount) || 0;
  const heatStatus = uw.heat > 75 ? "HUNTED" : uw.heat > 50 ? "EXPOSED" : uw.heat > 25 ? "WATCHED" : "LOW PROFILE";
  const heatColor = uw.heat > 75 ? "#FF6B6B" : uw.heat > 50 ? "#F5C451" : "#7CF7C4";
  const warrantRisk = Math.min(99, uw.heat + uw.warrants * 18 - uw.protection * 6);
  const op = uw.operations.find((o) => o.id === selectedOp);
  const crimeLedger = state.ledger.filter((entry) => entry.kind === "crime");

  return (
    <div className="animate-fade-up">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-danger/70">INFLUENCE / UNDERWORLD</span>
            <Badge variant={uw.heat > 50 ? "danger" : "mint"}>
              <span className="h-1 w-1 rounded-full bg-current" /> {heatStatus}
            </Badge>
          </div>
          <h1 className="mt-2 text-[30px] leading-none text-white md:text-[38px]">The Shadow Ledger</h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-white/40">
            Extortion, cyber-theft, smuggling and influence. The underworld pays in cash and costs
            in heat. Every operation leaves a trace someone can follow.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCrewOpen(true)}>
            <Users size={12} /> Recruit crew
          </Button>
          <Button variant="danger" size="sm" onClick={() => setBribeOpen(true)}>
            <Handshake size={12} /> Bribe official
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {[
          { label: "Dirty cash", value: fmtMoney(uw.dirtyCash), sub: `${fmtMoney(uw.laundering)}/tick wash capacity`, icon: <Banknote size={13} />, color: "#F5C451" },
          { label: "Heat level", value: `${uw.heat.toFixed(0)}/100`, sub: `${heatStatus.toLowerCase()} · ${uw.warrants} warrants`, icon: <AlertOctagon size={13} />, color: heatColor },
          { label: "Crew strength", value: `${uw.crew}/12`, sub: `+${uw.crew * 2}% operation odds`, icon: <HardHat size={13} />, color: "#B69CFF" },
          { label: "Protection", value: `L${uw.protection}/5`, sub: `${(uw.protection * 6).toFixed(0)}% faster heat decay`, icon: <Fingerprint size={13} />, color: "#7CF7C4" },
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
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div>
                <Label>Operations board</Label>
                <div className="mt-1 text-[13px] text-white/80">Available contracts</div>
              </div>
              <Badge variant="danger">
                <span className="h-1 w-1 animate-pulse-dot rounded-full bg-danger" /> {uw.crew} SPECIALISTS
              </Badge>
            </div>
            <div className="grid gap-2 p-3 md:grid-cols-2">
              {uw.operations.map((operation) => {
                const meta = CATEGORY_META[operation.category];
                const cooldownLeft = Math.max(0, operation.cooldown - (state.world.tick - operation.lastRun));
                const chance = crimeSuccessChance(operation, uw.heat + uw.crew * 2);
                return (
                  <button
                    key={operation.id}
                    onClick={() => setSelectedOp(operation.id)}
                    className="panel panel-hover group relative overflow-hidden p-3.5 text-left"
                  >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10 blur-2xl" style={{ background: meta.color }} />
                    <div className="relative z-10 flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ color: meta.color, borderColor: `${meta.color}30`, background: `${meta.color}10` }}>
                          {meta.icon}
                        </span>
                        <div>
                          <div className="text-[11px] text-white/75">{operation.name}</div>
                          <div className="mt-0.5 font-mono text-[7px] uppercase tracking-wider text-white/25">{meta.label} · {operation.category}</div>
                        </div>
                      </div>
                      <span className={cn("font-mono text-[7px] uppercase tracking-wider", chance > 65 ? "text-mint/70" : chance > 40 ? "text-gold/70" : "text-danger/70")}>
                        {chance.toFixed(0)}% odds
                      </span>
                    </div>
                    <p className="relative z-10 mt-2 line-clamp-2 text-[9.5px] leading-relaxed text-white/35">{operation.description}</p>
                    <div className="relative z-10 mt-2.5 flex items-center justify-between">
                      <div>
                        <div className="label text-[7px]">Payout range</div>
                        <div className="num mt-0.5 text-[11px] text-white/65">{fmtMoney(operation.minReward)} – {fmtMoney(operation.maxReward)}</div>
                      </div>
                      <div className="text-right">
                        <div className="label text-[7px]">Heat</div>
                        <div className="num mt-0.5 text-[10px] text-danger/70">+{operation.heat}</div>
                      </div>
                    </div>
                    <div className="relative z-10 mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Progress value={chance} color={chance > 65 ? "#7CF7C4" : chance > 40 ? "#F5C451" : "#FF6B6B"} height={3} className="w-20" />
                        <span className="font-mono text-[7px] text-white/20">RISK</span>
                      </div>
                      <span className={cn("font-mono text-[7px] uppercase tracking-wider", cooldownLeft > 0 ? "text-white/20" : "text-mint/55")}>
                        {cooldownLeft > 0 ? `COOLDOWN ${cooldownLeft}` : "READY"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>

          <div className="grid gap-3 md:grid-cols-2">
            <Panel className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Laundering</Label>
                  <div className="mt-1 text-[13px] text-white/80">Clean the cash</div>
                </div>
                <RefreshCw size={13} className="text-white/25" />
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="num text-[24px] text-white">{fmtMoney(uw.dirtyCash)}</div>
                  <div className="mt-0.5 text-[8px] text-white/25">dirty cash on hand</div>
                </div>
                <div className="text-right">
                  <div className="num text-[11px] text-mint">{fmtMoney(uw.laundering)}/tick</div>
                  <div className="text-[8px] text-white/25">auto capacity</div>
                </div>
              </div>
              <div className="mt-2.5 flex items-center rounded-lg border border-white/10 bg-black/30 px-2.5">
                <span className="font-mono text-[11px] text-white/30">$</span>
                <input
                  type="number"
                  value={launderAmount}
                  onChange={(e) => setLaunderAmount(e.target.value)}
                  placeholder="Amount to clean"
                  className="num w-full bg-transparent py-2 text-[14px] text-white outline-none placeholder:text-white/15"
                />
              </div>
              <div className="mt-1.5 grid grid-cols-4 gap-1">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setLaunderAmount(String(Math.round(uw.dirtyCash * pct / 100)))}
                    className="rounded border border-white/[0.07] py-1 font-mono text-[7.5px] text-white/30 transition hover:border-white/20 hover:text-white/60"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[8px] text-white/25">
                <span>18% network fee</span>
                <span className="num text-mint/60">Net {fmtMoney(amount * 0.82)}</span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                <Button variant="primary" size="sm" disabled={amount <= 0 || amount > uw.dirtyCash} onClick={() => { dispatch({ type: "LAUNDER", amount }); setLaunderAmount(""); }}>
                  <RefreshCw size={11} /> Launder
                </Button>
                <Button variant="ghost" size="sm" onClick={() => dispatch({ type: "UPGRADE_LAUNDER" })}>
                  <Network size={11} /> Expand · $180K
                </Button>
              </div>
            </Panel>

            <Panel className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Syndicate</Label>
                  <div className="mt-1 text-[13px] text-white/80">Human capital</div>
                </div>
                <Users size={13} className="text-white/25" />
              </div>
              <div className="mt-3 flex items-center gap-4">
                <Donut
                  slices={[
                    { label: "Operatives", value: uw.crew, color: "#B69CFF" },
                    { label: "Slots", value: 12 - uw.crew, color: "rgba(255,255,255,0.06)" },
                  ]}
                  size={96}
                  thickness={10}
                  center={<div className="num text-[16px] text-white">{uw.crew}</div>}
                />
                <div className="flex-1 space-y-1.5">
                  {[
                    ["Hackers", `${Math.max(1, Math.floor(uw.crew * 0.3))}`],
                    ["Fixers", `${Math.max(1, Math.floor(uw.crew * 0.4))}`],
                    ["Muscle", `${Math.max(0, uw.crew - Math.floor(uw.crew * 0.7))}`],
                    ["Loyalty", `${Math.min(99, 44 + uw.protection * 9 + uw.crew * 3)}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-[9px]">
                      <span className="text-white/25">{label}</span>
                      <span className="num text-white/55">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => setCrewOpen(true)}>
                  <Users size={11} /> Recruit · $120K
                </Button>
                <Button variant="ghost" size="sm" onClick={() => dispatch({ type: "BUY_PROTECTION" })}>
                  <Lock size={11} /> Protection · $250K
                </Button>
              </div>
              <div className="mt-2 rounded-lg border border-danger/15 bg-danger/[0.035] p-2">
                <div className="flex items-center justify-between text-[8px]">
                  <span className="text-danger/60">Warrant risk</span>
                  <span className="num text-danger/80">{warrantRisk.toFixed(0)}%</span>
                </div>
                <Progress value={warrantRisk} color="#FF6B6B" height={2} className="mt-1" />
              </div>
            </Panel>
          </div>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div>
                <Label>Operation history</Label>
                <div className="mt-1 text-[13px] text-white/80">Crime ledger</div>
              </div>
              <Badge variant="violet">{state.stats.crimesCommitted} SUCCESSFUL</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.05] font-mono text-[7.5px] uppercase tracking-wider text-white/25">
                    <th className="px-4 py-2.5 font-normal">Entry</th>
                    <th className="px-3 py-2.5 font-normal">Value</th>
                    <th className="px-3 py-2.5 font-normal">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {crimeLedger.slice(0, 6).map((entry) => (
                    <tr key={entry.id} className="table-row">
                      <td className="px-4 py-2.5 text-[9.5px] text-white/55">{entry.label}</td>
                      <td className={cn("num px-3 py-2.5 text-[9px]", entry.amount >= 0 ? "text-mint/70" : "text-danger/70")}>
                        {entry.amount >= 0 ? "+" : ""}{fmtMoney(entry.amount)}
                      </td>
                      <td className="num px-3 py-2.5 text-[8px] text-white/25">{entry.time}</td>
                    </tr>
                  ))}
                  {crimeLedger.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-[10px] text-white/25">No operations recorded. The street is quiet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="space-y-3 xl:col-span-4">
          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Heat monitor</Label>
                <div className="mt-1 text-[13px] text-white/80">Law enforcement exposure</div>
              </div>
              <Badge variant={uw.heat > 50 ? "danger" : "mint"}>{heatStatus}</Badge>
            </div>
            <div className="mt-2 flex flex-col items-center">
              <Gauge value={uw.heat} size={170} color={heatColor} label={`${uw.heat.toFixed(0)}`} sublabel="Heat index" />
            </div>
            <div className="space-y-2">
              {[
                { label: "Police interest", value: Math.min(100, uw.heat * 0.9 + uw.warrants * 12), color: "#FF6B6B" },
                { label: "Regulatory scrutiny", value: state.government.regulatoryPressure, color: "#F5C451" },
                { label: "Syndicate standing", value: Math.max(0, 70 - uw.heat), color: "#B69CFF" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-[8.5px]">
                    <span className="text-white/30">{row.label}</span>
                    <span className="num text-white/50">{row.value.toFixed(0)}</span>
                  </div>
                  <Progress value={row.value} color={row.color} height={3} className="mt-1" />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
              <span className="text-[9px] text-white/30">Outstanding warrants</span>
              <span className="num text-[11px] text-danger/75">{uw.warrants + state.government.warrants}</span>
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Compliance</Label>
                <div className="mt-1 text-[13px] text-white/80">Buy silence</div>
              </div>
              <Handshake size={13} className="text-white/25" />
            </div>
            <p className="mt-2 text-[9.5px] leading-relaxed text-white/30">
              A well-placed donation reduces heat, softens regulatory pressure, and occasionally
              makes a warrant disappear.
            </p>
            <div className="mt-3 space-y-1.5">
              {[
                ["Bribe a regulator", "$90,000", "heat −16"],
                ["Protection retainer", "$250,000", "heat decay +"],
                ["Emergency amnesty", "God mode", "all warrants"],
              ].map(([label, cost, effect]) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2">
                  <div>
                    <div className="text-[9px] text-white/50">{label}</div>
                    <div className="num text-[8px] text-white/25">{cost}</div>
                  </div>
                  <span className="font-mono text-[7px] uppercase tracking-wider text-mint/60">{effect}</span>
                </div>
              ))}
            </div>
            <Button variant="danger" size="sm" className="mt-2 w-full" onClick={() => setBribeOpen(true)}>
              <Handshake size={11} /> Make a payment
            </Button>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Exposure</Label>
                <div className="mt-1 text-[13px] text-white/80">Cash composition</div>
              </div>
              <EyeOff size={13} className="text-white/25" />
            </div>
            <div className="mt-3 flex items-center gap-4">
              <Donut
                slices={[
                  { label: "Clean", value: state.player.cash, color: "#7CF7C4" },
                  { label: "Dirty", value: uw.dirtyCash, color: "#FF6B6B" },
                ]}
                size={100}
                thickness={10}
                center={<div className="text-center"><div className="num text-[10px] text-white">{Math.round((uw.dirtyCash / Math.max(1, state.player.cash + uw.dirtyCash)) * 100)}%</div><div className="label text-[6px]">DIRTY</div></div>}
              />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-[9px]"><span className="text-white/25">Clean</span><span className="num text-mint/70">{fmtMoney(state.player.cash)}</span></div>
                <div className="flex justify-between text-[9px]"><span className="text-white/25">Dirty</span><span className="num text-danger/70">{fmtMoney(uw.dirtyCash)}</span></div>
                <div className="flex justify-between text-[9px]"><span className="text-white/25">Laundered</span><span className="num text-white/50">{fmtMoney(state.stats.lifetimeEarnings * 0.2)}</span></div>
              </div>
            </div>
            <MiniBars data={[20, 35, 28, 44, 39, 52, 47, 66, 58, 72, 64, 80]} color="#FF6B6B" height={34} className="mt-3" />
            <div className="mt-1 flex justify-between font-mono text-[7px] uppercase tracking-wider text-white/20"><span>30d</span><span>Live</span></div>
          </Panel>
        </div>
      </div>

      <Modal
        open={!!op}
        onClose={() => setSelectedOp(null)}
        title={op?.name ?? "Operation"}
        subtitle={op ? `${op.category.toUpperCase()} · contract briefing` : ""}
      >
        {op && (
          <div>
            <p className="text-[12px] leading-relaxed text-white/50">{op.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                ["Success odds", `${crimeSuccessChance(op, uw.heat + uw.crew * 2).toFixed(0)}%`],
                ["Payout range", `${fmtMoney(op.minReward)} – ${fmtMoney(op.maxReward)}`],
                ["Heat added", `+${op.heat}`],
                ["Cooldown", `${op.cooldown} ticks`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                  <div className="label">{label}</div>
                  <div className="num mt-1 text-[13px] text-white/75">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-gold/15 bg-gold/[0.04] p-3 text-[10px] leading-relaxed text-gold/65">
              Failure burns the contract, adds 1.5× heat, and may cost a crew member. Do not run this
              while the heat index is above 70.
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedOp(null)}>Abort</Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  dispatch({ type: "CRIME", opId: op.id });
                  setSelectedOp(null);
                }}
              >
                <Crosshair size={11} /> Execute operation
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={bribeOpen} onClose={() => setBribeOpen(false)} title="Make a payment" subtitle="Clean cash only. No receipts.">
        <div className="flex gap-3 rounded-lg border border-danger/20 bg-danger/[0.04] p-3">
          <AlertOctagon size={18} className="mt-0.5 shrink-0 text-danger" />
          <div className="text-[11px] leading-relaxed text-white/55">
            A $90,000 payment reduces heat by 16, lowers regulatory pressure by 6, and has a 45%
            chance of voiding one active warrant. It is not guaranteed to stay quiet.
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setBribeOpen(false)}>Cancel</Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              dispatch({ type: "BRIBE" });
              setBribeOpen(false);
            }}
          >
            <Handshake size={11} /> Pay $90,000
          </Button>
        </div>
      </Modal>

      <Modal open={crewOpen} onClose={() => setCrewOpen(false)} title="Recruit a specialist" subtitle="Expand the crew. Each recruit improves operation odds.">
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Hacker", "Cyber operations", "B69CFF"],
            ["Fixer", "Witness management", "F5C451"],
            ["Muscle", "Physical extraction", "FF6B6B"],
            ["Courier", "Smuggling routes", "7FB2FF"],
          ].map(([name, role, color]) => (
            <div key={name} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ color: `#${color}`, borderColor: `#${color}30`, background: `#${color}10` }}>
                {name === "Hacker" ? <Terminal size={14} /> : name === "Fixer" ? <BriefcaseBusiness size={14} /> : name === "Muscle" ? <HardHat size={14} /> : <Ship size={14} />}
              </div>
              <div className="mt-2 text-[10px] text-white/65">{name}</div>
              <div className="mt-0.5 text-[8px] text-white/25">{role}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <span className="text-[9px] text-white/35">Current crew</span>
          <span className="num text-[11px] text-white/65">{uw.crew} / 12</span>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCrewOpen(false)}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              dispatch({ type: "HIRE_CREW" });
              setCrewOpen(false);
            }}
          >
            <Users size={11} /> Recruit · $120K
          </Button>
        </div>
      </Modal>
    </div>
  );
}
