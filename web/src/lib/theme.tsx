import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

import {
  THEME_STORAGE_KEY,
  ThemeContext,
  type Theme,
  type ThemeContextValue,
} from '@/lib/theme-context'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function subscribeToSystemTheme(onChange: () => void) {
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function getSystemPrefersDark() {
  return window.matchMedia(DARK_QUERY).matches
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
    // Private mode or blocked storage -- fall through to the default.
  }
  return 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  // useSyncExternalStore rather than an effect, so the OS preference is read
  // during render instead of via a second setState pass.
  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemPrefersDark,
    // Server/prerender fallback; the inline script owns the real first paint.
    () => false
  )

  const resolvedTheme = theme === 'system'
    ? systemPrefersDark ? 'dark' : 'light'
    : theme

  // index.html already applied the right class before paint; this keeps it in
  // step with later changes (a toggle, or the OS flipping under 'system').
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    // Keeps native controls -- scrollbars, date pickers -- on the same side.
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Not persisting is survivable; the choice still applies this session.
    }
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
