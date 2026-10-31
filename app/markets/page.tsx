import type { Metadata } from 'next'
import { MarketsPage } from '@/components/pages/Markets'

export const metadata: Metadata = { title: 'Markets & DEX · OmniLife: The Syndicate' }

export default function Page() {
  return <MarketsPage />
}
