'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

interface QuizOptions {
  questionCount: number | 'all'
  quizTypes: {
    multipleChoice: boolean
    trueFalse: boolean
    identification: boolean
  }
  quizMode: 'mixed' | 'randomized'
}

interface QuizCustomizerProps {
  deckName: string
  totalCards: number
  onStartQuiz: (options: QuizOptions) => void
  onCancel: () => void
}

export default function QuizCustomizer({ deckName, totalCards, onStartQuiz, onCancel }: QuizCustomizerProps) {
  const [options, setOptions] = useState<QuizOptions>({
    questionCount: Math.min(10, totalCards),
    quizTypes: {
      multipleChoice: true,
      trueFalse: true,
      identification: false
    },
    quizMode: 'mixed'
  })

  const handleQuestionCountChange = (count: number | 'all') => {
    setOptions(prev => ({ ...prev, questionCount: count }))
  }

  const handleQuizTypeChange = (type: keyof typeof options.quizTypes) => {
    setOptions(prev => ({
      ...prev,
      quizTypes: {
        ...prev.quizTypes,
        [type]: !prev.quizTypes[type]
      }
    }))
  }

  const handleQuizModeChange = (mode: 'mixed' | 'randomized') => {
    setOptions(prev => ({ ...prev, quizMode: mode }))
  }

  const hasSelectedQuizTypes = Object.values(options.quizTypes).some(Boolean)

  const handleStartQuiz = () => {
    if (!hasSelectedQuizTypes) return
    onStartQuiz(options)
  }

  return (
    <div className="mx-auto px-4 py-8" style={{ maxWidth: '980px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onCancel}
          className="flex items-center gap-1 text-sm" 
          style={{ color: 'var(--muted)' }}
        >
          ← {deckName}
        </button>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          {totalCards} cards available
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--charcoal)' }}>
        Customize your quiz
      </h1>

      {/* Questions Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--charcoal)' }}>
          Questions
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => handleQuestionCountChange(10)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              options.questionCount === 10
                ? 'text-white'
                : 'border'
            }`}
            style={{
              background: options.questionCount === 10 ? 'var(--charcoal)' : 'transparent',
              borderColor: 'var(--cream-border)',
              color: options.questionCount === 10 ? 'white' : 'var(--charcoal)'
            }}
          >
            10
          </button>
          <button
            onClick={() => handleQuestionCountChange('all')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              options.questionCount === 'all'
                ? 'text-white'
                : 'border'
            }`}
            style={{
              background: options.questionCount === 'all' ? 'var(--charcoal)' : 'transparent',
              borderColor: 'var(--cream-border)',
              color: options.questionCount === 'all' ? 'white' : 'var(--charcoal)'
            }}
          >
            All
          </button>
        </div>
      </div>

      {/* Quiz Types Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--charcoal)' }}>
          Quiz Types
        </h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all hover:bg-[var(--cream)]" style={{ borderColor: 'var(--cream-border)' }}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={options.quizTypes.multipleChoice}
                onChange={() => handleQuizTypeChange('multipleChoice')}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'var(--orange)' }}
              />
              <div>
                <div className="font-medium" style={{ color: 'var(--charcoal)' }}>Multiple Choice</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>Pick the correct answer from available options</div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all hover:bg-[var(--cream)]" style={{ borderColor: 'var(--cream-border)' }}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={options.quizTypes.trueFalse}
                onChange={() => handleQuizTypeChange('trueFalse')}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'var(--orange)' }}
              />
              <div>
                <div className="font-medium" style={{ color: 'var(--charcoal)' }}>True / False</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>Evaluate whether an answer is correct</div>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all hover:bg-[var(--cream)]" style={{ borderColor: 'var(--cream-border)' }}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={options.quizTypes.identification}
                onChange={() => handleQuizTypeChange('identification')}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'var(--orange)' }}
              />
              <div>
                <div className="font-medium" style={{ color: 'var(--charcoal)' }}>Identification</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>Type the answer from memory</div>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Quiz Modes Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--charcoal)' }}>
          Quiz Modes
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => handleQuizModeChange('mixed')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              options.quizMode === 'mixed'
                ? 'text-white'
                : 'border'
            }`}
            style={{
              background: options.quizMode === 'mixed' ? 'var(--charcoal)' : 'transparent',
              borderColor: 'var(--cream-border)',
              color: options.quizMode === 'mixed' ? 'white' : 'var(--charcoal)'
            }}
          >
            Mixed
          </button>
          <button
            onClick={() => handleQuizModeChange('randomized')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              options.quizMode === 'randomized'
                ? 'text-white'
                : 'border'
            }`}
            style={{
              background: options.quizMode === 'randomized' ? 'var(--charcoal)' : 'transparent',
              borderColor: 'var(--cream-border)',
              color: options.quizMode === 'randomized' ? 'white' : 'var(--charcoal)'
            }}
          >
            Randomized
          </button>
        </div>
      </div>

      {/* Start Quiz Button */}
      <button
        onClick={handleStartQuiz}
        disabled={!hasSelectedQuizTypes}
        className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          hasSelectedQuizTypes
            ? 'text-white'
            : 'opacity-40 cursor-not-allowed'
        }`}
        style={{ background: hasSelectedQuizTypes ? 'var(--charcoal)' : 'var(--muted)' }}
      >
        Start Quiz
        <ChevronRight size={16} />
      </button>

      {!hasSelectedQuizTypes && (
        <p className="text-sm text-center mt-3" style={{ color: 'var(--muted)' }}>
          Please select at least one quiz type
        </p>
      )}
    </div>
  )
}
