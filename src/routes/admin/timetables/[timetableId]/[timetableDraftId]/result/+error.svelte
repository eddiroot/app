<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import PlayIcon from '@lucide/svelte/icons/play';
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';

	const errorMessage = $page.error?.message || 'An unexpected error occurred';
	const timetableId = $page.params.timetableId;
	const timetableDraftId = $page.params.timetableDraftId;
</script>

<div class="flex min-h-screen items-start justify-center p-4 pt-16 md:pt-24">
	<Card.Root class="w-full max-w-2xl">
		<Card.Content class="space-y-6 p-8">
			<div class="flex flex-col items-center space-y-4 text-center">
				<div
					class="bg-primary/10 ring-primary/5 flex h-20 w-20 items-center justify-center rounded-full ring-4"
				>
					<AlertTriangleIcon class="text-primary h-10 w-10" />
				</div>

				<div class="space-y-2">
					<h1 class="text-3xl font-bold">No Timetable Generated</h1>
					<p class="text-muted-foreground text-lg">{errorMessage}</p>
				</div>
			</div>

			<div class="bg-muted/80 rounded-lg border p-6">
				<h2 class="mb-3 text-lg font-semibold">What should I do?</h2>
				<ol class="text-muted-foreground space-y-2 text-sm">
					<li class="flex items-start gap-2">
						<span class="text-primary mt-0.5 font-semibold">1.</span>
						<span>Return to the timetable management page</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-primary mt-0.5 font-semibold">2.</span>
						<span>Click the "Generate Timetable" button</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-primary mt-0.5 font-semibold">3.</span>
						<span>Wait for the generation process to complete</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-primary mt-0.5 font-semibold">4.</span>
						<span>Return here to view the results</span>
					</li>
				</ol>
			</div>

			<div class="flex flex-col gap-3 sm:flex-row">
				<Button
					href="/admin/timetables/{timetableId}"
					variant="outline"
					size="lg"
					class="flex-1 gap-2"
				>
					<ArrowLeftIcon class="h-4 w-4" />
					Back to Timetable
				</Button>
				<Button
					href="/admin/timetables/{timetableId}/{timetableDraftId}/generate"
					size="lg"
					class="flex-1 gap-2"
				>
					<PlayIcon class="h-4 w-4" />
					Generate Timetable
				</Button>
			</div>

			{#if $page.status !== 404}
				<div class="border-muted rounded-lg border bg-gray-50 p-4">
					<p class="text-muted-foreground text-xs">
						<strong>Error Code:</strong>
						{$page.status}
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
