import type { Metadata } from 'next'
import { Inter, Cinzel } from 'next/font/google'
import './globals.css'
import { ReactNode } from 'react'
import { headers } from 'next/headers'
import { SiteChrome } from '@/components/layout/SiteChrome'
import { Preloader } from '@/components/ux/Preloader'
import { ScrollProgress } from '@/components/ux/ScrollProgress'
import { NoiseGrain } from '@/components/ux/NoiseGrain'
import { HeartbeatGlow } from '@/components/ux/HeartbeatGlow'
import { TransitionProvider } from '@/context/TransitionContext'
import { PostHogProvider } from '@/components/providers/PostHogProvider'

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
  metadataBase: new URL('https://theunholy.co'),
  title: {
    default: 'UNHOLY CO. — BloodThirst',
    template: '%s | UNHOLY CO.',
  },
  description: 'Gothic premium canned water. Natural Himalayan mineral water. Zero sugar, zero plastic. Stay Unholy.',
  keywords: ['premium canned water', 'BloodThirst', 'Himalayan mineral water', 'gothic water brand', 'UNHOLY CO', 'canned water India'],
  authors: [{ name: 'UNHOLY CO.' }],
  creator: 'UNHOLY CO.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'UNHOLY CO.',
    title: 'UNHOLY CO. — BloodThirst',
    description: 'Gothic premium canned water. Natural Himalayan mineral water. Zero sugar, zero plastic. Stay Unholy.',
    url: '/',
    images: [
      {
        url: '/og-hero.png',
        width: 1200,
        height: 630,
        alt: 'UNHOLY CO. BloodThirst — Gothic Premium Canned Water',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNHOLY CO. — BloodThirst',
    description: 'Gothic premium canned water. Natural Himalayan mineral water. Zero sugar, zero plastic. Stay Unholy.',
    images: ['/og-hero.png'],
    creator: '@unholyco',
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'UNHOLY CO.',
  url: 'https://theunholy.co',
  logo: 'https://theunholy.co/uhc-logo.png',
  description: 'Gothic premium canned water brand. Natural Himalayan mineral water, zero sugar, zero plastic.',
  sameAs: [
    'https://www.instagram.com/unholyco',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'hello@theunholy.co',
    availableLanguage: 'English',
  },
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'UNHOLY CO.',
  url: 'https://theunholy.co',
  description: 'Gothic premium canned water. Natural Himalayan mineral water. Zero sugar, zero plastic.',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Read the header stamped by middleware for theunholy.co requests.
  // This is the reliable server-side way to detect domain — usePathname()
  // in client components returns the browser URL, not the rewritten path.
  const headersList = await headers()
  const isTeaserDomain = headersList.get('x-teaser-domain') === '1'

  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={`${inter.className} body-glow`} suppressHydrationWarning>
        <PostHogProvider>
          <TransitionProvider>
            <Preloader />
            <HeartbeatGlow />
            <ScrollProgress />
            <SiteChrome isTeaserDomain={isTeaserDomain}>{children}</SiteChrome>
            <NoiseGrain />
          </TransitionProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
