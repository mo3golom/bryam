<script lang="ts">
  import { goto } from '$app/navigation';
  import type { SongListItem } from '$lib/types';

  export let songs: SongListItem[] = [];
  export let loading = false;
  export let error: string | null = null;

  function navigateToSong(songId: string) {
    goto(`/songs/${songId}`);
  }

  function handleKeydown(event: KeyboardEvent, songId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigateToSong(songId);
    }
  }
</script>

<div class="w-full">
  {#if loading}
    <div class="space-y-4">
      {#each Array(3) as _}
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
          <div class="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      {/each}
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
      <div class="text-red-600 font-medium mb-2">Oops! Something went wrong</div>
      <p class="text-red-500 text-sm">{error}</p>
      <button 
        class="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        on:click={() => window.location.reload()}
      >
        Try Again
      </button>
    </div>
  {:else if songs.length === 0}
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
      <div class="text-gray-400 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No songs available</h3>
      <p class="text-gray-500 text-sm">Check back later for new songs to play!</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each songs as song (song.id)}
        <div
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 transition-all duration-200 touch-manipulation"
          role="button"
          tabindex="0"
          on:click={() => navigateToSong(song.id)}
          on:keydown={(e) => handleKeydown(e, song.id)}
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-gray-900 truncate mb-1">
                {song.title}
              </h3>
              {#if song.artist}
                <p class="text-sm text-gray-600 truncate">
                  by {song.artist}
                </p>
              {:else}
                <p class="text-sm text-gray-400 italic">
                  Unknown artist
                </p>
              {/if}
            </div>
            <div class="ml-4 flex-shrink-0">
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .touch-manipulation {
    touch-action: manipulation;
  }
</style>