// A deterministic hash, for the decisions that have to be made by chance and
// then stay made.
//
// Math.random() is wrong for all of them: it re-decides on every render and
// lands differently after a reload, so the turn order would move under you and
// the music would change mid-battle. Seeding on something the battle already
// owns -- the event's id, the turn number -- gives the same answer every time
// the same question is asked, which is what "it was decided" means.
//
// Never reach for this where the roll is *stored*. A damage roll happens once
// and lives in stat_deltas, so a real random is correct there.

/** FNV-1a, 32-bit. Fast, no dependencies, and spreads a short id well enough. */
export function seedHash(seed: string): number {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
