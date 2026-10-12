// The matching rule behind every pick list's filter box. Small, but the kind of
// small that's wrong quietly: a filter that ORs its terms instead of ANDing
// them still returns rows, just the wrong ones -- so every case below uses a
// fixture where the two answers differ.
import { describe, expect, it } from 'vitest'

import { matchesFilter } from '@/lib/filter'

describe('matchesFilter', () => {
  it('matches nothing typed against everything', () => {
    expect(matchesFilter('', ['Lovelace'])).toBe(true)
    expect(matchesFilter('   ', ['Lovelace'])).toBe(true)
  })

  it('matches a substring of any one field', () => {
    expect(matchesFilter('vela', ['Lovelace', 'Mathematics'])).toBe(true)
    expect(matchesFilter('themat', ['Lovelace', 'Mathematics'])).toBe(true)
    expect(matchesFilter('physics', ['Lovelace', 'Mathematics'])).toBe(false)
  })

  it('ignores case and accents', () => {
    expect(matchesFilter('CAFE', ['Café'])).toBe(true)
    expect(matchesFilter('café', ['Cafe'])).toBe(true)
  })

  it('requires every term, in any order', () => {
    // "love" is in the first row only and "physics" in the second, so an OR
    // would match both rows here and an AND matches neither.
    const lovelace = ['Lovelace', 'Mathematics']
    const curie = ['Curie', 'Physics']

    expect(matchesFilter('love physics', lovelace)).toBe(false)
    expect(matchesFilter('love physics', curie)).toBe(false)

    expect(matchesFilter('cur physics', curie)).toBe(true)
    expect(matchesFilter('physics cur', curie)).toBe(true)
  })

  it('skips fields that aren’t there', () => {
    // An optional column comes back null, or absent from a partial row.
    expect(matchesFilter('turi', ['Turing', null, undefined])).toBe(true)
    expect(matchesFilter('logic', ['Turing', null, undefined])).toBe(false)
  })
})
