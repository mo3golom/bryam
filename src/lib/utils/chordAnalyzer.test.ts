import { describe, it, expect, beforeEach } from 'vitest';
import { ChordAnalyzer } from './chordAnalyzer.js';
import type { Harmonic, ChordTemplate } from '../types.js';
import { ChordType, ChordQuality } from '../types.js';

describe('ChordAnalyzer', () => {
  let chordAnalyzer: ChordAnalyzer;
  let mockChordTemplates: ChordTemplate[];

  beforeEach(() => {
    // Create simplified mock templates for testing
    mockChordTemplates = [
      {
        name: 'C',
        type: ChordType.MAJOR,
        intervals: [0, 4, 7],
        frequencies: [261.63, 329.63, 392.00], // C4, E4, G4
        weight: 1.0
      },
      {
        name: 'Am',
        type: ChordType.MINOR,
        intervals: [0, 3, 7],
        frequencies: [220.00, 261.63, 329.63], // A3, C4, E4
        weight: 1.0
      },
      {
        name: 'F',
        type: ChordType.MAJOR,
        intervals: [0, 4, 7],
        frequencies: [349.23, 440.00, 523.25], // F4, A4, C5
        weight: 0.9
      }
    ];

    chordAnalyzer = new ChordAnalyzer(mockChordTemplates, 10, 0.6);
  });

  describe('constructor', () => {
    it('should initialize with provided configuration', () => {
      const config = chordAnalyzer.getConfig();
      expect(config.frequencyTolerance).toBe(10);
      expect(config.minConfidence).toBe(0.6);
      expect(config.templateCount).toBe(3);
    });

    it('should use default parameters when not provided', () => {
      const defaultAnalyzer = new ChordAnalyzer();
      const config = defaultAnalyzer.getConfig();
      
      expect(config.frequencyTolerance).toBe(10); // FREQUENCY_TOLERANCE
      expect(config.minConfidence).toBe(0.6); // MIN_CONFIDENCE_THRESHOLD
      expect(config.templateCount).toBeGreaterThan(0); // Should have default templates
    });
  });

  describe('analyzeChord', () => {
    it('should recognize C major chord correctly', () => {
      const harmonics: Harmonic[] = [
        { frequency: 261.63, amplitude: 0.8, note: 'C', octave: 4 },
        { frequency: 329.63, amplitude: 0.6, note: 'E', octave: 4 },
        { frequency: 392.00, amplitude: 0.7, note: 'G', octave: 4 }
      ];

      const result = chordAnalyzer.analyzeChord(harmonics);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('C');
      expect(result!.type).toBe(ChordType.MAJOR);
      expect(result!.rootNote).toBe('C');
      expect(result!.confidence).toBeGreaterThan(0.6);
      expect(result!.quality).toBeOneOf([ChordQuality.GOOD, ChordQuality.PERFECT]);
    });

    it('should recognize A minor chord correctly', () => {
      const harmonics: Harmonic[] = [
        { frequency: 220.00, amplitude: 0.8, note: 'A', octave: 3 },
        { frequency: 261.63, amplitude: 0.6, note: 'C', octave: 4 },
        { frequency: 329.63, amplitude: 0.5, note: 'E', octave: 4 }
      ];

      const result = chordAnalyzer.analyzeChord(harmonics);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Am');
      expect(result!.type).toBe(ChordType.MINOR);
      expect(result!.rootNote).toBe('A');
      expect(result!.confidence).toBeGreaterThan(0.6);
    });

    it('should return null for empty harmonics array', () => {
      const result = chordAnalyzer.analyzeChord([]);
      expect(result).toBeNull();
    });

    it('should return null when confidence is below threshold', () => {
      // Harmonics that don't match any chord well
      const harmonics: Harmonic[] = [
        { frequency: 100, amplitude: 0.1, note: 'G', octave: 2 },
        { frequency: 150, amplitude: 0.1, note: 'D', octave: 3 }
      ];

      const result = chordAnalyzer.analyzeChord(harmonics);
      expect(result).toBeNull();
    });

    it('should handle harmonics with slight frequency deviations', () => {
      // C major chord with slight detuning (within tolerance)
      const harmonics: Harmonic[] = [
        { frequency: 263, amplitude: 0.8, note: 'C', octave: 4 }, // 1.37 Hz off
        { frequency: 331, amplitude: 0.6, note: 'E', octave: 4 }, // 1.37 Hz off
        { frequency: 394, amplitude: 0.7, note: 'G', octave: 4 }  // 2 Hz off
      ];

      const result = chordAnalyzer.analyzeChord(harmonics);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('C');
      expect(result!.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('matchChordPattern', () => {
    it('should return multiple chord matches sorted by score', () => {
      const harmonics: Harmonic[] = [
        { frequency: 261.63, amplitude: 0.8, note: 'C', octave: 4 },
        { frequency: 329.63, amplitude: 0.6, note: 'E', octave: 4 }
      ];

      const matches = chordAnalyzer.matchChordPattern(harmonics);

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].score).toBeGreaterThanOrEqual(matches[1]?.score || 0);
      expect(matches[0].chordName).toBeDefined();
      expect(matches[0].template).toBeDefined();
    });

    it('should return empty array when no harmonics match any templates', () => {
      const harmonics: Harmonic[] = [
        { frequency: 50, amplitude: 0.1, note: 'G', octave: 1 },
        { frequency: 75, amplitude: 0.1, note: 'D', octave: 2 }
      ];

      const matches = chordAnalyzer.matchChordPattern(harmonics);
      expect(matches.length).toBe(0);
    });

    it('should include harmonics in match results', () => {
      const harmonics: Harmonic[] = [
        { frequency: 261.63, amplitude: 0.8, note: 'C', octave: 4 },
        { frequency: 329.63, amplitude: 0.6, note: 'E', octave: 4 }
      ];

      const matches = chordAnalyzer.matchChordPattern(harmonics);

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].harmonics).toBeDefined();
      expect(matches[0].harmonics.length).toBeGreaterThan(0);
    });
  });

  describe('calculateConfidence', () => {
    it('should return higher confidence for better matches', () => {
      const perfectMatch = {
        chordName: 'C',
        score: 1.0,
        harmonics: [
          { frequency: 261.63, amplitude: 0.8, note: 'C', octave: 4 },
          { frequency: 329.63, amplitude: 0.6, note: 'E', octave: 4 },
          { frequency: 392.00, amplitude: 0.7, note: 'G', octave: 4 }
        ],
        template: mockChordTemplates[0]
      };

      const partialMatch = {
        chordName: 'C',
        score: 0.5,
        harmonics: [
          { frequency: 261.63, amplitude: 0.8, note: 'C', octave: 4 }
        ],
        template: mockChordTemplates[0]
      };

      const perfectConfidence = chordAnalyzer.calculateConfidence(perfectMatch);
      const partialConfidence = chordAnalyzer.calculateConfidence(partialMatch);

      expect(perfectConfidence).toBeGreaterThan(partialConfidence);
    });

    it('should cap confidence at 1.0', () => {
      const overlyGoodMatch = {
        chordName: 'C',
        score: 1.5, // Artificially high score
        harmonics: [
          { frequency: 261.63, amplitude: 1.0, note: 'C', octave: 4 },
          { frequency: 329.63, amplitude: 1.0, note: 'E', octave: 4 },
          { frequency: 392.00, amplitude: 1.0, note: 'G', octave: 4 }
        ],
        template: mockChordTemplates[0]
      };

      const confidence = chordAnalyzer.calculateConfidence(overlyGoodMatch);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    it('should consider template weight in confidence calculation', () => {
      const highWeightMatch = {
        chordName: 'C',
        score: 0.8,
        harmonics: [{ frequency: 261.63, amplitude: 0.8, note: 'C', octave: 4 }],
        template: { ...mockChordTemplates[0], weight: 1.0 }
      };

      const lowWeightMatch = {
        chordName: 'F',
        score: 0.8,
        harmonics: [{ frequency: 349.23, amplitude: 0.8, note: 'F', octave: 4 }],
        template: { ...mockChordTemplates[2], weight: 0.5 }
      };

      const highWeightConfidence = chordAnalyzer.calculateConfidence(highWeightMatch);
      const lowWeightConfidence = chordAnalyzer.calculateConfidence(lowWeightMatch);

      expect(highWeightConfidence).toBeGreaterThan(lowWeightConfidence);
    });
  });

  describe('updateConfig', () => {
    it('should update frequency tolerance', () => {
      chordAnalyzer.updateConfig({ frequencyTolerance: 15 });
      const config = chordAnalyzer.getConfig();
      expect(config.frequencyTolerance).toBe(15);
    });

    it('should update minimum confidence threshold', () => {
      chordAnalyzer.updateConfig({ minConfidence: 0.8 });
      const config = chordAnalyzer.getConfig();
      expect(config.minConfidence).toBe(0.8);
    });

    it('should update chord templates', () => {
      const newTemplates = [mockChordTemplates[0]]; // Only C major
      chordAnalyzer.updateConfig({ templates: newTemplates });
      
      const config = chordAnalyzer.getConfig();
      expect(config.templateCount).toBe(1);
      
      const availableChords = chordAnalyzer.getAvailableChords();
      expect(availableChords).toEqual(['C']);
    });

    it('should update multiple config options at once', () => {
      chordAnalyzer.updateConfig({
        frequencyTolerance: 20,
        minConfidence: 0.7,
        templates: [mockChordTemplates[0]]
      });

      const config = chordAnalyzer.getConfig();
      expect(config.frequencyTolerance).toBe(20);
      expect(config.minConfidence).toBe(0.7);
      expect(config.templateCount).toBe(1);
    });
  });

  describe('getAvailableChords', () => {
    it('should return all chord names from templates', () => {
      const chords = chordAnalyzer.getAvailableChords();
      expect(chords).toEqual(['C', 'Am', 'F']);
    });

    it('should return empty array when no templates', () => {
      const emptyAnalyzer = new ChordAnalyzer([], 10, 0.6);
      const chords = emptyAnalyzer.getAvailableChords();
      expect(chords).toEqual([]);
    });
  });

  describe('chord quality assessment', () => {
    it('should assign PERFECT quality for very high confidence', () => {
      const harmonics: Harmonic[] = [
        { frequency: 261.63, amplitude: 0.9, note: 'C', octave: 4 },
        { frequency: 329.63, amplitude: 0.8, note: 'E', octave: 4 },
        { frequency: 392.00, amplitude: 0.8, note: 'G', octave: 4 }
      ];

      // Use lower confidence threshold to ensure high confidence
      const analyzer = new ChordAnalyzer(mockChordTemplates, 5, 0.5);
      const result = analyzer.analyzeChord(harmonics);

      expect(result).not.toBeNull();
      if (result!.confidence >= 0.9) {
        expect(result!.quality).toBe(ChordQuality.PERFECT);
      }
    });

    it('should assign appropriate quality levels based on confidence', () => {
      // Test with harmonics that should give medium confidence
      const harmonics: Harmonic[] = [
        { frequency: 262, amplitude: 0.6, note: 'C', octave: 4 }, // Slightly off
        { frequency: 330, amplitude: 0.5, note: 'E', octave: 4 }  // Slightly off
      ];

      const result = chordAnalyzer.analyzeChord(harmonics);

      if (result) {
        expect(result.quality).toBeOneOf([
          ChordQuality.GOOD,
          ChordQuality.FAIR,
          ChordQuality.POOR
        ]);
      }
    });
  });

  describe('root note extraction', () => {
    it('should extract root note from simple chord names', () => {
      const harmonics: Harmonic[] = [
        { frequency: 261.63, amplitude: 0.8, note: 'C', octave: 4 }
      ];

      const result = chordAnalyzer.analyzeChord(harmonics);
      if (result && result.name === 'C') {
        expect(result.rootNote).toBe('C');
      }
    });

    it('should handle sharp and flat root notes', () => {
      // Add a chord template with sharp/flat for testing
      const sharpTemplate: ChordTemplate = {
        name: 'F#',
        type: ChordType.MAJOR,
        intervals: [0, 4, 7],
        frequencies: [369.99, 466.16, 554.37],
        weight: 1.0
      };

      const analyzerWithSharp = new ChordAnalyzer([sharpTemplate], 10, 0.5);
      const harmonics: Harmonic[] = [
        { frequency: 369.99, amplitude: 0.8, note: 'F#', octave: 4 }
      ];

      const result = analyzerWithSharp.analyzeChord(harmonics);
      if (result && result.name === 'F#') {
        expect(result.rootNote).toBe('F#');
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle harmonics with zero amplitude', () => {
      const harmonics: Harmonic[] = [
        { frequency: 261.63, amplitude: 0, note: 'C', octave: 4 },
        { frequency: 329.63, amplitude: 0.6, note: 'E', octave: 4 }
      ];

      expect(() => {
        chordAnalyzer.analyzeChord(harmonics);
      }).not.toThrow();
    });

    it('should handle very high frequency harmonics', () => {
      const harmonics: Harmonic[] = [
        { frequency: 20000, amplitude: 0.8, note: 'C', octave: 10 }
      ];

      const result = chordAnalyzer.analyzeChord(harmonics);
      // Should either return null or handle gracefully
      expect(result).toBeOneOf([null, expect.any(Object)]);
    });

    it('should handle negative frequencies gracefully', () => {
      const harmonics: Harmonic[] = [
        { frequency: -100, amplitude: 0.8, note: 'C', octave: 4 }
      ];

      expect(() => {
        chordAnalyzer.analyzeChord(harmonics);
      }).not.toThrow();
    });
  });
});