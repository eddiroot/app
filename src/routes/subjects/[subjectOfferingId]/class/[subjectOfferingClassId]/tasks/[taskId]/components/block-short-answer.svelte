<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		ViewMode,
		type BlockShortAnswerConfig,
		type ShortAnswerBlockProps,
	} from '$lib/schema/task';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import MessageSquareTextIcon from '@lucide/svelte/icons/message-square-text';

	let {
		config,
		onConfigUpdate,
		response,
		onResponseUpdate,
		viewMode,
	}: ShortAnswerBlockProps = $props();

	function saveChanges(input: BlockShortAnswerConfig) {
		if (!input.question.trim()) {
			alert('Question text is required');
			return;
		}

		onConfigUpdate({ question: input.question.trim() });
	}
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.CONFIGURE}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<MessageSquareTextIcon />
					Configure Short Answer Block
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div class="space-y-2">
					<Label for="question-text">Question</Label>
					<Textarea
						id="question-text"
						value={config.question}
						onblur={(e) => {
							const value = (e.target as HTMLTextAreaElement)?.value;
							saveChanges(value ? { ...config, question: value } : config);
						}}
						placeholder="Enter your question here..."
						class="min-h-[80px] resize-none"
					/>
					<p class="text-muted-foreground text-xs">
						Students will provide a written response to this question.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.ANSWER || viewMode === ViewMode.REVIEW}
		{#if config.question}
			<Card.Root>
				<Card.Content class="space-y-4">
					<div class="space-y-4">
						<p class="text-lg font-medium">{config.question}</p>
						<Textarea
							value={response.answer}
							onblur={async (e) => {
								const target = e.target as HTMLTextAreaElement;
								const newResponse = { ...response, answer: target.value };
								await onResponseUpdate(newResponse);
							}}
							disabled={viewMode !== ViewMode.ANSWER}
							placeholder="Type your answer here..."
						/>
					</div>

					{#if viewMode === ViewMode.ANSWER}
						<p class="text-muted-foreground text-sm">
							Provide a detailed written response to the question above.
						</p>
					{/if}

					{#if viewMode === ViewMode.REVIEW}
						<div class="mt-6 rounded-lg border p-4">
							<div class="text-primary flex items-center gap-2">
								<CheckCircleIcon class="h-5 w-5" />
								<span class="font-medium">Response Submitted</span>
							</div>
							<p class="text-muted-foreground mt-1 text-sm">
								This response will be reviewed and graded by the teacher.
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
					<MessageSquareTextIcon
						class="text-muted-foreground mx-auto h-12 w-12"
					/>
					<p class="text-muted-foreground mt-2 text-sm">No question created</p>
					<p class="text-muted-foreground text-xs">
						Switch to edit mode to create a short answer question
					</p>
				</div>
			</div>
		{/if}
	{:else}
		<!-- PRESENTATION MODE: Placeholder for presentation-specific rendering -->
	{/if}
</div>
