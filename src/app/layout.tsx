import type { Metadata } from 'next'
import { Inter, Cinzel } from 'next/font/google'
import './globals.css'
import { ReactNode } from 'react'
import { SiteChrome } from '@/components/layout/SiteChrome'
import { Preloader } from '@/components/ux/Preloader'
import { ScrollProgress } from '@/components/ux/ScrollProgress'
import { NoiseGrain } from '@/components/ux/NoiseGrain'
import { HeartbeatGlow } from '@/components/ux/HeartbeatGlow'
import { TransitionProvider } from '@/context/TransitionContext'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const cinzel = Cinzel({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cinzel',
  weight: ['400', '600', '700', '900'],
})

export const metadata: Metadata = {
  title: 'UNHOLY CO. — BloodThirst',
  description: 'Gothic premium canned water. Stay Unholy.',
  openGraph: {
    title: 'UNHOLY CO. — BloodThirst',
    description: 'Gothic premium canned water. Stay Unholy.',
    images: ['/og-hero.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNHOLY CO. — BloodThirst',
    description: 'Gothic premium canned water. Stay Unholy.',
    images: ['/og-hero.png'],
  },
  metadataBase: new URL('https://theunholy.co')
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable}`} suppressHydrationWarning>
      <body className={`${inter.className} body-glow`} suppressHydrationWarning>
        <TransitionProvider>
          <Preloader />
          <HeartbeatGlow />
          <ScrollProgress />
          <SiteChrome>{children}</SiteChrome>
          <NoiseGrain />
        </TransitionProvider>
      </body>
    </html>
  )
}
