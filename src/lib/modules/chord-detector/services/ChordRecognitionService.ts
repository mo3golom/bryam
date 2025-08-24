import { Chord } from '@tonaljs/tonal';

export interface ChordRecognitionServiceOptions {
  debounceTime?: number;
  resetTime?: number;
}

export enum RecognitionStatus {
  Correct,
  Incorrect,
  Unrecognized
}

export interface RecognitionResult {
  status: RecognitionStatus;
  detectedChord?: string;
}

type ResultCallback = (result: RecognitionResult) => void;

export class ChordRecognitionService {
  private notes: Set<string> = new Set();
  private targetChord: string | null = null;
  private debounceTimeout: any | null = null;
  private resetTimeout: any | null = null;
  private debounceTime: number;
  private resetTime: number;
  private callbacks: Set<ResultCallback> = new Set();

  constructor(options?: ChordRecognitionServiceOptions) {
    this.debounceTime = options?.debounceTime ?? 300;
    this.resetTime = options?.resetTime ?? 800;
  }

  addNote(note: string | null) {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }

    if (note) {
      this.notes.add(note);
    }

    this.debounceTimeout = setTimeout(() => {
      this.recognizeChord();
    }, this.debounceTime);

    this.resetTimeout = setTimeout(() => {
      this.notes.clear();
    }, this.resetTime);
  }

  setTargetChord(chord: string) {
    this.targetChord = chord;
  }

  subscribeToResult(callback: ResultCallback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private recognizeChord() {
    if (this.notes.size === 0) return;

    const detectedChords = Chord.detect(Array.from(this.notes));
    const detectedChord = detectedChords.length > 0 ? detectedChords[0] : undefined;

    let status: RecognitionStatus;
    if (detectedChord && this.targetChord) {
      status = Chord.get(detectedChord).aliases.includes(this.targetChord)
        ? RecognitionStatus.Correct
        : RecognitionStatus.Incorrect;
    } else {
      status = RecognitionStatus.Unrecognized;
    }

    for (const cb of this.callbacks) cb({ status, detectedChord });
  }
}
