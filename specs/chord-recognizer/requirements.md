# Design Plan: Ukulele Chord Recognition Feature

## 1. Executive Summary & Goals
This document outlines the design for a new feature in the SvelteKit application that provides real-time feedback on ukulele chords played by a user. The system will capture audio from the user's microphone, analyze the frequencies to detect notes, identify the chord, and compare it against a user-selected target chord, all while providing a real-time visualization of the audio signal.

**Key Goals:**
*   **Real-Time Chord Recognition:** Accurately capture and identify ukulele chords in real-time using the microphone.
*   **Instant User Feedback:** Provide clear and immediate feedback to the user, indicating if the played chord is correct, incorrect, or unrecognized.
*   **Engaging Learning Tool:** Offer a dynamic audio visualization to help users understand the sound they are producing.

## 2. Current Situation Analysis
The feature will be implemented as a new, self-contained module within the existing SvelteKit application. The current project structure is minimal, providing a greenfield opportunity for this feature. There are no existing components for audio processing or visualization that need to be refactored or considered. The implementation will adhere to the project's established coding conventions, including Domain-Driven Design (DDD) principles for structuring the core logic.

## 3. Proposed Solution / Refactoring Strategy
### 3.1. High-Level Design / Architectural Overview
The proposed solution is a component-based architecture that separates concerns between audio processing, state management, and UI presentation. The core logic will be encapsulated in services that can be tested independently of the UI. Svelte 5's runes will be used for reactive state management, ensuring the UI updates efficiently in response to changes from the audio analysis pipeline.

A new route, `/chord-detector`, will be created to host this feature.

**Data Flow Diagram:**
```
[User plays chord]
       |
       v
[Microphone] -> [1. Audio Service] (Captures AudioStream)
       |
       v
[2. Pitch Detection Service] (Uses Pitchy, extracts notes & clarity)
       |
       v
[3. Chord Recognition Service] (Applies debounce/reset, uses Tonal.js)
       |
       v
[4. Application State (Svelte Runes)] (Updates targetChord, detectedChord, matchStatus)
       |
       v
[5. Svelte UI Components] (Reactively update to show feedback & visualization)
```

### 3.2. Key Components / Modules

**A. Core Services (in `src/lib/modules/chord-detector/services`)**

*   **`AudioService`**
    *   **Responsibilities:**
        *   Request and manage microphone permissions (`navigator.mediaDevices.getUserMedia`).
        *   Create and manage the `AudioContext` and `AnalyserNode`.
        *   Provide a raw audio data stream (e.g., `Float32Array` for time-domain or frequency data) to other services.
        *   Handle errors related to audio device access.
*   **`PitchDetectionService`**
    *   **Responsibilities:**
        *   Consume the audio stream from `AudioService`.
        *   Use the `Pitchy` library to detect the fundamental frequency and clarity of the signal.
        *   Maintain a list of currently detected notes (frequencies converted to note names) that meet the minimum clarity threshold (default 0.8).
        *   Expose the detected notes for the recognition service.
*   **`ChordRecognitionService`**
    *   **Responsibilities:**
        *   Consume the list of notes from `PitchDetectionService`.
        *   Implement the post-processing logic:
            *   **Debounce:** Recognize a chord only if the set of detected notes remains stable for a configured duration (e.g., 300ms).
            *   **Reset:** Periodically clear the list of accumulated notes (e.g., every 800ms) to prevent "stuck" notes.
        *   Use `Tonal.js` to identify a chord from the stable set of notes.
        *   Compare the identified chord with the user's target chord.
        *   Expose the final result: `{ recognizedChord: string | null, matchStatus: 'correct' | 'incorrect' | 'unrecognized' }`.

**B. Svelte Components (in `src/lib/modules/chord-detector/components`)**

*   **`ChordSelector.svelte`**
    *   **Responsibilities:** Display a list of selectable ukulele chords (e.g., Am, C, G, F). Manages the `targetChord` state.
*   **`FeedbackDisplay.svelte`**
    *   **Responsibilities:** Display the currently recognized chord and the match status (e.g., "✅ Correct!", "❌ Expected Am, got Cmaj7", "⚠️ Could not recognize").
