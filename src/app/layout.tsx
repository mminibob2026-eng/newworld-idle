import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'

export const metadata: Metadata = {
  title: 'New World Idle',
  description: 'Build your own path in a living world. An idle MMORPG of gathering, crafting, exploration and contracts.',
  openGraph: {
    title: 'New World Idle',
    description: 'Build your own path in a living world. An idle MMORPG of gathering, crafting, exploration and contracts.',
    siteName: 'New World Idle',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'New World Idle',
    description: 'Build your own path in a living world. An idle MMORPG of gathering, crafting, exploration and contracts.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
