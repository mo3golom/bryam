<script lang="ts">
  import { onMount } from 'svelte';
  import { initializeConnectivityMonitoring } from '$lib/stores/errorStore';
  import type { PageData } from './$types';
  import SongViewer from '$lib/components/SongViewer.svelte';
  import ErrorNotification from '$lib/components/ErrorNotification.svelte';
  import BackButton from '$lib/components/BackButton.svelte';

  export let data: PageData;

  $: song = data.song;

  onMount(() => {
    // Initialize connectivity monitoring
    initializeConnectivityMonitoring();
  });
</script>

<svelte:head>
  <title>{song ? `${song.title} - Ukulele Song Catalog` : 'Song - Ukulele Song Catalog'}</title>
  <meta name="description" content={song ? `${song.title} by ${song.artist || 'Unknown artist'} - Ukulele chords and lyrics` : 'Ukulele song with chords and lyrics'} />
</svelte:head>

<BackButton targetPage="/" />

<main id="main-content" class="min-h-screen bg-gray-50 py-4 px-4 pt-20" tabindex="-1">
  <div class="max-w-md mx-auto">
    <!-- Song content -->
    <SongViewer songData={song} />
  </div>
</main>

<!-- Global error notifications -->
<ErrorNotification />