"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Crosshair,
  Fingerprint,
  Flame,
  HandCoins,
  Landmark,
  Package,
  ShieldAlert,
  Skull,
  Terminal,
  UserRound,
  Vault,
  Waves,
} from "lucide-react";
import { useGame } from "../GameProvider";
import { Modal, Panel, Progress, SectionTitle, Stat } from "../ui";
import { credits, heatLabel } from "@/lib/format";
import { underworldOp } from "@/lib/engine";

type Op = "hack" | "smuggle" | "launder" | "bribe" | "heist";

const OPS: {
  id: Op;
  label: string;
  icon: typeof Terminal;
  cost: number;
  heat: string;
  risk: string;
  desc: string;
  color: string;
}[] = [
  {
    id: "hack",
    label: "Cyber intrusion",
    icon: Terminal,
    cost: 26_000,
    heat: "+9 on success / +18 on failure",
    risk: "Medium",
    desc: "Breach a listed company, extract cash, and leave its share price bleeding.",
    color: "#63f7c3",
  },
  {
    id: "smuggle",
    label: "Smuggling run",
    icon: Package,
    cost: 44_000,
    heat: "+7 on success / +16 on seizure",
    risk: "Medium",
    desc: "Move cargo through the Docks. The manifest is fiction; the margin is not.",
    color: "#ffb454",
  },
  {
    id: "launder",
    label: "Launder ledger",
    icon: Waves,
    cost: 52_000,
    heat: "-9 to -17",
    risk: "Low",
    desc: "Three shell companies and a very polite broker. Heat falls; the fee does not.",
    color: "#8fa8ff",
  },
  {
    id: "bribe",
    label: "Bribe official",
    icon: HandCoins,
    cost: 120_000,
    heat: "-22 / +12 if recorded",
    risk: "Low",
    desc: "Buy access, reduce heat, gain influence. Most officials stay bought.",
    color: "#ff7ab6",
  },
  {
    id: "heist",
    label: "Vault job",
    icon: Vault,
    cost: 75_000,
    heat: "+26 on success / +31 on failure",
    risk: "Extreme",
    desc: "A crew, a borrowed schematic, and a four-minute window. The upside is generational.",
    color: "#ff625c",
  },
];

