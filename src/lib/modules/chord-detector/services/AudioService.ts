// AudioService.ts
// Domain: Chord Detector / Audio
// Implements microphone access, audio context, analyser node management with robust error handling and resource cleanup.

export class AudioService {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isRunning = false;

  /**
   * Requests microphone access and initializes audio processing nodes.
   * Throws error if permission denied or device unavailable.
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.sourceNode.connect(this.analyserNode);
      this.isRunning = true;
    } catch (err: any) {
      this.cleanup();
      if (err && err.name === 'NotAllowedError') {
        throw new Error('Microphone access denied by user.');
      } else if (err && err.name === 'NotFoundError') {
        throw new Error('No audio input device found.');
      } else {
        throw new Error('Failed to initialize audio input: ' + (err?.message || err));
      }
    }
  }

  /**
   * Stops audio processing and releases all resources.
   */
  stop(): void {
    this.cleanup();
    this.isRunning = false;
  }

  /**
   * Returns the current AnalyserNode instance, or null if not started.
   */
  getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  /**
   * Internal: Cleans up all audio resources and closes the context.
   */
  private cleanup() {
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch {}
      this.sourceNode = null;
    }
    if (this.analyserNode) {
      try { this.analyserNode.disconnect(); } catch {}
      this.analyserNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      this.mediaStream = null;
    }
    if (this.audioContext) {
      try { this.audioContext.close(); } catch {}
      this.audioContext = null;
    }
  }
}
