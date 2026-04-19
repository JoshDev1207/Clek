'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthModal } from '@/components/ui/AuthModal'
import { useAuth } from '@/components/layout/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Brain, ChevronLeft, Pencil, BarChart2, Trash2, Search, MoreHorizontal, Send, X, Info } from 'lucide-react'

interface Deck {
  id: string
  name: string
  description: string
  tags: string[]
  user_id: string
  built_in?: boolean
}

interface Card {
  id: string
  front: string
  back: string
  tags: string[]
}

// Kwek-style tag badge colors — smaller, rounder pills with varied colors
const TAG_BADGE_STYLES: Record<string, { background: string; color: string }> = {
  'Getting Started': { background: '#F0EDEA', color: '#8A8478' },
  'Features':        { background: '#FEF0E6', color: '#C85A1A' },
  'Quiz Types':      { background: '#FEF0E6', color: '#C85A1A' },
  'SECULARIZATION':  { background: '#FEF0E6', color: '#C85A1A' },
  'COLONIAL GOVERNMENT': { background: '#EBF5FF', color: '#3B82F6' },
  'SPANISH ERA':     { background: '#F0FDF4', color: '#16A34A' },
  'REVOLUTION':      { background: '#FEF2F2', color: '#DC2626' },
  'AMERICAN PERIOD': { background: '#FAF5FF', color: '#9333EA' },
}
const DEFAULT_BADGE = { background: '#F0EDEA', color: '#8A8478' }

// Dot colors for tag count row (matches kwek: gray, orange, red)
const DOT_COLORS = ['#A0998C', '#E8712A', '#D95C5C']

function getTutorUsageKey(deckId: string) {
  return `aiTutorUsage:${deckId}`
}
function loadTutorUsage(deckId: string) {
  if (typeof window === 'undefined') return { count: 0, date: new Date().toISOString().slice(0, 10) }
  try {
    const raw = localStorage.getItem(getTutorUsageKey(deckId))
    if (!raw) return { count: 0, date: new Date().toISOString().slice(0, 10) }
    const parsed = JSON.parse(raw)
    const today = new Date().toISOString().slice(0, 10)
    if (parsed.date !== today) return { count: 0, date: today }
    return { count: parsed.count || 0, date: today }
  } catch {
    return { count: 0, date: new Date().toISOString().slice(0, 10) }
  }
}
function saveTutorUsage(deckId: string, count: number, date: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(getTutorUsageKey(deckId), JSON.stringify({ count, date }))
}

// Kwek-style sparkle / AI star icon (matches the 3-pointed star in kwek)
function SparkleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 2 L13.5 9 L20 10 L13.5 11 L12 18 L10.5 11 L4 10 L10.5 9 Z" />
      <path d="M19 2 L19.8 5 L23 5.5 L19.8 6 L19 9 L18.2 6 L15 5.5 L18.2 5 Z" />
      <path d="M5 16 L5.5 18 L8 18.5 L5.5 19 L5 21 L4.5 19 L2 18.5 L4.5 18 Z" />
    </svg>
  )
}

// Kwek-style layers icon for flashcard mode
function LayersIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <polygon points="12 2 22 8.5 12 15 2 8.5"/>
      <polyline points="2 14.5 12 21 22 14.5"/>
      <polyline points="2 11.5 12 18 22 11.5"/>
    </svg>
  )
}

