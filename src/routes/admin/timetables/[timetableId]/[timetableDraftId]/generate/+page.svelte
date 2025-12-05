<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import Calendar from '@lucide/svelte/icons/calendar';
	import CheckCircle from '@lucide/svelte/icons/check';
	import Info from '@lucide/svelte/icons/info';
	import Loader from '@lucide/svelte/icons/loader';
	import Lock from '@lucide/svelte/icons/lock';
	import PlayCircle from '@lucide/svelte/icons/play-circle';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import { onDestroy, onMount } from 'svelte';

	let { data } = $props();
	let isGenerating = $state(false);
	let isProcessing = $state(false);
	let pollInterval: ReturnType<typeof setInterval> | null = null;
	let selectedError = $state<{
		timetableDraftId: number;
		message: string;
		translatedMessage: string | null;
	} | null>(null);
	let selectedResponse = $state<{ timetableDraftId: number; message: string } | null>(null);
	let showErrorDialog = $state(false);
	let showResponseDialog = $state(false);
	let showTranslated = $state(false);
	let isTranslating = $state(false);

	// Check if there are any active queue entries (queued or in_progress)
	let hasActiveEntries = $derived(
		data.queueEntries?.some(
			(entry) => entry.status === 'queued' || entry.status === 'in_progress'
		) ?? false
	);

	function getStatusColor(status: string) {
		switch (status) {
			case 'queued':
				return 'bg-yellow-500';
			case 'in_progress':
				return 'bg-blue-500';
			case 'completed':
				return 'bg-green-500';
			case 'failed':
				return 'bg-red-500';
			default:
				return 'bg-gray-500';
		}
	}

	function formatStatus(status: string) {
		return status
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	function formatDate(date: Date | string) {
		return new Date(date).toLocaleString();
	}

	function showError(
		timetableDraftId: number,
		message: string,
		translatedMessage: string | null | undefined
	) {
		selectedError = { timetableDraftId, message, translatedMessage: translatedMessage || null };
		showTranslated = false;
		isTranslating = false;
		showErrorDialog = true;
	}

	function showResponse(timetableDraftId: number, message: string) {
		selectedResponse = { timetableDraftId, message };
		showResponseDialog = true;
	}

	function closeErrorDialog() {
		showErrorDialog = false;
		showTranslated = false;
		isTranslating = false;
	}

	// Simple markdown-to-HTML converter
	function markdownToHtml(text: string): string {
		return text
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			.replace(/`(.*?)`/g, '<code class="bg-blue-100 px-1 rounded">$1</code>')
			.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
			.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
			.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
			.replace(/^- (.*$)/gim, '<li class="ml-6 mb-1">• $1</li>')
			.replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-1 list-decimal">$1</li>')
			.replace(/\n\n/g, '<br/>')
			.replace(/\n/g, '<br/>');
	}

	async function handleTranslateError(forceRetranslate = false) {
		if (!selectedError || isTranslating) return;

		// If we already have a translated message and not forcing, just toggle to it
		if (selectedError.translatedMessage && !forceRetranslate) {
			showTranslated = true;
			return;
		}

		isTranslating = true;

		try {
			const response = await fetch('/api/timetables/translate-error', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					timetableDraftId: selectedError.timetableDraftId,
					errorMessage: selectedError.message,
					forceRetranslate
				})
			});

			if (!response.ok) {
				throw new Error('Failed to translate error message');
			}

			const data = await response.json();

			// Update the selected error with the translated message
			selectedError = {
				...selectedError,
				translatedMessage: data.translatedMessage
			};

			// Refresh the queue data to get the updated translated message from the database
			await invalidate('app:queue');

			showTranslated = true;
		} catch (error) {
			console.error('Failed to translate error:', error);
			alert('Failed to translate error message. Please try again.');
		} finally {
			isTranslating = false;
		}
	}

	async function handleGenerate(event: SubmitEvent) {
		event.preventDefault();

		isGenerating = true;

		// Simulate loading for 3 seconds
		setTimeout(async () => {
			isGenerating = false;

			// After loading, submit the form
			(event.target as HTMLFormElement).submit();
		}, 3000);
	}

	// Poll for updates when there are active entries
	onMount(() => {
		if (hasActiveEntries) {
			startPolling();
		}
	});

	onDestroy(() => {
		stopPolling();
	});

	function startPolling() {
		stopPolling(); // Clear any existing interval
		pollInterval = setInterval(async () => {
			await invalidate('app:queue');

			// Stop polling if no active entries
			if (!hasActiveEntries) {
				stopPolling();
			}
		}, 3000); // Poll every 3 seconds
	}

	function stopPolling() {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	}

	// Watch for changes in active entries and start/stop polling accordingly
	$effect(() => {
		if (hasActiveEntries && !pollInterval) {
			startPolling();
		} else if (!hasActiveEntries && pollInterval) {
			stopPolling();
		}
	});
