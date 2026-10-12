// The one testable part of the upload path. Canvas and network belong to the
// browser and are verified by actually uploading a photo; the arithmetic that
// decides how big the stored file is can be checked here.
//
// Worth a suite because it is easy to be wrong in a way that still looks
// plausible: scaling by the *short* edge, or by width unconditionally, still
// produces a smaller image -- just one that either blows past the cap or
// squashes a portrait. Every expected value below is worked out by hand.
import { describe, expect, it } from 'vitest'

import { MAX_EDGE, resizeDimensions } from '@/lib/images'

describe('resizeDimensions', () => {
  it('scales a landscape image by its width', () => {
    // 4000x3000 over a 1000 cap: scale 0.25, so 3000 -> 750.
    expect(resizeDimensions(4000, 3000, 1000)).toEqual({
      width: 1000,
      height: 750,
    })
  })

  it('scales a portrait image by its height', () => {
    // The mirror case, and the one a width-only implementation gets wrong: it
    // would leave the height at 4000, well over the cap.
    expect(resizeDimensions(3000, 4000, 1000)).toEqual({
      width: 750,
      height: 1000,
    })
  })

  it('scales a square image on both edges', () => {
    expect(resizeDimensions(2048, 2048, 512)).toEqual({
      width: 512,
      height: 512,
    })
  })

  it('leaves an image already under the cap alone', () => {
    // Not 1000x750. Enlarging a small drawing spends bytes to add blur, so the
    // cap is a maximum, never a target.
    expect(resizeDimensions(320, 240, 1000)).toEqual({ width: 320, height: 240 })
  })

  it('leaves an image exactly at the cap alone', () => {
    expect(resizeDimensions(1000, 400, 1000)).toEqual({
      width: 1000,
      height: 400,
    })
  })

  it('rounds a fractional edge rather than truncating it', () => {
    // 1000x333 over a 300 cap: scale 0.3, so 333 -> 99.9. Rounds to 100; a
    // floor would say 99.
    expect(resizeDimensions(1000, 333, 300)).toEqual({ width: 300, height: 100 })
  })

  it('never rounds a very thin image down to a zero edge', () => {
    // 4000x3 over a 1000 cap: scale 0.25 puts the height at 0.75, which rounds
    // to 1. A canvas of height 0 throws, so the floor of 1 is load-bearing.
    expect(resizeDimensions(4000, 3, 1000)).toEqual({ width: 1000, height: 1 })
  })

  it('defaults to MAX_EDGE', () => {
    expect(resizeDimensions(4096, 2048)).toEqual({
      width: MAX_EDGE,
      height: MAX_EDGE / 2,
    })
  })
})
