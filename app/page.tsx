import type { Metadata } from 'next'
import { Dashboard } from '@/components/pages/Dashboard'

export const metadata: Metadata = { title: 'Command Center · OmniLife: The Syndicate' }

export default function Page() {
  return <Dashboard />
}
