"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as engine from "@/lib/engine";
import { ARCHETYPES, createInitialState } from "@/lib/seed";
import type { ActionResult, Archetype, GameState, Toast, WorldEvent } from "@/lib/types";

const STORAGE_KEY = "omnilife-syndicate-save-v1";
const BASE_TICK_MS = 9000;

interface GameContextValue {
  state: GameState | null;
  hydrated: boolean;
  aiMode: "grok" | "local" | "checking";
  aiBusy: boolean;
  startGame: (profile: { name: string; handle: string; email: string; archetype: Archetype }) => void;
  resetGame: () => void;
  setSpeed: (speed: GameState["speed"]) => void;
  dismissToast: (id: string) => void;
  act: (fn: (state: GameState) => ActionResult) => void;
  summonEvent: () => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

function safeLoad(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed?.version !== 1 || !parsed.player || !Array.isArray(parsed.tokens)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function addToast(state: GameState, toast: Omit<Toast, "id">): GameState {
  const item: Toast = {
    ...toast,
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  return { ...state, toasts: [...state.toasts.slice(-3), item] };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [aiMode, setAiMode] = useState<"grok" | "local" | "checking">("checking");
  const [aiBusy, setAiBusy] = useState(false);
  const stateRef = useRef<GameState | null>(null);
  const lastEventRef = useRef<string | null>(null);

  useEffect(() => {
    const loaded = safeLoad();
    const initial = loaded ?? createInitialState();
    setState(initial);
    setHydrated(true);
    if (loaded) lastEventRef.current = loaded.events[0]?.id ?? null;
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!hydrated || !state) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage can be full or disabled; the session still works */
    }
  }, [state, hydrated]);

  useEffect(() => {
    fetch("/api/world-engine")
      .then((r) => r.json())
      .then((data: { configured?: boolean }) => setAiMode(data.configured ? "grok" : "local"))
      .catch(() => setAiMode("local"));
  }, []);

  // Server-side admin allowlist check. This unlocks the fictional God Mode UI;
  // it is not an authentication system for a production deployment.
  useEffect(() => {
    if (!state?.started || state.adminUnlocked || !state.player.email) return;
    let cancelled = false;
    fetch("/api/admin/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: state.player.email }),
    })
      .then((r) => (r.ok ? r.json() : { admin: false }))
      .then((data: { admin?: boolean }) => {
        if (cancelled || !data.admin) return;
        setState((prev) => (prev ? { ...prev, adminUnlocked: true } : prev));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [state?.started, state?.adminUnlocked, state?.player.email]);

  // World clock
  useEffect(() => {
    if (!state?.started || state.speed === 0) return;
    const ms = BASE_TICK_MS / state.speed;
    const timer = window.setInterval(() => {
      setState((prev) => (prev && prev.started ? engine.tickWorld(prev) : prev));
    }, ms);
    return () => window.clearInterval(timer);
  }, [state?.started, state?.speed]);

  const latestEventId = state?.events[0]?.id ?? "";
  const toastKey = state?.toasts.map((t) => t.id).join("|") ?? "";

  // Surface fresh world events as toasts.
  useEffect(() => {
    if (!state?.events.length) return;
    const latest = state.events[0];
    if (!lastEventRef.current) {
      lastEventRef.current = latest.id;
      return;
    }
    if (latest.id !== lastEventRef.current) {
      lastEventRef.current = latest.id;
      setState((prev) =>
        prev
          ? addToast(prev, {
              kind: latest.severity === "critical" || latest.severity === "black-swan" ? "warning" : "info",
              title: `World event · ${latest.title}`,
              message: latest.description.slice(0, 150),
            })
          : prev,
      );
    }
  }, [latestEventId]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (!state?.toasts.length) return;
    const timers = state.toasts.map((toast) =>
      window.setTimeout(() => {
        setState((prev) => (prev ? { ...prev, toasts: prev.toasts.filter((t) => t.id !== toast.id) } : prev));
      }, 5200),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [toastKey]);

  const startGame = useCallback(
    (profile: { name: string; handle: string; email: string; archetype: Archetype }) => {
      const next = createInitialState(profile);
      next.started = true;
      lastEventRef.current = next.events[0]?.id ?? null;
      setState(next);
    },
    [],
  );

  const resetGame = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    const fresh = createInitialState();
    setState(fresh);
  }, []);

  const setSpeed = useCallback((speed: GameState["speed"]) => {
    setState((prev) => (prev ? { ...prev, speed } : prev));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setState((prev) => (prev ? { ...prev, toasts: prev.toasts.filter((t) => t.id !== id) } : prev));
  }, []);

  const act = useCallback((fn: (state: GameState) => ActionResult) => {
    setState((prev) => {
      if (!prev) return prev;
      const result = fn(prev);
      return result.toast ? addToast(result.state, result.toast) : result.state;
    });
  }, []);

  const summonEvent = useCallback(async () => {
    const snapshot = stateRef.current;
    if (!snapshot) return;
    setAiBusy(true);
    try {
      const response = await fetch("/api/world-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day: snapshot.day,
          economy: Math.round(snapshot.economy),
          regulation: Math.round(snapshot.government.regulation),
          playerNetWorth: Math.round(snapshot.player.netWorthHistory.at(-1)?.value ?? 0),
          topTokens: snapshot.tokens
            .filter((t) => !t.rugged)
            .slice(0, 5)
            .map((t) => ({ symbol: t.symbol, price: t.price, change: t.change24h })),
          activeEvents: snapshot.events.slice(0, 3).map((e) => e.title),
          headlines: snapshot.wire.slice(0, 4).map((p) => p.body),
        }),
      });
      if (!response.ok) throw new Error("World engine unavailable");
      const data = (await response.json()) as { event: WorldEvent; mode: "grok" | "local" };
      setAiMode(data.mode);
      setState((prev) => {
        if (!prev) return prev;
        const next = structuredClone(prev);
        engine.applyEventShock(next, { ...data.event, source: data.mode === "grok" ? "grok" : "system" });
        return addToast(next, {
          kind: data.mode === "grok" ? "info" : "warning",
          title: data.event.title,
          message:
            data.mode === "grok"
              ? `Grok World Engine · ${data.event.description.slice(0, 130)}`
              : `Local simulation fallback · ${data.event.description.slice(0, 130)}`,
        });
      });
    } catch {
      setAiMode("local");
      setState((prev) =>
        prev
          ? addToast(prev, {
              kind: "error",
              title: "World engine unreachable",
              message: "The local simulation is still running. Check GROK_API_KEY to enable live AI events.",
            })
          : prev,
      );
    } finally {
      setAiBusy(false);
    }
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      hydrated,
      aiMode,
      aiBusy,
      startGame,
      resetGame,
      setSpeed,
      dismissToast,
      act,
      summonEvent,
    }),
    [state, hydrated, aiMode, aiBusy, startGame, resetGame, setSpeed, dismissToast, act, summonEvent],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}

export function useProfileLabel(state: GameState): string {
  return `${ARCHETYPES[state.player.archetype].label}`;
}
