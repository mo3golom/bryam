/**
 * TempoScrollEngine
 *
 * A framework-agnostic engine that advances through a parsed song based on BPM.
 * It exposes a simple public API and a snapshot-style `state` getter that can be
 * observed by UI code (for example a Svelte component).
 */
import { get } from 'svelte/store'
import type { ParsedSong } from './chordpro'

export interface TempoScrollEngineState {
  isActive: boolean
  isPaused: boolean
  currentBpm: number
  activeLineIndex: number
  activeChordIndex: number
}

const log = (...args: any[]) => console.log('[TempoScrollEngine]', ...args)

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
  private onStateChange: (state: TempoScrollEngineState) => void

  constructor(parsedSong: ParsedSong, onStateChange: (state: TempoScrollEngineState) => void, initialBpm = 120, beatsPerChord = 4) {
    this.parsedSong = parsedSong
    this.beatsPerChord = beatsPerChord
    this.onStateChange = onStateChange

    this._state = {
      isActive: false,
      isPaused: false,
      currentBpm: initialBpm,
      activeLineIndex: 0,
      activeChordIndex: 0
    }

    log('Engine initialized with BPM:', initialBpm, 'Beats per chord:', beatsPerChord)
    this.recalculateDurations()
  }


  // Controls
  start(): void {
    log('Attempting to start engine. Current state:', this._state)
    if (this._state.isActive && !this._state.isPaused) return

    this._state.isActive = true
    this._state.isPaused = false
    this.onStateChange(this._state)

    // If we previously paused, resume from pausedElapsedMs
    this.startTimeMs = performance.now() - this.pausedElapsedMs
    this.pausedElapsedMs = 0

    this.scheduleTick()
    log('Engine started. Start time:', this.startTimeMs)
  }

  stop(): void {
    log('Attempting to stop engine. Current state:', this._state)
    this._state.isActive = false
    this._state.isPaused = false
    this._state.activeLineIndex = 0
    this._state.activeChordIndex = 0
    this.onStateChange(this._state)

    this.clearTick()
    this.startTimeMs = 0
    this.pausedElapsedMs = 0
    log('Engine stopped and reset.')
  }

  pause(): void {
    if (!this._state.isActive || this._state.isPaused) return
    log('Pausing engine. Current state:', this._state)
    this._state.isPaused = true
    this._state.isActive = false
    this.onStateChange(this._state)
    // Record elapsed so we can resume
    this.pausedElapsedMs = performance.now() - this.startTimeMs
    this.clearTick()
  }

  resume(): void {
    log('Attempting to resume engine. Current state:', this._state)
    if (!this._state.isPaused) return
    this._state.isPaused = false
    this._state.isActive = true
    this.onStateChange(this._state)
    this.startTimeMs = performance.now() - this.pausedElapsedMs
    this.pausedElapsedMs = 0
    this.scheduleTick()
    log('Engine resumed. New start time:', this.startTimeMs)
  }

  setBpm(newBpm: number): void {
    log('Attempting to set BPM to:', newBpm, 'Current BPM:', this._state.currentBpm)
    if (!Number.isFinite(newBpm) || newBpm <= 0) return
    
    // Preserve current position before changing BPM
    const currentLineIndex = this._state.activeLineIndex
    const currentChordIndex = this._state.activeChordIndex
    
    this._state.currentBpm = newBpm
    this.onStateChange(this._state)
    this.recalculateDurations()
    
    // Calculate elapsed time to current position with new durations
    let elapsedToCurrentPosition = 0
    
    // Add time for completed lines
    for (let i = 0; i < currentLineIndex; i++) {
      elapsedToCurrentPosition += this.lineDurationsMs[i] || 0
    }
    
    // Add time for current chord within current line
    const currentLineDuration = this.lineDurationsMs[currentLineIndex] || 0
    const currentLineChordCount = this.parsedSong?.lines?.[currentLineIndex]?.metadata?.chordCount ?? 0
    if (currentLineChordCount > 0 && currentLineDuration > 0) {
      const chordDuration = currentLineDuration / currentLineChordCount
      elapsedToCurrentPosition += currentChordIndex * chordDuration
    }
    
    // Adjust startTime to maintain current position with new speed
    this.startTimeMs = performance.now() - elapsedToCurrentPosition
    
    log('BPM set to:', newBpm, 'Maintaining position at line:', currentLineIndex, 'chord:', currentChordIndex, 'Adjusted start time:', this.startTimeMs)
  }

  jumpToLine(lineIndex: number): void {
    log('Attempting to jump to line:', lineIndex)
    if (lineIndex < 0 || lineIndex >= this.parsedSong.lines.length) {
      log('Invalid line index:', lineIndex, 'Valid range: 0 to', this.parsedSong.lines.length - 1)
      return
    }

    // Update state to new line
    this._state.activeLineIndex = lineIndex
    this._state.activeChordIndex = 0 // Reset to first chord of the line
    this.onStateChange(this._state)

    // If engine is active, adjust timing to continue from new position
    if (this._state.isActive) {
      // Calculate elapsed time to the new position
      let elapsedToNewPosition = 0
      for (let i = 0; i < lineIndex; i++) {
        elapsedToNewPosition += this.lineDurationsMs[i] || 0
      }
      
      // Adjust start time so that the new position becomes "now"
      this.startTimeMs = performance.now() - elapsedToNewPosition
      log('Jumped to line:', lineIndex, 'Adjusted start time:', this.startTimeMs)
    }
  }

  // --- internal helpers ---
  private recalculateDurations(): void {
    log('Recalculating line durations...')
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
    log('Durations recalculated. Line durations:', this.lineDurationsMs, 'Cumulative ends:', this.cumulativeLineEndsMs)
  }

  private scheduleTick(): void {
    log('Scheduling next tick...')
    if (this.rafId != null) return
    const loop = () => {
      this.rafId = requestAnimationFrame(loop)
      this.tick()
    }
    this.rafId = requestAnimationFrame(loop)
  }

  private clearTick(): void {
    if (this.rafId != null) {
      log('Clearing scheduled tick (rafId:', this.rafId, ')')
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
    let stateChanged = false
    if (lineIndex !== this._state.activeLineIndex) {
      log('Line index changed from', this._state.activeLineIndex, 'to', lineIndex)
      this._state.activeLineIndex = lineIndex
      stateChanged = true
    }
    if (chordIndex !== this._state.activeChordIndex) {
      log('Chord index changed from', this._state.activeChordIndex, 'to', chordIndex)
      this._state.activeChordIndex = chordIndex
      stateChanged = true
    }

    if (stateChanged) {
      this.onStateChange(this._state)
    }

    // If we've reached the end, stop the engine
    const totalDuration = this.cumulativeLineEndsMs.length
      ? this.cumulativeLineEndsMs[this.cumulativeLineEndsMs.length - 1]
      : 0
    if (totalDuration > 0 && elapsed >= totalDuration) {
      log('Reached end of song (elapsed:', elapsed, 'total duration:', totalDuration, '). Stopping engine.')
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
  const secondsPerChord = beatsPerChord * 60 / bpm
  return Math.max(0, safeChordCount * (secondsPerChord * 1000))
}
