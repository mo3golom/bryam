<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import type { Song } from '$lib/types';
  import SongViewer from '$lib/components/SongViewer.svelte';

  let song: Song | null = null;
  let loading = true;
  let error: string | null = null;
  let notFound = false;

  $: songId = $page.params.id;

  onMount(async () => {
    if (!songId) {
      notFound = true;
      loading = false;
      return;
    }

    try {
      const { data, error: supabaseError } = await supabase
        .from('songs')
        .select('id, title, artist, body')
        .eq('id', songId)
        .single();

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          // No rows returned
          notFound = true;
        } else {
          throw supabaseError;
        }
      } else {
        song = data;
      }
    } catch (err) {
      console.error('Error fetching song:', err);
      error = 'Failed to load song. Please try again later.';
    } finally {
      loading = false;
    }
  });

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
        class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-colors"
        on:click={goBackToList}
      >
        <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Songs
      </button>
    </div>

    {#if loading}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="animate-pulse">
          <div class="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div class="space-y-3">
            {#each Array(8) as _}
              <div class="h-4 bg-gray-200 rounded w-full"></div>
            {/each}
          </div>
        </div>
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div class="text-red-600 font-medium mb-2">Failed to Load Song</div>
        <p class="text-red-500 text-sm mb-4">{error}</p>
        <div class="space-x-3">
          <button 
            class="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            on:click={() => window.location.reload()}
          >
            Try Again
          </button>
          <button 
            class="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            on:click={goBackToList}
          >
            Back to Songs
          </button>
        </div>
      </div>
    {:else if notFound}
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div class="text-yellow-600 font-medium mb-2">Song Not Found</div>
        <p class="text-yellow-600 text-sm mb-4">The song you're looking for doesn't exist or may have been removed.</p>
        <button 
          class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          on:click={goBackToList}
        >
          Back to Songs
        </button>
      </div>
    {:else if song}
      <SongViewer songData={song} />
    {/if}
  </div>
</main>