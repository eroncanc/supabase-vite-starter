// Where a page should send you back to, when that depends on how you got there.
//
// A page reachable from more than one place can't hardcode its way back -- a
// fixed "Back to the list" strands you a page away from what you were doing.
//
// Carried in react-router's location state rather than the URL: it's a hint
// about this visit, not part of the address. A reload or a pasted link loses it
// and falls back, which is the right behaviour -- a deep link has no "back".
import { useLocation } from 'react-router'

import { backLinkTo } from '@/lib/navigation'

export type BackLink = {
  to: string
  label: string
}

/** Reads the back link the previous page attached, or the page's own default. */
export function useBackLink(fallback: BackLink): BackLink {
  const { state } = useLocation()
  return isBackLink(state?.backTo) ? state.backTo : fallback
}

/**
 * A link back to the page you're on now -- what a link into another section
 * hands forward, so the page it opens can offer the way home.
 *
 * The mirror of useBackLink: that one *reads* what was handed over, this one
 * *writes* it. Null on a page with no label in `lib/navigation.ts`.
 */
export function useHereBackLink(): BackLink | null {
  const { pathname } = useLocation()
  return backLinkTo(pathname)
}

function isBackLink(value: unknown): value is BackLink {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as BackLink).to === 'string' &&
    typeof (value as BackLink).label === 'string'
  )
}
