"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Banknote,
  Building2,
  ChevronRight,
  CircleDollarSign,
  Command,
  Fingerprint,
  Gauge,
  Landmark,
  LayoutDashboard,
  LineChart,
  Menu,
  MessageSquare,
  Network,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Scale,
  Shield,
  Skull,
  TerminalSquare,
  Tv,
  X,
  Zap,
} from "lucide-react";
import { useGame } from "./GameProvider";
import { ToastHost } from "./ToastHost";
import { Progress } from "./ui";
import { credits, compact, heatLabel, initials, pct } from "@/lib/format";
import { computeNetWorth } from "@/lib/seed";
import type { ViewId } from "@/lib/types";

import { OverviewView } from "./views/Overview";
import { CityView } from "./views/City";
import { MarketsView } from "./views/Markets";
import { BankingView } from "./views/Banking";
import { MediaView } from "./views/Media";
import { TelecomView } from "./views/Telecom";
import { UnderworldView } from "./views/Underworld";
import { GovernmentView } from "./views/Government";
import { WireView } from "./views/Wire";
import { AdminView } from "./views/Admin";

const NAV: {
  group: string;
  items: { id: ViewId; label: string; icon: typeof LayoutDashboard }[];
}[] = [
  {
    group: "City",
    items: [
      { id: "overview", label: "Command", icon: LayoutDashboard },
      { id: "city", label: "Districts", icon: Building2 },
    ],
  },
  {
    group: "Economy",
    items: [
      { id: "markets", label: "Markets", icon: LineChart },
      { id: "banking", label: "Banking", icon: Landmark },
      { id: "media", label: "Media", icon: Radio },
      { id: "telecom", label: "Telecom", icon: Network },
    ],
  },
  {
    group: "Power",
    items: [
      { id: "underworld", label: "Underworld", icon: Skull },
      { id: "government", label: "Government", icon: Scale },
      { id: "wire", label: "The Wire", icon: MessageSquare },
    ],
  },
];

const VIEW_TITLES: Record<ViewId, string> = {
  overview: "Command Center",
  city: "District Authority",
  markets: "Markets & DEX",
  banking: "Banking & Credit",
  media: "Media Empire",
  telecom: "Internet Infrastructure",
  underworld: "The Underworld",
  government: "Government & Regulation",
  wire: "The Wire",
  admin: "God Mode",
};

const MOBILE_NAV: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Command", icon: LayoutDashboard },
  { id: "city", label: "City", icon: Building2 },
  { id: "markets", label: "Markets", icon: LineChart },
  { id: "wire", label: "Wire", icon: MessageSquare },
];

