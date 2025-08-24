import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PitchDetectionService } from './PitchDetectionService';
import * as TonalNote from '@tonaljs/note';

// Hold a reference to the mock detector
const findPitch = vi.fn();
const mockPitchDetector = {
  findPitch,
  clarityThreshold: 0.8,
};

vi.mock('pitchy', () => ({
  PitchDetector: {
    forFloat32Array: vi.fn(() => mockPitchDetector),
  },
}));

// Mock @tonaljs/note
vi.mock('@tonaljs/note', async () => {
  const actual = await vi.importActual<typeof TonalNote>('@tonaljs/note');
  return {
    ...actual,
    fromFreq: vi.fn(),
  };
});

// Mock global browser APIs
const mockAudioContext = {
  sampleRate: 44100,
};

const mockAnalyserNode = {
  fftSize: 1024,
  getFloatTimeDomainData: vi.fn(),
};

describe('PitchDetectionService', () => {
  let service: PitchDetectionService;
  let analyserNode: any;
  let audioContext: any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    mockPitchDetector.findPitch.mockReturnValue([0, 0]);

    analyserNode = { ...mockAnalyserNode, getFloatTimeDomainData: vi.fn() };
    audioContext = { ...mockAudioContext };
    service = new PitchDetectionService(analyserNode, audioContext);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set default clarity threshold if not provided', () => {
    expect(service['clarityThreshold']).toBe(0.8);
  });

  it('should set custom clarity threshold if provided', () => {
    const customService = new PitchDetectionService(analyserNode, audioContext, { clarityThreshold: 0.95 });
    expect(customService['clarityThreshold']).toBe(0.95);
  });

  describe('subscription', () => {
    it('should subscribe and unsubscribe a callback', () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribeToNotes(callback);
      expect(service['callbacks'].has(callback)).toBe(true);
      unsubscribe();
      expect(service['callbacks'].has(callback)).toBe(false);
    });
  });

  describe('audio processing', () => {
    it('should call callback with null if clarity is below threshold', () => {
      mockPitchDetector.findPitch.mockReturnValue([440, 0.7]);

      const callback = vi.fn();
      service.subscribeToNotes(callback);
      service.start();

      service['processAudio']();

      expect(callback).toHaveBeenCalledWith(null);
    });

    it('should call callbacks with null if no pitch is detected', () => {
      mockPitchDetector.findPitch.mockReturnValue([0, 0.9]);

      const callback = vi.fn();
      service.subscribeToNotes(callback);
      service.start();

      service['processAudio']();

      expect(callback).toHaveBeenCalledWith(null);
    });

    it('should call callbacks with the detected note', () => {
      mockPitchDetector.findPitch.mockReturnValue([440, 0.9]);
      vi.mocked(TonalNote.fromFreq).mockReturnValue('A4');

      const callback = vi.fn();
      service.subscribeToNotes(callback);
      service.start();

      service['processAudio']();

      expect(callback).toHaveBeenCalledWith('A4');
      expect(TonalNote.fromFreq).toHaveBeenCalledWith(440);
    });
  });

  describe('start and stop', () => {
    it('should start processing audio', () => {
      service.start();
      expect(service['running']).toBe(true);
    });

    it('should stop processing audio', () => {
      service.start();
      service.stop();
      expect(service['running']).toBe(false);
    });

    it('should call requestAnimationFrame on start', () => {
      const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((() => 1) as any);
      service.start();
      expect(requestAnimationFrameSpy).toHaveBeenCalled();
    });

    it('should call cancelAnimationFrame on stop', () => {
      const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');
      service.start();
      service.stop();
      expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    });
  });
});
