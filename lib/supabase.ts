import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { FeedPost } from './types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let cached: SupabaseClient | null | undefined

/**
 * Returns a browser Supabase client when the public URL and anon key are
 * configured at build time. The simulation is local-first, so a missing
 * configuration is a supported state rather than an error.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cached !== undefined) return cached
  if (!url || !anonKey) {
    cached = null
    return cached
  }
  cached = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    realtime: { params: { eventsPerSecond: 8 } },
  })
  return cached
}

export function supabaseConfigured(): boolean {
  return Boolean(url && anonKey)
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

function rowToPost(row: Record<string, unknown>): FeedPost {
  return {
    id: String(row.id ?? `remote_${Date.now()}`),
    author: String(row.author ?? 'Unknown operator'),
    handle: String(row.handle ?? '@unknown'),
    avatarHue: Number(row.avatar_hue ?? 174),
    content: String(row.content ?? ''),
    sentiment: Number(row.sentiment ?? 0),
    likes: Number(row.likes ?? 0),
    replies: Number(row.replies ?? 0),
    day: Number(row.day ?? 1),
    hour: Number(row.hour ?? 0),
    tags: Array.isArray(row.tags) ? row.tags.map((tag) => String(tag)) : [],
    verified: Boolean(row.verified),
    source: oneOf(row.source, ['player', 'npc', 'system', 'grok'] as const, 'npc'),
    kind: oneOf(row.kind, ['market', 'scandal', 'news', 'social', 'crime', 'media'] as const, 'social'),
  }
}

/**
 * Publishes a player transmission to the shared social_posts table. Requires
 * an authenticated Supabase session because the table's RLS policy binds
 * inserts to auth.uid(). Returns false when the optional backend is absent.
 */
export async function publishWirePost(post: FeedPost): Promise<boolean> {
  const client = getSupabaseClient()
  if (!client) return false
  try {
    const { data } = await client.auth.getSession()
    let session = data.session
    if (!session) {
      // Anonymous sign-ins must be enabled in the Supabase dashboard. This
      // keeps the shared Wire usable without a dedicated login screen.
      const { data: anonymous, error } = await client.auth.signInAnonymously()
      if (error) return false
      session = anonymous.session
    }
    const userId = session?.user.id
    if (!userId) return false
    const { error } = await client.from('social_posts').insert({
      id: post.id,
      author_id: userId,
      author: post.author,
      handle: post.handle,
      avatar_hue: post.avatarHue,
      content: post.content,
      sentiment: post.sentiment,
      likes: post.likes,
      replies: post.replies,
      day: post.day,
      hour: post.hour,
      tags: post.tags,
      verified: post.verified,
      source: post.source,
      kind: post.kind,
    })
    return !error
  } catch {
    return false
  }
}

/**
 * Subscribes to new social_posts rows over Supabase Realtime. Returns an
 * unsubscribe function, or a no-op when the optional backend is absent.
 */
export function subscribeToWire(onPost: (post: FeedPost) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const client = getSupabaseClient()
  if (!client) return () => {}
  const channel = client
    .channel('omnilife:wire:public')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'social_posts' },
      (payload) => {
        if (payload.new && typeof payload.new === 'object') {
          onPost(rowToPost(payload.new as Record<string, unknown>))
        }
      },
    )
    .subscribe()
  return () => {
    void client.removeChannel(channel)
  }
}
