import type { Metadata } from 'next'
import { BankingPage } from '@/components/pages/Banking'

export const metadata: Metadata = { title: 'Banking · OmniLife: The Syndicate' }

export default function Page() {
  return <BankingPage />
}
