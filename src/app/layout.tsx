import type { Metadata } from 'next'
import './globals.css'
import { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

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
    <html lang="en">
      <body className="body-glow">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
