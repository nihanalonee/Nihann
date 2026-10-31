'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  Bookmark,
  Flame,
  Hash,
  Heart,
  MessageCircle,
  Radio,
  Search,
  Send,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  Verified,
} from 'lucide-react'
import { useGame } from '../GameProvider'
import {
  Avatar,
  Badge,
  Gauge,
  Panel,
  Progress,
  SectionHeading,
  Sparkline,
  StatCard,
  Tabs,
} from '../ui'
import { ago, classNames, num } from '@/lib/format'
import { postToWire } from '@/lib/actions'
import type { FeedPost } from '@/lib/types'

type FilterKind = 'all' | FeedPost['kind']

const filters: Array<{ id: FilterKind; label: string }> = [
  { id: 'all', label: 'All signals' },
  { id: 'market', label: 'Markets' },
  { id: 'scandal', label: 'Scandals' },
  { id: 'news', label: 'News' },
  { id: 'crime', label: 'Crime' },
  { id: 'media', label: 'Media' },
  { id: 'social', label: 'Social' },
]

const kindTone: Record<FeedPost['kind'], 'good' | 'bad' | 'warn' | 'info' | 'violet'> = {
  market: 'good',
  scandal: 'bad',
  news: 'info',
  crime: 'bad',
  media: 'violet',
  social: 'info',
}

function series(base: number, seed: number, amplitude = 6, points = 30): number[] {
  return Array.from({ length: points }, (_, index) => {
    const wave = Math.sin(index * 0.47 + seed) * amplitude + Math.sin(index * 0.16 + seed * 2) * amplitude * 0.6
    return Math.max(0, Math.min(100, base + wave))
  })
}

