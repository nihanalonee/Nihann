import {
  Bell,
  Building2,
  CandlestickChart,
  ChevronDown,
  Command,
  Landmark,
  LayoutDashboard,
  Lock,
  Menu,
  MessageSquare,
  Network,
  Pause,
  Play,
  Save,
  Scale,
  Search,
  Skull,
  Terminal,
  Tv,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { PageId } from "../types";
import { useGame } from "../game/GameContext";
import { cn } from "../lib/cn";
import { fmtMoney, fmtNum, fmtPct, fmtTime } from "../lib/format";
import { Avatar, Badge, Button, Dot, Kbd, Label, Modal } from "./ui";

interface NavEntry {
  id: PageId;
  label: string;
  icon: ReactNode;
  group: string;
  hint?: string;
}

export const NAV: NavEntry[] = [
  { id: "overview", label: "Command Deck", icon: <LayoutDashboard size={15} />, group: "Empire" },
  { id: "market", label: "Markets & DEX", icon: <CandlestickChart size={15} />, group: "Empire", hint: "OMX" },
  { id: "banking", label: "Banking", icon: <Landmark size={15} />, group: "Empire", hint: "HELIOS" },
  { id: "infrastructure", label: "Infrastructure", icon: <Network size={15} />, group: "Empire", hint: "ISP" },
  { id: "media", label: "Media Empire", icon: <Tv size={15} />, group: "Influence" },
  { id: "underworld", label: "Underworld", icon: <Skull size={15} />, group: "Influence", hint: "HEAT" },
  { id: "corporate", label: "Corporations", icon: <Building2 size={15} />, group: "Influence" },
  { id: "government", label: "Government", icon: <Scale size={15} />, group: "Influence" },
  { id: "wire", label: "The Wire", icon: <MessageSquare size={15} />, group: "Network" },
  { id: "godmode", label: "God Mode", icon: <Terminal size={15} />, group: "Network" },
];

function NavLink({
  entry,
  active,
  onClick,
  badge,
  locked,
}: {
  entry: NavEntry;
  active: boolean;
  onClick: () => void;
  badge?: string;
  locked?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn("nav-item group", active && "nav-item-active")}
      title={entry.label}
    >
      <span className={cn("transition-colors", active ? "text-mint" : "text-white/35 group-hover:text-white/65")}>
        {entry.icon}
      </span>
      <span className="flex-1 text-left">{entry.label}</span>
      {locked && <Lock size={10} className="text-white/20" />}
      {badge && !locked && (
        <span className="num rounded bg-white/[0.07] px-1.5 py-0.5 text-[8.5px] text-white/45">
          {badge}
        </span>
      )}
    </button>
  );
}

