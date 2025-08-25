export type RecognitionStatus = 'correct' | 'incorrect' | 'unrecognized';

export interface ApplicationState {
	isMicrophoneAccessGranted: boolean;
	isAudioProcessing: boolean;
	detectedNotes: string[];
	currentChord: string | null;
	targetChord: string;
	recognitionStatus: RecognitionStatus;
}
