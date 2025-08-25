<script lang="ts">
	import { onMount } from 'svelte';
	import { AudioService } from '$lib/modules/chord-detector/services/AudioService';
	import { PitchDetectionService } from '$lib/modules/chord-detector/services/PitchDetectionService';
	import { ChordRecognitionService, type RecognitionResult, RecognitionStatus } from '$lib/modules/chord-detector/services/ChordRecognitionService';
	import type { ApplicationState } from '$lib/modules/chord-detector/types/ApplicationState';
	import { get as getStoreValue } from 'svelte/store';

	let audioService: AudioService | null = null;
	let pitchDetectionService: PitchDetectionService | null = null;
	let chordRecognitionService: ChordRecognitionService | null = null;

	let appState = $state<ApplicationState>({
		isMicrophoneAccessGranted: false,
		isAudioProcessing: false,
		detectedNotes: [],
		currentChord: null,
		targetChord: 'C',
		recognitionStatus: 'unrecognized'
	});

	onMount(() => {
		audioService = new AudioService();
		// @ts-ignore
		const audioContext = getStoreValue(audioService.audioContext);
		// @ts-ignore
		pitchDetectionService = new PitchDetectionService(audioService.getAnalyserNode(), audioContext);
		chordRecognitionService = new ChordRecognitionService();

		const initialize = async () => {
			if (!audioService) return;
			try {
				await audioService.start();
				appState.isMicrophoneAccessGranted = true;
				appState.isAudioProcessing = true;

				pitchDetectionService?.subscribeToNotes((note: string | null) => {
					if (note) {
						appState.detectedNotes = [...appState.detectedNotes, note];
						chordRecognitionService?.addNote(note);
					}
				});

				chordRecognitionService?.subscribeToResult((result: RecognitionResult) => {
					appState.currentChord = result.detectedChord ?? null;
					switch (result.status) {
						case RecognitionStatus.Correct:
							appState.recognitionStatus = 'correct';
							break;
						case RecognitionStatus.Incorrect:
							appState.recognitionStatus = 'incorrect';
							break;
						case RecognitionStatus.Unrecognized:
							appState.recognitionStatus = 'unrecognized';
							break;
					}
				});

				pitchDetectionService?.start();
			} catch (error) {
				console.error('Failed to initialize audio services:', error);
				appState.isMicrophoneAccessGranted = false;
				appState.isAudioProcessing = false;
			}
		};

		initialize();

		return () => {
			pitchDetectionService?.stop();
			audioService?.stop();
			// @ts-ignore
			chordRecognitionService?.clearSubscriptions();
			appState.isAudioProcessing = false;
		};
	});
</script>

<div class="container">
	<h1>Ukulele Chord Recognizer</h1>

	{#if !appState.isMicrophoneAccessGranted}
		<p>Please grant microphone access to start chord recognition.</p>
	{:else if appState.isAudioProcessing}
		<p>Listening for chords...</p>
	{/if}
</div>
