'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { AuthModal } from '../ui/AuthModal'
import { useState } from 'react'
import { LayoutGrid, BookOpen, BarChart2, Users, LogOut, Search, X } from 'lucide-react'

export function Navbar() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [showAuth, setShowAuth] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const navLinks = [
    { href: '/decks', label: 'Decks', icon: LayoutGrid },
    { href: '/study', label: 'Study', icon: BookOpen },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
    { href: '/kommunity', label: 'Kommunity', icon: Users },
  ]

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className="hidden sm:flex flex-col sticky top-0 h-screen w-[220px] shrink-0 px-3 py-4"
        style={{ background: 'var(--cream)', borderRight: '1px solid var(--cream-border)' }}
      >
        {/* Top: logo + user avatar */}
        <div className="flex items-center justify-between mb-6 px-2">
          <Link href="/" className="splash-logo" style={{ fontSize: '1.5rem' }}>
            Clek
          </Link>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'var(--orange)' }}
              >
                {user.email?.[0]?.toUpperCase()}
              </button>
              {showUserMenu && (
                <div className="absolute left-0 top-10 bg-white rounded-xl shadow-lg border border-[var(--cream-border)] overflow-hidden w-48 z-50">
                  <div className="px-4 py-3 border-b border-[var(--cream-border)]">
                    <div className="text-xs text-[var(--muted)] truncate">{user.email}</div>
                  </div>
                  <button
                    onClick={() => { signOut(); setShowUserMenu(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--cream)] transition-colors"
                    style={{ color: 'var(--charcoal)' }}
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="text-xs px-2.5 py-1.5 rounded-lg border font-medium hover:bg-[var(--cream-dark)] transition-colors"
              style={{ borderColor: 'var(--cream-border)', color: 'var(--charcoal)' }}
            >
              Sign in
            </button>
          )}
        </div>

        {/* Search bar */}
        <div className="mb-4 px-1">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer"
            style={{ background: 'var(--cream-dark)', color: 'var(--muted)' }}
          >
            <Search size={14} />
            <span>Search...</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors"
                style={{
                  background: active ? 'var(--cream-dark)' : 'transparent',
                  color: active ? 'var(--charcoal)' : 'var(--muted)',
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon size={16} style={{ opacity: active ? 1 : 0.5 }} />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* ── MOBILE TOP BAR ── */}
      <header
        className="sm:hidden sticky top-0 z-50 flex items-center justify-between px-4 h-14"
        style={{ background: 'var(--cream)', borderBottom: '1px solid var(--cream-border)' }}
      >
        <Link href="/" className="splash-logo" style={{ fontSize: '1.4rem' }}>
          Clek
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-lg hover:bg-[var(--cream-dark)] transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            {showSearch ? <X size={17} /> : <Search size={17} />}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'var(--orange)' }}
              >
                {user.email?.[0]?.toUpperCase()}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-[var(--cream-border)] overflow-hidden w-48 z-50">
                  <div className="px-4 py-3 border-b border-[var(--cream-border)]">
                    <div className="text-xs text-[var(--muted)] truncate">{user.email}</div>
                  </div>
                  <button
                    onClick={() => { signOut(); setShowUserMenu(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--cream)] transition-colors"
                    style={{ color: 'var(--charcoal)' }}
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="text-xs px-3 py-1.5 rounded-lg border font-medium"
              style={{ borderColor: 'var(--cream-border)', color: 'var(--charcoal)' }}
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
        style={{ background: 'var(--cream)', borderTop: '1px solid var(--cream-border)' }}
      >
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
              style={{ color: active ? 'var(--orange)' : 'var(--muted)' }}
            >
              <Icon size={20} style={{ color: active ? 'var(--orange)' : 'var(--muted)', opacity: active ? 1 : 0.5 }} />
              {label}
            </Link>
          )
        })}
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}