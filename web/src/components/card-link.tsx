import type { ReactNode } from 'react'
import { Link } from 'react-router'

import type { BackLink } from '@/lib/back-link'
import { cn } from '@/lib/utils'

/**
 * A card's title, and the whole card's tap target.
 *
 * A title-sized link is a thumb-sized miss on a phone, so the link spreads
 * itself over its card through an `::after` overlay rather than the card
 * wrapping its contents in an anchor -- the menu button, and anything else
 * interactive, would be a nested interactive element inside one. Two rules
 * come with it and hold at every call site: the card must be `relative` (the
 * overlay stretches to the nearest positioned ancestor), and whatever should
 * still be clickable on top of it -- the actions menu -- must be `relative
 * z-10`.
 *
 * The title itself is drawn plainly. What says the card is clickable is the
 * card: `CARD_SURFACE` (`lib/card-surface.ts`) tints it on hover, which is the
 * first rule's other half -- pass it and `relative` comes with it.
 */
export function CardLink({
  to,
  backTo,
  className,
  children,
}: {
  to: string
  /** Where the page being opened should offer to return to. */
  backTo?: BackLink
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      state={backTo ? { backTo } : undefined}
      draggable={false}
      className={cn(
        // The ring is drawn on the overlay rather than around the title, for
        // the same reason the hover moved to the card: the thing being focused
        // is the whole card. `after:rounded-xl` matches a Card; a caller on a
        // different radius passes its own and tailwind-merge keeps the last.
        'outline-none after:absolute after:inset-0 after:rounded-xl after:content-[""] focus-visible:after:ring-3 focus-visible:after:ring-inset focus-visible:after:ring-ring/50',
        className
      )}
    >
      {children}
    </Link>
  )
}
