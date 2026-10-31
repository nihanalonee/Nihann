import type { Metadata } from 'next'
import { InfrastructurePage } from '@/components/pages/Infrastructure'

export const metadata: Metadata = { title: 'Infrastructure · OmniLife: The Syndicate' }

export default function Page() {
  return <InfrastructurePage />
}
