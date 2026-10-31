"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  FileText,
  Landmark,
  Scale,
  ScrollText,
  ShieldCheck,
  ThumbsUp,
  Vote,
} from "lucide-react";
import { useGame } from "../GameProvider";
import { Panel, Progress, SectionTitle, Stat } from "../ui";
import { credits } from "@/lib/format";
import { lobbyGovernment } from "@/lib/engine";

export function GovernmentView() {
  const { state, act } = useGame();
  if (!state) return null;
  const gov = state.government;
  const activeLaws = gov.laws.filter((l) => l.status === "active");
  const proposed = gov.laws.filter((l) => l.status === "proposed");
  const warrants = gov.warrants;
  const immunityCost = 240_000 * Math.max(1, warrants);

  const actions = [
    {
      id: "donate" as const,
      label: "Civic donation",
      icon: Banknote,
      cost: 100_000,
      detail: "Influence +4 · Reputation +1",
      desc: "Fund the Civic Renewal Fund. A plaque is engraved; access improves.",
      color: "#8fa8ff",
    },
    {
      id: "deregulate" as const,
      label: "Deregulation push",
      icon: Scale,
      cost: 180_000,
      detail: "62% · Regulation -7 · Heat -6",
      desc: "Argue that oversight is stagnation. The committee may agree.",
      color: "#c9ff4d",
    },
    {
      id: "subsidize" as const,
      label: "Property subsidy",
      icon: Landmark,
      cost: 140_000,
      detail: "Your holdings +4% · Influence +2",
      desc: "A targeted revaluation for parcels that happen to be yours.",
      color: "#ffb454",
    },
    {
      id: "immunity" as const,
      label: "Quash warrants",
      icon: ShieldCheck,
      cost: immunityCost,
      detail: warrants ? `${warrants} warrant(s) · Heat -30` : "No warrants open",
      desc: "Records are sealed. The file disappears; the favor does not.",
      color: "#ff7ab6",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-acid" />
            <p className="mono text-[9px] uppercase tracking-[0.26em] text-acid">Government & regulation</p>
          </div>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.035em] sm:text-[30px]">The city sells its own rules.</h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            Regulation reprices risk and suppresses crime. Taxes flow automatically from passive income. Influence
            buys attention; warrants buy silence. Elections reset the board every 48 days.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line/60 bg-abyss/60 px-3 py-2">
          <Vote className="h-4 w-4 text-ice" />
          <div>
            <p className="mono text-[8px] uppercase tracking-[0.12em] text-dim">Next election</p>
            <p className="mono text-[12px] text-ink">Day {gov.nextElection} · {Math.max(0, gov.nextElection - state.day)}d</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="Public approval" value={`${Math.round(gov.approval)}%`} accent={gov.approval > 50 ? "#63f7c3" : "#ffb454"} sub={<span className="text-muted">City council standing</span>} />
        <Stat label="Regulation" value={`${Math.round(gov.regulation)}/100`} accent={gov.regulation > 65 ? "#ff625c" : "#8fa8ff"} sub={<span className="text-muted">Compliance burden</span>} />
        <Stat label="City treasury" value={credits(gov.treasury, true)} accent="#c9ff4d" sub={<span className="text-muted">Tax receipts & fines</span>} />
        <Stat label="Open warrants" value={warrants} accent={warrants > 0 ? "#ff625c" : undefined} sub={<span className="text-muted">3 triggers settlement</span>} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Panel className="p-4 sm:p-5">
          <SectionTitle
            eyebrow="Legislative docket"
            title="Laws in force"
            icon={<ScrollText className="h-4 w-4" />}
            action={<span className="chip">{activeLaws.length} active · {proposed.length} proposed</span>}
          />
          <div className="mt-3 space-y-2.5">
            {[...activeLaws, ...proposed].map((law) => (
              <div key={law.id} className="rounded-lg border border-line/60 bg-abyss/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3 w-3 text-dim" />
                      <p className="text-[11.5px] font-semibold">{law.title}</p>
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted">{law.summary}</p>
                  </div>
                  <span className={`mono shrink-0 rounded px-1.5 py-0.5 text-[8px] uppercase ${law.status === "active" ? "bg-mint/10 text-mint" : "bg-ember/10 text-ember"}`}>
                    {law.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1">
                    <Progress value={law.votes} color={law.status === "active" ? "#63f7c3" : "#ffb454"} height={2.5} />
                  </div>
                  <span className="mono text-[8.5px] text-dim">{law.votes}% vote</span>
                </div>
                <p className="mono mt-1.5 text-[8.5px] text-dim">Effect: {law.effect}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <SectionTitle eyebrow="Influence desk" title="Buy the room" icon={<Landmark className="h-4 w-4" />} />
          <div className="mt-3 space-y-2">
            {actions.map((item) => {
              const Icon = item.icon;
              const disabled = state.player.cash < item.cost || (item.id === "immunity" && warrants === 0);
              return (
                <button
                  key={item.id}
                  disabled={disabled}
                  onClick={() => act((s) => lobbyGovernment(s, item.id))}
                  className="group w-full rounded-lg border border-line/60 bg-abyss/50 p-3 text-left transition-all hover:border-acid/30 hover:bg-acid/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: `${item.color}12`, color: item.color }}>
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold">{item.label}</p>
                        <span className="mono text-[9px] text-ink/60">{credits(item.cost, true)}</span>
                      </div>
                      <p className="mt-0.5 text-[9.5px] leading-relaxed text-muted">{item.desc}</p>
                      <p className="mono mt-1 text-[8px] uppercase tracking-[0.08em] text-acid/70">{item.detail}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 rounded-lg border border-ember/20 bg-ember/[0.04] p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember" />
              <p className="text-[10px] leading-relaxed text-muted">
                Every political action has a counterparty. Donations raise approval; deregulation raises risk.
                The city remembers who paid for what.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="p-4 sm:p-5 xl:col-span-2">
          <SectionTitle eyebrow="Fiscal policy" title="Where the money goes" icon={<Banknote className="h-4 w-4" />} />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              { label: "Transaction tax", value: `${(0.3).toFixed(2)}%`, note: "Charged on every DEX fill" },
              { label: "Passive income tax", value: `${gov.taxRate.toFixed(1)}%`, note: "Rent, bandwidth, media, staking" },
              { label: "Corporate tax", value: `${gov.corporateTax}%`, note: "Applied to listed-company revenue" },
              { label: "Regulatory burden", value: `${Math.round(gov.regulation)}/100`, note: "Raises compliance drag on prices" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-line/50 bg-abyss/40 p-3">
                <div className="flex items-center justify-between">
                  <p className="mono text-[8px] uppercase tracking-[0.12em] text-dim">{item.label}</p>
                  <p className="mono text-[13px] text-acid">{item.value}</p>
                </div>
                <p className="mt-1 text-[9.5px] text-muted">{item.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="mono text-[9px] text-muted">Approval trajectory</span>
              <span className="mono text-[9px] text-ink/60">{Math.round(gov.approval)}%</span>
            </div>
            <Progress value={gov.approval} color={gov.approval > 50 ? "#63f7c3" : "#ffb454"} height={5} className="mt-1.5" />
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <SectionTitle eyebrow="City state" title="Political weather" icon={<ThumbsUp className="h-4 w-4" />} />
          <div className="mt-3 space-y-3">
            <div className="rounded-lg border border-line/50 bg-abyss/40 p-3">
              <p className="mono text-[8px] uppercase tracking-[0.12em] text-dim">Mood</p>
              <p className="mt-1 text-[12px] font-medium">
                {gov.approval > 60 ? "Reformist momentum" : gov.approval > 40 ? "Governing by inertia" : "Incumbent fragility"}
              </p>
              <p className="mt-1 text-[9.5px] leading-relaxed text-muted">
                {gov.approval > 60
                  ? "The council is spending political capital. New regulation is easier to pass."
                  : gov.approval > 40
                    ? "Nobody is winning the argument. Backroom deals still clear."
                    : "A recall coalition is forming. Every favor is being repriced."}
              </p>
            </div>
            <div className="rounded-lg border border-line/50 bg-abyss/40 p-3">
              <p className="mono text-[8px] uppercase tracking-[0.12em] text-dim">Your standing</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-muted">Influence</span>
                <span className="mono text-[11px] text-ice">{Math.round(state.player.influence)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[10px] text-muted">Reputation</span>
                <span className="mono text-[11px] text-mint">{Math.round(state.player.reputation)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[10px] text-muted">Tax paid (all time)</span>
                <span className="mono text-[11px] text-ink/70">{credits(gov.treasury * 0.002, true)}</span>
              </div>
            </div>
            <button className="btn w-full justify-between text-[10px]" onClick={() => act((s) => lobbyGovernment(s, "donate"))}>
              Make a civic donation <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
