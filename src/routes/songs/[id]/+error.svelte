<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  function goBackToList() {
    goto('/');
  }

  function retry() {
    window.location.reload();
  }
</script>

<svelte:head>
  <title>Error - Ukulele Song Catalog</title>
  <meta name="description" content="An error occurred while loading the song" />
</svelte:head>

<main class="min-h-screen py-4 px-4">
  <div class="max-w-md mx-auto">
    <!-- Back button -->
    <div class="mb-4">
      <button
        class="inline-flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-colors touch-manipulation"
        on:click={goBackToList}
      >
        <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Songs
      </button>
    </div>

    <!-- Error content -->
    {#if $page.status === 404}
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div class="text-yellow-600 font-medium mb-2">Song Not Found</div>
        <p class="text-yellow-600 text-sm mb-4">
          The song you're looking for doesn't exist or may have been removed.
        </p>
        <button 
          class="px-4 py-3 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors touch-manipulation"
          on:click={goBackToList}
        >
          Back to Songs
        </button>
      </div>
    {:else}
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div class="text-red-600 font-medium mb-2">Failed to Load Song</div>
        <p class="text-red-500 text-sm mb-4">
          {$page.error?.message || 'An unexpected error occurred. Please try again later.'}
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            class="px-4 py-3 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors touch-manipulation"
            on:click={retry}
          >
            Try Again
          </button>
          <button 
            class="px-4 py-3 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors touch-manipulation"
            on:click={goBackToList}
          >
            Back to Songs
          </button>
        </div>
      </div>
    {/if}
  </div>
</main>