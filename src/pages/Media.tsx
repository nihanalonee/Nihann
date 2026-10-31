import {
  ArrowRight,
  Clapperboard,
  Eye,
  Flame,
  Megaphone,
  Newspaper,
  Play,
  Plus,
  Radio,
  ShieldAlert,
  Sparkles,
  Tv,
  Users,
  Volume2,
} from "lucide-react";
import { useState } from "react";
import { Gauge, MiniBars, Sparkline } from "../components/charts";
import { Badge, Button, EmptyState, Label, Modal, Panel, Progress, Segmented } from "../components/ui";
import { useGame } from "../game/GameContext";
import { fmtCompact, fmtMoney, fmtNum, fmtPct } from "../lib/format";
import { cn } from "../lib/cn";

export function Media() {
  const { state, dispatch } = useGame();
  const [channelId, setChannelId] = useState(state.media.channels[0]?.id ?? "");
  const [launchOpen, setLaunchOpen] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelKind, setChannelKind] = useState<"TV" | "Streaming" | "Podcast">("TV");
  const [showTitle, setShowTitle] = useState("");
  const [showGenre, setShowGenre] = useState("Finance");
  const [showBudget, setShowBudget] = useState("120000");
  const [tone, setTone] = useState<"hype" | "hit" | "spin">("hype");
  const [target, setTarget] = useState("omx");
  const [campaignBudget, setCampaignBudget] = useState("150000");

  const channel = state.media.channels.find((c) => c.id === channelId) ?? state.media.channels[0];
  const totalReach = state.media.channels.reduce((s, c) => s + c.reach, 0);
  const totalRevenue = state.media.channels.reduce((s, c) => s + c.revenue, 0);
  const liveCampaigns = state.media.campaigns.filter((c) => c.status === "live");
  const avgCredibility = state.media.channels.reduce((s, c) => s + c.credibility, 0) / Math.max(1, state.media.channels.length);

  const targetOptions = [
    ...state.assets.map((a) => ({ value: a.id, label: `${a.ticker} · ${a.name}` })),
    ...state.corporate.rivals.map((r) => ({ value: r.id, label: `${r.name} · ${r.ceo}` })),
    { value: "government", label: "District Government" },
  ];

  return (
    <div className="animate-fade-up">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-mint/70">INFLUENCE / MASS MEDIA</span>
            <Badge variant="mint">
              <span className="h-1 w-1 rounded-full bg-mint" /> ON AIR
            </Badge>
          </div>
          <h1 className="mt-2 text-[30px] leading-none text-white md:text-[38px]">Narrative Control</h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-white/40">
            Launch networks, produce shows, and move public sentiment. A credible channel can pump a
            token. A ruthless one can end a rival — and its own reputation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setChannelKind("Streaming")}>
            <Radio size={12} /> Go digital
          </Button>
          <Button variant="primary" size="sm" onClick={() => setLaunchOpen(true)}>
            <Plus size={12} /> Launch channel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {[
          { label: "Combined reach", value: fmtCompact(totalReach), sub: `${state.media.channels.length} owned channels`, icon: <Users size={13} />, color: "#7CF7C4" },
          { label: "Daily revenue", value: fmtMoney(totalRevenue), sub: `${liveCampaigns.length} live campaigns`, icon: <Megaphone size={13} />, color: "#F5C451" },
          { label: "Public trust", value: `${state.media.publicTrust.toFixed(0)}/100`, sub: state.media.publicTrust > 55 ? "audience receptive" : "audience cynical", icon: <Eye size={13} />, color: "#B69CFF" },
          { label: "Avg credibility", value: `${avgCredibility.toFixed(0)}/100`, sub: avgCredibility > 60 ? "editorial standing" : "tabloid risk", icon: <ShieldAlert size={13} />, color: "#FF8FB1" },
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
          <div className="grid gap-2 sm:grid-cols-2">
            {state.media.channels.map((c, index) => (
              <button
                key={c.id}
                onClick={() => setChannelId(c.id)}
                className={cn(
                  "panel panel-hover relative overflow-hidden p-3.5 text-left",
                  channel?.id === c.id && "border-mint/30 bg-mint/[0.03]",
                )}
              >
                <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-20 blur-2xl" style={{ background: c.color }} />
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-lg border"
                      style={{ color: c.color, borderColor: `${c.color}30`, background: `${c.color}10` }}
                    >
                      {c.type === "TV" ? <Tv size={15} /> : c.type === "Streaming" ? <Play size={15} /> : <Volume2 size={15} />}
                    </span>
                    <div>
                      <div className="text-[12px] text-white/80">{c.name}</div>
                      <div className="mt-0.5 font-mono text-[7px] uppercase tracking-wider text-white/25">
                        {c.type} · CH 0{index + 1}
                      </div>
                    </div>
                  </div>
                  <Badge variant={c.credibility > 65 ? "mint" : c.credibility > 45 ? "gold" : "danger"}>
                    CRED {c.credibility.toFixed(0)}
                  </Badge>
                </div>
                <div className="relative z-10 mt-3 grid grid-cols-3 gap-2">
                  {[
                    ["Reach", fmtCompact(c.reach)],
                    ["Revenue", fmtMoney(c.revenue)],
                    ["Shows", `${c.shows.length}`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="label text-[7px]">{label}</div>
                      <div className="num mt-0.5 text-[11px] text-white/65">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="relative z-10 mt-2">
                  <Progress value={c.reach} max={2_000_000} color={c.color} height={3} />
                </div>
                <div className="relative z-10 mt-2 flex items-center justify-between">
                  <span className="font-mono text-[7px] uppercase tracking-wider text-white/20">{c.shows[0]?.title ?? "No programming"}</span>
                  <span className="font-mono text-[7px] text-white/25">{fmtPct((c.reach / Math.max(1, totalReach)) * 100, 0)} share</span>
                </div>
              </button>
            ))}
            <button
              onClick={() => setLaunchOpen(true)}
              className="panel panel-hover flex min-h-[150px] flex-col items-center justify-center gap-2 border-dashed border-white/10 p-3 text-white/30 transition hover:text-white/60"
            >
              <Plus size={18} />
              <span className="text-[10px]">Acquire another channel</span>
              <span className="font-mono text-[8px] text-white/20">$750,000 licence</span>
            </button>
          </div>

          {channel && (
            <Panel className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ color: channel.color, borderColor: `${channel.color}30`, background: `${channel.color}10` }}>
                    <Clapperboard size={14} />
                  </span>
                  <div>
                    <Label>Programming slate</Label>
                    <div className="mt-0.5 text-[13px] text-white/80">{channel.name}</div>
                  </div>
                </div>
                <Badge variant="violet">{channel.type} · {fmtCompact(channel.reach)} REACH</Badge>
              </div>
              <div className="grid gap-0 md:grid-cols-5">
                <div className="border-b border-white/[0.06] p-4 md:col-span-3 md:border-b-0 md:border-r">
                  <div className="space-y-2">
                    {channel.shows.length === 0 && (
                      <EmptyState
                        icon={<Clapperboard size={16} />}
                        title="No programming yet"
                        description="A channel with no shows is just static. Produce a pilot to build reach and credibility."
                      />
                    )}
                    {channel.shows.map((show) => (
                      <div key={show.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-[10.5px] text-white/70">{show.title}</div>
                            <div className="mt-0.5 font-mono text-[7px] uppercase tracking-wider text-white/25">{show.genre} · production</div>
                          </div>
                          <div className="text-right">
                            <div className="num text-[11px] text-mint/80">{show.rating}</div>
                            <div className="font-mono text-[7px] uppercase tracking-wider text-white/20">rating</div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-[8px] text-white/25">
                          <span>Budget {fmtMoney(show.cost)}</span>
                          <span>Revenue {fmtMoney(show.revenue)}</span>
                          <span className="text-mint/50">ROI {(((show.revenue - show.cost) / Math.max(1, show.cost)) * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={show.rating} color={show.rating > 65 ? "#7CF7C4" : "#F5C451"} height={2} className="mt-1.5" />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg border border-white/[0.07] bg-black/20 p-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={12} className="text-gold" />
                      <span className="label text-gold/60">Commission a show</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input className="field" placeholder="Working title" value={showTitle} onChange={(e) => setShowTitle(e.target.value)} />
                      <select className="field" value={showGenre} onChange={(e) => setShowGenre(e.target.value)}>
                        {["Finance", "Investigation", "Drama", "Reality", "Propaganda", "Documentary"].map((g) => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input className="field num" type="number" value={showBudget} onChange={(e) => setShowBudget(e.target.value)} />
                      <Button
                        variant="primary"
                        size="sm"
                        className="shrink-0"
                        disabled={!showTitle || Number(showBudget) < 20_000}
                        onClick={() => {
                          dispatch({ type: "PRODUCE_SHOW", channelId: channel.id, title: showTitle, genre: showGenre, budget: Number(showBudget) });
                          setShowTitle("");
                        }}
                      >
                        <Play size={11} /> Greenlight
                      </Button>
                    </div>
                    <div className="mt-1.5 text-right font-mono text-[7px] text-white/20">Minimum budget $20K</div>
                  </div>
                </div>

                <div className="p-4 md:col-span-2">
                  <Label>Audience signal</Label>
                  <div className="mt-3 flex items-center justify-between">
                    <Gauge value={channel.credibility} size={112} color={channel.credibility > 60 ? "#7CF7C4" : "#F5C451"} sublabel="Credibility" />
                    <Gauge value={Math.min(100, (channel.reach / 2_000_000) * 100)} size={112} color="#B69CFF" sublabel="Reach" />
                  </div>
                  <div className="mt-3 space-y-2">
                    {[
                      ["Prime-time share", `${(12 + channel.credibility / 8).toFixed(1)}%`],
                      ["Ad fill rate", `${Math.min(99, 55 + channel.credibility * 0.4).toFixed(0)}%`],
                      ["Cost per mille", `$${(8 + channel.credibility * 0.12).toFixed(2)}`],
                      ["Editorial risk", channel.credibility < 40 ? "ELEVATED" : "CONTAINED"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-[9px]">
                        <span className="text-white/30">{label}</span>
                        <span className="num text-white/55">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <MiniBars data={[42, 51, 48, 60, 56, 67, 62, 74, 69, 78, 72, 81]} color={channel.color} height={38} />
                    <div className="mt-1 flex justify-between font-mono text-[7px] uppercase tracking-wider text-white/20">
                      <span>30d</span>
                      <span>Live</span>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          )}

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div>
                <Label>Campaign ledger</Label>
                <div className="mt-1 text-[13px] text-white/80">Active narrative operations</div>
              </div>
              <Badge variant="gold">{liveCampaigns.length} LIVE</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.05] font-mono text-[7.5px] uppercase tracking-wider text-white/25">
                    <th className="px-4 py-2.5 font-normal">Target</th>
                    <th className="px-3 py-2.5 font-normal">Tone</th>
                    <th className="px-3 py-2.5 font-normal">Channel</th>
                    <th className="px-3 py-2.5 font-normal">Budget</th>
                    <th className="px-3 py-2.5 font-normal">Reach</th>
                    <th className="px-3 py-2.5 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {state.media.campaigns.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-[10px] text-white/25">
                        No campaigns yet. Buy the narrative before someone buys it against you.
                      </td>
                    </tr>
                  )}
                  {state.media.campaigns.map((campaign) => {
                    const targetLabel =
                      state.assets.find((a) => a.id === campaign.target || a.ticker === campaign.target.toUpperCase())?.ticker ??
                      state.corporate.rivals.find((r) => r.id === campaign.target)?.name ??
                      campaign.target;
                    const ch = state.media.channels.find((c) => c.id === campaign.channelId);
                    return (
                      <tr key={campaign.id} className="table-row">
                        <td className="px-4 py-2.5 text-[9.5px] text-white/60">{targetLabel}</td>
                        <td className="px-3 py-2.5">
                          <span className={cn("rounded px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-wider", campaign.tone === "hype" ? "bg-mint/10 text-mint/75" : campaign.tone === "hit" ? "bg-danger/10 text-danger/75" : "bg-violet/10 text-violet/75")}>
                            {campaign.tone}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[9px] text-white/40">{ch?.name}</td>
                        <td className="num px-3 py-2.5 text-[9px] text-white/45">{fmtMoney(campaign.budget)}</td>
                        <td className="num px-3 py-2.5 text-[9px] text-white/45">{fmtCompact(campaign.reach)}</td>
                        <td className="px-3 py-2.5">
                          <span className={cn("font-mono text-[7px] uppercase tracking-wider", campaign.status === "live" ? "text-mint/70" : "text-white/25")}>{campaign.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="space-y-3 xl:col-span-4">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div>
                <Label>Campaign desk</Label>
                <div className="mt-1 text-[13px] text-white/80">Shape the narrative</div>
              </div>
              <Megaphone size={13} className="text-white/25" />
            </div>
            <div className="p-4">
              <div className="label mb-1.5">Narrative posture</div>
              <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/[0.07] bg-black/25 p-0.5">
                {[
                  { value: "hype" as const, label: "Hype" },
                  { value: "hit" as const, label: "Hit" },
                  { value: "spin" as const, label: "Spin" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTone(option.value)}
                    className={cn(
                      "rounded-md py-1.5 font-mono text-[8px] uppercase tracking-wider transition",
                      tone === option.value
                        ? option.value === "hit" ? "bg-danger/15 text-danger" : option.value === "hype" ? "bg-mint/15 text-mint" : "bg-violet/15 text-violet"
                        : "text-white/30 hover:text-white/60",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="mt-1.5 min-h-[28px] text-[9px] leading-relaxed text-white/25">
                {tone === "hype" && "Amplify an asset, drive retail inflow, and inflate sentiment."}
                {tone === "hit" && "Run an exposé. Damage a rival or asset — at a credibility cost."}
                {tone === "spin" && "Improve government approval and stabilise a narrative."}
              </div>
              <div className="mt-3">
                <div className="label mb-1.5">Target</div>
                <select className="field" value={target} onChange={(e) => setTarget(e.target.value)}>
                  {targetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-[9px] text-white/30">
                  <span>Campaign budget</span>
                  <span className="num text-white/60">{fmtMoney(Number(campaignBudget) || 0)}</span>
                </div>
                <input
                  type="range"
                  min={25_000}
                  max={Math.max(25_000, Math.min(2_000_000, Math.round(state.player.cash)))}
                  step={25_000}
                  value={campaignBudget}
                  onChange={(e) => setCampaignBudget(e.target.value)}
                  className="mt-1.5 w-full accent-mint"
                />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1">
                {[50_000, 150_000, 500_000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCampaignBudget(String(amount))}
                    className="rounded border border-white/[0.07] py-1 font-mono text-[7.5px] text-white/30 transition hover:border-white/20 hover:text-white/60"
                  >
                    {fmtMoney(amount, 0)}
                  </button>
                ))}
              </div>
              <Button
                variant={tone === "hit" ? "danger" : "primary"}
                className="mt-2.5 w-full"
                disabled={Number(campaignBudget) > state.player.cash}
                onClick={() => dispatch({ type: "RUN_CAMPAIGN", channelId: channel?.id ?? "", target, tone, budget: Number(campaignBudget) })}
              >
                <Flame size={12} /> Launch campaign
              </Button>
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Public trust</Label>
                <div className="mt-1 text-[13px] text-white/80">Audience sentiment</div>
              </div>
              <Badge variant={state.media.publicTrust > 55 ? "mint" : "danger"}>{state.media.publicTrust > 55 ? "RECEPTIVE" : "CYNICAL"}</Badge>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <Gauge value={state.media.publicTrust} size={122} color="#B69CFF" sublabel="Trust index" />
              <div className="space-y-1.5 text-[9px]">
                {[
                  ["TV", `${state.media.channels.filter((c) => c.type === "TV").length}`],
                  ["Streaming", `${state.media.channels.filter((c) => c.type === "Streaming").length}`],
                  ["Podcast", `${state.media.channels.filter((c) => c.type === "Podcast").length}`],
                  ["Campaigns", `${state.media.campaigns.length}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-6">
                    <span className="text-white/25">{label}</span>
                    <span className="num text-white/55">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                <div className="label">Reach / tick</div>
                <div className="num mt-1 text-[11px] text-mint/70">+{fmtNum(Math.round(totalReach * 0.0008))}</div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                <div className="label">Ad yield</div>
                <div className="num mt-1 text-[11px] text-gold/70">{fmtMoney(totalRevenue * 0.42)}</div>
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="border-b border-white/[0.06] px-4 py-3">
              <Label>Sentiment board</Label>
              <div className="mt-1 text-[13px] text-white/80">Narrative positioning</div>
            </div>
            <div className="p-3">
              {state.assets.slice(0, 6).map((asset) => (
                <div key={asset.id} className="flex items-center gap-2 border-b border-white/[0.04] py-2 last:border-0">
                  <span className="w-9 font-mono text-[8px] text-white/35">{asset.ticker}</span>
                  <div className="flex-1">
                    <Progress value={asset.sentiment + 100} max={200} color={asset.sentiment > 50 ? "#7CF7C4" : asset.sentiment > 0 ? "#F5C451" : "#FF6B6B"} height={3} />
                  </div>
                  <span className={cn("num w-8 text-right text-[8px]", asset.sentiment >= 50 ? "text-mint/70" : asset.sentiment >= 0 ? "text-gold/70" : "text-danger/70")}>
                    {asset.sentiment.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Modal open={launchOpen} onClose={() => setLaunchOpen(false)} title="Launch a media channel" subtitle="Licence cost $750,000. Reach starts at 60,000.">
        <div className="label mb-1.5">Channel name</div>
        <input className="field" value={channelName} onChange={(e) => setChannelName(e.target.value)} placeholder="The Midnight Ledger" />
        <div className="mt-3 label mb-1.5">Format</div>
        <div className="grid grid-cols-3 gap-2">
          {(["TV", "Streaming", "Podcast"] as const).map((kind) => (
            <button
              key={kind}
              onClick={() => setChannelKind(kind)}
              className={cn(
                "rounded-lg border p-2.5 text-center transition",
                channelKind === kind ? "border-mint/30 bg-mint/[0.06]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/20",
              )}
            >
              <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/50">
                {kind === "TV" ? <Tv size={13} /> : kind === "Streaming" ? <Play size={13} /> : <Volume2 size={13} />}
              </div>
              <div className="mt-1.5 text-[9px] text-white/55">{kind}</div>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLaunchOpen(false)}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              dispatch({ type: "LAUNCH_CHANNEL", name: channelName, kind: channelKind });
              setLaunchOpen(false);
              setChannelName("");
            }}
          >
            <Tv size={11} /> Buy licence
          </Button>
        </div>
      </Modal>
    </div>
  );
}
