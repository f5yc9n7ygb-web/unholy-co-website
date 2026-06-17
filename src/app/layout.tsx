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
import { PostHogProvider } from '@/components/providers/PostHogProvider'
import { MetaPixelProvider } from '@/components/providers/MetaPixelProvider'
import {
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_SEO_KEYWORDS,
  DEFAULT_SEO_TITLE,
  OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  brandSchema,
  organizationSchema,
  websiteSchema,
} from '@/lib/site/seo'

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
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: DEFAULT_SEO_TITLE,
    template: '%s | UNHOLY CO.',
  },
  description: DEFAULT_SEO_DESCRIPTION,
  keywords: DEFAULT_SEO_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'beverages',
  classification: 'Premium canned mineral water',
  referrer: 'strict-origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: OG_IMAGE.path,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        alt: OG_IMAGE.alt,
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    images: [OG_IMAGE.path],
    creator: '@unholyco',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable}`} suppressHydrationWarning>
      <head>
        <script
          key="organization-schema"
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          key="brand-schema"
          id="brand-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(brandSchema) }}
        />
        <script
          key="website-schema"
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={`${inter.className} body-glow`} suppressHydrationWarning>
        <PostHogProvider key="analytics-providers">
          <MetaPixelProvider>
            <TransitionProvider>
              <Preloader />
              <HeartbeatGlow />
              <ScrollProgress />
              <SiteChrome>{children}</SiteChrome>
              <NoiseGrain />
            </TransitionProvider>
          </MetaPixelProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
