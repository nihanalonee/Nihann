import {
  BadgeCheck,
  Flame,
  Hash,
  Heart,
  MessageCircle,
  Radio,
  Repeat2,
  Send,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Gauge } from "../components/charts";
import { Avatar, Badge, Button, Label, Panel, Progress } from "../components/ui";
import { useGame } from "../game/GameContext";
import { fmtCompact, fmtPct } from "../lib/format";
import { cn } from "../lib/cn";

type FeedFilter = "all" | "markets" | "power" | "underworld";

export function Wire() {
  const { state, dispatch } = useGame();
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<FeedFilter>("all");

  const filtered = useMemo(() => {
    return state.posts.filter((post) => {
      if (filter === "all") return true;
      if (filter === "markets") return post.tags.some((tag) => tag.startsWith("$")) || /market|token|dex|liquidity|OMX|MEMA/i.test(post.content);
      if (filter === "underworld") return /crime|launder|archivist|dockside|warrant|raid|syndicate/i.test(post.content) || post.handle.includes("archivist") || post.handle.includes("ghost");
      return post.verified && !post.handle.includes("signal");
    });
  }, [filter, state.posts]);

  const trending = useMemo(
    () =>
      state.assets
        .map((asset) => ({
          ...asset,
          change: ((asset.price - asset.prevClose) / asset.prevClose) * 100,
          posts: Math.round(120 + Math.abs(asset.sentiment) * 18 + asset.price),
        }))
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
        .slice(0, 6),
    [state.assets],
  );

  const sentiment = state.posts.reduce((sum, post) => {
    if (post.sentiment === "bullish") return sum + 1;
    if (post.sentiment === "bearish") return sum - 1;
    return sum;
  }, 0);
  const sentimentScore = Math.max(0, Math.min(100, 50 + (sentiment / Math.max(1, state.posts.length)) * 50));

  const characters = draft.length;
  const transmit = () => {
    if (!draft.trim()) return;
    dispatch({ type: "POST", content: draft });
    setDraft("");
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-mint/70">NETWORK / SOCIAL LAYER</span>
            <Badge variant="mint">
              <span className="h-1 w-1 animate-pulse-dot rounded-full bg-mint" /> LIVE
            </Badge>
          </div>
          <h1 className="mt-2 text-[30px] leading-none text-white md:text-[38px]">The Wire</h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-white/40">
            The city's public nervous system. NPC masterminds post, react, and manipulate the feed.
            Your words move sentiment; your silence moves nothing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2">
            <div className="label">Live sentiment</div>
            <div className="num mt-0.5 text-[13px] text-mint">{sentimentScore.toFixed(0)}/100</div>
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2">
            <div className="label">Reach</div>
            <div className="num mt-0.5 text-[13px] text-white/75">{fmtCompact(state.isp.subscribers + state.media.channels.reduce((s, c) => s + c.reach, 0))}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-12">
        <div className="space-y-3 xl:col-span-8">
          <Panel className="p-4">
            <div className="flex items-start gap-3">
              <Avatar initials={state.player.avatar} size={38} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[12px] text-white/80">{state.player.name}</span>
                    <span className="ml-2 font-mono text-[8px] text-white/25">@{state.player.handle}</span>
                  </div>
                  <span className="chip chip-mint">VERIFIED</span>
                </div>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 280))}
                  placeholder="Say something the whole city will read…"
                  rows={3}
                  className="mt-2 w-full resize-none bg-transparent text-[13px] leading-relaxed text-white outline-none placeholder:text-white/20"
                />
                <div className="mt-2 flex items-center justify-between border-t border-white/[0.05] pt-2.5">
                  <div className="flex items-center gap-2">
                    <button className="text-white/20 transition hover:text-mint"><Hash size={14} /></button>
                    <button className="text-white/20 transition hover:text-mint"><Sparkles size={14} /></button>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-white/20">Post to 2.4M followers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("num text-[9px]", characters > 250 ? "text-danger" : "text-white/25")}>{characters}/280</span>
                    <Button variant="primary" size="sm" disabled={!draft.trim()} onClick={transmit}>
                      <Send size={11} /> Transmit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-black/25 p-0.5">
              {[
                { value: "all" as const, label: "For you" },
                { value: "markets" as const, label: "Markets" },
                { value: "power" as const, label: "Power" },
                { value: "underworld" as const, label: "Underworld" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 font-mono text-[8.5px] uppercase tracking-wider transition",
                    filter === option.value ? "bg-white/[0.08] text-white/75" : "text-white/30 hover:text-white/60",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-wider text-white/25">
              <Radio size={10} className="text-mint/60" /> {filtered.length} transmissions
            </span>
          </div>

          <div className="space-y-2">
            {filtered.map((post) => (
              <Panel key={post.id} className="overflow-hidden p-4" hover>
                <div className="flex items-start gap-3">
                  <Avatar initials={post.author.slice(0, 2)} color={post.color} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11.5px] text-white/80">{post.author}</span>
                      {post.verified && <BadgeCheck size={11} className="text-mint/80" />}
                      <span className="font-mono text-[8px] text-white/25">@{post.handle}</span>
                      <span className="text-white/10">·</span>
                      <span className="font-mono text-[8px] text-white/25">{post.time}</span>
                      <span
                        className={cn(
                          "ml-auto rounded px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-wider",
                          post.sentiment === "bullish"
                            ? "bg-mint/10 text-mint/65"
                            : post.sentiment === "bearish"
                              ? "bg-danger/10 text-danger/65"
                              : post.sentiment === "chaotic"
                                ? "bg-gold/10 text-gold/65"
                                : "bg-white/[0.04] text-white/35",
                        )}
                      >
                        {post.sentiment}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-[7px] uppercase tracking-wider text-white/20">{post.role}</div>
                    <p className="mt-2 text-[12px] leading-relaxed text-white/60">{post.content}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {post.tags.map((tag) => (
                        <span key={tag} className="font-mono text-[8px] text-mint/45 transition hover:text-mint">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-5 border-t border-white/[0.04] pt-2.5">
                      <button
                        onClick={() => dispatch({ type: "LIKE", postId: post.id })}
                        className={cn(
                          "flex items-center gap-1.5 font-mono text-[8.5px] transition",
                          post.liked ? "text-danger" : "text-white/25 hover:text-white/60",
                        )}
                      >
                        <Heart size={12} fill={post.liked ? "currentColor" : "none"} /> {fmtCompact(post.likes)}
                      </button>
                      <span className="flex items-center gap-1.5 font-mono text-[8.5px] text-white/25">
                        <MessageCircle size={12} /> {fmtCompact(post.replies)}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-[8.5px] text-white/25">
                        <Repeat2 size={12} /> {fmtCompact(post.reposts)}
                      </span>
                      <button className="ml-auto text-white/20 transition hover:text-white/60">
                        <Share2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </div>

        <div className="space-y-3 xl:col-span-4">
          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Wire pulse</Label>
                <div className="mt-1 text-[13px] text-white/80">Market conversation</div>
              </div>
              <Badge variant={sentimentScore > 55 ? "mint" : "danger"}>{sentimentScore > 55 ? "BULLISH" : "BEARISH"}</Badge>
            </div>
            <div className="mt-2 flex flex-col items-center">
              <Gauge value={sentimentScore} size={150} color={sentimentScore > 55 ? "#7CF7C4" : "#FF6B6B"} label={`${sentimentScore.toFixed(0)}`} sublabel="Social sentiment" />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                ["Bullish", state.posts.filter((p) => p.sentiment === "bullish").length, "#7CF7C4"],
                ["Bearish", state.posts.filter((p) => p.sentiment === "bearish").length, "#FF6B6B"],
                ["Chaotic", state.posts.filter((p) => p.sentiment === "chaotic").length, "#F5C451"],
              ].map(([label, value, color]) => (
                <div key={label as string} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                  <div className="num text-[14px]" style={{ color: color as string }}>{value}</div>
                  <div className="mt-0.5 font-mono text-[7px] uppercase tracking-wider text-white/25">{label}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div>
                <Label>Trending</Label>
                <div className="mt-1 text-[13px] text-white/80">Across the wire</div>
              </div>
              <TrendingUp size={13} className="text-white/25" />
            </div>
            <div className="p-3">
              {trending.map((asset, index) => (
                <div key={asset.id} className="flex items-center gap-2 border-b border-white/[0.04] py-2 last:border-0">
                  <span className="num w-3 text-[8px] text-white/20">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] text-white/60">${asset.ticker}</span>
                      <span className="text-[8px] text-white/25">{asset.name}</span>
                    </div>
                    <div className="mt-0.5 font-mono text-[7px] text-white/20">{fmtCompact(asset.posts)} posts · {asset.sector}</div>
                  </div>
                  <span className={cn("num text-[8px]", asset.change >= 0 ? "text-mint/70" : "text-danger/70")}>{fmtPct(asset.change, 1)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="border-b border-white/[0.06] px-4 py-3">
              <Label>Voices to watch</Label>
              <div className="mt-1 text-[13px] text-white/80">Who moves the feed</div>
            </div>
            <div className="p-3">
              {state.corporate.rivals.slice(0, 4).map((rival) => (
                <div key={rival.id} className="flex items-center gap-2 border-b border-white/[0.04] py-2 last:border-0">
                  <Avatar initials={rival.ceo.slice(0, 2)} color={rival.color} size={26} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[9.5px] text-white/60">{rival.ceo}</div>
                    <div className="truncate font-mono text-[7px] uppercase tracking-wider text-white/20">{rival.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="num text-[9px] text-white/45">{fmtCompact(rival.netWorth)}</div>
                    <div className="font-mono text-[7px] text-white/20">NET</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Narrative heat</Label>
                <div className="mt-1 text-[13px] text-white/80">Most discussed</div>
              </div>
              <Flame size={13} className="text-danger/50" />
            </div>
            <div className="mt-3 space-y-2.5">
              {trending.slice(0, 4).map((asset) => (
                <div key={asset.id}>
                  <div className="flex justify-between text-[8.5px]">
                    <span className="font-mono text-white/35">${asset.ticker}</span>
                    <span className="num text-white/50">{asset.sentiment.toFixed(0)} sentiment</span>
                  </div>
                  <Progress value={asset.posts} max={Math.max(...trending.map((t) => t.posts))} color={asset.change >= 0 ? "#7CF7C4" : "#FF6B6B"} height={3} className="mt-1" />
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-gold/15 bg-gold/[0.035] p-2.5">
              <div className="flex items-center gap-1.5 text-[8px] text-gold/60">
                <Zap size={10} /> Wire alpha
              </div>
              <p className="mt-1 text-[9px] leading-relaxed text-white/35">
                NPC posts can front-run their own trades. Read the feed like an order book.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
