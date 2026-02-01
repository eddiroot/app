<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		ViewMode,
		type BlockFillBlankConfig,
		type FillBlankBlockProps,
	} from '$lib/schema/task';
	import PenToolIcon from '@lucide/svelte/icons/pen-tool';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		config,
		onConfigUpdate,
		response,
		onResponseUpdate,
		viewMode,
	}: FillBlankBlockProps = $props();

	function isAnswerCorrect(): boolean {
		if (!response?.answers || !config.answers) return false;
		if (response.answers.length !== config.answers.length) return false;
		return response.answers.every(
			(answer, index) =>
				answer?.trim().toLowerCase() ===
				config.answers[index]?.trim().toLowerCase(),
		);
	}

	function parseSentence(sentence: string): { parts: string[] } {
		const parts = sentence.split('_____');
		return { parts };
	}

	function getBlankCount(sentence: string): number {
		return (sentence.match(/_____/g) || []).length;
	}

	function saveChanges(input: BlockFillBlankConfig) {
		if (!input.sentence.trim()) {
			return;
		}

		onConfigUpdate({
			sentence: input.sentence.trim(),
			answers: input.answers || [],
		});
	}

	function syncBlanksWithSentence(
		sentence: string,
		currentAnswers: string[] = [],
	) {
		const blankCount = getBlankCount(sentence);
		const newAnswers = [...currentAnswers];

		// Adjust answers array to match blank count
		if (newAnswers.length > blankCount) {
			// Remove excess answers
			newAnswers.splice(blankCount);
		} else if (newAnswers.length < blankCount) {
			// Add empty answers for new blanks
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
					Configure Fill Blank Block
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div class="space-y-2">
					<Label for="sentence-text">Sentence</Label>
					<Textarea
						id="sentence-text"
						value={config.sentence}
						onblur={(e) => {
							const value = (e.target as HTMLTextAreaElement)?.value;
							if (value) {
								const syncedAnswers = syncBlanksWithSentence(
									value,
									config.answers,
								);
								saveChanges({
									...config,
									sentence: value,
									answers: syncedAnswers,
								});
							}
						}}
						placeholder="Enter your sentence with _____ where blanks should be..."
						class="min-h-[80px] resize-none"
					/>
					<p class="text-muted-foreground text-xs">
						Use _____ (5 underscores) to indicate where blanks should appear in
						the sentence.
					</p>
				</div>

				<div class="space-y-2">
					<Label>Correct Answers</Label>
					{#each config.answers || [] as answer, index}
						<div class="flex gap-2">
							<Input
								value={answer}
								oninput={(e) => {
									const value = (e.target as HTMLInputElement)?.value;
									const newAnswers = [...(config.answers || [])];
									newAnswers[index] = value;
									saveChanges({ ...config, answers: newAnswers });
								}}
							/>
							<Button
								variant="destructive"
								onclick={() => {
									const newAnswers = [...(config.answers || [])];
									newAnswers[index] = '';
									saveChanges({ ...config, answers: newAnswers });
								}}
							>
								Clear
							</Button>
						</div>
					{/each}
				</div>

				{#if config.sentence && config.answers && config.answers.length > 0}
					{@const parsed = parseSentence(config.sentence)}
					<div class="space-y-2">
						<Label>Preview</Label>
						<div
							class="dark:bg-input/30 border-input rounded-lg border bg-transparent p-4"
						>
							<div
								class="flex flex-wrap items-center gap-2 text-lg leading-relaxed"
							>
								{#each parsed.parts as part, index}
									<span>{part}</span>
									{#if index < parsed.parts.length - 1}
										<span
											class="border-primary/50 mx-2 inline-block max-w-[200px] min-w-[140px] rounded-lg border-2 px-3 py-2 text-center font-medium shadow-sm"
										>
											{config.answers[index] || ''}
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
		{#if config.sentence && config.answers}
			<Card.Root>
				<Card.Content>
					{@const parsed = parseSentence(config.sentence)}
					<div
						class="flex flex-wrap items-center gap-2 text-lg leading-relaxed"
					>
						{#each parsed.parts as part, index}
							<span>{part}</span>
							{#if index < parsed.parts.length - 1}
								<div class="relative mx-2 inline-block">
									<Input
										value={response.answers?.[index] || ''}
										oninput={async (e) => {
											const target = e.target as HTMLInputElement;
											const newAnswers = [...(response.answers || [])];
											newAnswers[index] = target.value;
											const newResponse = { ...response, answers: newAnswers };
											await onResponseUpdate(newResponse);
										}}
										disabled={viewMode !== ViewMode.ANSWER}
										class={`max-w-[200px] min-w-[140px] text-center font-medium transition-all duration-200 ${
											viewMode === ViewMode.ANSWER
												? isAnswerCorrect()
													? 'border-success shadow-sm'
													: response.answers?.[index]
														? 'border-destructive shadow-sm'
														: 'border-primary/30 focus:border-primary bg-background hover:border-primary/50 border-2 shadow-sm'
												: 'border-primary/30 focus:border-primary bg-background hover:border-primary/50 border-2 shadow-sm'
										}`}
										style="border-radius: 8px; padding: 8px 12px;"
									/>
								</div>
							{/if}
						{/each}
					</div>

					{#if viewMode === ViewMode.ANSWER}
						<p class="text-muted-foreground mt-4 text-sm">
							Complete the sentence by filling in the blanks.
						</p>
					{/if}

					{#if viewMode === ViewMode.REVIEW && !isAnswerCorrect()}
						<div class="mt-6 rounded-lg border p-4">
							<div class="text-destructive flex items-center gap-2">
								<XIcon class="h-5 w-5" />
								<span class="font-medium">Incorrect</span>
							</div>
							<p class="text-destructive mt-1 text-sm">
								The correct answers are: <strong
									>{config.answers.join(', ')}</strong
								>
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
						No fill-in-blank question created
					</p>
					<p class="text-muted-foreground text-xs">
						Switch to edit mode to create a fill-in-blank question
					</p>
				</div>
			</div>
		{/if}
	{:else}
		<!-- PRESENTATION MODE: Placeholder for presentation-specific rendering -->
	{/if}
</div>
