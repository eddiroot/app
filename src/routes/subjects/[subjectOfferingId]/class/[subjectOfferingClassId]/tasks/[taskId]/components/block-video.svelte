<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import type { VideoBlockProps } from '$lib/schema/task';
	import { ViewMode } from '$lib/schema/task';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import VideoIcon from '@lucide/svelte/icons/video';

	let { config, onConfigUpdate, viewMode }: VideoBlockProps = $props();

	// Extract YouTube video ID from various URL formats
	function extractYouTubeId(url: string): string | null {
		if (!url) return null;

		const patterns = [
			/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
			/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
			/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
		];

		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match) return match[1];
		}

		return null;
	}

	// Validate if URL is a valid YouTube URL
	function isValidYouTubeUrl(url: string): boolean {
		return extractYouTubeId(url) !== null;
	}

	// Get embed URL from YouTube ID
	function getEmbedUrl(videoId: string): string {
		return `https://www.youtube.com/embed/${videoId}`;
	}

	// Handle URL input changes
	function handleUrlChange(url: string) {
		const newConfig = { ...config, url: url.trim() };
		onConfigUpdate(newConfig);
	}

	// Handle alt text changes
	function handleAltTextChange(altText: string) {
		const newConfig = { ...config, altText };
		onConfigUpdate(newConfig);
	}

	// Get video ID for current config
	let videoId = $derived(extractYouTubeId(config.url));
	let isValidUrl = $derived(config.url.trim() === '' || isValidYouTubeUrl(config.url));
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.CONFIGURE}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<VideoIcon />
					Configure Video Block
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div class="space-y-2">
					<Label for="video-url">YouTube Video URL</Label>
					<Input
						id="video-url"
						type="url"
						value={config.url}
						oninput={(e) => {
							const input = e.currentTarget;
							const value = input.value;
							if (value !== undefined) {
								handleUrlChange(value);
							}
						}}
						placeholder="Enter YouTube video URL (e.g., https://www.youtube.com/watch?v=...)"
						class={`w-full ${!isValidUrl ? 'border-red-500' : ''}`}
					/>
					{#if config.url.trim() !== '' && !isValidUrl}
						<p class="text-sm text-red-600">
							Please enter a valid YouTube URL. Supported formats:
							<br />• https://www.youtube.com/watch?v=VIDEO_ID
							<br />• https://youtu.be/VIDEO_ID
							<br />• https://www.youtube.com/embed/VIDEO_ID
						</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="video-alt-text">Description</Label>
					<Input
						id="video-alt-text"
						type="text"
						value={config.altText}
						oninput={(e) => {
							const input = e.currentTarget;
							const value = input.value;
							if (value !== undefined) {
								handleAltTextChange(value);
							}
						}}
						placeholder="Enter a description of the video content..."
						class="w-full"
					/>
				</div>

				{#if config.url.trim() !== '' && !isValidUrl}
					<div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
						<div class="flex items-start gap-2">
							<svg
								class="mt-0.5 h-5 w-5 text-amber-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								></path>
							</svg>
							<div>
								<h4 class="text-sm font-medium text-amber-800">Invalid YouTube URL</h4>
								<p class="mt-1 text-sm text-amber-700">
									Please check the URL format and make sure it's a valid YouTube link.
								</p>
							</div>
						</div>
					</div>
				{/if}

				{#if videoId}
					<div class="space-y-2">
						<Label>Preview</Label>
						<div class="aspect-video w-full overflow-hidden rounded-lg border">
							<iframe
								src={getEmbedUrl(videoId)}
								title={config.altText || 'YouTube video'}
								frameborder="0"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
								class="h-full w-full"
							></iframe>
						</div>
						<div class="text-muted-foreground flex items-center gap-2 text-sm">
							<ExternalLinkIcon class="h-4 w-4" />
							<a
								href={config.url}
								target="_blank"
								rel="noopener noreferrer"
								class="hover:text-foreground hover:underline"
							>
								Open in YouTube
							</a>
						</div>
					</div>
				{:else if config.url.trim() === ''}
					<div class="flex h-48 w-full items-center justify-center rounded-lg border border-dashed">
						<div class="text-center">
							<VideoIcon class="text-muted-foreground mx-auto h-12 w-12" />
							<p class="text-muted-foreground mt-2 text-sm">No video URL provided</p>
							<p class="text-muted-foreground text-xs">
								Enter a YouTube URL above to embed a video.
							</p>
						</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.ANSWER || viewMode === ViewMode.REVIEW}
		<div class="group relative">
			{#if videoId}
				<Card.Root>
					<Card.Content class="p-4">
						<div class="aspect-video w-full overflow-hidden rounded-lg">
							<iframe
								src={getEmbedUrl(videoId)}
								title={config.altText || 'YouTube video'}
								frameborder="0"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
								class="h-full w-full"
							></iframe>
						</div>
						{#if config.altText}
							<p class="text-muted-foreground mt-2 text-center text-sm">
								{config.altText}
							</p>
						{/if}
					</Card.Content>
				</Card.Root>
			{:else if config.url.trim() !== '' && !isValidUrl}
				<div
					class="flex h-48 w-full items-center justify-center rounded-lg border border-dashed border-red-300 bg-red-50"
				>
					<div class="text-center">
						<VideoIcon class="mx-auto h-12 w-12 text-red-400" />
						<p class="mt-2 text-sm font-medium text-red-600">Invalid video URL</p>
						<p class="text-xs text-red-500">Please contact your teacher to fix this video link.</p>
					</div>
				</div>
			{:else}
				<div class="flex h-48 w-full items-center justify-center rounded-lg border border-dashed">
					<div class="text-center">
						<VideoIcon class="text-muted-foreground mx-auto h-12 w-12" />
						<p class="text-muted-foreground mt-2 text-sm">No video configured</p>
						<p class="text-muted-foreground text-xs">
							Please configure this video block in the task editor.
						</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
