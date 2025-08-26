<script lang="ts">
  import { TempoScrollEngine } from "$lib/utils/TempoScrollEngine.js";
  import { parseChordPro, type ParsedSong } from "$lib/utils/chordpro.js";
  import type { Song } from "$lib/types.js";

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

  // Instantiate the engine
  const engine = new TempoScrollEngine(parsedSong, DEFAULT_BPM);

  // Expose engine's state to Svelte's reactivity
  const engineState = engine.stateStore;

  // Check if content is empty or whitespace only
  let isEmpty = $derived(!songData.body || songData.body.trim() === "");
  let hasError = $derived(
    parsedSong.error || (parsedSong.lines.length === 0 && !isEmpty)
  );
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
            {#each parsedSong.lines as line}
              <div class="line-container">
                {#if line.parts.length === 1 && line.parts[0].chord === null && line.parts[0].word === ""}
                  <!-- Empty line for spacing -->
                  <div class="h-4"></div>
                {:else}
                  <div class="flex flex-wrap items-start gap-x-1 leading-relaxed">
                    {#each line.parts as part}
                      <div class="chord-word-pair inline-block">
                        {#if part.chord}
                          <div
                            class="chord text-blue-600 font-semibold text-sm leading-none mb-1 min-h-[1rem]"
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
      {#if !$engineState.isActive && !$engineState.isPaused}
        <button
          class="btn btn-primary btn-ghost btn-circle"
          aria-label="Start auto scroll"
          onclick={() => engine.start()}
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
            aria-label="Pause"
            onclick={() => engine.pause()}
            disabled={$engineState.isPaused}
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
            aria-label="Stop"
            onclick={() => engine.stop()}
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
                d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z"
              />
            </svg>
          </button>
          <button
            class="btn btn-square btn-primary btn-ghost join-item"
            aria-label="Resume"
            onclick={() => engine.resume()}
            disabled={!$engineState.isPaused}
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
</style>
