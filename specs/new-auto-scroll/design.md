# Refactoring Plan: BPM-Based Auto-Scroll Engine

## 1. Executive Summary & Goals
This document outlines a detailed plan to refactor the `SongViewer` component's auto-scroll functionality. The current pixel-based scrolling will be replaced with an intelligent, tempo-aware system that synchronizes the display with the song's musical structure, significantly enhancing the user experience for musicians.

- **Goal 1: Implement Tempo-Aware Scrolling.** Create a scroll engine that progresses through the song line-by-line and chord-by-chord, based on a user-defined Beats Per Minute (BPM).
- **Goal 2: Enhance Visual Feedback.** Introduce dynamic highlighting for the current line and chord, mimicking lyric synchronization features found in modern music applications.
- **Goal 3: Improve User Control.** Provide an intuitive UI for real-time BPM adjustment, play/pause control, and intelligent handling of user interactions.

## 2. Current Situation Analysis
The existing `SongViewer.svelte` component provides a basic auto-scroll feature.

- **Current Implementation:** A simple, continuous vertical scroll is implemented using `requestAnimationFrame`. The speed is controlled by a multiplier (`0.25x` to `4x`), which is not tied to the musical tempo of the song.
- **Key Pain Points:**
    - The scroll speed is arbitrary and requires constant user adjustment.
    - There is no synchronization with the song's structure (lines or chords).
    - It lacks visual cues to indicate the current position in the song, making it difficult for a musician to follow along.
- **Strengths to Leverage:** The `src/lib/utils/chordpro.ts` utility provides a solid foundation for parsing song text into a structured format. This plan will extend its output to include metadata required for timing calculations.

## 3. Proposed Solution / Refactoring Strategy
### 3.1. High-Level Design / Architectural Overview
We will introduce a `TempoScrollEngine` class to decouple all timing and progression logic from the Svelte view layer. The `SongViewer` component will consume state from this engine to reactively update the UI, including line styles and scroll position.

**Architectural Diagram:**
```
┌──────────────────────────────┐      ┌──────────────────────────────┐
│  ChordPro Parser (Enhanced)  │──────▶│       ParsedSong Data        │
│      (chordpro.ts)           │      │ (with timing metadata)       │
└──────────────────────────────┘      └──────────────┬───────────────┘
                                                     │
                                                     ▼
┌──────────────────────────────┐      ┌──────────────────────────────┐
│   SongViewer.svelte          │◀─────│   TempoScrollEngine (New)    │
│                              │      │                              │
│  • Manages UI State          │      │  • Calculates line/chord     │
│  • Renders Lines & Chords    │      │    durations from BPM        │
│  • Triggers Smooth Scrolling │      │  • Manages playback state    │
│  • Hosts BPM Controls UI     │      │    (playing, paused)         │
└──────────────────────────────┘      │  • Tracks current position   │
                                      └──────────────────────────────┘
```

**Visual Behavior:**
-   **Past Lines:** Opacity set to `70%`.
-   **Active Line:** Opacity `100%`. The line is smoothly scrolled into a target viewport area (e.g., 30% from the top).
-   **Upcoming Lines:** Opacity `100%`, serving as a preview for the musician.
-   **Chord Highlighting:** Within the active line, the current chord will have a distinct visual highlight that progresses based on the calculated timing.

### 3.2. Key Components / Modules
-   **`TempoScrollEngine.ts` (New File):** A framework-agnostic TypeScript class to manage the state and logic of BPM-based progression. Its responsibilities include starting, stopping, pausing, and adjusting the tempo of the auto-scroll. It will use `performance.now()` for accurate, self-correcting timing.
-   **`SongViewer.svelte` (Refactor):** This component will be refactored to instantiate and interact with the `TempoScrollEngine`. It will use Svelte 5 runes (`$state`, `$derived`) to reactively bind the UI to the engine's state (e.g., `activeLineIndex`, `activeChordIndex`). It will also manage the physical scrolling of the viewport.
-   **`chordpro.ts` (Modify):** The parser will be enhanced to add critical metadata to each parsed line, such as `chordCount`, which is essential for the `TempoScrollEngine`'s calculations.
-   **`BpmController.svelte` (New Component):** A reusable UI component for displaying and adjusting the BPM. It will feature `+` and `-` buttons and emit events to notify the `SongViewer` of user-initiated tempo changes.