export function AppShell() {
  const { state, setSpeed, resetGame, aiMode, summonEvent, aiBusy } = useGame();
  const [view, setView] = useState<ViewId>("overview");
  const [drawer, setDrawer] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setDrawer(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  const netWorth = state ? computeNetWorth(state) : 0;
  const history = state?.player.netWorthHistory.map((p) => p.value) ?? [];
  const change = useMemo(() => {
    if (history.length < 2) return 0;
    const prev = history[Math.max(0, history.length - 8)];
    return prev ? ((netWorth - prev) / prev) * 100 : 0;
  }, [history, netWorth]);

  if (!state) return null;

  const paused = state.speed === 0;
  const navItems = state.adminUnlocked
    ? [...NAV, { group: "System", items: [{ id: "admin" as ViewId, label: "God Mode", icon: TerminalSquare }] }]
    : NAV;

  const renderView = () => {
    switch (view) {
      case "city":
        return <CityView />;
      case "markets":
        return <MarketsView />;
      case "banking":
        return <BankingView />;
      case "media":
        return <MediaView />;
      case "telecom":
        return <TelecomView />;
      case "underworld":
        return <UnderworldView />;
      case "government":
        return <GovernmentView />;
      case "wire":
        return <WireView />;
      case "admin":
        return state.adminUnlocked ? <AdminView /> : <OverviewView onNavigate={setView} />;
      default:
        return <OverviewView onNavigate={setView} />;
    }
  };

  const sideNav = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 pb-5 pt-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-acid/35 bg-acid/10">
          <Fingerprint className="h-4 w-4 text-acid" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold tracking-[-0.02em]">
            OMNILIFE<span className="text-acid">.</span>
          </p>
          <p className="mono text-[8px] uppercase tracking-[0.24em] text-dim">The Syndicate</p>
        </div>
        <button className="ml-auto rounded p-1 text-dim hover:text-ink lg:hidden" onClick={() => setDrawer(false)}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3">
        <div className="flex items-center justify-between rounded-lg border border-line/70 bg-abyss/70 px-2.5 py-2">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${paused ? "bg-ember" : "bg-acid pulse-dot"}`} />
            <span className="mono text-[9px] uppercase tracking-[0.14em] text-muted">
              Day {state.day}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setSpeed(paused ? 1 : 0)}
              className="rounded p-1 text-muted hover:bg-white/5 hover:text-ink"
              aria-label={paused ? "Resume simulation" : "Pause simulation"}
            >
              {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </button>
            {([1, 2, 4] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => setSpeed(speed)}
                className={`mono rounded px-1 py-0.5 text-[9px] transition-colors ${
                  state.speed === speed ? "bg-acid/15 text-acid" : "text-dim hover:text-ink"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <nav className="no-scrollbar mt-4 flex-1 overflow-y-auto px-2.5 pb-4">
        {navItems.map((group) => (
          <div key={group.group} className="mb-4">
            <p className="mono mb-1.5 px-2 text-[8px] uppercase tracking-[0.24em] text-dim/80">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    data-active={active}
                    className="nav-item w-full"
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
                    <span>{item.label}</span>
                    {active && <ChevronRight className="ml-auto h-3 w-3 text-acid/60" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mx-1 rounded-lg border border-line/60 bg-gradient-to-b from-panel-2/80 to-abyss/80 p-2.5">
          <div className="flex items-center justify-between">
            <span className="mono text-[8px] uppercase tracking-[0.18em] text-muted">AI World Engine</span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                aiMode === "grok" ? "bg-mint pulse-dot" : aiMode === "local" ? "bg-ember" : "bg-dim"
              }`}
            />
          </div>
          <p className="mt-1 text-[10.5px] text-ink/80">
            {aiMode === "grok" ? "Grok masterminds online" : aiMode === "local" ? "Local simulation" : "Connecting…"}
          </p>
          <button
            onClick={summonEvent}
            disabled={aiBusy}
            className="btn btn-ghost mt-2 w-full justify-start px-0 py-1 text-[10px] text-acid hover:bg-transparent"
          >
            <Zap className="h-3 w-3" />
            {aiBusy ? "Consulting…" : "Summon world event"}
          </button>
        </div>
      </nav>

      <div className="border-t border-line/60 p-3">
        <div className="rounded-xl border border-line/60 bg-abyss/80 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-acid/30 bg-acid/10 text-[10px] font-bold text-acid">
              {initials(state.player.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-semibold">{state.player.name}</p>
              <p className="mono truncate text-[9px] text-dim">@{state.player.handle}</p>
            </div>
            <button
              onClick={() => setConfirmReset(true)}
              title="Reset timeline"
              className="rounded p-1 text-dim transition-colors hover:bg-white/5 hover:text-danger"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="mono text-[8px] uppercase tracking-[0.14em] text-muted">Heat · {heatLabel(state.player.heat)}</span>
            <span className="mono text-[9px] text-ink/70">{Math.round(state.player.heat)}/100</span>
          </div>
          <Progress
            value={state.player.heat}
            color={state.player.heat > 70 ? "#ff625c" : state.player.heat > 40 ? "#ffb454" : "#63f7c3"}
            className="mt-1.5"
          />
        </div>
        {confirmReset && (
          <div className="mt-2 rounded-lg border border-danger/30 bg-danger/10 p-2.5">
            <p className="text-[10px] leading-relaxed text-danger/90">Erase this timeline and start a new identity?</p>
            <div className="mt-2 flex gap-1.5">
              <button className="btn btn-danger flex-1 py-1 text-[10px]" onClick={resetGame}>
                Erase
              </button>
              <button className="btn flex-1 py-1 text-[10px]" onClick={() => setConfirmReset(false)}>
                Keep
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-void">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none fixed inset-0 radial-fade opacity-60" />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] border-r border-line/70 bg-abyss/85 backdrop-blur-2xl lg:block">
        {sideNav}
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDrawer(false)} aria-label="Close menu" />
          <aside className="absolute inset-y-0 left-0 w-[270px] border-r border-line bg-abyss shadow-2xl">{sideNav}</aside>
        </div>
      )}

      <div className="relative lg:pl-[232px]">
        <TopBar
          view={view}
          netWorth={netWorth}
          change={change}
          onMenu={() => setDrawer(true)}
          onNavigate={setView}
        />

        <main className="mx-auto w-full max-w-[1600px] px-3 pb-24 pt-4 sm:px-5 sm:pt-5 lg:px-6 lg:pb-8">
          <div key={view} className="rise">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line/80 bg-abyss/95 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex flex-col items-center gap-1 py-2.5 text-[9px] ${
                  view === item.id ? "text-acid" : "text-muted"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.7} />
                {item.label}
              </button>
            );
          })}
          <button onClick={() => setDrawer(true)} className="flex flex-col items-center gap-1 py-2.5 text-[9px] text-muted">
            <Menu className="h-4 w-4" strokeWidth={1.7} />
            More
          </button>
        </div>
      </nav>

      <ToastHost />
    </div>
  );
}

function TopBar({
  view,
  netWorth,
  change,
  onMenu,
  onNavigate,
}: {
  view: ViewId;
  netWorth: number;
  change: number;
  onMenu: () => void;
  onNavigate: (view: ViewId) => void;
}) {
  const { state, setSpeed } = useGame();
  if (!state) return null;
  const paused = state.speed === 0;

  const ticker = [
    ...state.tokens.filter((t) => !t.rugged).map((t) => ({
      label: t.symbol,
      value: t.price,
      change: t.change24h,
      color: t.color,
    })),
    ...state.corporations.map((c) => ({
      label: c.ticker,
      value: c.sharePrice,
      change: ((c.history.at(-1)! - c.history.at(-2)!) / c.history.at(-2)!) * 100,
      color: c.color,
    })),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-void/85 backdrop-blur-2xl">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
        <button onClick={onMenu} className="rounded-md p-1.5 text-muted hover:bg-white/5 hover:text-ink lg:hidden" aria-label="Open menu">
          <Menu className="h-4.5 w-4.5" />
        </button>

        <div className="hidden min-w-0 items-center gap-2 md:flex">
          <span className="mono text-[9px] uppercase tracking-[0.22em] text-dim">OmniLife</span>
          <ChevronRight className="h-3 w-3 text-dim" />
          <span className="mono text-[10px] uppercase tracking-[0.14em] text-ink">{VIEW_TITLES[view]}</span>
          <span className="chip ml-2 border-mint/20 text-mint">
            <span className="h-1 w-1 rounded-full bg-mint" />
            live
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 xl:hidden">
            <div className="text-right">
              <p className="mono hidden text-[8px] uppercase tracking-[0.16em] text-dim sm:block">Net worth</p>
              <p className="mono text-[11.5px] font-semibold text-acid">{credits(netWorth, true)}</p>
            </div>
          </div>
          <div className="hidden items-center gap-4 xl:flex">
            <div className="text-right">
              <p className="mono text-[8px] uppercase tracking-[0.16em] text-dim">Liquid cash</p>
              <p className="mono text-[12px] font-semibold text-ink">{credits(state.player.cash, true)}</p>
            </div>
            <div className="h-6 w-px bg-line" />
            <div className="text-right">
              <p className="mono text-[8px] uppercase tracking-[0.16em] text-dim">Net worth</p>
              <p className="mono text-[12px] font-semibold text-acid">{credits(netWorth, true)}</p>
            </div>
            <div className={`mono text-[9.5px] ${change >= 0 ? "text-mint" : "text-danger"}`}>
              {pct(change, 2)}
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-line/70 bg-abyss/70 p-0.5">
            <button
              onClick={() => setSpeed(paused ? 1 : 0)}
              className="rounded p-1.5 text-muted hover:bg-white/5 hover:text-ink"
              aria-label={paused ? "Resume" : "Pause"}
            >
              {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </button>
            {([1, 2, 4] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => setSpeed(speed)}
                className={`mono rounded px-1.5 py-1 text-[9px] ${
                  state.speed === speed ? "bg-acid/15 text-acid" : "text-dim hover:text-ink"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigate("wire")}
            className="relative flex h-8 w-8 items-center justify-center rounded-full border border-line-bright bg-panel text-muted hover:text-ink"
            aria-label="Open the Wire"
          >
            <Activity className="h-3.5 w-3.5" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-void bg-acid" />
          </button>

          <button
            onClick={() => onNavigate("overview")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-acid/30 bg-acid/10 text-[10px] font-bold text-acid"
            aria-label="Player profile"
          >
            {initials(state.player.name)}
          </button>
        </div>
      </div>

      <div className="ticker-mask relative flex h-7 items-center overflow-hidden border-t border-line/40 bg-abyss/60">
        <div className="ticker flex w-max items-center">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center">
              {ticker.map((item, index) => (
                <button
                  key={`${copy}-${item.label}-${index}`}
                  onClick={() => onNavigate("markets")}
                  className="mono flex items-center gap-2 whitespace-nowrap border-r border-line/40 px-3 text-[9.5px] hover:bg-white/[0.03]"
                >
                  <span style={{ color: item.color }}>{item.label}</span>
                  <span className="text-ink/80">{item.value < 1 ? item.value.toFixed(4) : item.value.toFixed(2)}</span>
                  <span className={item.change >= 0 ? "text-mint" : "text-danger"}>
                    {item.change >= 0 ? "▲" : "▼"}
                    {Math.abs(item.change).toFixed(1)}%
                  </span>
                </button>
              ))}
              <span className="mono flex items-center gap-1.5 px-3 text-[9px] text-dim">
                <Gauge className="h-2.5 w-2.5" /> ECON {Math.round(state.economy)}
                <span className="ml-2 h-2.5 w-px bg-line" />
                <Shield className="ml-1 h-2.5 w-2.5" /> REG {Math.round(state.government.regulation)}
                <span className="ml-2 h-2.5 w-px bg-line" />
                <CircleDollarSign className="ml-1 h-2.5 w-2.5" /> TAX {state.government.taxRate.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
