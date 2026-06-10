import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'

export const metadata: Metadata = {
  title: 'New World Idle',
  description: 'Build your own path in a living world.',
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
