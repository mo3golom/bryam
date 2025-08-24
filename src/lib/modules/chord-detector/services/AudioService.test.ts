// AudioService.test.ts
// Unit tests for AudioService (microphone, AudioContext, error handling, resource cleanup)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioService } from './AudioService';


vi.stubGlobal('navigator', {
  mediaDevices: {
    getUserMedia: vi.fn()
  }
});

vi.stubGlobal('AudioContext', vi.fn().mockImplementation(() => ({
  createMediaStreamSource: vi.fn().mockReturnValue({ connect: vi.fn(), disconnect: vi.fn() }),
  createAnalyser: vi.fn().mockReturnValue({
    fftSize: 0,
    connect: vi.fn(),
    disconnect: vi.fn()
  }),
  close: vi.fn()
})));

describe('AudioService', () => {
  let service: AudioService;
  let mockStream: any;
  let mockSourceNode: any;
  let mockAnalyserNode: any;
  let mockAudioContext: any;

  beforeEach(() => {
    service = new AudioService();
    mockSourceNode = { connect: vi.fn(), disconnect: vi.fn() };
    mockAnalyserNode = { fftSize: 0, connect: vi.fn(), disconnect: vi.fn() };
    mockAudioContext = {
      createMediaStreamSource: vi.fn().mockReturnValue(mockSourceNode),
      createAnalyser: vi.fn().mockReturnValue(mockAnalyserNode),
      close: vi.fn()
    };
    (global.AudioContext as any).mockImplementation(() => mockAudioContext);
    mockStream = {
      getTracks: vi.fn().mockReturnValue([
        { stop: vi.fn() },
        { stop: vi.fn() }
      ])
    };
    (navigator.mediaDevices.getUserMedia as any).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('requests microphone permission and initializes audio nodes', async () => {
    (navigator.mediaDevices.getUserMedia as any).mockResolvedValue(mockStream);
    await service.start();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(global.AudioContext).toHaveBeenCalled();
    expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockStream);
    expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
    expect(service.getAnalyserNode()).toBe(mockAnalyserNode);
  });

  it('throws error if microphone permission denied', async () => {
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValue({ name: 'NotAllowedError' });
    await expect(service.start()).rejects.toThrow('Microphone access denied by user.');
    expect(service.getAnalyserNode()).toBeNull();
  });

  it('throws error if no audio input device found', async () => {
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValue({ name: 'NotFoundError' });
    await expect(service.start()).rejects.toThrow('No audio input device found.');
    expect(service.getAnalyserNode()).toBeNull();
  });

  it('throws generic error for other failures', async () => {
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValue({ name: 'OtherError', message: 'fail' });
    await expect(service.start()).rejects.toThrow('Failed to initialize audio input: fail');
    expect(service.getAnalyserNode()).toBeNull();
  });

  it('cleans up resources on stop', async () => {
    (navigator.mediaDevices.getUserMedia as any).mockResolvedValue(mockStream);
    await service.start();
    service.stop();
    expect(mockSourceNode.disconnect).toHaveBeenCalled();
    expect(mockAnalyserNode.disconnect).toHaveBeenCalled();
    expect(mockStream.getTracks).toHaveBeenCalled();
    expect(mockAudioContext.close).toHaveBeenCalled();
    expect(service.getAnalyserNode()).toBeNull();
  });

  it('is idempotent: start() twice does not re-initialize', async () => {
    (navigator.mediaDevices.getUserMedia as any).mockResolvedValue(mockStream);
    await service.start();
    await service.start();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
  });
});
