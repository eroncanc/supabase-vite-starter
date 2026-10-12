import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export type AuthContextValue = {
  session: Session | null
  user: User | null
  /** True until the initial session lookup resolves. */
  loading: boolean
  signInWithOtp: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

// Kept out of auth.tsx so that file only exports a component (fast refresh).
export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside an AuthProvider')
  return value
}
