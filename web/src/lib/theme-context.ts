import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'

/**
 * Also read by the inline script in index.html, which applies the class before
 * first paint. Keep the two in sync -- the value is stored as a bare string.
 */
export const THEME_STORAGE_KEY = 'starter:theme'

export type ThemeContextValue = {
  /** What the user picked, including 'system'. */
  theme: Theme
  /** What that resolves to right now -- what's actually on the document. */
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

// Kept out of theme.tsx so that file only exports a component (fast refresh),
// the same split as auth.tsx / auth-context.ts.
export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside a ThemeProvider')
  return value
}
