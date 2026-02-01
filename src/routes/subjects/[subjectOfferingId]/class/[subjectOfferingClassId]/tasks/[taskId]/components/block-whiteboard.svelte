<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { ViewMode, type WhiteboardBlockProps } from '$lib/schema/task';
	import PresentationIcon from '@lucide/svelte/icons/presentation';

	let { config, onConfigUpdate, viewMode }: WhiteboardBlockProps = $props();

	const { taskId, subjectOfferingId, subjectOfferingClassId } = $derived(
		page.params,
	);

	const createWhiteboard = async () => {
		try {
			const response = await fetch('/api/whiteboards', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					taskId: parseInt(taskId!),
					title: config.title || null,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				config.whiteboardId = data.whiteboardId;
				return data.whiteboardId;
			}
		} catch (error) {
			console.error('Failed to create whiteboard:', error);
		}
		return null;
	};

	const saveChanges = async () => {
		let currentWhiteboardId = config.whiteboardId;

		if (!currentWhiteboardId) {
			currentWhiteboardId = await createWhiteboard();
		}

		const newConfig = {
			whiteboardId: currentWhiteboardId,
			title: config.title || '',
		};

		await onConfigUpdate(newConfig);
	};

	const openWhiteboard = async () => {
		let currentWhiteboardId = config.whiteboardId;

		if (!currentWhiteboardId) {
			currentWhiteboardId = await createWhiteboard();
			if (currentWhiteboardId) {
				const newConfig = {
					whiteboardId: currentWhiteboardId,
					title: config.title || '',
				};
				await onConfigUpdate(newConfig);
			}
		}

		if (currentWhiteboardId) {
			const url = `/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${taskId}/whiteboard/${currentWhiteboardId}`;
			goto(url);
		} else {
			console.error('Failed to get whiteboard ID');
		}
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
					Access the configured whiteboard through preview mode.
				</p>
			</Card.Content>
		</Card.Root>
	{:else if config.whiteboardId}
		<div class="rounded-lg border p-6 text-center">
			<PresentationIcon class="text-muted-foreground mx-auto mb-3 h-12 w-12" />
			<h3 class="mb-2 text-lg font-semibold break-words">
				{config.title || 'Interactive Whiteboard'}
			</h3>
			<Button class="mt-6 w-full" onclick={openWhiteboard}
				>Open Whiteboard</Button
			>
		</div>
	{:else}
		<button
			type="button"
			class="focus:ring-primary flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed focus:ring-2 focus:outline-none"
			onclick={openWhiteboard}
			aria-label="Create and open whiteboard"
		>
			<div class="pointer-events-none text-center">
				<PresentationIcon class="text-muted-foreground mx-auto h-12 w-12" />
				<p class="text-muted-foreground mt-2 text-sm">No whiteboard created</p>
				<p class="text-muted-foreground text-xs">
					Click to create and open whiteboard
				</p>
			</div>
		</button>
	{/if}
</div>
