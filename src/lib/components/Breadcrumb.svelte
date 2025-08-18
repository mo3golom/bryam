<script lang="ts">
  export interface BreadcrumbItem {
    label: string;
    href?: string;
    current?: boolean;
  }
  
  let { items = [] }: { items: BreadcrumbItem[] } = $props();
  
  function handleKeydown(event: KeyboardEvent, href: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      window.location.href = href;
    }
  }
</script>

{#if items.length > 1}
  <nav class="flex mb-4" aria-label="Breadcrumb">
    <ol class="inline-flex items-center space-x-1 md:space-x-3 text-sm">
      {#each items as item, index}
        <li class="inline-flex items-center">
          {#if index > 0}
            <svg class="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
            </svg>
          {/if}
          
          {#if item.current || !item.href}
            <span class="text-gray-500 font-medium" aria-current="page">{item.label}</span>
          {:else}
            <a
              href={item.href}
              class="text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-1 py-1 transition-colors touch-manipulation min-h-[44px] flex items-center"
              onkeydown={(e) => item.href && handleKeydown(e, item.href)}
            >
              {item.label}
            </a>
          {/if}
        </li>
      {/each}
    </ol>
  </nav>
{/if}