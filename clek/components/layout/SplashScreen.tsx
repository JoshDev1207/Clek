'use client'

import { useEffect, useState } from 'react'

interface SplashScreenProps {
  /** Custom static message — if omitted, cycles through default messages */
  message?: string
  /** Called when the splash finishes (after fade-out) */
  onDone?: () => void
  /** Duration in ms before starting fade-out (default 1800) */
  duration?: number
}

export function SplashScreen({ message: customMessage, onDone, duration = 1800 }: SplashScreenProps) {
  const [visible, setVisible] = useState(true)
  const [message, setMessage] = useState(customMessage ?? 'Loading...')

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (!customMessage) {
      const messages = ['Study smarter.', 'Generating cards...', 'Getting ready...']
      let i = 0
      interval = setInterval(() => {
        i = (i + 1) % messages.length
        setMessage(messages[i])
      }, 600)
    }

    const timer = setTimeout(() => {
      setVisible(false)
      if (interval) clearInterval(interval)
      // give fade-out time to complete before calling onDone
      setTimeout(() => onDone?.(), 500)
    }, duration)

    return () => {
      clearTimeout(timer)
      if (interval) clearInterval(interval)
    }
  }, [])

  return (
    <div
      className={`splash-screen${!visible ? ' hide' : ''}`}
    >
      <div className="splash-logo">Clek</div>
      <div className="splash-subtitle">{message}</div>
      <div className="loading-dots mt-2">
        <span /><span /><span />
      </div>
    </div>
  )
}