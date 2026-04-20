import type { Metadata } from 'next'
import './globals.css'
import { NavbarWrapper } from '@/components/layout/NavbarWrapper'
import { AuthProvider } from '@/components/layout/AuthProvider'

export const metadata: Metadata = {
  title: 'Clek — Study Smarter',
  description: 'AI-powered flashcard and quiz generator. Create decks from PDFs, notes, or any text.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NavbarWrapper />
          <main>{children}</main>
          <footer className="bg-[var(--cream)] text-center py-4 text-xs text-[var(--muted)] mt-6">
            Built by Joshua Sarno · 2026 · Terms · Privacy Policy
          </footer>
        </AuthProvider>
      </body>
    </html>
  )
}