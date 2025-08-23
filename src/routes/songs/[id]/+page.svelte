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
<main id="main-content" class="min-h-screen" tabindex="-1">
  <BackButton targetPage="/" />
  <div class="max-w-md mx-auto">
    <!-- Song content -->
    <SongViewer songData={song} />
  </div>
</main>

<!-- Global error notifications -->
<ErrorNotification />