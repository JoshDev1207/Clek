'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import QuizCustomizer from '@/components/ui/QuizCustomizer'

interface Card { id: string; front: string; back: string }

interface QuizOptions {
  questionCount: number | 'all'
  quizTypes: {
    multipleChoice: boolean
    trueFalse: boolean
    identification: boolean
  }
  quizMode: 'mixed' | 'randomized'
}

interface QuizQuestion {
  card: Card
  type: 'multiple-choice' | 'true-false' | 'identification'
  choices: string[]
  correct: string
}

function generateQuiz(cards: Card[], options: QuizOptions): QuizQuestion[] {
  const questionCount = options.questionCount === 'all' ? cards.length : Math.min(options.questionCount, cards.length)
  const selectedCards = cards.slice(0, questionCount)
  
  return selectedCards.map(card => {
    const availableTypes: Array<'multiple-choice' | 'true-false' | 'identification'> = []
    
    if (options.quizTypes.multipleChoice) availableTypes.push('multiple-choice')
    if (options.quizTypes.trueFalse) availableTypes.push('true-false')
    if (options.quizTypes.identification) availableTypes.push('identification')
    
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)]

    if (type === 'true-false') {
      const isTrue = Math.random() > 0.5
      return {
        card,
        type: 'true-false',
        choices: ['True', 'False'],
        correct: isTrue ? 'True' : 'False',
      }
    }

    if (type === 'identification') {
      return {
        card,
        type: 'identification',
        choices: [],
        correct: card.back,
      }
    }

    // Multiple choice: 1 correct + 3 distractors
    const distractors = cards
      .filter(c => c.id !== card.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(c => c.back)

    const choices = [...distractors, card.back].sort(() => Math.random() - 0.5)

    return {
      card,
      type: 'multiple-choice',
      choices,
      correct: card.back,
    }
  })
}

