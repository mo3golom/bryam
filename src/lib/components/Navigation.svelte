<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  let { showBackButton = false, backUrl = '/', title = '' } = $props();
  
  function handleBack() {
    goto(backUrl);
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleBack();
    }
  }
  
  // Determine current page context for navigation
  const currentPath = $derived($page.url.pathname);
  const isHomePage = $derived(currentPath === '/');
  const isSongsPage = $derived(currentPath === '/songs');
  const isSongDetailPage = $derived(currentPath.startsWith('/songs/') && currentPath !== '/songs');
</script>

<nav class="bg-white border-b border-gray-200 sticky top-0 z-50" aria-label="Main navigation">
  <div class="max-w-md mx-auto px-4">
    <div class="flex items-center justify-between h-16">
      <!-- Back button or home link -->
      {#if showBackButton}
        <button
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-colors touch-manipulation min-h-[44px] min-w-[44px]"
          onclick={handleBack}
          onkeydown={handleKeydown}
          aria-label="Go back to previous page"
        >
          <svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="sr-only sm:not-sr-only">Back</span>
        </button>
      {:else}
        <a
          href="/"
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-colors touch-manipulation min-h-[44px]"
          aria-label="Go to home page"
        >
          <svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span class="sr-only sm:not-sr-only">Home</span>
        </a>
      {/if}
      
      <!-- Page title -->
      <div class="flex-1 text-center">
        {#if title}
          <h1 class="text-lg font-semibold text-gray-900 truncate px-4">{title}</h1>
        {:else if isSongDetailPage}
          <h1 class="text-lg font-semibold text-gray-900 truncate px-4">Song Details</h1>
        {:else if isSongsPage}
          <h1 class="text-lg font-semibold text-gray-900 truncate px-4">Songs</h1>
        {:else}
          <h1 class="text-lg font-semibold text-gray-900 truncate px-4">Ukulele Catalog</h1>
        {/if}
      </div>
      
      <!-- Right side actions -->
      <div class="flex items-center space-x-2">
        {#if !isSongsPage && !isHomePage}
          <a
            href="/songs"
            class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-colors touch-manipulation min-h-[44px]"
            aria-label="Browse all songs"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span class="sr-only sm:not-sr-only ml-1">Songs</span>
          </a>
        {/if}
      </div>
    </div>
  </div>
</nav>