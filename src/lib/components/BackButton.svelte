<script lang="ts">
    import { goto } from "$app/navigation";

    interface Props {
        targetPage: string;
    }

    let { targetPage }: Props = $props();

    async function handleClick() {
        if (targetPage) {
            await goto(targetPage);
        }
    }
</script>

<div>
    <button
        class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-colors touch-manipulation text-main-font"
        onclick={handleClick}
        aria-label="Go back to previous page"
    >
    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-left"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
       <span>Назад</span> 
    </button>
</div>