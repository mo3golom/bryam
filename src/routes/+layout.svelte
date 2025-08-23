<script lang="ts">
	import "../app.css";
	import SkipNavigation from "$lib/components/SkipNavigation.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, viewport-fit=cover"
	/>
</svelte:head>

<SkipNavigation />

<div class="min-h-screen max-w-md mx-auto">
	{@render children?.()}
</div>
