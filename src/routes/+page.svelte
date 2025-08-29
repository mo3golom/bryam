<script lang="ts">
  import type { PageData } from "./$types";
  import SongList from "$lib/components/SongList.svelte";
  import ErrorNotification from "$lib/components/ErrorNotification.svelte";

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
  <meta
    name="description"
    content="Browse our collection of ukulele songs with chords and lyrics"
  />
</svelte:head>

<main id="main-content" class="min-h-screen pt-8" tabindex="-1">
  <div class="max-w-md mx-auto">
    <header class="mb-6 text-center">
      <h1
        id="daily-quiz-heading"
        class="text-4xl font-bold text-main-font"
      >
        <p
          class=" relative bg-primary text-primary-content min-w-30 w-max p-2 pl-4 pr-4 rounded-full mx-auto -rotate-5 translate-y-2 whitespace-nowrap z-10"
        >
          Брям
        </p>
        <p
        class="relative bg-primary text-primary-content text-sm w-max p-2 pl-4 pr-4 rounded-full mx-auto whitespace-nowrap z-20"
      >
        аккорды для укулеле
      </p>
      </h1>
    </header>

    <SongList {songs} {loading} {error} onRetry={handleRetry} />
  </div>
</main>

<!-- Global error notifications -->
<ErrorNotification />
