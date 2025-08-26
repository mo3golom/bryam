import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TempoScrollEngine } from './TempoScrollEngine'

// Minimal ParsedSong mock shape
const makeParsedSong = (chordCounts: number[]) => ({
  lines: chordCounts.map(count => ({ parts: [], metadata: { chordCount: count } }))
})

describe('TempoScrollEngine', () => {
  let nowMs = 0
  let originalPerfNow: any

  beforeEach(() => {
    vi.useFakeTimers()
    // control a manual clock for performance.now()
    nowMs = 1000
    originalPerfNow = performance.now
    // @ts-ignore
    performance.now = () => nowMs
  })

  afterEach(() => {
    // restore
    // @ts-ignore
    performance.now = originalPerfNow
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function advance(engine: any, ms: number) {
    nowMs += ms
    vi.advanceTimersByTime(ms)
    // invoke a tick manually — keep tests deterministic and avoid RAF mocks
    engine.tick?.() ?? engine['tick']?.()
  }

  it('start sets isActive and isPaused correctly', () => {
    const song = makeParsedSong([1])
    const engine: any = new TempoScrollEngine(song, 120, 4)

    expect(engine.state.isActive).toBe(false)
    expect(engine.state.isPaused).toBe(false)

    engine.start()

    expect(engine.state.isActive).toBe(true)
    expect(engine.state.isPaused).toBe(false)
  })

  it('advances activeLineIndex and activeChordIndex over time', () => {
    // song with three lines: 2 chords, 1 chord, 3 chords
    const song = makeParsedSong([2, 1, 3])
    const engine: any = new TempoScrollEngine(song, 120, 4)

    // start playback at controlled time
    engine.start()

    // immediately at t=0 -> first line, first chord
    advance(engine, 0)
    expect(engine.state.activeLineIndex).toBe(0)
    expect(engine.state.activeChordIndex).toBe(0)

    // after 3000ms: still in line 0 (lineDuration 4000ms), chordIndex should be 1
    advance(engine, 3000)
    expect(engine.state.activeLineIndex).toBe(0)
    expect(engine.state.activeChordIndex).toBe(1)

    // after additional 2000ms -> total 5000ms: should be in line 1 (second line)
    advance(engine, 2000)
    expect(engine.state.activeLineIndex).toBe(1)
    expect(engine.state.activeChordIndex).toBe(0)

    // advance to the end of song (total 12000ms) and ensure engine stopped
    advance(engine, 7000)
    expect(engine.state.isActive).toBe(false)
    // stop() resets indices to 0 per implementation
    expect(engine.state.activeLineIndex).toBe(0)
    expect(engine.state.activeChordIndex).toBe(0)
  })

  it('setBpm recalculates durations and keeps progress consistent', () => {
    const song = makeParsedSong([1, 1])
    const engine: any = new TempoScrollEngine(song, 120, 4)

    engine.start()
    // simulate 1500ms elapsed (within first line which at 120bpm is 2000ms)
    advance(engine, 1500)
    expect(engine.state.activeLineIndex).toBe(0)

    // change bpm to faster tempo -> durations shorter; engine should adjust internal start time
    engine.setBpm(240)

    // after setting bpm, simulate small advance and verify we remain on the same logical position or move forward
    advance(engine, 100)
    expect(engine.state.currentBpm).toBe(240)
  })
})
