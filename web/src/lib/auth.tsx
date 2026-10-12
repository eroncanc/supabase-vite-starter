import type { Session } from '@supabase/supabase-js'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { AuthContext, type AuthContextValue } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    // Resolve the persisted session before rendering any guard, so a refresh
    // on a deep route doesn't bounce a logged-in user to /login.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    // Also covers the magic-link return: detectSessionInUrl picks the token out
    // of the URL and the new session arrives here.
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
        setLoading(false)
      }
    )

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const signInWithOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  }, [])

  // Resolving is not success: the tab is navigating to Google. Only the error
  // is meaningful here. The return leg is the magic link's — Google comes back
  // to the origin with a PKCE code, detectSessionInUrl exchanges it, and the
  // subscription above fires.
  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signInWithOtp,
      signInWithGoogle,
      signOut,
    }),
    [session, loading, signInWithOtp, signInWithGoogle, signOut]
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
