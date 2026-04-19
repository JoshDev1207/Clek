'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Pencil, BarChart2 } from 'lucide-react'

const MODES = [
  { key: 'flashcards', label: 'Flashcards', icon: BookOpen },
  { key: 'quiz', label: 'Quiz', icon: Pencil },
  { key: 'review', label: 'Review', icon: BarChart2 },
]

const TAGS = ['Features', 'Getting Started', 'Quiz Types']

export default function StudyPage() {
  const [mode, setMode] = useState('flashcards')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="mx-auto px-4 py-8" style={{ maxWidth: '980px' }}>
      <div className="flex items-center gap-2 mb-6">
        <BookOpen size={22} style={{ color: 'var(--orange)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>Study</h1>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: 'var(--cream-dark)' }}>
        {MODES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: mode === key ? 'white' : 'transparent',
              color: mode === key ? 'var(--charcoal)' : 'var(--muted)',
              boxShadow: mode === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tag filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedTags([])}
          className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
          style={{
            background: selectedTags.length === 0 ? 'var(--orange)' : 'transparent',
            color: selectedTags.length === 0 ? 'white' : 'var(--muted)',
            border: selectedTags.length === 0 ? '1.5px solid var(--orange)' : '1.5px solid var(--cream-border)',
          }}
        >
          All
        </button>
        {TAGS.map((tag, i) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              background: selectedTags.includes(tag) ? 'var(--charcoal)' : 'transparent',
              color: selectedTags.includes(tag) ? 'white' : 'var(--muted)',
              border: selectedTags.includes(tag) ? '1.5px solid var(--charcoal)' : '1.5px solid var(--cream-border)',
            }}
          >
            ● {tag}
          </button>
        ))}
      </div>

      {selectedTags.length === 0 ? (
        <div className="py-8 px-5 rounded-2xl text-sm text-center" style={{ background: 'var(--cream-dark)', color: 'var(--muted)' }}>
          Select at least one category to start
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium text-sm"
            style={{ borderColor: 'var(--cream-border)', color: 'var(--charcoal)' }}
          >
            <BookOpen size={16} /> Start {mode === 'flashcards' ? 'Flashcards' : mode === 'quiz' ? 'Quiz' : 'Review'}
          </button>
        </div>
      )}

      {/* AI Tutor button */}
      <button
        className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium text-sm"
        style={{ borderColor: 'var(--cream-border)', color: 'var(--charcoal)' }}
      >
        ✦ Ask AI Tutor
      </button>

      <p className="text-xs mt-10 text-center" style={{ color: 'var(--muted)' }}>
        Go to a specific deck to study its cards. <Link href="/decks" className="font-medium" style={{ color: 'var(--orange)' }}>View decks →</Link>
      </p>
    </div>
  )
}
