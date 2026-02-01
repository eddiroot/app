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

	// Safe to ignore - initial state won't change after mount
	// svelte-ignore state_referenced_locally
	let liked = $state(initialLiked);
	// svelte-ignore state_referenced_locally
	let count = $state(initialCount);
	let isSubmitting = $state(false);
</script>

<form
	method="POST"
	{action}
	use:enhance={() => {
		// Optimistic update
		const previousLiked = liked;
		const previousCount = count;

		liked = !liked;
		count = liked ? count + 1 : count - 1;
		isSubmitting = true;

		return async ({ result, update }) => {
			isSubmitting = false;

			if (result.type === 'success' && result.data?.success) {
				// Server confirmed the action
				await update();
			} else {
				// Revert on error
				liked = previousLiked;
				count = previousCount;
			}
		};
	}}
>
	{#if itemId !== undefined}
		<input type="hidden" name="responseId" value={itemId} />
	{/if}
	<Button type="submit" variant="ghost" {size} disabled={isSubmitting}>
		<Heart class={liked ? 'fill-current' : ''} />
		{#if count > 0}
			<span class="text-xs font-medium">{count}</span>
		{/if}
	</Button>
</form>
