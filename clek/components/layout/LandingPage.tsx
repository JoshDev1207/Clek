'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Brain,
  FileText,
  Zap,
  Users,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'

const features = [
  { icon: FileText, text: 'Upload any PDF, notes, or paste raw text' },
  { icon: Sparkles, text: 'AI generates flashcards and quizzes instantly' },
  { icon: Brain, text: 'Adaptive quiz mode tests what you actually need' },
  { icon: Zap, text: 'AI tutor explains concepts on demand' },
  { icon: Users, text: 'Share decks with your study group' },
]

export function LandingPage() {
  const { signInWithGoogle } = useAuth()
  const router = useRouter()

  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const { error } = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
      if (error) throw error
      if (mode === 'signup') {
        setSuccess('Check your email to confirm your account!')
      } else {
        router.push('/decks')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    await signInWithGoogle()
  }

  return (
    <div className="landing-root">
      {/* ── LEFT PANEL ── */}
      <div className="landing-left">
        <div className="landing-logo">Clek</div>

        <h1 className="landing-headline">
          Study smarter,<br />
          <span className="landing-headline-accent">not harder.</span>
        </h1>

        <p className="landing-sub">
          Turn any material into AI-powered flashcards and quizzes in seconds.
        </p>

        <ul className="landing-features">
          {features.map(({ icon: Icon, text }, i) => (
            <li key={i} className="landing-feature-item" style={{ animationDelay: `${0.1 + i * 0.07}s` }}>
              <span className="landing-feature-arrow">
                <ChevronRight size={14} strokeWidth={2.5} />
              </span>
              <Icon size={15} className="landing-feature-icon" />
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <div className="landing-tagline">
          Free · No credit card · Works on any device
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="landing-right">
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'signup' ? 'auth-tab--active' : ''}`}
              onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
            >
              Sign up
            </button>
            <button
              className={`auth-tab ${mode === 'signin' ? 'auth-tab--active' : ''}`}
              onClick={() => { setMode('signin'); setError(''); setSuccess('') }}
            >
              Sign in
            </button>
          </div>

          <p className="auth-desc">
            {mode === 'signup'
              ? 'Create your free account — 3 AI deck generations a day, no card needed.'
              : 'Welcome back! Sign in to access your decks.'}
          </p>

          <button onClick={handleGoogle} className="auth-google-btn">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">or</span>
            <div className="auth-divider-line" />
          </div>

          <form onSubmit={handleEmailAuth} className="auth-form">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="auth-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="auth-input"
            />

            {error && <p className="auth-error">{error}</p>}
            {success && <p className="auth-success">{success}</p>}

            <button type="submit" disabled={loading} className="auth-submit-btn">
              {loading ? 'Loading...' : (
                <span className="flex items-center justify-center gap-2">
                  {mode === 'signup' ? 'Create free account' : 'Sign in'}
                  <ArrowRight size={15} />
                </span>
              )}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setSuccess('') }}
              className="auth-switch-btn"
            >
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>

      <style>{`
        /* ── BASE ── */
        .landing-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--cream);
          padding: 2.5rem;
          gap: 6rem;
          font-family: var(--font-sans);
        }

        .landing-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 1.75rem;
          max-width: 500px;
          flex-shrink: 0;
        }

        .landing-logo {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--orange);
          letter-spacing: -0.04em;
          line-height: 1;
          font-family: var(--font-sans);
        }

        .landing-headline {
          font-size: clamp(2.6rem, 4.5vw, 3.75rem);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.035em;
          color: var(--charcoal);
          margin: 0;
          font-family: var(--font-sans);
        }

        .landing-headline-accent {
          color: var(--orange);
          font-weight: 800;
          font-family: var(--font-sans);
        }

        .landing-sub {
          font-size: 1.125rem;
          color: var(--muted);
          line-height: 1.6;
          max-width: 420px;
          margin: 0;
          font-weight: 500;
          font-family: var(--font-sans);
        }

        .landing-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .landing-feature-item {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-size: 1rem;
          color: var(--charcoal);
          font-weight: 600;
          opacity: 0;
          animation: fadeSlideUp 0.45s ease forwards;
          font-family: var(--font-sans);
        }

        .landing-feature-arrow {
          display: flex;
          align-items: center;
          color: var(--orange);
          flex-shrink: 0;
        }

        .landing-feature-icon {
          color: var(--muted);
          opacity: 0.7;
          flex-shrink: 0;
        }

        .landing-tagline {
          font-size: 0.875rem;
          color: var(--muted);
          opacity: 0.75;
          padding-top: 0.25rem;
          font-weight: 500;
          font-family: var(--font-sans);
        }

        /* ── RIGHT / AUTH CARD ── */
        .landing-right {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-card {
          width: 420px;
          background: white;
          border-radius: 1.5rem;
          padding: 2.5rem;
          box-shadow: 0 4px 32px rgba(0,0,0,0.08);
          border: 1px solid var(--cream-border);
          animation: fadeSlideUp 0.4s ease forwards;
        }

        .auth-tabs {
          display: flex;
          background: var(--cream);
          border-radius: 0.875rem;
          padding: 4px;
          margin-bottom: 1.5rem;
          border: 1px solid var(--cream-border);
        }

        .auth-tab {
          flex: 1;
          padding: 0.6rem 0;
          font-size: 1rem;
          font-weight: 700;
          border-radius: 0.65rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--muted);
          background: transparent;
          text-align: center;
          line-height: 1;
          font-family: var(--font-sans);
        }

        .auth-tab--active {
          background: white;
          color: var(--charcoal);
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }

        .auth-desc {
          font-size: 0.9rem;
          color: var(--muted);
          margin: 0 0 1.25rem;
          line-height: 1.5;
          font-weight: 500;
          font-family: var(--font-sans);
        }

        .auth-google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 0.8rem 1rem;
          border-radius: 0.875rem;
          border: 1px solid var(--cream-border);
          background: white;
          color: var(--charcoal);
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s;
          font-family: var(--font-sans);
        }
        .auth-google-btn:hover { background: var(--cream); }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.1rem 0;
        }
        .auth-divider-line { flex: 1; height: 1px; background: var(--cream-border); }
        .auth-divider-text { font-size: 0.85rem; color: var(--muted); font-weight: 500; }

        .auth-form { display: flex; flex-direction: column; gap: 0.75rem; }

        .auth-input {
          width: 100%;
          padding: 0.8rem 1rem;
          border-radius: 0.875rem;
          border: 1px solid var(--cream-border);
          background: var(--cream);
          color: var(--charcoal);
          font-size: 1rem;
          font-weight: 500;
          outline: none;
          transition: border-color 0.15s;
          font-family: var(--font-sans);
        }
        .auth-input:focus { border-color: var(--orange); }

        .auth-error { font-size: 0.85rem; color: #d95c5c; margin: 0; font-weight: 600; }
        .auth-success { font-size: 0.85rem; color: #4caf50; margin: 0; font-weight: 600; }

        .auth-submit-btn {
          width: 100%;
          padding: 0.85rem;
          border-radius: 0.875rem;
          border: none;
          background: var(--charcoal);
          color: white;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
          margin-top: 0.25rem;
          font-family: var(--font-sans);
        }
        .auth-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-submit-btn:hover:not(:disabled) { opacity: 0.85; }

        .auth-switch {
          text-align: center;
          font-size: 0.875rem;
          color: var(--muted);
          margin: 1.1rem 0 0;
          font-weight: 500;
          font-family: var(--font-sans);
        }
        .auth-switch-btn {
          background: none;
          border: none;
          color: var(--orange);
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0;
          font-family: var(--font-sans);
        }

        /* ── TABLET ── */
        @media (max-width: 900px) {
          .landing-root {
            flex-direction: column;
            gap: 2rem;
            padding: 2rem 1.25rem;
            align-items: stretch;
          }
          .landing-left {
            max-width: 100%;
            gap: 1.25rem;
          }
          .landing-logo {
            font-size: 2rem;
          }
          .landing-headline {
            font-size: 2.75rem;
            letter-spacing: -0.03em;
          }
          .landing-sub {
            font-size: 1rem;
            max-width: 100%;
          }
          .landing-feature-item {
            font-size: 0.95rem;
          }
          .landing-right {
            width: 100%;
          }
          .auth-card {
            width: 100%;
            max-width: 100%;
            padding: 1.75rem;
          }
        }

        /* ── MOBILE ── */
        @media (max-width: 480px) {
          .landing-root {
            padding: 1.5rem 1rem;
            gap: 1.5rem;
          }
          .landing-logo {
            font-size: 1.75rem;
            font-weight: 800;
          }
          .landing-headline {
            font-size: 2.1rem;
            font-weight: 800;
            letter-spacing: -0.03em;
            line-height: 1.1;
          }
          .landing-sub {
            font-size: 0.9rem;
          }
          .landing-features {
            gap: 0.6rem;
          }
          .landing-feature-item {
            font-size: 0.875rem;
            font-weight: 600;
          }
          .landing-tagline {
            font-size: 0.8rem;
          }
          .auth-card {
            padding: 1.25rem;
            border-radius: 1.25rem;
          }
          .auth-tab {
            font-size: 0.9rem;
            font-weight: 700;
          }
          .auth-google-btn {
            font-size: 0.9rem;
            font-weight: 700;
            padding: 0.75rem;
          }
          .auth-input {
            font-size: 0.9rem;
            padding: 0.75rem 0.875rem;
          }
          .auth-submit-btn {
            font-size: 0.9rem;
            font-weight: 700;
            padding: 0.75rem;
          }
          .auth-desc {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  )
}