<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import SongViewer from '$lib/components/SongViewer.svelte';

  export let data: PageData;

  $: song = data.song;

  function goBackToList() {
    goto('/songs');
  }
</script>

<svelte:head>
  <title>{song ? `${song.title} - Ukulele Song Catalog` : 'Song - Ukulele Song Catalog'}</title>
  <meta name="description" content={song ? `${song.title} by ${song.artist || 'Unknown artist'} - Ukulele chords and lyrics` : 'Ukulele song with chords and lyrics'} />
</svelte:head>

<main class="min-h-screen bg-gray-50 py-4 px-4">
  <div class="max-w-md mx-auto">
    <!-- Back button -->
    <div class="mb-4">
      <button
        class="inline-flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-colors touch-manipulation"
        on:click={goBackToList}
      >
        <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Songs
      </button>
    </div>

    <!-- Song content -->
    <SongViewer songData={song} />
  </div>
</main>