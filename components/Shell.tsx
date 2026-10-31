'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  Bell,
  CandlestickChart,
  ChevronRight,
  CircleDollarSign,
  Gauge,
  Landmark,
  LayoutDashboard,
  Menu,
  MessagesSquare,
  Network,
  Pause,
  Play,
  Radio,
  Scale,
  Settings2,
  Skull,
  Terminal,
  UserRound,
  X,
  Zap,
} from 'lucide-react'
import { useGame } from './GameProvider'
import { Avatar, Badge, Modal } from './ui'
import { classNames, clock, money, pct, tokenPrice } from '@/lib/format'
import { engineStatusLabel, heatLabel, netWorth, tokenChange } from '@/lib/economy'
import { setProfile } from '@/lib/actions'

const normalizePath = (path: string) => (path !== '/' ? path.replace(/\/+$/, '') : path)

const navGroups = [
  {
    label: 'Empire',
    items: [
      { href: '/', label: 'Command Center', icon: LayoutDashboard },
      { href: '/markets', label: 'Markets & DEX', icon: CandlestickChart },
      { href: '/banking', label: 'Banking', icon: Landmark },
      { href: '/infrastructure', label: 'Infrastructure', icon: Network },
    ],
  },
  {
    label: 'Influence',
    items: [
      { href: '/media', label: 'Media Empire', icon: Radio },
      { href: '/underworld', label: 'Underworld', icon: Skull },
      { href: '/government', label: 'Government', icon: Scale },
      { href: '/wire', label: 'The Wire', icon: MessagesSquare },
    ],
  },
]

const pageTitles: Record<string, { title: string; sub: string }> = {
  '/': { title: 'Command Center', sub: 'Live empire telemetry' },
  '/markets': { title: 'Markets & DEX', sub: 'Tokens, equities, liquidity' },
  '/banking': { title: 'Banking', sub: 'Credit, reserves, contagion' },
  '/infrastructure': { title: 'Infrastructure', sub: 'Fiber, latency, uptime' },
  '/media': { title: 'Media Empire', sub: 'Reach, narrative, credibility' },
  '/underworld': { title: 'Underworld', sub: 'Heat, laundering, leverage' },
  '/government': { title: 'Government', sub: 'Regulation, warrants, capture' },
  '/wire': { title: 'The Wire', sub: 'Server-wide social feed' },
  '/admin': { title: 'God Mode', sub: 'Root access to the simulation' },
}

