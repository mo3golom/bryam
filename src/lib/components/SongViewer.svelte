<script lang="ts">
  import { parseChordPro } from '$lib/utils/chordpro.js'
  import { addError } from '$lib/stores/errorStore'
  import type { Song } from '$lib/types.js'

  export let songData: Song

  let parsedSong: ReturnType<typeof parseChordPro>
  let hasContent: boolean
  let parseError = false

  $: {
    try {
      if (songData?.body) {
        parsedSong = parseChordPro(songData.body)
        hasContent = songData.body.trim().length > 0
        parseError = false
      } else {
        parsedSong = { lines: [] }
        hasContent = false
        parseError = false
      }
    } catch (error) {
      console.error('Error parsing ChordPro content:', error)
      parseError = true
      hasContent = false
      parsedSong = { lines: [] }
      
      addError(
        'There was an issue parsing the song content. The song may display incorrectly.',
        'warning',
        false,
        true
      )
    }
  }
</script>

<div class="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-6">
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
    {#if parseError}
      <div class="text-center py-8">
        <div class="text-yellow-600 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p class="text-gray-700 text-lg mb-4">Unable to parse song content</p>
        <div class="bg-gray-100 rounded-lg p-4 text-left">
          <pre class="text-sm text-gray-800 whitespace-pre-wrap">{songData.body}</pre>
        </div>
      </div>
    {:else if !hasContent}
      <div class="text-center py-8">
        <p class="text-gray-500 text-lg">No content available for this song.</p>
      </div>
    {:else}
      <div class="space-y-4">
        {#each parsedSong.lines as line}
          <div class="line-container">
            {#if line.parts.length === 1 && line.parts[0].chord === null && line.parts[0].word === ''}
              <!-- Empty line for spacing -->
              <div class="h-4"></div>
            {:else}
              <div class="flex flex-wrap items-start gap-x-1 leading-relaxed">
                {#each line.parts as part}
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