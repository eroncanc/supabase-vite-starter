/**
 * What a card looks like when the whole of it is the tap target.
 *
 * The tint is the affordance: `CardLink` used to say "this is clickable" by
 * underlining the title, which aims a signal at a word when the target is the
 * card. One treatment across every surface you can tap, whether it opens a
 * page or a dialog.
 *
 * It's the *full* `muted` rather than a half of it because a card has nothing
 * to be compared against. A tinted row in a list is read against the rows above
 * and below it, so half a step is plenty; a card alone on the page is only read
 * against how it looked a moment ago, and in the light theme half a step is
 * white against white. The ring firms up for the same reason -- `ring-1` is
 * already on a Card, so this only colours what's there, and a row (no ring
 * width) is untouched by it.
 *
 * `relative` rides along because every whole-surface target needs it: the
 * overlay, whether it's CardLink's `::after` or a button, stretches to the
 * nearest positioned ancestor.
 *
 * It lives here rather than beside CardLink for the reason hooks live apart
 * from components in this project -- oxlint's fast-refresh rule fires on a file
 * that exports both a component and something else.
 */
export const CARD_SURFACE =
  'relative transition-colors hover:bg-muted hover:ring-foreground/20'

/**
 * The invisible button laid over a card whose target is a dialog rather than a
 * route -- the stats box, the character's banner, a move row. `CardLink` is the
 * anchor version of the same idea, and gets its pointer for free; a button's
 * cursor is the default arrow under Tailwind's preflight, so it has to say so.
 *
 * The ring is drawn inset because the button *is* the card's area: a ring on
 * the outside would sit on top of whatever is next to it.
 */
export const CARD_SURFACE_OVERLAY =
  'absolute inset-0 cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50'

/**
 * The empty half of a progress bar.
 *
 * Deliberately **not** `bg-muted`, which is what CARD_SURFACE tints a card to
 * on hover: an HP bar sitting on a hovered card was drawing its track in
 * exactly the colour behind it, so an empty bar disappeared and a half-full one
 * lost its right-hand side. A translucent tint of the foreground can't collide
 * with anything, because it's a step away from whatever it's drawn on --
 * `bg-card`, the hover, or the board's bare background. Same reasoning as the
 * `ring-foreground/10` a Card already carries.
 *
 * The height is the caller's: an experience bar is thinner than a health one.
 */
export const METER_TRACK = 'w-full overflow-hidden rounded-full bg-foreground/10'
