<script lang="ts">
  export let bpm: number = 120;
  export let setBpm: (n: number) => void = () => {};
  export let min: number = 30;
  export let max: number = 300;
  export let step: number = 1;

  function increase() {
    const next = Math.min(max, (bpm ?? 120) + step);
    setBpm(next);
  }

  function decrease() {
    const next = Math.max(min, (bpm ?? 120) - step);
    setBpm(next);
  }
</script>

<div class="bpm-controller">
  <div class="join">
    <button
      class="btn btn-square btn-ghost join-item"
      aria-label="decrease bpm"
      on:click={decrease}
      disabled={bpm <= min}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
      </svg>
    </button>

    <div class="btn btn-ghost join-item" aria-hidden="true">{bpm} BPM</div>

    <button
      class="btn btn-square btn-ghost join-item"
      aria-label="increase bpm"
      on:click={increase}
      disabled={bpm >= max}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </button>
  </div>
  <span class="dock-label">tempo</span>
</div>

<style>
  .bpm-controller { display: flex; flex-direction: column; align-items: center; }
  .dock-label { display: block; text-align: center; font-size: 0.75rem; color: var(--tw-prose-muted); margin-top: 0.25rem; }
</style>
