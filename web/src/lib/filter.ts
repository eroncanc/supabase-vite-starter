/**
 * Client-side filtering for the pick lists (the cast, a battle's side, a
 * moveset). A game holds tens of rows, not thousands, so every list is already
 * in memory and there is nothing to ask the server.
 */

/**
 * How long a list has to get before a filter box is worth showing above it.
 * Below this the whole list is on screen and a search field is just one more
 * thing between you and the tap you came to make.
 *
 * Five, because eight was tuned against the seeded dev game and a real one is
 * smaller: a party plus a couple of rivals never crossed it, so the filter
 * looked broken on a phone when it was only being polite.
 */
export const FILTER_THRESHOLD = 5

/**
 * Does a row match what was typed? Every whitespace-separated term has to
 * appear somewhere in the row's fields, so "pika thun" finds Pikachu's
 * Thunderbolt while the terms can be typed in either order.
 *
 * Case and accents are ignored -- "pokemon" should find "Pokémon", and nobody
 * reaches for the accent key mid-game.
 */
export function matchesFilter(
  query: string,
  fields: (string | null | undefined)[]
): boolean {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true

  const haystack = normalize(fields.filter(Boolean).join(' '))
  return terms.every((term) => haystack.includes(term))
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}