</script>

<div class="flex h-full gap-6 px-4 pt-6 md:pt-10 xl:pt-14">
	<!-- Left Column - Generate Card -->
	<div class="flex-1">
		<Card.Root class="border-none shadow-none">
			<Card.Header class="space-y-4 text-center">
				<div class="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
					<CheckCircle class="text-primary h-8 w-8" />
				</div>
				<div class="space-y-2">
					<Card.Title class="text-3xl font-bold">Ready to Generate</Card.Title>
					<Card.Description class="text-muted-foreground text-lg">
						Your timetable configuration is complete
					</Card.Description>
				</div>
			</Card.Header>

			<Card.Content class="space-y-6">
				<div class="space-y-4">
					<div class="bg-muted/80 flex items-start gap-3 rounded-lg p-6">
						<Calendar class="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
						<div class="space-y-1">
							<p class="font-medium">Timetable Generation</p>
							<p class="text-muted-foreground text-sm">
								Once you start the generation process, eddi will analyse all of your configured data
								and create an optimised timetable based on your constraints and preferences.
							</p>
						</div>
					</div>

					<div class="bg-muted/80 flex items-start gap-3 rounded-lg p-6">
						<Lock class="text-destructive mt-0.5 h-5 w-5 flex-shrink-0" />
						<div class="space-y-1">
							<p class="font-medium">Important Notice</p>
							<p class="text-muted-foreground text-sm">
								While the generation is in progress, the timetable will be locked and no changes can
								be made to subjects, activities, students, or rules until the process completes.
							</p>
						</div>
					</div>
				</div>

				<form
					method="POST"
					action="?/generateTimetable"
					class="flex justify-center"
					onsubmit={handleGenerate}
				>
					<Button type="submit" size="lg" class="px-8 py-3" disabled={isGenerating}>
						{#if isGenerating}
							<Loader class="mr-2 h-4 w-4 animate-spin" />
							Generating...
						{:else}
							Generate Timetable File for Processing
						{/if}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Right Column - Queue Status -->
	<div class="w-full max-w-md">
		<Card.Root class="sticky top-6">
			<Card.Header>
				<div class="flex items-center justify-between">
					<div>
						<Card.Title class="flex items-center gap-2">
							Generation Queue
							{#if hasActiveEntries}
								<Loader class="h-4 w-4 animate-spin text-blue-500" />
							{/if}
						</Card.Title>
						<Card.Description>
							{#if data.queueEntries && data.queueEntries.length > 0}
								{data.queueEntries.length} draft{data.queueEntries.length !== 1 ? 's' : ''}
							{:else}
								No drafts yet
							{/if}
						</Card.Description>
					</div>
					<div class="flex gap-2">
						<Button
							variant="ghost"
							size="icon"
							onclick={async () => {
								await invalidate('app:queue');
							}}
							title="Refresh"
						>
							<RefreshCw class="h-4 w-4" />
						</Button>
					</div>
				</div>
			</Card.Header>
			<Card.Content class="space-y-4">
				{#if data.queueEntries && data.queueEntries.length > 0}
					<div class="max-h-[600px] space-y-3 overflow-y-auto">
						{#each data.queueEntries as entry}
							<div class="border-muted rounded-lg border p-4">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-medium">Draft #{entry.timetableDraftId}</span>
									<div class="flex items-center gap-2">
										<Badge class={getStatusColor(entry.status)}>
											{formatStatus(entry.status)}
										</Badge>
										{#if entry.status === 'failed' && entry.fetResponse}
											<Button
												variant="ghost"
												size="icon"
												class="h-6 w-6"
												onclick={() =>
													showError(
														entry.timetableDraftId,
														entry.fetResponse!,
														entry.translatedErrorMessage
													)}
												title="View error details"
											>
												<AlertCircle class="h-4 w-4 text-red-500" />
											</Button>
										{:else if entry.status === 'completed' && entry.fetResponse}
											<Button
												variant="ghost"
												size="icon"
												class="h-6 w-6"
												onclick={() => showResponse(entry.timetableDraftId, entry.fetResponse!)}
												title="View FET response"
											>
												<Info class="h-4 w-4 text-green-500" />
											</Button>
										{/if}
									</div>
								</div>
								<div class="text-muted-foreground space-y-1 text-xs">
									<p class="truncate" title={entry.fileName}>
										{entry.fileName}
									</p>
									<p>{formatDate(entry.createdAt)}</p>
								</div>
							</div>
						{/each}
					</div>
					<form
						method="POST"
						action="?/processQueue"
						use:enhance={() => {
							isProcessing = true;
							return async ({ update }) => {
								await update();
								isProcessing = false;
								await invalidate('app:queue');
							};
						}}
						class="border-t pt-4"
					>
						<Button type="submit" class="w-full" variant="outline" disabled={isProcessing}>
							{#if isProcessing}
								<Loader class="mr-2 h-4 w-4 animate-spin" />
								Processing...
							{:else}
								<PlayCircle class="mr-2 h-4 w-4" />
								Process Queue
							{/if}
						</Button>
					</form>
				{:else}
					<div class="py-8 text-center">
						<p class="text-muted-foreground text-sm">
							No timetable drafts in queue yet. Generate your first timetable to get started.
						</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>

<!-- Loading Overlay -->
{#if isGenerating}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="mx-4 w-full max-w-sm rounded-lg bg-white p-8 shadow-xl">
			<div class="space-y-4 text-center">
				<div class="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
					<Loader class="text-primary h-8 w-8 animate-spin" />
				</div>
				<div class="space-y-2">
					<h3 class="text-lg font-semibold">Generating Timetable</h3>
					<p class="text-muted-foreground text-sm">
						Please wait while we create your optimized timetable...
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Error Dialog -->
<Dialog.Root bind:open={showErrorDialog}>
	<Dialog.Content class="flex max-h-[80vh] !max-w-5xl flex-col">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<AlertCircle class="h-5 w-5 text-red-500" />
				Generation Error - Draft #{selectedError?.timetableDraftId}
			</Dialog.Title>
			<Dialog.Description>
				The timetable generation process encountered the following error:
			</Dialog.Description>
		</Dialog.Header>

		<!-- Toggle Buttons -->
		<div class="mt-4 flex items-center gap-2">
			<Button
				variant={!showTranslated ? 'default' : 'outline'}
				size="sm"
				onclick={() => (showTranslated = false)}
			>
				Raw Message
			</Button>
			<Button
				variant={showTranslated ? 'default' : 'outline'}
				size="sm"
				onclick={() => handleTranslateError(false)}
				disabled={isTranslating}
			>
				{#if isTranslating}
					<Loader class="mr-2 h-3 w-3 animate-spin" />
					Translating...
				{:else}
					Translated Message
				{/if}
			</Button>
			{#if selectedError?.translatedMessage && !isTranslating}
				<Button
					variant="ghost"
					size="sm"
					onclick={() => handleTranslateError(true)}
					title="Generate a new translation"
				>
					<RefreshCw class="mr-2 h-3 w-3" />
					Re-translate
				</Button>
			{/if}
		</div>

		<div class="mt-4 flex-1 overflow-y-auto">
			{#if isTranslating}
				<!-- Loading State -->
				<div class="flex h-64 items-center justify-center">
					<div class="space-y-4 text-center">
						<div
							class="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full"
						>
							<Loader class="text-primary h-8 w-8 animate-spin" />
						</div>
						<div class="space-y-2">
							<p class="font-medium">Translating Error Message</p>
							<p class="text-muted-foreground text-sm">
								Using AI to provide a user-friendly explanation (this may take a while)...
							</p>
						</div>
					</div>
				</div>
			{:else if showTranslated && selectedError?.translatedMessage}
				<!-- Translated Message -->
				<div class="rounded-lg border border-blue-200 bg-blue-50 p-6">
					<div class="prose prose-sm max-w-none text-blue-900">
						{@html markdownToHtml(selectedError.translatedMessage)}
					</div>
				</div>
			{:else}
				<!-- Raw Message -->
				<div class="rounded-lg border border-red-200 bg-red-50 p-4">
					<p class="font-mono text-sm break-words whitespace-pre-wrap text-red-800">
						{selectedError?.message || 'No error message available'}
					</p>
				</div>
			{/if}
		</div>

		<Dialog.Footer class="mt-6">
			<Button variant="outline" onclick={closeErrorDialog}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- FET Response Dialog -->
<Dialog.Root bind:open={showResponseDialog}>
	<Dialog.Content class="flex max-h-[80vh] !max-w-5xl flex-col">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Info class="h-5 w-5 text-green-500" />
				FET Response - Draft #{selectedResponse?.timetableDraftId}
			</Dialog.Title>
			<Dialog.Description>The output from the timetable generation process:</Dialog.Description>
		</Dialog.Header>
		<div class="mt-4 flex-1 overflow-y-auto">
			<div class="rounded-lg border border-green-200 bg-green-50 p-4">
				<p class="font-mono text-sm break-words whitespace-pre-wrap text-green-800">
					{selectedResponse?.message || 'No response available'}
				</p>
			</div>
		</div>
		<Dialog.Footer class="mt-6">
			<Button variant="outline" onclick={() => (showResponseDialog = false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
