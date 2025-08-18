<script lang="ts">
  import { goto } from '$app/navigation';
  import Navigation from '$lib/components/Navigation.svelte';

  function navigateToSongs() {
    goto('/songs');
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigateToSongs();
    }
  }
</script>

<svelte:head>
  <title>Ukulele Song Catalog</title>
  <meta name="description" content="A collection of ukulele songs with chords and lyrics" />
</svelte:head>

<Navigation title="Ukulele Catalog" />

<main id="main-content" class="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-16" tabindex="-1">
  <div class="max-w-md mx-auto text-center">
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        <span role="img" aria-label="Musical note">🎵</span> 
        Ukulele Song Catalog
      </h1>
      <p class="text-lg text-gray-600 mb-8">
        Discover and play your favorite songs with chords and lyrics optimized for ukulele.
      </p>
    </div>

    <button
      class="w-full bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg touch-manipulation min-h-[48px]"
      on:click={navigateToSongs}
      on:keydown={handleKeydown}
      aria-describedby="browse-description"
    >
      Browse Songs
    </button>

    <div id="browse-description" class="mt-6 text-sm text-gray-500">
      <p>Mobile-optimized for playing on the go</p>
    </div>
  </div>
</main>