*   **`AudioVisualizer.svelte`**
    *   **Responsibilities:**
        *   Render audio data onto a `<canvas>` element.
        *   Receive processed audio data (Time Domain or Frequency Domain) from the `AudioService`.
        *   Use `requestAnimationFrame` for smooth, performant 60 FPS rendering.
        *   Include a UI toggle to switch between "Wave" (oscilloscope) and "Frequency" (spectrogram) views.
*   **`ChordDetectorPage.svelte` (The route component at `src/routes/chord-detector/+page.svelte`)**
    *   **Responsibilities:**
        *   Orchestrate all components and services.
        *   Initialize and tear down the audio services when the component mounts and unmounts.
        *   Manage the overall application state using Svelte 5 runes.

### 3.3. Detailed Action Plan / Phases

#### Phase 1: Core Logic & Service Implementation
*   **Objective(s):** Build the foundational, non-UI logic for audio capture and chord recognition.
*   **Priority:** High
*   **Task 1.1:** Setup Project and Dependencies
    *   **Rationale/Goal:** Prepare the project environment by adding the required third-party libraries.
    *   **Estimated Effort (Optional):** S
    *   **Deliverable/Criteria for Completion:** `Pitchy` and `Tonal.js` are added to `package.json` and are importable within the project.
*   **Task 1.2:** Implement `AudioService`
    *   **Rationale/Goal:** Create a reusable service to handle all interactions with the Web Audio API and microphone.
    *   **Estimated Effort (Optional):** M
    *   **Deliverable/Criteria for Completion:** The service can successfully request microphone access, create an `AudioContext`, and expose an `AnalyserNode`.
*   **Task 1.3:** Implement `PitchDetectionService`
    *   **Rationale/Goal:** Encapsulate the logic for analyzing the audio stream and detecting musical notes.
    *   **Estimated Effort (Optional):** M
    *   **Deliverable/Criteria for Completion:** The service can process an audio stream and output an array of detected notes that meet the clarity threshold.
*   **Task 1.4:** Implement `ChordRecognitionService`
    *   **Rationale/Goal:** Create the logic for interpreting notes as chords, including the critical debounce and reset algorithms.
    *   **Estimated Effort (Optional):** L
    *   **Deliverable/Criteria for Completion:** The service can take a stream of notes, apply post-processing, and correctly identify chords using `Tonal.js`. Unit tests should verify the debounce and reset logic.

#### Phase 2: UI Component Development & Integration
*   **Objective(s):** Create the user-facing components and connect them to the core services.
*   **Priority:** High
*   **Task 2.1:** Create the `chord-detector` Route and Page
    *   **Rationale/Goal:** Establish the main page for the feature and manage the lifecycle of the audio services.
    *   **Estimated Effort (Optional):** M
    *   **Deliverable/Criteria for Completion:** A new page exists at `/chord-detector` which initializes the services on mount and logs detected chords to the console.
*   **Task 2.2:** Develop `ChordSelector.svelte` and `FeedbackDisplay.svelte`
    *   **Rationale/Goal:** Build the primary interactive elements for the user.
    *   **Estimated Effort (Optional):** M
    *   **Deliverable/Criteria for Completion:** The user can select a target chord, and the feedback component correctly displays the results from the `ChordRecognitionService`.
*   **Task 2.3:** Integrate Services with UI via Svelte Runes
    *   **Rationale/Goal:** Create a reactive state management system that connects the services' output to the UI components' input.
    *   **Estimated Effort (Optional):** M
    *   **Deliverable/Criteria for Completion:** The UI updates automatically and efficiently when the detected chord or match status changes.

#### Phase 3: Audio Visualization
*   **Objective(s):** Implement the real-time canvas-based audio visualizer.
*   **Priority:** Medium
*   **Task 3.1:** Develop `AudioVisualizer.svelte`
    *   **Rationale/Goal:** Provide visual feedback to the user, enhancing the learning experience.
    *   **Estimated Effort (Optional):** L
    *   **Deliverable/Criteria for Completion:** A canvas element renders the audio waveform or frequency spectrum in real-time, updating at approximately 60 FPS. A control to switch between the two modes is functional.

### 3.4. Data Model Changes
No changes to a persistent data model (like a database) are required. The primary data structure will be the client-side application state, managed by Svelte runes.

