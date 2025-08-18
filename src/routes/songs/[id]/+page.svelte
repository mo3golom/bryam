<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { initializeConnectivityMonitoring } from '$lib/stores/errorStore';
  import type { PageData } from './$types';
  import SongViewer from '$lib/components/SongViewer.svelte';
  import ErrorNotification from '$lib/components/ErrorNotification.svelte';
  import Navigation from '$lib/components/Navigation.svelte';
  import Breadcrumb from '$lib/components/Breadcrumb.svelte';

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

<Navigation 
  showBackButton={true} 
  backUrl="/songs" 
  title={song ? song.title : 'Song'} 
/>

<main id="main-content" class="min-h-screen bg-gray-50 py-4 px-4 pt-20" tabindex="-1">
  <div class="max-w-md mx-auto">
    <Breadcrumb items={[
      { label: 'Home', href: '/' },
      { label: 'Songs', href: '/songs' },
      { label: song ? song.title : 'Song', current: true }
    ]} />

    <!-- Song content -->
    <SongViewer songData={song} />
  </div>
</main>

<!-- Global error notifications -->
<ErrorNotification />