function BrandMark() {
  return (
    <div className="relative flex h-9 w-9 items-center justify-center">
      <svg viewBox="0 0 40 40" className="h-9 w-9">
        <defs>
          <linearGradient id="brand-grad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#7df5d8" />
            <stop offset="55%" stopColor="#3fe3c0" />
            <stop offset="100%" stopColor="#4aa8ff" />
          </linearGradient>
        </defs>
        <path d="M20 3 35 11.5v17L20 37 5 28.5v-17L20 3Z" fill="none" stroke="url(#brand-grad)" strokeWidth="1.2" opacity="0.9" />
        <path d="M20 9.5 29.5 15v10L20 30.5 10.5 25V15L20 9.5Z" fill="rgba(63,227,192,0.07)" stroke="url(#brand-grad)" strokeWidth="0.8" />
        <path d="M15 24V16l10 8v-8" fill="none" stroke="url(#brand-grad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-mint-400 shadow-[0_0_8px_rgba(63,227,192,0.9)]" />
    </div>
  )
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const rawPathname = usePathname()
  const pathname = normalizePath(rawPathname)
  const { state } = useGame()
  const worth = netWorth(state)
  const heat = heatLabel(state.player.heat)

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-ink-600/35 bg-ink-950/72 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-5 pb-5 pt-5">
        <BrandMark />
        <div className="min-w-0">
          <div className="text-[15px] font-semibold tracking-[0.16em] text-fog-100">OMNILIFE</div>
          <div className="micro mt-0.5 text-mint-400/80">THE SYNDICATE</div>
        </div>
      </div>

      <div className="mx-5 mb-4 border border-ink-600/40 bg-ink-900/60 p-3">
        <div className="flex items-center justify-between">
          <span className="micro">Mesh status</span>
          <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-mint-300">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-mint-400" />
            ONLINE
          </span>
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <div className="micro">Net worth</div>
            <div className="stat-value mt-0.5 text-[18px] font-semibold text-fog-100">{money(worth, true)}</div>
          </div>
          <div className="text-right">
            <div className="micro">Heat</div>
            <div className={classNames('stat-value mt-0.5 text-[13px] font-semibold', heat.tone === 'bad' ? 'text-rose-300' : heat.tone === 'warn' ? 'text-amber-300' : 'text-mint-300')}>
              {Math.round(state.player.heat)} · {heat.label}
            </div>
          </div>
        </div>
        <div className="mt-2.5 h-1 w-full overflow-hidden bg-ink-800">
          <div className="h-full bg-gradient-to-r from-mint-500 via-amber-400 to-rose-400" style={{ width: `${Math.max(3, state.player.heat)}%` }} />
        </div>
      </div>

      <nav className="scrollbar-none flex-1 overflow-y-auto px-3 pb-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="label px-2 pb-1.5 text-[9px] text-fog-600">{group.label}</div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={classNames(
                      'group relative flex items-center gap-2.5 px-2.5 py-2 text-[12px] transition-all duration-150',
                      active ? 'bg-mint-400/8 text-fog-100' : 'text-fog-400 hover:bg-ink-800/60 hover:text-fog-200',
                    )}
                  >
                    {active && <span className="absolute inset-y-1 left-0 w-px bg-mint-400 shadow-[0_0_8px_rgba(63,227,192,0.9)]" />}
                    <Icon size={15} className={active ? 'text-mint-300' : 'text-fog-500 group-hover:text-fog-300'} strokeWidth={1.7} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && <ChevronRight size={12} className="text-mint-400/70" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {state.player.godMode && (
          <div className="mb-2">
            <div className="label px-2 pb-1.5 text-[9px] text-rose-400/70">Root</div>
            <Link
              href="/admin"
              onClick={onNavigate}
              className={classNames(
                'group relative flex items-center gap-2.5 px-2.5 py-2 text-[12px] transition-all',
                pathname === '/admin' ? 'bg-rose-400/10 text-rose-200' : 'text-rose-300/60 hover:bg-rose-400/8 hover:text-rose-200',
              )}
            >
              {pathname === '/admin' && <span className="absolute inset-y-1 left-0 w-px bg-rose-400 shadow-[0_0_8px_rgba(255,92,122,0.9)]" />}
              <Terminal size={15} strokeWidth={1.7} />
              <span className="flex-1">God Mode</span>
              <span className="rounded-sm border border-rose-400/30 px-1 py-0.5 font-mono text-[8px] tracking-widest text-rose-300">ROOT</span>
            </Link>
          </div>
        )}
      </nav>

      <div className="border-t border-ink-600/35 p-3">
        <div className="flex items-center gap-2.5 border border-ink-600/35 bg-ink-900/60 p-2.5">
          <Avatar name={state.player.name} hue={state.player.avatarHue} size={34} verified />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium text-fog-100">{state.player.name}</div>
            <div className="micro truncate">{state.player.handle} · LVL {state.player.level}</div>
          </div>
          <div className="text-right">
            <div className="micro">Cash</div>
            <div className="mono text-[10px] text-mint-300">{money(state.player.cash, true)}</div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
          <span className="micro">Engine</span>
          <span className={classNames('font-mono text-[9px] tracking-widest', state.engineStatus === 'grok' ? 'text-violet-300' : state.engineStatus === 'connecting' ? 'text-amber-300' : 'text-fog-400')}>
            {engineStatusLabel(state)}
          </span>
        </div>
      </div>
    </aside>
  )
}

