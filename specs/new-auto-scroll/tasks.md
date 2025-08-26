### Phase 1: Foundation & Data Enhancement
- [x] 1. **Enhance ChordPro Parser**
    -   Modify the `ParsedLine` interface in `src/lib/utils/chordpro.ts` to include `metadata: { chordCount: number }`.
    -   Update the `parseChordPro` function to accurately count the number of chords in each line and populate the new `metadata.chordCount` property.
    -   Ensure existing unit tests for `chordpro.ts` are updated and passing.
    -   _Requirements: 3.2, 3.3, 3.4_

- [x] 2. **Define Core Timing Formulas**
    -   Create a new utility function, `calculateLineDuration`, that accepts `bpm`, `chordCount`, and an optional `beatsPerChord` as arguments.
    -   Implement the formula: `lineDurationInMs = (chordCount * beatsPerChord * 60 * 1000) / bpm`.
    -   Set a default value of 4 for `beatsPerChord` to handle standard 4/4 time signatures.
    -   _Requirements: 3.1, 3.2, 3.3_

### Phase 2: Core Engine Implementation
- [x] 3. **Create `TempoScrollEngine` Class Structure**
    -   Create a new file: `src/lib/utils/TempoScrollEngine.ts`.
    -   Define the `TempoScrollEngine` class with a constructor that accepts a `ParsedSong` object and an initial BPM.
    -   Implement public methods: `start()`, `stop()`, `pause()`, `resume()`, and `setBpm()`.
    -   Define a public state object with properties: `isActive`, `isPaused`, `currentBpm`, `activeLineIndex`, and `activeChordIndex`.
    -   _Requirements: 3.1, 3.2, 3.5_

- [x] 4. **Implement Engine's Internal Timer**
    -   Use a `requestAnimationFrame` loop to drive the engine's timing logic for smooth, efficient updates.
    -   Calculate elapsed time on each frame using `performance.now()` to prevent timing drift from browser lag or tab throttling.
    -   Implement the logic to advance the `activeLineIndex` and `activeChordIndex` based on the calculated elapsed time and the pre-calculated duration of each line.
    -   _Requirements: 3.2, 4.1_

- [x] 5. **Develop Unit Tests for `TempoScrollEngine`**
    -   Create a corresponding test file: `src/lib/utils/TempoScrollEngine.test.ts`.
    -   Write Vitest unit tests to verify the engine's state transitions (e.g., `start` sets `isActive` to true).
    -   Using `vi.useFakeTimers()`, write tests that advance time and assert that `activeLineIndex` and `activeChordIndex` update correctly based on a mock song structure and BPM.
    -   _Requirements: 3.2, 4.3_

### Phase 3: UI Integration & Visual State
- [x] 6. **Integrate `TempoScrollEngine` into `SongViewer.svelte`**
    -   In `SongViewer.svelte`, instantiate the `TempoScrollEngine` using the `songData`.
    -   Use Svelte 5 runes (`$state`, `$derived`) to reactively connect the component's view to the engine's state properties.
    -   _Requirements: 3.1, 3.2_

- [x] 7. **Implement Line and Chord Highlighting**
    -   In `SongViewer.svelte`, dynamically apply CSS classes to song lines based on their relationship to `engine.activeLineIndex` (e.g., `.line-past`, `.line-active`, `.line-upcoming`).
    -   Apply a distinct CSS class to the currently active chord based on `engine.activeChordIndex`.
    -   Define the styles for these classes, setting opacity for past lines to `70%` and creating a visible highlight for the active chord.
    -   _Requirements: 3.1, 3.3_

### Phase 4: Scrolling & User Controls
- [x] 8. **Implement Line-by-Line Scrolling**
    -   Use a Svelte 5 `$effect` in `SongViewer.svelte` that tracks changes to `engine.activeLineIndex`.
    -   When the index changes, get the corresponding DOM element for the new active line.
    -   Use the `element.scrollIntoView({ behavior: 'smooth', block: 'center' })` method to smoothly transition the active line into the center of the viewport.
    -   _Requirements: 3.1, 3.3, 4.2_

- [x] 9. **Create and Integrate `BpmController.svelte`**
    -   Create a new component: `src/lib/components/BpmController.svelte`.
    -   The component should display the current BPM and have `+` and `-` buttons for adjustment.
    -   Add the `BpmController` to the floating dock UI within `SongViewer.svelte`.
    -   Connect the button events to the `engine.setBpm()` method to allow real-time tempo changes.
    -   _Requirements: 3.2, 3.3_

- [x] 10. **Implement Play/Pause/Stop Controls**
    -   Connect the existing play, pause, and stop buttons in the `SongViewer` floating dock to the corresponding `engine.start()`, `engine.pause()`, and `engine.stop()` methods.
    -   Use the engine's state (`isActive`, `isPaused`) to dynamically toggle the visibility and icons of the control buttons.
    -   _Requirements: 3.2, 3.3_

### Phase 5: Advanced Features & Refinements
- [x] 11. **Implement Smart Scroll Start**
    -   In the `SongViewer`'s play button event handler, check if this is the first time playback is starting.
    -   If it is the first play, programmatically scroll to the first line of the song *before* calling `engine.start()`.
    -   _Requirements: 3.3_

- [ ] 12. **Handle Manual Scrolling Interaction**
    -   In `SongViewer.svelte`, add `wheel` and `touchstart` event listeners to the main song content container.
    -   When either event is detected, call the `engine.pause()` method to halt the auto-scroll.
    -   (Optional) Display a "Resume" UI element that, when clicked, calls `engine.resume()`.
    -   _Requirements: 3.3, 4.1_