export default function DeckPage() {
  const { id } = useParams()
  const { user, triggerSplash } = useAuth()
  const router = useRouter()

  const handleBack = () => {
    triggerSplash({ message: 'Back to your decks...', duration: 1200 })
    setTimeout(() => router.push('/decks'), 1300)
  }
  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [remainingTutorMessages, setRemainingTutorMessages] = useState(5)
  const [tutorModalOpen, setTutorModalOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [tutorQuestion, setTutorQuestion] = useState('')
  const [tutorMessages, setTutorMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([])
  const [tutorSending, setTutorSending] = useState(false)
  const [tutorError, setTutorError] = useState('')

  useEffect(() => {
    if (!id) return
    fetchDeck()
    const usage = loadTutorUsage(id as string)
    setRemainingTutorMessages(Math.max(0, 5 - usage.count))
  }, [id])

  const handleTutorOpen = () => {
    if (!user) { setShowAuth(true) } else { setTutorModalOpen(true); setTutorError('') }
  }

  const handleTutorSend = async (text?: string) => {
    if (!id || tutorSending) return
    const prompt = (text ?? tutorQuestion).trim()
    if (!prompt) return
    if (!user) { setTutorError('Sign in to use the AI Tutor.'); return }
    if (remainingTutorMessages <= 0) { setTutorError('You have reached your daily AI Tutor limit.'); return }
    setTutorSending(true)
    setTutorError('')
    setTutorMessages(c => [...c, { role: 'user', text: prompt }])
    setTutorQuestion('')
    try {
      const response = await fetch(`/api/decks/${id}/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error || 'Tutor request failed')
      }
      const data = await response.json()
      setTutorMessages(c => [...c, { role: 'assistant', text: data.answer || 'Sorry, I could not generate an answer.' }])
      const usage = loadTutorUsage(id as string)
      const nextCount = usage.count + 1
      saveTutorUsage(id as string, nextCount, usage.date)
      setRemainingTutorMessages(Math.max(0, 5 - nextCount))
    } catch (err: any) {
      setTutorError(err?.message || 'Unable to reach AI Tutor.')
    } finally {
      setTutorSending(false)
    }
  }

  async function fetchDeck() {
    setLoading(true)
    const { data: deckData } = await supabase.from('decks').select('*').eq('id', id).single()
    const { data: cardsData } = await supabase.from('cards').select('*').eq('deck_id', id).order('created_at')
    setDeck(deckData)
    setCards(cardsData || [])
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this deck and all its cards?')) return
    setDeleting(true)
    await supabase.from('decks').delete().eq('id', id)
    handleBack()
  }

  const filteredCards = cards.filter(c =>
    c.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.back.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Count cards per tag (for dot row in header)
  const tagCounts = cards.reduce<Record<string, number>>((acc, card) => {
    card.tags?.forEach(t => { acc[t] = (acc[t] || 0) + 1 })
    return acc
  }, {})
  const uniqueTags = Object.keys(tagCounts)

  // Deck-level tags (from deck.tags) for the badge row
  const deckTags = deck?.tags || []

  if (loading) {
    return (
      <div className="mx-auto px-4 py-8" style={{ maxWidth: '980px' }}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 rounded-xl w-48" style={{ background: 'var(--cream-dark)' }} />
          <div className="h-32 rounded-2xl" style={{ background: 'var(--cream-dark)' }} />
        </div>
      </div>
    )
  }

  if (!deck) return (
    <div className="mx-auto px-4 py-20 text-center" style={{ maxWidth: '980px' }}>
      <p style={{ color: 'var(--muted)' }}>Deck not found.</p>
      <button onClick={handleBack} className="text-sm font-medium mt-4 inline-block" style={{ color: 'var(--orange)' }}>← Your decks</button>
    </div>
  )

  return (
    <div className="mx-auto px-4 py-8" style={{ maxWidth: '980px' }}>

      {/* Top bar: back link + info + menu */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={handleBack} className="inline-flex items-center gap-1 text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={15} />
          Your Decks
        </button>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-full hover:bg-[var(--cream-dark)] transition-colors" style={{ color: 'var(--muted)' }}>
            <Info size={16} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full hover:bg-[var(--cream-dark)] transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-9 bg-white rounded-xl shadow-lg border border-[var(--cream-border)] overflow-hidden w-40 z-50">
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--cream)]" style={{ color: 'var(--charcoal)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Duplicate
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--cream)]" style={{ color: 'var(--charcoal)' }}>
                    <BarChart2 size={14} /> Review
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--cream)]" style={{ color: 'var(--charcoal)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Export
                  </button>
                  {user?.id === deck.user_id && (
                    <button onClick={handleDelete} disabled={deleting} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 text-red-500">
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Deck header */}
      <div className="mb-5">
        {/* BUILT-IN badge */}
        {deck.built_in && (
          <span
            className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded mb-3 tracking-wide"
            style={{ background: '#EBF5FF', color: '#3B82F6', letterSpacing: '0.06em' }}
          >
            BUILT-IN
          </span>
        )}

        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--charcoal)', letterSpacing: '-0.03em' }}>
          {deck.name}
        </h1>
        {deck.description && (
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>{deck.description}</p>
        )}

        {/* Card count + colored dot counts — kwek exact style */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm" style={{ color: 'var(--muted)' }}>{cards.length} cards</span>
          {uniqueTags.slice(0, 3).map((tag, i) => (
            <span key={tag} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--muted)' }}>
              <span
                className="inline-block rounded-full"
                style={{ width: 10, height: 10, background: DOT_COLORS[i % DOT_COLORS.length] }}
              />
              {tagCounts[tag]}
            </span>
          ))}
        </div>

        {/* Tag badges row — smaller, rounder pills with varied colors */}
        {deckTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {deckTags.map((tag) => {
              const style = TAG_BADGE_STYLES[tag] || DEFAULT_BADGE
              return (
                <span
                  key={tag}
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: style.background, color: style.color }}
                >
                  {tag}
                </span>
              )
            })}
          </div>
        )}

        <hr className="mt-4" style={{ borderColor: 'var(--cream-border)' }} />

              </div>

      {/* Study modes — Flashcard + Quiz */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {/* AI Tutor card — full width */}
        <button
          onClick={handleTutorOpen}
          className="deck-card rounded-2xl border p-6 block text-left hover:opacity-90 transition-opacity col-span-2"
          style={{ borderColor: 'var(--cream-border)', background: 'white' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div style={{ color: 'var(--charcoal)' }}>
              <SparkleIcon size={22} />
            </div>

            {/* Clek² badge — kwek style */}
            <span
              className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ background: '#FEF0E6', color: 'var(--orange)', border: '1px solid #F5A876' }}
            >
              Clek²
            </span>
          </div>
          
          <p className="font-bold text-base mb-1" style={{ color: 'var(--charcoal)' }}>AI Tutor</p>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
            Chat with Clek about this deck. Ask for explanations, hints, memory tricks, and more.
          </p>
          
          <p className="text-xs font-semibold tracking-widest uppercase flex items-center gap-1" style={{ color: 'var(--muted)' }}>
            {user ? `${remainingTutorMessages} MESSAGES LEFT TODAY →` : 'SIGN IN TO USE →'}
          </p>
        </button>
        {/* Flashcard Mode */}
        <Link
          href={`/decks/${id}/flashcards`}
          className="deck-card rounded-2xl border p-5 block"
          style={{ borderColor: 'var(--cream-border)', background: 'white' }}
        >
          <div className="mb-3" style={{ color: 'var(--charcoal)' }}>
            <LayersIcon size={22} />
          </div>
          <p className="font-bold text-base mb-1" style={{ color: 'var(--charcoal)' }}>Flashcard Mode</p>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
            Flip through cards at your own pace. Rate each card as Easy or Hard.
          </p>
          <p className="text-xs font-semibold tracking-widest uppercase flex items-center gap-1" style={{ color: 'var(--muted)' }}>
            {cards.length} CARDS →
          </p>
        </Link>

        {/* Quiz Mode */}
        <Link
          href={`/decks/${id}/quiz`}
          className="deck-card rounded-2xl border p-5 block"
          style={{ borderColor: 'var(--cream-border)', background: 'white' }}
        >
          <div className="mb-3" style={{ color: 'var(--charcoal)' }}>
            <Pencil size={22} />
          </div>
          <p className="font-bold text-base mb-1" style={{ color: 'var(--charcoal)' }}>Quiz Mode</p>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
            Multiple-choice, true/false, and identification questions with instant feedback.
          </p>
          <p className="text-xs font-semibold tracking-widest uppercase flex items-center gap-1" style={{ color: 'var(--muted)' }}>
            {cards.length} QUESTIONS →
          </p>
        </Link>
      </div>

      {/* Cards list */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-sm tracking-widest uppercase" style={{ color: 'var(--muted)' }}>CARDS</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: 'var(--cream-border)', background: 'white', color: 'var(--charcoal)', width: 200 }}
          />
        </div>
      </div>

      {/* Card rows — kwek exact style: front bold, back muted below, tag badge top-right */}
      <div className="space-y-1.5">
        {filteredCards.map((card) => {
          const tag = card.tags?.[0]
          const badgeStyle = tag ? (TAG_BADGE_STYLES[tag] || DEFAULT_BADGE) : null
          return (
            <div
              key={card.id}
              className="rounded-xl border px-5 py-4 flex items-start justify-between gap-4"
              style={{ borderColor: 'var(--cream-border)', background: 'white' }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: 'var(--charcoal)' }}>{card.front}</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{card.back}</p>
              </div>
              {tag && badgeStyle && (
                <span
                  className="text-[8px] font-semibold px-3 py-1.5 rounded-full tracking-widest uppercase flex-shrink-0"
                  style={{ background: badgeStyle.background, color: badgeStyle.color }}
                >
                  {tag.replace(' ', '\u00A0')}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {filteredCards.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--muted)' }}>
          {searchQuery ? 'No cards match your search.' : 'No cards in this deck yet.'}
        </div>
      )}

      {/* AI Tutor Modal */}
      {tutorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(26,24,20,0.45)' }}>
          <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--cream-border)] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-6 py-5 border-b" style={{ borderColor: 'var(--cream-border)' }}>
              <div className="flex items-center gap-3">
                <div className="rounded-xl p-2" style={{ background: 'var(--cream-dark)', color: 'var(--charcoal)' }}>
                  <Brain size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--muted)' }}>Clek AI Tutor</p>
                  <h2 className="font-bold text-base" style={{ color: 'var(--charcoal)' }}>{deck?.name}</h2>
                </div>
              </div>
              <button
                onClick={() => setTutorModalOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--cream-dark)] transition-colors"
                style={{ color: 'var(--muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="flex flex-col gap-4">
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {remainingTutorMessages} messages left today · Ask Clek anything about this deck.
                </p>

                {tutorError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {tutorError}
                  </div>
                )}

                <div
                  className="min-h-[200px] rounded-2xl border p-4 overflow-y-auto"
                  style={{ maxHeight: '300px', borderColor: 'var(--cream-border)', background: 'var(--cream)' }}
                >
                  {tutorMessages.length === 0 ? (
                    <div className="text-center text-sm" style={{ color: 'var(--muted)' }}>
                      <p className="mb-3">Ask Clek a question about this deck.</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {['Explain the hardest concepts', 'Quiz me', 'Give me memory tricks', "What's most important?"].map(s => (
                          <button
                            key={s}
                            onClick={() => { setTutorQuestion(s); handleTutorSend(s) }}
                            className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-white transition-colors"
                            style={{ borderColor: 'var(--cream-border)', color: 'var(--charcoal)' }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tutorMessages.map((msg, i) => (
                        <div
                          key={i}
                          className="rounded-2xl p-4 max-w-[90%]"
                          style={{
                            marginLeft: msg.role === 'user' ? 'auto' : 0,
                            background: msg.role === 'user' ? 'var(--orange)' : 'white',
                            color: msg.role === 'user' ? 'white' : 'var(--charcoal)',
                          }}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={user ? 'Ask Clek anything...' : 'Sign in to ask the AI Tutor'}
                    value={tutorQuestion}
                    onChange={e => setTutorQuestion(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTutorSend() } }}
                    disabled={!user || remainingTutorMessages <= 0 || tutorSending}
                    className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
                    style={{ borderColor: 'var(--cream-border)', color: 'var(--charcoal)', background: 'white' }}
                  />
                  <button
                    onClick={() => handleTutorSend()}
                    disabled={!user || remainingTutorMessages <= 0 || tutorSending || !tutorQuestion.trim()}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                    style={{ background: user && remainingTutorMessages > 0 ? 'var(--charcoal)' : 'var(--muted)' }}
                  >
                    {tutorSending ? '…' : <Send size={15} />}
                  </button>
                </div>

                {!user && (
                  <button
                    onClick={() => { setShowAuth(true); setTutorModalOpen(false) }}
                    className="w-full rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-[var(--cream)] transition-colors"
                    style={{ borderColor: 'var(--cream-border)', color: 'var(--orange)' }}
                  >
                    Sign in to use Clek Tutor
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}