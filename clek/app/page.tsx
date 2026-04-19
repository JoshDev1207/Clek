'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/layout/AuthProvider'
import { LandingPage } from '@/components/layout/LandingPage'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/decks')
    }
  }, [user, loading, router])

  // Still checking auth — show nothing to avoid flash
  if (loading) return null

  // Already signed in — redirect is in flight
  if (user) return null

  // Not signed in — show landing
  return <LandingPage />
}