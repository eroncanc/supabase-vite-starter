/**
 * Client-side filtering for pick lists. Built for lists of tens of rows, not
 * thousands, already in memory -- there is nothing to ask the server. A list
 * that outgrows that wants a server-side search instead.
 */

/**
 * How long a list has to get before a filter box is worth showing above it.
 * Below this the whole list is on screen and a search field is just one more
 * thing between you and the tap you came to make.
 */
export const FILTER_THRESHOLD = 5

/**
 * Does a row match what was typed? Every whitespace-separated term has to
 * appear somewhere in the row's fields, so "ada love" and "love ada" both find
 * Ada Lovelace.
 *
 * Case and accents are ignored -- "cafe" should find "Café", because nobody
 * reaches for the accent key on a phone.
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
