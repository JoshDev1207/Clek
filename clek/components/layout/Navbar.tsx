'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { AuthModal } from '../ui/AuthModal'
import { useState, useEffect, useRef } from 'react'
import { LayoutGrid, BookOpen, BarChart2, Users, Search, LogOut, ArrowLeftRight } from 'lucide-react'

export function Navbar() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [showAuth, setShowAuth] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [indicatorStyle, setIndicatorStyle] = useState({})
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([])

  const navLinks = [
    { href: '/decks', label: 'Decks', icon: LayoutGrid },
    { href: '/study', label: 'Study', icon: BookOpen },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
    { href: '/kommunity', label: 'Kommunity', icon: Users },
  ]

  useEffect(() => {
    const activeIndex = navLinks.findIndex(({ href }) => pathname?.startsWith(href))
    if (activeIndex !== -1 && navRefs.current[activeIndex]) {
      const element = navRefs.current[activeIndex]
      setIndicatorStyle({
        left: element.offsetLeft,
        width: element.offsetWidth,
        opacity: 1
      })
    }
  }, [pathname])

  return (
    <>
      <nav style={{ background: 'var(--cream)', borderBottom: '1px solid var(--cream-border)' }}
        className="sticky top-0 z-50">
        <div className="mx-auto px-4 h-16 flex items-center justify-between" style={{ maxWidth: '980px' }}>
          {/* Logo */}
          <Link href="/" className="splash-logo" style={{ fontSize: '1.75rem' }}>
            Clek
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1 relative">
            {/* Sliding indicator */}
            <div
              className="absolute top-0 h-full rounded-lg transition-all duration-300 ease-out"
              style={{
                background: 'var(--orange)',
                ...indicatorStyle
              }}
            />
            {navLinks.map(({ href, label, icon: Icon }, index) => {
              const active = pathname?.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  ref={el => { navRefs.current[index] = el }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative z-10"
                  style={{
                    color: active ? 'white' : 'var(--muted)',
                    background: 'transparent',
                  }}
                >
                  <Icon size={15} style={{ color: active ? 'white' : 'var(--muted)', opacity: active ? 1 : 0.5 }} />
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-[var(--cream-dark)] transition-colors" style={{ color: 'var(--muted)' }}>
              <Search size={17} />
            </button>

            {/* Shuffle / compare button - kwek style */}
            <button className="p-2 rounded-lg hover:bg-[var(--cream-dark)] transition-colors" style={{ color: 'var(--muted)' }}>
              <ArrowLeftRight size={17} />
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors hover:bg-[var(--cream-dark)]"
                style={{ borderColor: 'var(--cream-border)', color: 'var(--charcoal)' }}
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}