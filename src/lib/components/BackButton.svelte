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
        class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-colors touch-manipulation"
        onclick={handleClick}
        aria-label="Go back to previous page"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="mr-2 h-5 w-5"
            aria-hidden="true"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
        </svg>
        Back
    </button>
</div>
