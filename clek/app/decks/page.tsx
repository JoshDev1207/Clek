'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/layout/AuthProvider'
import { AuthModal } from '@/components/ui/AuthModal'
import { supabase } from '@/lib/supabase'
import { Plus, Layers, HelpCircle, LayoutGrid, Star, BookOpen } from 'lucide-react'

interface Deck {
  id: string
  name: string
  description: string
  tags: string[]
  card_count?: number
  quiz_ready?: number
  built_in?: boolean
  created_at: string
}

// Kwek-style colored dots for category tags
const TAG_DOT_COLORS: Record<string, string> = {
  'Getting Started': '#A0998C',
  'Features': '#E8712A',
  'Quiz Types': '#D95C5C',
}
const DEFAULT_DOT_COLOR = '#A0998C'

// Kwek-style filter tag dots
const FILTER_DOTS: Record<string, string> = {
  'Getting Started': '#A0998C',
  'Features': '#E8712A',
  'Quiz Types': '#D95C5C',
}

export default function DecksPage() {
  const { user, loading, triggerSplash } = useAuth()
  const router = useRouter()
  const [decks, setDecks] = useState<Deck[]>([])
  const [loadingDecks, setLoadingDecks] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('Latest to oldest')
  const [typeFilter, setTypeFilter] = useState('Any type')

  useEffect(() => {
    if (!loading) fetchDecks()
  }, [user, loading])

  async function fetchDecks() {
    setLoadingDecks(true)

    // Show empty state when not signed in
    if (!user) {
      setDecks([])
      setLoadingDecks(false)
      return
    }

    try {
      const { data: decksData, error } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      const userDecks = decksData || []
      const withCounts = await Promise.all(userDecks.map(async (deck) => {
        const { count } = await supabase
          .from('cards')
          .select('*', { count: 'exact', head: true })
          .eq('deck_id', deck.id)
        return { ...deck, card_count: count || 0 }
      }))

      setDecks(withCounts)
    } catch (err) {
      console.error('fetchDecks error:', err)
      setDecks([])
    } finally {
      setLoadingDecks(false)
    }
  }

  const filterTags = ['Getting Started', 'Features', 'Quiz Types']

  // Reusable "Create your own deck" CTA box
  const CreateDeckCTA = () => (
    <div
      className="w-full py-12 px-6 text-center rounded-2xl"
      style={{
        background: 'transparent',
        border: '1.5px dashed var(--cream-border)',
        borderRadius: '1.5rem',
      }}
    >
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
        Create your own deck to study any topic.
      </p>
      <Link
        href="/decks/new"
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full font-semibold text-sm text-white"
        style={{ background: 'var(--charcoal)' }}
      >
        <Plus size={16} />
        New Deck
      </Link>
    </div>
  )

  return (
    <div className="mx-auto px-4 pt-12 pb-8" style={{ maxWidth: '980px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <LayoutGrid size={22} style={{ color: 'var(--orange)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>Decks</h1>
          <button className="p-1 rounded-full" style={{ color: 'var(--muted)' }}>
            <HelpCircle size={16} />
          </button>
        </div>

        {/* New button */}
        <div className="relative">
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--charcoal)' }}
          >
            <Plus size={16} />
            New
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-0.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {showNewMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNewMenu(false)} />
              <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-[var(--cream-border)] overflow-hidden w-40 z-50">
                <Link
                  href="/decks/new"
                  onClick={() => setShowNewMenu(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--cream)] transition-colors"
                  style={{ color: 'var(--charcoal)' }}
                >
                  <Layers size={14} />
                  Deck
                </Link>
                <div className="flex items-center gap-2 px-4 py-2.5 text-sm opacity-40 cursor-not-allowed" style={{ color: 'var(--charcoal)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  Folder
                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: 'var(--cream-dark)', color: 'var(--muted)', fontSize: '10px' }}>SOON</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Divider */}
      <hr className="mb-6" style={{ borderColor: 'var(--cream-border)' }} />

      {/* Search + filters */}
      <div className="mb-5 space-y-3">
        <input
          type="text"
          placeholder="Search decks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: 'var(--cream-border)', background: 'white', color: 'var(--charcoal)' }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border outline-none"
            style={{ borderColor: 'var(--cream-border)', background: 'white', color: 'var(--charcoal)' }}
          >
            <option>Latest to oldest</option>
            <option>Oldest to latest</option>
            <option>A-Z</option>
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border outline-none"
            style={{ borderColor: 'var(--cream-border)', background: 'white', color: 'var(--charcoal)' }}
          >
            <option>Any type</option>
            <option>Flashcard</option>
            <option>Quiz</option>
          </select>
        </div>

        {/* Kwek-style filter tags with colored dots */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter('All')}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              background: activeFilter === 'All' ? 'var(--orange)' : 'transparent',
              color: activeFilter === 'All' ? 'white' : 'var(--muted)',
              border: activeFilter === 'All' ? '1.5px solid var(--orange)' : '1.5px solid var(--cream-border)',
            }}
          >
            All
          </button>
          {filterTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveFilter(activeFilter === tag ? 'All' : tag)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                background: activeFilter === tag ? 'var(--orange)' : 'transparent',
                color: activeFilter === tag ? 'white' : 'var(--muted)',
                border: activeFilter === tag ? '1.5px solid var(--orange)' : '1.5px solid var(--cream-border)',
              }}
            >
              {/* Colored dot - kwek style */}
              <span
                className="inline-block rounded-full flex-shrink-0"
                style={{
                  width: 6,
                  height: 6,
                  background: FILTER_DOTS[tag] || DEFAULT_DOT_COLOR,
                }}
              />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loadingDecks ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl p-5 animate-pulse deck-card" style={{ background: 'var(--cream-dark)', height: 150 }} />
          ))}
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold mb-3 tracking-wider" style={{ color: 'var(--muted)' }}>
            ALL DECKS ({decks.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <div
                key={deck.id}
                className="deck-card group block rounded-2xl p-6 border relative flex flex-col cursor-pointer"
                style={{ background: 'white', borderColor: '#E8E4DC', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', minHeight: '220px' }}
                onClick={() => {
                  if (deck.built_in) return
                  triggerSplash({ message: `Opening ${deck.name}...`, duration: 1400 })
                  setTimeout(() => router.push(`/decks/${deck.id}`), 1500)
                }}
              >
                {/* Top row: title + action icons */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-xl leading-tight pr-2" style={{ color: 'var(--charcoal)', fontWeight: 700 }}>{deck.name}</h3>
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1" style={{ color: 'var(--muted)' }} onClick={e => e.stopPropagation()}>
                      <Star size={15} />
                    </button>
                    <button className="p-1" style={{ color: 'var(--muted)' }} onClick={e => e.stopPropagation()}>
                      <BookOpen size={15} />
                    </button>
                  </div>
                </div>

                {/* BUILT-IN badge - kwek style */}
                {deck.built_in && (
                  <span
                    className="inline-block text-xs font-semibold px-2 py-0.5 rounded mb-2"
                    style={{ background: '#EBF5FF', color: '#3B82F6', letterSpacing: '0.04em' }}
                  >
                    BUILT-IN
                  </span>
                )}

                {deck.description && (
                  <p className="text-sm mb-3 line-clamp-2 leading-relaxed" style={{ color: 'var(--muted)' }}>{deck.description}</p>
                )}

                {/* Card count + quiz-ready */}
                <div className="flex items-center gap-3 text-sm mb-auto" style={{ color: 'var(--muted)' }}>
                  <span>{deck.card_count} cards</span>
                  {deck.quiz_ready != null && (
                    <span>{deck.quiz_ready} quiz-ready</span>
                  )}
                </div>

                {/* Kwek-style colored dot tags - moved to bottom */}
                {deck.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--cream-border)' }}>
                    {deck.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--muted)' }}>
                        <span
                          className="inline-block rounded-full flex-shrink-0"
                          style={{
                            width: 7,
                            height: 7,
                            background: TAG_DOT_COLORS[tag] || DEFAULT_DOT_COLOR,
                          }}
                        />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom CTA after decks list */}
          <div className="mt-8">
            <CreateDeckCTA />
          </div>
        </>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}