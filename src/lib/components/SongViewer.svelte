<script lang="ts">
  import { parseChordPro, type ParsedSong } from "$lib/utils/chordpro.js";
  import type { Song } from "$lib/types.js";
  import { TempoScrollEngine } from "$lib/utils/TempoScrollEngine";

  const DEFAULT_BPM = 120;

  interface Props {
    songData: Song;
  }

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
  // Remove old auto-scroll state
  let autoScrollEnabled: boolean = $state(false);

  // Instantiate the TempoScrollEngine with parsedSong and default BPM
  let engine = $derived.by(() => {
    if (!parsedSong || !parsedSong.lines || parsedSong.lines.length === 0) return null;
    return new TempoScrollEngine(parsedSong, DEFAULT_BPM);
  });

  // Bind engine state to Svelte runes
  let engineState = $derived(() => engine ? engine.state : null);


  // Check if content is empty or whitespace only
  let isEmpty = $derived(!songData.body || songData.body.trim() === '');
  let hasError = $derived(parsedSong.error || (parsedSong.lines.length === 0 && !isEmpty));

  // Remove old pixel-based auto-scroll logic and controls
  function startAutoScroll() {
    if (engine) engine.start();
    autoScrollEnabled = true;
  }

  function stopAutoScroll() {
    if (engine) engine.stop();
    autoScrollEnabled = false;
  }

  function increaseSpeed() {
    if (engine && engine.state.currentBpm < 300) engine.setBpm(engine.state.currentBpm + 5);
  }

  function decreaseSpeed() {
    if (engine && engine.state.currentBpm > 30) engine.setBpm(engine.state.currentBpm - 5);
  }
</script>

<article role="main" aria-labelledby="song-title">
  <!-- Song Header -->
  <header class="mb-6 text-center">
    <h1
      id="song-title"
      class="text-3xl md:text-4xl font-bold text-main-font"
    >
      <p
        class="bg-primary text-primary-content w-max p-2 pl-4 pr-4 rounded-full mx-auto -rotate-5 translate-y-2 whitespace-nowrap"
      >
        {songData.title}
      </p>
    </h1>
    {#if songData.artist}
      <p
        id="song-artist"
        class="bg-primary text-primary-content text-sm w-max p-2 pl-4 pr-4 rounded-full mx-auto whitespace-nowrap"
      >
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
              <div
                class="line-container"
                class:line-past={i < (engineState()?.activeLineIndex ?? -1)}
                class:line-active={i === (engineState()?.activeLineIndex ?? -1)}
                class:line-upcoming={i > (engineState()?.activeLineIndex ?? -1)}
                data-line-index={i}
              >
                {#if line.parts.length === 1 && line.parts[0].chord === null && line.parts[0].word === ""}
                  <!-- Empty line for spacing -->
                  <div class="h-4"></div>
                {:else}
                  <div class="flex flex-wrap items-start gap-x-1 leading-relaxed">
                    {#each line.parts as part, j}
                      <div class="chord-word-pair inline-block">
                        {#if part.chord}
                          <div
                            class="chord text-blue-600 font-semibold text-sm leading-none mb-1 min-h-[1rem]"
                            class:chord-active={
                              i === (engineState()?.activeLineIndex ?? -1) && j === (engineState()?.activeChordIndex ?? -1)
                            }
                            aria-label="Chord: {part.chord}"
                          >
                            {part.chord}
                          </div>
                        {:else}
                          <div
                            class="chord-spacer min-h-[1rem] mb-1"
                            aria-hidden="true"
                          ></div>
                        {/if}
                        <div class="word text-gray-900 text-base leading-tight">
                          {part.word}
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </section>
  <div
    class="dock max-w-md items-center bottom-4 rounded-3xl left-1/2 -translate-x-1/2 w-[calc(100%-16px)] backdrop-blur-sm bg-transparent"
  >
    <div>
      {#if !autoScrollEnabled}
        <button
          class="btn btn-primary btn-ghost btn-circle"
          aria-label="auto scroll"
          onclick={startAutoScroll}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
            />
          </svg>
        </button>
      {:else}
        <div class="join">
          <button
            class="btn btn-square btn-primary btn-ghost join-item"
            aria-label="backward"
            onclick={decreaseSpeed}
            disabled={engineState() === null || (engineState()?.currentBpm ?? 0) <= 30}
          >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061A1.125 1.125 0 0 1 21 8.689v8.122ZM11.25 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061a1.125 1.125 0 0 1 1.683.977v8.122Z" />
          </svg>
          
          </button>
          <button
            class="btn btn-square btn-primary btn-ghost join-item"
            aria-label="stop"
            onclick={stopAutoScroll}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 5.25v13.5m-7.5-13.5v13.5"
              />
            </svg>
          </button>
          <button
            class="btn btn-square btn-primary btn-ghost join-item"
            aria-label="forward"
            onclick={increaseSpeed}
            disabled={engineState() === null || (engineState()?.currentBpm ?? 0) >= 300}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z"
              />
            </svg>
          </button>
        </div>
      {/if}
      <span class="dock-label">auto scroll</span>
    </div>
    <div>
      <div class="join">
        <button class="btn btn-square btn-ghost join-item" aria-label="minus">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
          </svg>
        </button>
        <button class="btn btn-square btn-ghost join-item" aria-label="plus">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
      </div>
      <span class="dock-label">text size</span>
    </div>
  </div>
</article>

<style>
  .song-content {
    font-family: "Courier New", Consolas, "Liberation Mono", monospace;
  }

  .chord-word-pair {
    position: relative;
  }

  /* Ensure proper alignment on mobile devices */
  @media (max-width: 640px) {
    .chord-word-pair {
      margin-right: 2px;
    }
  }

  /* Touch-friendly spacing for mobile */
  .line-container {
    min-height: 2.5rem;
    touch-action: manipulation;
  }

  /* Visual states for auto-scroll */
  .line-past {
    opacity: 0.7;
  }

  .line-active {
    opacity: 1;
  }

  .line-upcoming {
    opacity: 1;
  }

  /* Highlight the active chord within the active line */
  .chord-active {
    background: rgba(59, 130, 246, 0.15); /* blue-500 at low opacity */
    border-radius: 4px;
    padding: 0 0.125rem;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.06) inset;
  }
</style>
