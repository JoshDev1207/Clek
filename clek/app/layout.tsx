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
          {/* Sidebar + content layout */}
          <div className="flex min-h-screen">
            {/* Sidebar - hidden on mobile */}
            <NavbarWrapper />

            {/* Main content area */}
            <div className="flex flex-col flex-1 min-w-0">
              <main className="flex-1">{children}</main>
              <footer className="bg-[var(--cream)] text-center py-4 text-xs text-[var(--muted)] mt-6">
                Built by Joshua Sarno · 2026 · Terms · Privacy Policy
              </footer>
            </div>
          </div>

          {/* Mobile bottom nav spacer */}
          <div className="sm:hidden h-16" />
        </AuthProvider>
      </body>
    </html>
  )
}