export default function QuizPage() {
  const { id } = useParams()
  const router = useRouter()
  const [cards, setCards] = useState<Card[]>([])
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [identificationAnswer, setIdentificationAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deckName, setDeckName] = useState('')
  const [showCustomizer, setShowCustomizer] = useState(true)
  const [quizOptions, setQuizOptions] = useState<QuizOptions | null>(null)

  useEffect(() => {
    async function load() {
      const { data: deck } = await supabase.from('decks').select('name').eq('id', id).single()
      const { data: cardsData } = await supabase.from('cards').select('*').eq('deck_id', id)
      setDeckName(deck?.name || '')
      const shuffled = (cardsData || []).sort(() => Math.random() - 0.5)
      setCards(shuffled)
      setLoading(false)
    }
    if (id) load()
  }, [id])

  const handleSelect = (choice: string) => {
    if (submitted) return
    setSelected(choice)
  }

  const handleIdentificationChange = (value: string) => {
    if (submitted) return
    setIdentificationAnswer(value)
  }

  const handleSubmit = () => {
    const currentQuestion = questions[current]
    if (!selected && currentQuestion.type !== 'identification') return
    if (currentQuestion.type === 'identification' && !identificationAnswer.trim()) return
    
    setSubmitted(true)
    
    if (currentQuestion.type === 'identification') {
      const isCorrect = identificationAnswer.trim().toLowerCase() === currentQuestion.correct.toLowerCase()
      if (isCorrect) setScore(s => s + 1)
    } else if (selected === currentQuestion.correct) {
      setScore(s => s + 1)
    }
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setDone(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setIdentificationAnswer('')
      setSubmitted(false)
    }
  }

  const restart = () => {
    if (!quizOptions) return
    const reshuffled = [...cards].sort(() => Math.random() - 0.5)
    setQuestions(generateQuiz(reshuffled, quizOptions))
    setCurrent(0)
    setSelected(null)
    setIdentificationAnswer('')
    setSubmitted(false)
    setScore(0)
    setDone(false)
  }

  const handleStartQuiz = (options: QuizOptions) => {
    setQuizOptions(options)
    const reshuffled = [...cards].sort(() => Math.random() - 0.5)
    setQuestions(generateQuiz(reshuffled, options))
    setShowCustomizer(false)
  }

  const handleCancelCustomizer = () => {
    router.push(`/decks/${id}`)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><p style={{ color: 'var(--muted)' }}>Loading...</p></div>

  if (showCustomizer) {
    return (
      <QuizCustomizer
        deckName={deckName}
        totalCards={cards.length}
        onStartQuiz={handleStartQuiz}
        onCancel={handleCancelCustomizer}
      />
    )
  }

  const q = questions[current]
  const progress = ((current + (done ? 1 : 0)) / questions.length) * 100
  const pct = Math.round((score / questions.length) * 100)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href={`/decks/${id}`} className="flex items-center gap-1 text-sm" style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={16} /> {deckName}
        </Link>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>{done ? questions.length : current + 1} / {questions.length}</span>
      </div>

      <div className="progress-bar mb-8">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {done ? (
        <div className="text-center py-16 animate-in">
          <div className="text-5xl mb-4">{pct >= 80 ? '🏆' : pct >= 60 ? '📚' : '💪'}</div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--charcoal)' }}>Quiz complete!</h2>
          <p className="text-4xl font-extrabold mb-2" style={{ color: 'var(--orange)' }}>{pct}%</p>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>{score} correct out of {questions.length}</p>
          <div className="flex justify-center gap-3">
            <button onClick={restart} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium text-sm" style={{ borderColor: 'var(--cream-border)', color: 'var(--charcoal)' }}>
              <RotateCcw size={15} /> Retry
            </button>
            <Link href={`/decks/${id}`} className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white" style={{ background: 'var(--charcoal)' }}>
              Back to deck
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Question type badge */}
          <div className="mb-4">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ background: 'var(--cream-dark)', color: 'var(--muted)' }}>
              {q.type === 'multiple-choice' ? 'Multiple Choice' : q.type === 'true-false' ? 'True / False' : 'Identification'}
            </span>
          </div>

          {/* Question */}
          <div className="rounded-2xl border p-6 mb-5" style={{ borderColor: 'var(--cream-border)', background: 'white' }}>
            <p className="text-lg font-semibold leading-snug" style={{ color: 'var(--charcoal)' }}>{q.card.front}</p>
          </div>

          {/* Choices or Identification Input */}
          {q.type === 'identification' ? (
            <div className="mb-6">
              <input
                type="text"
                placeholder="Type your answer here..."
                value={identificationAnswer}
                onChange={(e) => handleIdentificationChange(e.target.value)}
                disabled={submitted}
                className="w-full px-4 py-3.5 rounded-xl border text-sm font-medium outline-none transition-all"
                style={{
                  borderColor: submitted ? (identificationAnswer.trim().toLowerCase() === q.correct.toLowerCase() ? '#86EFAC' : '#FCA5A5') : 'var(--cream-border)',
                  background: submitted ? (identificationAnswer.trim().toLowerCase() === q.correct.toLowerCase() ? '#F0FDF4' : '#FEF2F2') : 'white',
                  color: submitted ? (identificationAnswer.trim().toLowerCase() === q.correct.toLowerCase() ? '#166534' : '#991B1B') : 'var(--charcoal)'
                }}
              />
              {submitted && (
                <div className="mt-2 text-sm" style={{ color: identificationAnswer.trim().toLowerCase() === q.correct.toLowerCase() ? '#166534' : '#991B1B' }}>
                  {identificationAnswer.trim().toLowerCase() === q.correct.toLowerCase() ? '✓ Correct!' : `✗ Incorrect. The answer is: ${q.correct}`}
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {q.choices.map((choice, index) => {
                const isCorrect = choice === q.correct
                const isSelected = choice === selected
                const letter = String.fromCharCode(65 + index) // A, B, C, D
                
                let bg = 'white'
                let border = 'var(--cream-border)'
                let color = 'var(--charcoal)'
                let letterBg = 'var(--cream-dark)'
                let letterColor = 'var(--muted)'

                if (submitted) {
                  if (isCorrect) { 
                    bg = '#F0FDF4'; 
                    border = '#86EFAC'; 
                    color = '#166534'
                    letterBg = '#86EFAC'
                    letterColor = 'white'
                  }
                  else if (isSelected && !isCorrect) { 
                    bg = '#FEF2F2'; 
                    border = '#FCA5A5'; 
                    color = '#991B1B'
                    letterBg = '#FCA5A5'
                    letterColor = 'white'
                  }
                } else if (isSelected) {
                  border = 'var(--orange)'
                  letterBg = 'var(--orange)'
                  letterColor = 'white'
                }

                return (
                  <button
                    key={choice}
                    onClick={() => handleSelect(choice)}
                    className="text-left px-4 py-3 rounded-xl border transition-all flex items-start gap-3 min-h-[60px]"
                    style={{ background: bg, borderColor: border, color }}
                  >
                    <div 
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ background: letterBg, color: letterColor }}
                    >
                      {letter}
                    </div>
                    <span className="text-sm leading-relaxed flex-1">{choice}</span>
                    {submitted && isCorrect && (
                      <div className="flex-shrink-0">
                        <CheckCircle size={18} color="#22C55E" />
                      </div>
                    )}
                    {submitted && isSelected && !isCorrect && (
                      <div className="flex-shrink-0">
                        <XCircle size={18} color="#EF4444" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Submit / Next */}
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!(selected || (q.type === 'identification' && identificationAnswer.trim()))}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-40"
              style={{ background: 'var(--charcoal)' }}
            >
              Submit
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: 'var(--charcoal)' }}
            >
              {current + 1 >= questions.length ? 'See results' : 'Next question →'}
            </button>
          )}
        </>
      )}
    </div>
  )
}