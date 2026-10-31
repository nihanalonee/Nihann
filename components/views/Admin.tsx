"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Coins,
  Download,
  Flame,
  RotateCcw,
  ShieldOff,
  Skull,
  Sparkles,
  TerminalSquare,
  Zap,
} from "lucide-react";
import { useGame } from "../GameProvider";
import { Panel, Progress, SectionTitle, Stat } from "../ui";
import { credits } from "@/lib/format";
import { adminAction } from "@/lib/engine";
import { computeNetWorth } from "@/lib/seed";

export function AdminView() {
  const { state, act, resetGame } = useGame();
  const [tokenId, setTokenId] = useState(state?.tokens[0]?.id ?? "omni");
  if (!state?.adminUnlocked) {
    return (
      <Panel className="p-8 text-center">
        <TerminalSquare className="mx-auto h-7 w-7 text-dim" />
        <p className="mt-3 text-[13px] font-semibold">God Mode is restricted.</p>
        <p className="mt-1 text-[11px] text-muted">This identity is not on the server-side allowlist.</p>
      </Panel>
    );
  }

  const worth = computeNetWorth(state);

  const exportSave = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `omnilife-save-day-${state.day}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-danger" />
            <p className="mono text-[9px] uppercase tracking-[0.26em] text-danger">God mode / server admin</p>
          </div>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.035em] sm:text-[30px]">The author&apos;s console.</h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            Direct state overrides for the single-player simulation. Access is granted by a server-side email
            allowlist. This is a fictional terminal, not a production admin plane.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={exportSave}>
            <Download className="h-3.5 w-3.5" /> Export save
          </button>
          <button className="btn btn-danger" onClick={resetGame}>
            <RotateCcw className="h-3.5 w-3.5" /> Erase timeline
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="Cash" value={credits(state.player.cash, true)} accent="#c9ff4d" />
        <Stat label="Net worth" value={credits(worth, true)} accent="#63f7c3" />
        <Stat label="Heat" value={`${Math.round(state.player.heat)}/100`} accent={state.player.heat > 70 ? "#ff625c" : "#ffb454"} />
        <Stat label="Warrants" value={state.government.warrants} accent={state.government.warrants > 0 ? "#ff625c" : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Panel className="p-4 sm:p-5">
          <SectionTitle eyebrow="Root commands" title="World override" icon={<TerminalSquare className="h-4 w-4" />} />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              { label: "Spawn ₡10,000,000", icon: Coins, color: "#c9ff4d", hint: "Credits your personal account", run: () => act((s) => adminAction(s, "grant")) },
              { label: "Scrub identity", icon: ShieldOff, color: "#63f7c3", hint: "Heat 0 · warrants 0 · rep 90", run: () => act((s) => adminAction(s, "clear")) },
              { label: "Advance 5 days", icon: CalendarClock, color: "#8fa8ff", hint: "Runs five full world ticks", run: () => act((s) => adminAction(s, "advance")) },
              { label: "Cripple a rival", icon: Skull, color: "#ff625c", hint: "Random mastermind loses 42%", run: () => act((s) => adminAction(s, "collapse")) },
              { label: "Inject world event", icon: Sparkles, color: "#ffb454", hint: "Random macroeconomic shock", run: () => act((s) => adminAction(s, "event")) },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.run}
                  className="group rounded-xl border border-line/60 bg-abyss/50 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-acid/30 hover:bg-acid/[0.03]"
                >
                  <Icon className="h-4 w-4" style={{ color: item.color }} strokeWidth={1.6} />
                  <p className="mt-2 text-[11px] font-semibold">{item.label}</p>
                  <p className="mono mt-0.5 text-[8.5px] text-dim">{item.hint}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-line/60 bg-abyss/50 p-3">
            <p className="mono text-[8px] uppercase tracking-[0.14em] text-dim">Market override</p>
            <select className="input select mt-2" value={tokenId} onChange={(e) => setTokenId(e.target.value)}>
              {state.tokens.map((t) => (
                <option key={t.id} value={t.id} className="bg-panel">{t.symbol} · {t.name}</option>
              ))}
            </select>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button className="btn border-mint/25 bg-mint/[0.06] text-mint hover:bg-mint/10" onClick={() => act((s) => adminAction(s, "pump", tokenId))}>
                <ArrowUpRight className="h-3.5 w-3.5" /> Pump +80%
              </button>
              <button className="btn btn-danger" onClick={() => act((s) => adminAction(s, "crash", tokenId))}>
                <ArrowDownRight className="h-3.5 w-3.5" /> Crash -58%
              </button>
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-4 sm:p-5">
            <SectionTitle eyebrow="Diagnostics" title="Live state" icon={<Zap className="h-4 w-4" />} />
            <div className="mt-3 space-y-2">
              {[
                { label: "Simulation day", value: state.day },
                { label: "Economy index", value: `${Math.round(state.economy)}/100` },
                { label: "Regulation", value: `${Math.round(state.government.regulation)}/100` },
                { label: "Active events", value: state.events.filter((e) => e.expires >= state.day).length },
                { label: "Tokens live", value: state.tokens.filter((t) => !t.rugged).length },
                { label: "Wire posts", value: state.wire.length },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-line/30 pb-1.5 last:border-0">
                  <span className="mono text-[9px] text-muted">{row.label}</span>
                  <span className="mono text-[10px] text-ink/80">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <span className="mono text-[9px] text-muted">Heat</span>
                <span className="mono text-[9px] text-ink/60">{Math.round(state.player.heat)}</span>
              </div>
              <Progress value={state.player.heat} color="#ff625c" height={4} className="mt-1.5" />
            </div>
          </Panel>

          <Panel className="border-danger/25 p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <div>
                <p className="text-[11px] font-semibold text-danger">Operational security note</p>
                <p className="mt-1 text-[9.5px] leading-relaxed text-muted">
                  The original design document contained a live Grok API key and an email-based backdoor. The key
                  was never committed; it must be rotated. This build checks admin access against an environment
                  allowlist, and all world state is stored client-side for the demo. Production requires Supabase
                  Auth, signed server claims, and row-level security.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel className="p-4">
        <SectionTitle eyebrow="Save file" title="Persistence" icon={<Flame className="h-4 w-4" />} />
        <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
          Your save is stored in this browser under <span className="mono text-ink/70">omnilife-syndicate-save-v1</span>.
          The simulation advances in real time while the tab is open. Exporting a save produces a portable JSON
          snapshot of the entire world.
        </p>
        <div className="mono mt-2 flex flex-wrap gap-3 text-[8.5px] text-dim">
          <span>SCHEMA v1</span>
          <span>{state.tokens.length} TOKENS</span>
          <span>{state.corporations.length} EQUITIES</span>
          <span>{state.isps.length} NETWORK NODES</span>
          <span>{state.banks.length} BANKS</span>
        </div>
      </Panel>
    </div>
  );
}
