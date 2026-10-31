import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, createReadStream } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)))
const outDir = join(root, 'out')
const port = Number(process.env.PORT || 3000)

function loadEnvFile() {
  const path = join(root, '.env.local')
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match) continue
    const key = match[1]
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile()

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
  })
  res.end(JSON.stringify(body))
}

function readBody(req, limit = 1_500_000) {
  return new Promise((resolveBody, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('Request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolveBody(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

const localEvents = [
  {
    title: 'Liquidity Squeeze',
    description:
      'Overnight repo rates spiked after a clearing member missed margin. Credit is tightening across the mesh and every bank is repricing risk in real time.',
    category: 'finance',
    severity: 'high',
    headline: 'LIQUIDITY SQUEEZE: repo rates spike after margin miss',
    hue: 350,
    effects: [
      { kind: 'market', delta: -0.011 },
      { kind: 'token', targetId: 'omni', delta: -0.008 },
      { kind: 'bank', targetId: 'blackvault', delta: -0.018 },
    ],
  },
  {
    title: 'Sovereign Compute Mandate',
    description:
      'The city council approved a sovereign compute mandate, routing public contracts into Helix Park. Fiber capacity is now a civic utility and a private weapon.',
    category: 'tech',
    severity: 'high',
    headline: 'SOVEREIGN COMPUTE MANDATE: public contracts flood Helix Park',
    hue: 42,
    effects: [
      { kind: 'token', targetId: 'helios', delta: 0.026 },
      { kind: 'district', targetId: 'helix', delta: 0.01 },
      { kind: 'isp', targetId: 'aether', delta: 0.012 },
      { kind: 'market', delta: 0.008 },
    ],
  },
  {
    title: 'Dockside Crackdown',
    description:
      'A joint task force sealed three warehouses at Dockside. The official manifest lists machine parts. The actual manifest is already on the Wire.',
    category: 'crime',
    severity: 'high',
    headline: 'DOCKSIDE CRACKDOWN: task force seals three warehouses',
    hue: 338,
    effects: [
      { kind: 'district', targetId: 'dockside', delta: -0.012 },
      { kind: 'token', targetId: 'void', delta: 0.02 },
      { kind: 'government', delta: 0.012 },
    ],
  },
  {
    title: 'Backbone Transit Dispute',
    description:
      'RexNet accused AetherLink of route hijacking. AetherLink accused RexNet of extortion. Both are correct. Latency is up across the mesh.',
    category: 'infra',
    severity: 'medium',
    headline: 'TRANSIT DISPUTE: RexNet and AetherLink trade hijack claims',
    hue: 196,
    effects: [
      { kind: 'isp', targetId: 'aether', delta: 0.01 },
      { kind: 'isp', targetId: 'rexnet', delta: -0.01 },
      { kind: 'market', delta: -0.003 },
    ],
  },
  {
    title: 'Media Narrative Shock',
    description:
      'A leaked editorial calendar exposed coordinated coverage across three networks. Credibility is collapsing and the public is finally paying attention.',
    category: 'media',
    severity: 'medium',
    headline: 'NARRATIVE SHOCK: leaked editorial calendar exposes coordinated coverage',
    hue: 302,
    effects: [
      { kind: 'media', targetId: 'vox', delta: -0.016 },
      { kind: 'media', targetId: 'signal9', delta: 0.012 },
      { kind: 'government', delta: 0.006 },
    ],
  },
  {
    title: 'Regulatory Shock Doctrine',
    description:
      'A emergency session of the Senate Finance Committee produced a new disclosure regime. Compliance costs are up, but the incumbents can afford them.',
    category: 'politics',
    severity: 'high',
    headline: 'SHOCK DOCTRINE: emergency session passes new disclosure regime',
    hue: 218,
    effects: [
      { kind: 'market', delta: -0.006 },
      { kind: 'government', delta: 0.018 },
      { kind: 'token', targetId: 'ghost', delta: -0.02 },
    ],
  },
]

function localEngineEvent(snapshot) {
  const event = localEvents[Math.floor(Math.random() * localEvents.length)]
  const tokens = Array.isArray(snapshot?.tokens) ? snapshot.tokens : []
  const chosen = tokens.length ? tokens[Math.floor(Math.random() * tokens.length)] : null
  const effects = [...event.effects]
  if (chosen && Math.random() < 0.45) {
    effects.push({
      kind: 'token',
      targetId: chosen.symbol?.toLowerCase(),
      delta: (Math.random() - 0.45) * 0.04,
      note: 'Narrative spillover',
    })
  }
  return { ...event, effects, source: 'local' }
}

function systemPrompt() {
  return `You are the autonomous Dungeon Master and economic AI of OmniLife: The Syndicate, a living MMO economic simulation.
You receive a live world snapshot. Invent ONE fresh, specific, ruthless world event that creates strategic consequences for the player.
Rules:
- Return JSON only, no markdown.
- category must be one of: macro, tech, crime, politics, media, finance, infra.
- severity must be one of: low, medium, high, critical.
- effects must be 2-5 items. kind must be one of: token, district, bank, isp, media, syndicate, government, market.
- targetId must match an id or symbol from the snapshot when provided. For market effects omit targetId.
- delta is a decimal percentage, between -0.06 and 0.06.
- Write like a cynical financial journalist. Be concrete. No generic filler.
- headline must be uppercase and under 120 characters.
JSON shape: {"title":"...","description":"...","category":"...","severity":"...","headline":"...","hue":174,"effects":[{"kind":"token","targetId":"neon","delta":0.02,"note":"..."}]}`
}

async function grokEvent(snapshot) {
  const key = process.env.GROK_API_KEY || process.env.XAI_API_KEY
  if (!key) return null
  const model = process.env.GROK_MODEL || 'grok-3-mini'
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 18_000)
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.95,
        max_tokens: 700,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt() },
          {
            role: 'user',
            content: `Current world snapshot:\n${JSON.stringify(snapshot, null, 2)}\n\nGenerate the next world event.`,
          },
        ],
      }),
      signal: controller.signal,
    })
    if (!response.ok) return { error: `Grok HTTP ${response.status}` }
    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) return { error: 'Grok returned no content' }
    const parsed = JSON.parse(content)
    return { event: { ...parsed, source: 'grok' }, model }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Grok request failed' }
  } finally {
    clearTimeout(timer)
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${port}`)

  if (url.pathname === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      grok: Boolean(process.env.GROK_API_KEY || process.env.XAI_API_KEY),
      model: process.env.GROK_MODEL || 'grok-3-mini',
      uptime: Math.round(process.uptime()),
    })
    return
  }

  if (url.pathname === '/api/world-engine' && req.method === 'POST') {
    try {
      const body = await readBody(req)
      const snapshot = body.snapshot ?? {}
      const grok = await grokEvent(snapshot)
      if (grok?.event) {
        sendJson(res, 200, { ok: true, source: 'grok', model: grok.model, event: grok.event })
        return
      }
      sendJson(res, 200, {
        ok: true,
        source: 'local',
        model: 'procedural-director',
        event: localEngineEvent(snapshot),
        ...(grok?.error ? { error: grok.error } : {}),
      })
      return
    } catch (error) {
      sendJson(res, 400, { ok: false, source: 'local', error: error instanceof Error ? error.message : 'Bad request' })
      return
    }
  }

  if (url.pathname === '/api/imagery') {
    const query = (url.searchParams.get('q') || 'cyberpunk corporate city').slice(0, 80)
    const key = process.env.UNSPLASH_ACCESS_KEY
    if (key) {
      try {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape`,
          { headers: { authorization: `Client-ID ${key}` } },
        )
        if (response.ok) {
          const data = await response.json()
          sendJson(res, 200, {
            ok: true,
            source: 'unsplash',
            images: (data.results || []).map((item) => ({
              id: item.id,
              url: item.urls?.regular,
              thumb: item.urls?.small,
              credit: item.user?.name,
              link: item.links?.html,
            })),
          })
          return
        }
      } catch {
        // fall through to curated imagery
      }
    }
    sendJson(res, 200, { ok: true, source: 'curated', images: [] })
    return
  }

  if (url.pathname === '/api/npc-action' && req.method === 'POST') {
    try {
      const body = await readBody(req)
      sendJson(res, 200, {
        ok: true,
        source: 'local',
        action: {
          actor: body?.snapshot?.npcs?.[0]?.name ?? 'Kaito Mercer',
          intent: 'accumulate',
          message: 'The tape is thin. I am not the one who gets filled at the top.',
        },
      })
      return
    } catch {
      sendJson(res, 400, { ok: false, source: 'local' })
      return
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' })
    return
  }

  const pathname = decodeURIComponent(url.pathname)
  const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, '')
  let file = resolve(join(outDir, safe))
  if (!file.startsWith(outDir)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  try {
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
    if (!existsSync(file) && !extname(file)) {
      const directoryIndex = join(file, 'index.html')
      if (existsSync(directoryIndex)) file = directoryIndex
    }
    if (!existsSync(file)) {
      const html = join(file, '.html')
      if (existsSync(html)) file = html
    }
    if (!existsSync(file)) file = join(outDir, 'index.html')
    const stat = statSync(file)
    const extension = extname(file)
    const cache = file.includes(`${join(outDir, '_next', 'static')}`)
      ? 'public, max-age=31536000, immutable'
      : 'no-cache'
    res.writeHead(200, {
      'content-type': mime[extension] || 'application/octet-stream',
      'content-length': stat.size,
      'cache-control': cache,
      'x-content-type-options': 'nosniff',
    })
    if (req.method === 'HEAD') {
      res.end()
      return
    }
    createReadStream(file).pipe(res)
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('Not found')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`OmniLife mesh online on http://0.0.0.0:${port}`)
  console.log(`Static export: ${outDir}`)
  console.log(`Grok engine: ${process.env.GROK_API_KEY || process.env.XAI_API_KEY ? 'configured' : 'local fallback'}`)
})
