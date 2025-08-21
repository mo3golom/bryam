<script lang="ts">
  import type { PageData } from './$types';
  import SongList from '$lib/components/SongList.svelte';
  import ErrorNotification from '$lib/components/ErrorNotification.svelte';

  export let data: PageData;

  $: songs = data.songs || [];
  $: error = data.error || null;

  // No need for loading state, as data is pre-fetched
  const loading = false;

  async function handleRetry() {
    // A full page reload is the simplest way to retry a server load
    location.reload();
  }
</script>

<svelte:head>
  <title>Ukulele Song Catalog</title>
  <meta name="description" content="Browse our collection of ukulele songs with chords and lyrics" />
</svelte:head>

<main id="main-content" class="min-h-screen bg-gray-50 py-4 px-4 pt-20" tabindex="-1">
  <div class="max-w-md mx-auto">
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 text-center">
        <span role="img" aria-label="Musical note">🎵</span> 
        Ukulele Songs
      </h1>
      <p class="text-gray-600 text-center mt-2">Browse and play your favorite songs</p>
    </header>

    <SongList {songs} {loading} {error} onRetry={handleRetry} />
  </div>
</main>

<!-- Global error notifications -->
<ErrorNotification />