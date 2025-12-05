<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import type { ComponentProps } from 'svelte';

	let {
		variant = 'ghost',
		label,
		align = 'left',
		...restProps
	}: ComponentProps<typeof Button> & { label: string; align?: 'left' | 'right' } = $props();
</script>

<Button
	{variant}
	{...restProps}
	class="w-full {align === 'right' ? 'justify-end' : 'justify-start'}"
>
	{#if align === 'right'}
		<ArrowUpDown class="mr-2 h-4 w-4" />
		{label}
	{:else}
		{label}
		<ArrowUpDown class="ml-2 h-4 w-4" />
	{/if}
</Button>
