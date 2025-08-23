import type { Harmonic, ChordMatch, RecognizedChord, ChordTemplate } from '../types.js';
import { ChordQuality } from '../types.js';
import { UKULELE_CHORD_TEMPLATES, FREQUENCY_TOLERANCE, MIN_CONFIDENCE_THRESHOLD } from '../data/chordTemplates.js';

/**
 * ChordAnalyzer class for analyzing harmonic content and matching against chord templates
 * Implements chord recognition logic using pattern matching and confidence scoring
 */
export class ChordAnalyzer {
  private chordTemplates: ChordTemplate[];
  private frequencyTolerance: number;
  private minConfidence: number;

  constructor(
    templates: ChordTemplate[] = UKULELE_CHORD_TEMPLATES,
    frequencyTolerance: number = FREQUENCY_TOLERANCE,
    minConfidence: number = MIN_CONFIDENCE_THRESHOLD
  ) {
    this.chordTemplates = templates;
    this.frequencyTolerance = frequencyTolerance;
    this.minConfidence = minConfidence;
  }

  /**
   * Analyze harmonics to identify the most likely chord
   * @param harmonics - Array of detected harmonic components
   * @returns RecognizedChord or null if no confident match found
   */
  analyzeChord(harmonics: Harmonic[]): RecognizedChord | null {
    if (harmonics.length === 0) {
      return null;
    }

    // Get all potential chord matches
    const matches = this.matchChordPattern(harmonics);
    
    if (matches.length === 0) {
      return null;
    }

    // Find the best match
    const bestMatch = matches.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    // Calculate confidence based on match quality
    const confidence = this.calculateConfidence(bestMatch);

    // Only return if confidence meets threshold
    if (confidence < this.minConfidence) {
      return null;
    }

    return {
      name: bestMatch.chordName,
      type: bestMatch.template.type,
      confidence,
      frequencies: bestMatch.harmonics.map(h => h.frequency),
      rootNote: this.extractRootNote(bestMatch.chordName),
      quality: this.determineChordQuality(confidence),
      timestamp: Date.now()
    };
  }

  /**
   * Match detected harmonics against all chord templates
   * @param harmonics - Detected harmonic components
   * @returns Array of chord matches with scores
   */
  matchChordPattern(harmonics: Harmonic[]): ChordMatch[] {
    const matches: ChordMatch[] = [];

    for (const template of this.chordTemplates) {
      const score = this.scoreChordMatch(harmonics, template);
      
      if (score > 0) {
        matches.push({
          chordName: template.name,
          score,
          harmonics: this.getMatchingHarmonics(harmonics, template),
          template
        });
      }
    }

    // Sort by score (highest first)
    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate confidence level for a chord match
   * @param match - Chord match result
   * @returns Confidence value between 0 and 1
   */
  calculateConfidence(match: ChordMatch): number {
    const baseScore = match.score;
    const harmonicCount = match.harmonics.length;
    const templateFreqCount = match.template.frequencies.length;
    
    // Factor in how many expected frequencies were matched
    const coverageBonus = harmonicCount / templateFreqCount;
    
    // Factor in template weight (some chords are more common/important)
    const weightBonus = match.template.weight;
    
    // Calculate final confidence (0-1 range)
    const confidence = Math.min(1.0, baseScore * coverageBonus * weightBonus);
    
    return Math.round(confidence * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Score how well harmonics match a chord template
   * @param harmonics - Detected harmonics
   * @param template - Chord template to match against
   * @returns Score value (0-1, higher is better)
   */
  private scoreChordMatch(harmonics: Harmonic[], template: ChordTemplate): number {
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const expectedFreq of template.frequencies) {
      maxPossibleScore += 1;
      
      // Find the closest harmonic to this expected frequency
      const closestHarmonic = this.findClosestHarmonic(harmonics, expectedFreq);
      
      if (closestHarmonic) {
        const frequencyDiff = Math.abs(closestHarmonic.frequency - expectedFreq);
        
        if (frequencyDiff <= this.frequencyTolerance) {
          // Score based on how close the frequency is and amplitude
          const frequencyScore = 1 - (frequencyDiff / this.frequencyTolerance);
          const amplitudeScore = Math.min(1, closestHarmonic.amplitude * 2); // Normalize amplitude
          
          totalScore += (frequencyScore * 0.7) + (amplitudeScore * 0.3);
        }
      }
    }

    return maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
  }

  /**
   * Find harmonics that match the chord template
   * @param harmonics - All detected harmonics
   * @param template - Chord template
   * @returns Harmonics that match the template
   */
  private getMatchingHarmonics(harmonics: Harmonic[], template: ChordTemplate): Harmonic[] {
    const matchingHarmonics: Harmonic[] = [];

    for (const expectedFreq of template.frequencies) {
      const closestHarmonic = this.findClosestHarmonic(harmonics, expectedFreq);
      
      if (closestHarmonic) {
        const frequencyDiff = Math.abs(closestHarmonic.frequency - expectedFreq);
        
        if (frequencyDiff <= this.frequencyTolerance) {
          matchingHarmonics.push(closestHarmonic);
        }
      }
    }

    return matchingHarmonics;
  }

  /**
   * Find the harmonic closest to a target frequency
   * @param harmonics - Array of harmonics to search
   * @param targetFreq - Target frequency to match
   * @returns Closest harmonic or null if none found
   */
  private findClosestHarmonic(harmonics: Harmonic[], targetFreq: number): Harmonic | null {
    let closest: Harmonic | null = null;
    let minDiff = Infinity;

    for (const harmonic of harmonics) {
      const diff = Math.abs(harmonic.frequency - targetFreq);
      if (diff < minDiff) {
        minDiff = diff;
        closest = harmonic;
      }
    }

    return closest;
  }

  /**
   * Extract root note from chord name
   * @param chordName - Full chord name (e.g., "Am", "C7", "F#")
   * @returns Root note (e.g., "A", "C", "F#")
   */
  private extractRootNote(chordName: string): string {
    // Handle sharps/flats in chord names
    if (chordName.length > 1 && (chordName[1] === '#' || chordName[1] === 'b')) {
      return chordName.substring(0, 2);
    }
    return chordName[0];
  }

  /**
   * Determine chord quality based on confidence level
   * @param confidence - Confidence score (0-1)
   * @returns ChordQuality assessment
   */
  private determineChordQuality(confidence: number): ChordQuality {
    if (confidence >= 0.9) return ChordQuality.PERFECT;
    if (confidence >= 0.75) return ChordQuality.GOOD;
    if (confidence >= 0.6) return ChordQuality.FAIR;
    return ChordQuality.POOR;
  }

  /**
   * Update analyzer configuration
   * @param config - New configuration options
   */
  updateConfig(config: {
    frequencyTolerance?: number;
    minConfidence?: number;
    templates?: ChordTemplate[];
  }): void {
    if (config.frequencyTolerance !== undefined) {
      this.frequencyTolerance = config.frequencyTolerance;
    }
    if (config.minConfidence !== undefined) {
      this.minConfidence = config.minConfidence;
    }
    if (config.templates !== undefined) {
      this.chordTemplates = config.templates;
    }
  }

  /**
   * Get current analyzer configuration
   */
  getConfig(): {
    frequencyTolerance: number;
    minConfidence: number;
    templateCount: number;
  } {
    return {
      frequencyTolerance: this.frequencyTolerance,
      minConfidence: this.minConfidence,
      templateCount: this.chordTemplates.length
    };
  }

  /**
   * Get all available chord names from templates
   */
  getAvailableChords(): string[] {
    return this.chordTemplates.map(template => template.name);
  }
}