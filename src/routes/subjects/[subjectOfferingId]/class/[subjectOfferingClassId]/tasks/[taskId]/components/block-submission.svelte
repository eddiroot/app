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
	let uploadError = $state<string | null>(null);

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
			uploadError = 'File size must be less than 10MB';
			files = undefined;
			return;
		}

		uploading = true;
		uploadError = null;

		try {
			const formData = new FormData();
			formData.append('file', file);

			const uploadResponse = await fetch('?/uploadFile', {
				method: 'POST',
				body: formData
			});

			const result = await uploadResponse.json();

			if (result.type === 'failure') {
				throw new Error(result.data?.error || 'Upload failed');
			}

			const data = result.type === 'success' ? result.data : result;

			if (!data.url) {
				throw new Error('No URL returned from upload');
			}

			await onResponseUpdate({
				path: data.url
			});
		} catch (error) {
			console.error('Upload error:', error);
			uploadError =
				error instanceof Error ? error.message : 'Failed to upload file. Please try again.';
			files = undefined;
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

					{#if uploadError}
						<div class="rounded-lg border p-4">
							<p class="text-destructive text-sm font-medium">
								{uploadError}
							</p>
						</div>
					{/if}

					{#if response?.path}
						<div class="rounded-lg border p-4">
							<p class="text-sm font-medium">File uploaded successfully!</p>
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
