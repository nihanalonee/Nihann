import { NextResponse } from "next/server";
import type { WorldEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FALLBACK_EVENTS: Array<Omit<WorldEvent, "id" | "day" | "expires" | "source">> = [
  {
    title: "Liquidity mirage",
    description:
      "A prime brokerage quietly tightened margin across the city. Leveraged players are learning that collateral is a story told by someone with more cash.",
    category: "market",
    severity: "major",
    pulse: -5,
    sentiment: -7,
    crime: 2,
    regulation: 3,
  },
  {
    title: "The regulator's inbox",
    description:
      "A whistleblower dumped 14,000 internal compliance emails. Half the city's licenses are now negotiable, and the other half are radioactive.",
    category: "policy",
    severity: "critical",
    pulse: -6,
    sentiment: -4,
    crime: 5,
    regulation: 11,
  },
  {
    title: "Fiber futures spike",
    description:
      "A hyperscaler booked every available wavelength for the next quarter. Bandwidth spot prices doubled before breakfast.",
    category: "infrastructure",
    severity: "major",
    pulse: 4,
    sentiment: 3,
    crime: 0,
    regulation: 1,
  },
  {
    title: "Narrative overflow",
    description:
      "A coordinated bot swarm pushed three unrelated tokens to the top of every feed. Retail is calling it a movement. The order books call it exit liquidity.",
    category: "media",
    severity: "minor",
    pulse: 7,
    sentiment: 6,
    crime: 1,
    regulation: 0,
  },
  {
    title: "Night court verdict",
    description:
      "A sealed hearing acquitted a syndicate lieutenant on all counts. The judge's re-election fund received an anonymous transfer within the hour.",
    category: "crime",
    severity: "major",
    pulse: -2,
    sentiment: -5,
    crime: 8,
    regulation: -2,
  },
  {
    title: "Orbital data arbitrage",
    description:
      "A private satellite constellation began selling millisecond advantage to three trading desks. Latency is now a luxury good.",
    category: "market",
    severity: "major",
    pulse: 6,
    sentiment: 2,
    crime: 0,
    regulation: 2,
  },
];

function fallbackEvent(seed: number): WorldEvent {
  const template = FALLBACK_EVENTS[Math.abs(seed) % FALLBACK_EVENTS.length];
  const now = Math.floor(Date.now() / 1000);
  return {
    ...template,
    id: `fallback-${now}-${seed % 997}`,
    day: 0,
    expires: 999_999,
    source: "system",
  };
}

const ALLOWED_CATEGORIES = new Set(["market", "policy", "crime", "media", "infrastructure", "ai"]);
const ALLOWED_SEVERITIES = new Set(["minor", "major", "critical", "black-swan"]);

function sanitize(raw: unknown, mode: "grok" | "local"): WorldEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.title !== "string" || typeof obj.description !== "string") return null;
  const category = typeof obj.category === "string" && ALLOWED_CATEGORIES.has(obj.category) ? obj.category : "market";
  const severity =
    typeof obj.severity === "string" && ALLOWED_SEVERITIES.has(obj.severity) ? obj.severity : "major";
  const num = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? Math.max(-20, Math.min(20, value)) : fallback;
  return {
    id: `event-${Date.now().toString(36)}`,
    title: obj.title.slice(0, 90),
    description: obj.description.slice(0, 480),
    category: category as WorldEvent["category"],
    severity: severity as WorldEvent["severity"],
    pulse: num(obj.pulse, -3),
    sentiment: num(obj.sentiment, -4),
    crime: num(obj.crime, 1),
    regulation: num(obj.regulation, 2),
    day: 0,
    expires: 999_999,
    source: mode === "grok" ? "grok" : "system",
  };
}

// Lightweight in-memory rate limit. Serverless instances reset, but this stops
// accidental request loops from burning paid API credits.
const hits = new Map<string, { count: number; reset: number }>();
function allowed(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (entry.count >= 8) return false;
  entry.count += 1;
  return true;
}

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.GROK_API_KEY || process.env.XAI_API_KEY),
    model: process.env.GROK_MODEL || "grok-4",
    capabilities: ["world-events", "npc-masterminds", "market-narrative"],
  });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowed(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded. The city needs a moment." }, { status: 429 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const key = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  const day = typeof body.day === "number" ? Math.round(body.day) : 1;

  if (!key) {
    const event = fallbackEvent(day + Date.now());
    event.day = day;
    event.expires = day + 4;
    return NextResponse.json({
      mode: "local",
      event,
      note: "GROK_API_KEY is not configured. Deterministic world engine used.",
    });
  }

  const system = `You are the autonomous World Engine for OmniLife: The Syndicate, a cyber-noir economic MMO.
Generate ONE plausible, specific macroeconomic or political shock based on the live server state.
Rules:
- Output strict JSON only, no markdown, no commentary.
- Shape: {"title":string,"description":string,"category":"market"|"policy"|"crime"|"media"|"infrastructure"|"ai","severity":"minor"|"major"|"critical"|"black-swan","pulse":number,"sentiment":number,"crime":number,"regulation":number}
- "description" must be 2-3 sentences, concrete, mention at least one named entity from the state, and imply a gameplay consequence.
- pulse/sentiment are market/social effects from -20 to 20. crime/regulation are 0 to 20.
- Never use placeholders, generic filler, or fourth-wall references. The city is real to its inhabitants.`;

  const user = `LIVE SERVER STATE
Day: ${day}
Economy index: ${body.economy ?? 50}/100
Regulation: ${body.regulation ?? 50}/100
Player net worth: ${body.playerNetWorth ?? 0}
Top tokens: ${JSON.stringify(body.topTokens ?? [])}
Active events: ${JSON.stringify(body.activeEvents ?? [])}
Recent Wire headlines: ${JSON.stringify(body.headlines ?? [])}

Invent the next world event. Escape the current narrative rather than repeating it.`;

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.GROK_MODEL || "grok-4",
        temperature: 0.95,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Grok world engine error", response.status, detail.slice(0, 300));
      const event = fallbackEvent(day + 3);
      event.day = day;
      event.expires = day + 4;
      return NextResponse.json({ mode: "local", event, note: "Grok call failed; local engine used." });
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }
    const event = sanitize(parsed, "grok");
    if (!event) {
      const fallback = fallbackEvent(day + 7);
      fallback.day = day;
      fallback.expires = day + 4;
      return NextResponse.json({ mode: "local", event: fallback, note: "Malformed model output; local engine used." });
    }
    event.day = day;
    event.expires = day + 5;
    return NextResponse.json({ mode: "grok", event });
  } catch (error) {
    console.error("Grok world engine exception", error);
    const event = fallbackEvent(day + 11);
    event.day = day;
    event.expires = day + 4;
    return NextResponse.json({ mode: "local", event, note: "Network failure; local engine used." });
  }
}