### 3.3. Detailed Action Plan / Phases
#### **Phase 1: Foundation & Data Enhancement**
-   **Objective(s):** Enhance the data pipeline to support timing calculations.
-   **Priority:** High
-   **Task 1.1: Enhance ChordPro Parser**
    -   **Rationale/Goal:** The `TempoScrollEngine` needs to know how many chords are in each line to calculate its duration.
    -   **Estimated Effort:** S
    -   **Deliverable/Criteria for Completion:** The `ParsedLine` interface in `chordpro.ts` is updated to include `metadata: { chordCount: number }`. The `parseChordPro` function correctly populates this data.
-   **Task 1.2: Define Core Timing Formulas**
    -   **Rationale/Goal:** Establish the mathematical basis for the scroll engine.
    -   **Estimated Effort:** S
    -   **Deliverable/Criteria for Completion:** A utility function is created that implements the formula: `lineDurationInMs = (chordCount * beatsPerChord * 60 * 1000) / bpm`. The initial implementation will assume 4 beats per chord (for a standard 4/4 measure).

#### **Phase 2: Core Engine Implementation**
-   **Objective(s):** Create the standalone, testable timing and state management engine.
-   **Priority:** High
-   **Task 2.1: Create `TempoScrollEngine` Class Structure**
    -   **Rationale/Goal:** To encapsulate all non-UI logic, making it highly modular and testable.
    -   **Estimated Effort:** M
    -   **Deliverable/Criteria for Completion:** A `TempoScrollEngine.ts` file is created with a class that includes methods like `start()`, `stop()`, `pause()`, `resume()`, `setBpm()`, and state properties like `isActive`, `activeLineIndex`, and `activeChordIndex`.
-   **Task 2.2: Implement Engine's Internal Timer**
    -   **Rationale/Goal:** The engine needs a precise, non-blocking timer to drive state updates.
    -   **Estimated Effort:** M
    -   **Deliverable/Criteria for Completion:** The engine uses a `requestAnimationFrame` loop. Inside the loop, it calculates elapsed time using `performance.now()` to determine the current line and chord, preventing timing drift.
-   **Task 2.3: Develop Unit Tests for `TempoScrollEngine`**
    -   **Rationale/Goal:** Ensure the timing and state logic is correct and reliable before integrating with the UI.
    -   **Estimated Effort:** M
    -   **Deliverable/Criteria for Completion:** Vitest unit tests are written to verify that given a BPM and a parsed song, the engine correctly updates its `activeLineIndex` and `activeChordIndex` over time.

#### **Phase 3: UI Integration & Visual State**
-   **Objective(s):** Connect the engine to the `SongViewer` and implement reactive visual feedback.
-   **Priority:** High
-   **Task 3.1: Integrate `TempoScrollEngine` into `SongViewer.svelte`**
    -   **Rationale/Goal:** To drive the component's view from the engine's state.
    -   **Estimated Effort:** M
    -   **Deliverable/Criteria for Completion:** `SongViewer` creates an instance of the engine. The component's rendering logic uses the engine's state (e.g., `engine.activeLineIndex`) to apply CSS classes for active/inactive lines and highlighted chords.
-   **Task 3.2: Implement Line Opacity and Highlighting**
    -   **Rationale/Goal:** To provide the core "Spotify-style" visual feedback.
    -   **Estimated Effort:** S
    -   **Deliverable/Criteria for Completion:** CSS classes are created and dynamically applied to lines based on their status (past, active, upcoming). The currently active chord is visually distinct.

