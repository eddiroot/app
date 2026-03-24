<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import { ViewMode, type MatchingBlockProps } from '$lib/schema/task';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import {
		dndState,
		draggable,
		droppable,
		type DragDropState,
	} from '@thisux/sveltednd';

	let {
		config,
		onConfigUpdate,
		response,
		onResponseUpdate,
		viewMode,
	}: MatchingBlockProps = $props();

	let draggedItemIndex = $state<number | null>(null);

	function addPair() {
		const newConfig = {
			...config,
			pairs: [...config.pairs, { left: '', right: '' }],
		};
		onConfigUpdate(newConfig);
	}

	function removePair(index: number) {
		if (config.pairs.length <= 1) return;
		const newConfig = {
			...config,
			pairs: config.pairs.filter((_, i) => i !== index),
		};
		onConfigUpdate(newConfig);
	}

	function updatePair(index: number, field: 'left' | 'right', value: string) {
		if (index < 0 || index >= config.pairs.length) return;
		const newConfig = { ...config };
		const updatedPairs = [...newConfig.pairs];
		updatedPairs[index] = { ...updatedPairs[index], [field]: value };
		newConfig.pairs = updatedPairs;
		onConfigUpdate(newConfig);
	}

	$effect(() => {
		if (!response || !response.matches || response.matches.length === 0) {
			const rightItems = config.pairs
				.map((pair) => pair.right)
				.sort(() => Math.random() - 0.5);
			onResponseUpdate({
				matches: config.pairs.map((pair, index) => ({
					left: pair.left,
					right: rightItems[index],
				})),
			});
		}
	});

	function handleDrop(state: DragDropState<string>) {
		const { draggedItem, targetContainer } = state;
		if (!targetContainer || !targetContainer.startsWith('matching-')) return;

		const targetIndex = parseInt(targetContainer.split('-')[1]);
		const sourceIndex = response.matches.findIndex(
			(match) => match.right === draggedItem,
		);

		const newMatches = [...response.matches];
		const temp = newMatches[sourceIndex].right;
		newMatches[sourceIndex] = {
			...newMatches[sourceIndex],
			right: newMatches[targetIndex].right,
		};
		newMatches[targetIndex] = { ...newMatches[targetIndex], right: temp };

		if (onResponseUpdate) {
			onResponseUpdate({ matches: newMatches });
		}
	}
</script>

{#if viewMode === ViewMode.CONFIGURE}
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-lg font-semibold">Matching Exercise</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			<!-- Instructions -->
			<div class="space-y-2">
				<Label for="instructions">Instructions</Label>
				<Textarea
					id="instructions"
					value={config.instructions}
					oninput={(e) => {
						const value = (e.target as HTMLTextAreaElement)?.value;
						if (value !== undefined) {
							const newConfig = { ...config, instructions: value };
							onConfigUpdate(newConfig);
						}
					}}
					placeholder="Enter instructions for the matching exercise..."
					class="min-h-20"
				/>
			</div>

			<!-- Pairs -->
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<Label class="text-sm font-medium">Matching Pairs</Label>
					<Button size="sm" onclick={addPair}>
						<PlusIcon class="mr-2 h-4 w-4" />
						Add Pair
					</Button>
				</div>

				{#each config.pairs as pair, index (index)}
					<div class="flex items-center gap-4 rounded-lg border p-3">
						<div class="flex-1">
							<Label class="text-muted-foreground text-xs">Left Item</Label>
							<Input
								value={pair.left}
								oninput={(e) => {
									const value = (e.target as HTMLInputElement)?.value;
									if (value !== undefined) {
										updatePair(index, 'left', value);
									}
								}}
								placeholder="Left item..."
								class="mt-1"
							/>
						</div>

						<div class="flex-1">
							<Label class="text-muted-foreground text-xs">Right Item</Label>
							<Input
								value={pair.right}
								oninput={(e) => {
									const value = (e.target as HTMLInputElement)?.value;
									if (value !== undefined) {
										updatePair(index, 'right', value);
									}
								}}
								placeholder="Right item..."
								class="mt-1"
							/>
						</div>

						{#if config.pairs.length > 1}
							<Button
								variant="outline"
								onclick={() => removePair(index)}
								class="text-destructive hover:text-destructive self-end"
							>
								<TrashIcon />
							</Button>
						{/if}
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
{:else if viewMode === ViewMode.ANSWER}
	<!-- Answer Mode -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-lg font-semibold">Matching Exercise</Card.Title>
			{#if config.instructions}
				<Card.Description>{config.instructions}</Card.Description>
			{/if}
		</Card.Header>
		<Card.Content class="space-y-2">
			{#if response.matches.length > 0 && response.matches.some( (pair) => pair.left.trim(), )}
				{#each response.matches.filter( (pair) => pair.left.trim(), ) as pair, pairIndex (pairIndex)}
					<div
						class="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8"
					>
						<!-- Left Item -->
						<div class="bg-input/50 min-h-12 rounded-lg border p-3">
							<span class="font-medium">{pair.left}</span>
						</div>

						<!-- Arrow -->
						<ArrowRightIcon class="text-muted-foreground" />

						<!-- Right Item -->
						{#if response?.matches?.[pairIndex]?.right}
							<div
								class="bg-muted flex min-h-12 flex-1 items-center rounded-lg border p-3 {dndState.targetContainer ===
									`matching-${pairIndex}` && draggedItemIndex !== pairIndex
									? 'border-accent-foreground border-dashed'
									: 'cursor-grab'}"
								use:droppable={{
									container: `matching-${pairIndex}`,
									callbacks: { onDrop: handleDrop },
								}}
								use:draggable={{
									container: 'matching-items',
									dragData: response.matches[pairIndex].right,
									callbacks: {
										onDragStart: () => {
											draggedItemIndex = pairIndex;
										},
										onDragEnd: () => {
											draggedItemIndex = null;
										},
									},
								}}
							>
								<span class="font-medium"
									>{response.matches[pairIndex].right}</span
								>
							</div>
						{/if}
					</div>
				{/each}
			{:else}
				<p class="text-muted-foreground">No matching pairs configured.</p>
			{/if}
		</Card.Content>
	</Card.Root>
{/if}
