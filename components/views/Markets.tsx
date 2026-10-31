"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  Droplets,
  Flame,
  LineChart,
  Lock,
  PlusCircle,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useGame } from "../GameProvider";
import { Delta, Modal, Panel, Progress, SectionTitle, Segmented, Sparkline, Stat } from "../ui";
import { credits, compact, pct, price } from "@/lib/format";
import { mintToken, stakeToken, tradeStock, tradeToken, unstakeToken } from "@/lib/engine";

type Tab = "crypto" | "equities";

export function MarketsView() {
  const { state, act } = useGame();
  const [tab, setTab] = useState<Tab>("crypto");
  const [tokenId, setTokenId] = useState<string>(state?.tokens[0]?.id ?? "omni");
  const [corpId, setCorpId] = useState<string>(state?.corporations[0]?.id ?? "helix");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("50000");
  const [mintOpen, setMintOpen] = useState(false);
  const [stakeOpen, setStakeOpen] = useState(false);

  const token = state?.tokens.find((t) => t.id === tokenId) ?? state?.tokens[0];
  const corp = state?.corporations.find((c) => c.id === corpId) ?? state?.corporations[0];

  const tokenValue = useMemo(() => {
    if (!state) return 0;
    return Object.entries(state.player.holdings).reduce((n, [id, amt]) => {
      const t = state.tokens.find((x) => x.id === id);
      return n + (t ? amt * t.price : 0);
    }, 0);
  }, [state]);
  const stockValue = useMemo(() => {
    if (!state) return 0;
    return Object.entries(state.player.stocks).reduce((n, [id, shares]) => {
      const c = state.corporations.find((x) => x.id === id);
      return n + (c ? shares * c.sharePrice : 0);
    }, 0);
  }, [state]);

  if (!state || !token || !corp) return null;

  const numeric = Number(amount) || 0;
  const staked = state.player.stakes[token.id] ?? 0;
  const held = state.player.holdings[token.id] ?? 0;
  const shares = state.player.stocks[corp.id] ?? 0;

  const est = side === "buy" ? numeric / token.price : numeric * token.price;
  const stockEst = side === "buy" ? numeric / corp.sharePrice : numeric;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-acid" />
            <p className="mono text-[9px] uppercase tracking-[0.26em] text-acid">Markets & DEX</p>
          </div>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.035em] sm:text-[30px]">Price is a story with a bid.</h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            Constant-product liquidity, gas-equivalent fees, staking yield, and equities that reprice on
            sentiment. Large orders move the pool against you. Thin pools move further.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "crypto", label: "Crypto DEX" },
              { value: "equities", label: "Equities" },
            ]}
          />
          <button className="btn" onClick={() => setMintOpen(true)}>
            <PlusCircle className="h-3.5 w-3.5" /> Mint token
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="Token exposure" value={credits(tokenValue, true)} accent="#c9ff4d" sub={<span className="text-muted">{Object.keys(state.player.holdings).length} positions</span>} />
        <Stat label="Equity exposure" value={credits(stockValue, true)} accent="#8fa8ff" sub={<span className="text-muted">{Object.keys(state.player.stocks).length} listings</span>} />
        <Stat label="Pool liquidity" value={credits(state.tokens.reduce((n, t) => n + t.liquidity, 0), true)} sub={<span className="text-muted">Across {state.tokens.length} markets</span>} />
        <Stat label="Network load" value={`${Math.round(48 + state.tokens.reduce((n, t) => n + Math.abs(t.change24h), 0) / 8)}%`} accent="#ffb454" sub={<span className="text-muted">Gas fee 0.30%</span>} />
      </div>

      {tab === "crypto" ? (
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/60 px-4 py-3">
              <SectionTitle eyebrow="Spot markets" title="Syndicate DEX" icon={<Coins className="h-4 w-4" />} />
              <span className="chip border-mint/20 text-mint">
                <span className="h-1 w-1 rounded-full bg-mint pulse-dot" /> {state.tokens.filter((t) => !t.rugged).length} live
              </span>
            </div>
            <div className="hidden grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.8fr] gap-2 border-b border-line/40 px-4 py-2 sm:grid">
              {["Asset", "Price", "24h", "Liquidity", "Holders"].map((head) => (
                <span key={head} className={`mono text-[8px] uppercase tracking-[0.14em] text-dim ${head === "Asset" ? "" : "text-right"}`}>
                  {head}
                </span>
              ))}
            </div>
            <div className="divide-y divide-line/30">
              {state.tokens.map((t) => {
                const isActive = t.id === token.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTokenId(t.id)}
                    className={`grid w-full grid-cols-[1.2fr_1fr] items-center gap-2 px-4 py-2.5 text-left transition-colors sm:grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.8fr] ${
                      isActive ? "bg-acid/[0.055]" : "hover:bg-white/[0.025]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[9px] font-bold" style={{ background: `${t.color}16`, color: t.color }}>
                        {t.symbol.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11.5px] font-semibold">{t.symbol}</p>
                          {t.rugged && <span className="rounded bg-danger/15 px-1 text-[7px] uppercase text-danger">rugged</span>}
                          {t.creatorId === "player" && <span className="rounded bg-acid/15 px-1 text-[7px] uppercase text-acid">yours</span>}
                        </div>
                        <p className="mono truncate text-[8.5px] text-dim">{t.name}</p>
                      </div>
                    </div>
                    <div className="text-right sm:text-right">
                      <p className="mono text-[11px]">{t.rugged ? "—" : price(t.price)}</p>
                      <div className="sm:hidden">
                        <Delta value={t.change24h} />
                      </div>
                    </div>
                    <div className="hidden justify-end sm:flex">
                      <Delta value={t.change24h} />
                    </div>
                    <p className="mono hidden text-right text-[10px] text-muted sm:block">{credits(t.liquidity, true)}</p>
                    <p className="mono hidden text-right text-[10px] text-muted sm:block">{compact(t.holders)}</p>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-line/50 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono text-[8.5px] uppercase tracking-[0.14em] text-dim">Your tokens</span>
                {Object.entries(state.player.holdings).filter(([, n]) => n > 0).length === 0 && (
                  <span className="mono text-[9px] text-dim">No exposure</span>
                )}
                {Object.entries(state.player.holdings)
                  .filter(([, n]) => n > 0)
                  .map(([id, n]) => {
                    const t = state.tokens.find((x) => x.id === id);
                    return t ? (
                      <button key={id} onClick={() => setTokenId(id)} className="chip hover:border-acid/30 hover:text-acid">
                        {t.symbol} {compact(n, 2)}
                      </button>
                    ) : null;
                  })}
              </div>
            </div>
          </Panel>

          <Panel className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-bold" style={{ background: `${token.color}16`, color: token.color }}>
                  {token.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="text-[14px] font-semibold">{token.name}</p>
                  <p className="mono text-[9px] text-dim">{token.symbol} · by {token.creator}</p>
                </div>
              </div>
              <span className="mono rounded bg-white/[0.03] px-1.5 py-0.5 text-[8px] uppercase tracking-[0.1em] text-dim">AMM</span>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="mono text-[28px] font-semibold leading-none">{token.rugged ? "DELISTED" : `₡${price(token.price)}`}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Delta value={token.change24h} />
                  <span className="mono text-[9px] text-dim">24h</span>
                </div>
              </div>
              <div className="text-right">
                <p className="mono text-[8px] uppercase tracking-[0.12em] text-dim">Your value</p>
                <p className="mono mt-1 text-[13px] text-acid">{credits(held * token.price, true)}</p>
              </div>
            </div>

            <Sparkline data={token.history} color={token.color} height={96} width={380} strokeWidth={1.6} className="mt-4 h-[86px] w-full" />

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-abyss/50 p-2">
                <p className="mono text-[7.5px] uppercase tracking-[0.12em] text-dim">Liquidity</p>
                <p className="mono mt-1 text-[10px]">{credits(token.liquidity, true)}</p>
              </div>
              <div className="rounded-lg bg-abyss/50 p-2">
                <p className="mono text-[7.5px] uppercase tracking-[0.12em] text-dim">24h volume</p>
                <p className="mono mt-1 text-[10px]">{credits(token.volume, true)}</p>
              </div>
              <div className="rounded-lg bg-abyss/50 p-2">
                <p className="mono text-[7.5px] uppercase tracking-[0.12em] text-dim">Holders</p>
                <p className="mono mt-1 text-[10px]">{compact(token.holders)}</p>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between">
                <span className="mono flex items-center gap-1 text-[8.5px] uppercase tracking-[0.12em] text-dim">
                  <ShieldAlert className="h-2.5 w-2.5" /> Rug risk
                </span>
                <span className={`mono text-[9px] ${token.risk > 60 ? "text-danger" : token.risk > 30 ? "text-ember" : "text-mint"}`}>
                  {Math.round(token.risk)}/100
                </span>
              </div>
              <Progress value={token.risk} color={token.risk > 60 ? "#ff625c" : token.risk > 30 ? "#ffb454" : "#63f7c3"} height={3} className="mt-1.5" />
            </div>

            {token.rugged ? (
              <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-center">
                <Flame className="mx-auto h-4 w-4 text-danger" />
                <p className="mt-1.5 text-[11px] text-danger">Liquidity pulled. This market is finished.</p>
              </div>
            ) : (
              <>
                <div className="mt-4 flex items-center gap-1 rounded-lg border border-line/70 bg-void/60 p-0.5">
                  {(["buy", "sell"] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => {
                        setSide(value);
                        setAmount(value === "buy" ? "50000" : String(Math.max(0, state.player.holdings[token.id] ?? 0).toFixed(2)));
                      }}
                      className={`flex-1 rounded-md py-1.5 text-[10.5px] font-semibold capitalize transition-colors ${
                        side === value
                          ? value === "buy"
                            ? "bg-mint/15 text-mint"
                            : "bg-danger/15 text-danger"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <label className="mono text-[8px] uppercase tracking-[0.12em] text-dim">
                      {side === "buy" ? "Spend credits" : "Sell tokens"}
                    </label>
                    <button
                      className="mono text-[8px] text-acid"
                      onClick={() =>
                        setAmount(
                          side === "buy"
                            ? String(Math.floor(state.player.cash * 0.25))
                            : String((state.player.holdings[token.id] ?? 0) / 4),
                        )
                      }
                    >
                      max 25%
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <span className="mono pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-dim">₡</span>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                      inputMode="decimal"
                      className="input pl-7 pr-14 text-[12px]"
                      placeholder="0.00"
                    />
                    <button
                      className="mono absolute right-2 top-1/2 -translate-y-1/2 rounded bg-line/60 px-1.5 py-0.5 text-[8px] text-muted"
                      onClick={() =>
                        setAmount(
                          side === "buy"
                            ? String(Math.floor(state.player.cash))
                            : String(state.player.holdings[token.id] ?? 0),
                        )
                      }
                    >
                      MAX
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="mono text-[8.5px] text-dim">
                      {side === "buy"
                        ? `≈ ${compact(est, 2)} ${token.symbol}`
                        : `≈ ${credits(est, true)} after fee`}
                    </span>
                    <span className="mono text-[8.5px] text-dim">
                      {side === "buy" ? `balance ${credits(state.player.cash, true)}` : `held ${compact(held, 2)}`}
                    </span>
                  </div>
                </div>

                <button
                  className={`btn mt-3 w-full ${side === "buy" ? "btn-primary" : "btn-danger"}`}
                  disabled={numeric <= 0 || (side === "buy" ? numeric > state.player.cash : numeric > held)}
                  onClick={() => act((s) => tradeToken(s, token.id, side, numeric))}
                >
                  {side === "buy" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  {side === "buy" ? `Buy ${token.symbol}` : `Sell ${token.symbol}`}
                </button>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button className="btn py-1.5 text-[10px]" onClick={() => setStakeOpen(true)} disabled={held <= 0}>
                    <Lock className="h-3 w-3" /> Stake
                  </button>
                  <button
                    className="btn py-1.5 text-[10px]"
                    disabled={staked <= 0}
                    onClick={() => act((s) => unstakeToken(s, token.id, staked))}
                  >
                    Unstake all
                  </button>
                </div>
                {staked > 0 && (
                  <p className="mono mt-2 flex items-center justify-between text-[8.5px] text-dim">
                    <span className="flex items-center gap-1"><Droplets className="h-2.5 w-2.5 text-mint" /> Staked</span>
                    <span className="text-mint">{compact(staked, 2)} {token.symbol} · {credits(staked * token.price, true)}</span>
                  </p>
                )}
              </>
            )}
          </Panel>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/60 px-4 py-3">
              <SectionTitle eyebrow="Listed companies" title="City equities" icon={<TrendingUp className="h-4 w-4" />} />
              <span className="chip">T+1 settlement</span>
            </div>
            <div className="hidden grid-cols-[1.4fr_0.8fr_0.7fr_0.9fr_0.8fr] gap-2 border-b border-line/40 px-4 py-2 sm:grid">
              {["Company", "Price", "Day", "Sentiment", "Held"].map((head) => (
                <span key={head} className={`mono text-[8px] uppercase tracking-[0.14em] text-dim ${head === "Company" ? "" : "text-right"}`}>
                  {head}
                </span>
              ))}
            </div>
            <div className="divide-y divide-line/30">
              {state.corporations.map((c) => {
                const change = ((c.history.at(-1)! - c.history.at(-2)!) / c.history.at(-2)!) * 100;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCorpId(c.id)}
                    className={`grid w-full grid-cols-[1.2fr_1fr] items-center gap-2 px-4 py-2.5 text-left transition-colors sm:grid-cols-[1.4fr_0.8fr_0.7fr_0.9fr_0.8fr] ${
                      c.id === corp.id ? "bg-ice/[0.055]" : "hover:bg-white/[0.025]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[9px] font-bold" style={{ background: `${c.color}16`, color: c.color }}>
                        {c.ticker.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11.5px] font-semibold">{c.ticker}</p>
                        <p className="mono truncate text-[8.5px] text-dim">{c.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="mono text-[11px]">₡{price(c.sharePrice)}</p>
                      <div className="sm:hidden"><Delta value={change} /></div>
                    </div>
                    <div className="hidden justify-end sm:flex"><Delta value={change} /></div>
                    <div className="hidden justify-end sm:flex">
                      <div className="w-16">
                        <Progress value={c.sentiment} color={c.sentiment > 60 ? "#63f7c3" : c.sentiment > 40 ? "#ffb454" : "#ff625c"} height={3} />
                        <p className="mono mt-0.5 text-right text-[8px] text-dim">{Math.round(c.sentiment)}</p>
                      </div>
                    </div>
                    <p className="mono hidden text-right text-[10px] text-muted sm:block">
                      {compact(state.player.stocks[c.id] ?? 0, 1)}
                    </p>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="mono text-[9px] uppercase tracking-[0.16em] text-dim">Equity research</p>
                <p className="mt-1 text-[16px] font-semibold">{corp.name}</p>
                <p className="mono text-[9px] text-dim">{corp.ticker} · {corp.sector}</p>
              </div>
              <span className="chip">₡{price(corp.sharePrice)}</span>
            </div>
            <Sparkline data={corp.history} color={corp.color} height={100} width={380} className="mt-4 h-[90px] w-full" />
            <p className="mt-3 text-[10.5px] leading-relaxed text-muted">{corp.description}</p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-abyss/50 p-2">
                <p className="mono text-[7.5px] uppercase tracking-[0.12em] text-dim">Market cap</p>
                <p className="mono mt-1 text-[10px]">{credits(corp.sharePrice * corp.sharesOutstanding, true)}</p>
              </div>
              <div className="rounded-lg bg-abyss/50 p-2">
                <p className="mono text-[7.5px] uppercase tracking-[0.12em] text-dim">Revenue</p>
                <p className="mono mt-1 text-[10px]">{credits(corp.revenue, true)}</p>
              </div>
              <div className="rounded-lg bg-abyss/50 p-2">
                <p className="mono text-[7.5px] uppercase tracking-[0.12em] text-dim">Sentiment</p>
                <p className="mono mt-1 text-[10px]">{Math.round(corp.sentiment)}/100</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1 rounded-lg border border-line/70 bg-void/60 p-0.5">
              {(["buy", "sell"] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setSide(value)}
                  className={`flex-1 rounded-md py-1.5 text-[10.5px] font-semibold capitalize transition-colors ${
                    side === value ? (value === "buy" ? "bg-mint/15 text-mint" : "bg-danger/15 text-danger") : "text-muted hover:text-ink"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between">
                <label className="mono text-[8px] uppercase tracking-[0.12em] text-dim">Order value</label>
                <span className="mono text-[8.5px] text-dim">held {shares.toFixed(2)} shares</span>
              </div>
              <div className="relative mt-1">
                <span className="mono pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-dim">₡</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  inputMode="decimal"
                  className="input pl-7 text-[12px]"
                />
              </div>
              <p className="mono mt-1 text-[8.5px] text-dim">
                ≈ {side === "buy" ? stockEst.toFixed(2) : (numeric / corp.sharePrice).toFixed(2)} shares · {" "}
                {side === "sell" ? `max ${credits(shares * corp.sharePrice, true)}` : `cash ${credits(state.player.cash, true)}`}
              </p>
            </div>

            <button
              className={`btn mt-3 w-full ${side === "buy" ? "btn-primary" : "btn-danger"}`}
              disabled={numeric <= 0 || (side === "buy" ? numeric > state.player.cash : numeric > shares * corp.sharePrice)}
              onClick={() => act((s) => tradeStock(s, corp.id, side, numeric))}
            >
              {side === "buy" ? `Buy ${corp.ticker}` : `Sell ${corp.ticker}`}
            </button>

            {shares > 0 && (
              <button
                className="btn btn-ghost mt-2 w-full text-[10px]"
                onClick={() => act((s) => tradeStock(s, corp.id, "sell", shares * corp.sharePrice))}
              >
                Liquidate all {shares.toFixed(2)} shares
              </button>
            )}
          </Panel>
        </div>
      )}

      <Modal open={mintOpen} onClose={() => setMintOpen(false)} eyebrow="Token factory" title="Mint a new market" width="max-w-lg">
        <MintForm onDone={() => setMintOpen(false)} />
      </Modal>

      <Modal open={stakeOpen} onClose={() => setStakeOpen(false)} eyebrow="Liquidity program" title={`Stake ${token.symbol}`} width="max-w-md">
        <StakeForm tokenId={token.id} symbol={token.symbol} held={held} onDone={() => setStakeOpen(false)} />
      </Modal>
    </div>
  );
}

function MintForm({ onDone }: { onDone: () => void }) {
  const { state, act } = useGame();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [liquidity, setLiquidity] = useState("250000");
  if (!state) return null;
  const liq = Math.max(0, Number(liquidity) || 0);
  const available = state.player.cash - 50_000;
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-ice/20 bg-ice/[0.04] p-3">
        <p className="text-[10.5px] leading-relaxed text-ice/80">
          Minting costs a flat ₡50,000 protocol fee plus seeded liquidity. You receive 8% of the initial supply.
          Thin markets are volatile and easy to manipulate — including by your rivals.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mono mb-1 block text-[8.5px] uppercase tracking-[0.14em] text-dim">Token name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Eclipse Reserve" maxLength={28} />
        </div>
        <div>
          <label className="mono mb-1 block text-[8.5px] uppercase tracking-[0.14em] text-dim">Symbol</label>
          <input className="input uppercase" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="ECL" maxLength={6} />
        </div>
      </div>
      <div>
        <label className="mono mb-1 block text-[8.5px] uppercase tracking-[0.14em] text-dim">Seed liquidity</label>
        <div className="relative">
          <span className="mono pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-dim">₡</span>
          <input className="input pl-7" value={liquidity} onChange={(e) => setLiquidity(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" />
        </div>
        <div className="mt-1 flex gap-1.5">
          {[100_000, 250_000, 500_000].map((v) => (
            <button key={v} className="chip hover:border-acid/30 hover:text-acid" onClick={() => setLiquidity(String(v))}>
              {credits(v, true)}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-line/60 bg-abyss/50 p-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted">Protocol fee</span>
          <span className="mono">₡50,000</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px]">
          <span className="text-muted">Total deployed</span>
          <span className="mono text-acid">{credits(liq + 50_000)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px]">
          <span className="text-muted">Creator allocation</span>
          <span className="mono text-mint">≈ {compact(liq * 0.08, 0)} {symbol || "TOKEN"}</span>
        </div>
      </div>
      <button
        className="btn btn-primary w-full"
        disabled={liq < 100_000 || liq > available || name.trim().length < 2 || symbol.length < 2}
        onClick={() => {
          act((s) => mintToken(s, name, symbol, liq));
          onDone();
        }}
      >
        <Sparkles className="h-3.5 w-3.5" /> Mint & seed market
      </button>
      {liq > available && <p className="text-center text-[9px] text-danger">Insufficient cash. You can deploy up to {credits(Math.max(0, available), true)}.</p>}
    </div>
  );
}

function StakeForm({ tokenId, symbol, held, onDone }: { tokenId: string; symbol: string; held: number; onDone: () => void }) {
  const { act } = useGame();
  const [amount, setAmount] = useState((held / 2).toFixed(4));
  const numeric = Math.max(0, Number(amount) || 0);
  return (
    <div className="space-y-3">
      <p className="text-[10.5px] leading-relaxed text-muted">
        Staked tokens continue to bear market risk but earn a daily credit yield of 0.08% of position value
        (roughly 29% APR). Unstake at any time.
      </p>
      <div>
        <div className="flex items-center justify-between">
          <label className="mono text-[8.5px] uppercase tracking-[0.14em] text-dim">Amount</label>
          <button className="mono text-[8.5px] text-acid" onClick={() => setAmount(String(held))}>stake all</button>
        </div>
        <div className="relative mt-1">
          <input className="input pr-16" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" />
          <span className="mono absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-dim">{symbol}</span>
        </div>
        <p className="mono mt-1 text-[8.5px] text-dim">Available {held.toLocaleString(undefined, { maximumFractionDigits: 4 })} {symbol}</p>
      </div>
      <button
        className="btn btn-primary w-full"
        disabled={numeric <= 0 || numeric > held}
        onClick={() => {
          act((s) => stakeToken(s, tokenId, numeric));
          onDone();
        }}
      >
        <Lock className="h-3.5 w-3.5" /> Confirm stake
      </button>
    </div>
  );
}
