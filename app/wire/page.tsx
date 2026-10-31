import type { Metadata } from 'next'
import { WirePage } from '@/components/pages/Wire'

export const metadata: Metadata = { title: 'The Wire · OmniLife: The Syndicate' }

export default function Page() {
  return <WirePage />
}
