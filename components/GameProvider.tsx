'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ActionResult, GameState, Toast } from '@/lib/types'
import { createInitialState, SAVE_VERSION } from '@/lib/seed'
import { advance, applyWorldEvent } from '@/lib/simulation'
import { checkEngine, requestWorldEvent } from '@/lib/grok'
import { subscribeToWire } from '@/lib/supabase'

const SAVE_KEY = 'omnilife.syndicate.save.v7'
const TICK_MS = 3000

interface GameContextValue {
  state: GameState
  toasts: Toast[]
  hydrated: boolean
  paused: boolean
  speed: number
  engineOnline: boolean
  setPaused: (value: boolean) => void
  setSpeed: (value: number) => void
  dismissToast: (id: string) => void
  runAction: (action: (state: GameState) => ActionResult) => void
  pushToast: (toast: Omit<Toast, 'id'>) => void
  resetWorld: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => createInitialState())
  const [toasts, setToasts] = useState<Toast[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [paused, setPaused] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [engineOnline, setEngineOnline] = useState(false)
  const stateRef = useRef(state)
  const syncRef = useRef(0)
  const toastTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = toastTimers.current.get(id)
    if (timer) clearTimeout(timer)
    toastTimers.current.delete(id)
  }, [])

  const pushToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      setToasts((current) => [...current.slice(-4), { ...toast, id }])
      const timer = setTimeout(() => dismissToast(id), 6200)
      toastTimers.current.set(id, timer)
    },
    [dismissToast],
  )

  const runAction = useCallback(
    (action: (current: GameState) => ActionResult) => {
      const result = action(stateRef.current)
      stateRef.current = result.state
      setState(result.state)
      if (result.toast) pushToast(result.toast)
    },
    [pushToast],
  )

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SAVE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as GameState
        if (parsed?.version === SAVE_VERSION && parsed.player && parsed.tokens) {
          stateRef.current = parsed
          setState(parsed)
        }
      }
    } catch {
      // A corrupt save should never prevent the world from booting.
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(state))
      } catch {
        // Storage quota is not a simulation failure.
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [state, hydrated])

  useEffect(() => {
    if (paused) return
    const interval = setInterval(() => {
      setState((current) => advance(current))
    }, TICK_MS / speed)
    return () => clearInterval(interval)
  }, [paused, speed])

  useEffect(() => {
    let cancelled = false
    checkEngine().then((result) => {
      if (cancelled) return
      setEngineOnline(result.source === 'grok')
      setState((current) => ({
        ...current,
        engineStatus: result.source === 'grok' ? 'grok' : 'local',
      }))
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const current = stateRef.current
      if (current.tick - syncRef.current < 10) return
      syncRef.current = current.tick
      requestWorldEvent(current).then((event) => {
        if (!event) return
        setState((prev) => {
          const next = applyWorldEvent(prev, event)
          stateRef.current = next
          return next
        })
      })
    }, 18_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Optional shared Wire: when Supabase is configured, remote posts are
    // merged by id so the local echo of your own transmission is not doubled.
    const unsubscribe = subscribeToWire((remote) => {
      setState((prev) => {
        if (prev.feed.some((item) => item.id === remote.id)) return prev
        const next = { ...prev, feed: [remote, ...prev.feed].slice(0, 70) }
        stateRef.current = next
        return next
      })
    })
    return unsubscribe
  }, [])

  const resetWorld = useCallback(() => {
    const fresh = createInitialState()
    stateRef.current = fresh
    setState(fresh)
    try {
      window.localStorage.removeItem(SAVE_KEY)
    } catch {
      // ignore
    }
    pushToast({ title: 'WORLD RESEEDED', message: 'A fresh simulation is now running.', tone: 'info' })
  }, [pushToast])

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      toasts,
      hydrated,
      paused,
      speed,
      engineOnline,
      setPaused,
      setSpeed,
      dismissToast,
      runAction,
      pushToast,
      resetWorld,
    }),
    [state, toasts, hydrated, paused, speed, engineOnline, dismissToast, runAction, pushToast, resetWorld],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame must be used inside GameProvider')
  return context
}
