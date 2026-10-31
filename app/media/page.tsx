import type { Metadata } from 'next'
import { MediaPage } from '@/components/pages/Media'

export const metadata: Metadata = { title: 'Media Empire · OmniLife: The Syndicate' }

export default function Page() {
  return <MediaPage />
}
