"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Flame,
  Heart,
  MessageCircle,
  MessageSquare,
  Radio,
  Repeat2,
  Send,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { useGame } from "../GameProvider";
import { Panel, Progress, SectionTitle, Stat } from "../ui";
import { compact, initials, timeAgo } from "@/lib/format";
import { postToWire } from "@/lib/engine";

type Filter = "all" | "markets" | "power" | "you";

function hueFor(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

export function WireView() {
  const { state, act } = useGame();
  const [filter, setFilter] = useState<Filter>("all");
  const [body, setBody] = useState("");
  if (!state) return null;

  const posts = state.wire.filter((post) => {
    if (filter === "you") return post.player;
    if (filter === "markets") return post.tags.some((t) => ["market", "finance", "crypto", "token", "equity", "realestate"].includes(t)) || /token|market|bank|crypto|price/i.test(post.body);
    if (filter === "power") return post.tags.some((t) => ["crime", "underworld", "security", "policy", "warrant", "media"].includes(t));
    return true;
  });

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    state.wire.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7);
  }, [state.wire]);

  const sentiment = state.wire.slice(0, 20).reduce((n, p) => n + p.sentiment, 0) / Math.max(1, Math.min(20, state.wire.length));
  const voices = [...state.agents].sort((a, b) => b.wealth - a.wealth).slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-acid" />
            <p className="mono text-[9px] uppercase tracking-[0.26em] text-acid">The wire</p>
          </div>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.035em] sm:text-[30px]">The city talks to itself.</h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            A live feed of market tips, scandals, and manufactured consensus. Every post carries sentiment. Enough
            sentiment becomes a price. Your own transmissions enter the same stream.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip border-mint/20 text-mint">
            <span className="h-1 w-1 rounded-full bg-mint pulse-dot" /> live feed
          </span>
          <span className="chip">{state.wire.length} transmissions</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="City sentiment" value={sentiment >= 0 ? "Risk-on" : "Risk-off"} accent={sentiment >= 0 ? "#63f7c3" : "#ff625c"} sub={<span className="text-muted">{(sentiment * 100).toFixed(0)} net score</span>} />
        <Stat label="Verified voices" value={state.wire.filter((p) => p.verified).length} sub={<span className="text-muted">Institutional accounts</span>} />
        <Stat label="Your transmissions" value={state.wire.filter((p) => p.player).length} accent="#c9ff4d" sub={<span className="text-muted">Posts attributed to you</span>} />
        <Stat label="Trending tags" value={tags.length} accent="#8fa8ff" sub={<span className="text-muted">Across the last {state.wire.length} posts</span>} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Panel className="overflow-hidden">
          <div className="border-b border-line/60 p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-acid/25 bg-acid/10 text-[10px] font-bold text-acid">
                {initials(state.player.name)}
              </div>
              <div className="flex-1">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value.slice(0, 280))}
                  placeholder="Transmit something the city can trade on…"
                  rows={2}
                  className="input min-h-[54px] resize-none border-0 bg-transparent px-0 py-1 text-[12px] focus:shadow-none"
                />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-line/40 pt-2">
              <span className="mono text-[8.5px] text-dim">
                {body.length}/280 · posted as <span className="text-muted">@{state.player.handle}</span>
              </span>
              <button
                className="btn btn-primary py-1.5 text-[10px]"
                disabled={body.trim().length < 2}
                onClick={() => {
                  act((s) => postToWire(s, body));
                  setBody("");
                }}
              >
                <Send className="h-3 w-3" /> Transmit
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 border-b border-line/40 px-4 py-2">
            {([
              { id: "all", label: "All signals" },
              { id: "markets", label: "Markets" },
              { id: "power", label: "Power" },
              { id: "you", label: "You" },
            ] as { id: Filter; label: string }[]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors ${filter === tab.id ? "bg-line-bright/60 text-ink" : "text-muted hover:text-ink"}`}
              >
                {tab.label}
              </button>
            ))}
            <span className="mono ml-auto flex items-center gap-1 text-[8.5px] text-dim">
              <Activity className="h-2.5 w-2.5" /> live
            </span>
          </div>

          <div className="max-h-[calc(100vh-290px)] divide-y divide-line/30 overflow-y-auto">
            {posts.length === 0 && (
              <div className="p-8 text-center">
                <MessageSquare className="mx-auto h-5 w-5 text-dim" />
                <p className="mt-2 text-[11px] text-muted">No transmissions under this filter.</p>
              </div>
            )}
            {posts.slice(0, 30).map((post) => {
              const hue = post.player ? 78 : hueFor(post.author);
              return (
                <article key={post.id} className={`p-4 transition-colors hover:bg-white/[0.015] ${post.player ? "bg-acid/[0.025]" : ""}`}>
                  <div className="flex gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold" style={{ background: `hsl(${hue} 60% 42% / 0.16)`, color: `hsl(${hue} 80% 70%)` }}>
                      {initials(post.author)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-[11.5px] font-semibold">{post.author}</p>
                        {post.verified && <BadgeCheck className="h-3 w-3 text-mint" />}
                        <span className="mono text-[8.5px] text-dim">@{post.handle.replace(/^@/, "")}</span>
                        <span className="mono text-[8.5px] text-dim">· {timeAgo(post.day, state.day)}</span>
                        {post.player && <span className="mono rounded bg-acid/15 px-1 py-0.5 text-[7px] uppercase text-acid">you</span>}
                      </div>
                      <p className="mono text-[8px] uppercase tracking-[0.08em] text-dim">{post.role}</p>
                      <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink/85">{post.body}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="mono text-[8.5px] text-acid/60">#{tag}</span>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-4">
                        <span className="mono flex items-center gap-1 text-[9px] text-dim"><Heart className="h-2.5 w-2.5" /> {compact(post.likes)}</span>
                        <span className="mono flex items-center gap-1 text-[9px] text-dim"><MessageCircle className="h-2.5 w-2.5" /> {compact(post.replies)}</span>
                        <span className="mono flex items-center gap-1 text-[9px] text-dim"><Repeat2 className="h-2.5 w-2.5" /> {compact(Math.round(post.likes / 6))}</span>
                        <span className={`mono ml-auto flex items-center gap-1 text-[8.5px] ${post.sentiment >= 0 ? "text-mint" : "text-danger"}`}>
                          <Activity className="h-2 w-2" /> {post.sentiment >= 0 ? "bullish" : "bearish"} {(post.sentiment * 100).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-4">
            <SectionTitle eyebrow="Trending" title="What the city watches" icon={<TrendingUp className="h-4 w-4" />} />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map(([tag, count]) => (
                <button
                  key={tag}
                  onClick={() => setFilter(["crypto", "market", "finance", "equity", "realestate"].includes(tag) ? "markets" : "power")}
                  className="chip hover:border-acid/30 hover:text-acid"
                >
                  #{tag} <span className="text-dim">{count}</span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="mono text-[9px] text-muted">Net sentiment</span>
                <span className={`mono text-[10px] ${sentiment >= 0 ? "text-mint" : "text-danger"}`}>{(sentiment * 100).toFixed(0)}</span>
              </div>
              <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-line/80">
                <div className="absolute inset-y-0 left-1/2 w-px bg-void" />
                <div
                  className={`absolute inset-y-0 ${sentiment >= 0 ? "left-1/2 bg-mint" : "right-1/2 bg-danger"}`}
                  style={{ width: `${Math.min(50, Math.abs(sentiment) * 50)}%` }}
                />
              </div>
              <div className="mono mt-1 flex justify-between text-[7.5px] text-dim">
                <span>panic</span><span>neutral</span><span>euphoria</span>
              </div>
            </div>
          </Panel>

          <Panel className="p-4">
            <SectionTitle eyebrow="Top voices" title="Who moves the feed" icon={<Users className="h-4 w-4" />} />
            <div className="mt-3 space-y-2">
              {voices.map((agent, index) => (
                <div key={agent.id} className="flex items-center gap-2.5">
                  <span className="mono w-3 text-[9px] text-dim">{index + 1}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full text-[8px] font-bold" style={{ background: `hsl(${agent.hue} 60% 42% / 0.16)`, color: `hsl(${agent.hue} 80% 68%)` }}>
                    {initials(agent.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10.5px] font-medium">{agent.name}</p>
                    <p className="mono truncate text-[8px] text-dim">{agent.title}</p>
                  </div>
                  <div className="w-14">
                    <Progress value={agent.sentiment} color={agent.sentiment > 50 ? "#63f7c3" : "#ffb454"} height={2} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-acid" />
              <div>
                <p className="text-[10.5px] font-semibold">Narrative is infrastructure.</p>
                <p className="mt-1 text-[9.5px] leading-relaxed text-muted">
                  Posts influence sentiment. Sentiment influences price. If you own an outlet, you can make the
                  feed say almost anything — for a while.
                </p>
                <div className="mt-2 flex items-center gap-1 text-[9px] text-acid">
                  <Radio className="h-2.5 w-2.5" /> 2.4M citizens listening
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
