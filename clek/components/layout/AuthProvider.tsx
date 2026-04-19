'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { SplashScreen } from '@/components/layout/SplashScreen'
import type { User, Session } from '@supabase/supabase-js'

interface SplashConfig {
  message?: string
  duration?: number
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  triggerSplash: (config: SplashConfig) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  triggerSplash: () => {},
})

function getFirstName(user: User): string {
  const full = user.user_metadata?.full_name || user.user_metadata?.name || ''
  return full.split(' ')[0] || user.email?.split('@')[0] || 'there'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [splash, setSplash] = useState<SplashConfig | null>(null)
  const initialLoadDone = useRef(false)
  const hadSessionOnLoad = useRef(false)
  const userRef = useRef<User | null>(null)

  const triggerSplash = useCallback((config: SplashConfig) => {
    setSplash(config)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      userRef.current = session?.user ?? null
      hadSessionOnLoad.current = !!session  // was already logged in when page loaded
      setLoading(false)
      initialLoadDone.current = true
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        const name = userRef.current ? getFirstName(userRef.current) : ''
        setSplash({ message: name ? `See you soon, ${name}` : 'See you soon!', duration: 2000 })
      }

      setSession(session)
      setUser(session?.user ?? null)
      userRef.current = session?.user ?? null

      // Only show login splash for a true new sign-in:
      // - initialLoadDone must be true (not a startup restore)
      // - user must NOT have had a session already when the page loaded (not a page revisit)
      if (event === 'SIGNED_IN' && initialLoadDone.current && !hadSessionOnLoad.current) {
        setSplash({ duration: 1800 })
        hadSessionOnLoad.current = true  // prevent re-triggering on subsequent events
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut, triggerSplash }}>
      {splash && (
        <SplashScreen
          key={JSON.stringify(splash)}
          message={splash.message}
          duration={splash.duration}
          onDone={() => setSplash(null)}
        />
      )}
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)  