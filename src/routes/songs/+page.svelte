<script lang="ts">
  import { onMount } from 'svelte';
  import { supabaseService } from '$lib/supabaseClient';
  import { analyzeError, isOnline } from '$lib/utils/errorHandling';
  import { addError, initializeConnectivityMonitoring } from '$lib/stores/errorStore';
  import type { SongListItem } from '$lib/types';
  import SongList from '$lib/components/SongList.svelte';
  import ErrorNotification from '$lib/components/ErrorNotification.svelte';
  import Navigation from '$lib/components/Navigation.svelte';
  import Breadcrumb from '$lib/components/Breadcrumb.svelte';

  let songs: SongListItem[] = [];
  let loading = true;
  let error: string | null = null;
  let retryCount = 0;

  async function loadSongs() {
    loading = true;
    error = null;

    // Check if user is online
    if (!isOnline()) {
      error = 'You are currently offline. Please check your internet connection and try again.';
      loading = false;
      return;
    }

    try {
      songs = await supabaseService.fetchSongs({
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 5000
      });
      
      // Reset retry count on success
      retryCount = 0;
    } catch (err) {
      console.error('Error fetching songs:', err);
      
      const errorInfo = analyzeError(err);
      error = errorInfo.message;
      
      // Add global error notification for network issues
      if (errorInfo.isNetworkError) {
        addError(
          'Network error while loading songs. Please check your connection.',
          'error',
          true
        );
      }
      
      retryCount++;
    } finally {
      loading = false;
    }
  }

  async function handleRetry() {
    await loadSongs();
  }

  onMount(async () => {
    // Initialize connectivity monitoring
    initializeConnectivityMonitoring();
    
    // Load songs
    await loadSongs();
  });
</script>

<svelte:head>
  <title>Songs - Ukulele Song Catalog</title>
  <meta name="description" content="Browse our collection of ukulele songs with chords and lyrics" />
</svelte:head>

<Navigation title="Songs" />

<main id="main-content" class="min-h-screen bg-gray-50 py-4 px-4 pt-20" tabindex="-1">
  <div class="max-w-md mx-auto">
    <Breadcrumb items={[
      { label: 'Home', href: '/' },
      { label: 'Songs', current: true }
    ]} />
    
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 text-center">Ukulele Songs</h1>
      <p class="text-gray-600 text-center mt-2">Browse and play your favorite songs</p>
    </header>

    <SongList {songs} {loading} {error} onRetry={handleRetry} />
  </div>
</main>

<!-- Global error notifications -->
<ErrorNotification />