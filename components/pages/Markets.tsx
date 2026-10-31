'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CandlestickChart,
  Coins,
  Droplets,
  Flame,
  Gauge,
  Layers,
  LineChart,
  Lock,
  Plus,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useGame } from '../GameProvider'
import { AreaChart, Badge, CandleChart, Delta, KV, Panel, Progress, SectionHeading, Sparkline, StatCard, Tabs } from '../ui'
import { classNames, money, num, pct, tokenPrice, trendOf } from '@/lib/format'
import { corpChange, marketCap, tokenChange } from '@/lib/economy'
import { buyShares, buyToken, claimRewards, corporateRaid, flashLoan, mintToken, rugPull, sellShares, sellToken, stakeToken, unstakeToken } from '@/lib/actions'
import type { Token } from '@/lib/types'

function TokenTable({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const { state } = useGame()
  return (
    <Panel className="overflow-hidden" eyebrow="SPOT & AMM" title="Token universe" action={<Badge tone="good">{state.tokens.filter((token) => !token.rugged).length} LIVE</Badge>} dense>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse">
          <thead>
            <tr className="border-b border-ink-600/35 text-left">
              <th className="label py-2 font-normal">Asset</th>
              <th className="label py-2 text-right font-normal">Price</th>
              <th className="label py-2 text-right font-normal">24h</th>
              <th className="label py-2 text-right font-normal">Liquidity</th>
              <th className="label py-2 text-right font-normal">Volume</th>
              <th className="label py-2 text-right font-normal">Holders</th>
              <th className="label py-2 pl-3 text-right font-normal">Trend</th>
            </tr>
          </thead>
          <tbody>
            {state.tokens.map((token) => {
              const change = tokenChange(token)
              const active = token.id === selectedId
              return (
                <tr
                  key={token.id}
                  onClick={() => onSelect(token.id)}
                  className={classNames('cursor-pointer border-b border-ink-600/20 last:border-0 transition-colors', active ? 'bg-mint-400/6' : 'hover:bg-ink-800/30')}
                >
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center border font-mono text-[8px] font-bold" style={{ borderColor: `hsla(${token.hue}, 70%, 60%, 0.3)`, color: `hsl(${token.hue}, 78%, 70%)`, background: `hsla(${token.hue}, 70%, 50%, 0.06)` }}>
                        {token.symbol.slice(0, 2)}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-fog-200">
                          ${token.symbol}
                          {token.rugged && <span className="text-[8px] text-rose-400">RUGGED</span>}
                        </div>
                        <div className="micro">{token.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-fog-200">{tokenPrice(token.price)}</td>
                  <td className={classNames('py-2.5 text-right font-mono text-[10px]', change >= 0 ? 'text-mint-300' : 'text-rose-300')}>{pct(change)}</td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-fog-400">{money(token.liquidity, true)}</td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-fog-400">{money(token.volume24h, true)}</td>
                  <td className="py-2.5 text-right font-mono text-[10px] text-fog-400">{num(token.holders)}</td>
                  <td className="w-20 py-2.5 pl-3">
                    <div className="h-5">
                      <Sparkline data={token.history.slice(-22)} hue={token.hue} height={20} fill={false} strokeWidth={1.2} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function TokenTerminal({ token }: { token: Token }) {
  const { state, runAction } = useGame()
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('25000')
  const [stakeAmount, setStakeAmount] = useState('')
  const holding = state.player.holdings.find((item) => item.tokenId === token.id)
  const change = tokenChange(token)
  const numericAmount = Math.max(0, Number(amount) || 0)
  const numericStake = Math.max(0, Number(stakeAmount) || 0)
  const estimateUnits = (numericAmount * 0.997) / Math.max(token.price, 0.0000001)
  const estimateProceeds = numericAmount * token.price * 0.996
  const positionValue = holding ? (holding.units + holding.staked) * token.price + holding.pending : 0
  const pnl = holding ? (token.price - holding.avgCost) * (holding.units + holding.staked) + holding.pending : 0

  const execute = () => {
    if (side === 'buy') runAction((current) => buyToken(current, token.id, numericAmount))
    else runAction((current) => sellToken(current, token.id, numericAmount))
  }

  return (
    <div className="space-y-3">
      <Panel
        eyebrow={`${token.creatorType.toUpperCase()} ISSUED · ${token.creator}`}
        title={`$${token.symbol} / USD`}
        action={<Badge tone={token.rugged ? 'bad' : change >= 0 ? 'good' : 'bad'}>{token.rugged ? 'DEAD' : pct(change)}</Badge>}
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="stat-value text-[30px] font-semibold leading-none text-fog-100">{tokenPrice(token.price)}</div>
            <div className="mt-2 flex items-center gap-2">
              <Delta value={change} />
              <span className="micro">24H</span>
            </div>
          </div>
          <div className="text-right">
            <div className="micro">Liquidity</div>
            <div className="stat-value mt-0.5 text-[13px] text-fog-200">{money(token.liquidity, true)}</div>
            <div className="micro mt-1.5">Supply {money(token.supply, true)}</div>
          </div>
        </div>
        <div className="mt-4 h-[190px]">
          <CandleChart data={token.history.slice(-56)} hue={token.hue} height={190} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-ink-600/30 pt-3 sm:grid-cols-4">
          <KV label="Volume" value={money(token.volume24h, true)} />
          <KV label="Holders" value={num(token.holders)} />
          <KV label="Staked" value={money(token.staked * token.price, true)} />
          <KV label="APR" value={`${token.apr.toFixed(1)}%`} />
        </div>
      </Panel>

      <Panel eyebrow="EXECUTION TERMINAL" title="Trade" dense>
        <div className="grid grid-cols-2 gap-1 border border-ink-600/35 p-1">
          <button type="button" onClick={() => setSide('buy')} className={classNames('py-2 font-mono text-[10px] tracking-wider transition-colors', side === 'buy' ? 'bg-mint-400 text-ink-950' : 'text-fog-400 hover:text-fog-200')}>
            BUY
          </button>
          <button type="button" onClick={() => setSide('sell')} className={classNames('py-2 font-mono text-[10px] tracking-wider transition-colors', side === 'sell' ? 'bg-rose-400 text-ink-950' : 'text-fog-400 hover:text-fog-200')}>
            SELL
          </button>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="label">{side === 'buy' ? 'Spend USD' : 'Sell units'}</span>
            <span className="micro">CASH {money(state.player.cash, true)}</span>
          </div>
          <div className="relative mt-1.5">
            <input className="input pr-12 text-[13px]" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] text-fog-600">{side === 'buy' ? 'USD' : token.symbol}</span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {['10000', '50000', '100000', side === 'buy' ? String(Math.floor(state.player.cash)) : String(Math.floor(holding?.units ?? 0))].map((value, index) => (
              <button key={index} type="button" onClick={() => setAmount(value)} className="border border-ink-600/35 py-1 font-mono text-[8px] tracking-wider text-fog-500 hover:border-mint-400/40 hover:text-mint-300">
                {index === 3 ? 'MAX' : `$${Number(value) >= 1000 ? `${Number(value) / 1000}K` : value}`}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-1 border border-ink-600/30 bg-ink-900/40 p-2.5">
            <div className="flex justify-between text-[10px]"><span className="text-fog-500">{side === 'buy' ? 'Est. units' : 'Est. proceeds'}</span><span className="mono text-fog-200">{side === 'buy' ? num(estimateUnits, 2) : money(estimateProceeds)}</span></div>
            <div className="flex justify-between text-[10px]"><span className="text-fog-500">Slippage / fee</span><span className="mono text-fog-400">0.3% + gas</span></div>
            <div className="flex justify-between text-[10px]"><span className="text-fog-500">Price impact</span><span className="mono text-amber-300">{((numericAmount / Math.max(token.liquidity, 1)) * 62).toFixed(2)}%</span></div>
          </div>
          <button type="button" onClick={execute} disabled={token.rugged || numericAmount <= 0} className={classNames('btn mt-3 w-full py-2.5', side === 'buy' ? 'btn-primary' : 'btn-danger')}>
            {side === 'buy' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {side === 'buy' ? `Buy $${token.symbol}` : `Sell $${token.symbol}`}
          </button>
        </div>
      </Panel>

      <Panel eyebrow="POSITION & YIELD" title="Your book" dense>
        {holding ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-ink-600/30 bg-ink-900/40 p-2"><div className="micro">Position</div><div className="mono mt-1 text-[12px] text-fog-100">{num(holding.units + holding.staked, 2)}</div><div className="micro mt-0.5">{money(positionValue, true)}</div></div>
              <div className="border border-ink-600/30 bg-ink-900/40 p-2"><div className="micro">Unrealized</div><div className={classNames('mono mt-1 text-[12px]', pnl >= 0 ? 'text-mint-300' : 'text-rose-300')}>{pnl >= 0 ? '+' : ''}{money(pnl, true)}</div><div className="micro mt-0.5">Avg {tokenPrice(holding.avgCost)}</div></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px]"><span className="text-fog-500">Liquid / staked</span><span className="mono text-fog-200">{num(holding.units, 2)} / {num(holding.staked, 2)}</span></div>
              <Progress value={holding.staked + holding.units > 0 ? (holding.staked / (holding.staked + holding.units)) * 100 : 0} hue={token.hue} height={4} />
              <div className="flex items-center justify-between text-[10px]"><span className="text-fog-500">Pending rewards</span><span className="mono text-mint-300">{money(holding.pending)}</span></div>
            </div>
            <div className="flex gap-1">
              <input className="input flex-1 py-1.5 text-[10px]" placeholder="Units to stake" value={stakeAmount} onChange={(event) => setStakeAmount(event.target.value)} inputMode="decimal" />
              <button type="button" className="btn px-2 py-1 text-[9px]" onClick={() => runAction((current) => stakeToken(current, token.id, numericStake))}>Stake</button>
              <button type="button" className="btn px-2 py-1 text-[9px]" onClick={() => runAction((current) => unstakeToken(current, token.id, numericStake))}>Unstake</button>
            </div>
            <button type="button" className="btn w-full py-1.5 text-[9px]" onClick={() => runAction((current) => claimRewards(current, token.id))}>
              <Coins size={11} /> Claim rewards
            </button>
          </div>
        ) : (
          <div className="border border-dashed border-ink-600/40 p-4 text-center text-[10px] text-fog-500">No position. Buy the asset to open a book.</div>
        )}
      </Panel>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn py-2 text-[9px]" onClick={() => runAction((current) => flashLoan(current, token.id))} disabled={token.rugged}>
          <Zap size={11} /> Flash loan
        </button>
        {token.creatorId === 'player' && !token.rugged ? (
          <button type="button" className="btn btn-danger py-2 text-[9px]" onClick={() => runAction((current) => rugPull(current, token.id))}>
            <ShieldAlert size={11} /> Rug pull
          </button>
        ) : (
          <div className="flex items-center justify-center border border-ink-600/30 px-2 text-center font-mono text-[8px] tracking-wider text-fog-600">
            {token.rugged ? 'MARKET DEAD' : 'NOT ISSUER'}
          </div>
        )}
      </div>
    </div>
  )
}

function EquitiesTab() {
  const { state, runAction } = useGame()
  const [selectedId, setSelectedId] = useState(state.corporations[0]?.id ?? '')
  const [amount, setAmount] = useState('100000')
  const [shares, setShares] = useState('')
  const corp = state.corporations.find((item) => item.id === selectedId) ?? state.corporations[0]
  const change = corp ? corpChange(corp) : 0
  const ownership = corp ? (corp.playerShares / Math.max(1, corp.sharesOutstanding)) * 100 : 0
  const value = corp ? corp.playerShares * corp.sharePrice : 0
  const numericAmount = Math.max(0, Number(amount) || 0)
  const numericShares = Math.max(0, Number(shares) || 0)

  if (!corp) return null

  return (
    <div className="grid grid-cols-12 gap-4">
      <Panel className="col-span-12 xl:col-span-8" eyebrow="PUBLIC EQUITIES" title="Corporate listings" dense>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-ink-600/35 text-left">
                <th className="label py-2 font-normal">Ticker</th>
                <th className="label py-2 text-right font-normal">Price</th>
                <th className="label py-2 text-right font-normal">24h</th>
                <th className="label py-2 text-right font-normal">Market cap</th>
                <th className="label py-2 text-right font-normal">Your stake</th>
                <th className="label py-2 pl-3 text-right font-normal">Trend</th>
              </tr>
            </thead>
            <tbody>
              {state.corporations.map((item) => {
                const itemChange = corpChange(item)
                const active = item.id === selectedId
                return (
                  <tr key={item.id} onClick={() => setSelectedId(item.id)} className={classNames('cursor-pointer border-b border-ink-600/20 last:border-0', active ? 'bg-mint-400/6' : 'hover:bg-ink-800/30')}>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center border font-mono text-[8px] font-bold" style={{ borderColor: `hsla(${item.hue}, 70%, 60%, 0.3)`, color: `hsl(${item.hue}, 78%, 70%)`, background: `hsla(${item.hue}, 70%, 50%, 0.06)` }}>{item.ticker.slice(0, 2)}</span>
                        <div><div className="font-mono text-[10px] font-semibold text-fog-200">{item.ticker}</div><div className="micro">{item.name}</div></div>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-mono text-[10px] text-fog-200">${item.sharePrice.toFixed(2)}</td>
                    <td className={classNames('py-2.5 text-right font-mono text-[10px]', itemChange >= 0 ? 'text-mint-300' : 'text-rose-300')}>{pct(itemChange)}</td>
                    <td className="py-2.5 text-right font-mono text-[10px] text-fog-400">{money(item.sharePrice * item.sharesOutstanding, true)}</td>
                    <td className="py-2.5 text-right font-mono text-[10px] text-fog-300">{((item.playerShares / item.sharesOutstanding) * 100).toFixed(2)}%</td>
                    <td className="w-20 py-2.5 pl-3"><div className="h-5"><Sparkline data={item.history.slice(-22)} hue={item.hue} height={20} fill={false} strokeWidth={1.2} /></div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="col-span-12 space-y-3 xl:col-span-4">
        <Panel eyebrow={`${corp.sector.toUpperCase()} · ${corp.ownerName}`} title={`${corp.ticker} · ${corp.name}`} action={<Badge tone={change >= 0 ? 'good' : 'bad'}>{pct(change)}</Badge>}>
          <div className="flex items-end justify-between">
            <div className="stat-value text-[26px] font-semibold text-fog-100">${corp.sharePrice.toFixed(2)}</div>
            <div className="text-right"><div className="micro">Market cap</div><div className="mono text-[10px] text-fog-300">{money(corp.sharePrice * corp.sharesOutstanding, true)}</div></div>
          </div>
          <div className="mt-3 h-[130px]"><AreaChart data={corp.history.slice(-48)} hue={corp.hue} height={130} showAxis={false} /></div>
          <div className="mt-2 grid grid-cols-3 gap-2 border-t border-ink-600/30 pt-2">
            <div><div className="micro">Revenue</div><div className="mono mt-0.5 text-[10px] text-fog-200">{money(corp.revenue, true)}</div></div>
            <div><div className="micro">Growth</div><div className={classNames('mono mt-0.5 text-[10px]', corp.growth >= 0 ? 'text-mint-300' : 'text-rose-300')}>{corp.growth.toFixed(1)}%</div></div>
            <div><div className="micro">Your stake</div><div className="mono mt-0.5 text-[10px] text-fog-200">{ownership.toFixed(2)}%</div></div>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-fog-500">{corp.description}</p>
        </Panel>

        <Panel eyebrow="EQUITY TERMINAL" title="Trade shares" dense>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="label mb-1">Buy USD</div>
              <input className="input py-1.5 text-[10px]" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
              <button type="button" className="btn btn-primary mt-2 w-full py-1.5 text-[9px]" onClick={() => runAction((current) => buyShares(current, corp.id, numericAmount))}>Buy shares</button>
            </div>
            <div>
              <div className="label mb-1">Sell shares</div>
              <input className="input py-1.5 text-[10px]" value={shares} onChange={(event) => setShares(event.target.value)} inputMode="decimal" />
              <button type="button" className="btn btn-danger mt-2 w-full py-1.5 text-[9px]" onClick={() => runAction((current) => sellShares(current, corp.id, numericShares))}>Sell shares</button>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px]"><span className="text-fog-500">Position value</span><span className="mono text-fog-200">{money(value, true)}</span></div>
          <div className="mt-1 flex items-center justify-between text-[10px]"><span className="text-fog-500">Control threshold</span><span className="mono text-amber-300">50.00%</span></div>
          <button type="button" className="btn btn-danger mt-3 w-full py-2 text-[9px]" onClick={() => runAction((current) => corporateRaid(current, corp.id))}>
            <Flame size={11} /> Launch board raid
          </button>
        </Panel>
      </div>
    </div>
  )
}

function MintTab() {
  const { state, runAction } = useGame()
  const [name, setName] = useState('Sovereign Signal')
  const [symbol, setSymbol] = useState('SIG9')
  const [liquidity, setLiquidity] = useState('250000')
  const numericLiquidity = Math.max(0, Number(liquidity) || 0)
  const cost = numericLiquidity + 75_000
  const owned = state.tokens.filter((token) => token.creatorId === 'player')

  return (
    <div className="grid grid-cols-12 gap-4">
      <Panel className="col-span-12 xl:col-span-7" eyebrow="ISSUANCE DESK" title="Mint a new asset">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label mb-1.5 block">Token name</span>
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} maxLength={32} />
          </label>
          <label className="block">
            <span className="label mb-1.5 block">Symbol</span>
            <input className="input" value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} maxLength={8} />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="label mb-1.5 block">Initial liquidity (USD)</span>
          <input className="input" value={liquidity} onChange={(event) => setLiquidity(event.target.value)} inputMode="decimal" />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {['50000', '100000', '250000', '500000'].map((value) => (
            <button key={value} type="button" onClick={() => setLiquidity(value)} className="border border-ink-600/35 py-1.5 font-mono text-[9px] tracking-wider text-fog-500 hover:border-mint-400/40 hover:text-mint-300">${Number(value) / 1000}K</button>
          ))}
        </div>
        <div className="mt-4 border border-ink-600/35 bg-ink-900/45 p-3">
          <div className="flex items-center justify-between text-[10px]"><span className="text-fog-500">Protocol fee</span><span className="mono text-fog-200">$75,000</span></div>
          <div className="mt-1 flex items-center justify-between text-[10px]"><span className="text-fog-500">Total cost</span><span className="mono text-fog-100">{money(cost, true)}</span></div>
          <div className="mt-1 flex items-center justify-between text-[10px]"><span className="text-fog-500">Your allocation</span><span className="mono text-mint-300">20% of 10M supply</span></div>
          <div className="mt-1 flex items-center justify-between text-[10px]"><span className="text-fog-500">Liquid cash</span><span className="mono text-fog-200">{money(state.player.cash, true)}</span></div>
        </div>
        <button type="button" className="btn btn-primary mt-4 w-full py-2.5" onClick={() => runAction((current) => mintToken(current, name, symbol, numericLiquidity))}>
          <Plus size={13} /> Mint token
        </button>
        <div className="mt-3 flex items-start gap-2 border border-amber-400/20 bg-amber-400/5 p-2.5">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="text-[10px] leading-relaxed text-amber-200/70">Minting creates an AMM pool. The token can be rugged, but the ledger remembers. Heat and reputation consequences are permanent.</p>
        </div>
      </Panel>

      <Panel className="col-span-12 xl:col-span-5" eyebrow="YOUR ISSUANCE" title="Tokens you control">
        {owned.length === 0 ? (
          <div className="border border-dashed border-ink-600/40 p-5 text-center text-[10px] text-fog-500">You have not issued a token yet.</div>
        ) : (
          <div className="space-y-2">
            {owned.map((token) => (
              <div key={token.id} className="border border-ink-600/35 bg-ink-900/40 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[11px] text-fog-100">${token.symbol}</div>
                  <Badge tone={token.rugged ? 'bad' : 'good'}>{token.rugged ? 'RUGGED' : 'LIVE'}</Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div><div className="micro">Price</div><div className="mono text-[10px] text-fog-200">{tokenPrice(token.price)}</div></div>
                  <div><div className="micro">Liquidity</div><div className="mono text-[10px] text-fog-200">{money(token.liquidity, true)}</div></div>
                </div>
                {!token.rugged && (
                  <button type="button" className="btn btn-danger mt-2 w-full py-1.5 text-[9px]" onClick={() => runAction((current) => rugPull(current, token.id))}>
                    <ShieldAlert size={11} /> Drain liquidity
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

export function MarketsPage() {
  const { state } = useGame()
  const [tab, setTab] = useState<'tokens' | 'equities' | 'mint'>('tokens')
  const [selectedId, setSelectedId] = useState('neon')
  const selected = state.tokens.find((token) => token.id === selectedId) ?? state.tokens[0]
  const volume = state.tokens.reduce((sum, token) => sum + token.volume24h, 0)
  const staked = state.tokens.reduce((sum, token) => sum + token.staked * token.price, 0)
  const activeEvents = state.events.length
  const tokenChangeAvg = useMemo(() => state.tokens.reduce((sum, token) => sum + tokenChange(token), 0) / Math.max(1, state.tokens.length), [state.tokens])

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="DEX · EQUITIES · ISSUANCE"
        title="Markets & DEX"
        description="A fully collateralized AMM, a listed equity market, and a minting desk. Every trade moves the tape and leaves a trace."
        action={<Badge tone={tokenChangeAvg >= 0 ? 'good' : 'bad'} pulse>{tokenChangeAvg >= 0 ? 'RISK-ON' : 'RISK-OFF'} · {pct(tokenChangeAvg)}</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total market cap" value={money(marketCap(state), true)} sub={`${state.tokens.length} tokens · ${state.corporations.length} equities`} icon={<LineChart size={15} />} hue={174} spark={state.indexHistory.slice(-36)} />
        <StatCard label="24h volume" value={money(volume, true)} sub="Spot, AMM and derivatives" icon={<Droplets size={15} />} hue={196} spark={state.tokens[0]?.history.slice(-36)} />
        <StatCard label="Value staked" value={money(staked, true)} sub="Across all pools" icon={<Lock size={15} />} hue={286} spark={state.tokens[1]?.history.slice(-36)} />
        <StatCard label="Gas / congestion" value={`${state.gasPrice.toFixed(1)}`} sub={`${state.congestion.toFixed(0)}% mesh load · vol ${state.volatility.toFixed(0)}`} icon={<Gauge size={15} />} hue={42} spark={state.indexHistory.slice(-36).map((value) => value * 0.02)} />
      </div>

      <Tabs
        tabs={[
          { id: 'tokens', label: 'Tokens', count: state.tokens.length },
          { id: 'equities', label: 'Equities', count: state.corporations.length },
          { id: 'mint', label: 'Mint' },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      {tab === 'tokens' && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 space-y-4 xl:col-span-8">
            <TokenTable selectedId={selected.id} onSelect={setSelectedId} />
            <Panel eyebrow="LIQUIDITY & RISK" title="Market structure" dense>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="border border-ink-600/30 bg-ink-900/40 p-3">
                  <div className="flex items-center gap-2"><Layers size={13} className="text-mint-300" /><span className="label">Total liquidity</span></div>
                  <div className="stat-value mt-2 text-[18px] text-fog-100">{money(state.tokens.reduce((sum, token) => sum + token.liquidity, 0), true)}</div>
                  <Progress value={72} hue={174} className="mt-2" height={4} />
                  <div className="micro mt-1.5">72% utilization across pools</div>
                </div>
                <div className="border border-ink-600/30 bg-ink-900/40 p-3">
                  <div className="flex items-center gap-2"><Flame size={13} className="text-rose-300" /><span className="label">Rug exposure</span></div>
                  <div className="stat-value mt-2 text-[18px] text-rose-300">{state.tokens.filter((token) => token.rugged).length} / {state.tokens.length}</div>
                  <Progress value={(state.tokens.filter((token) => token.rugged).length / Math.max(1, state.tokens.length)) * 100} hue={350} className="mt-2" height={4} />
                  <div className="micro mt-1.5">Dead pools remain on the ledger</div>
                </div>
                <div className="border border-ink-600/30 bg-ink-900/40 p-3">
                  <div className="flex items-center gap-2"><Sparkles size={13} className="text-violet-300" /><span className="label">Active events</span></div>
                  <div className="stat-value mt-2 text-[18px] text-fog-100">{activeEvents}</div>
                  <div className="mt-2 space-y-1">
                    {state.events.slice(0, 2).map((event) => <div key={event.id} className="truncate font-mono text-[8px] uppercase tracking-wider text-fog-500">{event.title}</div>)}
                  </div>
                </div>
              </div>
            </Panel>
          </div>
          <div className="col-span-12 xl:col-span-4">
            <TokenTerminal token={selected} />
          </div>
        </div>
      )}

      {tab === 'equities' && <EquitiesTab />}
      {tab === 'mint' && <MintTab />}
    </div>
  )
}