**Example State Object:**
```typescript
{
  targetChord: 'Am',
  detectedNotes: ['A4', 'C5', 'E5'],
  recognizedChord: 'Am',
  matchStatus: 'correct', // 'incorrect', 'unrecognized'
  audioClarity: 0.95,
  isListening: true,
  micError: null | string,
  visualizationMode: 'wave' // 'frequency'
}
```

### 3.5. API Design / Interface Changes
The "API" in this context refers to the public interface of the core services.

*   **`AudioService`**
    *   `start(): Promise<void>`: Initializes microphone and AudioContext.
    *   `stop(): void`: Stops audio processing and releases the microphone.
    *   `getAnalyserNode(): AnalyserNode | null`: Returns the node for visualization.
*   **`PitchDetectionService`**
    *   `start(analyserNode: AnalyserNode): void`: Begins listening to the audio data.
    *   `stop(): void`: Stops the analysis loop.
    *   `subscribeToNotes(callback: (notes: string[]) => void): UnsubscribeFunction`: Allows other services to listen for note changes.
*   **`ChordRecognitionService`**
    *   `setTargetChord(chord: string): void`: Sets the chord to match against.
    *   `subscribeToResult(callback: (result: RecognitionResult) => void): UnsubscribeFunction`: Allows the UI to listen for the final recognition result.

## 4. Key Considerations & Risk Mitigation
### 4.1. Technical Risks & Challenges
*   **Performance:** Real-time audio analysis and canvas rendering are CPU-intensive.
    *   **Mitigation:** Use `requestAnimationFrame` for rendering loops. Ensure algorithms are efficient. If performance issues arise on lower-end devices, consider moving the audio processing to a Web Worker.
*   **Accuracy:** Ambient noise, microphone quality, and instrument timbre can affect pitch detection accuracy.
    *   **Mitigation:** The debounce, reset, and clarity threshold algorithms are designed to mitigate this. These values should be configurable to allow for fine-tuning during testing.
*   **Browser Compatibility:** `getUserMedia` and `AudioContext` APIs may have vendor-specific differences or limitations.
    *   **Mitigation:** Test across all target browsers (Chrome, Firefox, Safari, Edge). Provide graceful degradation and clear error messages to the user if their browser is not supported or if they deny microphone permissions.

### 4.2. Dependencies
*   **Internal:** Phase 2 is dependent on the successful completion of Phase 1. Phase 3 is dependent on the `AudioService` from Phase 1.
*   **External:** The feature relies on the `Pitchy` and `Tonal.js` libraries. A risk exists if these libraries are unmaintained or have critical bugs. They should be vetted before full implementation.

### 4.3. Non-Functional Requirements (NFRs) Addressed
*   **Usability:** The design prioritizes immediate and clear feedback, which is crucial for a learning tool. The UI will be simple and intuitive.
*   **Performance:** The use of `requestAnimationFrame` and efficient state management with Svelte 5 runes is specified to ensure a smooth user experience without excessive CPU load.
*   **Reliability:** The `AudioService` will include robust error handling for cases where the microphone is unavailable or permission is denied.
*   **Maintainability:** By separating logic into distinct services (SoC), the codebase will be easier to understand, test, and maintain.

## 5. Success Metrics / Validation Criteria
*   The application can successfully distinguish between at least 4-5 common, distinct ukulele chords (e.g., C, G, Am, F) played clearly into the microphone.
*   The UI provides feedback (correct, incorrect, unrecognized) within ~1 second of a chord being played stably.
*   The audio visualization runs smoothly (>= 50 FPS) during audio analysis on a mid-range laptop.
*   The feature functions correctly on the latest versions of Chrome, Firefox, and Safari.

## 6. Assumptions Made
*   Users will have a functional microphone and will grant the necessary browser permissions.
*   The user is in a reasonably quiet environment to allow for accurate pitch detection.
*   The `Pitchy` library is capable of detecting multiple frequencies with sufficient accuracy for this use case.
*   The Svelte 5 application is set up with a standard Vite configuration.

## 7. Open Questions / Areas for Further Investigation
*   What is the definitive list of ukulele chords to be included in the `ChordSelector` for the MVP?
*   What are the optimal default values for the debounce, reset, and clarity thresholds? These will likely require empirical testing and tuning.
*   What specific visual design should the oscilloscope and spectrogram have? (e.g., colors, line thickness, amplitude scaling).
*   Should there be a calibration step for the user's microphone to set a baseline noise floor? (Considered out of scope for MVP but worth discussing).