<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import { ViewMode, type ChoiceBlockProps } from '$lib/schema/task';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import CheckSquareIcon from '@lucide/svelte/icons/check-square';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SquareIcon from '@lucide/svelte/icons/square';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import XSquareIcon from '@lucide/svelte/icons/x-square';

	let {
		config,
		onConfigUpdate,
		response,
		onResponseUpdate,
		viewMode,
	}: ChoiceBlockProps = $props();

	let isMultiAnswer = $derived(() => {
		return config.options.filter((option) => option.isAnswer).length > 1;
	});

	async function toggleAnswer(option: string) {
		let newResponse = { ...response };

		if (!isMultiAnswer()) {
			newResponse.answers = [option];
		} else {
			if (newResponse.answers.includes(option)) {
				newResponse.answers = newResponse.answers.filter(
					(ans) => ans !== option,
				);
			} else {
				newResponse.answers = [...newResponse.answers, option];
			}
		}

		await onResponseUpdate(newResponse);
	}

	async function toggleCorrect(option: string) {
		const index = config.options.findIndex((opt) => opt.text === option);
		if (index !== -1) {
			const newConfig = { ...config };
			newConfig.options[index].isAnswer = !newConfig.options[index].isAnswer;
			await onConfigUpdate(newConfig);
		}
	}

	function getCorrectAnswers() {
		return config.options.filter((opt) => opt.isAnswer).map((opt) => opt.text);
	}

	function isAnswerCorrect(option: string): boolean {
		return config.options.some(
			(opt) => opt.text.toLowerCase() === option.toLowerCase() && opt.isAnswer,
		);
	}
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.CONFIGURE}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<HelpCircleIcon />
					Configure Choice Block
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div class="space-y-2">
					<Label for="question-text">Question</Label>
					<Textarea
						id="question-text"
						value={config.question}
						oninput={(e) => {
							const value = (e.target as HTMLTextAreaElement)?.value;
							if (value !== undefined) {
								const newConfig = { ...config, question: value };
								onConfigUpdate(newConfig);
							}
						}}
						placeholder="Enter your multiple choice question..."
						class="min-h-20 resize-none"
					/>
				</div>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<Label>Answer Options</Label>
						<Button
							size="sm"
							onclick={async () => {
								const newConfig = { ...config };
								newConfig.options.push({ text: '', isAnswer: false });
								await onConfigUpdate(newConfig);
							}}
						>
							<PlusIcon />
							Add Option
						</Button>
					</div>
					<div class="space-y-3">
						{#each config.options as option, index}
							<div class="flex items-start gap-3 rounded-lg border p-3">
								<Button
									type="button"
									variant={getCorrectAnswers()?.includes(option.text)
										? 'success'
										: 'destructive'}
									size="icon"
									onclick={() => toggleCorrect(option.text)}
									disabled={!option.text.trim()}
								>
									{#if getCorrectAnswers()?.includes(option.text)}
										{#if !isMultiAnswer()}
											<CheckCircleIcon />
										{:else}
											<CheckSquareIcon />
										{/if}
									{:else if !isMultiAnswer()}
										<CircleIcon />
									{:else}
										<SquareIcon />
									{/if}
								</Button>

								<!-- Answer Text Input -->
								<div class="flex-1">
									<Input
										value={config.options[index].text}
										oninput={(e) => {
											const value = (e.target as HTMLInputElement)?.value;
											if (value !== undefined) {
												const newConfig = { ...config };
												newConfig.options[index].text = value;
												onConfigUpdate(newConfig);
											}
										}}
										placeholder={`Option ${index + 1}`}
										class="w-full"
									/>
								</div>

								{#if config.options.length > 2}
									<Button
										variant="destructive"
										size="icon"
										onclick={async () => {
											const newConfig = { ...config };
											newConfig.options = newConfig.options.filter(
												(opt) => opt.text !== option.text,
											);
											await onConfigUpdate(newConfig);
										}}
									>
										<TrashIcon />
									</Button>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.ANSWER || viewMode === ViewMode.REVIEW}
		<div class="group relative">
			{#if config.question && config.options?.length > 0}
				<Card.Root>
					<Card.Content>
						<div class="mb-6">
							<h3 class="mb-2 text-lg font-medium">{config.question}</h3>
							{#if isMultiAnswer()}
								<p class="text-muted-foreground text-sm">
									Select all correct answers
								</p>
							{:else}
								<p class="text-muted-foreground text-sm">Select one answer</p>
							{/if}
						</div>

						<div class="flex flex-col gap-y-3">
							{#each config.options as option}
								{@const isSelected = response.answers?.includes(option.text)}
								{@const isCorrect = isAnswerCorrect(option.text)}
								<Button
									variant="outline"
									onclick={() => toggleAnswer(option.text)}
									class="text-left"
									disabled={viewMode === ViewMode.REVIEW}
								>
									{#if !isMultiAnswer()}
										{#if isSelected && isCorrect}
											<CheckCircleIcon class="text-success" />
										{:else if isSelected && !isCorrect}
											<XCircleIcon class="text-destructive" />
										{:else}
											<CircleIcon class="text-muted-foreground" />
										{/if}
									{:else if isSelected && isCorrect}
										<CheckSquareIcon class="text-success" />
									{:else if isSelected && !isCorrect}
										<XSquareIcon class="text-destructive" />
									{:else}
										<SquareIcon class="text-muted-foreground" />
									{/if}
									<span class="flex-1">
										{option.text}
									</span>
								</Button>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			{:else}
				<div
					class="flex h-48 w-full items-center justify-center rounded-lg border border-dashed"
				>
					<div class="text-center">
						<HelpCircleIcon class="text-muted-foreground mx-auto h-12 w-12" />
						<p class="text-muted-foreground mt-2 text-sm">
							No question created
						</p>
						<p class="text-muted-foreground text-xs">
							Please configure this choice block in the task editor.
						</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
