import type { GameState, RivalDirective, WorldEvent } from "../types";

interface EngineResponse {
  event: {
    title: string;
    summary: string;
    severity: WorldEvent["severity"];
    category: WorldEvent["category"];
    effects: string[];
    shocks?: Record<string, number>;
  };
  directive?: RivalDirective | null;
}

/**
 * Calls the server-side Grok world engine. The API key lives only in the
 * deployment environment (GROK_API_KEY) and is never shipped to the browser.
 * If the route is unavailable — e.g. the static preview build — the local
 * Dungeon Master in engine.ts keeps the world moving.
 */
const REMOTE_ENGINE_ENABLED = import.meta.env.VITE_WORLD_ENGINE === "remote";

export async function requestWorldEvent(state: GameState): Promise<WorldEvent | null> {
  // The static/Vite preview ships without a serverless runtime. Only poll the
  // Grok proxy when the deployment explicitly opts in.
  if (!REMOTE_ENGINE_ENABLED) return null;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6_000);
  try {
    const response = await fetch("/api/world-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        day: state.world.day,
        tick: state.world.tick,
        sentiment: state.world.sentiment,
        volatility: state.world.volatility,
        index: state.world.index,
        regulatoryPressure: state.government.regulatoryPressure,
        cyberThreat: state.world.cyberThreat,
        player: {
          name: state.player.name,
          netWorth: state.player.cash,
          reputation: state.player.reputation,
        },
        assets: state.assets.map((a) => ({
          id: a.id,
          ticker: a.ticker,
          kind: a.kind,
          price: a.price,
          change: ((a.price - a.prevClose) / a.prevClose) * 100,
          sentiment: a.sentiment,
        })),
        rivals: state.corporate.rivals.map((r) => ({
          name: r.name,
          ceo: r.ceo,
          netWorth: r.netWorth,
          focus: r.focus,
        })),
        isp: { uptime: state.isp.uptime, load: state.isp.nodes.reduce((s, n) => s + n.load, 0) },
        bank: { deposits: state.bank.deposits, reserves: state.bank.reserves, status: state.bank.status },
        recentEvents: state.world.events.slice(0, 5).map((event) => ({
          title: event.title,
          category: event.category,
          severity: event.severity,
        })),
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as EngineResponse;
    if (!data?.event?.title || !data?.event?.summary) return null;
    return {
      id: `grok-${Date.now().toString(36)}`,
      title: data.event.title,
      summary: data.event.summary,
      severity: data.event.severity ?? "medium",
      category: data.event.category ?? "macro",
      effects: Array.isArray(data.event.effects) ? data.event.effects.slice(0, 5) : [],
      tick: state.world.tick,
      day: state.world.day,
      source: "grok",
      shocks: data.event.shocks,
      directive: data.directive ?? undefined,
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}
