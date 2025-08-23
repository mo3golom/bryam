export interface SongListItem {
  id: string
  title: string
  artist: string | null
}

export interface Song {
  id: string
  title: string
  artist: string | null
  body: string
}

// Chord Recognition Domain - Bounded Context
// Following Domain Driven Design principles for chord recognition feature

/**
 * Represents a recognized chord with confidence and frequency information
 */
export interface RecognizedChord {
  name: string // e.g., "C", "Am", "F", "G7"
  type: ChordType
  confidence: number // 0-1 confidence level
  frequencies: number[] // detected frequencies
  rootNote: string
  quality: ChordQuality
  timestamp: number // when chord was recognized
}

/**
 * Enumeration of chord types supported by the recognition system
 */
export enum ChordType {
  MAJOR = 'major',
  MINOR = 'minor',
  SEVENTH = 'seventh',
  DIMINISHED = 'diminished',
  AUGMENTED = 'augmented',
  SUSPENDED = 'suspended'
}

/**
 * Quality assessment of the recognized chord
 */
export enum ChordQuality {
  PERFECT = 'perfect',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

/**
 * Audio frequency analysis data from FFT processing
 */
export interface FrequencyData {
  frequencies: Float32Array
  magnitude: Float32Array
  sampleRate: number
  timestamp: number
}

/**
 * Represents a harmonic component of an audio signal
 */
export interface Harmonic {
  frequency: number
  amplitude: number
  note: string
  octave: number
}

/**
 * Result of chord pattern matching against templates
 */
export interface ChordMatch {
  chordName: string
  score: number // matching score 0-1
  harmonics: Harmonic[]
  template: ChordTemplate
}

/**
 * Template definition for chord recognition
 */
export interface ChordTemplate {
  name: string
  type: ChordType
  intervals: number[] // semitone intervals from root
  frequencies: number[] // expected frequencies for standard tuning
  weight: number // importance weight for matching
}

/**
 * Microphone permission states
 */
export enum MicrophonePermission {
  PENDING = 'pending',
  GRANTED = 'granted',
  DENIED = 'denied'
}

/**
 * Error types specific to chord recognition
 */
export enum ChordRecognitionError {
  MICROPHONE_ACCESS_DENIED = 'microphone_access_denied',
  AUDIO_CONTEXT_FAILED = 'audio_context_failed',
  PROCESSING_ERROR = 'processing_error',
  UNSUPPORTED_BROWSER = 'unsupported_browser',
  INSUFFICIENT_AUDIO = 'insufficient_audio'
}

/**
 * Configuration for audio processing
 */
export interface AudioProcessingConfig {
  fftSize: number
  smoothingTimeConstant: number
  minDecibels: number
  maxDecibels: number
  sampleRate: number
}

/**
 * Browser support information for chord recognition features
 */
export interface BrowserSupport {
  supported: boolean
  missing: string[]
  hasWebAudio: boolean
  hasMediaDevices: boolean
  hasRequestAnimationFrame: boolean
}