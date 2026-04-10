import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import './globals.css'

const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Waterboxd',
  description: 'Track. Rate. Hydrate.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${mono.variable} font-mono`}>
        <SessionProvider>
          <Navbar />
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  )
}
