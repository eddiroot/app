<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		ViewMode,
		type BlockHighlightTextConfig,
		type HighlightTextBlockProps,
	} from '$lib/schema/task';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import HighlighterIcon from '@lucide/svelte/icons/highlighter';

	let {
		config,
		onConfigUpdate,
		response,
		onResponseUpdate,
		viewMode,
	}: HighlightTextBlockProps = $props();

	let selectedTextIndices = $state<number[]>([]);

	function saveChanges(input: BlockHighlightTextConfig) {
		if (!input.text) {
			alert('Text is required');
			return;
		}

		if (!input.instructions) {
			alert('Instructions are required');
			return;
		}

		onConfigUpdate({ text: input.text, instructions: input.instructions });
	}

	function splitTextIntoWords(text: string): string[] {
		return text.split(/(\s+|[.!?,:;])/).filter((part) => part.trim() !== '');
	}

	function toggleWordSelection(wordIndex: number) {
		if (viewMode !== ViewMode.ANSWER) return;

		const currentSelections = [...(selectedTextIndices || [])];
		const existingIndex = currentSelections.indexOf(wordIndex);

		if (existingIndex > -1) {
			currentSelections.splice(existingIndex, 1);
		} else {
			currentSelections.push(wordIndex);
		}

		selectedTextIndices = currentSelections;

		// Update response
		const words = splitTextIntoWords(config.text);
		const selectedText = currentSelections
			.map((index) => words[index])
			.filter((word) => word);

		onResponseUpdate({ ...response, selectedText });
	}

	function isWordSelected(wordIndex: number): boolean {
		return selectedTextIndices.includes(wordIndex);
	}

	$effect(() => {
		if (response?.selectedText && config.text) {
			const words = splitTextIntoWords(config.text);
			const indices: number[] = [];

			response.selectedText.forEach((selectedWord) => {
				const index = words.findIndex((word) => word === selectedWord);
				if (index > -1 && !indices.includes(index)) {
					indices.push(index);
				}
			});

			selectedTextIndices = indices;
		}
	});
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.CONFIGURE}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<HighlighterIcon />
					Configure Highlight Block
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div class="space-y-2">
					<Label for="text-input">Text to Highlight</Label>
					<Textarea
						id="text-input"
						value={config.text}
						onblur={(e) => {
							const value = (e.target as HTMLTextAreaElement)?.value;
							saveChanges(value ? { ...config, text: value } : config);
						}}
						placeholder="Enter the text that students will highlight..."
						class="min-h-[120px] resize-none"
					/>
				</div>

				<div class="space-y-2">
					<Label for="instructions-input">Instructions</Label>
					<Textarea
						id="instructions-input"
						value={config.instructions}
						onblur={(e) => {
							const value = (e.target as HTMLTextAreaElement)?.value;
							saveChanges(value ? { ...config, instructions: value } : config);
						}}
						placeholder="Enter instructions for students..."
						class="min-h-[60px] resize-none"
					/>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.ANSWER || viewMode === ViewMode.REVIEW}
		{#if config.text && config.instructions}
			<Card.Root>
				<Card.Content class="space-y-4">
					<div class="space-y-4">
						<p class="text-lg font-medium">{config.instructions}</p>
						<div class="text-lg leading-relaxed">
							{#each splitTextIntoWords(config.text) as word, index}
								{#if viewMode === ViewMode.ANSWER}
									<button
										type="button"
										class={`rounded px-1 transition-colors ${
											isWordSelected(index)
												? 'bg-primary'
												: 'hover:bg-primary/40'
										}`}
										onclick={() => toggleWordSelection(index)}
									>
										{word}
									</button>
								{:else}
									<span
										class={`rounded px-1 ${isWordSelected(index) ? 'bg-primary' : ''}`}
									>
										{word}
									</span>
								{/if}
							{/each}
						</div>
					</div>

					{#if viewMode === ViewMode.ANSWER}
						<p class="text-muted-foreground text-sm">
							Click on words to highlight them. You can click again to remove
							the highlight.
						</p>
					{/if}

					{#if viewMode === ViewMode.REVIEW}
						<div class="mt-6 rounded-lg border p-4">
							<div class="text-primary flex items-center gap-2">
								<CheckCircleIcon class="h-5 w-5" />
								<span class="font-medium">Response Submitted</span>
							</div>
							<p class="text-muted-foreground mt-1 text-sm">
								Highlighted {response.selectedText?.length || 0} word(s). This response
								will be reviewed and graded.
							</p>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		{:else}
			<div
				class="flex h-48 w-full items-center justify-center rounded-lg border border-dashed"
			>
				<div class="text-center">
					<HighlighterIcon class="text-muted-foreground mx-auto h-12 w-12" />
					<p class="text-muted-foreground mt-2 text-sm">
						No text highlighting exercise created
					</p>
					<p class="text-muted-foreground text-xs">
						Switch to edit mode to create a text highlighting exercise
					</p>
				</div>
			</div>
		{/if}
	{:else}
		<!-- PRESENTATION MODE: Placeholder for presentation-specific rendering -->
	{/if}
</div>
