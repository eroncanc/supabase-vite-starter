// The matching rule behind every pick list's filter box. Small, but the kind of
// small that's wrong quietly: a filter that ORs its terms instead of ANDing
// them still returns rows, just the wrong ones -- so every case below uses a
// fixture where the two answers differ.
import { describe, expect, it } from 'vitest'

import { matchesFilter } from '@/lib/filter'

describe('matchesFilter', () => {
  it('matches nothing typed against everything', () => {
    expect(matchesFilter('', ['Pikachu'])).toBe(true)
    expect(matchesFilter('   ', ['Pikachu'])).toBe(true)
  })

  it('matches a substring of any one field', () => {
    expect(matchesFilter('kach', ['Pikachu', 'Electric'])).toBe(true)
    expect(matchesFilter('lectr', ['Pikachu', 'Electric'])).toBe(true)
    expect(matchesFilter('water', ['Pikachu', 'Electric'])).toBe(false)
  })

  it('ignores case and accents', () => {
    expect(matchesFilter('POKEMON', ['Pokémon'])).toBe(true)
    expect(matchesFilter('pokémon', ['Pokemon'])).toBe(true)
  })

  it('requires every term, in any order', () => {
    // "pika" is in the first row only and "fire" in the second, so an OR would
    // match both rows here and an AND matches neither.
    const pikachu = ['Pikachu', 'Electric']
    const charizard = ['Charizard', 'Fire']

    expect(matchesFilter('pika fire', pikachu)).toBe(false)
    expect(matchesFilter('pika fire', charizard)).toBe(false)

    expect(matchesFilter('char fire', charizard)).toBe(true)
    expect(matchesFilter('fire char', charizard)).toBe(true)
  })

  it('skips fields that aren’t there', () => {
    // A wild combatant has no typing yet, and a move may deal none.
    expect(matchesFilter('ratt', ['Rattata', null, undefined])).toBe(true)
    expect(matchesFilter('normal', ['Rattata', null, undefined])).toBe(false)
  })
})
