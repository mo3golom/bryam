<script lang="ts">
  import { parseChordPro, type ParsedSong } from "$lib/utils/chordpro.js";
  import type { Song } from "$lib/types.js";
  import { TempoScrollEngine } from "$lib/utils/TempoScrollEngine";
  import type { TempoScrollEngineState } from "$lib/utils/TempoScrollEngine";

  interface Props {
    songData: Song;
  }

  const DEFAULT_BPM = 120;
  const MIN_TEXT_SIZE = 12;
  const MAX_TEXT_SIZE = 32;
  const DEFAULT_TEXT_SIZE = 14;
  // Callback function for engine state changes
  const onEngineStateChange = (state: TempoScrollEngineState) => {
    scrollActiveLineIndex = state.activeLineIndex;
    scrollActiveChordIndex = state.activeChordIndex;
    scrollCurrentBpm = state.currentBpm;
    scrollIsActive = state.isActive;
    scrollIsPaused = state.isPaused;
  };
  // Asymmetric fade configuration
  const fadeConfig = {
    upperStrength: 2.0, // Stronger fade for past lines
    lowerStrength: 1.0, // Gentler fade for future lines
    minOpacity: 0.1, // Minimum opacity threshold
  };
  // Calculate fade coefficients based on strength
  const upperFadeCoeff = Math.pow(0.7, fadeConfig.upperStrength); // ~0.49
  const lowerFadeCoeff = Math.pow(0.7, fadeConfig.lowerStrength); // ~0.7

  let { songData }: Props = $props();
  let parsedSong: ParsedSong = $derived.by(() => {
    let data: ParsedSong = { lines: [] };
    try {
      data = parseChordPro(songData.body);
    } catch (error) {
      console.error("Error parsing ChordPro content:", error);
      return { lines: [], error: true };
    }
    return data;
  });
  // Instantiate the TempoScrollEngine with parsedSong, callback, and default BPM
  let engine = $derived.by(() => {
    if (!parsedSong || !parsedSong.lines || parsedSong.lines.length === 0) return null;
    return new TempoScrollEngine(parsedSong, onEngineStateChange, DEFAULT_BPM);
  });
  // Check if content is empty or whitespace only
  let isEmpty = $derived(!songData.body || songData.body.trim() === "");
  let hasError = $derived(parsedSong.error || (parsedSong.lines.length === 0 && !isEmpty));

  let scrollActiveLineIndex = $state(0);
  let scrollActiveChordIndex = $state(0);
  let scrollCurrentBpm = $state(DEFAULT_BPM);
  let scrollIsActive = $state(false);
  let scrollIsPaused = $state(false);
  // Text size configuration
  let textSize: number = $state(DEFAULT_TEXT_SIZE);

  // Scroll the active line into view when the engine's activeLineIndex changes
  $effect(() => {
    if (typeof document === "undefined") return;

    if (scrollActiveLineIndex) {
      console.log("Active line index changed:", scrollActiveLineIndex);

      if (scrollActiveLineIndex < 0) return;

      const selector = `[data-line-index="${scrollActiveLineIndex}"]`;
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) return;

      // Smoothly center the active line in the viewport
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  // Function to get line style based on scroll state and position
  function getLineStyle(lineIndex: number): string {
    const fontSize = `font-size: ${textSize}pt;`;

    if (!scrollIsActive || scrollIsPaused) {
      return `opacity: 1.0; ${fontSize}`; // Default opacity when not scrolling
    }

    const opacity = calculateLineOpacity(lineIndex, scrollActiveLineIndex);
    const isActive = lineIndex === scrollActiveLineIndex;
    const fontWeight = isActive ? "bold" : "normal";

    return `opacity: ${opacity}; font-weight: ${fontWeight}; ${fontSize}`;
  }

  // Function to calculate line opacity based on distance from active line
  function calculateLineOpacity(lineIndex: number, activeIndex: number): number {
    if (lineIndex === activeIndex) {
      return 1.0; // Active line is fully opaque
    }

    const distance = lineIndex - activeIndex;
    let opacity: number;

    if (distance < 0) {
      // Upper lines (past) - stronger fade
      const absDistance = Math.abs(distance);
      opacity = Math.max(fadeConfig.minOpacity, Math.pow(upperFadeCoeff, absDistance));
    } else {
      // Lower lines (future) - gentler fade
      opacity = Math.max(fadeConfig.minOpacity, Math.pow(lowerFadeCoeff, distance));
    }

    return opacity;
  }

  // Function to check if an element is visible in the viewport
  function isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    return rect.top >= 0 && rect.left >= 0 && rect.bottom <= windowHeight && rect.right <= windowWidth;
  }

  async function startAutoScroll() {
    if (!engine) return;

    const activeLineElement = document.querySelector(`[data-line-index="${scrollActiveLineIndex}"]`) as HTMLElement | null;
    if (activeLineElement && !isElementVisible(activeLineElement)) {
      // Scroll to the active line first, preferably to center
      activeLineElement.scrollIntoView({ behavior: "smooth", block: "center" });

      // Wait for scroll animation to complete before starting auto-scroll
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Now start the auto-scroll engine
    engine.start();
  }

  function pauseAutoScroll() {
    if (engine) engine.pause();
  }

  function restartAutoScroll() {
    if (!engine) return;
    engine.stop();
    engine.setBpm(DEFAULT_BPM);
    scrollActiveLineIndex = 0;
    startAutoScroll();
  }

  // Handle clicking on a song line during autoscroll
  function handleLineClick(lineIndex: number) {
    if (!engine) return;

    // Only handle clicks when autoscroll is active
    if (scrollIsActive && !scrollIsPaused) {
      console.log("Line clicked during autoscroll:", lineIndex);

      // Jump to the clicked line and continue scrolling from there
      engine.jumpToLine(lineIndex);

      // The scroll position will be updated by the $effect that watches scrollActiveLineIndex
      // No need to manually scroll here as the effect will handle it
    }
  }

  function increaseSpeed() {
    if (engine && scrollCurrentBpm < 300) engine.setBpm(scrollCurrentBpm + 10);
  }

  function decreaseSpeed() {
    if (engine && scrollCurrentBpm > 30) engine.setBpm(scrollCurrentBpm - 10);
  }

  function increaseTextSize() {
    if (textSize < MAX_TEXT_SIZE) {
      textSize += 2;
    }
  }

  function decreaseTextSize() {
    if (textSize > MIN_TEXT_SIZE) {
      textSize -= 2;
    }
  }
</script>

<article role="main" aria-labelledby="song-title">
  <!-- Song Header -->
  <header class="mb-6 text-center">
    <h1 id="song-title" class="text-3xl md:text-4xl font-bold text-main-font">
      <p class="relative z-10 bg-primary text-primary-content w-max p-2 pl-4 pr-4 rounded-full mx-auto -rotate-5 translate-y-2 whitespace-nowrap">
        {songData.title}
      </p>
    </h1>
    {#if songData.artist}
      <p id="song-artist" class="relative z-20 text-main-font bg-primary text-primary-content text-sm w-max p-2 pl-4 pr-4 rounded-full mx-auto whitespace-nowrap">
        {songData.artist}
      </p>
    {/if}
  </header>

  <!-- Song Content -->
  <section class="song-content pb-20" aria-label="Song lyrics and chords">
    <div class="card">
      <div class="card-body">
        {#if hasError}
          <div class="text-center text-red-600 mb-4">
            <p>Unable to parse song content</p>
            <pre class="text-left bg-gray-100 p-4 rounded mt-2 text-sm">{songData.body}</pre>
          </div>
        {:else if isEmpty || parsedSong.lines.length === 0}
          <div class="text-center text-gray-600">
            <p>No content available for this song.</p>
          </div>
        {:else}
          <div class="space-y-4">
            {#each parsedSong.lines as line, i}
              {#if scrollIsActive && !scrollIsPaused}
                <!-- Interactive button element during autoscroll -->
                <div
                  class="line-container"
                  style={getLineStyle(i)}
                  data-line-index={i}
                  role="button"
                  onclick={() => handleLineClick(i)}
                  onkeydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleLineClick(i);
                    }
                  }}
                  tabindex={i + 1}
                  aria-label="Jump to line {i + 1}"
                >
                  {#if line.parts.length === 1 && line.parts[0].chord === null && line.parts[0].word === ""}
                    <!-- Empty line for spacing -->
                    <div class="h-4"></div>
                  {:else}
                    <div class="flex flex-wrap items-start gap-x-1 leading-relaxed">
                      {#each line.parts as part}
                        <div class="chord-word-pair inline-block">
                          {#if part.chord}
                            <div
                              class="chord"
                              class:chord-active={scrollIsActive && !scrollIsPaused && i === scrollActiveLineIndex && part.chordPosition === scrollActiveChordIndex}
                              aria-label="Chord: {part.chord}"
                            >
                              {part.chord}
                            </div>
                          {:else}
                            <div class="chord-spacer min-h-[1rem] mb-1" aria-hidden="true"></div>
                          {/if}
                          <div class="word text-gray-900 leading-tight">
                            {part.word}
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {:else}
                <!-- Non-interactive element when autoscroll is not active -->
                <div class="line-container" style={getLineStyle(i)} data-line-index={i}>
                  {#if line.parts.length === 1 && line.parts[0].chord === null && line.parts[0].word === ""}
                    <!-- Empty line for spacing -->
                    <div class="h-4"></div>
                  {:else}
                    <div class="flex flex-wrap items-start gap-x-1 leading-relaxed">
                      {#each line.parts as part}
                        <div class="chord-word-pair inline-block">
                          {#if part.chord}
                            <div
                              class="chord text-blue-600 font-semibold leading-none mb-1 min-h-[1rem]"
                              class:chord-active={scrollIsActive && !scrollIsPaused && i === scrollActiveLineIndex && part.chordPosition === scrollActiveChordIndex}
                              aria-label="Chord: {part.chord}"
                            >
                              {part.chord}
                            </div>
                          {:else}
                            <div class="chord-spacer min-h-[1rem] mb-1" aria-hidden="true"></div>
                          {/if}
                          <div class="word text-gray-900 leading-tight">
                            {part.word}
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </section>
  <div class="dock border-0 max-w-md items-center bottom-4 rounded-3xl left-1/2 -translate-x-1/2 w-[calc(100%-16px)] bg-primary-content drop-shadow-xl drop-shadow-primary-content">
    <div class="relative">
      {#if scrollIsActive && !scrollIsPaused}
        <div class="absolute -top-6 left-1/2 -translate-x-1/2 rounded-3xl p-1 pl-2 pr-2 bg-primary-content text-main-font">{scrollCurrentBpm}&nbsp;BPM</div>
        <div class="join">
          <!-- Decrease BPM -->
          <button class="btn btn-square btn-primary btn-ghost join-item" aria-label="decrease-bpm" onclick={decreaseSpeed} disabled={(scrollCurrentBpm ?? 0) <= 30}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon icon-tabler icons-tabler-outline icon-tabler-minus"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5 12l14 0"></path></svg
            >
          </button>
          <button class="btn btn-square btn-primary btn-ghost join-item" aria-label="pause" onclick={pauseAutoScroll}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon icon-tabler icons-tabler-outline icon-tabler-player-pause"
              ><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M6 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z"></path><path
                d="M14 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z"
              ></path></svg
            >
          </button>
          <button class="btn btn-square btn-primary btn-ghost join-item" aria-label="restart" onclick={restartAutoScroll}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon icon-tabler icons-tabler-outline icon-tabler-rotate"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M19.95 11a8 8 0 1 0 -.5 4m.5 5v-5h-5"></path></svg
            >
          </button>
          <!-- Increase BPM -->
          <button class="btn btn-square btn-primary btn-ghost join-item" aria-label="increase-bpm" onclick={increaseSpeed} disabled={(scrollCurrentBpm ?? 0) >= 300}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M12 5l0 14"></path><path d="M5 12l14 0"></path></svg
            >
          </button>
        </div>
      {:else}
        <!-- Collapsed state - only show play button -->
        <button class="btn btn-primary btn-ghost" aria-label="play" onclick={startAutoScroll}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="icon icon-tabler icons-tabler-outline icon-tabler-player-play"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 4v16l13 -8z"></path></svg
          >
        </button>
      {/if}
      <span class="dock-label text-main-font">auto scroll</span>
    </div>
    <div>
      <div class="join">
        <button class="btn btn-square btn-primary btn-ghost join-item" aria-label="smaller-text" onclick={decreaseTextSize} disabled={textSize <= MIN_TEXT_SIZE}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="icon icon-tabler icons-tabler-outline icon-tabler-letter-case-lower"
            ><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M6.5 15.5m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0"></path><path d="M10 12v7"></path><path
              d="M17.5 15.5m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0"
            ></path><path d="M21 12v7"></path></svg
          >
        </button>
        <button class="btn btn-square btn-primary btn-ghost join-item" aria-label="bigger-text" onclick={increaseTextSize} disabled={textSize >= MAX_TEXT_SIZE}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="icon icon-tabler icons-tabler-outline icon-tabler-letter-case-upper"
            ><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 19v-10.5a3.5 3.5 0 0 1 7 0v10.5"></path><path d="M3 13h7"></path><path d="M14 19v-10.5a3.5 3.5 0 0 1 7 0v10.5"
            ></path><path d="M14 13h7"></path></svg
          >
        </button>
      </div>
      <span class="dock-label text-main-font">text size</span>
    </div>
  </div>
</article>
