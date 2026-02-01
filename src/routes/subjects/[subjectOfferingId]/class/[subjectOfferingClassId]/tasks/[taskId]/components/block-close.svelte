<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		ViewMode,
		type BlockCloseConfig,
		type CloseBlockProps,
	} from '$lib/schema/task';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import PenToolIcon from '@lucide/svelte/icons/pen-tool';

	let {
		config,
		onConfigUpdate,
		response,
		onResponseUpdate,
		viewMode,
	}: CloseBlockProps = $props();

	function parseSentence(sentence: string): { parts: string[] } {
		const parts = sentence.split('_____');
		return { parts };
	}

	function getBlankCount(sentence: string): number {
		return (sentence.match(/_____/g) || []).length;
	}

	function saveChanges(input: BlockCloseConfig) {
		if (!input.text.trim()) {
			return;
		}

		onConfigUpdate({ text: input.text.trim() });
	}

	function syncBlanksWithSentence(
		sentence: string,
		currentAnswers: string[] = [],
	) {
		const blankCount = getBlankCount(sentence);
		const newAnswers = [...currentAnswers];

		if (newAnswers.length > blankCount) {
			newAnswers.splice(blankCount);
		} else if (newAnswers.length < blankCount) {
			while (newAnswers.length < blankCount) {
				newAnswers.push('');
			}
		}

		return newAnswers;
	}
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.CONFIGURE}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<PenToolIcon />
					Configure Close Block
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div class="space-y-2">
					<Label for="text-input">Text with Input Areas</Label>
					<Textarea
						id="text-input"
						value={config.text}
						onblur={(e) => {
							const value = (e.target as HTMLTextAreaElement)?.value;
							if (value) {
								const syncedAnswers = syncBlanksWithSentence(
									value,
									response?.answers || [],
								);
								saveChanges({ ...config, text: value });
								onResponseUpdate({ ...response, answers: syncedAnswers });
							}
						}}
						placeholder="Enter your text with _____ where students should input responses..."
						class="min-h-[80px] resize-none"
					/>
					<p class="text-muted-foreground text-xs">
						Use _____ (5 underscores) to indicate where students can input their
						responses.
					</p>
				</div>

				{#if config.text && getBlankCount(config.text) > 0}
					{@const parsed = parseSentence(config.text)}
					<div class="space-y-2">
						<Label>Preview</Label>
						<div
							class="dark:bg-input/30 border-input rounded-lg border bg-transparent p-4"
						>
							<div
								class="flex flex-wrap items-center gap-1 text-lg leading-relaxed"
							>
								{#each parsed.parts as part, index}
									<span>{part}</span>
									{#if index < parsed.parts.length - 1}
										<span
											class="border-muted-foreground text-muted-foreground mx-1 inline-block min-w-[100px] border-b-2 border-dashed px-2 py-1 text-center italic"
										>
											...
										</span>
									{/if}
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.ANSWER || viewMode === ViewMode.REVIEW}
		{#if config.text && getBlankCount(config.text) > 0}
			<Card.Root>
				<Card.Content>
					{@const parsed = parseSentence(config.text)}
					<div
						class="flex flex-wrap items-center gap-1 text-lg leading-relaxed"
					>
						{#each parsed.parts as part, index}
							<span>{part}</span>
							{#if index < parsed.parts.length - 1}
								<div class="relative mx-1 inline-block">
									<Input
										value={response.answers?.[index] || ''}
										oninput={async (e) => {
											const target = e.target as HTMLInputElement;
											const newAnswers = [...(response.answers || [])];
											newAnswers[index] = target.value;
											const newResponse = { ...response, answers: newAnswers };
											await onResponseUpdate(newResponse);
											target.style.width =
												Math.max(100, target.value.length * 8 + 20) + 'px';
										}}
										disabled={viewMode !== ViewMode.ANSWER}
										class={`focus:border-primary border-muted-foreground border-0 border-b-2 border-dashed bg-transparent px-2 py-1 text-center focus:border-solid focus:outline-none ${
											viewMode === ViewMode.ANSWER
												? 'focus:bg-background/50'
												: ''
										}`}
										style="border-radius: 0; width: {Math.max(
											100,
											(response.answers?.[index] || '').length * 8 + 20,
										)}px; min-width: 100px;"
									/>
								</div>
							{/if}
						{/each}
					</div>

					{#if viewMode === ViewMode.ANSWER}
						<p class="text-muted-foreground mt-4 text-sm">
							Complete the text by filling in your responses where indicated.
						</p>
					{/if}

					{#if viewMode === ViewMode.REVIEW}
						<div class="mt-6 rounded-lg border p-4">
							<div class="text-primary flex items-center gap-2">
								<CheckCircleIcon class="h-5 w-5" />
								<span class="font-medium">Response Submitted</span>
							</div>
							<p class="text-muted-foreground mt-1 text-sm">
								This response will be reviewed and graded based on the criteria.
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
					<PenToolIcon class="text-muted-foreground mx-auto h-12 w-12" />
					<p class="text-muted-foreground mt-2 text-sm">
						No close passage created
					</p>
					<p class="text-muted-foreground text-xs">
						Switch to edit mode to create a close passage with input areas
					</p>
				</div>
			</div>
		{/if}
	{:else}
		<!-- PRESENTATION MODE: Placeholder for presentation-specific rendering -->
	{/if}
</div>
