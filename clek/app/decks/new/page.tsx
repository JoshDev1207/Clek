'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/layout/AuthProvider'
import { AuthModal } from '@/components/ui/AuthModal'
import { supabase } from '@/lib/supabase'
import { extractTextFromFile } from '@/lib/extract'
import { Upload, X, Sparkles, Plus, ChevronLeft, AlertCircle, Loader2 } from 'lucide-react'

interface GeneratedCard {
  front: string
  back: string
  tags: string[]
}

const FREE_DAILY_LIMIT = 3

export default function NewDeckPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Tabs
  const [tab, setTab] = useState<'topic' | 'paste'>('paste')

  // File / text state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [topic, setTopic] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generation state
  const [cardCount, setCardCount] = useState(15)
  const [generating, setGenerating] = useState(false)
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([])
  const [genError, setGenError] = useState('')
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [generationsLeft] = useState(FREE_DAILY_LIMIT)

  // Deck save state
  const [deckName, setDeckName] = useState('')
  const [deckDescription, setDeckDescription] = useState('')
  const [deckCategories, setDeckCategories] = useState<string[]>([])
  const [quizOptions, setQuizOptions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  // Manual card creation
  const [manualCards, setManualCards] = useState<GeneratedCard[]>([{ front: '', back: '', tags: [] }])
  const [newCardTag, setNewCardTag] = useState('')

  // UI state
  const [isAiExpanded, setIsAiExpanded] = useState(false)

  const handleFileSelect = async (file: File) => {
    const validExts = ['pdf', 'pptx', 'docx', 'txt', 'md', 'json', 'csv']
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !validExts.includes(ext)) {
      alert('Please upload a PDF, PPTX, DOCX, TXT, MD, JSON, or CSV file.')
      return
    }

    setUploadedFile(file)
    setIsExtracting(true)
    setExtractedText('')
    setIsAiExpanded(true)
    setTab('paste')
    try {
      const text = await extractTextFromFile(file)
      setExtractedText(text)
      if (!deckName) setDeckName(file.name.replace(/\.[^.]+$/, ''))
    } catch (e: any) {
      alert('Failed to extract text: ' + e.message)
      setUploadedFile(null)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [])

  const handleGenerate = () => {
    if (!user) { setShowAuth(true); return }
    const hasContent = tab === 'topic' ? topic.trim() : (extractedText.trim() || uploadedFile)
    if (!hasContent) return
    setShowDisclaimer(true)
  }

  const confirmGenerate = async () => {
    setShowDisclaimer(false)
    setGenerating(true)
    setGenError('')
    setGeneratedCards([])

    try {
      const res = await fetch('/api/generate-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: tab === 'paste' ? extractedText : '',
          topic: tab === 'topic' ? topic : '',
          count: cardCount,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setGeneratedCards(data.cards)
      if (!deckName && topic) setDeckName(topic)
    } catch (e: any) {
      setGenError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const removeCard = (idx: number) => {
    setGeneratedCards(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSaveDeck = async () => {
    if (!user) { setShowAuth(true); return }
    if (saving) return

    const cards = generatedCards.length > 0 ? generatedCards : manualCards.filter(c => c.front && c.back)
    if (!deckName.trim() || cards.length === 0) return

    setSaving(true)
    try {
      // Collect all unique tags
      const allTags = [...new Set(cards.flatMap(c => c.tags))].slice(0, 10)

      // Create deck
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .insert({ 
          name: deckName.trim(), 
          description: deckDescription.trim(), 
          categories: deckCategories.slice(0, 3),
          quiz_options: quizOptions,
          user_id: user.id, 
          tags: allTags 
        })
        .select()
        .single()

      if (deckError || !deck) throw deckError || new Error('Failed to create deck')

      // Insert cards
      const cardRows = cards.map(c => ({
        deck_id: deck.id,
        front: c.front,
        back: c.back,
        tags: c.tags,
      }))

      const { error: cardsError } = await supabase.from('cards').insert(cardRows)
      if (cardsError) {
        await supabase.from('decks').delete().eq('id', deck.id)
        throw cardsError
      }

      router.push(`/decks/${deck.id}`)
    } catch (e: any) {
      alert('Failed to save: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const charCount = extractedText.length
  const charMax = 40000

  const downloadTemplate = () => {
    const template = [
      {
        front: "What is React?",
        back: "React is a JavaScript library for building user interfaces, particularly web applications with rich, interactive UIs.",
        tags: ["programming", "javascript", "frontend"]
      },
      {
        front: "What is a React component?",
        back: "A React component is a reusable piece of code that returns a React element to be rendered to the page.",
        tags: ["programming", "javascript", "react"]
      },
      {
        front: "What is JSX?",
        back: "JSX is a syntax extension for JavaScript that allows you to write HTML-like code in your JavaScript files.",
        tags: ["programming", "javascript", "jsx"]
      }
    ]
    
    const dataStr = JSON.stringify(template, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = 'kwek-template.json'
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back */}
      <div className="flex items-start">
        <Link href="/decks" className="inline-flex items-center gap-2 text-xs mb-6 font-medium" style={{ color: 'var(--muted)', marginLeft: '-154px' }}>
          <ChevronLeft size={16} />
          <span style={{ letterSpacing: '-0.02em', fontSize: '0.75rem' }}>HOME</span>
        </Link>
      </div>

      {/* ── IMPORT FROM FILE ── */}
      <section 
        className="w-full py-4 px-4 text-left rounded-xl cursor-pointer transition-all hover:opacity-90"
        style={{
          background: 'transparent',
          border: '1.5px dashed var(--cream-border)',
          borderRadius: '0.75rem',
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--cream)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--orange)' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--charcoal)' }}>Import from file</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Drag & drop or click — .pdf, .pptx, .docx, .txt, .json, .csv</p>
          </div>
        </div>
        
        {uploadedFile && (
          <div className="mt-4 flex items-center justify-between w-full max-w-sm mx-auto px-4 py-2 rounded-lg" style={{ background: 'var(--cream)' }}>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--orange)' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="text-sm font-medium" style={{ color: 'var(--charcoal)' }}>{uploadedFile.name}</span>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setUploadedFile(null); setExtractedText('') }}
              className="p-1 rounded hover:bg-[var(--cream-dark)]"
              style={{ color: 'var(--muted)' }}
            >
              <X size={14} />
            </button>
          </div>
        )}
        
        <input ref={fileInputRef} type="file" accept=".pdf,.pptx,.docx,.txt,.md,.json,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
      </section>

      {/* ── DOWNLOAD TEMPLATE ── */}
      <section className="w-full py-3 px-4 text-left rounded-xl">
        <div className="flex justify-end">
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 text-xs font-bold hover:opacity-80 transition-opacity"
            style={{ color: 'var(--muted)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download template
          </button>
        </div>
      </section>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px" style={{ background: 'var(--cream-border)' }} />
        <span className="text-xs font-semibold tracking-widest" style={{ color: 'var(--muted)' }}>OR</span>
        <div className="flex-1 h-px" style={{ background: 'var(--cream-border)' }} />
      </div>

      {/* ── GENERATE WITH AI ── */}
      <section 
        className="w-full text-left rounded-xl overflow-hidden transition-all mb-4"
        style={{
          background: isAiExpanded ? 'white' : 'transparent',
          border: isAiExpanded ? '1.5px solid var(--cream-border)' : '1.5px dashed var(--cream-border)',
          borderRadius: '0.75rem',
        }}
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-4 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setIsAiExpanded(!isAiExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--cream)' }}>
              <Sparkles size={16} style={{ color: 'var(--orange)' }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--charcoal)' }}>Generate with AI</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Describe a topic, paste notes, or drop a PDF / PPTX - AI builds your deck</p>
            </div>
          </div>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            style={{ 
              color: 'var(--muted)',
              transform: isAiExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              flexShrink: 0,
            }}
          >
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </div>

      {isAiExpanded && (
        <div className="border-t overflow-hidden" style={{ borderColor: 'var(--cream-border)', background: 'white' }}>

        {!user ? (
          <div className="px-5 pb-8 pt-4 text-center">
            <Sparkles size={32} className="mx-auto mb-3" style={{ color: 'var(--cream-border)' }} />
            <p className="font-semibold text-sm mb-1" style={{ color: 'var(--charcoal)' }}>Sign in to generate AI decks</p>
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Free account gives you {FREE_DAILY_LIMIT} AI deck generations per day</p>
            <button
              onClick={() => setShowAuth(true)}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
              style={{ background: 'var(--charcoal)' }}
            >
              Sign in
            </button>
          </div>
        ) : (
          <div className="px-5 pb-5 space-y-4">
            {/* Tabs */}
            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--cream-border)' }}>
              {(['topic', 'paste'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-2 text-sm font-medium transition-colors capitalize"
                  style={{
                    background: tab === t ? 'var(--charcoal)' : 'transparent',
                    color: tab === t ? 'white' : 'var(--muted)',
                  }}
                >
                  {t === 'paste' ? 'Paste text' : 'Topic'}
                </button>
              ))}
            </div>

            {tab === 'topic' ? (
              <textarea
                placeholder="e.g. The French Revolution, Photosynthesis, React Hooks..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: 'var(--cream-border)', background: 'var(--cream)', color: 'var(--charcoal)' }}
              />
            ) : (
              <div className="relative">
                <textarea
                  placeholder="Paste your notes, textbook content, or any text here..."
                  value={extractedText}
                  onChange={e => setExtractedText(e.target.value)}
                  rows={6}
                  className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none resize-none"
                  style={{ borderColor: 'var(--cream-border)', background: 'var(--cream)', color: 'var(--charcoal)' }}
                />
                <div className="text-right text-xs mt-1" style={{ color: charCount > charMax * 0.9 ? 'var(--orange)' : 'var(--muted)' }}>
                  {charCount.toLocaleString()}/{charMax.toLocaleString()} · long texts are sampled for best coverage
                </div>
              </div>
            )}

            {/* Card count */}
            <div>
              <p className="text-xs font-semibold mb-2 tracking-wider" style={{ color: 'var(--muted)' }}>NUMBER OF CARDS</p>
              <div className="flex items-center gap-2">
                {[10, 15, 20, 30].map(n => (
                  <button
                    key={n}
                    onClick={() => n <= 20 && setCardCount(n)}
                    disabled={n > 20}
                    className="px-4 py-1.5 rounded-xl text-sm font-semibold border transition-all disabled:opacity-40"
                    style={{
                      background: cardCount === n ? 'var(--orange)' : 'transparent',
                      color: cardCount === n ? 'white' : 'var(--muted)',
                      borderColor: cardCount === n ? 'var(--orange)' : 'var(--cream-border)',
                    }}
                  >
                    {n}{n > 20 && ' 🔒'}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>30 cards coming soon for kwek² members</p>
            </div>

            {/* Generations left */}
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {generationsLeft} of {FREE_DAILY_LIMIT} generations left today
            </p>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating || (tab === 'topic' ? !topic.trim() : !extractedText.trim())}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
              style={{ background: 'var(--charcoal)' }}
            >
              {generating ? (
                <><Loader2 size={16} className="animate-spin" /> Generating cards...</>
              ) : (
                <><Sparkles size={16} /> Generate {cardCount} cards</>
              )}
            </button>
          </div>
        )}
      </div>
      )}
      </section>

      {/* Generated cards */}
      {(generatedCards.length > 0 || genError) && (
        <section className="rounded-2xl border overflow-hidden mb-4" style={{ borderColor: 'var(--cream-border)', background: 'white' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--cream-border)' }}>
            <span className="font-semibold text-sm" style={{ color: 'var(--charcoal)' }}>
              {generatedCards.length} CARDS GENERATED
            </span>
            <button onClick={handleGenerate} className="text-xs font-medium" style={{ color: 'var(--orange)' }}>
              Regenerate
            </button>
          </div>

          {genError && (
            <div className="px-5 py-4 flex items-center gap-2 text-sm" style={{ color: '#D95C5C' }}>
              <AlertCircle size={16} />
              {genError}
            </div>
          )}

          <div className="divide-y overflow-y-auto" style={{ borderColor: 'var(--cream-border)', maxHeight: '520px' }}>
            {generatedCards.map((card, idx) => (
              <div key={idx} className="px-5 py-4 flex items-start gap-3">
                <span className="text-xs font-semibold mt-0.5 w-5 shrink-0" style={{ color: 'var(--muted)' }}>{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug" style={{ color: 'var(--charcoal)' }}>{card.front}</p>
                  <p className="text-sm mt-1 leading-snug" style={{ color: 'var(--muted)' }}>{card.back}</p>
                  {card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {card.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--cream)', color: 'var(--muted)' }}>
                          ● {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => removeCard(idx)} className="p-1 shrink-0" style={{ color: 'var(--cream-border)' }}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px" style={{ background: 'var(--cream-border)' }} />
        <span className="text-xs font-semibold tracking-widest" style={{ color: 'var(--muted)' }}>OR CREATE FROM SCRATCH</span>
        <div className="flex-1 h-px" style={{ background: 'var(--cream-border)' }} />
      </div>

      {/* ── NEW DECK FORM ── */}
      <section className="rounded-2xl border overflow-hidden mb-4" style={{ borderColor: 'var(--cream-border)', background: 'white' }}>
        <div className="px-5 py-5">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--charcoal)' }}>New Deck</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold tracking-wider mb-1.5 block" style={{ color: 'var(--muted)' }}>DECK NAME *</label>
              <input
                type="text"
                placeholder="e.g. React Hooks"
                value={deckName}
                onChange={e => setDeckName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: 'var(--cream-border)', background: 'var(--cream)', color: 'var(--charcoal)' }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wider mb-1.5 block" style={{ color: 'var(--muted)' }}>DESCRIPTION</label>
              <textarea
                placeholder="What is this deck about?"
                value={deckDescription}
                onChange={e => setDeckDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: 'var(--cream-border)', background: 'var(--cream)', color: 'var(--charcoal)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── MANUAL CARD EDITOR (if no generated cards) ── */}
      {generatedCards.length === 0 && (
        <section className="rounded-3xl border overflow-hidden mb-6" style={{ borderColor: 'var(--cream-border)', background: 'white' }}>
          <div className="px-4 py-4">
            <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--charcoal)' }}>Add Card</h2>
            
            <div>
              <label className="text-xs font-semibold tracking-wider mb-1.5 block" style={{ color: 'var(--muted)' }}>CATEGORIES</label>
              <input
                type="text"
                placeholder="Add categories..."
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none mb-3"
                style={{ borderColor: 'var(--cream-border)', background: 'var(--cream)', color: 'var(--charcoal)' }}
              />
            </div>
            
            {manualCards.map((card, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs font-semibold tracking-wider mb-1.5 block" style={{ color: 'var(--muted)' }}>FRONT (QUESTION) *</label>
                  <textarea
                    placeholder="What is...?"
                    value={card.front}
                    onChange={e => {
                      const next = [...manualCards]
                      next[idx] = { ...card, front: e.target.value }
                      setManualCards(next)
                    }}
                    rows={4}
                    className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none resize-none"
                    style={{ borderColor: 'var(--cream-border)', background: 'var(--cream)', color: 'var(--charcoal)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wider mb-1.5 block" style={{ color: 'var(--muted)' }}>BACK (ANSWER) *</label>
                  <textarea
                    placeholder="The answer is..."
                    value={card.back}
                    onChange={e => {
                      const next = [...manualCards]
                      next[idx] = { ...card, back: e.target.value }
                      setManualCards(next)
                    }}
                    rows={4}
                    className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none resize-none"
                    style={{ borderColor: 'var(--cream-border)', background: 'var(--cream)', color: 'var(--charcoal)' }}
                  />
                </div>
              </div>
            ))}
            
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="quiz-options"
                checked={quizOptions}
                onChange={e => setQuizOptions(e.target.checked)}
                className="w-4 h-4 rounded border"
                style={{ borderColor: 'var(--cream-border)' }}
              />
              <label htmlFor="quiz-options" className="text-xs" style={{ color: 'var(--charcoal)' }}>
                Add quiz options
              </label>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setManualCards(prev => [...prev, { front: '', back: '', tags: [] }])}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-50"
                style={{ background: 'var(--charcoal)' }}
              >
                + Add Card
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Save deck and cancel buttons for manual cards */}
      {generatedCards.length === 0 && (
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handleSaveDeck}
            disabled={saving || !deckName.trim() || manualCards.filter(c => c.front && c.back).length === 0}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-50"
            style={{ background: 'var(--charcoal)' }}
          >
            {saving ? 'Saving...' : 'Save Deck'}
          </button>
          <button
            onClick={() => router.push('/decks')}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm border"
            style={{ borderColor: 'var(--cream-border)', color: 'var(--muted)' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Save deck button for generated cards */}
      {generatedCards.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDeck}
            disabled={saving || !deckName.trim()}
            className="flex-1 py-3.5 rounded-xl font-semibold text-base text-white transition-opacity disabled:opacity-50"
            style={{ background: 'var(--charcoal)' }}
          >
            {saving ? 'Saving...' : `Save Deck (${generatedCards.length} cards)`}
          </button>
          <button
            onClick={() => router.push('/decks')}
            className="px-6 py-3.5 rounded-xl font-semibold text-base border"
            style={{ borderColor: 'var(--cream-border)', color: 'var(--muted)' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Disclaimer modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(26,24,20,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} style={{ color: 'var(--orange)' }} />
              <h3 className="font-bold" style={{ color: 'var(--charcoal)' }}>Before you generate</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
              Your input is sent to <strong>Groq</strong> and processed by <strong>Meta Llama 3</strong> to generate your flashcards.
            </p>
            <ul className="space-y-2 mb-5">
              {[
                'Your content leaves this device to generate cards.',
                'Groq does not use your data to train models.',
                'Kwek does not store your input on our servers.',
                'Avoid pasting sensitive personal information.',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                  <span style={{ color: 'var(--orange)' }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={confirmGenerate}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white mb-2"
              style={{ background: 'var(--charcoal)' }}
            >
              Got it — generate my cards
            </button>
            <button
              onClick={() => setShowDisclaimer(false)}
              className="w-full py-2 text-sm font-medium"
              style={{ color: 'var(--muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}