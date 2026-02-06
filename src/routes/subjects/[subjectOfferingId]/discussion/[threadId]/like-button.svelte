<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, type ButtonSize } from '$lib/components/ui/button';
	import Heart from '@lucide/svelte/icons/heart';

	let {
		action,
		itemId,
		initialLiked = false,
		initialCount = 0,
		size = 'sm',
	}: {
		action: string;
		itemId?: number;
		initialLiked?: boolean;
		initialCount?: number;
		size?: ButtonSize;
	} = $props();

	let liked = $derived(initialLiked);
	let count = $derived(initialCount);
	let isSubmitting = $state(false);
</script>

<form method="POST" {action} use:enhance>
	{#if itemId !== undefined}
		<input type="hidden" name="responseId" value={itemId} />
	{/if}
	<Button
		type="submit"
		variant={itemId !== undefined ? 'ghost' : 'outline'}
		{size}
		disabled={isSubmitting}
	>
		<Heart class={liked ? 'fill-primary stroke-primary' : ''} />
		<span class="font-mono {itemId !== undefined ? 'text-xs' : 'text-sm'}"
			>{count}</span
		>
	</Button>
</form>
