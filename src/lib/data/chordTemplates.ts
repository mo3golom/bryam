import type { ChordTemplate } from '../types.js';
import { ChordType } from '../types.js';

/**
 * Ukulele Chord Templates for Recognition
 * Standard tuning: G-C-E-A (4th to 1st string)
 * Based on scientific pitch notation frequencies
 */

// Note frequencies in Hz (4th octave)
const NOTE_FREQUENCIES = {
  'C': 261.63,
  'C#': 277.18,
  'D': 293.66,
  'D#': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F#': 369.99,
  'G': 392.00,
  'G#': 415.30,
  'A': 440.00,
  'A#': 466.16,
  'B': 493.88
} as const;

/**
 * Calculate frequency for a note in any octave
 */
function getNoteFrequency(note: string, octave: number): number {
  const baseFreq = NOTE_FREQUENCIES[note as keyof typeof NOTE_FREQUENCIES];
  if (!baseFreq) throw new Error(`Unknown note: ${note}`);
  
  // A4 = 440Hz is in octave 4, adjust accordingly
  return baseFreq * Math.pow(2, octave - 4);
}

/**
 * Common ukulele chord templates with frequency patterns
 * Each template includes the most prominent frequencies expected
 */
export const UKULELE_CHORD_TEMPLATES: ChordTemplate[] = [
  // Major Chords
  {
    name: 'C',
    type: ChordType.MAJOR,
    intervals: [0, 4, 7], // C-E-G
    frequencies: [
      getNoteFrequency('C', 4), // C4 - 261.63 Hz
      getNoteFrequency('E', 4), // E4 - 329.63 Hz
      getNoteFrequency('G', 4), // G4 - 392.00 Hz
      getNoteFrequency('C', 5)  // C5 - 523.25 Hz (octave)
    ],
    weight: 1.0
  },
  {
    name: 'F',
    type: ChordType.MAJOR,
    intervals: [0, 4, 7], // F-A-C
    frequencies: [
      getNoteFrequency('F', 4), // F4 - 349.23 Hz
      getNoteFrequency('A', 4), // A4 - 440.00 Hz
      getNoteFrequency('C', 5), // C5 - 523.25 Hz
      getNoteFrequency('F', 5)  // F5 - 698.46 Hz
    ],
    weight: 1.0
  },
  {
    name: 'G',
    type: ChordType.MAJOR,
    intervals: [0, 4, 7], // G-B-D
    frequencies: [
      getNoteFrequency('G', 4), // G4 - 392.00 Hz
      getNoteFrequency('B', 4), // B4 - 493.88 Hz
      getNoteFrequency('D', 5), // D5 - 587.33 Hz
      getNoteFrequency('G', 5)  // G5 - 783.99 Hz
    ],
    weight: 1.0
  },
  {
    name: 'D',
    type: ChordType.MAJOR,
    intervals: [0, 4, 7], // D-F#-A
    frequencies: [
      getNoteFrequency('D', 4),   // D4 - 293.66 Hz
      getNoteFrequency('F#', 4),  // F#4 - 369.99 Hz
      getNoteFrequency('A', 4),   // A4 - 440.00 Hz
      getNoteFrequency('D', 5)    // D5 - 587.33 Hz
    ],
    weight: 0.9
  },
  {
    name: 'A',
    type: ChordType.MAJOR,
    intervals: [0, 4, 7], // A-C#-E
    frequencies: [
      getNoteFrequency('A', 3),   // A3 - 220.00 Hz
      getNoteFrequency('C#', 4),  // C#4 - 277.18 Hz
      getNoteFrequency('E', 4),   // E4 - 329.63 Hz
      getNoteFrequency('A', 4)    // A4 - 440.00 Hz
    ],
    weight: 0.9
  },
  {
    name: 'E',
    type: ChordType.MAJOR,
    intervals: [0, 4, 7], // E-G#-B
    frequencies: [
      getNoteFrequency('E', 4),   // E4 - 329.63 Hz
      getNoteFrequency('G#', 4),  // G#4 - 415.30 Hz
      getNoteFrequency('B', 4),   // B4 - 493.88 Hz
      getNoteFrequency('E', 5)    // E5 - 659.25 Hz
    ],
    weight: 0.8
  },

  // Minor Chords
  {
    name: 'Am',
    type: ChordType.MINOR,
    intervals: [0, 3, 7], // A-C-E
    frequencies: [
      getNoteFrequency('A', 3), // A3 - 220.00 Hz
      getNoteFrequency('C', 4), // C4 - 261.63 Hz
      getNoteFrequency('E', 4), // E4 - 329.63 Hz
      getNoteFrequency('A', 4)  // A4 - 440.00 Hz
    ],
    weight: 1.0
  },
  {
    name: 'Dm',
    type: ChordType.MINOR,
    intervals: [0, 3, 7], // D-F-A
    frequencies: [
      getNoteFrequency('D', 4), // D4 - 293.66 Hz
      getNoteFrequency('F', 4), // F4 - 349.23 Hz
      getNoteFrequency('A', 4), // A4 - 440.00 Hz
      getNoteFrequency('D', 5)  // D5 - 587.33 Hz
    ],
    weight: 1.0
  },
  {
    name: 'Em',
    type: ChordType.MINOR,
    intervals: [0, 3, 7], // E-G-B
    frequencies: [
      getNoteFrequency('E', 4), // E4 - 329.63 Hz
      getNoteFrequency('G', 4), // G4 - 392.00 Hz
      getNoteFrequency('B', 4), // B4 - 493.88 Hz
      getNoteFrequency('E', 5)  // E5 - 659.25 Hz
    ],
    weight: 0.9
  },

  // Seventh Chords
  {
    name: 'G7',
    type: ChordType.SEVENTH,
    intervals: [0, 4, 7, 10], // G-B-D-F
    frequencies: [
      getNoteFrequency('G', 4), // G4 - 392.00 Hz
      getNoteFrequency('B', 4), // B4 - 493.88 Hz
      getNoteFrequency('D', 5), // D5 - 587.33 Hz
      getNoteFrequency('F', 5)  // F5 - 698.46 Hz
    ],
    weight: 0.8
  },
  {
    name: 'C7',
    type: ChordType.SEVENTH,
    intervals: [0, 4, 7, 10], // C-E-G-Bb
    frequencies: [
      getNoteFrequency('C', 4),   // C4 - 261.63 Hz
      getNoteFrequency('E', 4),   // E4 - 329.63 Hz
      getNoteFrequency('G', 4),   // G4 - 392.00 Hz
      getNoteFrequency('A#', 4)   // A#4 (Bb4) - 466.16 Hz
    ],
    weight: 0.8
  },
  {
    name: 'F7',
    type: ChordType.SEVENTH,
    intervals: [0, 4, 7, 10], // F-A-C-Eb
    frequencies: [
      getNoteFrequency('F', 4),   // F4 - 349.23 Hz
      getNoteFrequency('A', 4),   // A4 - 440.00 Hz
      getNoteFrequency('C', 5),   // C5 - 523.25 Hz
      getNoteFrequency('D#', 5)   // D#5 (Eb5) - 622.25 Hz
    ],
    weight: 0.7
  }
];

/**
 * Get chord template by name
 */
export function getChordTemplate(name: string): ChordTemplate | undefined {
  return UKULELE_CHORD_TEMPLATES.find(template => template.name === name);
}

/**
 * Get all chord templates of a specific type
 */
export function getChordTemplatesByType(type: ChordType): ChordTemplate[] {
  return UKULELE_CHORD_TEMPLATES.filter(template => template.type === type);
}

/**
 * Get chord names for quick lookup
 */
export function getAllChordNames(): string[] {
  return UKULELE_CHORD_TEMPLATES.map(template => template.name);
}

/**
 * Frequency tolerance for chord matching (in Hz)
 */
export const FREQUENCY_TOLERANCE = 10; // ±10 Hz

/**
 * Minimum confidence threshold for chord recognition
 */
export const MIN_CONFIDENCE_THRESHOLD = 0.6;

/**
 * Audio processing configuration for chord recognition
 */
export const AUDIO_CONFIG = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
  sampleRate: 44100
} as const;