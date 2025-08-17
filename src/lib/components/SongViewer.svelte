<script lang="ts">
  import { parseChordPro } from '$lib/utils/chordpro.js'
  import type { Song } from '$lib/types.js'

  export let songData: Song

  $: parsedSong = parseChordPro(songData.body)
  $: hasContent = songData.body && songData.body.trim().length > 0
</script>

<div class="w-full max-w-md mx-auto px-4 py-6">
  <!-- Song Header -->
  <header class="mb-6 text-center">
    <h1 class="text-2xl font-bold text-gray-900 mb-2 leading-tight">
      {songData.title}
    </h1>
    {#if songData.artist}
      <p class="text-lg text-gray-600 font-medium">
        {songData.artist}
      </p>
    {/if}
  </header>

  <!-- Song Content -->
  <main class="song-content">
    {#if !hasContent}
      <div class="text-center py-8">
        <p class="text-gray-500 text-lg">No content available for this song.</p>
      </div>
    {:else}
      <div class="space-y-4">
        {#each parsedSong.lines as line, lineIndex}
          <div class="line-container">
            {#if line.parts.length === 1 && line.parts[0].chord === null && line.parts[0].word === ''}
              <!-- Empty line for spacing -->
              <div class="h-4"></div>
            {:else}
              <div class="flex flex-wrap items-start gap-x-1 leading-relaxed">
                {#each line.parts as part, partIndex}
                  <div class="chord-word-pair inline-block">
                    {#if part.chord}
                      <div class="chord text-blue-600 font-semibold text-sm leading-none mb-1 min-h-[1rem]">
                        {part.chord}
                      </div>
                    {:else}
                      <div class="chord-spacer min-h-[1rem] mb-1"></div>
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
  </main>
</div>

<style>
  .song-content {
    font-family: 'Courier New', Consolas, 'Liberation Mono', monospace;
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