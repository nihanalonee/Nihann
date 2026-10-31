import {
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Coins,
  Droplets,
  Flame,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AreaChart, CandleChart, Sparkline } from "../components/charts";
import { Badge, Button, Label, Panel, Segmented } from "../components/ui";
import { useGame } from "../game/GameContext";
import { fmtCompact, fmtMoney, fmtNum, fmtPct, fmtPrice } from "../lib/format";
import { cn } from "../lib/cn";

type MarketTab = "terminal" | "dex";

export function Market() {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState<MarketTab>("terminal");
  const [kind, setKind] = useState<"stock" | "crypto">("crypto");
  const [selectedId, setSelectedId] = useState("omx");
  const [chartMode, setChartMode] = useState<"line" | "candle">("candle");
  const [range, setRange] = useState<"1H" | "1D" | "1W" | "ALL">("1D");
  const [search, setSearch] = useState("");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [qty, setQty] = useState("");
  const [fromId, setFromId] = useState("omx");
  const [toId, setToId] = useState("mema");
  const [swapAmount, setSwapAmount] = useState("");
  const [mintName, setMintName] = useState("");
  const [mintTicker, setMintTicker] = useState("");
  const [mintSupply, setMintSupply] = useState("100000000");
  const [mintLiquidity, setMintLiquidity] = useState("100000");

  const selected = state.assets.find((a) => a.id === selectedId) ?? state.assets[0];
  const holding = state.holdings[selected.id];
  const change = ((selected.price - selected.prevClose) / selected.prevClose) * 100;
  const history = useMemo(() => {
    if (range === "1H") return selected.history.slice(-12);
    if (range === "1D") return selected.history.slice(-32);
    return selected.history;
  }, [selected, range]);

  const listed = state.assets
    .filter((asset) => asset.kind === kind)
    .filter(
      (asset) =>
        !search.trim() ||
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.ticker.toLowerCase().includes(search.toLowerCase()),
    );

  const book = useMemo(() => {
    const asks = Array.from({ length: 8 }, (_, i) => ({
      price: selected.price * (1 + 0.0016 * (i + 1)),
      qty: (Math.sin(i * 3.7 + selected.price) + 1.4) * 1200 + i * 340,
    }));
    const bids = Array.from({ length: 8 }, (_, i) => ({
      price: selected.price * (1 - 0.0016 * (i + 1)),
      qty: (Math.cos(i * 2.9 + selected.price) + 1.5) * 1100 + i * 280,
    }));
    return { asks, bids };
  }, [selected.price, selected.id]);

  const tape = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        price: selected.price * (1 + Math.sin(i * 2.4 + selected.id.length) * 0.0035),
        size: Math.abs(Math.sin(i * 1.8 + selected.ticker.length)) * 4_200 + 120,
        side: i % 3 === 0 ? "sell" : "buy",
        time: `12:${(58 - i * 3).toString().padStart(2, "0")}`,
      })),
    [selected.price, selected.id, selected.ticker],
  );

  const holdingValue = holding ? holding.qty * selected.price : 0;
  const pnl = holding ? (selected.price - holding.avgCost) * holding.qty : 0;
  const quantity = Number(qty) || 0;
  const notional = quantity * selected.price;
  const feeRate = selected.kind === "crypto" ? 0.003 : 0.0012;
  const total = notional * (1 + feeRate);

  const from = state.assets.find((a) => a.id === fromId) ?? state.assets.find((a) => a.kind === "crypto")!;
  const to = state.assets.find((a) => a.id === toId) ?? state.assets.find((a) => a.kind === "crypto" && a.id !== from.id)!;
  const swapQty = Number(swapAmount) || 0;
  const swapGross = swapQty * from.price;
  const slippage = Math.min(8, (swapGross / Math.max(1, from.liquidity ?? 500_000)) * 20);
  const swapOut = swapGross > 0 ? ((swapGross * 0.997) * (1 - slippage / 100)) / to.price : 0;
  const swapRoute =
    from.id === "omx" || to.id === "omx"
      ? `${from.ticker} → ${to.ticker}`
      : `${from.ticker} → OMX → ${to.ticker}`;

  const volume = state.assets.reduce((sum, asset) => sum + (asset.liquidity ?? 0) * 1.8, 0);
  const omxDominance =
    ((state.assets.find((a) => a.id === "omx")?.price ?? 0) * 21_000_000) /
    Math.max(1, state.assets.filter((a) => a.kind === "crypto").reduce((s, a) => s + a.price * (a.supply ?? 0), 0));

  const setPct = (pct: number) => {
    if (side === "buy") {
      const max = Math.max(0, state.player.cash / (selected.price * (1 + feeRate)));
      setQty(String(Math.floor(max * pct)));
    } else {
      setQty(String(Math.floor((holding?.qty ?? 0) * pct)));
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-mint/70">EMPIRE / EXCHANGE</span>
            <Badge variant="mint">
              <span className="h-1 w-1 rounded-full bg-mint" /> MARKET OPEN
            </Badge>
          </div>
          <h1 className="mt-2 text-[30px] leading-none text-white md:text-[38px]">Markets & DEX</h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-white/40">
            A unified order book for equities, tokens, and the automated market makers that price
            them. Your order moves the market — size it accordingly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "terminal", label: "Terminal", icon: <BarChart3 size={11} /> },
              { value: "dex", label: "DEX & Launchpad", icon: <Droplets size={11} /> },
            ]}
          />
          <Button variant="primary" size="sm" onClick={() => setTab("dex")}>
            <Sparkles size={12} /> Mint token
          </Button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          {
            label: "24h notional",
            value: fmtMoney(volume, 1),
            sub: "across 11 markets",
            icon: <BarChart3 size={12} />,
            color: "#7CF7C4",
          },
          {
            label: "OMX dominance",
            value: `${(omxDominance * 100).toFixed(1)}%`,
            sub: "of crypto float",
            icon: <Coins size={12} />,
            color: "#F5C451",
          },
          {
            label: "Gas / compute",
            value: `${(8 + state.world.volatility / 12).toFixed(1)} gwei`,
            sub: state.world.volatility > 60 ? "congested" : "normal",
            icon: <Flame size={12} />,
            color: "#FF8FB1",
          },
          {
            label: "Market sentiment",
            value: `${Math.round(state.world.sentiment)}/100`,
            sub: state.world.sentiment > 50 ? "risk-on" : "risk-off",
            icon: <Waves size={12} />,
            color: "#B69CFF",
          },
        ].map((stat) => (
          <div key={stat.label} className="panel flex items-center justify-between p-3.5">
            <div>
              <div className="label">{stat.label}</div>
              <div className="num mt-1.5 text-[17px] text-white/90">{stat.value}</div>
              <div className="mt-0.5 text-[9px] text-white/25">{stat.sub}</div>
            </div>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg border"
              style={{ color: stat.color, borderColor: `${stat.color}25`, background: `${stat.color}0d` }}
            >
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {tab === "terminal" ? (
        <>
          <div className="grid gap-3 xl:grid-cols-12">
            <Panel className="overflow-hidden xl:col-span-3">
              <div className="border-b border-white/[0.06] p-3">
                <div className="flex items-center justify-between">
                  <Label>Watchlist</Label>
                  <span className="num text-[8px] text-white/25">{listed.length} MARKETS</span>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-black/25 px-2 py-1.5">
                  <Search size={11} className="text-white/25" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search ticker…"
                    className="w-full bg-transparent font-mono text-[9px] uppercase tracking-wider outline-none placeholder:text-white/20"
                  />
                </div>
                <Segmented
                  className="mt-2 w-full"
                  value={kind}
                  onChange={setKind}
                  options={[
                    { value: "crypto", label: "Tokens" },
                    { value: "stock", label: "Equities" },
                  ]}
                />
              </div>
              <div className="max-h-[460px] overflow-y-auto p-1.5">
                {listed.map((asset) => {
                  const dayChange = ((asset.price - asset.prevClose) / asset.prevClose) * 100;
                  return (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedId(asset.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition",
                        selected.id === asset.id
                          ? "border border-mint/20 bg-mint/[0.055]"
                          : "border border-transparent hover:bg-white/[0.03]",
                      )}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-mono text-[7.5px] font-semibold"
                        style={{
                          color: asset.color,
                          borderColor: `${asset.color}25`,
                          background: `${asset.color}0d`,
                        }}
                      >
                        {asset.ticker.slice(0, 3)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[10px] text-white/70">{asset.name}</div>
                        <div className="font-mono text-[7px] uppercase tracking-wider text-white/25">
                          {asset.ticker} · {asset.sector}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="num text-[9.5px] text-white/65">{fmtPrice(asset.price)}</div>
                        <div className={cn("num text-[7.5px]", dayChange >= 0 ? "text-mint" : "text-danger")}>
                          {fmtPct(dayChange, 1)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-white/[0.06] p-3">
                <div className="flex items-center justify-between text-[8px] text-white/25">
                  <span>24h volume</span>
                  <span className="num text-white/50">{fmtMoney(volume, 1)}</span>
                </div>
                <div className="mt-2 flex gap-1">
                  {[35, 60, 45, 80, 55, 72, 90, 66, 74, 82, 58, 68].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-mint/25"
                      style={{ height: h * 0.28, opacity: 0.3 + h / 200 }}
                    />
                  ))}
                </div>
              </div>
            </Panel>

            <Panel className="overflow-hidden xl:col-span-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl border font-mono text-[10px] font-semibold"
                    style={{
                      color: selected.color,
                      borderColor: `${selected.color}30`,
                      background: `${selected.color}10`,
                    }}
                  >
                    {selected.ticker.slice(0, 4)}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[18px] text-white">{selected.name}</h2>
                      <Badge variant="default">{selected.kind === "crypto" ? "TOKEN" : "EQUITY"}</Badge>
                    </div>
                    <div className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-white/30">
                      {selected.ticker} · {selected.sector} · {selected.kind === "crypto" ? "OmniDEX" : "OLX"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="num text-[24px] leading-none text-white">{fmtPrice(selected.price)}</div>
                  <div className={cn("num mt-1 text-[10px]", change >= 0 ? "text-mint" : "text-danger")}>
                    {change >= 0 ? <ArrowUpRight size={10} className="inline" /> : <TrendingDown size={10} className="inline" />}{" "}
                    {fmtPct(change)} today
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <Segmented
                  value={range}
                  onChange={setRange}
                  options={[
                    { value: "1H", label: "1H" },
                    { value: "1D", label: "1D" },
                    { value: "1W", label: "1W" },
                    { value: "ALL", label: "ALL" },
                  ]}
                />
                <div className="flex items-center gap-1.5">
                  {[
                    ["line", "Line"],
                    ["candle", "Candles"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setChartMode(value as "line" | "candle")}
                      className={cn(
                        "rounded-md border px-2 py-1 font-mono text-[8px] uppercase tracking-wider transition",
                        chartMode === value
                          ? "border-white/15 bg-white/[0.07] text-white/70"
                          : "border-transparent text-white/25 hover:text-white/55",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-3 pb-2">
                {chartMode === "line" ? (
                  <AreaChart
                    data={history}
                    height={278}
                    color={change >= 0 ? "#7CF7C4" : "#FF6B6B"}
                    format={(v) => fmtPrice(v)}
                  />
                ) : (
                  <CandleChart
                    data={history}
                    height={278}
                    color={change >= 0 ? "#7CF7C4" : "#FF6B6B"}
                    format={(v) => fmtPrice(v)}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-px border-t border-white/[0.06] bg-white/[0.06] sm:grid-cols-4">
                {[
                  ["Market cap", fmtMoney(selected.kind === "crypto" ? (selected.supply ?? 0) * selected.price : selected.price * 18_000_000)],
                  ["24h volume", fmtMoney((selected.liquidity ?? 2_000_000) * 1.8)],
                  ["Liquidity", selected.kind === "crypto" ? fmtMoney(selected.liquidity ?? 0) : "—"],
                  ["Volatility", `${selected.volatility > 0.04 ? "HIGH" : selected.volatility > 0.02 ? "MED" : "LOW"} · ${(selected.volatility * 100).toFixed(1)}%`],
                ].map(([label, value]) => (
                  <div key={label} className="bg-[#0a0e16] px-3 py-2.5">
                    <div className="label">{label}</div>
                    <div className="num mt-1 text-[10px] text-white/65">{value}</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="overflow-hidden xl:col-span-3">
              <div className="border-b border-white/[0.06] p-3">
                <div className="flex items-center justify-between">
                  <Label>Order ticket</Label>
                  <span className="font-mono text-[8px] text-white/25">MARKET</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-white/[0.07] bg-black/25 p-0.5">
                  {(["buy", "sell"] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => setSide(value)}
                      className={cn(
                        "rounded-md py-1.5 font-mono text-[9px] uppercase tracking-wider transition",
                        side === value
                          ? value === "buy"
                            ? "bg-mint/15 text-mint"
                            : "bg-danger/15 text-danger"
                          : "text-white/30 hover:text-white/60",
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between text-[9px] text-white/30">
                  <span>Quantity</span>
                  <span className="num">
                    Available {side === "buy" ? fmtMoney(state.player.cash) : `${fmtNum(holding?.qty ?? 0)} ${selected.ticker}`}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center rounded-lg border border-white/10 bg-black/30 px-2.5">
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="0"
                    className="num w-full bg-transparent py-2 text-[16px] text-white outline-none placeholder:text-white/15"
                  />
                  <span className="font-mono text-[8px] text-white/30">{selected.ticker}</span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setPct(pct / 100)}
                      className="rounded border border-white/[0.07] py-1 font-mono text-[8px] text-white/30 transition hover:border-white/20 hover:text-white/60"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                <div className="mt-3 space-y-1.5 rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
                  {[
                    ["Notional", fmtMoney(notional)],
                    ["Protocol fee", fmtMoney(notional * feeRate)],
                    ["Slippage", `${Math.min(4, (notional / 8_000_000) * 18).toFixed(2)}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-[9px]">
                      <span className="text-white/30">{label}</span>
                      <span className="num text-white/55">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-white/[0.05] pt-1.5 text-[10px]">
                    <span className="text-white/45">Total</span>
                    <span className="num text-white">{fmtMoney(total)}</span>
                  </div>
                </div>

                <Button
                  variant={side === "buy" ? "primary" : "danger"}
                  className="mt-2.5 w-full py-2.5"
                  disabled={quantity <= 0}
                  onClick={() => {
                    dispatch({ type: "TRADE", assetId: selected.id, side, qty: quantity });
                    setQty("");
                  }}
                >
                  {side === "buy" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  Execute {side}
                </Button>

                {holding && (
                  <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="label">Your position</span>
                      <span className={cn("num text-[9px]", pnl >= 0 ? "text-mint" : "text-danger")}>
                        {pnl >= 0 ? "+" : ""}
                        {fmtMoney(pnl)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex justify-between text-[9px]">
                      <span className="text-white/35">{fmtNum(holding.qty)} {selected.ticker}</span>
                      <span className="num text-white/60">{fmtMoney(holdingValue)}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-[8px] text-white/25">
                      <span>Avg cost {fmtPrice(holding.avgCost)}</span>
                      <span>{((selected.price / holding.avgCost - 1) * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-12">
            <Panel className="overflow-hidden xl:col-span-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div>
                  <Label>Order book</Label>
                  <div className="mt-1 text-[12px] text-white/65">{selected.ticker} / USD</div>
                </div>
                <Badge variant="default">DEPTH 0.15%</Badge>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-3 gap-2 px-1 pb-1 font-mono text-[7px] uppercase tracking-wider text-white/20">
                  <span>Price</span>
                  <span className="text-right">Size</span>
                  <span className="text-right">Total</span>
                </div>
                {book.asks.slice().reverse().map((level, index) => {
                  const totalQty = book.asks.reduce((s, l, i) => s + (i >= 7 - index ? l.qty : 0), 0);
                  return (
                    <div key={`ask-${index}`} className="relative grid grid-cols-3 gap-2 px-1 py-[3px] text-[8.5px]">
                      <div
                        className="absolute inset-y-0 right-0 rounded-sm bg-danger/[0.06]"
                        style={{ width: `${Math.min(100, (level.qty / 4000) * 100)}%` }}
                      />
                      <span className="num relative z-10 text-danger/80">{level.price.toFixed(selected.price < 1 ? 4 : 2)}</span>
                      <span className="num relative z-10 text-right text-white/40">{fmtNum(level.qty)}</span>
                      <span className="num relative z-10 text-right text-white/25">{fmtNum(totalQty)}</span>
                    </div>
                  );
                })}
                <div className="my-1.5 flex items-center justify-between rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1.5">
                  <span className="num text-[11px] text-white">{fmtPrice(selected.price)}</span>
                  <span className="font-mono text-[7px] uppercase tracking-wider text-mint/60">LAST</span>
                </div>
                {book.bids.map((level, index) => (
                  <div key={`bid-${index}`} className="relative grid grid-cols-3 gap-2 px-1 py-[3px] text-[8.5px]">
                    <div
                      className="absolute inset-y-0 right-0 rounded-sm bg-mint/[0.06]"
                      style={{ width: `${Math.min(100, (level.qty / 4000) * 100)}%` }}
                    />
                    <span className="num relative z-10 text-mint/80">{level.price.toFixed(selected.price < 1 ? 4 : 2)}</span>
                    <span className="num relative z-10 text-right text-white/40">{fmtNum(level.qty)}</span>
                    <span className="num relative z-10 text-right text-white/25">{fmtNum(level.qty * 1.2)}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="overflow-hidden xl:col-span-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div>
                  <Label>Recent tape</Label>
                  <div className="mt-1 text-[12px] text-white/65">Live fills</div>
                </div>
                <span className="flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-wider text-mint/60">
                  <span className="h-1 w-1 animate-pulse-dot rounded-full bg-mint" /> STREAMING
                </span>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-4 gap-2 px-1 pb-1 font-mono text-[7px] uppercase tracking-wider text-white/20">
                  <span>Price</span>
                  <span className="text-right">Size</span>
                  <span className="text-right">Side</span>
                  <span className="text-right">Time</span>
                </div>
                {tape.map((trade, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 border-b border-white/[0.03] px-1 py-1.5 text-[8.5px] last:border-0">
                    <span className="num text-white/55">{fmtPrice(trade.price)}</span>
                    <span className="num text-right text-white/35">{fmtNum(trade.size)}</span>
                    <span className={cn("text-right font-mono text-[7.5px] uppercase", trade.side === "buy" ? "text-mint/65" : "text-danger/65")}>
                      {trade.side}
                    </span>
                    <span className="num text-right text-white/20">{trade.time}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="overflow-hidden xl:col-span-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div>
                  <Label>Portfolio</Label>
                  <div className="mt-1 text-[12px] text-white/65">Open positions</div>
                </div>
                <Badge variant="violet">{Object.keys(state.holdings).length} ASSETS</Badge>
              </div>
              <div className="max-h-[282px] overflow-y-auto px-3">
                {Object.entries(state.holdings).map(([id, position]) => {
                  const asset = state.assets.find((a) => a.id === id);
                  if (!asset) return null;
                  const value = asset.price * position.qty;
                  const pnlPct = (asset.price / position.avgCost - 1) * 100;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setSelectedId(id);
                        setKind(asset.kind);
                      }}
                      className="flex w-full items-center gap-2 border-b border-white/[0.045] py-2.5 text-left last:border-0"
                    >
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-md border font-mono text-[7px]"
                        style={{ color: asset.color, borderColor: `${asset.color}25`, background: `${asset.color}0d` }}
                      >
                        {asset.ticker.slice(0, 3)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[9.5px] text-white/60">{asset.name}</div>
                        <div className="font-mono text-[7px] text-white/25">{fmtNum(position.qty)} {asset.ticker}</div>
                      </div>
                      <div className="text-right">
                        <div className="num text-[9px] text-white/60">{fmtMoney(value)}</div>
                        <div className={cn("num text-[7.5px]", pnlPct >= 0 ? "text-mint/70" : "text-danger/70")}>
                          {fmtPct(pnlPct, 1)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Panel>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-3 xl:grid-cols-12">
            <Panel className="overflow-hidden xl:col-span-5">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div>
                  <Label>OmniDEX</Label>
                  <div className="mt-1 text-[13px] text-white/80">Atomic swap</div>
                </div>
                <Badge variant="mint">0.3% FEE</Badge>
              </div>
              <div className="p-4">
                <div className="rounded-xl border border-white/[0.07] bg-black/25 p-3">
                  <div className="flex justify-between text-[9px] text-white/30">
                    <span>You pay</span>
                    <span className="num">Balance {fmtNum(state.holdings[from.id]?.qty ?? 0)} {from.ticker}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      value={swapAmount}
                      onChange={(e) => setSwapAmount(e.target.value)}
                      placeholder="0.00"
                      className="num w-full bg-transparent text-[24px] text-white outline-none placeholder:text-white/15"
                    />
                    <select
                      value={fromId}
                      onChange={(e) => setFromId(e.target.value)}
                      className="rounded-lg border border-white/10 bg-[#0b1019] px-2 py-1.5 font-mono text-[10px] text-white outline-none"
                    >
                      {state.assets.filter((a) => a.kind === "crypto").map((asset) => (
                        <option key={asset.id} value={asset.id}>{asset.ticker}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-1 text-right font-mono text-[8px] text-white/20">≈ {fmtMoney(swapGross)}</div>
                </div>

                <div className="relative z-10 -my-2 flex justify-center">
                  <button
                    onClick={() => {
                      setFromId(toId);
                      setToId(fromId);
                    }}
                    className="rounded-lg border border-white/15 bg-[#0b1019] p-1.5 text-white/45 transition hover:border-mint/40 hover:text-mint"
                  >
                    <ArrowDownUp size={13} />
                  </button>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-black/25 p-3">
                  <div className="flex justify-between text-[9px] text-white/30">
                    <span>You receive</span>
                    <span className="num">Balance {fmtNum(state.holdings[to.id]?.qty ?? 0)} {to.ticker}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="num w-full text-[24px] text-white/80">
                      {swapOut > 0 ? swapOut.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}
                    </div>
                    <select
                      value={toId}
                      onChange={(e) => setToId(e.target.value)}
                      className="rounded-lg border border-white/10 bg-[#0b1019] px-2 py-1.5 font-mono text-[10px] text-white outline-none"
                    >
                      {state.assets.filter((a) => a.kind === "crypto").map((asset) => (
                        <option key={asset.id} value={asset.id}>{asset.ticker}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-1 text-right font-mono text-[8px] text-white/20">≈ {fmtMoney(swapOut * to.price)}</div>
                </div>

                <div className="mt-3 space-y-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  {[
                    ["Rate", `1 ${from.ticker} = ${(from.price / to.price).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${to.ticker}`],
                    ["Slippage", `${slippage.toFixed(2)}%`],
                    ["Minimum received", `${(swapOut * 0.995).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to.ticker}`],
                    ["Route", swapRoute],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-[9px]">
                      <span className="text-white/30">{label}</span>
                      <span className="num text-white/55">{value}</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant="primary"
                  className="mt-3 w-full py-2.5"
                  disabled={swapQty <= 0 || swapQty > (state.holdings[from.id]?.qty ?? 0)}
                  onClick={() => {
                    dispatch({ type: "SWAP", from: fromId, to: toId, amount: swapQty });
                    setSwapAmount("");
                  }}
                >
                  <Zap size={12} /> Route swap
                </Button>
              </div>
            </Panel>

            <Panel className="overflow-hidden xl:col-span-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div>
                  <Label>Liquidity</Label>
                  <div className="mt-1 text-[13px] text-white/80">Active pools</div>
                </div>
                <Badge variant="violet">{state.assets.filter((a) => a.kind === "crypto").length} POOLS</Badge>
              </div>
              <div className="max-h-[510px] overflow-y-auto px-3">
                {state.assets
                  .filter((a) => a.kind === "crypto")
                  .map((asset) => {
                    const liquidity = asset.liquidity ?? 0;
                    const daily = liquidity * (0.6 + (asset.ticker.charCodeAt(0) % 7) / 10);
                    const apr = Math.min(999, (daily * 0.003 * 365) / Math.max(1, liquidity) * 100);
                    return (
                      <div key={asset.id} className="border-b border-white/[0.045] py-2.5 last:border-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="flex h-6 w-6 items-center justify-center rounded border font-mono text-[6.5px]"
                              style={{ color: asset.color, borderColor: `${asset.color}25`, background: `${asset.color}0d` }}
                            >
                              {asset.ticker.slice(0, 3)}
                            </span>
                            <div>
                              <div className="text-[9.5px] text-white/60">{asset.ticker}/OMX</div>
                              <div className="font-mono text-[7px] text-white/20">{asset.sector}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="num text-[9px] text-white/60">{fmtMoney(liquidity)}</div>
                            <div className="num text-[7.5px] text-mint/55">{apr.toFixed(1)}% APR</div>
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                            <div className="h-full rounded-full bg-mint/40" style={{ width: `${Math.min(100, liquidity / 100_000)}%` }} />
                          </div>
                          <span className="num text-[7px] text-white/20">{fmtMoney(daily)} vol</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Panel>

            <Panel className="overflow-hidden xl:col-span-3">
              <div className="border-b border-white/[0.06] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-gold" />
                  <div>
                    <Label>Launchpad</Label>
                    <div className="mt-0.5 text-[13px] text-white/80">Mint a token</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2.5 p-4">
                <div>
                  <div className="label mb-1.5">Token name</div>
                  <input className="field" value={mintName} onChange={(e) => setMintName(e.target.value)} placeholder="Nebula Reserve" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="label mb-1.5">Ticker</div>
                    <input
                      className="field uppercase"
                      value={mintTicker}
                      onChange={(e) => setMintTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                      placeholder="NEB"
                    />
                  </div>
                  <div>
                    <div className="label mb-1.5">Supply</div>
                    <input className="field num" type="number" value={mintSupply} onChange={(e) => setMintSupply(e.target.value)} />
                  </div>
                </div>
                <div>
                  <div className="label mb-1.5">Seed liquidity (USD)</div>
                  <input className="field num" type="number" value={mintLiquidity} onChange={(e) => setMintLiquidity(e.target.value)} />
                </div>
                <div className="rounded-lg border border-gold/15 bg-gold/[0.04] p-2.5 text-[9px] leading-relaxed text-gold/70">
                  You receive 10% of supply. The pool opens at a fully diluted valuation of 2× seed
                  liquidity. Rug pulls are possible; so are consequences.
                </div>
                <Button
                  variant="gold"
                  className="w-full"
                  disabled={!mintName || mintTicker.length < 2 || Number(mintLiquidity) > state.player.cash}
                  onClick={() => {
                    dispatch({
                      type: "MINT",
                      name: mintName,
                      ticker: mintTicker,
                      supply: Number(mintSupply),
                      liquidity: Number(mintLiquidity),
                    });
                    setMintName("");
                    setMintTicker("");
                  }}
                >
                  <Coins size={12} /> Mint & list
                </Button>
                <div className="text-center font-mono text-[8px] text-white/20">
                  Available {fmtMoney(state.player.cash)}
                </div>
              </div>
            </Panel>
          </div>

          <Panel className="mt-3 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div>
                <Label>Token registry</Label>
                <div className="mt-1 text-[13px] text-white/80">Every asset trading on OmniDEX</div>
              </div>
              <span className="num text-[9px] text-white/25">{state.assets.filter((a) => a.kind === "crypto").length} LISTED</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.05] font-mono text-[7.5px] uppercase tracking-wider text-white/25">
                    <th className="px-4 py-2.5 font-normal">Asset</th>
                    <th className="px-3 py-2.5 font-normal">Price</th>
                    <th className="px-3 py-2.5 font-normal">24h</th>
                    <th className="px-3 py-2.5 font-normal">Liquidity</th>
                    <th className="px-3 py-2.5 font-normal">Supply</th>
                    <th className="px-3 py-2.5 font-normal">Creator</th>
                    <th className="px-3 py-2.5 font-normal">Chart</th>
                  </tr>
                </thead>
                <tbody>
                  {state.assets.filter((a) => a.kind === "crypto").map((asset) => {
                    const dayChange = ((asset.price - asset.prevClose) / asset.prevClose) * 100;
                    return (
                      <tr key={asset.id} className="table-row">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: asset.color }} />
                            <span className="text-[10px] text-white/65">{asset.name}</span>
                            <span className="font-mono text-[8px] text-white/25">{asset.ticker}</span>
                          </div>
                        </td>
                        <td className="num px-3 py-2.5 text-[9.5px] text-white/60">{fmtPrice(asset.price)}</td>
                        <td className={cn("num px-3 py-2.5 text-[9px]", dayChange >= 0 ? "text-mint" : "text-danger")}>{fmtPct(dayChange)}</td>
                        <td className="num px-3 py-2.5 text-[9px] text-white/45">{fmtMoney(asset.liquidity ?? 0)}</td>
                        <td className="num px-3 py-2.5 text-[9px] text-white/45">{fmtCompact(asset.supply ?? 0)}</td>
                        <td className="px-3 py-2.5 font-mono text-[8px] text-white/30">{asset.creator ?? "protocol"}</td>
                        <td className="w-24 px-3 py-2.5">
                          <Sparkline data={asset.history.slice(-24)} color={dayChange >= 0 ? "#7CF7C4" : "#FF6B6B"} height={20} fill={false} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
