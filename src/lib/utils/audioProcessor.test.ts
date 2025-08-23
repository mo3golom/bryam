import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioProcessor } from './audioProcessor.js';
import type { AudioProcessingConfig } from '../types.js';

describe('AudioProcessor', () => {
  let audioProcessor: AudioProcessor;
  let defaultConfig: AudioProcessingConfig;

  beforeEach(() => {
    defaultConfig = {
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      minDecibels: -90,
      maxDecibels: -10,
      sampleRate: 44100
    };
    audioProcessor = new AudioProcessor(defaultConfig);
  });

  describe('constructor', () => {
    it('should initialize with provided configuration', () => {
      const config = audioProcessor.getConfig();
      expect(config).toEqual(defaultConfig);
    });

    it('should create necessary buffers and FFT instance', () => {
      expect(audioProcessor).toBeDefined();
      expect(typeof audioProcessor.processAudioFrame).toBe('function');
    });
  });

  describe('processAudioFrame', () => {
    it('should process frequency data and return frequency domain data', () => {
      // Create mock frequency domain data (simulating AnalyserNode output)
      const frequencyData = new Float32Array(1024); // Half of fftSize (2048)
      
      // Add some test frequency peaks
      frequencyData[20] = 0.8; // Peak at bin 20
      frequencyData[40] = 0.6; // Peak at bin 40
      frequencyData[80] = 0.4; // Peak at bin 80

      const result = audioProcessor.processAudioFrame(frequencyData);

      expect(result).toBeDefined();
      expect(result.frequencies).toBeInstanceOf(Float32Array);
      expect(result.magnitude).toBeInstanceOf(Float32Array);
      expect(result.sampleRate).toBe(44100);
      expect(result.timestamp).toBeTypeOf('number');
      expect(result.frequencies.length).toBe(1024);
    });

    it('should throw error for incorrect buffer size', () => {
      const wrongSizeData = new Float32Array(512); // Wrong size (should be 1024)
      
      expect(() => {
        audioProcessor.processAudioFrame(wrongSizeData);
      }).toThrow('Expected 1024 frequency bins, got 512');
    });

    it('should copy frequency data correctly', () => {
      const frequencyData = new Float32Array(1024);
      frequencyData[100] = 0.9;
      frequencyData[200] = 0.7;
      
      const result = audioProcessor.processAudioFrame(frequencyData);
      
      expect(result.frequencies[100]).toBeCloseTo(0.9, 5);
      expect(result.frequencies[200]).toBeCloseTo(0.7, 5);
    });
  });

  describe('detectFundamentalFrequency', () => {
    it('should detect the fundamental frequency of a pure tone', () => {
      // Create frequency data with a peak at 440Hz
      const mockFreqData = {
        frequencies: new Float32Array(1024),
        magnitude: new Float32Array(1024),
        sampleRate: 44100,
        timestamp: Date.now()
      };

      // Add a peak at 440Hz (bin ≈ 20 for 44100Hz sample rate)
      const targetBin = Math.floor(440 * 1024 / (44100 / 2));
      mockFreqData.magnitude[targetBin] = 1.0;
      mockFreqData.magnitude[targetBin - 1] = 0.5;
      mockFreqData.magnitude[targetBin + 1] = 0.5;

      const fundamental = audioProcessor.detectFundamentalFrequency(mockFreqData);
      
      // Should be close to 440Hz (within reasonable tolerance)
      expect(fundamental).toBeGreaterThan(430);
      expect(fundamental).toBeLessThan(450);
    });

    it('should return 0 for frequencies below musical range', () => {
      const mockFreqData = {
        frequencies: new Float32Array(1024),
        magnitude: new Float32Array(1024),
        sampleRate: 44100,
        timestamp: Date.now()
      };

      // Add peak at very low frequency (50Hz)
      const targetBin = Math.floor(50 * 1024 / (44100 / 2));
      mockFreqData.magnitude[targetBin] = 1.0;

      const fundamental = audioProcessor.detectFundamentalFrequency(mockFreqData);
      expect(fundamental).toBe(0);
    });

    it('should handle noisy signals by using threshold detection', () => {
      const mockFreqData = {
        frequencies: new Float32Array(1024),
        magnitude: new Float32Array(1024),
        sampleRate: 44100,
        timestamp: Date.now()
      };

      // Add uniform noise
      for (let i = 0; i < mockFreqData.magnitude.length; i++) {
        mockFreqData.magnitude[i] = Math.random() * 0.1;
      }

      // Add significant peak at 220Hz
      const targetBin = Math.floor(220 * 1024 / (44100 / 2));
      mockFreqData.magnitude[targetBin] = 0.8;
      mockFreqData.magnitude[targetBin - 1] = 0.4;
      mockFreqData.magnitude[targetBin + 1] = 0.4;

      const fundamental = audioProcessor.detectFundamentalFrequency(mockFreqData);
      expect(fundamental).toBeGreaterThan(210);
      expect(fundamental).toBeLessThan(230);
    });
  });

  describe('extractHarmonics', () => {
    it('should extract harmonics for a given fundamental frequency', () => {
      const mockFreqData = {
        frequencies: new Float32Array(1024),
        magnitude: new Float32Array(1024),
        sampleRate: 44100,
        timestamp: Date.now()
      };

      const fundamentalFreq = 220; // A3
      const freqStep = 44100 / (2 * 1024);

      // Add harmonics at expected frequencies
      [1, 2, 3, 4].forEach(harmonic => {
        const freq = fundamentalFreq * harmonic;
        const bin = Math.round(freq / freqStep);
        if (bin < mockFreqData.magnitude.length) {
          mockFreqData.magnitude[bin] = 1.0 / harmonic; // Decreasing amplitude
        }
      });

      const harmonics = audioProcessor.extractHarmonics(fundamentalFreq, mockFreqData);

      expect(harmonics.length).toBeGreaterThan(0);
      expect(harmonics[0].frequency).toBeCloseTo(fundamentalFreq, -1); // Allow ±10 Hz tolerance
      expect(harmonics[0].note).toBe('A');
      expect(harmonics[0].octave).toBe(3);
    });

    it('should return empty array for very low fundamental frequencies', () => {
      const mockFreqData = {
        frequencies: new Float32Array(1024),
        magnitude: new Float32Array(1024),
        sampleRate: 44100,
        timestamp: Date.now()
      };

      const harmonics = audioProcessor.extractHarmonics(50, mockFreqData); // Too low
      expect(harmonics).toEqual([]);
    });

    it('should include only significant harmonics above noise floor', () => {
      const mockFreqData = {
        frequencies: new Float32Array(1024),
        magnitude: new Float32Array(1024),
        sampleRate: 44100,
        timestamp: Date.now()
      };

      // Add low-level noise
      mockFreqData.magnitude.fill(0.01);

      const fundamentalFreq = 440;
      const freqStep = 44100 / (2 * 1024);
      
      // Add only fundamental and first harmonic above noise threshold
      const fundBin = Math.round(fundamentalFreq / freqStep);
      const secondBin = Math.round((fundamentalFreq * 2) / freqStep);
      
      mockFreqData.magnitude[fundBin] = 0.8;
      mockFreqData.magnitude[secondBin] = 0.4;

      const harmonics = audioProcessor.extractHarmonics(fundamentalFreq, mockFreqData);

      expect(harmonics.length).toBe(2);
      expect(harmonics[0].amplitude).toBeGreaterThan(harmonics[1].amplitude);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration partially', () => {
      const newConfig = { sampleRate: 48000, smoothingTimeConstant: 0.9 };
      audioProcessor.updateConfig(newConfig);

      const config = audioProcessor.getConfig();
      expect(config.sampleRate).toBe(48000);
      expect(config.smoothingTimeConstant).toBe(0.9);
      expect(config.fftSize).toBe(2048); // Should remain unchanged
    });

    it('should recreate buffers when fftSize changes', () => {
      const originalConfig = audioProcessor.getConfig();
      expect(originalConfig.fftSize).toBe(2048);

      audioProcessor.updateConfig({ fftSize: 4096 });

      const newConfig = audioProcessor.getConfig();
      expect(newConfig.fftSize).toBe(4096);

      // Should be able to process with new size
      const frequencyData = new Float32Array(2048); // Half of new fftSize
      frequencyData.fill(0.5);
      
      expect(() => {
        audioProcessor.processAudioFrame(frequencyData);
      }).not.toThrow();
    });
  });

  describe('frequency to note conversion', () => {
    it('should convert frequencies to correct musical notes', () => {
      const mockFreqData = {
        frequencies: new Float32Array(1024),
        magnitude: new Float32Array(1024),
        sampleRate: 44100,
        timestamp: Date.now()
      };

      // Test A4 = 440Hz
      const freqStep = 44100 / (2 * 1024);
      const bin440 = Math.round(440 / freqStep);
      mockFreqData.magnitude[bin440] = 1.0;

      const harmonics = audioProcessor.extractHarmonics(440, mockFreqData);
      
      expect(harmonics.length).toBeGreaterThan(0);
      expect(harmonics[0].note).toBe('A');
      expect(harmonics[0].octave).toBe(4);
    });

    it('should handle edge cases in frequency conversion', () => {
      const mockFreqData = {
        frequencies: new Float32Array(1024),
        magnitude: new Float32Array(1024),
        sampleRate: 44100,
        timestamp: Date.now()
      };

      // Test C4 = 261.63Hz
      const freqStep = 44100 / (2 * 1024);
      const binC4 = Math.round(261.63 / freqStep);
      mockFreqData.magnitude[binC4] = 1.0;

      const harmonics = audioProcessor.extractHarmonics(261.63, mockFreqData);
      
      if (harmonics.length > 0) {
        expect(harmonics[0].note).toBe('C');
        expect(harmonics[0].octave).toBe(4);
      }
    });
  });

  describe('noise floor calculation', () => {
    it('should handle various signal levels correctly', () => {
      // This test verifies the private method indirectly through detectFundamentalFrequency
      const mockFreqData = {
        frequencies: new Float32Array(1024),
        magnitude: new Float32Array(1024),
        sampleRate: 44100,
        timestamp: Date.now()
      };

      // Create a signal with mixed noise and signal
      for (let i = 0; i < mockFreqData.magnitude.length; i++) {
        mockFreqData.magnitude[i] = Math.random() * 0.1; // Noise floor
      }

      // Add a clear signal above noise
      const targetBin = Math.floor(300 * 1024 / (44100 / 2));
      mockFreqData.magnitude[targetBin] = 0.8;
      mockFreqData.magnitude[targetBin - 1] = 0.4;
      mockFreqData.magnitude[targetBin + 1] = 0.4;

      const fundamental = audioProcessor.detectFundamentalFrequency(mockFreqData);
      expect(fundamental).toBeGreaterThan(0); // Should detect the signal
    });
  });
});