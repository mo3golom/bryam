import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	ChordRecognitionService,
	RecognitionStatus
} from './ChordRecognitionService';

describe('ChordRecognitionService', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should debounce note addition and recognize chord', () => {
		const service = new ChordRecognitionService({ debounceTime: 300 });
		const callback = vi.fn();
		service.subscribeToResult(callback);
		service.setTargetChord('C');

		service.addNote('C');
		service.addNote('E');
		service.addNote('G');

		expect(callback).not.toHaveBeenCalled();

		vi.advanceTimersByTime(300);

		expect(callback).toHaveBeenCalledWith({
			status: RecognitionStatus.Correct,
			detectedChord: 'CM'
		});
	});

	it('should reset debounce timer on new note', () => {
		const service = new ChordRecognitionService({ debounceTime: 300 });
		const callback = vi.fn();
		service.subscribeToResult(callback);

		service.addNote('C');
		vi.advanceTimersByTime(200);
		service.addNote('E');
		vi.advanceTimersByTime(200);
		service.addNote('G');

		expect(callback).not.toHaveBeenCalled();

		vi.advanceTimersByTime(300);

		expect(callback).toHaveBeenCalledWith({
			status: RecognitionStatus.Unrecognized, // No target chord set
			detectedChord: 'CM'
		});
	});

	it('should reset notes after reset time', () => {
		const service = new ChordRecognitionService({ debounceTime: 300, resetTime: 800 });
		const callback = vi.fn();
		service.subscribeToResult(callback);
		service.setTargetChord('C');

		service.addNote('C');
		vi.advanceTimersByTime(300);

		expect(callback).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(800);
		service.addNote('G');
		vi.advanceTimersByTime(300);

		expect(callback).toHaveBeenCalledTimes(2);
		// After reset, only 'G' is in the notes, which is not a chord.
		expect(callback).toHaveBeenLastCalledWith({
			status: RecognitionStatus.Unrecognized,
			detectedChord: undefined
		});
	});

	it('should return Incorrect for wrong chord', () => {
		const service = new ChordRecognitionService({ debounceTime: 300 });
		const callback = vi.fn();
		service.subscribeToResult(callback);
		service.setTargetChord('Am');

		service.addNote('C');
		service.addNote('E');
		service.addNote('G');

		vi.advanceTimersByTime(300);

		expect(callback).toHaveBeenCalledWith({
			status: RecognitionStatus.Incorrect,
			detectedChord: 'CM'
		});
	});

	it('should return Unrecognized when no chord is detected', () => {
		const service = new ChordRecognitionService({ debounceTime: 300 });
		const callback = vi.fn();
		service.subscribeToResult(callback);
		service.setTargetChord('C');

		service.addNote('C');
		service.addNote('C#');

		vi.advanceTimersByTime(300);

		expect(callback).toHaveBeenCalledWith({
			status: RecognitionStatus.Unrecognized,
			detectedChord: undefined
		});
	});

	it('should return Incorrect when notes form a different chord', () => {
		const service = new ChordRecognitionService({ debounceTime: 300 });
		const callback = vi.fn();
		service.subscribeToResult(callback);
		service.setTargetChord('C');

		service.addNote('C');
		service.addNote('D');
		service.addNote('F#');

		vi.advanceTimersByTime(300);

		expect(callback).toHaveBeenCalledWith({
			status: RecognitionStatus.Incorrect,
			detectedChord: "D7no5/C"
		});
	});

	it('should handle subscription and unsubscription', () => {
		const service = new ChordRecognitionService({ debounceTime: 300 });
		const callback = vi.fn();
		const unsubscribe = service.subscribeToResult(callback);

		service.addNote('C');
		vi.advanceTimersByTime(300);
		expect(callback).toHaveBeenCalledTimes(1);

		unsubscribe();

		service.addNote('G');
		vi.advanceTimersByTime(300);
		expect(callback).toHaveBeenCalledTimes(1);
	});
});
