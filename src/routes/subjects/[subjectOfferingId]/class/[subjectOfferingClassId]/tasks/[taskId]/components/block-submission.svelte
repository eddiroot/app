<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import Dropzone from '$lib/components/ui/dropzone/dropzone.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { ViewMode, type SubmissionBlockProps } from '$lib/schema/task';

	let { config, onConfigUpdate, response, onResponseUpdate, viewMode }: SubmissionBlockProps =
		$props();

	let files = $state<FileList | undefined>(undefined);
	let uploading = $state(false);

	// Watch for file changes and handle upload
	$effect(() => {
		if (files && files.length > 0) {
			handleFileUpload();
		}
	});

	async function handleFileUpload() {
		if (!files || files.length === 0) return;

		const file = files[0];
		const maxSize = 10 * 1024 * 1024; // 10MB

		if (file.size > maxSize) {
			alert('File size must be less than 10MB');
			files = undefined;
			return;
		}

		uploading = true;

		try {
			const reader = new FileReader();
			reader.onload = function (e) {
				if (e.target && e.target.result && typeof e.target.result === 'string') {
					onResponseUpdate({
						path: e.target.result
					});
				}
			};
			reader.readAsDataURL(file);
		} catch (error) {
			alert('Failed to process upload. Please try again.');
		} finally {
			uploading = false;
		}
	}
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.CONFIGURE}
		<Card.Root>
			<Card.Header>
				<Card.Title>Configure Submission Block</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-2">
					<Label for="instructions">Instructions</Label>
					<Textarea
						id="instructions"
						value={config.instructions}
						oninput={(e) => {
							const input = e.currentTarget;
							const value = input.value;
							if (value !== undefined) {
								const newConfig = { ...config, instructions: value };
								onConfigUpdate(newConfig);
							}
						}}
						placeholder="Enter instructions for your students..."
						class="w-full"
					/>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.ANSWER}
		<Card.Root>
			<Card.Content>
				<div class="space-y-4">
					{#if config.instructions}
						<div class="bg-muted rounded-lg p-4">
							<p class="text-sm whitespace-pre-wrap">{config.instructions}</p>
						</div>
					{/if}

					<Dropzone bind:files accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg" />

					{#if uploading}
						<p class="text-muted-foreground text-sm">Uploading file...</p>
					{/if}

					{#if response?.path}
						<div class="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
							<p class="text-sm font-medium text-green-700 dark:text-green-400">
								File uploaded successfully!
							</p>
							<a
								href={response.path}
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary hover:text-primary/80 mt-2 inline-block text-sm underline"
							>
								View uploaded file
							</a>
						</div>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.REVIEW}
		<div class="group relative">
			{#if response?.path}
				<Card.Root>
					<Card.Header>
						<Card.Title>Submitted File</Card.Title>
					</Card.Header>
					<Card.Content>
						{#if config.instructions}
							<div class="bg-muted mb-4 rounded-lg p-3">
								<p class="text-muted-foreground text-sm font-medium">Instructions:</p>
								<p class="text-sm whitespace-pre-wrap">{config.instructions}</p>
							</div>
						{/if}
						<a
							href={response.path}
							target="_blank"
							rel="noopener noreferrer"
							class="text-primary hover:text-primary/80 inline-flex items-center gap-2 underline"
						>
							Download Submitted File
						</a>
					</Card.Content>
				</Card.Root>
			{:else}
				<Card.Root>
					<Card.Header>
						<Card.Title>No File Submitted</Card.Title>
					</Card.Header>
					<Card.Content>
						{#if config.instructions}
							<div class="bg-muted mb-4 rounded-lg p-3">
								<p class="text-muted-foreground text-sm font-medium">Instructions:</p>
								<p class="text-sm whitespace-pre-wrap">{config.instructions}</p>
							</div>
						{/if}
						<p class="text-muted-foreground">The student has not submitted their work yet.</p>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	{/if}
</div>
