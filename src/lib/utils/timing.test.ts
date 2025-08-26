import { describe, it, expect } from 'vitest'
import { calculateLineDuration } from './timing'

describe('calculateLineDuration', () => {
  it('calculates duration for typical values', () => {
    // bpm 120, 1 chord, 4 beats -> (1*4*60*1000)/120 = 2000 ms
    expect(calculateLineDuration(120, 1)).toBe(2000)

    // bpm 60, 2 chords, 4 beats -> (2*4*60*1000)/60 = 8000 ms
    expect(calculateLineDuration(60, 2)).toBe(8000)
  })

  it('supports custom beatsPerChord', () => {
    // bpm 120, 1 chord, 2 beats -> (1*2*60*1000)/120 = 1000 ms
    expect(calculateLineDuration(120, 1, 2)).toBe(1000)
  })

  it('throws on invalid inputs', () => {
    // invalid bpm
    expect(() => calculateLineDuration(0, 1)).toThrow()
    expect(() => calculateLineDuration(-10, 1)).toThrow()

    // invalid chordCount
    expect(() => calculateLineDuration(120, -1)).toThrow()

    // invalid beatsPerChord
    expect(() => calculateLineDuration(120, 1, 0)).toThrow()
  })
})