function Ticker() {
  const { state } = useGame()
  const items = state.tokens.slice(0, 7).map((token) => ({
    ...token,
    change: tokenChange(token),
  }))
  const content = (
    <div className="flex shrink-0 items-center gap-6 pr-6">
      {items.map((token) => (
        <div key={token.symbol} className="flex items-center gap-2 whitespace-nowrap">
          <span className="font-mono text-[10px] font-semibold tracking-wider text-fog-300">${token.symbol}</span>
          <span className="mono text-[10px] text-fog-200">{tokenPrice(token.price)}</span>
          <span className={classNames('mono text-[9px]', token.change >= 0 ? 'text-mint-300' : 'text-rose-300')}>{pct(token.change)}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="font-mono text-[10px] tracking-wider text-fog-500">GAS</span>
        <span className="mono text-[10px] text-amber-300">{state.gasPrice.toFixed(1)} gwei</span>
      </div>
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="font-mono text-[10px] tracking-wider text-fog-500">IDX</span>
        <span className="mono text-[10px] text-fog-200">{state.marketIndex.toFixed(2)}</span>
      </div>
    </div>
  )
  return (
    <div className="ticker-mask relative overflow-hidden border-b border-ink-600/35 bg-ink-950/55">
      <div className="animate-marquee flex w-max">
        {content}
        {content}
      </div>
    </div>
  )
}

function Topbar({
  onMenu,
  onProfile,
  onNotifications,
}: {
  onMenu: () => void
  onProfile: () => void
  onNotifications: () => void
}) {
  const rawPathname = usePathname()
  const pathname = normalizePath(rawPathname)
  const { state, paused, setPaused, speed, setSpeed } = useGame()
  const meta = pageTitles[pathname] ?? pageTitles['/']
  const heat = heatLabel(state.player.heat)
  const engine = engineStatusLabel(state)

  return (
    <header className="sticky top-0 z-30 border-b border-ink-600/35 bg-ink-950/78 backdrop-blur-xl">
      <div className="flex h-[62px] items-center gap-3 px-4 sm:px-6">
        <button type="button" onClick={onMenu} className="btn btn-ghost h-9 w-9 p-0 lg:hidden" aria-label="Open navigation">
          <Menu size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="micro hidden sm:inline">{meta.sub}</span>
            <span className="hidden h-1 w-1 rounded-full bg-fog-600 sm:inline" />
            <span className="font-mono text-[10px] tracking-wider text-fog-400">{clock(state.day, state.hour)}</span>
          </div>
          <h1 className="truncate text-[15px] font-semibold tracking-tight text-fog-100">{meta.title}</h1>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <div className="chip chip-mint">
            <Activity size={11} />
            IDX {state.marketIndex.toFixed(0)}
          </div>
          <div className="chip chip-amber">
            <Zap size={11} />
            {state.gasPrice.toFixed(0)} GWEI
          </div>
          <div className={classNames('chip', heat.tone === 'bad' ? 'chip-rose' : heat.tone === 'warn' ? 'chip-amber' : 'chip-mint')}>
            <Gauge size={11} />
            HEAT {Math.round(state.player.heat)}
          </div>
          <div className={classNames('chip', state.engineStatus === 'grok' ? 'chip-violet' : state.engineStatus === 'connecting' ? 'chip-amber' : '')}>
            <span className={classNames('h-1.5 w-1.5 rounded-full', state.engineStatus === 'grok' ? 'bg-violet-400 animate-pulse-soft' : state.engineStatus === 'connecting' ? 'bg-amber-400 animate-pulse-soft' : 'bg-fog-500')} />
            {engine}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPaused(!paused)}
            className={classNames('btn h-8 w-8 p-0', paused && 'border-amber-400/50 text-amber-300')}
            aria-label={paused ? 'Resume simulation' : 'Pause simulation'}
            title={paused ? 'Resume simulation' : 'Pause simulation'}
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
          </button>
          <button
            type="button"
            onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)}
            className="btn h-8 px-2 font-mono text-[9px]"
            aria-label="Change simulation speed"
            title="Simulation speed"
          >
            {speed}×
          </button>
          <button type="button" onClick={onNotifications} className="btn relative h-8 w-8 p-0" aria-label="Notifications">
            <Bell size={14} />
            {state.notifications.length > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(255,92,122,0.9)]" />}
          </button>
          <button type="button" onClick={onProfile} className="group ml-0.5 flex items-center gap-2 border border-ink-600/40 bg-ink-900/60 p-1 pr-2 transition-colors hover:border-mint-400/40" aria-label="Open profile">
            <Avatar name={state.player.name} hue={state.player.avatarHue} size={28} verified />
            <div className="hidden text-left sm:block">
              <div className="max-w-[100px] truncate text-[10px] font-medium text-fog-200">{state.player.name}</div>
              <div className="micro">{money(netWorth(state), true)}</div>
            </div>
            <Settings2 size={12} className="hidden text-fog-500 group-hover:text-fog-300 sm:block" />
          </button>
        </div>
      </div>
      <Ticker />
    </header>
  )
}

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { state } = useGame()
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div className="absolute right-4 top-[58px] z-50 w-[min(92vw,380px)] animate-slide-in border border-ink-500/40 bg-ink-950/95 shadow-2xl backdrop-blur-xl sm:right-6">
        <div className="flex items-center justify-between border-b border-ink-600/40 px-4 py-3">
          <div>
            <div className="label">Signal inbox</div>
            <div className="mt-0.5 text-[12px] text-fog-200">{state.notifications.length} transmissions</div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost h-7 w-7 p-0" aria-label="Close notifications">
            <X size={13} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {state.notifications.slice(0, 8).map((notification) => (
            <div key={notification.id} className="border-b border-ink-600/25 px-4 py-3 last:border-0">
              <div className="flex items-start gap-2">
                <span
                  className={classNames(
                    'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                    notification.tone === 'good' ? 'bg-mint-400' : notification.tone === 'bad' ? 'bg-rose-400' : notification.tone === 'warn' ? 'bg-amber-400' : 'bg-azure-400',
                  )}
                />
                <div className="min-w-0">
                  <div className="font-mono text-[10px] tracking-wider text-fog-200">{notification.title}</div>
                  <div className="mt-0.5 text-[11px] leading-relaxed text-fog-500">{notification.message}</div>
                  <div className="micro mt-1">DAY {notification.day} · {String(notification.hour).padStart(2, '0')}:00</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function ProfileDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, runAction, resetWorld } = useGame()
  const [name, setName] = useState(state.player.name)
  const [email, setEmail] = useState(state.player.email)

  const save = () => {
    runAction((current) => setProfile(current, name, email))
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Operator profile" eyebrow="Identity & access">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Avatar name={state.player.name} hue={state.player.avatarHue} size={48} verified />
          <div>
            <div className="text-[14px] font-semibold text-fog-100">{state.player.name}</div>
            <div className="mono text-[10px] text-fog-500">{state.player.handle} · LVL {state.player.level} · {state.player.xp.toLocaleString()} XP</div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label mb-1.5 block">Display name</span>
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} maxLength={28} />
          </label>
          <label className="block">
            <span className="label mb-1.5 block">Email</span>
            <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </label>
        </div>

        <div className="border border-ink-600/40 bg-ink-900/50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="label">Root access</div>
              <div className="mt-1 text-[11px] text-fog-500">
                {state.player.godMode ? 'God mode is active for this profile.' : 'Reserved for the server owner profile.'}
              </div>
            </div>
            <Badge tone={state.player.godMode ? 'bad' : 'info'} pulse={state.player.godMode}>
              {state.player.godMode ? 'GOD MODE' : 'STANDARD'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="border border-ink-600/35 bg-ink-900/40 p-3">
            <div className="micro">Influence</div>
            <div className="stat-value mt-1 text-[18px] text-fog-100">{Math.round(state.player.influence)}</div>
          </div>
          <div className="border border-ink-600/35 bg-ink-900/40 p-3">
            <div className="micro">Reputation</div>
            <div className="stat-value mt-1 text-[18px] text-fog-100">{Math.round(state.player.reputation)}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" className="btn btn-danger" onClick={() => { resetWorld(); onClose() }}>
            Reset world
          </button>
          <div className="flex gap-2">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={save}>Save identity</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function Toasts() {
  const { toasts, dismissToast } = useGame()
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={classNames(
            'pointer-events-auto animate-slide-in border bg-ink-950/95 p-3 shadow-2xl backdrop-blur-xl',
            toast.tone === 'good' ? 'border-mint-400/40' : toast.tone === 'bad' ? 'border-rose-400/40' : toast.tone === 'warn' ? 'border-amber-400/40' : 'border-azure-400/35',
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div
                className={classNames(
                  'font-mono text-[10px] font-semibold tracking-wider',
                  toast.tone === 'good' ? 'text-mint-300' : toast.tone === 'bad' ? 'text-rose-300' : toast.tone === 'warn' ? 'text-amber-300' : 'text-azure-300',
                )}
              >
                {toast.title}
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-fog-300">{toast.message}</div>
            </div>
            <button type="button" onClick={() => dismissToast(toast.id)} className="text-fog-600 hover:text-fog-200" aria-label="Dismiss notification">
              <X size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const rawPathname = usePathname()
  const pathname = normalizePath(rawPathname)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const meta = useMemo(() => pageTitles[pathname] ?? pageTitles['/'], [pathname])

  return (
    <div className="relative z-10 flex min-h-screen">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="relative h-full w-[280px] animate-slide-in border-r border-ink-500/40 bg-ink-950/95 shadow-2xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button type="button" onClick={() => setMobileOpen(false)} className="btn btn-ghost absolute right-3 top-3 h-8 w-8 p-0" aria-label="Close navigation">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[248px]">
        <div className="relative">
          <Topbar onMenu={() => setMobileOpen(true)} onProfile={() => setProfileOpen(true)} onNotifications={() => setNotificationsOpen((value) => !value)} />
          {notificationsOpen && <NotificationsPanel onClose={() => setNotificationsOpen(false)} />}
        </div>

        <main className="mx-auto w-full max-w-[1520px] flex-1 px-4 pb-16 pt-5 sm:px-6 sm:pt-6">
          <div key={pathname} className="animate-rise">
            {children}
          </div>
          <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-ink-600/30 pt-4 text-[10px] text-fog-600">
            <span className="font-mono tracking-wider">OMNILIFE · THE SYNDICATE · SERVER 01</span>
            <span className="font-mono tracking-wider">{meta.title.toUpperCase()} · {meta.sub.toUpperCase()}</span>
          </footer>
        </main>
      </div>

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
      <Toasts />
    </div>
  )
}