export function AppShell({
  page,
  setPage,
  children,
}: {
  page: PageId;
  setPage: (page: PageId) => void;
  children: ReactNode;
}) {
  const { state, dispatch } = useGame();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [query, setQuery] = useState("");
  const [profileDraft, setProfileDraft] = useState({
    name: state.player.name,
    handle: state.player.handle,
    email: state.player.email,
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    setProfileDraft({
      name: state.player.name,
      handle: state.player.handle,
      email: state.player.email,
    });
  }, [profileOpen, state.player.name, state.player.handle, state.player.email]);

  const saveProfile = () => {
    dispatch({
      type: "SET_PROFILE",
      name: profileDraft.name.trim(),
      handle: profileDraft.handle.trim(),
      email: profileDraft.email.trim(),
    });
    setProfileOpen(false);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navigate = (next: PageId) => {
    setPage(next);
    setMobileOpen(false);
    setCommandOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const indexDelta = useMemo(() => {
    const history = state.world.indexHistory;
    const prev = history[Math.max(0, history.length - 2)] ?? state.world.index;
    return ((state.world.index - prev) / prev) * 100;
  }, [state.world.index, state.world.indexHistory]);

  const activeNav = NAV.find((entry) => entry.id === page);
  const grouped = ["Empire", "Influence", "Network"];

  const commandItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV;
    return NAV.filter(
      (entry) =>
        entry.label.toLowerCase().includes(q) ||
        entry.id.includes(q) ||
        entry.group.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-mesh" />
      <div className="pointer-events-none fixed inset-0 z-0 grid-bg opacity-40" />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-white/[0.06] bg-[#070a10]/95 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-[66px] items-center justify-between border-b border-white/[0.06] px-4">
          <button className="flex items-center gap-2.5 text-left" onClick={() => navigate("overview")}>
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-mint/25 bg-mint/[0.07]">
              <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
                <path d="M5 21 16 5l11 16-11 6Z" stroke="#7CF7C4" strokeWidth="1.6" />
                <path d="m10 20 6-9 6 9" stroke="#7CF7C4" strokeOpacity=".5" strokeWidth="1.2" />
                <circle cx="16" cy="21" r="1.3" fill="#F5C451" />
              </svg>
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_8px_#7CF7C4]" />
            </div>
            <div>
              <div className="text-[13px] font-semibold tracking-[0.16em] text-white">OMNILIFE</div>
              <div className="font-mono text-[7.5px] uppercase tracking-[0.32em] text-mint/55">
                The Syndicate
              </div>
            </div>
          </button>
          <button
            className="rounded-lg border border-white/10 p-1.5 text-white/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-4">
          {grouped.map((group) => (
            <div key={group} className="mb-5">
              <div className="mb-1.5 px-3">
                <Label>{group}</Label>
              </div>
              <div className="space-y-0.5">
                {NAV.filter((entry) => entry.group === group).map((entry) => {
                  const locked = entry.id === "godmode" && !state.player.isAdmin;
                  const badge =
                    entry.id === "underworld" && state.underworld.heat > 50
                      ? `${Math.round(state.underworld.heat)}°`
                      : entry.id === "government" && state.government.warrants > 0
                        ? `${state.government.warrants}`
                        : entry.id === "media" && state.media.campaigns.filter((c) => c.status === "live").length > 0
                          ? `${state.media.campaigns.filter((c) => c.status === "live").length}`
                          : undefined;
                  return (
                    <NavLink
                      key={entry.id}
                      entry={entry}
                      active={page === entry.id}
                      onClick={() => navigate(entry.id)}
                      badge={badge}
                      locked={locked}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-white/[0.06] p-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dot color={state.world.engineMode === "grok" ? "#7CF7C4" : "#F5C451"} pulse />
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/45">
                  World Engine
                </span>
              </div>
              <span className="font-mono text-[8px] text-mint/70">
                {state.world.engineMode === "grok" ? "GROK" : "AUTO"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/25">
                Vault
              </span>
              <span className="font-mono text-[8px] text-white/40">LOCAL SAVE</span>
            </div>
            <div className="mt-2 h-px bg-white/[0.05]" />
            <button
              onClick={() => dispatch({ type: "TOGGLE_PAUSE" })}
              className="mt-2 flex w-full items-center justify-between text-[10px] text-white/40 transition hover:text-white/75"
            >
              <span className="flex items-center gap-1.5">
                {state.world.paused ? <Play size={10} /> : <Pause size={10} />}
                {state.world.paused ? "Resume simulation" : "Pause simulation"}
              </span>
              <span className="num text-[8px] text-white/20">T{state.world.tick}</span>
            </button>
          </div>

          <button
            onClick={() => setProfileOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-left transition hover:border-white/15 hover:bg-white/[0.04]"
          >
            <Avatar initials={state.player.avatar} size={32} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[11.5px] text-white/85">{state.player.name}</span>
                {state.player.isAdmin && <Lock size={9} className="text-gold" />}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="font-mono text-[8px] uppercase tracking-wider text-mint/60">
                  LVL {state.player.level}
                </span>
                <span className="text-[8px] text-white/20">·</span>
                <span className="num text-[8px] text-white/30">
                  {fmtMoney(state.stats.netWorthHistory.at(-1) ?? state.player.cash)}
                </span>
              </div>
            </div>
            <ChevronDown size={12} className="text-white/25" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="relative z-10 lg:pl-[252px]">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#06080d]/82 backdrop-blur-2xl">
          <div className="flex h-[58px] items-center gap-3 px-3 md:px-6">
            <button
              className="rounded-lg border border-white/10 p-2 text-white/55 lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={15} />
            </button>

            <div className="hidden min-w-[150px] items-center gap-2 md:flex">
              <span className="label">NOW VIEWING</span>
              <span className="text-[12px] text-white/75">{activeNav?.label}</span>
            </div>

            <div className="hidden h-5 w-px bg-white/[0.07] md:block" />

            <div className="flex flex-1 items-center gap-4 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="label hidden sm:block">OLX</span>
                <span className="num text-[12.5px] text-white">
                  {fmtNum(state.world.index, 2)}
                </span>
                <span className={cn("num text-[9.5px]", indexDelta >= 0 ? "text-mint" : "text-danger")}>
                  {fmtPct(indexDelta)}
                </span>
              </div>
              <div className="hidden h-5 w-px bg-white/[0.07] sm:block" />
              <div className="hidden items-center gap-3 overflow-hidden md:flex">
                {state.assets.slice(0, 4).map((asset) => {
                  const change = ((asset.price - asset.prevClose) / asset.prevClose) * 100;
                  return (
                    <div key={asset.id} className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] text-white/35">{asset.ticker}</span>
                      <span className="num text-[9.5px] text-white/65">
                        {asset.price < 1 ? asset.price.toFixed(4) : asset.price.toFixed(2)}
                      </span>
                      <span className={cn("num text-[8.5px]", change >= 0 ? "text-mint/80" : "text-danger/80")}>
                        {change >= 0 ? "+" : ""}
                        {change.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCommandOpen(true)}
                className="hidden items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 text-white/35 transition hover:border-white/20 hover:text-white/70 sm:flex"
              >
                <Search size={12} />
                <span className="font-mono text-[9px]">Search</span>
                <Kbd>⌘K</Kbd>
              </button>

              <div className="relative">
                <button
                  onClick={() => setNotifyOpen((open) => !open)}
                  className="relative rounded-lg border border-white/[0.08] p-2 text-white/40 transition hover:border-white/20 hover:text-white"
                >
                  <Bell size={14} />
                  <span className="absolute right-1.5 top-1.5 h-1 w-1 rounded-full bg-gold shadow-[0_0_6px_#F5C451]" />
                </button>
                {notifyOpen && (
                  <div className="panel absolute right-0 top-11 w-[310px] overflow-hidden p-0 shadow-card">
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                      <span className="text-[12px] text-white/80">Wire alerts</span>
                      <Badge variant="gold">LIVE</Badge>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {state.world.news.slice(0, 6).map((item) => (
                        <div key={item.id} className="border-b border-white/[0.04] px-4 py-2.5 last:border-0">
                          <div className="flex gap-2">
                            <span
                              className={cn(
                                "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                                item.tone === "positive"
                                  ? "bg-mint"
                                  : item.tone === "negative"
                                    ? "bg-danger"
                                    : "bg-gold",
                              )}
                            />
                            <div>
                              <div className="text-[10.5px] leading-relaxed text-white/65">{item.text}</div>
                              <div className="mt-1 font-mono text-[8px] text-white/20">{item.time} ago</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden items-center gap-1.5 rounded-lg border border-white/[0.08] px-2 py-1.5 sm:flex">
                <Dot color="#7CF7C4" pulse />
                <span className="font-mono text-[8.5px] uppercase tracking-wider text-white/45">
                  {state.world.paused ? "PAUSED" : state.world.phase}
                </span>
              </div>

              <div className="num hidden text-[10px] text-white/35 sm:block">
                DAY {state.world.day} · {fmtTime(now)}
              </div>

              <button
                onClick={() => setProfileOpen(true)}
                className="ml-0.5 rounded-lg ring-1 ring-white/10 transition hover:ring-mint/40"
              >
                <Avatar initials={state.player.avatar} size={30} />
              </button>
            </div>
          </div>

          <div className="relative flex h-6 items-center overflow-hidden border-t border-white/[0.04] bg-black/25">
            <div className="ticker-track">
              {[0, 1].map((copy) => (
                <div key={copy} className="flex items-center">
                  {state.assets.map((asset) => {
                    const change = ((asset.price - asset.prevClose) / asset.prevClose) * 100;
                    return (
                      <span key={`${copy}-${asset.id}`} className="flex items-center gap-2 px-4">
                        <span className="font-mono text-[8.5px] tracking-wider text-white/40">{asset.ticker}</span>
                        <span className="num text-[9px] text-white/60">
                          {asset.price < 1 ? asset.price.toFixed(4) : asset.price.toFixed(2)}
                        </span>
                        <span className={cn("num text-[8.5px]", change >= 0 ? "text-mint" : "text-danger")}>
                          {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
                        </span>
                        <span className="text-white/10">/</span>
                      </span>
                    );
                  })}
                  <span className="flex items-center gap-2 px-4">
                    <span className="font-mono text-[8.5px] tracking-wider text-gold/60">WORLD</span>
                    <span className="num text-[9px] text-gold/80">{state.world.events[0]?.title ?? "Stable"}</span>
                    <span className="text-white/10">/</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1560px] px-3 py-5 md:px-6 md:py-7">{children}</main>

        <footer className="mx-auto flex w-full max-w-[1560px] flex-col items-center justify-between gap-2 px-4 py-6 text-[9px] text-white/20 md:flex-row md:px-6">
          <span>OMNILIFE // THE SYNDICATE — persistent simulation build 1.0.7</span>
          <span className="font-mono">
            TICK {state.world.tick} · {state.world.engineMode === "grok" ? "GROK LINK ACTIVE" : "LOCAL DUNGEON MASTER"} · AUTOSAVE ON
          </span>
        </footer>
      </div>

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {state.toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto animate-fade-up rounded-xl border bg-[#0a0f18]/95 p-3 shadow-card backdrop-blur-xl",
              toast.tone === "success"
                ? "border-mint/25"
                : toast.tone === "error"
                  ? "border-danger/30"
                  : toast.tone === "warning"
                    ? "border-gold/30"
                    : "border-white/15",
            )}
          >
            <div className="flex items-start gap-2.5">
              <Zap
                size={13}
                className={cn(
                  "mt-0.5 shrink-0",
                  toast.tone === "success"
                    ? "text-mint"
                    : toast.tone === "error"
                      ? "text-danger"
                      : toast.tone === "warning"
                        ? "text-gold"
                        : "text-blue",
                )}
              />
              <p className="text-[11px] leading-relaxed text-white/75">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Command palette */}
      <Modal
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        title="Command palette"
        subtitle="Jump anywhere in the syndicate."
        width="max-w-xl"
      >
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3">
          <Search size={14} className="text-white/30" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search modules, assets, rivals…"
            className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-white/25"
          />
          <Kbd>ESC</Kbd>
        </div>
        <div className="mt-3 max-h-[340px] space-y-1 overflow-y-auto">
          {commandItems.map((entry) => (
            <button
              key={entry.id}
              onClick={() => navigate(entry.id)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white/[0.05]"
            >
              <span className="text-white/35">{entry.icon}</span>
              <span className="flex-1 text-[12px] text-white/70">{entry.label}</span>
              <span className="label">{entry.group}</span>
              <Command size={11} className="text-white/20" />
            </button>
          ))}
          {commandItems.length === 0 && (
            <div className="px-3 py-8 text-center text-[11px] text-white/30">No matching modules.</div>
          )}
        </div>
      </Modal>

      {/* Profile modal */}
      <Modal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="Operator profile"
        subtitle="Identity is stored locally in the simulation vault."
      >
        <div className="flex items-center gap-3">
          <Avatar initials={state.player.avatar} size={50} />
          <div className="flex-1">
            <div className="text-[15px] text-white">{state.player.name}</div>
            <div className="mt-0.5 font-mono text-[10px] text-white/35">@{state.player.handle}</div>
          </div>
          <Badge variant={state.player.isAdmin ? "gold" : "mint"}>
            {state.player.isAdmin ? "ROOT" : `LVL ${state.player.level}`}
          </Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            ["Net worth", fmtMoney(state.stats.netWorthHistory.at(-1) ?? 0)],
            ["Liquid cash", fmtMoney(state.player.cash)],
            ["Influence", fmtNum(state.player.influence)],
            ["Reputation", `${Math.round(state.player.reputation)}/100`],
            ["Credit score", `${state.player.credit}`],
            ["Prestige", `${state.player.prestige}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
              <div className="label">{label}</div>
              <div className="num mt-1 text-[13px] text-white/80">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="label">Operator identity</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[9px] text-white/30">Display name</span>
              <input
                className="field"
                value={profileDraft.name}
                onChange={(event) => setProfileDraft((draft) => ({ ...draft, name: event.target.value }))}
                maxLength={40}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[9px] text-white/30">Handle</span>
              <input
                className="field"
                value={profileDraft.handle}
                onChange={(event) =>
                  setProfileDraft((draft) => ({
                    ...draft,
                    handle: event.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 24),
                  }))
                }
                maxLength={24}
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[9px] text-white/30">Email identity</span>
            <input
              className="field"
              type="email"
              value={profileDraft.email}
              onChange={(event) => setProfileDraft((draft) => ({ ...draft, email: event.target.value }))}
              placeholder="operator@domain"
              maxLength={80}
            />
          </label>
          <p className="text-[9px] leading-relaxed text-white/25">
            Certain email identities are granted root access to the world engine. This is a game
            mechanic, not an authentication system. Your identity is stored in the local vault.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setProfileOpen(false)}>
            Close
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setProfileOpen(false); navigate("godmode"); }}>
            <Terminal size={12} /> Admin terminal
          </Button>
          <Button variant="primary" size="sm" onClick={saveProfile}>
            <Save size={12} /> Save identity
          </Button>
        </div>
      </Modal>
    </div>
  );
}
