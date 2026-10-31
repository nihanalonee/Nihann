import type { Metadata } from 'next'
import { AdminPage } from '@/components/pages/Admin'

export const metadata: Metadata = { title: 'God Mode · OmniLife: The Syndicate' }

export default function Page() {
  return <AdminPage />
}