function Composer() {
  const { state, runAction } = useGame()
  const [content, setContent] = useState('')
  const remaining = 420 - content.length
  const prompts = [
    'The tape never lies. $NEON is absorbing every bid in the room.',
    'City Hall just sold the same exception twice. Ask who signed.',
    'AetherLink uptime is a public promise. Treat it like one.',
  ]

  const transmit = () => {
    if (content.trim().length < 2) return
    runAction((current) => postToWire(current, content))
    setContent('')
  }

  return (
    <Panel eyebrow="BROADCAST · SERVER-WIDE" title="Transmit to The Wire" action={<Badge tone="good" pulse>LIVE</Badge>}>
      <div className="flex gap-3">
        <Avatar name={state.player.name} hue={state.player.avatarHue} size={38} verified />
        <div className="min-w-0 flex-1">
          <textarea
            className="input min-h-[92px] resize-none leading-relaxed"
            placeholder="Say something the city cannot ignore…"
            value={content}
            maxLength={420}
            onChange={(event) => setContent(event.target.value)}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {prompts.map((prompt, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setContent(prompt)}
                  className="border border-ink-600/35 px-2 py-1 font-mono text-[8px] tracking-wide text-fog-500 transition-colors hover:border-mint-400/35 hover:text-mint-300"
                >
                  {index === 0 ? 'MARKET' : index === 1 ? 'POLITICS' : 'INFRA'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className={classNames('font-mono text-[9px]', remaining < 40 ? 'text-rose-300' : 'text-fog-500')}>{remaining} LEFT</span>
              <button type="button" className="btn btn-primary px-3 py-2 text-[9px]" onClick={transmit} disabled={content.trim().length < 2}>
                <Send size={11} /> Transmit
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-600/30 pt-2.5">
        <span className="chip chip-mint"><Verified size={10} /> VERIFIED OPERATOR</span>
        <span className="chip"><Users size={10} /> {state.player.influence.toFixed(0)} INFLUENCE</span>
        <span className="chip"><Activity size={10} /> {state.feed.length} SIGNALS CACHED</span>
      </div>
    </Panel>
  )
}

function PostCard({ post }: { post: FeedPost }) {
  const { state } = useGame()
  return (
    <article className="border-b border-ink-600/25 px-1 py-4 last:border-0">
      <div className="flex gap-3">
        <Avatar name={post.author} hue={post.avatarHue} size={34} verified={post.verified} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-[11px] font-semibold text-fog-200">{post.author}</span>
            {post.verified && <Verified size={10} className="text-mint-400" />}
            <span className="truncate font-mono text-[9px] text-fog-600">{post.handle}</span>
            <span className="text-[9px] text-fog-600">·</span>
            <span className="text-[9px] text-fog-600">{ago(post.day, post.hour, state.day, state.hour)}</span>
            <span className="ml-auto"><Badge tone={kindTone[post.kind]}>{post.kind.toUpperCase()}</Badge></span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-fog-300">{post.content}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="font-mono text-[9px] text-mint-400/70">#{tag.replace(/^#/, '')}</span>
            ))}
          </div>
          <div className="mt-2.5 flex items-center gap-4 border-t border-ink-600/20 pt-2">
            <span className="flex items-center gap-1 font-mono text-[9px] text-fog-500"><Heart size={10} /> {num(post.likes)}</span>
            <span className="flex items-center gap-1 font-mono text-[9px] text-fog-500"><MessageCircle size={10} /> {num(post.replies)}</span>
            <span className="flex items-center gap-1 font-mono text-[9px] text-fog-500"><Share2 size={10} /> {num(Math.round(post.likes * 0.18))}</span>
            <span className="ml-auto flex items-center gap-1.5">
              <span className={classNames('font-mono text-[8px]', post.sentiment >= 0 ? 'text-mint-400' : 'text-rose-400')}>SENTIMENT</span>
              <div className="w-12"><Progress value={Math.min(100, Math.abs(post.sentiment))} hue={post.sentiment >= 0 ? 174 : 350} height={3} /></div>
              <span className={classNames('font-mono text-[8px]', post.sentiment >= 0 ? 'text-mint-300' : 'text-rose-300')}>{post.sentiment > 0 ? '+' : ''}{post.sentiment.toFixed(0)}</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

function FeedStream({ query, onQueryChange }: { query: string; onQueryChange: (value: string) => void }) {
  const { state } = useGame()
  const [kind, setKind] = useState<FilterKind>('all')
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return state.feed.filter((post) => {
      if (kind !== 'all' && post.kind !== kind) return false
      if (!needle) return true
      return (
        post.content.toLowerCase().includes(needle) ||
        post.author.toLowerCase().includes(needle) ||
        post.handle.toLowerCase().includes(needle) ||
        post.tags.some((tag) => tag.toLowerCase().includes(needle.replace(/^#/, '')))
      )
    })
  }, [state.feed, kind, query])

  return (
    <Panel eyebrow={`${filtered.length} OF ${state.feed.length} SIGNALS`} title="Live feed" dense>
      <div className="mb-3 space-y-2">
        <Tabs
          wrap
          tabs={filters.map((filter) => ({
            id: filter.id,
            label: filter.label,
            count: filter.id === 'all' ? state.feed.length : state.feed.filter((post) => post.kind === filter.id).length,
          }))}
          active={kind}
          onChange={(id) => setKind(id as FilterKind)}
        />
        <div className="relative">
          <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fog-600" />
          <input
            className="input py-1.5 pl-7 text-[10px]"
            placeholder="Search signals or #tags"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
      </div>

      <div className="max-h-[880px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="border border-dashed border-ink-600/40 p-8 text-center">
            <Radio size={20} className="mx-auto mb-2 text-fog-600" />
            <div className="text-[11px] text-fog-400">No signals match this filter.</div>
            <div className="micro mt-1">Try a different narrative or clear the search.</div>
          </div>
        ) : (
          filtered.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </Panel>
  )
}

function TrendingPanel({ onTag }: { onTag: (tag: string) => void }) {
  const { state } = useGame()
  const tags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const post of state.feed) {
      for (const tag of post.tags) {
        const clean = tag.replace(/^#/, '')
        if (!clean) continue
        counts.set(clean, (counts.get(clean) ?? 0) + 1)
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 9)
  }, [state.feed])

  return (
    <Panel eyebrow="NARRATIVE HEAT" title="Trending tags" action={<Badge tone="violet" pulse>{tags.length} LIVE</Badge>}>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(([tag, count]) => (
          <button
            key={tag}
            type="button"
            onClick={() => onTag(tag)}
            className="group flex items-center gap-1.5 border border-ink-600/35 bg-ink-900/35 px-2 py-1.5 transition-colors hover:border-mint-400/35"
          >
            <Hash size={9} className="text-mint-400/60" />
            <span className="font-mono text-[9px] text-fog-300 group-hover:text-mint-300">{tag}</span>
            <span className="font-mono text-[8px] text-fog-600">{count}</span>
          </button>
        ))}
        {tags.length === 0 && <div className="text-[10px] text-fog-500">No tags on the wire yet.</div>}
      </div>
      <div className="mt-3 h-10">
        <Sparkline data={series(45 + Math.min(30, tags.length * 3), 7, 8)} hue={302} height={40} />
      </div>
      <p className="mt-2 text-[9px] leading-relaxed text-fog-500">Narratives compound. A tag that trends for three cycles starts moving real capital.</p>
    </Panel>
  )
}

function VoicesPanel() {
  const { state } = useGame()
  const voices = useMemo(() => {
    const map = new Map<string, { author: string; handle: string; hue: number; verified: boolean; posts: number; likes: number; sentiment: number }>()
    for (const post of state.feed) {
      const current = map.get(post.handle) ?? {
        author: post.author,
        handle: post.handle,
        hue: post.avatarHue,
        verified: post.verified,
        posts: 0,
        likes: 0,
        sentiment: 0,
      }
      current.posts += 1
      current.likes += post.likes
      current.sentiment += post.sentiment
      map.set(post.handle, current)
    }
    return [...map.values()].sort((a, b) => b.likes - a.likes).slice(0, 6)
  }, [state.feed])

  return (
    <Panel eyebrow="AMPLIFICATION RANK" title="Top voices">
      <div className="space-y-2">
        {voices.map((voice, index) => (
          <div key={voice.handle} className="flex items-center gap-2.5 border border-ink-600/25 bg-ink-900/30 p-2">
            <span className="w-4 font-mono text-[9px] text-fog-600">{String(index + 1).padStart(2, '0')}</span>
            <Avatar name={voice.author} hue={voice.hue} size={26} verified={voice.verified} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[10px] text-fog-200">{voice.author}</div>
              <div className="micro truncate">{voice.handle} · {voice.posts} posts</div>
            </div>
            <div className="text-right">
              <div className="mono text-[9px] text-fog-300">{num(voice.likes)}</div>
              <div className="micro">likes</div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function SentimentPanel() {
  const { state } = useGame()
  const avg = state.feed.reduce((sum, post) => sum + post.sentiment, 0) / Math.max(1, state.feed.length)
  const positive = state.feed.filter((post) => post.sentiment > 15).length
  const negative = state.feed.filter((post) => post.sentiment < -15).length
  const neutral = Math.max(0, state.feed.length - positive - negative)
  const total = Math.max(1, state.feed.length)

  return (
    <Panel eyebrow="PUBLIC MOOD" title="Sentiment monitor" action={<Badge tone={avg >= 0 ? 'good' : 'bad'}>{avg >= 0 ? 'RISK-ON' : 'RISK-OFF'}</Badge>}>
      <div className="flex items-center gap-4">
        <Gauge value={Math.min(100, Math.max(0, 50 + avg))} label="Wire mood" hue={avg >= 0 ? 174 : 350} size={116} sub={avg >= 0 ? 'BULLISH' : 'BEARISH'} />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Positive</span><span className="mono text-mint-300">{positive}</span></div>
            <Progress value={(positive / total) * 100} hue={174} className="mt-1" height={3} />
          </div>
          <div>
            <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Neutral</span><span className="mono text-fog-300">{neutral}</span></div>
            <Progress value={(neutral / total) * 100} hue={196} className="mt-1" height={3} />
          </div>
          <div>
            <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Negative</span><span className="mono text-rose-300">{negative}</span></div>
            <Progress value={(negative / total) * 100} hue={350} className="mt-1" height={3} />
          </div>
        </div>
      </div>
      <div className="mt-3 border-t border-ink-600/30 pt-2.5">
        <div className="flex items-center justify-between text-[9px]"><span className="text-fog-500">Average sentiment</span><span className={classNames('mono', avg >= 0 ? 'text-mint-300' : 'text-rose-300')}>{avg > 0 ? '+' : ''}{avg.toFixed(1)}</span></div>
        <div className="mt-1 flex items-center justify-between text-[9px]"><span className="text-fog-500">Verified voices</span><span className="mono text-fog-200">{state.feed.filter((post) => post.verified).length}</span></div>
        <div className="mt-1 flex items-center justify-between text-[9px]"><span className="text-fog-500">Engine-origin posts</span><span className="mono text-violet-300">{state.feed.filter((post) => post.source === 'grok').length}</span></div>
      </div>
    </Panel>
  )
}

function SignalProtocol() {
  return (
    <Panel eyebrow="WIRE PROTOCOL" title="How the feed moves">
      <div className="space-y-2">
        {[
          { icon: TrendingUp, title: 'Narrative precedes price', body: 'Sentiment shifts on The Wire lead token and equity repricing by one to three ticks.' },
          { icon: Flame, title: 'Scandals travel faster', body: 'Negative posts amplify harder and raise heat for the accounts behind them.' },
          { icon: Bookmark, title: 'Verification is leverage', body: 'Verified accounts carry more weight with the AI director and the public.' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="flex items-start gap-2.5 border border-ink-600/30 bg-ink-900/30 p-2.5">
              <Icon size={13} className="mt-0.5 shrink-0 text-mint-300" />
              <div>
                <div className="text-[10px] text-fog-200">{item.title}</div>
                <p className="mt-0.5 text-[9px] leading-relaxed text-fog-500">{item.body}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

export function WirePage() {
  const { state } = useGame()
  const [query, setQuery] = useState('')
  const avgSentiment = state.feed.reduce((sum, post) => sum + post.sentiment, 0) / Math.max(1, state.feed.length)
  const verified = state.feed.filter((post) => post.verified).length
  const totalLikes = state.feed.reduce((sum, post) => sum + post.likes, 0)

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow="SERVER-WIDE · SOCIAL GRAPH · NARRATIVE"
        title="The Wire"
        description="Every operator, NPC and world-engine voice shares one feed. Shape the narrative before someone else shapes it for you."
        action={<Badge tone="good" pulse>{state.feed.length} SIGNALS LIVE</Badge>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Signals cached" value={`${state.feed.length}`} sub={`${state.feed.filter((post) => post.source === 'player').length} from your terminal`} icon={<Radio size={15} />} hue={174} spark={series(50, 1, 9)} />
        <StatCard label="Average sentiment" value={`${avgSentiment > 0 ? '+' : ''}${avgSentiment.toFixed(1)}`} sub={avgSentiment >= 0 ? 'Risk-on public mood' : 'Risk-off public mood'} icon={<Activity size={15} />} hue={avgSentiment >= 0 ? 174 : 350} spark={series(50 + avgSentiment, 2, 8)} />
        <StatCard label="Verified voices" value={`${verified}`} sub="Accounts with amplification weight" icon={<Verified size={15} />} hue={196} spark={series(40 + verified, 3, 6)} />
        <StatCard label="Total amplification" value={num(totalLikes)} sub="Likes across the current feed" icon={<Sparkles size={15} />} hue={302} spark={series(55, 4, 10)} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-4 xl:col-span-8">
          <Composer />
          <FeedStream query={query} onQueryChange={setQuery} />
        </div>
        <div className="col-span-12 space-y-4 xl:col-span-4">
          <TrendingPanel onTag={(tag) => setQuery(tag)} />
          <SentimentPanel />
          <VoicesPanel />
          <SignalProtocol />
          {query && (
            <Panel eyebrow="FILTER PRIMED" title={`Search: ${query}`} action={<button type="button" className="btn btn-ghost px-2 py-1 text-[8px]" onClick={() => setQuery('')}>Clear</button>}>
              <p className="text-[10px] leading-relaxed text-fog-500">The live feed is filtered to every signal matching this narrative.</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
