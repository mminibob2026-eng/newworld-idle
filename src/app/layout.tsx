import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { I18nProvider } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'New World — 新世界',
  description: 'A persistent life simulation MMO — 一款持续生活的模拟MMO',
  openGraph: {
    title: 'New World — 新世界',
    description: 'A persistent life simulation MMO — 一款持续生活的模拟MMO',
    siteName: 'New World',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'New World — 新世界',
    description: 'A persistent life simulation MMO — 一款持续生活的模拟MMO',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
