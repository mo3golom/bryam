/**
 * TempoScrollEngine
 *
 * A framework-agnostic engine that advances through a parsed song based on BPM.
 * It exposes a simple public API and a snapshot-style `state` getter that can be
 * observed by UI code (for example a Svelte component).
 */
import type { ParsedSong } from './chordpro'

export interface TempoScrollEngineState {
  isActive: boolean
  isPaused: boolean
  currentBpm: number
  activeLineIndex: number
  activeChordIndex: number
}

export class TempoScrollEngine {
  private parsedSong: ParsedSong
  private beatsPerChord: number
  private lineDurationsMs: number[] = []
  private cumulativeLineEndsMs: number[] = []

  // timing
  private rafId: number | null = null
  private startTimeMs = 0
  private pausedElapsedMs = 0

  // internal mutable state
  private _state: TempoScrollEngineState

  constructor(parsedSong: ParsedSong, initialBpm = 120, beatsPerChord = 4) {
    this.parsedSong = parsedSong
    this.beatsPerChord = beatsPerChord

    this._state = {
      isActive: false,
      isPaused: false,
      currentBpm: initialBpm,
      activeLineIndex: 0,
      activeChordIndex: 0
    }

    this.recalculateDurations()
  }

  // Public read-only view of the mutable state (returns the live object)
  get state(): TempoScrollEngineState {
    return this._state
  }

  // Controls
  start(): void {
    if (this._state.isActive && !this._state.isPaused) return

    this._state.isActive = true
    this._state.isPaused = false

    // If we previously paused, resume from pausedElapsedMs
    this.startTimeMs = performance.now() - this.pausedElapsedMs
    this.pausedElapsedMs = 0

    this.scheduleTick()
  }

  stop(): void {
    this._state.isActive = false
    this._state.isPaused = false
    this._state.activeLineIndex = 0
    this._state.activeChordIndex = 0

    this.clearTick()
    this.startTimeMs = 0
    this.pausedElapsedMs = 0
  }

  pause(): void {
    if (!this._state.isActive || this._state.isPaused) return
    this._state.isPaused = true
    this._state.isActive = false
    // Record elapsed so we can resume
    this.pausedElapsedMs = performance.now() - this.startTimeMs
    this.clearTick()
  }

  resume(): void {
    if (!this._state.isPaused) return
    this._state.isPaused = false
    this._state.isActive = true
    this.startTimeMs = performance.now() - this.pausedElapsedMs
    this.pausedElapsedMs = 0
    this.scheduleTick()
  }

  setBpm(newBpm: number): void {
    if (!Number.isFinite(newBpm) || newBpm <= 0) return
    this._state.currentBpm = newBpm
    this.recalculateDurations()
    // keep the current progress consistent by adjusting startTime
    // compute elapsed and make it consistent with new durations
    const elapsed = performance.now() - this.startTimeMs
    const progress = this.findPositionFromElapsed(elapsed)
    // reset startTime so that subsequent ticks use the same elapsed baseline
    this.startTimeMs = performance.now() - progress.elapsedMs
  }

  // --- internal helpers ---
  private recalculateDurations(): void {
    const bpm = this._state.currentBpm
    const lines = this.parsedSong?.lines || []
    this.lineDurationsMs = lines.map(line => {
      const chordCount = line?.metadata?.chordCount ?? 0
      return calculateLineDuration(bpm, chordCount, this.beatsPerChord)
    })

    // compute cumulative ends
    this.cumulativeLineEndsMs = []
    let acc = 0
    for (const d of this.lineDurationsMs) {
      acc += d
      this.cumulativeLineEndsMs.push(acc)
    }
  }

  private scheduleTick(): void {
    if (this.rafId != null) return
    const loop = () => {
      this.rafId = requestAnimationFrame(loop)
      this.tick()
    }
    this.rafId = requestAnimationFrame(loop)
  }

  private clearTick(): void {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private tick(): void {
    if (!this._state.isActive) return

    const now = performance.now()
    const elapsed = Math.max(0, now - this.startTimeMs)

    const { lineIndex, chordIndex } = this.findPositionFromElapsed(elapsed)

    // update state only when changed
    if (lineIndex !== this._state.activeLineIndex) {
      this._state.activeLineIndex = lineIndex
    }
    if (chordIndex !== this._state.activeChordIndex) {
      this._state.activeChordIndex = chordIndex
    }

    // If we've reached the end, stop the engine
    const totalDuration = this.cumulativeLineEndsMs.length
      ? this.cumulativeLineEndsMs[this.cumulativeLineEndsMs.length - 1]
      : 0
    if (totalDuration > 0 && elapsed >= totalDuration) {
      this.stop()
    }
  }

  private findPositionFromElapsed(elapsedMs: number): { lineIndex: number; chordIndex: number; elapsedMs: number } {
    if (!this.cumulativeLineEndsMs.length) return { lineIndex: 0, chordIndex: 0, elapsedMs: 0 }

    // find first cumulative end greater than elapsed
    let lineIndex = this.cumulativeLineEndsMs.findIndex(end => elapsedMs < end)
    if (lineIndex === -1) {
      lineIndex = this.cumulativeLineEndsMs.length - 1
    }

    const lineStartMs = lineIndex === 0 ? 0 : this.cumulativeLineEndsMs[lineIndex - 1]
    const lineElapsed = Math.max(0, elapsedMs - lineStartMs)
    const lineDuration = this.lineDurationsMs[lineIndex] || 0

    const chordCount = this.parsedSong?.lines?.[lineIndex]?.metadata?.chordCount ?? 0
    const chordIndex = chordCount > 0 && lineDuration > 0
      ? Math.min(chordCount - 1, Math.floor((lineElapsed / lineDuration) * chordCount))
      : 0

    return { lineIndex, chordIndex, elapsedMs }
  }
}

/**
 * Calculate duration of a line in milliseconds:
 * lineDurationInMs = (chordCount * beatsPerChord * 60 * 1000) / bpm
 */
export function calculateLineDuration(bpm: number, chordCount: number, beatsPerChord = 4): number {
  const safeChordCount = Math.max(0, Math.floor(chordCount || 0))
  if (safeChordCount === 0) return 0
  const minutesPerBeat = 1 / bpm
  const beatsTotal = safeChordCount * beatsPerChord
  const durationMs = beatsTotal * minutesPerBeat * 60 * 1000
  return Math.max(0, durationMs)
}