#### **Phase 4: Scrolling & User Controls**
-   **Objective(s):** Implement the physical scrolling and the BPM control UI.
-   **Priority:** Medium
-   **Task 4.1: Implement Line-by-Line Scrolling**
    -   **Rationale/Goal:** To replace the continuous pixel scroll with a more musically relevant progression.
    -   **Estimated Effort:** M
    -   **Deliverable/Criteria for Completion:** An `$effect` in `SongViewer` tracks changes to `engine.activeLineIndex`. When the index changes, it identifies the new active line's DOM element and uses `element.scrollIntoView({ behavior: 'smooth', block: 'center' })` to move it into the viewport.
-   **Task 4.2: Create and Integrate `BpmController.svelte`**
    -   **Rationale/Goal:** To allow users to control the tempo.
    -   **Estimated Effort:** S
    -   **Deliverable/Criteria for Completion:** The new component is created and placed in the floating dock. Its buttons call the `engine.setBpm()` method and update the displayed BPM value.
-   **Task 4.3: Implement Play/Pause/Stop Controls**
    -   **Rationale/Goal:** Provide essential playback controls.
    -   **Estimated Effort:** S
    -   **Deliverable/Criteria for Completion:** The floating dock buttons are wired to the `engine.start()`, `engine.pause()`, and `engine.stop()` methods. The UI correctly reflects the current playback state.

#### **Phase 5: Advanced Features & Refinements**
-   **Objective(s):** Improve the user experience with intelligent behaviors.
-   **Priority:** Medium
-   **Task 5.1: Implement Smart Scroll Start**
    -   **Rationale/Goal:** To prevent the scroll from starting abruptly from the top of the page.
    -   **Estimated Effort:** S
    -   **Deliverable/Criteria for Completion:** When the user presses play for the first time, the view first scrolls to position the first line of the song correctly before the timing progression begins.
-   **Task 5.2: Handle Manual Scrolling**
    -   **Rationale/Goal:** User-initiated scrolling should not conflict with the auto-scroll.
    -   **Estimated Effort:** M
    -   **Deliverable/Criteria for Completion:** The `SongViewer` listens for `wheel` or `touchstart` events on the song container. When detected, it calls `engine.pause()` to temporarily halt auto-scrolling. A "Resume" button could appear to allow the user to continue.

### 3.4. Data Model Changes
**`src/lib/utils/chordpro.ts`**
```typescript
export interface ChordLyricPair {
  chord: string | null;
  word: string;
}

export interface ParsedLine {
  parts: ChordLyricPair[];
  metadata: {
    chordCount: number; // Total number of chords in the line
    isEmpty: boolean;   // True if the line is just whitespace
  };
}

export interface ParsedSong {
  lines: ParsedLine[];
  error?: boolean;
}
```

**`src/lib/utils/TempoScrollEngine.ts`**
```typescript
interface TempoScrollEngineState {
  isActive: boolean;
  isPaused: boolean;
  currentBpm: number;
  activeLineIndex: number;
  activeChordIndex: number;
}
```

### 3.5. API Design / Interface Changes
**`TempoScrollEngine` Public API**
```typescript
class TempoScrollEngine {
  // Constructor
  constructor(parsedSong: ParsedSong, initialBpm: number);

  // Public State (Readonly properties for Svelte consumption)
  readonly state: TempoScrollEngineState;

  // Controls
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;

  // Configuration
  setBpm(newBpm: number): void;
}
```

## 4. Key Considerations & Risk Mitigation
### 4.1. Technical Risks & Challenges
-   **Risk: Timing Accuracy & Drift.** Browser timers like `setTimeout` can be imprecise over long durations.
    -   **Mitigation:** The `TempoScrollEngine` will use `performance.now()` within its `requestAnimationFrame` loop to calculate the true elapsed time since starting. This makes the timer self-correcting and resilient to lag or tab throttling.
