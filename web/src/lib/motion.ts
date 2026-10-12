// Whether to animate at all.
//
// Shared, because two places ask: the dice tray refuses to start at all without
// motion -- there is no point building a physics engine to draw a still frame --
// and the catch theatre plays its beat in one step instead of four. Two copies
// of a media query is two places to forget the `reduce` keyword.
export function wantsMotion(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
