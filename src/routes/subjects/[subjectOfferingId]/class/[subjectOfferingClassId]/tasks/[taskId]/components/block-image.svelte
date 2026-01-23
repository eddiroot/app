<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { ViewMode, type ImageBlockProps } from '$lib/schema/task';
	import ImageIcon from '@lucide/svelte/icons/image';
	import UploadIcon from '@lucide/svelte/icons/upload';

	let { config, onConfigUpdate, viewMode }: ImageBlockProps = $props();

	let uploading = $state(false);

	async function handleFileUpload(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const file = target?.files?.[0];

		if (!file) return;

		// Validate file type (images only)
		if (!file.type.startsWith('image/')) {
			alert('Please select an image file');
			return;
		}

		// Validate file size (max 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			alert('File size must be less than 10MB');
			return;
		}

		uploading = true;

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

			const newConfig = {
				...config,
				path: data.url,
				altText: config.altText || file.name.replace(/\.[^/.]+$/, '')
			};
			await onConfigUpdate(newConfig);
		} catch (error) {
			console.error('Upload error:', error);
			alert(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
		} finally {
			uploading = false;
			// Clear the input
			if (target) {
				target.value = '';
			}
		}
	}

	function triggerFileUpload() {
		// Find the file input and click it
		const input = document.querySelector(
			'input[type="file"][accept="image/*"]'
		) as HTMLInputElement;
		input?.click();
	}
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.CONFIGURE}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<ImageIcon />
					Configure Image Block
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				{#if !config.path || config.path.trim() === ''}
					<div class="space-y-2">
						<Label>Upload Image</Label>
						<Button
							type="button"
							variant="outline"
							onclick={triggerFileUpload}
							disabled={uploading}
							class="flex items-center gap-2"
						>
							<UploadIcon class="h-4 w-4" />
							{uploading ? 'Uploading...' : 'Upload Resource'}
						</Button>
						<input type="file" accept="image/*" onchange={handleFileUpload} class="hidden" />
					</div>
				{/if}

				<div class="space-y-2">
					<Label for="alt-text">Alt Text</Label>
					<Input
						id="alt-text"
						type="text"
						value={config.altText}
						oninput={(e) => {
							const input = e.currentTarget;
							const value = input.value;
							if (value !== undefined) {
								const newConfig = { ...config, altText: value };
								onConfigUpdate(newConfig);
							}
						}}
						placeholder="Enter descriptive alt text..."
						class="w-full"
					/>
				</div>

				{#if config.path}
					<div class="space-y-2">
						<Label>Preview</Label>
						<div class="flex justify-center rounded-lg border border-dashed p-4">
							<img
								src={config.path}
								alt={config.altText || 'Image preview'}
								class="max-h-64 max-w-full object-contain"
								onerror={(e) => {
									const target = e.currentTarget;
									if (target instanceof HTMLImageElement) {
										target.style.display = 'none';
									}
									const parent = target.parentElement;
									if (parent) {
										parent.innerHTML = `
											<div class="flex flex-col items-center justify-center p-8 text-center">
												<svg class="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
												</svg>
												<p class="mt-2 text-sm text-muted-foreground">Unable to load image</p>
												<p class="text-xs text-muted-foreground">Please check the image path</p>
											</div>
										`;
									}
								}}
							/>
						</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.ANSWER || viewMode === ViewMode.REVIEW}
		<div class="group relative">
			{#if config.path}
				<Card.Root>
					<Card.Content class="p-4">
						<div class="flex justify-center">
							<img
								src={config.path}
								alt={config.altText || 'Image'}
								class="max-w-full rounded-lg object-contain"
								onerror={(e) => {
									const target = e.currentTarget;
									if (target instanceof HTMLImageElement) {
										target.style.display = 'none';
									}
									const parent = target.parentElement;
									if (parent) {
										parent.innerHTML = `
											<div class="flex flex-col items-center justify-center p-8 text-center">
												<svg class="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
												</svg>
												<p class="mt-2 text-sm text-muted-foreground">Unable to load image</p>
												<p class="text-xs text-muted-foreground">Image not found or unavailable</p>
											</div>
										`;
									}
								}}
							/>
						</div>
					</Card.Content>
				</Card.Root>
			{:else}
				<div class="flex h-48 w-full items-center justify-center rounded-lg border border-dashed">
					<div class="text-center">
						<ImageIcon class="text-muted-foreground mx-auto h-12 w-12" />
						<p class="text-muted-foreground mt-2 text-sm">No image configured</p>
						<p class="text-muted-foreground text-xs">
							Please configure this image block in the task editor.
						</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