export function UnderworldView() {
  const { state } = useGame();
  const [op, setOp] = useState<Op | null>(null);
  if (!state) return null;

  const heat = state.player.heat;
  const riskLevel = heat > 80 ? "Critical" : heat > 60 ? "Severe" : heat > 35 ? "Elevated" : "Low";
  const penalty = Math.round(state.player.cash * 0.08);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-danger" />
            <p className="mono text-[9px] uppercase tracking-[0.26em] text-danger">The underworld</p>
          </div>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.035em] sm:text-[30px]">Every fortune has a shadow.</h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            Extortion, intrusion, smuggling, and bribery. Heat is the price of visibility: it decays slowly,
            attracts warrants, and turns every operation into a calculated risk. The city has a long memory.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-danger/25 bg-danger/[0.05] px-3 py-2">
          <Flame className="h-4 w-4 text-danger" />
          <div>
            <p className="mono text-[8px] uppercase tracking-[0.12em] text-danger/80">Exposure</p>
            <p className="mono text-[12px] text-danger">{heatLabel(heat)} · {Math.round(heat)}/100</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="Heat level" value={`${Math.round(heat)}/100`} accent={heat > 70 ? "#ff625c" : heat > 40 ? "#ffb454" : "#63f7c3"} sub={<span className="text-muted">{riskLevel} enforcement risk</span>} />
        <Stat label="Active warrants" value={state.government.warrants} accent={state.government.warrants > 0 ? "#ff625c" : undefined} sub={<span className="text-muted">3 triggers a settlement</span>} />
        <Stat label="Syndicate capital" value={credits(state.syndicates.reduce((n, s) => n + s.wealth, 0), true)} sub={<span className="text-muted">Across {state.syndicates.length} organizations</span>} />
        <Stat label="At-risk cash" value={credits(penalty, true)} accent="#ffb454" sub={<span className="text-muted">8% on indictment</span>} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <Panel className="p-4 sm:p-5">
          <SectionTitle
            eyebrow="Operations desk"
            title="Available contracts"
            icon={<Skull className="h-4 w-4" />}
            action={<span className="chip border-danger/25 text-danger">no questions</span>}
          />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {OPS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setOp(item.id)}
                  className="group rounded-xl border border-line/60 bg-abyss/50 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-danger/30 hover:bg-danger/[0.03]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${item.color}12`, color: item.color }}>
                      <Icon className="h-4 w-4" strokeWidth={1.6} />
                    </div>
                    <span className="mono rounded bg-white/[0.03] px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] text-dim">{item.risk}</span>
                  </div>
                  <p className="mt-2.5 text-[11.5px] font-semibold">{item.label}</p>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted">{item.desc}</p>
                  <div className="mt-2.5 flex items-center justify-between border-t border-line/40 pt-2">
                    <span className="mono text-[9px] text-ink/60">{credits(item.cost)}</span>
                    <span className="mono text-[8px] text-danger/80">{item.heat}</span>
                  </div>
                  <span className="mono mt-2 flex items-center gap-1 text-[8.5px] uppercase tracking-[0.12em] text-dim group-hover:text-danger">
                    Open brief <ArrowUpRight className="h-2.5 w-2.5" />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 rounded-lg border border-line/60 bg-abyss/40 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember" />
              <p className="text-[10px] leading-relaxed text-muted">
                Heat above 70 locks your crew out of high-risk jobs. At 100, enforcement moves and you lose 8% of
                cash. Bribes and laundering are the only reliable ways down.
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <SectionTitle eyebrow="Criminal ecosystem" title="Syndicates" icon={<Crosshair className="h-4 w-4" />} />
          <div className="mt-3 space-y-2.5">
            {state.syndicates.map((syndicate) => (
              <div key={syndicate.id} className="rounded-lg border border-line/60 bg-abyss/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11.5px] font-semibold" style={{ color: syndicate.color }}>{syndicate.name}</p>
                    <p className="mono mt-0.5 text-[8.5px] text-dim">{syndicate.boss} · {syndicate.specialty}</p>
                  </div>
                  <span className="mono text-[9px] text-ink/60">{credits(syndicate.wealth, true)}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between">
                      <span className="mono text-[7.5px] uppercase tracking-[0.1em] text-dim">Power</span>
                      <span className="mono text-[8.5px]">{syndicate.power}</span>
                    </div>
                    <Progress value={syndicate.power} color={syndicate.color} height={2} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span className="mono text-[7.5px] uppercase tracking-[0.1em] text-dim">Heat</span>
                      <span className="mono text-[8.5px]">{syndicate.heat}</span>
                    </div>
                    <Progress value={syndicate.heat} color="#ff625c" height={2} className="mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel className="p-4 sm:p-5">
          <SectionTitle eyebrow="Enforcement" title="Your legal exposure" icon={<ShieldAlert className="h-4 w-4" />} />
          <div className="mt-3 space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="mono text-[9px] uppercase tracking-[0.12em] text-muted">Heat</span>
                <span className={`mono text-[10px] ${heat > 70 ? "text-danger" : "text-ink/70"}`}>{Math.round(heat)} / 100</span>
              </div>
              <Progress value={heat} color={heat > 70 ? "#ff625c" : heat > 40 ? "#ffb454" : "#63f7c3"} height={5} className="mt-1.5" />
              <div className="mono mt-1 flex justify-between text-[7.5px] text-dim">
                <span>invisible</span><span>tracked</span><span>burned</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-line/50 bg-abyss/40 p-2.5">
                <p className="mono text-[7.5px] uppercase tracking-[0.1em] text-dim">Warrants</p>
                <p className="mono mt-1 text-[13px] text-danger">{state.government.warrants} / 3</p>
              </div>
              <div className="rounded-lg border border-line/50 bg-abyss/40 p-2.5">
                <p className="mono text-[7.5px] uppercase tracking-[0.1em] text-dim">Regulation</p>
                <p className="mono mt-1 text-[13px]">{Math.round(state.government.regulation)}/100</p>
              </div>
            </div>
            <p className="text-[10px] leading-relaxed text-muted">
              The city opens a warrant when heat exceeds 82. Three warrants trigger a sealed settlement: you lose
              8% of cash, 8 reputation, and the file disappears.
            </p>
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <SectionTitle eyebrow="Black ledger" title="Risks & instruments" icon={<Fingerprint className="h-4 w-4" />} />
          <div className="mt-3 grid gap-2">
            {[
              { icon: UserRound, label: "Bribe", text: "Heat reduction and influence. An 86% clean rate is not a guarantee." },
              { icon: Landmark, label: "Vault job", text: "Requires heat below 70. Success pays 4x–16x the stake." },
              { icon: Landmark, label: "Sealed settlement", text: "Three warrants and the city takes its cut. Keep a war chest." },
              { icon: Flame, label: "Reputation", text: "Crime pays, but visible crime reprices your legitimate assets." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-2.5 rounded-lg border border-line/50 bg-abyss/40 p-2.5">
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger/80" />
                  <div>
                    <p className="text-[10px] font-semibold text-ink/85">{item.label}</p>
                    <p className="mt-0.5 text-[9.5px] leading-relaxed text-muted">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Modal open={!!op} onClose={() => setOp(null)} eyebrow="Operation brief" title={OPS.find((x) => x.id === op)?.label ?? "Contract"} width="max-w-md">
        {op && <OpForm op={op} onDone={() => setOp(null)} />}
      </Modal>
    </div>
  );
}

function OpForm({ op, onDone }: { op: Op; onDone: () => void }) {
  const { state, act } = useGame();
  const [target, setTarget] = useState("");
  if (!state) return null;
  const spec = OPS.find((x) => x.id === op)!;
  const hackers = state.player.archetype === "hacker";
  const success =
    op === "hack" ? (hackers ? "71%" : "56%") : op === "smuggle" ? "62%" : op === "bribe" ? "86%" : op === "heist" ? "34%" : "100%";
  const targets =
    op === "hack"
      ? state.corporations.map((c) => ({ id: c.id, label: `${c.ticker} · ${c.name}` }))
      : op === "heist"
        ? state.banks.map((b) => ({ id: b.id, label: `${b.name} · reserves ${credits(b.reserves, true)}` }))
        : [];
  const activeTarget = target || targets[0]?.id || "";
  const cost = op === "hack" && hackers ? Math.round(spec.cost * 0.85) : spec.cost;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-line/60 bg-abyss/50 p-3">
        <p className="text-[10.5px] leading-relaxed text-muted">{spec.desc}</p>
      </div>
      {targets.length > 0 && (
        <div>
          <label className="mono mb-1 block text-[8.5px] uppercase tracking-[0.14em] text-dim">Target</label>
          <select className="input select" value={activeTarget} onChange={(e) => setTarget(e.target.value)}>
            {targets.map((t) => (
              <option key={t.id} value={t.id} className="bg-panel">{t.label}</option>
            ))}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-line/50 bg-abyss/40 p-2.5">
          <p className="mono text-[7.5px] uppercase tracking-[0.1em] text-dim">Upfront cost</p>
          <p className="mono mt-1 text-[12px]">{credits(cost)}</p>
        </div>
        <div className="rounded-lg border border-line/50 bg-abyss/40 p-2.5">
          <p className="mono text-[7.5px] uppercase tracking-[0.1em] text-dim">Success odds</p>
          <p className="mono mt-1 text-[12px] text-ember">{success}</p>
        </div>
      </div>
      <div className="rounded-lg border border-danger/20 bg-danger/[0.04] p-3">
        <p className="mono text-[8px] uppercase tracking-[0.12em] text-danger/80">Heat impact</p>
        <p className="mt-1 text-[10px] text-muted">{spec.heat}. Current heat {Math.round(state.player.heat)}/100.</p>
      </div>
      <button
        className="btn btn-danger w-full"
        disabled={state.player.cash < cost || (op === "heist" && state.player.heat > 70)}
        onClick={() => {
          act((s) => underworldOp(s, op, activeTarget));
          onDone();
        }}
      >
        {op === "heist" && state.player.heat > 70 ? "Heat too high for a crew" : `Authorize · ${credits(cost)}`}
      </button>
    </div>
  );
}
