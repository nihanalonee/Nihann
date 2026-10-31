import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  Globe2,
  Landmark,
  MessageSquare,
  Radio,
  ShieldAlert,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AreaChart, Donut, Gauge, Sparkline } from "../components/charts";
import { CityMap } from "../components/CityMap";
import { Avatar, Badge, Button, Dot, Label, Panel, Progress, Segmented } from "../components/ui";
import { useGame } from "../game/GameContext";
import { fmtCompact, fmtMoney, fmtNum, fmtPct } from "../lib/format";
import { cn } from "../lib/cn";
import type { PageId } from "../types";

function SectionTitle({
  label,
  title,
  icon,
  action,
}: {
  label: string;
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="label flex items-center gap-1.5">
          {icon}
          {label}
        </div>
        <div className="mt-1 text-[14px] text-white/85">{title}</div>
      </div>
      {action}
    </div>
  );
}

export function Overview({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const { state } = useGame();
  const [range, setRange] = useState<"7" | "30" | "all">("30");
  const [moverTab, setMoverTab] = useState<"gainers" | "losers">("gainers");

  const worth = state.stats.netWorthHistory.at(-1) ?? state.player.cash;
  const prevWorth = state.stats.netWorthHistory.at(-2) ?? worth;
  const worthDelta = ((worth - prevWorth) / prevWorth) * 100;
  const portfolio = useMemo(() => {
    return Object.entries(state.holdings).reduce((sum, [id, holding]) => {
      const asset = state.assets.find((a) => a.id === id);
      return sum + (asset?.price ?? 0) * holding.qty;
    }, 0);
  }, [state.assets, state.holdings]);
  const propertyValue = state.districts.filter((d) => d.owned).reduce((s, d) => s + d.price, 0);
  const bankValue = Math.max(0, state.bank.reserves + state.bank.loans - state.bank.deposits - state.bank.bonds);
  const otherValue = state.media.channels.reduce((s, c) => s + c.reach * 0.32, 0) + state.isp.subscribers * 2.4;

  const chartData = useMemo(() => {
    if (range === "7") return state.stats.netWorthHistory.slice(-7);
    if (range === "30") return state.stats.netWorthHistory.slice(-30);
    return state.stats.netWorthHistory;
  }, [range, state.stats.netWorthHistory]);

  const event = state.world.events[0];
  const leaderboard = useMemo(() => {
    const rivals = state.corporate.rivals.map((r) => ({
      id: r.id,
      name: r.name,
      ceo: r.ceo,
      worth: r.netWorth,
      color: r.color,
      sentiment: r.sentiment,
      player: false,
    }));
    return [
      ...rivals,
      {
        id: "player",
        name: state.corporate.name || "Axiom Industries",
        ceo: `${state.player.name} · You`,
        worth,
        color: "#7CF7C4",
        sentiment: state.player.reputation,
        player: true,
      },
    ]
      .sort((a, b) => b.worth - a.worth)
      .slice(0, 6);
  }, [state.corporate.rivals, state.corporate.name, state.player.name, state.player.reputation, worth]);

  const movers = useMemo(() => {
    const enriched = state.assets.map((asset) => ({
      ...asset,
      change: ((asset.price - asset.prevClose) / asset.prevClose) * 100,
    }));
    return enriched
      .sort((a, b) => (moverTab === "gainers" ? b.change - a.change : a.change - b.change))
      .slice(0, 5);
  }, [state.assets, moverTab]);

  const indexDelta = useMemo(() => {
    const prev = state.world.indexHistory.at(-2) ?? state.world.index;
    return ((state.world.index - prev) / prev) * 100;
  }, [state.world.index, state.world.indexHistory]);

  const allocation = [
    { label: "Liquid cash", value: state.player.cash, color: "#7CF7C4" },
    { label: "Public markets", value: portfolio, color: "#B69CFF" },
    { label: "Real estate", value: propertyValue, color: "#F5C451" },
    { label: "Bank equity", value: bankValue, color: "#7FB2FF" },
    { label: "Corporate", value: state.corporate.valuation, color: "#FF8FB1" },
    { label: "Media & ISP", value: otherValue, color: "#FF6B6B" },
  ];

  return (
    <div className="animate-fade-up">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-mint/70">OPERATIONS / COMMAND DECK</span>
            <Badge variant="mint">
              <Dot /> LIVE
            </Badge>
          </div>
          <h1 className="mt-2 text-[30px] leading-none text-white md:text-[38px]">
            Good evening, <span className="text-white/55">{state.player.name.split(" ")[0]}.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-white/40">
            {state.world.day} days into the new order. Your empire holds{" "}
            <span className="text-white/70">{fmtMoney(worth)}</span>, the city is{" "}
            <span className={state.world.sentiment >= 50 ? "text-mint/80" : "text-danger/80"}>
              {state.world.sentiment >= 50 ? "risk-on" : "risk-off"}
            </span>
            , and every rival is awake.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onNavigate("wire")}>
            <MessageSquare size={12} /> Open The Wire
          </Button>
          <Button variant="primary" size="sm" onClick={() => onNavigate("market")}>
            <TrendingUp size={12} /> Trade markets
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <div className="stat-card">
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="label">Consolidated net worth</div>
              <div className="num mt-2 text-[25px] font-medium leading-none text-white">
                {fmtMoney(worth)}
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <span
                  className={cn(
                    "num rounded px-1.5 py-0.5 text-[9.5px]",
                    worthDelta >= 0 ? "bg-mint/10 text-mint" : "bg-danger/10 text-danger",
                  )}
                >
                  {fmtPct(worthDelta)}
                </span>
                <span className="text-[10px] text-white/30">last tick</span>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-mint/20 bg-mint/[0.06] text-mint">
              <Wallet size={14} />
            </div>
          </div>
          <div className="relative z-10 mt-3">
            <Sparkline data={state.stats.netWorthHistory.slice(-28)} height={30} />
          </div>
        </div>

        <div className="stat-card">
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="label">Liquid capital</div>
              <div className="num mt-2 text-[25px] font-medium leading-none text-white">
                {fmtMoney(state.player.cash)}
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="chip chip-mint">DEPLOYABLE</span>
                <span className="text-[10px] text-white/30">cleared funds</span>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet/20 bg-violet/[0.06] text-violet">
              <CircleDollarSign size={14} />
            </div>
          </div>
          <div className="relative z-10 mt-3 flex items-center justify-between text-[9px] text-white/30">
            <span>Invested {fmtMoney(portfolio)}</span>
            <span>Property {fmtMoney(propertyValue)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="label">Influence network</div>
              <div className="num mt-2 text-[25px] font-medium leading-none text-white">
                {fmtNum(state.player.influence)}
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="chip chip-gold">RANK {state.player.prestige < 5 ? "RISING" : "ELITE"}</span>
                <span className="text-[10px] text-white/30">reputation {Math.round(state.player.reputation)}</span>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/20 bg-gold/[0.06] text-gold">
              <Zap size={14} />
            </div>
          </div>
          <div className="relative z-10 mt-3">
            <div className="flex justify-between text-[9px] text-white/30">
              <span>Level {state.player.level}</span>
              <span className="num">{state.player.xp.toFixed(0)}% to next</span>
            </div>
            <Progress value={state.player.xp} className="mt-1.5" height={4} color="#F5C451" />
          </div>
        </div>

        <div className="stat-card">
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="label">OmniLife index</div>
              <div className="num mt-2 text-[25px] font-medium leading-none text-white">
                {fmtNum(state.world.index, 2)}
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <span
                  className={cn(
                    "num rounded px-1.5 py-0.5 text-[9.5px]",
                    indexDelta >= 0 ? "bg-mint/10 text-mint" : "bg-danger/10 text-danger",
                  )}
                >
                  {fmtPct(indexDelta)}
                </span>
                <span className="text-[10px] text-white/30">{state.world.phase}</span>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue/20 bg-blue/[0.06] text-blue">
              <Globe2 size={14} />
            </div>
          </div>
          <div className="relative z-10 mt-3">
            <Sparkline
              data={state.world.indexHistory.slice(-28)}
              color={indexDelta >= 0 ? "#7FB2FF" : "#FF6B6B"}
              height={30}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-12">
        <div className="space-y-3 xl:col-span-8">
          <Panel className="overflow-hidden p-4 md:p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <Label>Consolidated balance sheet</Label>
                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <span className="num text-[32px] leading-none text-white">{fmtMoney(worth)}</span>
                  <span
                    className={cn(
                      "num mb-0.5 flex items-center gap-1 text-[11px]",
                      worthDelta >= 0 ? "text-mint" : "text-danger",
                    )}
                  >
                    {worthDelta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight />}
                    {fmtPct(Math.abs(worthDelta))}
                  </span>
                  <span className="mb-0.5 text-[10px] text-white/25">this tick</span>
                </div>
              </div>
              <Segmented
                value={range}
                onChange={setRange}
                options={[
                  { value: "7", label: "7D" },
                  { value: "30", label: "30D" },
                  { value: "all", label: "ALL" },
                ]}
              />
            </div>

            <div className="mt-4">
              <AreaChart
                data={chartData}
                height={196}
                color={worthDelta >= 0 ? "#7CF7C4" : "#FF6B6B"}
                format={(value) => fmtMoney(value)}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.05] pt-3 sm:grid-cols-4">
              {[
                ["Public markets", fmtMoney(portfolio), "#B69CFF"],
                ["Real estate", fmtMoney(propertyValue), "#F5C451"],
                ["Bank equity", fmtMoney(bankValue), "#7FB2FF"],
                ["Corp + media", fmtMoney(state.corporate.valuation + otherValue), "#FF8FB1"],
              ].map(([label, value, color]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="h-5 w-0.5 rounded-full" style={{ background: color }} />
                  <div>
                    <div className="text-[9px] text-white/30">{label}</div>
                    <div className="num mt-0.5 text-[11px] text-white/75">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4 md:p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <Label>Real estate / living city</Label>
                <div className="mt-1 text-[14px] text-white/85">District control map</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="mint">
                  {state.districts.filter((d) => d.owned).length} OWNED
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => onNavigate("infrastructure")}>
                  Infrastructure <ArrowRight size={11} />
                </Button>
              </div>
            </div>
            <CityMap compact />
          </Panel>
        </div>

        <div className="space-y-3 xl:col-span-4">
          <Panel className="scanline overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-mint/25 bg-mint/[0.08] text-mint">
                  <Zap size={10} />
                </span>
                <span className="label text-mint/70">World Engine</span>
              </div>
              <Badge variant={state.world.engineMode === "grok" ? "mint" : "gold"}>
                {state.world.engineMode === "grok" ? "GROK LINK" : "AUTONOMOUS"}
              </Badge>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    event?.severity === "critical"
                      ? "danger"
                      : event?.severity === "high"
                        ? "gold"
                        : "violet"
                  }
                >
                  {event?.severity ?? "stable"} · {event?.category ?? "macro"}
                </Badge>
                <span className="font-mono text-[8px] uppercase tracking-wider text-white/25">
                  DAY {event?.day} · T{event?.tick}
                </span>
              </div>
              <h2 className="mt-3 text-[21px] leading-tight text-white">{event?.title ?? "Markets quiet"}</h2>
              <p className="mt-2 line-clamp-4 text-[11.5px] leading-relaxed text-white/42">
                {event?.summary ?? "No macro event is active. The calm is temporary."}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {event?.effects.slice(0, 4).map((effect) => (
                  <span key={effect} className="chip">
                    {effect}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.05] pt-3">
                <div className="flex flex-col items-center">
                  <Gauge value={state.world.sentiment} size={98} color="#7CF7C4" sublabel="Sentiment" />
                </div>
                <div className="flex flex-col items-center">
                  <Gauge value={state.world.volatility} size={98} color="#F5C451" sublabel="Volatility" />
                </div>
              </div>

              <div className="mt-2 rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-white/30">Next autonomous event</span>
                  <span className="num text-white/60">{state.world.nextEventIn} ticks</span>
                </div>
                <Progress
                  value={Math.max(0, 15 - state.world.nextEventIn)}
                  max={15}
                  color="#B69CFF"
                  height={3}
                  className="mt-1.5"
                />
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div>
                <Label>The power list</Label>
                <div className="mt-1 text-[13px] text-white/80">Rival net worth</div>
              </div>
              <Badge variant="danger">
                <ShieldAlert size={9} /> {state.corporate.rivals.length} ACTIVE
              </Badge>
            </div>
            <div className="p-2">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-2",
                    entry.player && "border border-mint/15 bg-mint/[0.045]",
                  )}
                >
                  <span className="num w-4 text-[9px] text-white/25">{index + 1}</span>
                  <Avatar
                    initials={entry.ceo.slice(0, 2).toUpperCase()}
                    color={entry.color}
                    size={26}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10.5px] text-white/75">{entry.name}</div>
                    <div className="truncate font-mono text-[7.5px] uppercase tracking-wider text-white/25">
                      {entry.ceo}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="num text-[10px] text-white/65">{fmtMoney(entry.worth, 1)}</div>
                    <div
                      className={cn(
                        "num text-[7.5px]",
                        entry.sentiment >= 50 ? "text-mint/55" : entry.sentiment > 20 ? "text-gold/55" : "text-danger/55",
                      )}
                    >
                      SENT {Math.round(entry.sentiment)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate("corporate")}
              className="flex w-full items-center justify-between border-t border-white/[0.06] px-4 py-2.5 text-[9.5px] text-white/35 transition hover:bg-white/[0.02] hover:text-white/70"
            >
              Open corporate intelligence <ArrowRight size={10} />
            </button>
          </Panel>
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-12">
        <Panel className="overflow-hidden xl:col-span-5">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div>
              <Label>Market tape</Label>
              <div className="mt-1 text-[13px] text-white/80">Movers</div>
            </div>
            <Segmented
              value={moverTab}
              onChange={setMoverTab}
              options={[
                { value: "gainers", label: "Gainers" },
                { value: "losers", label: "Losers" },
              ]}
            />
          </div>
          <div className="px-4">
            {movers.map((asset) => (
              <button
                key={asset.id}
                onClick={() => onNavigate("market")}
                className="mover-row w-full text-left"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-mono text-[8px] font-semibold"
                    style={{
                      color: asset.color,
                      borderColor: `${asset.color}25`,
                      background: `${asset.color}0d`,
                    }}
                  >
                    {asset.ticker.slice(0, 3)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[10.5px] text-white/70">{asset.name}</div>
                    <div className="font-mono text-[7px] uppercase tracking-wider text-white/25">
                      {asset.sector}
                    </div>
                  </div>
                </div>
                <div className="hidden w-20 sm:block">
                  <Sparkline
                    data={asset.history.slice(-24)}
                    color={asset.change >= 0 ? "#7CF7C4" : "#FF6B6B"}
                    height={22}
                    fill={false}
                  />
                </div>
                <div className="text-right">
                  <div className="num text-[10.5px] text-white/70">
                    {asset.price < 1 ? asset.price.toFixed(4) : asset.price.toFixed(2)}
                  </div>
                  <div
                    className={cn(
                      "num text-[8px]",
                      asset.change >= 0 ? "text-mint" : "text-danger",
                    )}
                  >
                    {fmtPct(asset.change)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="overflow-hidden xl:col-span-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div>
              <Label>Social layer</Label>
              <div className="mt-1 flex items-center gap-2 text-[13px] text-white/80">
                The Wire <span className="h-1 w-1 rounded-full bg-mint" />
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("wire")}>
              Open <ArrowRight size={10} />
            </Button>
          </div>
          <div className="divide-y divide-white/[0.045]">
            {state.posts.slice(0, 3).map((post) => (
              <div key={post.id} className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Avatar initials={post.author.slice(0, 2)} color={post.color} size={22} />
                  <span className="text-[10px] text-white/70">{post.author}</span>
                  {post.verified && <span className="text-[7px] text-mint">◆</span>}
                  <span className="ml-auto font-mono text-[7.5px] text-white/20">{post.time}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-white/40">
                  {post.content}
                </p>
                <div className="mt-1 flex items-center gap-3 font-mono text-[7px] uppercase tracking-wider text-white/20">
                  <span>{fmtCompact(post.likes)} likes</span>
                  <span>{fmtCompact(post.replies)} replies</span>
                  <span className="text-mint/40">{post.sentiment}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="overflow-hidden xl:col-span-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div>
              <Label>Treasury</Label>
              <div className="mt-1 text-[13px] text-white/80">Cash ledger</div>
            </div>
            <Landmark size={13} className="text-white/25" />
          </div>
          <div className="px-4">
            {state.ledger.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-2 border-b border-white/[0.04] py-2.5 last:border-0">
                <div className="min-w-0">
                  <div className="truncate text-[9.5px] text-white/55">{entry.label}</div>
                  <div className="mt-0.5 font-mono text-[7px] uppercase tracking-wider text-white/20">
                    {entry.time} · {entry.kind}
                  </div>
                </div>
                <span
                  className={cn(
                    "num shrink-0 text-[9px]",
                    entry.amount >= 0 ? "text-mint/70" : "text-danger/70",
                  )}
                >
                  {entry.amount >= 0 ? "+" : ""}
                  {fmtMoney(entry.amount, 1)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Panel className="p-4">
          <Label>Empire composition</Label>
          <div className="mt-3 flex items-center gap-4">
            <Donut
              slices={allocation}
              size={108}
              thickness={11}
              center={
                <div className="text-center">
                  <div className="num text-[11px] text-white">{fmtMoney(worth)}</div>
                  <div className="label mt-0.5 text-[7px]">TOTAL</div>
                </div>
              }
            />
            <div className="flex-1 space-y-1.5">
              {allocation.slice(0, 5).map((slice) => (
                <div key={slice.label} className="flex items-center gap-2 text-[9px]">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: slice.color }} />
                  <span className="flex-1 text-white/35">{slice.label}</span>
                  <span className="num text-white/60">{fmtMoney(slice.value, 1)}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="p-4">
          <Label>Operating footprint</Label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { icon: <Radio size={12} />, label: "ISP subscribers", value: fmtCompact(state.isp.subscribers), sub: `${state.isp.uptime.toFixed(2)}% uptime` },
              { icon: <Users size={12} />, label: "Media reach", value: fmtCompact(state.media.channels.reduce((s, c) => s + c.reach, 0)), sub: `${state.media.channels.length} channels` },
              { icon: <Building2 size={12} />, label: "Employees", value: fmtNum(state.corporate.employees), sub: fmtMoney(state.corporate.revenue, 0) + "/tick" },
              { icon: <BriefcaseBusiness size={12} />, label: "Districts", value: `${state.districts.filter((d) => d.owned).length}/6`, sub: fmtMoney(propertyValue) },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                <div className="flex items-center gap-1.5 text-white/30">
                  {item.icon}
                  <span className="text-[8px] uppercase tracking-wider">{item.label}</span>
                </div>
                <div className="num mt-1 text-[13px] text-white/80">{item.value}</div>
                <div className="mt-0.5 text-[7.5px] text-white/25">{item.sub}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4">
          <Label>System integrity</Label>
          <div className="mt-3 space-y-2.5">
            {[
              { label: "Backbone uptime", value: state.isp.uptime, color: "#7CF7C4", suffix: "%" },
              { label: "Underworld heat", value: state.underworld.heat, color: "#FF6B6B", suffix: "" },
              { label: "Regulatory pressure", value: state.government.regulatoryPressure, color: "#F5C451", suffix: "" },
              { label: "Public trust", value: state.media.publicTrust, color: "#B69CFF", suffix: "" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-[9px]">
                  <span className="text-white/35">{item.label}</span>
                  <span className="num text-white/60">
                    {item.value.toFixed(item.suffix === "%" ? 2 : 0)}
                    {item.suffix}
                  </span>
                </div>
                <Progress value={item.value} color={item.color} height={3} className="mt-1" />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ArrowDownRight() {
  return <TrendingUp size={12} className="rotate-180" />;
}
