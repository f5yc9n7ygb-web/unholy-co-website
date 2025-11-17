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

/**
 * The root layout for the entire application.
 * This component wraps all pages and includes the header, main content, and footer.
 *
 * @param {object} props - The props for the component.
 * @param {ReactNode} props.children - The child components to be rendered within the main content area.
 * @returns {JSX.Element} The rendered HTML structure for the application.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="body-glow">
        <Header />
        <main className="pt-20 md:pt-24 isolate">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
