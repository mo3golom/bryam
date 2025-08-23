import type { FrequencyData, Harmonic, AudioProcessingConfig } from '../types.js';

/**
 * AudioProcessor class for real-time audio analysis and frequency detection
 * Responsible for frequency analysis and harmonic extraction from audio signals
 * Uses Web Audio API's built-in FFT capabilities instead of external libraries
 */
export class AudioProcessor {
  private config: AudioProcessingConfig;
  private freqBuffer: Float32Array;
  private timeBuffer: Float32Array;

  constructor(config: AudioProcessingConfig) {
    this.config = config;
    this.freqBuffer = new Float32Array(this.config.fftSize / 2);
    this.timeBuffer = new Float32Array(this.config.fftSize);
  }

  /**
   * Process audio frame and convert to frequency domain
   * @param frequencyData - Frequency domain audio data from AnalyserNode
   * @returns FrequencyData with frequency spectrum and metadata
   */
  processAudioFrame(frequencyData: Float32Array): FrequencyData {
    // Ensure we have the right buffer size
    if (frequencyData.length !== this.config.fftSize / 2) {
      throw new Error(`Expected ${this.config.fftSize / 2} frequency bins, got ${frequencyData.length}`);
    }

    // Copy frequency data to our buffer
    this.freqBuffer.set(frequencyData);

    return {
      frequencies: new Float32Array(this.freqBuffer),
      magnitude: new Float32Array(this.freqBuffer),
      sampleRate: this.config.sampleRate,
      timestamp: Date.now()
    };
  }

  /**
   * Detect the fundamental frequency (pitch) from frequency data
   * Uses autocorrelation and peak detection
   */
  detectFundamentalFrequency(data: FrequencyData): number {
    const { magnitude, sampleRate } = data;
    const nyquist = sampleRate / 2;
    const freqStep = nyquist / (magnitude.length - 1);

    // Find the peak with highest magnitude above a threshold
    let maxMagnitude = 0;
    let fundamentalBin = 0;
    const threshold = this.calculateNoiseFloor(magnitude) * 3; // 3x noise floor

    // Search in typical musical range (80Hz - 2000Hz)
    const minBin = Math.floor(80 / freqStep);
    const maxBin = Math.floor(2000 / freqStep);

    for (let i = minBin; i < maxBin && i < magnitude.length; i++) {
      if (magnitude[i] > threshold && magnitude[i] > maxMagnitude) {
        // Check if this is a true peak (higher than neighbors)
        if (this.isPeak(magnitude, i)) {
          maxMagnitude = magnitude[i];
          fundamentalBin = i;
        }
      }
    }

    return fundamentalBin * freqStep;
  }

  /**
   * Extract harmonic components from frequency data
   * Identifies harmonics based on fundamental frequency
   */
  extractHarmonics(fundamentalFreq: number, data: FrequencyData): Harmonic[] {
    if (fundamentalFreq < 80) return []; // Too low to be musical

    const harmonics: Harmonic[] = [];
    const { magnitude, sampleRate } = data;
    const freqStep = sampleRate / (2 * magnitude.length);
    const tolerance = 10; // Hz tolerance for harmonic detection

    // Extract up to 6 harmonics
    for (let harmonic = 1; harmonic <= 6; harmonic++) {
      const targetFreq = fundamentalFreq * harmonic;
      const targetBin = Math.round(targetFreq / freqStep);

      if (targetBin >= magnitude.length) break;

      // Look for peak near expected harmonic frequency
      const searchRange = Math.ceil(tolerance / freqStep);
      let bestBin = targetBin;
      let bestMagnitude = magnitude[targetBin];

      for (let i = targetBin - searchRange; i <= targetBin + searchRange; i++) {
        if (i >= 0 && i < magnitude.length && magnitude[i] > bestMagnitude) {
          bestBin = i;
          bestMagnitude = magnitude[i];
        }
      }

      // Only include if magnitude is significant
      const noiseFloor = this.calculateNoiseFloor(magnitude);
      if (bestMagnitude > noiseFloor * 2) {
        const actualFreq = bestBin * freqStep;
        harmonics.push({
          frequency: actualFreq,
          amplitude: bestMagnitude,
          note: this.frequencyToNote(actualFreq),
          octave: this.frequencyToOctave(actualFreq)
        });
      }
    }

    return harmonics;
  }

  /**
   * Update processing configuration
   */
  updateConfig(newConfig: Partial<AudioProcessingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Recreate buffers if size changed
    if (newConfig.fftSize) {
      this.freqBuffer = new Float32Array(this.config.fftSize / 2);
      this.timeBuffer = new Float32Array(this.config.fftSize);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AudioProcessingConfig {
    return { ...this.config };
  }

  /**
   * Calculate noise floor for threshold detection
   */
  private calculateNoiseFloor(magnitude: Float32Array): number {
    // Use median as a robust estimate of noise floor
    const sorted = Array.from(magnitude).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.1)]; // 10th percentile
  }

  /**
   * Check if a given bin represents a peak
   */
  private isPeak(magnitude: Float32Array, bin: number): boolean {
    if (bin <= 0 || bin >= magnitude.length - 1) return false;
    
    return magnitude[bin] > magnitude[bin - 1] && 
           magnitude[bin] > magnitude[bin + 1];
  }

  /**
   * Convert frequency to musical note name
   */
  private frequencyToNote(frequency: number): string {
    const A4 = 440;
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    const semitoneOffset = Math.round(12 * Math.log2(frequency / A4)) + 9;
    const noteIndex = ((semitoneOffset % 12) + 12) % 12;
    
    return noteNames[noteIndex];
  }

  /**
   * Convert frequency to octave number
   */
  private frequencyToOctave(frequency: number): number {
    const A4 = 440;
    const semitoneOffset = Math.round(12 * Math.log2(frequency / A4)) + 9;
    return Math.floor(semitoneOffset / 12) + 4;
  }
}