-   **Risk: Performance on Large Songs.** Calculating timings for thousands of lines could be slow.
    -   **Mitigation:** All line durations will be pre-calculated and memoized once when the engine is initialized or the BPM changes. The "tick" function will only perform simple comparisons against the elapsed time, ensuring minimal overhead.
-   **Risk: User Interaction Conflicts.** Manual scrolling by the user will fight with the auto-scroll.
    -   **Mitigation:** Implement a scroll detection mechanism. On `touchstart` or `wheel` events within the song container, the engine will be paused automatically. A UI element can then be shown to allow the user to resume the auto-scroll.
-   **Risk: Complex Musical Timing.** The initial formula assumes a simple 4/4 time signature. Songs with different time signatures or complex rhythms will not sync correctly.
    -   **Mitigation:** The initial implementation will proceed with the 4/4 assumption, which covers the majority of popular music. The `TempoScrollEngine` will be designed to allow for a more complex timing strategy in the future, where timing metadata could be embedded directly in the ChordPro source.

### 4.2. Dependencies
-   **Internal:**
    -   UI Integration (Phase 3) depends on the Core Engine (Phase 2).
    -   Core Engine (Phase 2) depends on the Enhanced Parser (Phase 1).
-   **External:**
    -   The solution relies on modern browser support for `requestAnimationFrame` and `Element.scrollIntoView({ behavior: 'smooth' })`.

### 4.3. Non-Functional Requirements (NFRs) Addressed
-   **Performance:** The design prioritizes performance by pre-calculating timings and using efficient checks within the animation loop, ensuring animations remain smooth (targeting 60fps) even on mobile devices.
-   **Usability:** The feature is designed to be intuitive. It "just works" based on a standard musical metric (BPM), and controls are simple and accessible. Pausing on manual scroll enhances the user experience.
-   **Maintainability:** By separating the timing logic (`TempoScrollEngine`) from the view logic (`SongViewer.svelte`), both parts become simpler, easier to understand, and independently testable.
-   **Testability:** The `TempoScrollEngine` can be unit-tested in isolation with a mocked `ParsedSong` object, guaranteeing the core logic is robust.

## 5. Success Metrics / Validation Criteria
-   **Functional:** The active line highlight and scroll position must remain synchronized with the calculated timing within a 100ms tolerance.
-   **Performance:** On a mid-range mobile device, the main thread CPU usage during auto-scroll should remain below 15% to prevent battery drain and ensure a smooth experience.
-   **User Experience:** A user should be able to start, stop, and change the BPM of a song without the UI lagging or becoming unresponsive. Manual scrolling should intuitively pause the automatic progression.

## 6. Assumptions Made
-   **Musical Structure:** For the initial implementation, we assume most songs use a 4/4 time signature where one chord is played for approximately 4 beats. This assumption is the basis for the initial timing formula.
-   **User Environment:** Users will be on modern evergreen browsers that support the required Web APIs.
-   **Framework:** The implementation will leverage Svelte 5's reactivity model for efficient state management and UI updates.

## 7. Open Questions / Areas for Further Investigation
This section lists key discussion points for the team before and during implementation.
-   **Advanced Timing:** How should we handle songs with explicit time signature changes or complex rhythms (e.g., 2 beats for one chord, 6 for another)? Should we consider extending the ChordPro format with timing directives like `{time:3/4}` or `[C:2]` (play for 2 beats)?
-   **User Customization:** Should users be able to save a preferred BPM for each song? Should they be able to configure the "active line" scroll position (e.g., center vs. top of the screen)?
-   **Initial BPM:** How should the default BPM be determined? Should it be a static default (e.g., 120), or could we attempt to infer it from the song's metadata if available?
-   **Accessibility:** How can we make the auto-scroll progression accessible to screen reader users? Should we use ARIA live regions to announce the current line or chord?