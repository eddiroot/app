<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { Card } from '$lib/components/ui/card';
	import Label from '$lib/components/ui/label/label.svelte';
	import { ViewMode, type AudioBlockProps } from '$lib/schema/task';
	import PauseIcon from '@lucide/svelte/icons/pause';
	import PlayIcon from '@lucide/svelte/icons/play';
	import UploadIcon from '@lucide/svelte/icons/upload';

	let { config, onConfigUpdate, viewMode }: AudioBlockProps = $props();

	let audioElement: HTMLAudioElement | undefined = $state();
	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let fileInput: HTMLInputElement | undefined = $state();

	async function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('audio/')) {
			alert('Please select an audio file');
			return;
		}

		// Validate file size (10MB limit)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			alert('File size must be less than 10MB');
			return;
		}

		try {
			const formData = new FormData();
			formData.append('file', file);

			const uploadResponse = await fetch('?/uploadFile', {
				method: 'POST',
				body: formData,
			});

			const result = await uploadResponse.json();

			if (result.type === 'failure') {
				throw new Error(result.data?.error || 'Upload failed');
			}

			const data = result.type === 'success' ? result.data : result;

			if (!data.url) {
				throw new Error('No URL returned from upload');
			}

			await onConfigUpdate({ ...config, path: data.url, altText: file.name });
		} catch (error) {
			console.error('Upload error:', error);
			alert(
				error instanceof Error
					? error.message
					: 'Failed to upload audio. Please try again.',
			);
		}
	}

	function togglePlayPause() {
		if (!audioElement) return;

		if (isPlaying) {
			audioElement.pause();
		} else {
			audioElement.play();
		}
	}

	function handleTimeUpdate() {
		if (audioElement) {
			currentTime = audioElement.currentTime;
		}
	}

	function handleLoadedMetadata() {
		if (audioElement) {
			duration = audioElement.duration;
		}
	}

	function handlePlay() {
		isPlaying = true;
	}

	function handlePause() {
		isPlaying = false;
	}

	function handleSeek(event: Event) {
		const target = event.target as HTMLInputElement;
		const newTime = parseFloat(target.value);
		if (audioElement) {
			audioElement.currentTime = newTime;
			currentTime = newTime;
		}
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function triggerFileUpload() {
		fileInput?.click();
	}
</script>

<Card class="p-4">
	{#if viewMode === ViewMode.CONFIGURE}
		<div class="space-y-4">
			<Label for="audio-upload">Upload Audio File</Label>
			<div class="space-y-2">
				<input
					bind:this={fileInput}
					type="file"
					accept="audio/*"
					onchange={handleFileUpload}
					class="hidden"
					id="audio-upload"
				/>
				<Button onclick={triggerFileUpload} variant="outline" class="w-full">
					<UploadIcon class="mr-2 h-4 w-4" />
					{config.path ? 'Replace Audio File' : 'Choose Audio File'}
				</Button>
				{#if config.altText}
					<p class="text-muted-foreground text-sm">
						Selected: {config.altText}
					</p>
				{/if}
			</div>

			{#if config.path}
				<div class="space-y-4">
					<!-- Audio Element for preview -->
					<audio
						bind:this={audioElement}
						src={config.path}
						ontimeupdate={handleTimeUpdate}
						onloadedmetadata={handleLoadedMetadata}
						onplay={handlePlay}
						onpause={handlePause}
						onended={() => (isPlaying = false)}
						class="hidden"
					></audio>

					<!-- Preview Controls and Progress Bar -->
					<div class="space-y-2">
						<div class="flex items-center space-x-4">
							<Button onclick={togglePlayPause} variant="outline" size="sm">
								{#if isPlaying}
									<PauseIcon class="h-4 w-4" />
								{:else}
									<PlayIcon class="h-4 w-4" />
								{/if}
							</Button>
							{#if duration > 0}
								<div class="flex-1">
									<input
										type="range"
										min="0"
										max={duration}
										value={currentTime}
										onchange={handleSeek}
										class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
									/>
								</div>
							{/if}
						</div>
						{#if duration > 0}
							<div class="text-muted-foreground flex justify-between text-sm">
								<span>{formatTime(currentTime)}</span>
								<span>{formatTime(duration)}</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{:else if config.path}
		<div class="space-y-4">
			<!-- Audio Element -->
			<audio
				bind:this={audioElement}
				src={config.path}
				ontimeupdate={handleTimeUpdate}
				onloadedmetadata={handleLoadedMetadata}
				onplay={handlePlay}
				onpause={handlePause}
				onended={() => (isPlaying = false)}
				class="hidden"
			></audio>

			<!-- Player Controls and Progress Bar -->
			<div class="space-y-2">
				<div class="flex items-center space-x-4">
					<Button onclick={togglePlayPause} variant="outline" size="sm">
						{#if isPlaying}
							<PauseIcon class="h-4 w-4" />
						{:else}
							<PlayIcon class="h-4 w-4" />
						{/if}
					</Button>
					{#if duration > 0}
						<div class="flex-1">
							<input
								type="range"
								min="0"
								max={duration}
								value={currentTime}
								onchange={handleSeek}
								class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
							/>
						</div>
					{/if}
				</div>
				{#if duration > 0}
					<div class="text-muted-foreground flex justify-between text-sm">
						<span>{formatTime(currentTime)}</span>
						<span>{formatTime(duration)}</span>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="text-muted-foreground text-center">
			<p>No audio file uploaded</p>
		</div>
	{/if}
</Card>
