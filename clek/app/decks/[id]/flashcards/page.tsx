'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

interface Card { id: string; front: string; back: string; tags: string[] }

export default function FlashcardsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [cards, setCards] = useState<Card[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<('easy' | 'hard')[]>([])
  const [done, setDone] = useState(false)
  const [deckName, setDeckName] = useState('')

  useEffect(() => {
    async function load() {
      const { data: deck } = await supabase.from('decks').select('name').eq('id', id).single()
      const { data: cards } = await supabase.from('cards').select('*').eq('deck_id', id).order('created_at')
      setDeckName(deck?.name || '')
      setCards(cards || [])
      setLoading(false)
    }
    if (id) load()
  }, [id])

  const handlePrevious = () => {
    if (current > 0) {
      setCurrent(c => c - 1)
      setFlipped(false)
    }
  }

  const handleNext = () => {
    if (current + 1 >= cards.length) {
      setDone(true)
    } else {
      setCurrent(c => c + 1)
      setFlipped(false)
    }
  }

  const restart = () => {
    setCurrent(0)
    setFlipped(false)
    setResults([])
    setDone(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse text-sm" style={{ color: 'var(--muted)' }}>Loading...</div>
    </div>
  )

  const card = cards[current]
  const progress = ((current + (done ? 1 : 0)) / cards.length) * 100
  const easyCount = results.filter(r => r === 'easy').length
  const hardCount = results.filter(r => r === 'hard').length

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href={`/decks/${id}`} className="flex items-center gap-1 text-sm" style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={16} /> {deckName}
        </Link>
        <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
          {done ? cards.length : current + 1} / {cards.length}
        </span>
      </div>

      {/* Progress */}
      <div className="progress-bar mb-8">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {done ? (
        <div className="text-center py-16 animate-in">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--charcoal)' }}>Session complete!</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            {easyCount} easy · {hardCount} hard
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={restart}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium text-sm"
              style={{ borderColor: 'var(--cream-border)', color: 'var(--charcoal)' }}
            >
              <RotateCcw size={15} /> Restart
            </button>
            <Link
              href={`/decks/${id}`}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
              style={{ background: 'var(--charcoal)' }}
            >
              Back to deck
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Card */}
          <div
            className="rounded-2xl border cursor-pointer select-none mb-6 transition-all"
            style={{
              borderColor: 'var(--cream-border)',
              background: 'white',
              minHeight: 280,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2.5rem',
            }}
            onClick={() => setFlipped(f => !f)}
          >
            <div className="text-center">
              <p className="text-xs font-semibold tracking-wider mb-4" style={{ color: 'var(--muted)' }}>
                {flipped ? 'ANSWER' : 'QUESTION'}
              </p>
              <p className="text-xl font-medium leading-relaxed" style={{ color: 'var(--charcoal)' }}>
                {flipped ? card.back : card.front}
              </p>
              {flipped && card.tags?.length > 0 && (
                <div className="flex justify-center gap-2 mt-4">
                  {card.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--cream)', color: 'var(--muted)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation buttons */}
          {flipped && (
            <div className="flex gap-3 animate-in">
              <button
                onClick={handlePrevious}
                disabled={current === 0}
                className="flex-1 py-3 rounded-xl border font-semibold text-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: 'var(--cream-border)', color: 'var(--muted)' }}
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 rounded-xl border font-semibold text-sm transition-colors hover:bg-blue-50"
                style={{ borderColor: '#DBEAFE', color: '#1E40AF' }}
              >
                Next
              </button>
            </div>
          )}

          {!flipped && (
            <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
              Tap the card to reveal the answer
            </p>
          )}
        </>
      )}
    </div>
  )
}