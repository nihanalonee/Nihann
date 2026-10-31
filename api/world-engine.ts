/**
 * Grok world engine — serverless proxy.
 *
 * Deploy this function alongside the client (Vercel/Netlify/Cloudflare) and set
 * GROK_API_KEY in the environment. The browser never receives the key.
 *
 * Request body: a compact snapshot of the simulation.
 * Response: a validated world event + optional rival directive.
 *
 * The API key from the original design document is deliberately NOT committed.
 */

declare const process: { env: Record<string, string | undefined> };

type Severity = "low" | "medium" | "high" | "critical";
type Category = "macro" | "tech" | "crime" | "regulation" | "media" | "infrastructure";

interface WorldEventPayload {
  title: string;
  summary: string;
  severity: Severity;
  category: Category;
  effects: string[];
  shocks?: Record<string, number>;
  rivalDirective?: {
    rival: string;
    action: "accumulate" | "dump" | "lobby" | "cyber" | "media" | "acquire";
    target?: string;
    rationale: string;
  };
}

const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];
const CATEGORIES: Category[] = [
  "macro",
  "tech",
  "crime",
  "regulation",
  "media",
  "infrastructure",
];

const SYSTEM_PROMPT = `You are the autonomous Dungeon Master and rival-AI brain for OmniLife: The Syndicate,
a persistent economic simulation. The city has markets, a fractional-reserve bank, an ISP backbone,
media networks, a crime syndicate, a regulator and AI billionaire rivals.

Return ONE dynamic world event and ONE rival directive as strict JSON. No markdown, no prose outside
the JSON object. Schema:
{
  "event": {
    "title": "short headline, max 60 chars",
    "summary": "2–3 sentences of specific, grounded consequence, max 360 chars",
    "severity": "low|medium|high|critical",
    "category": "macro|tech|crime|regulation|media|infrastructure",
    "effects": ["3–5 terse mechanical effects, e.g. OMN -6%", "Heat +8"],
    "shocks": { "assetId": -6, "otherAssetId": 3 }
  },
  "rivalDirective": {
    "rival": "exact rival name from the supplied roster",
    "action": "accumulate|dump|lobby|cyber|media|acquire",
    "target": "asset ticker, rival name, bill, or district",
    "rationale": "one sentence in the rival's voice"
  }
}
Use only asset IDs supplied in the snapshot. shocks values are percentages between -25 and 25.
Escalate consequences from the current state; never repeat a recent headline.`;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function number(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(-1_000_000_000_000, Math.min(1_000_000_000_000, value));
}

function normaliseEvent(raw: unknown, allowedIds: Set<string>): WorldEventPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const event = (source.event ?? source) as Record<string, unknown>;
  const title = text(event.title, 60);
  const summary = text(event.summary, 360);
  if (title.length < 4 || summary.length < 20) return null;

  const severity = SEVERITIES.includes(event.severity as Severity)
    ? (event.severity as Severity)
    : "medium";
  const category = CATEGORIES.includes(event.category as Category)
    ? (event.category as Category)
    : "macro";

  const effects = Array.isArray(event.effects)
    ? event.effects.map((effect) => text(effect, 48)).filter(Boolean).slice(0, 5)
    : [];

  const shocks: Record<string, number> = {};
  if (event.shocks && typeof event.shocks === "object") {
    for (const [id, value] of Object.entries(event.shocks as Record<string, unknown>)) {
      if (!allowedIds.has(id)) continue;
      const pct = number(value);
      if (pct !== 0) shocks[id] = Math.max(-25, Math.min(25, pct));
    }
  }

  const directive = source.rivalDirective as Record<string, unknown> | undefined;
  const validAction = ["accumulate", "dump", "lobby", "cyber", "media", "acquire"].includes(
    String(directive?.action),
  );
  const rivalDirective =
    directive && validAction && typeof directive.rival === "string"
      ? {
          rival: text(directive.rival, 48),
          action: directive.action as NonNullable<WorldEventPayload["rivalDirective"]>["action"],
          target: text(directive.target, 48) || undefined,
          rationale: text(directive.rationale, 180),
        }
      : undefined;

  return {
    title,
    summary,
    severity,
    category,
    effects: effects.length ? effects : ["Market repricing in progress"],
    shocks: Object.keys(shocks).length ? shocks : undefined,
    rivalDirective,
  };
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type",
      },
    });
  }
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed. POST a world snapshot." });
  }

  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    return json(503, {
      error: "GROK_API_KEY is not configured. The client will use its local Dungeon Master.",
    });
  }

  let snapshot: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 60_000) return json(413, { error: "Snapshot too large." });
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("not an object");
    snapshot = parsed as Record<string, unknown>;
  } catch {
    return json(400, { error: "Invalid JSON snapshot." });
  }

  const assets = Array.isArray(snapshot.assets) ? snapshot.assets : [];
  const allowedIds = new Set(
    assets
      .map((asset) => (asset && typeof asset === "object" ? (asset as Record<string, unknown>).id : null))
      .filter((id): id is string => typeof id === "string"),
  );

  const compactState = {
    day: number(snapshot.day, 1),
    tick: number(snapshot.tick),
    market: {
      sentiment: number(snapshot.sentiment, 50),
      volatility: number(snapshot.volatility, 40),
      index: number(snapshot.index, 100),
    },
    regulatoryPressure: number(snapshot.regulatoryPressure, 30),
    cyberThreat: number(snapshot.cyberThreat, 20),
    player: snapshot.player ?? {},
    assets: assets.slice(0, 20),
    rivals: Array.isArray(snapshot.rivals) ? snapshot.rivals.slice(0, 8) : [],
    isp: snapshot.isp ?? {},
    bank: snapshot.bank ?? {},
    recentEvents: Array.isArray(snapshot.recentEvents) ? snapshot.recentEvents.slice(0, 5) : [],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const grok = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.GROK_MODEL || "grok-4",
        temperature: 0.9,
        max_tokens: 700,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Current simulation state:\n${JSON.stringify(compactState)}\n\nGenerate the next event and rival directive.`,
          },
        ],
      }),
    });

    if (!grok.ok) {
      const detail = await grok.text().catch(() => "");
      return json(502, {
        error: `Grok request failed (${grok.status}).`,
        detail: detail.slice(0, 300),
      });
    }

    const payload = (await grok.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start === -1 || end <= start) {
      return json(502, { error: "Grok returned no JSON object." });
    }

    const parsed = JSON.parse(content.slice(start, end + 1));
    const event = normaliseEvent(parsed, allowedIds);
    if (!event) return json(502, { error: "Grok response failed validation." });

    return json(200, { event, directive: event.rivalDirective ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return json(502, { error: "World engine timeout or transport failure.", detail: message });
  } finally {
    clearTimeout(timeout);
  }
}
