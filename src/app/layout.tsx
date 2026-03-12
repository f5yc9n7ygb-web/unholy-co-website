import type { Metadata } from 'next'
import { Inter, Cinzel } from 'next/font/google'
import './globals.css'
import { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Preloader } from '@/components/ux/Preloader'
import { CustomCursor } from '@/components/ux/CustomCursor'
import { ScrollProgress } from '@/components/ux/ScrollProgress'
import { NoiseGrain } from '@/components/ux/NoiseGrain'
import { ClickRipple } from '@/components/ux/ClickRipple'
import { HeartbeatGlow } from '@/components/ux/HeartbeatGlow'
import SmoothScroll from '@/components/ux/SmoothScroll'
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
    images: ['/og.png']
  },
  metadataBase: new URL('https://theunholy.co')
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable}`} suppressHydrationWarning>
      <body className={`${inter.className} body-glow`} suppressHydrationWarning>
        <TransitionProvider>
          <SmoothScroll />
          <Preloader />
          <CustomCursor />
          <ClickRipple />
          <HeartbeatGlow />
          <ScrollProgress />
          <Header />
          <main className="pt-20 md:pt-24 isolate">{children}</main>
          <Footer />
          <NoiseGrain />
        </TransitionProvider>
      </body>
    </html>
  )
}
