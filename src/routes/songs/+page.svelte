<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import type { SongListItem } from '$lib/types';
  import SongList from '$lib/components/SongList.svelte';

  let songs: SongListItem[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('songs')
        .select('id, title, artist')
        .order('title');

      if (supabaseError) {
        throw supabaseError;
      }

      songs = data || [];
    } catch (err) {
      console.error('Error fetching songs:', err);
      error = 'Failed to load songs. Please try again later.';
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Songs - Ukulele Song Catalog</title>
  <meta name="description" content="Browse our collection of ukulele songs with chords and lyrics" />
</svelte:head>

<main class="min-h-screen bg-gray-50 py-4 px-4">
  <div class="max-w-md mx-auto">
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 text-center">Ukulele Songs</h1>
      <p class="text-gray-600 text-center mt-2">Browse and play your favorite songs</p>
    </header>

    <SongList {songs} {loading} {error} />
  </div>
</main>