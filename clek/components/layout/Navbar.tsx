'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { AuthModal } from '../ui/AuthModal'
import { useState, useEffect, useRef } from 'react'
import { LayoutGrid, BookOpen, BarChart2, Users, Search, LogOut, ArrowLeftRight, Menu, X } from 'lucide-react'

export function Navbar() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [showAuth, setShowAuth] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
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
        opacity: 1,
      })
    }
  }, [pathname])

  // Close sidebar on route change
  useEffect(() => {
    setShowSidebar(false)
  }, [pathname])

  const UserAvatar = ({ menuAlign = 'right' }: { menuAlign?: 'right' | 'left' }) =>
    user ? (
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ background: 'var(--orange)' }}
        >
          {user.email?.[0]?.toUpperCase()}
        </button>
        {showUserMenu && (
          <div className={`absolute ${menuAlign === 'right' ? 'right-0' : 'left-0'} top-10 bg-white rounded-xl shadow-lg border border-[var(--cream-border)] overflow-hidden w-48 z-50`}>
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
    )

  return (
    <>
      {/* ══════════════════════════════════════
          DESKTOP TOP NAVBAR (lg and above)
      ══════════════════════════════════════ */}
      <nav
        style={{ background: 'var(--cream)', borderBottom: '1px solid var(--cream-border)' }}
        className="hidden lg:block sticky top-0 z-50"
      >
        <div className="mx-auto px-4 h-16 flex items-center justify-between" style={{ maxWidth: '980px' }}>
          <Link href="/" className="splash-logo" style={{ fontSize: '1.75rem' }}>
            Clek
          </Link>

          <div className="flex items-center gap-1 relative">
            <div
              className="absolute top-0 h-full rounded-lg transition-all duration-300 ease-out"
              style={{ background: 'var(--orange)', ...indicatorStyle }}
            />
            {navLinks.map(({ href, label, icon: Icon }, index) => {
              const active = pathname?.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  ref={el => { navRefs.current[index] = el }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative z-10"
                  style={{ color: active ? 'white' : 'var(--muted)', background: 'transparent' }}
                >
                  <Icon size={15} style={{ color: active ? 'white' : 'var(--muted)', opacity: active ? 1 : 0.5 }} />
                  {label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-[var(--cream-dark)] transition-colors" style={{ color: 'var(--muted)' }}>
              <Search size={17} />
            </button>
            <button className="p-2 rounded-lg hover:bg-[var(--cream-dark)] transition-colors" style={{ color: 'var(--muted)' }}>
              <ArrowLeftRight size={17} />
            </button>
            <UserAvatar menuAlign="right" />
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          MEDIUM SCREEN TOP BAR (sm to lg)
          Hamburger left | centered logo | avatar right
      ══════════════════════════════════════ */}
      <nav
        style={{ background: 'var(--cream)', borderBottom: '1px solid var(--cream-border)' }}
        className="hidden sm:flex lg:hidden sticky top-0 z-50 items-center justify-between px-4 h-16"
      >
        <button
          onClick={() => setShowSidebar(true)}
          className="p-2 rounded-lg hover:bg-[var(--cream-dark)] transition-colors"
          style={{ color: 'var(--muted)' }}
        >
          <Menu size={20} />
        </button>

        <Link href="/" className="splash-logo absolute left-1/2 -translate-x-1/2" style={{ fontSize: '1.6rem' }}>
          Clek
        </Link>

        <div className="flex items-center gap-2">
          <UserAvatar menuAlign="right" />
        </div>
      </nav>

      {/* ══════════════════════════════════════
          COLLAPSIBLE SIDEBAR (sm to lg)
          Matches kwek: overlay + slide-in panel
      ══════════════════════════════════════ */}
      {/* Backdrop */}
      {showSidebar && (
        <div
          className="hidden sm:block lg:hidden fixed inset-0 z-40 bg-black/20"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`hidden sm:flex lg:hidden flex-col fixed top-0 left-0 h-full w-[220px] z-50 px-3 py-4 transition-transform duration-300 ease-out ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--cream)', borderRight: '1px solid var(--cream-border)' }}
      >
        {/* Top row: logo + close button + avatar */}
        <div className="flex items-center justify-between mb-5 px-2">
          <Link href="/" className="splash-logo" style={{ fontSize: '1.4rem' }}>
            Clek
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar(false)}
              className="p-1.5 rounded-lg hover:bg-[var(--cream-dark)] transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              <X size={18} />
            </button>
            <UserAvatar menuAlign="left" />
          </div>
        </div>

        {/* Search */}
        <div className="mb-3 px-1">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
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

      {/* ══════════════════════════════════════
          MOBILE TOP BAR (below sm)
      ══════════════════════════════════════ */}
      <header
        className="sm:hidden sticky top-0 z-50 flex items-center justify-between px-4 h-14"
        style={{ background: 'var(--cream)', borderBottom: '1px solid var(--cream-border)' }}
      >
        <Link href="/" className="splash-logo" style={{ fontSize: '1.4rem' }}>
          Clek
        </Link>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-[var(--cream-dark)] transition-colors" style={{ color: 'var(--muted)' }}>
            <Search size={17} />
          </button>
          <UserAvatar menuAlign="right" />
        </div>
      </header>

      {/* ══════════════════════════════════════
          MOBILE BOTTOM TAB BAR (below sm)
      ══════════════════════════════════════ */}
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

      {/* Spacer so content isn't hidden behind mobile bottom nav */}
      <div className="sm:hidden h-16" />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}