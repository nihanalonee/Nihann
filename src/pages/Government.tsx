import {
  Building2,
  CircleDollarSign,
  FileText,
  Gavel,
  Handshake,
  Landmark,
  Scale,
  ShieldAlert,
  TrendingUp,
  Users,
  Vote,
} from "lucide-react";
import { useState } from "react";
import { Gauge, MiniBars } from "../components/charts";
import { Badge, Button, Label, Modal, Panel, Progress } from "../components/ui";
import { useGame } from "../game/GameContext";
import { fmtMoney, fmtNum } from "../lib/format";
import { cn } from "../lib/cn";

export function Government() {
  const { state, dispatch } = useGame();
  const [lobbyBill, setLobbyBill] = useState<string | null>(null);
  const [lobbyAmount, setLobbyAmount] = useState("250000");
  const [taxDraft, setTaxDraft] = useState(state.government.taxRate);
  const [corpTaxDraft, setCorpTaxDraft] = useState(state.government.corpTax);

  const gov = state.government;
  const bill = gov.bills.find((b) => b.id === lobbyBill);
  const activeWarrants = gov.warrants + state.underworld.warrants;
  const taxRevenue = (gov.treasury * gov.taxRate) / 100 / 365 + state.corporate.revenue * (gov.corpTax / 100);
  const approvalTone = gov.approval > 55 ? "mint" : gov.approval > 35 ? "gold" : "danger";

  return (
    <div className="animate-fade-up">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-mint/70">INFLUENCE / THE STATE</span>
            <Badge variant={approvalTone}>{gov.approval > 50 ? "MANDATE" : "UNSTABLE"}</Badge>
          </div>
          <h1 className="mt-2 text-[30px] leading-none text-white md:text-[38px]">District Government</h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-white/40">
            The city writes the rules, then rents them out. Lobby the floor, shape tax policy, and
            keep the regulators pointed somewhere other than your balance sheet.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLobbyBill(gov.bills.find((b) => b.status !== "passed")?.id ?? gov.bills[0]?.id ?? null)}>
            <Handshake size={12} /> Lobby the floor
          </Button>
          <Button variant="primary" size="sm" onClick={() => dispatch({ type: "BRIBE" })}>
            <ShieldAlert size={12} /> Reduce scrutiny · $90K
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {[
          { label: "Public approval", value: `${gov.approval}/100`, sub: gov.approval > 50 ? "governing mandate" : "fragile coalition", icon: <Users size={13} />, color: "#7CF7C4" },
          { label: "Regulatory pressure", value: `${gov.regulatoryPressure.toFixed(0)}/100`, sub: gov.regulatoryPressure > 60 ? "crackdown risk" : "manageable", icon: <ShieldAlert size={13} />, color: "#F5C451" },
          { label: "Treasury", value: fmtMoney(gov.treasury, 1), sub: `${fmtMoney(taxRevenue, 1)} daily inflow`, icon: <Landmark size={13} />, color: "#B69CFF" },
          { label: "Active warrants", value: `${activeWarrants}`, sub: `${gov.bailouts} bank bailouts`, icon: <Gavel size={13} />, color: "#FF6B6B" },
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
                <Label>Legislative floor</Label>
                <div className="mt-1 text-[13px] text-white/80">Bills in session</div>
              </div>
              <Badge variant="violet">
                <Vote size={9} /> {gov.bills.filter((b) => b.status === "voting").length} ON FLOOR
              </Badge>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {gov.bills.map((b, index) => (
                <div key={b.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] font-mono text-[9px] text-white/30">
                        0{index + 1}
                      </span>
                      <div>
                        <div className="text-[11.5px] text-white/75">{b.title}</div>
                        <div className="mt-0.5 text-[9px] text-white/30">{b.category} · {b.impact}</div>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-wider",
                        b.status === "passed" ? "bg-mint/10 text-mint/75" : b.status === "rejected" ? "bg-danger/10 text-danger/75" : b.status === "voting" ? "bg-gold/10 text-gold/75" : "bg-white/[0.05] text-white/35",
                      )}
                    >
                      {b.status === "voting" ? "ON FLOOR" : b.status}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] leading-relaxed text-white/35">{b.description}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-[8px]">
                        <span className="text-white/25">Floor vote</span>
                        <span className="num text-white/55">{b.votes}/100</span>
                      </div>
                      <Progress value={b.votes} color={b.votes >= 50 ? "#7CF7C4" : b.votes >= 35 ? "#F5C451" : "#FF6B6B"} height={4} className="mt-1" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={b.status === "passed" || b.status === "rejected"}
                      onClick={() => { setLobbyBill(b.id); setLobbyAmount("250000"); }}
                    >
                      <Handshake size={11} /> Lobby
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <Label>Fiscal policy</Label>
                <div className="mt-1 text-[13px] text-white/80">Tax and spend</div>
              </div>
              <CircleDollarSign size={13} className="text-white/25" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/40">Personal income tax</span>
                  <span className="num text-white/70">{taxDraft}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={45}
                  step={1}
                  value={taxDraft}
                  onChange={(e) => setTaxDraft(Number(e.target.value))}
                  onMouseUp={() => dispatch({ type: "SET_TAX", key: "taxRate", value: taxDraft })}
                  className="mt-2 w-full accent-mint"
                />
                <div className="mt-1 flex justify-between font-mono text-[7px] text-white/20"><span>5%</span><span>45%</span></div>
                <div className="mt-2 text-[8.5px] text-white/25">Higher taxes fund the treasury but erode approval.</div>
              </div>
              <div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/40">Corporate tax</span>
                  <span className="num text-white/70">{corpTaxDraft}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={1}
                  value={corpTaxDraft}
                  onChange={(e) => setCorpTaxDraft(Number(e.target.value))}
                  onMouseUp={() => dispatch({ type: "SET_TAX", key: "corpTax", value: corpTaxDraft })}
                  className="mt-2 w-full accent-mint"
                />
                <div className="mt-1 flex justify-between font-mono text-[7px] text-white/20"><span>5%</span><span>40%</span></div>
                <div className="mt-2 text-[8.5px] text-white/25">Corporate tax directly reduces your holding company's net revenue.</div>
              </div>
            </div>
            <div className="mt-4 grid gap-2 border-t border-white/[0.05] pt-3 sm:grid-cols-4">
              {[
                ["Tax take / day", fmtMoney(taxRevenue)],
                ["Business confidence", `${Math.max(12, 88 - gov.corpTax * 1.8).toFixed(0)}/100`],
                ["Public services", `${Math.max(20, 100 - gov.taxRate * 1.2).toFixed(0)}/100`],
                ["Debt to GDP", `${(64 + gov.regulatoryPressure * 0.4).toFixed(1)}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                  <div className="label">{label}</div>
                  <div className="num mt-1 text-[12px] text-white/70">{value}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-3 xl:col-span-4">
          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Approval</Label>
                <div className="mt-1 text-[13px] text-white/80">Coalition health</div>
              </div>
              <Badge variant={approvalTone}>{gov.approval > 55 ? "STABLE" : gov.approval > 35 ? "TENSE" : "FRACTURING"}</Badge>
            </div>
            <div className="mt-2 flex flex-col items-center">
              <Gauge value={gov.approval} size={160} color={gov.approval > 50 ? "#7CF7C4" : gov.approval > 35 ? "#F5C451" : "#FF6B6B"} label={`${gov.approval}`} sublabel="Approval rating" />
            </div>
            <div className="space-y-2">
              {[
                { label: "Business bloc", value: Math.max(10, 84 - gov.corpTax * 1.5), color: "#7CF7C4" },
                { label: "Labour bloc", value: Math.max(10, 38 + gov.taxRate * 0.8), color: "#B69CFF" },
                { label: "Security bloc", value: Math.max(10, 60 + activeWarrants * 4), color: "#F5C451" },
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
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Regulatory posture</Label>
                <div className="mt-1 text-[13px] text-white/80">Enforcement appetite</div>
              </div>
              <Scale size={13} className="text-white/25" />
            </div>
            <div className="mt-2 flex flex-col items-center">
              <Gauge value={gov.regulatoryPressure} size={146} color={gov.regulatoryPressure > 60 ? "#FF6B6B" : "#F5C451"} label={`${gov.regulatoryPressure.toFixed(0)}`} sublabel="Pressure index" />
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
              <span className="text-[9px] text-white/30">Active warrants</span>
              <span className="num text-[11px] text-danger/75">{activeWarrants}</span>
            </div>
            <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => dispatch({ type: "BRIBE" })}>
              <Handshake size={11} /> Lobby enforcement · $90K
            </Button>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div>
                <Label>Treasury allocation</Label>
                <div className="mt-1 text-[13px] text-white/80">Public spending</div>
              </div>
              <Landmark size={13} className="text-white/25" />
            </div>
            <div className="p-4">
              <div className="space-y-2.5">
                {[
                  ["Infrastructure", 34, "#7CF7C4"],
                  ["Security & police", 27, "#FF6B6B"],
                  ["Healthcare", 21, "#B69CFF"],
                  ["Media & culture", 11, "#FF8FB1"],
                  ["Debt service", 7, "#F5C451"],
                ].map(([label, value, color]) => (
                  <div key={label as string}>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/30">{label}</span>
                      <span className="num text-white/50">{value}%</span>
                    </div>
                    <Progress value={value as number} max={40} color={color as string} height={3} className="mt-1" />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-end gap-2">
                <MiniBars data={[40, 44, 42, 48, 51, 49, 55, 53, 58, 56, 61, 59]} color="#B69CFF" height={34} className="flex-1" />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[7px] uppercase tracking-wider text-white/20"><span>Q1</span><span>Now</span></div>
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>District approval</Label>
                <div className="mt-1 text-[13px] text-white/80">Sentiment by zone</div>
              </div>
              <Building2 size={13} className="text-white/25" />
            </div>
            <div className="mt-3 space-y-2">
              {state.districts.map((district) => {
                const approval = Math.max(8, Math.min(94, gov.approval + (district.demand - 60) * 0.5 - district.crime * 0.25));
                return (
                  <div key={district.id}>
                    <div className="flex justify-between text-[8.5px]">
                      <span className="text-white/30">{district.name}</span>
                      <span className="num text-white/50">{approval.toFixed(0)}%</span>
                    </div>
                    <Progress value={approval} color={approval > 50 ? "#7CF7C4" : "#FF6B6B"} height={3} className="mt-1" />
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>

      <Modal open={!!lobbyBill} onClose={() => setLobbyBill(null)} title="Lobby the floor" subtitle={bill?.title}>
        {bill && (
          <div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-white/30">Current votes</span>
                <span className="num text-white/60">{bill.votes}/100</span>
              </div>
              <Progress value={bill.votes} color="#F5C451" height={4} className="mt-1.5" />
              <p className="mt-2 text-[10px] leading-relaxed text-white/35">{bill.description}</p>
            </div>
            <div className="mt-3 label mb-1.5">Consulting budget</div>
            <input className="field num" type="number" value={lobbyAmount} onChange={(e) => setLobbyAmount(e.target.value)} />
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {[100_000, 250_000, 500_000].map((value) => (
                <button
                  key={value}
                  onClick={() => setLobbyAmount(String(value))}
                  className="rounded-lg border border-white/[0.07] bg-white/[0.02] py-1.5 font-mono text-[8px] text-white/35 transition hover:border-white/20 hover:text-white/60"
                >
                  {fmtMoney(value, 0)}
                </button>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[9px] text-white/30">
              <span>Available cash</span>
              <span className="num text-white/60">{fmtMoney(state.player.cash)}</span>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setLobbyBill(null)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  dispatch({ type: "LOBBY", billId: bill.id, amount: Number(lobbyAmount) });
                  setLobbyBill(null);
                }}
              >
                <Handshake size={11} /> Move votes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
