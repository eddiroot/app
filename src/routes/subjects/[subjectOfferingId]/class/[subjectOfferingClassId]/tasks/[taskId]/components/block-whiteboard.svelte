<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { ViewMode, type WhiteboardBlockProps } from '$lib/schema/task';
	import PresentationIcon from '@lucide/svelte/icons/presentation';

	let {
		blockId,
		config,
		onConfigUpdate,
		viewMode,
		whiteboardMap
	}: WhiteboardBlockProps & { whiteboardMap?: Record<number, number> } = $props();

	const { taskId, subjectOfferingId, subjectOfferingClassId } = $derived(page.params);

	const whiteboardId = $derived(whiteboardMap?.[blockId] ?? null);

	const openWhiteboard = () => {
		if (!whiteboardId) {
			console.error('No whiteboard ID available');
			return;
		}

		const url = `/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${taskId}/whiteboard/${whiteboardId}`;
		goto(url);
	};
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.CONFIGURE}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<PresentationIcon />
					Configure Whiteboard
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-2">
					<Label for="whiteboard-title">Whiteboard Title (Optional)</Label>
					<Input
						id="whiteboard-title"
						value={config.title}
						oninput={(e) => {
							const value = (e.target as HTMLInputElement)?.value;
							if (value !== undefined) {
								const newConfig = { ...config, title: value };
								onConfigUpdate(newConfig);
							}
						}}
						placeholder="Enter a title here"
					/>
				</div>
				<p class="text-muted-foreground text-sm">
					Each whiteboard block has its own unique whiteboard. Access it through preview mode.
				</p>
			</Card.Content>
		</Card.Root>
	{:else if whiteboardId}
		<div class="rounded-lg border p-6 text-center">
			<PresentationIcon class="text-muted-foreground mx-auto mb-3 h-12 w-12" />
			<h3 class="mb-2 text-lg font-semibold break-words">
				{config.title || 'Interactive Whiteboard'}
			</h3>
			<Button class="mt-6 w-full" onclick={openWhiteboard}>Open Whiteboard</Button>
		</div>
	{:else}
		<div class="rounded-lg border p-6 text-center">
			<PresentationIcon class="text-muted-foreground mx-auto mb-3 h-12 w-12" />
			<p class="text-muted-foreground">Whiteboard not found. Please try refreshing the page.</p>
		</div>
	{/if}
</div>
