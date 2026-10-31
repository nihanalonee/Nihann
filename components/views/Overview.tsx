"use client";

import {
  Activity,
  ArrowUpRight,
  Banknote,
  Building2,
  CircleDollarSign,
  Cpu,
  Flame,
  Gauge,
  Landmark,
  LineChart,
  MessageSquare,
  Radio,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useGame } from "../GameProvider";
import { Delta, Panel, Progress, SectionTitle, Sparkline, Stat } from "../ui";
import { credits, compact, heatLabel, initials, pct, price, timeAgo } from "@/lib/format";
import { computeNetWorth, ARCHETYPES } from "@/lib/seed";
import { totalPassiveIncome } from "@/lib/engine";
import type { ViewId } from "@/lib/types";

export function OverviewView({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const { state, aiMode, aiBusy, summonEvent } = useGame();
  if (!state) return null;
  const worth = computeNetWorth(state);
  const history = state.player.netWorthHistory;
  const first = history[0]?.value ?? worth;
  const totalReturn = ((worth - first) / Math.max(1, first)) * 100;
  const passive = totalPassiveIncome(state);
  const activeEvents = state.events.filter((e) => e.expires >= state.day).slice(0, 3);

  const holdings = [
    ...Object.entries(state.player.holdings)
      .filter(([, amount]) => amount > 0)
      .map(([id, amount]) => {
        const token = state.tokens.find((t) => t.id === id);
        return token
          ? {
              id,
              label: token.symbol,
              name: token.name,
              amount,
              value: amount * token.price,
              change: token.change24h,
              color: token.color,
              kind: "Token",
            }
          : null;
      }),
    ...Object.entries(state.player.stocks)
      .filter(([, shares]) => shares > 0)
      .map(([id, shares]) => {
        const corp = state.corporations.find((c) => c.id === id);
        return corp
          ? {
              id,
              label: corp.ticker,
              name: corp.name,
              amount: shares,
              value: shares * corp.sharePrice,
              change: ((corp.history.at(-1)! - corp.history.at(-2)!) / corp.history.at(-2)!) * 100,
              color: corp.color,
              kind: "Equity",
            }
          : null;
      }),
  ]
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => b.value - a.value);

  const leader = [...state.agents]
    .map((a) => ({ ...a, isPlayer: false }))
    .concat([
      {
        id: "player",
        name: state.player.name,
        title: ARCHETYPES[state.player.archetype].label,
        role: "tycoon" as const,
        hue: 78,
        wealth: worth,
        aggression: 50,
        sentiment: 50,
        lastAction: "",
        status: "",
        isPlayer: true,
      },
    ])
    .sort((a, b) => b.wealth - a.wealth)
    .slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-acid" />
            <p className="mono text-[9px] uppercase tracking-[0.26em] text-acid">Command center</p>
          </div>
          <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.035em] sm:text-[32px]">
            The city is open, {state.player.name.split(" ")[0]}.
          </h1>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted">
            Day {state.day}. {activeEvents.length} active world event{activeEvents.length === 1 ? "" : "s"}. Your
            rivals made {state.day > 1 ? "their move" : "their introductions"}. What does yours look like?
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn" onClick={() => onNavigate("city")}>
            <Building2 className="h-3.5 w-3.5" /> Buy property
          </button>
          <button className="btn" onClick={() => onNavigate("markets")}>
            <LineChart className="h-3.5 w-3.5" /> Trade
          </button>
          <button className="btn btn-primary" onClick={summonEvent} disabled={aiBusy}>
            <Sparkles className="h-3.5 w-3.5" />
            {aiBusy ? "Consulting…" : "Summon event"}
          </button>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat
          label="Net worth"
          value={credits(worth, true)}
          accent="#c9ff4d"
          sub={
            <span className={`mono ${totalReturn >= 0 ? "text-mint" : "text-danger"}`}>
              {pct(totalReturn)} since arrival
            </span>
          }
        />
        <Stat
          label="Liquid cash"
          value={credits(state.player.cash, true)}
          sub={<span className="text-muted">Available for deployment</span>}
        />
        <Stat
          label="Passive / day"
          value={credits(passive, true)}
          accent="#63f7c3"
          sub={<span className="text-muted">Rent · bandwidth · media</span>}
        />
        <Stat
          label="Heat level"
          value={heatLabel(state.player.heat)}
          accent={state.player.heat > 70 ? "#ff625c" : state.player.heat > 40 ? "#ffb454" : "#63f7c3"}
          sub={
            <div className="flex items-center gap-2">
              <Progress
                value={state.player.heat}
                color={state.player.heat > 70 ? "#ff625c" : state.player.heat > 40 ? "#ffb454" : "#63f7c3"}
                className="flex-1"
              />
              <span className="mono text-[9px]">{Math.round(state.player.heat)}</span>
            </div>
          }
        />
      </div>

      {/* Chart + World engine */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel className="scanlines overflow-hidden p-4 sm:p-5">
          <SectionTitle
            eyebrow="Empire value"
            title="Net worth trajectory"
            action={
              <div className="flex items-center gap-2">
                <span className="chip border-acid/20 text-acid">
                  <span className="h-1 w-1 rounded-full bg-acid" /> live
                </span>
                <button className="btn btn-ghost px-2 py-1 text-[10px]" onClick={() => onNavigate("markets")}>
                  Open markets <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            }
          />
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mono text-[34px] font-semibold leading-none tracking-[-0.03em]">{credits(worth)}</p>
              <div className="mt-2 flex items-center gap-2">
                <Delta value={totalReturn} />
                <span className="mono text-[10px] text-dim">
                  {history.length > 1 ? `${history.length} recorded days` : "arrival day"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-right">
              <div>
                <p className="mono text-[8px] uppercase tracking-[0.14em] text-dim">Influence</p>
                <p className="mono mt-0.5 text-[12px] text-ice">{Math.round(state.player.influence)}</p>
              </div>
              <div>
                <p className="mono text-[8px] uppercase tracking-[0.14em] text-dim">Reputation</p>
                <p className="mono mt-0.5 text-[12px] text-mint">{Math.round(state.player.reputation)}</p>
              </div>
              <div>
                <p className="mono text-[8px] uppercase tracking-[0.14em] text-dim">Economy</p>
                <p className="mono mt-0.5 text-[12px] text-ember">{Math.round(state.economy)}</p>
              </div>
            </div>
          </div>
          <div className="relative mt-5">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-t border-dashed border-line/40" />
              ))}
            </div>
            <Sparkline
              data={history.length > 1 ? history.map((h) => h.value) : [worth, worth]}
              width={720}
              height={180}
              color="#c9ff4d"
              strokeWidth={1.8}
              className="relative h-[170px] w-full"
            />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line/40 pt-2.5">
            <span className="mono text-[9px] text-dim">
              Day {history[0]?.day ?? state.day} → Day {history.at(-1)?.day ?? state.day}
            </span>
            <span className="mono text-[9px] text-dim">
              PASSIVE {credits(passive, true)} / day
            </span>
          </div>
        </Panel>

        <Panel className="flex flex-col p-4 sm:p-5">
          <SectionTitle
            eyebrow="World engine"
            title="Active disruptions"
            icon={<Cpu className="h-4 w-4" />}
            action={
              <span className={`chip ${aiMode === "grok" ? "border-mint/25 text-mint" : "border-ember/25 text-ember"}`}>
                <span className={`h-1 w-1 rounded-full ${aiMode === "grok" ? "bg-mint" : "bg-ember"}`} />
                {aiMode === "grok" ? "Grok live" : "Local sim"}
              </span>
            }
          />
          <div className="mt-3.5 flex-1 space-y-2.5">
            {activeEvents.length === 0 && (
              <div className="rounded-lg border border-line/60 bg-abyss/50 p-4 text-center">
                <Shield className="mx-auto h-5 w-5 text-dim" />
                <p className="mt-2 text-[11.5px] text-muted">The city is quiet. That never lasts.</p>
              </div>
            )}
            {activeEvents.map((event) => (
              <div key={event.id} className="rounded-lg border border-line/60 bg-abyss/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-semibold leading-snug text-ink">{event.title}</p>
                  <span
                    className={`mono shrink-0 rounded px-1.5 py-0.5 text-[8px] uppercase tracking-[0.1em] ${
                      event.severity === "critical" || event.severity === "black-swan"
                        ? "bg-danger/15 text-danger"
                        : event.severity === "major"
                          ? "bg-ember/15 text-ember"
                          : "bg-ice/15 text-ice"
                    }`}
                  >
                    {event.severity}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-muted">{event.description}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="mono text-[8.5px] uppercase tracking-[0.1em] text-dim">
                    {event.category} · {Math.max(0, event.expires - state.day)}d left
                  </span>
                  <span className={`mono text-[8.5px] ${event.pulse >= 0 ? "text-mint" : "text-danger"}`}>
                    {event.pulse >= 0 ? "+" : ""}
                    {event.pulse.toFixed(0)} mkt
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={summonEvent}
            disabled={aiBusy}
            className="btn mt-3 w-full justify-between border-acid/25 bg-acid/[0.06] text-acid hover:bg-acid/10"
          >
            <span className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              {aiBusy ? "World engine thinking…" : "Consult the world engine"}
            </span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
          <p className="mt-2 text-center text-[9px] leading-relaxed text-dim">
            {aiMode === "grok"
              ? "Grok is generating events from live server state."
              : "Set GROK_API_KEY to replace the deterministic fallback with live AI."}
          </p>
        </Panel>
      </div>

      {/* Portfolio + leaderboard + district pulse */}
      <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr_1fr]">
        <Panel className="p-4 sm:p-5">
          <SectionTitle
            eyebrow="Exposure"
            title="Your positions"
            action={
              <button className="btn btn-ghost px-1.5 py-1 text-[10px]" onClick={() => onNavigate("markets")}>
                Trade <ArrowUpRight className="h-3 w-3" />
              </button>
            }
          />
          <div className="mt-3 space-y-1">
            {holdings.length === 0 && (
              <div className="rounded-lg border border-dashed border-line/70 p-5 text-center">
                <LineChart className="mx-auto h-5 w-5 text-dim" />
                <p className="mt-2 text-[11px] text-muted">No market exposure yet.</p>
                <button className="btn mt-2 py-1 text-[10px]" onClick={() => onNavigate("markets")}>
                  Open a position
                </button>
              </div>
            )}
            {holdings.slice(0, 5).map((holding) => (
              <div key={`${holding.kind}-${holding.id}`} className="flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-white/[0.025]">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[9px] font-bold"
                  style={{ background: `${holding.color}18`, color: holding.color }}
                >
                  {holding.label.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-[11.5px] font-semibold">{holding.label}</p>
                    <span className="mono text-[8px] uppercase text-dim">{holding.kind}</span>
                  </div>
                  <p className="mono truncate text-[9px] text-dim">
                    {holding.amount < 1 ? holding.amount.toFixed(4) : compact(holding.amount, 2)} units
                  </p>
                </div>
                <div className="text-right">
                  <p className="mono text-[11px]">{credits(holding.value, true)}</p>
                  <p className={`mono text-[9px] ${holding.change >= 0 ? "text-mint" : "text-danger"}`}>
                    {holding.change >= 0 ? "+" : ""}
                    {holding.change.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line/40 pt-3">
            <div className="rounded-lg bg-abyss/50 p-2.5">
              <p className="mono text-[8px] uppercase tracking-[0.12em] text-dim">Properties</p>
              <p className="mono mt-1 text-[13px] text-ink">{state.player.properties.length}</p>
            </div>
            <div className="rounded-lg bg-abyss/50 p-2.5">
              <p className="mono text-[8px] uppercase tracking-[0.12em] text-dim">Debt</p>
              <p className="mono mt-1 text-[13px] text-danger">
                {credits(state.player.loans.reduce((n, l) => n + l.outstanding, 0), true)}
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <SectionTitle
            eyebrow="The hierarchy"
            title="City wealth index"
            icon={<Users className="h-4 w-4" />}
            action={<span className="mono text-[9px] text-dim">TOP 6</span>}
          />
          <div className="mt-3 space-y-1">
            {leader.map((person, index) => (
              <div
                key={person.id}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 ${
                  person.isPlayer ? "bg-acid/[0.07] ring-1 ring-inset ring-acid/20" : "hover:bg-white/[0.025]"
                }`}
              >
                <span className="mono w-3 text-[9px] text-dim">{index + 1}</span>
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-bold"
                  style={{
                    background: `hsl(${person.hue} 60% 40% / 0.18)`,
                    color: `hsl(${person.hue} 80% 68%)`,
                  }}
                >
                  {initials(person.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[11px] ${person.isPlayer ? "font-semibold text-acid" : "text-ink/90"}`}>
                    {person.name}
                  </p>
                  <p className="mono truncate text-[8.5px] text-dim">{person.title}</p>
                </div>
                <span className="mono text-[10px] text-ink/70">{credits(person.wealth, true)}</span>
              </div>
            ))}
          </div>
          <button
            className="btn btn-ghost mt-2 w-full justify-between px-1 text-[10px]"
            onClick={() => onNavigate("underworld")}
          >
            View criminal syndicates <ArrowUpRight className="h-3 w-3" />
          </button>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <SectionTitle
            eyebrow="Real estate"
            title="District pulse"
            icon={<Building2 className="h-4 w-4" />}
            action={
              <button className="btn btn-ghost px-1.5 py-1 text-[10px]" onClick={() => onNavigate("city")}>
                All districts
              </button>
            }
          />
          <div className="mt-3 space-y-2">
            {state.districts.slice(0, 5).map((district) => {
              const change = ((district.history.at(-1)! - district.history.at(-2)!) / district.history.at(-2)!) * 100;
              return (
                <div key={district.id} className="group">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: district.color }} />
                      <p className="truncate text-[11px] text-ink/90">{district.name}</p>
                      {district.ownerId === "player" && <span className="chip border-acid/25 px-1.5 py-0 text-[7px] text-acid">owned</span>}
                    </div>
                    <div className="text-right">
                      <p className="mono text-[10px]">{credits(district.price, true)}</p>
                      <p className={`mono text-[8px] ${change >= 0 ? "text-mint" : "text-danger"}`}>
                        {pct(change, 1)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress
                      value={district.crime}
                      color={district.crime > 60 ? "#ff625c" : district.crime > 30 ? "#ffb454" : "#63f7c3"}
                      height={2.5}
                      className="flex-1"
                    />
                    <span className="mono w-9 text-right text-[7.5px] text-dim">CR {Math.round(district.crime)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* AI masterminds + wire */}
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Panel className="p-4 sm:p-5">
          <SectionTitle
            eyebrow="Autonomous rivals"
            title="The masterminds"
            icon={<Cpu className="h-4 w-4" />}
            action={
              <span className="chip border-mint/20 text-mint">
                <span className="h-1 w-1 rounded-full bg-mint pulse-dot" /> {state.agents.length} active
              </span>
            }
          />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {state.agents.slice(0, 4).map((agent) => (
              <div key={agent.id} className="rounded-lg border border-line/60 bg-abyss/50 p-3">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold"
                    style={{
                      background: `hsl(${agent.hue} 65% 45% / 0.16)`,
                      color: `hsl(${agent.hue} 85% 70%)`,
                      boxShadow: `inset 0 0 0 1px hsl(${agent.hue} 65% 45% / 0.25)`,
                    }}
                  >
                    {initials(agent.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11.5px] font-semibold">{agent.name}</p>
                    <p className="mono truncate text-[8.5px] text-dim">{agent.title} · {agent.status}</p>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-muted">{agent.lastAction}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="mono text-[8.5px] text-dim">AGR {agent.aggression}</span>
                  <span className="mono text-[9px] text-ink/60">{credits(agent.wealth, true)}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4 sm:p-5">
          <SectionTitle
            eyebrow="The wire"
            title="City transmissions"
            icon={<MessageSquare className="h-4 w-4" />}
            action={
              <button className="btn btn-ghost px-1.5 py-1 text-[10px]" onClick={() => onNavigate("wire")}>
                Open feed
              </button>
            }
          />
          <div className="mt-3 space-y-3">
            {state.wire.slice(0, 3).map((post) => (
              <div key={post.id} className="border-b border-line/40 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[10.5px] font-semibold text-ink/90">{post.author}</p>
                  {post.verified && <Shield className="h-2.5 w-2.5 text-mint" />}
                  <span className="mono text-[8px] text-dim">@{post.handle.replace(/^@/, "")} · {timeAgo(post.day, state.day)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-muted">{post.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-lg bg-abyss/50 p-2.5">
            <MessageSquare className="h-3.5 w-3.5 text-acid" />
            <p className="text-[9.5px] text-dim">Every post moves sentiment. Enough sentiment moves markets.</p>
          </div>
        </Panel>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/40 bg-abyss/35 px-3 py-2.5">
        <p className="mono text-[9px] uppercase tracking-[0.14em] text-dim">
          {ARCHETYPES[state.player.archetype].label} path · {state.player.perks.join(" · ")}
        </p>
        <p className="mono flex items-center gap-1.5 text-[9px] text-dim">
          <Users className="h-3 w-3" /> 2,481,092 citizens simulated
          <span className="mx-1 h-2.5 w-px bg-line" />
          <Activity className="h-3 w-3" /> tick {state.day}
        </p>
      </div>
    </div>
  );
}
