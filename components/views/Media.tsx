"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Clapperboard,
  Eye,
  Megaphone,
  Mic,
  Newspaper,
  Play,
  Radio,
  ShieldCheck,
  Sparkles,
  Tv,
  Users,
} from "lucide-react";
import { useGame } from "../GameProvider";
import { Modal, Panel, Progress, SectionTitle, Stat } from "../ui";
import { credits, compact, pct } from "@/lib/format";
import { launchMedia, produceShow, runCampaign } from "@/lib/engine";
import type { MediaOutlet } from "@/lib/types";

const KIND_ICONS = { tv: Tv, streaming: Play, news: Newspaper };

export function MediaView() {
  const { state } = useGame();
  const [launchOpen, setLaunchOpen] = useState(false);
  const [showOutlet, setShowOutlet] = useState<MediaOutlet | null>(null);
  const [campaignOutlet, setCampaignOutlet] = useState<MediaOutlet | null>(null);
  if (!state) return null;

  const own = state.media.filter((m) => m.ownerId === "player");
  const rival = state.media.filter((m) => m.ownerId !== "player");
  const totalReach = own.reduce((n, m) => n + m.reach, 0);
  const income = own.reduce((n, m) => n + Math.max(0, m.revenuePerDay - m.upkeep), 0);
  const avgCred = own.length ? own.reduce((n, m) => n + m.credibility, 0) / own.length : 0;
  const totalAudience = own.reduce((n, m) => n + m.shows.reduce((x, s) => x + s.audience, 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-acid" />
            <p className="mono text-[9px] uppercase tracking-[0.26em] text-acid">Media empire</p>
          </div>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.035em] sm:text-[30px]">Reality is a broadcast.</h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            Launch networks, produce shows, and move markets with narratives. Hype raises sentiment and price.
            Exposés destroy rivals but invite scrutiny. Credibility compounds; propaganda spends it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {own.length > 0 && (
            <button className="btn" onClick={() => setCampaignOutlet(own[0])}>
              <Megaphone className="h-3.5 w-3.5" /> Run campaign
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setLaunchOpen(true)}>
            <Radio className="h-3.5 w-3.5" /> Launch outlet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="Combined reach" value={`${Math.round(totalReach)}`} accent="#c9ff4d" sub={<span className="text-muted">Audience points</span>} />
        <Stat label="Media income" value={credits(income, true)} accent="#63f7c3" sub={<span className="text-muted">Per simulated day</span>} />
        <Stat label="Credibility" value={own.length ? `${Math.round(avgCred)}/100` : "—"} accent="#8fa8ff" sub={<span className="text-muted">Cross-outlet average</span>} />
        <Stat label="Live audience" value={compact(totalAudience)} accent="#ffb454" sub={<span className="text-muted">{own.reduce((n, m) => n + m.shows.length, 0)} productions</span>} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Panel className="p-4 sm:p-5">
          <SectionTitle
            eyebrow="Your portfolio"
            title="Broadcast assets"
            icon={<Radio className="h-4 w-4" />}
            action={<span className="chip">{own.length} outlets</span>}
          />
          {own.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-line/70 p-6 text-center">
              <Tv className="mx-auto h-6 w-6 text-dim" />
              <p className="mt-2 text-[12px] font-medium text-ink/80">You do not control a narrative yet.</p>
              <p className="mx-auto mt-1 max-w-sm text-[10.5px] leading-relaxed text-muted">
                A news desk costs ₡120K, a streaming platform ₡220K, and a TV network ₡460K. Each starts with
                reach and a daily operating cost.
              </p>
              <button className="btn btn-primary mt-3 py-1.5 text-[10.5px]" onClick={() => setLaunchOpen(true)}>
                Launch your first outlet
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {own.map((outlet) => {
                const Icon = KIND_ICONS[outlet.kind];
                const net = outlet.revenuePerDay - outlet.upkeep;
                return (
                  <div key={outlet.id} className="rounded-xl border border-line/60 bg-abyss/50 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-acid/10 text-acid">
                          <Icon className="h-4 w-4" strokeWidth={1.6} />
                        </div>
                        <div>
                          <p className="text-[12.5px] font-semibold">{outlet.name}</p>
                          <p className="mono mt-0.5 text-[8.5px] uppercase tracking-[0.1em] text-dim">{outlet.kind} · {outlet.shows.length} shows</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="mono text-[11px] text-mint">{credits(net, true)}</p>
                        <p className="mono text-[8px] text-dim">net / day</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div>
                        <p className="mono text-[7.5px] uppercase tracking-[0.1em] text-dim">Reach</p>
                        <p className="mono mt-0.5 text-[10.5px]">{Math.round(outlet.reach)}</p>
                        <Progress value={outlet.reach} color="#c9ff4d" height={2} className="mt-1" />
                      </div>
                      <div>
                        <p className="mono text-[7.5px] uppercase tracking-[0.1em] text-dim">Credibility</p>
                        <p className="mono mt-0.5 text-[10.5px]">{Math.round(outlet.credibility)}</p>
                        <Progress value={outlet.credibility} color="#8fa8ff" height={2} className="mt-1" />
                      </div>
                      <div>
                        <p className="mono text-[7.5px] uppercase tracking-[0.1em] text-dim">Hype</p>
                        <p className="mono mt-0.5 text-[10.5px]">{Math.round(outlet.hype)}</p>
                        <Progress value={outlet.hype} color="#ffb454" height={2} className="mt-1" />
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="btn flex-1 py-1.5 text-[10px]" onClick={() => setShowOutlet(outlet)}>
                        <Clapperboard className="h-3 w-3" /> Produce show
                      </button>
                      <button className="btn flex-1 py-1.5 text-[10px]" onClick={() => setCampaignOutlet(outlet)}>
                        <Megaphone className="h-3 w-3" /> Campaign
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {own.some((o) => o.shows.length > 0) && (
            <div className="mt-4">
              <p className="mono mb-2 text-[8px] uppercase tracking-[0.18em] text-dim">Now broadcasting</p>
              <div className="space-y-1.5">
                {own.flatMap((o) => o.shows.map((show) => ({ ...show, outlet: o.name }))).slice(0, 4).map((show) => (
                  <div key={show.id} className="flex items-center gap-3 rounded-lg border border-line/40 bg-abyss/30 px-3 py-2">
                    <Play className="h-3 w-3 shrink-0 text-mint" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10.5px] font-medium">{show.title}</p>
                      <p className="mono text-[8px] text-dim">{show.outlet} · Q{show.quality}</p>
                    </div>
                    <div className="text-right">
                      <p className="mono text-[9.5px] text-ink/70">{compact(show.audience)} viewers</p>
                      <p className="mono text-[8px] text-mint">{credits(show.revenue, true)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel className="p-4 sm:p-5">
          <SectionTitle eyebrow="Competitive landscape" title="Rival networks" icon={<Eye className="h-4 w-4" />} />
          <div className="mt-3 space-y-2.5">
            {rival.map((outlet) => {
              const Icon = KIND_ICONS[outlet.kind];
              return (
                <div key={outlet.id} className="rounded-lg border border-line/50 bg-abyss/40 p-3">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.03] text-muted">
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[11px] font-semibold">{outlet.name}</p>
                        <span className="mono text-[8.5px] text-dim">{Math.round(outlet.reach)} reach</span>
                      </div>
                      <p className="mono mt-0.5 text-[8px] text-dim">{outlet.ownerName} · credibility {Math.round(outlet.credibility)}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={outlet.reach} color="#ff7ab6" height={2.5} className="flex-1" />
                    <button className="btn btn-ghost px-1 py-0.5 text-[9px] text-danger" onClick={() => setCampaignOutlet(own[0] ?? null)}>
                      Target
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg border border-ember/20 bg-ember/[0.04] p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember" />
              <p className="text-[10px] leading-relaxed text-muted">
                Campaigns spend credibility. A network with reach but no trust can still move a price for a day —
                then the correction arrives.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line/60 px-4 py-3">
          <SectionTitle eyebrow="Market of attention" title="City media index" icon={<Users className="h-4 w-4" />} />
          <span className="mono text-[9px] text-dim">Ranked by reach</span>
        </div>
        <div className="divide-y divide-line/30">
          {[...state.media].sort((a, b) => b.reach - a.reach).map((outlet, index) => {
            const Icon = KIND_ICONS[outlet.kind];
            return (
              <div key={outlet.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="mono w-4 text-[9px] text-dim">{index + 1}</span>
                <Icon className="h-3.5 w-3.5 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[11px] ${outlet.ownerId === "player" ? "font-semibold text-acid" : "text-ink/85"}`}>{outlet.name}</p>
                  <p className="mono text-[8px] text-dim">{outlet.ownerName} · {outlet.kind}</p>
                </div>
                <div className="hidden w-28 sm:block">
                  <Progress value={outlet.reach} color={outlet.ownerId === "player" ? "#c9ff4d" : "#2b3a2f"} height={3} />
                </div>
                <span className="mono w-14 text-right text-[9.5px] text-muted">{Math.round(outlet.reach)} reach</span>
                <span className="mono hidden w-16 text-right text-[9.5px] text-ink/60 sm:block">{outlet.hype > 65 ? "loud" : "stable"}</span>
              </div>
            );
          })}
        </div>
      </Panel>

      <Modal open={launchOpen} onClose={() => setLaunchOpen(false)} eyebrow="Broadcast license" title="Launch a media outlet" width="max-w-lg">
        <LaunchForm onDone={() => setLaunchOpen(false)} />
      </Modal>

      <Modal open={!!showOutlet} onClose={() => setShowOutlet(null)} eyebrow="Production slate" title={`Produce for ${showOutlet?.name ?? "outlet"}`} width="max-w-md">
        {showOutlet && <ShowForm outlet={showOutlet} onDone={() => setShowOutlet(null)} />}
      </Modal>

      <Modal open={!!campaignOutlet} onClose={() => setCampaignOutlet(null)} eyebrow="Narrative operations" title={campaignOutlet ? `Campaign desk · ${campaignOutlet.name}` : "Campaign desk"} width="max-w-lg">
        {campaignOutlet ? (
          <CampaignForm outlet={campaignOutlet} onDone={() => setCampaignOutlet(null)} />
        ) : (
          <p className="text-[11px] text-muted">Launch an outlet before running a campaign.</p>
        )}
      </Modal>
    </div>
  );
}

function LaunchForm({ onDone }: { onDone: () => void }) {
  const { state, act } = useGame();
  const [kind, setKind] = useState<MediaOutlet["kind"]>("streaming");
  const [name, setName] = useState("");
  if (!state) return null;
  const specs = {
    news: { cost: 120_000, reach: 14, revenue: 3_400, upkeep: 1_500, label: "News Desk", icon: Newspaper, desc: "Cheap credibility. Slow reach. Investigative damage." },
    streaming: { cost: 220_000, reach: 22, revenue: 6_200, upkeep: 2_600, label: "Streaming", icon: Play, desc: "Young audience. High hype ceiling. Content-hungry." },
    tv: { cost: 460_000, reach: 38, revenue: 13_500, upkeep: 5_200, label: "TV Network", icon: Tv, desc: "Mass reach. Expensive operations. Impossible to ignore." },
  } as const;
  const spec = specs[kind];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(specs) as MediaOutlet["kind"][]).map((key) => {
          const item = specs[key];
          const Icon = item.icon;
          const active = kind === key;
          return (
            <button
              key={key}
              onClick={() => setKind(key)}
              className={`rounded-lg border p-2.5 text-left transition-colors ${active ? "border-acid/40 bg-acid/[0.06]" : "border-line/60 bg-abyss/50 hover:border-line-bright"}`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-acid" : "text-muted"}`} />
              <p className="mt-2 text-[10.5px] font-semibold">{item.label}</p>
              <p className="mono mt-0.5 text-[8.5px] text-dim">{credits(item.cost, true)}</p>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] leading-relaxed text-muted">{spec.desc}</p>
      <div>
        <label className="mono mb-1 block text-[8.5px] uppercase tracking-[0.14em] text-dim">Outlet name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Static Channel" maxLength={34} />
      </div>
      <div className="rounded-lg border border-line/60 bg-abyss/50 p-3 space-y-1 text-[10px]">
        <div className="flex justify-between"><span className="text-muted">License & launch</span><span className="mono">{credits(spec.cost)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Starting reach</span><span className="mono text-acid">{spec.reach}</span></div>
        <div className="flex justify-between"><span className="text-muted">Operating cost</span><span className="mono text-danger">{credits(spec.upkeep)}/day</span></div>
      </div>
      <button
        className="btn btn-primary w-full"
        disabled={state.player.cash < spec.cost}
        onClick={() => {
          act((s) => launchMedia(s, kind, name));
          onDone();
        }}
      >
        <Radio className="h-3.5 w-3.5" /> {state.player.cash < spec.cost ? "Insufficient capital" : "Sign broadcast license"}
      </button>
    </div>
  );
}

function ShowForm({ outlet, onDone }: { outlet: MediaOutlet; onDone: () => void }) {
  const { state, act } = useGame();
  const [title, setTitle] = useState("");
  if (!state) return null;
  return (
    <div className="space-y-3">
      <p className="text-[10.5px] leading-relaxed text-muted">
        Production costs ₡28,000. Quality is driven by reputation and randomness; a hit grows reach and recurring
        revenue. A flop still teaches the market your name.
      </p>
      <div>
        <label className="mono mb-1 block text-[8.5px] uppercase tracking-[0.14em] text-dim">Working title</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Night Ledger" maxLength={42} autoFocus />
      </div>
      <div className="rounded-lg border border-line/60 bg-abyss/50 p-3 text-[10px]">
        <div className="flex justify-between"><span className="text-muted">Current reach</span><span className="mono">{Math.round(outlet.reach)}</span></div>
        <div className="mt-1 flex justify-between"><span className="text-muted">Reputation boost</span><span className="mono text-mint">+{Math.round(state.player.reputation / 8)} quality</span></div>
        <div className="mt-1 flex justify-between"><span className="text-muted">Production budget</span><span className="mono text-danger">₡28,000</span></div>
      </div>
      <button
        className="btn btn-primary w-full"
        disabled={state.player.cash < 28_000}
        onClick={() => {
          act((s) => produceShow(s, outlet.id, title));
          onDone();
        }}
      >
        <Clapperboard className="h-3.5 w-3.5" /> Greenlight production
      </button>
    </div>
  );
}

function CampaignForm({ outlet, onDone }: { outlet: MediaOutlet; onDone: () => void }) {
  const { state, act } = useGame();
  const [mode, setMode] = useState<"hype" | "expose">("hype");
  const [target, setTarget] = useState(state?.tokens.find((t) => !t.rugged)?.id ?? "");
  if (!state) return null;
  const cost = mode === "hype" ? 45_000 : 65_000;
  const power = (outlet.reach / 55) * (state.player.archetype === "mogul" ? 1.3 : 1);
  const expected = (mode === "hype" ? 1 : -1) * 4.8 * power;
  const allTargets = [
    ...state.tokens.filter((t) => !t.rugged).map((t) => ({ id: t.id, label: `${t.symbol} · token`, note: `${marketLabel(t.change24h)}` })),
    ...state.corporations.map((c) => ({ id: c.id, label: `${c.ticker} · equity`, note: `sentiment ${Math.round(c.sentiment)}` })),
  ];
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["hype", "expose"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={`flex-1 rounded-lg border p-2.5 text-left transition-colors ${mode === value ? (value === "hype" ? "border-mint/40 bg-mint/[0.06]" : "border-danger/40 bg-danger/[0.06]") : "border-line/60 bg-abyss/50"}`}
          >
            <p className={`text-[11px] font-semibold capitalize ${mode === value ? (value === "hype" ? "text-mint" : "text-danger") : ""}`}>{value}</p>
            <p className="mono mt-0.5 text-[8.5px] text-dim">{value === "hype" ? "Push price & sentiment up" : "Damage price & credibility"}</p>
          </button>
        ))}
      </div>
      <div>
        <label className="mono mb-1 block text-[8.5px] uppercase tracking-[0.14em] text-dim">Target</label>
        <select className="input select" value={target} onChange={(e) => setTarget(e.target.value)}>
          {allTargets.map((t) => (
            <option key={t.id} value={t.id} className="bg-panel">
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-lg border border-line/60 bg-abyss/50 p-3 space-y-1 text-[10px]">
        <div className="flex justify-between"><span className="text-muted">Campaign budget</span><span className="mono">{credits(cost)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Outlet reach</span><span className="mono">{Math.round(outlet.reach)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Projected swing</span><span className={`mono ${expected >= 0 ? "text-mint" : "text-danger"}`}>{pct(expected, 1)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Credibility cost</span><span className="mono text-ember">{mode === "hype" ? "-2" : "+3"}</span></div>
      </div>
      <button
        className={`btn w-full ${mode === "hype" ? "btn-primary" : "btn-danger"}`}
        disabled={state.player.cash < cost || !target}
        onClick={() => {
          act((s) => runCampaign(s, outlet.id, target, mode));
          onDone();
        }}
      >
        <Megaphone className="h-3.5 w-3.5" /> Launch {mode} campaign
      </button>
      <p className="flex items-center justify-center gap-1 text-[9px] text-dim">
        <Sparkles className="h-2.5 w-2.5" /> Every narrative has a correction.
      </p>
    </div>
  );
}

function marketLabel(change: number): string {
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}% 24h`;
}
