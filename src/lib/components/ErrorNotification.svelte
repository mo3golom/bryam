<script lang="ts">
  import { errors, removeError, type AppError } from '$lib/stores/errorStore';
  import { fly } from 'svelte/transition';

  function handleDismiss(errorId: string) {
    removeError(errorId);
  }

  function getErrorStyles(type: AppError['type']) {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  }

  function getIconPath(type: AppError['type']) {
    switch (type) {
      case 'error':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      case 'info':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }
</script>

<!-- Error notifications container -->
{#if $errors.length > 0}
  <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
    {#each $errors as error (error.id)}
      <div
        class="rounded-lg border p-4 shadow-lg {getErrorStyles(error.type)}"
        transition:fly={{ x: 300, duration: 300 }}
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIconPath(error.type)} />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm font-medium">
              {error.message}
            </p>
          </div>
          <div class="ml-4 flex-shrink-0">
            <button
              class="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent"
              on:click={() => handleDismiss(error.id)}
            >
              <span class="sr-only">Dismiss</span>
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}