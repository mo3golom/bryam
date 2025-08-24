import { PitchDetector } from 'pitchy';
import * as Note from '@tonaljs/note';

export interface PitchDetectionServiceOptions {
  clarityThreshold?: number;
}

type NoteCallback = (note: string | null) => void;

export class PitchDetectionService {
  private analyserNode: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;
  private running = false;
  private clarityThreshold: number;
  private callbacks: Set<NoteCallback> = new Set();
  private animationFrameId: number | null = null;
  private pitchDetector: PitchDetector<Float32Array> | null = null;

  constructor(analyserNode: AnalyserNode, audioContext: AudioContext, options?: PitchDetectionServiceOptions) {
    this.analyserNode = analyserNode;
    this.audioContext = audioContext;
    this.clarityThreshold = options?.clarityThreshold ?? 0.8;
    if (analyserNode) {
      this.pitchDetector = PitchDetector.forFloat32Array(analyserNode.fftSize);
      this.pitchDetector.clarityThreshold = this.clarityThreshold;
    }
  }

  start() {
    if (!this.analyserNode || !this.audioContext || !this.pitchDetector) throw new Error('AnalyserNode, AudioContext, or PitchDetector not set');
    if (this.running) return;
    this.running = true;
    this.processAudio();
  }

  stop() {
    this.running = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  subscribeToNotes(callback: NoteCallback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private processAudio = () => {
    if (!this.running || !this.analyserNode || !this.pitchDetector || !this.audioContext) return;
    const bufferLength = this.analyserNode.fftSize;
    const buffer = new Float32Array(bufferLength);
    this.analyserNode.getFloatTimeDomainData(buffer);
    const [pitch, clarity] = this.pitchDetector.findPitch(buffer, this.audioContext.sampleRate);
    let note: string | null = null;
    if (clarity >= this.clarityThreshold && pitch > 0) {
      note = Note.fromFreq(pitch);
    }
    for (const cb of this.callbacks) cb(note);
    this.animationFrameId = requestAnimationFrame(this.processAudio);
  };
}
