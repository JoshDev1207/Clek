'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Brain, ChevronLeft, Send, X } from 'lucide-react'
import { useAuth } from '@/components/layout/AuthProvider'
import { supabase } from '@/lib/supabase'

const DAILY_LIMIT = 5
const PROMPT_SUGGESTIONS = [
  'Explain the hardest concepts to me',
  'Quiz me on this deck',
  'Give me memory tricks for these',
  "What's the most important thing here?",
]

function getStorageKey(deckId: string) {
  return `aiTutorUsage:${deckId}`
}

function loadUsage(deckId: string) {
  if (typeof window === 'undefined') return { count: 0, date: new Date().toISOString().slice(0, 10) }
  try {
    const raw = localStorage.getItem(getStorageKey(deckId))
    if (!raw) return { count: 0, date: new Date().toISOString().slice(0, 10) }
    const parsed = JSON.parse(raw)
    const today = new Date().toISOString().slice(0, 10)
    if (parsed.date !== today) return { count: 0, date: today }
    return { count: parsed.count || 0, date: today }
  } catch {
    return { count: 0, date: new Date().toISOString().slice(0, 10) }
  }
}

function saveUsage(deckId: string, count: number, date: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(getStorageKey(deckId), JSON.stringify({ count, date }))
}

export default function TutorPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const [deckName, setDeckName] = useState('Deck')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([])
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle')
  const [error, setError] = useState('')
  const [remaining, setRemaining] = useState(DAILY_LIMIT)

  useEffect(() => {
    if (!id) return

    async function loadDeck() {
      const { data, error } = await supabase.from('decks').select('name').eq('id', id).single()
      if (!error && data?.name) setDeckName(data.name)
    }

    const usage = loadUsage(id)
    setRemaining(Math.max(0, DAILY_LIMIT - usage.count))
    loadDeck()
  }, [id])

  const emptyState = useMemo(() => messages.length === 0, [messages.length])

  const addMessage = (role: 'user' | 'assistant', text: string) => {
    setMessages(current => [...current, { role, text }])
  }

  const handleSend = async (text?: string) => {
    if (!id || sending) return
    const prompt = (text ?? question).trim()
    if (!prompt) return
    if (!user) {
      setError('Sign in to ask the AI Tutor.')
      return
    }
    if (remaining <= 0) {
      setError('You have reached your daily AI Tutor limit.')
      return
    }

    setStatus('sending')
    setError('')
    setSending(true)
    addMessage('user', prompt)
    setQuestion('')

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
      const assistantText = data.answer || 'Sorry, I could not generate an answer.'
      addMessage('assistant', assistantText)
      const usage = loadUsage(id)
      const nextCount = usage.count + 1
      saveUsage(id, nextCount, usage.date)
      setRemaining(Math.max(0, DAILY_LIMIT - nextCount))
      setStatus('idle')
    } catch (err: any) {
      setStatus('error')
      setError(err?.message || 'Unable to reach AI Tutor.')
    } finally {
      setSending(false)
    }
  }

  const handleSuggestion = (suggestion: string) => {
    setQuestion(suggestion)
    handleSend(suggestion)
  }

  const clearChat = () => {
    setMessages([])
    setError('')
    setStatus('idle')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <Link href={`/decks/${id}`} className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={16} /> Back to deck
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          <span className="px-2 py-1 rounded-full" style={{ background: 'var(--cream-dark)' }}>AI Tutor</span>
          <span className="px-2 py-1 rounded-full" style={{ background: 'var(--cream-dark)' }}>
            {remaining} msgs left today
          </span>
        </div>
      </div>

      <div className="rounded-[2rem] border border-[var(--cream-border)] bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b" style={{ borderColor: 'var(--cream-border)' }}>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--orange)] p-2 text-white">
              <Brain size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ color: 'var(--muted)' }}>Clek AI Tutor</p>
              <h1 className="text-xl font-bold" style={{ color: 'var(--charcoal)' }}>{deckName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-[var(--cream-border)] px-3 py-1 text-xs font-semibold" style={{ color: 'var(--orange)' }}>
              Clek²
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-[0.7rem] uppercase tracking-[0.2em] font-semibold text-[var(--orange)] hover:text-[var(--charcoal)]"
              >
                Clear chat
              </button>
            )}
          </div>
        </div>

        <div className="min-h-[40vh] px-6 py-8">
          {emptyState ? (
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.2em] font-semibold mb-3" style={{ color: 'var(--muted)' }}>
                Ask Clek anything about {deckName}
              </p>
              <div className="mx-auto max-w-2xl space-y-3">
                <p className="text-sm text-[var(--muted)]">
                  Ask a question and Clek will answer from the deck content. Questions count against your daily message limit.
                </p>
                <div className="grid gap-2 sm:grid-cols-2 mt-4">
                  {PROMPT_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestion(suggestion)}
                      className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-[var(--cream-dark)] transition"
                      style={{ borderColor: 'var(--cream-border)', color: 'var(--charcoal)' }}
                      disabled={sending || remaining <= 0 || !user}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-3xl p-4 ${message.role === 'user' ? 'bg-[var(--orange)] text-white self-end' : 'bg-[var(--cream-dark)] text-[var(--charcoal)]'} max-w-[90%]`}
                  style={{ marginLeft: message.role === 'assistant' ? 0 : 'auto' }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4" style={{ borderColor: 'var(--cream-border)' }}>
          {error ? (
            <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSend() } }}
              placeholder={user ? 'Ask Clek anything...' : 'Sign in to ask the AI Tutor'}
              disabled={!user || remaining <= 0 || sending}
              className="flex-1 rounded-3xl border px-4 py-3 text-sm outline-none transition focus:border-[var(--orange)]"
              style={{ borderColor: 'var(--cream-border)', color: user ? 'var(--charcoal)' : 'var(--muted)', background: user ? 'white' : 'var(--cream-dark)' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!user || remaining <= 0 || sending || !question.trim()}
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"
              style={{ background: user && remaining > 0 ? 'var(--charcoal)' : 'var(--muted)' }}
            >
              {sending ? 'Sending…' : 'Send'}
              <Send size={16} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
            <span>{remaining} of {DAILY_LIMIT} questions left today</span>
            {!user && !authLoading ? (
              <button
                onClick={signInWithGoogle}
                className="font-semibold"
                style={{ color: 'var(--orange)' }}
              >
                Sign in with Google
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}