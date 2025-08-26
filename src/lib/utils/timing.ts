/**
 * Calculate the duration of a line (in milliseconds) based on tempo and chord count.
 *
 * Formula:
 *   lineDurationInMs = (chordCount * beatsPerChord * 60 * 1000) / bpm
 *
 * Defaults to 4 beats per chord (typical for 4/4 time).
 */
export function calculateLineDuration(
  bpm: number,
  chordCount: number,
  beatsPerChord = 4
): number {
  if (!Number.isFinite(bpm) || bpm <= 0) {
    throw new RangeError('bpm must be a positive number')
  }
  if (!Number.isFinite(chordCount) || chordCount < 0) {
    throw new RangeError('chordCount must be a non-negative number')
  }
  if (!Number.isFinite(beatsPerChord) || beatsPerChord <= 0) {
    throw new RangeError('beatsPerChord must be a positive number')
  }

  const minutesPerBeat = 60 / bpm // seconds per beat
  const msPerBeat = minutesPerBeat * 1000
  const totalBeats = chordCount * beatsPerChord
  return totalBeats * msPerBeat
}

export default calculateLineDuration
