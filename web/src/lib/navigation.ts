// The labels a back link draws on, keyed by the section of the app it returns
// to. A new route is added here rather than spelled out at each link, so
// "Back to …" reads the same wherever it's offered.
import type { BackLink } from '@/lib/back-link'

const BACK_LABELS: { pattern: RegExp; label: string }[] = [
  { pattern: /^\/$/, label: 'Back to projects' },
]

/** A link back to `pathname`, or null if it isn't a page worth returning to. */
export function backLinkTo(pathname: string): BackLink | null {
  const match = BACK_LABELS.find((it) => it.pattern.test(pathname))
  return match ? { to: pathname, label: match.label } : null
}
