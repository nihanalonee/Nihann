import type { Metadata, Viewport } from 'next'
import './globals.css'
import { GameProvider } from '@/components/GameProvider'
import { Shell } from '@/components/Shell'

export const metadata: Metadata = {
  title: 'OmniLife: The Syndicate',
  description:
    'A living economic MMO simulation. Build banks, run fiber, control media, mint tokens, bribe governments, and outmaneuver autonomous AI tycoons.',
  applicationName: 'OmniLife',
  keywords: ['MMO', 'economic simulation', 'crypto', 'banking', 'tycoon', 'AI'],
}

export const viewport: Viewport = {
  themeColor: '#05070b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>
        <GameProvider>
          <Shell>{children}</Shell>
        </GameProvider>
      </body>
    </html>
  )
}
