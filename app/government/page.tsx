import type { Metadata } from 'next'
import { GovernmentPage } from '@/components/pages/Government'

export const metadata: Metadata = { title: 'Government · OmniLife: The Syndicate' }

export default function Page() {
  return <GovernmentPage />
}
