<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
	} from '$lib/components/ui/card';
	import { ArchiveIcon } from '@lucide/svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';
	import Edit from '@lucide/svelte/icons/edit';
	import Eye from '@lucide/svelte/icons/eye';
	import FileText from '@lucide/svelte/icons/file-text';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import { toast } from 'svelte-sonner';

	interface DraftItem {
		news: {
			id: number;
			title: string;
			content: unknown;
			updatedAt: Date;
			createdAt: Date;
			tags: string | null;
		};
		author: {
			id: string;
			firstName: string | null;
			lastName: string | null;
			avatarPath: string | null;
		} | null;
		category: {
			id: number;
			name: string;
			description: string | null;
			color: string | null;
		} | null;
		campus: { id: number; name: string } | null;
		images: Array<{
			newsResource: { id: number; displayOrder: number };
			resource: { id: number; fileName: string; imageUrl: string };
		}>;
	}

	let { data }: { data: { user: any; drafts: DraftItem[] } } = $props();

	// Helper functions
	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat('en-AU', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(new Date(date));
	};

	const getFullContent = (content: unknown): string => {
		if (!content) return 'No content';

		if (typeof content === 'string') {
			return content;
		}

		if (typeof content === 'object') {
			try {
				const contentObj = content as any;
				if (contentObj.blocks && Array.isArray(contentObj.blocks)) {
					return contentObj.blocks
						.map((block: any) => {
							switch (block.type) {
								case 'paragraph':
									return block.content || '';
								case 'list':
									return block.items
										? block.items.map((item: string) => `• ${item}`).join('\n')
										: '';
								default:
									return block.content || block.text || '';
							}
						})
						.join('\n\n');
				}
			} catch (error) {
				return 'Content unavailable';
			}
		}

		return 'Content unavailable';
	};

	const parseTags = (tags: string | null) => {
		if (!tags) return [];

		// If it's already an array, return it
		if (Array.isArray(tags)) {
			return tags;
		}

		// If it's a string, try to parse as JSON first
		if (typeof tags === 'string') {
			try {
				const parsed = JSON.parse(tags);
				if (Array.isArray(parsed)) {
					return parsed;
				}
				// If JSON parsing gives us a non-array, fall back to split
				return tags
					.split(',')
					.map((tag) => tag.trim())
					.filter((tag) => tag.length > 0);
			} catch {
				// If JSON parsing fails, split by comma
				return tags
					.split(',')
					.map((tag) => tag.trim())
					.filter((tag) => tag.length > 0);
			}
		}

		// Fallback for any other type
		return [];
	};

	const handleArchive = (newsId: number, title: string) => {
		// Show confirmation toast
		toast(`Archive "${title}"?`, {
			action: {
				label: 'Archive',
				onClick: () => {
					// Create form and submit it
					const form = document.createElement('form');
					form.method = 'POST';
					form.action = '?/archive';

					const input = document.createElement('input');
					input.type = 'hidden';
					input.name = 'newsId';
					input.value = newsId.toString();
					form.appendChild(input);

					document.body.appendChild(form);
					form.submit();
				},
			},
			cancel: {
				label: 'Cancel',
				onClick: () => {
					// Toast will auto-dismiss
				},
			},
			duration: 10000, // Give user time to decide
		});
	};
</script>

<div class="mx-auto w-full max-w-6xl space-y-6 p-6">
	<!-- Back Button -->
	<Button
		variant="ghost"
		size="sm"
		onclick={() => (window.location.href = '/news')}
	>
		<ArrowLeft />
		Back
	</Button>

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Draft Articles</h1>
			<p class="text-muted-foreground mt-1">
				Manage your unpublished news articles
			</p>
		</div>
		<Button variant="default" size="sm" href="/news/new">
			<FileText />
			New Draft
		</Button>
	</div>

	<!-- Drafts Count -->
	{#if data.drafts.length > 0}
		<div class="text-muted-foreground text-sm">
			{data.drafts.length} draft{data.drafts.length === 1 ? '' : 's'} found
		</div>
	{/if}

	<!-- Drafts List -->
	<div class="space-y-4">
		{#if data.drafts.length > 0}
			{#each data.drafts as draft (draft.news.id)}
				{@const tags = parseTags(draft.news.tags)}
				<Card class="transition-all duration-200 hover:shadow-md">
					<CardHeader class="pb-3">
						<div class="flex items-start justify-between gap-4">
							<div class="min-w-0 flex-1">
								<CardTitle class="text-lg">
									{draft.news.title}
								</CardTitle>
							</div>
							<div class="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									href={`/news/edit/${draft.news.id}`}
								>
									<Edit />
									Edit
								</Button>
								<form
									method="POST"
									action="?/publish"
									use:enhance
									class="inline"
								>
									<input type="hidden" name="newsId" value={draft.news.id} />
									<Button type="submit" variant="default" size="sm">
										<Eye />
										Publish
									</Button>
								</form>
								<Button
									variant="outline"
									size="sm"
									class="text-warning hover:text-warning"
									onclick={() => handleArchive(draft.news.id, draft.news.title)}
								>
									<ArchiveIcon />
									Archive
								</Button>
							</div>
						</div>

						<!-- Full Content Display -->
						<div class="mt-4">
							<div class="prose prose-sm max-w-none">
								<div
									class="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300"
								>
									{getFullContent(draft.news.content)}
								</div>
							</div>
						</div>

						<!-- Meta Information -->
						<div
							class="text-muted-foreground flex flex-wrap items-center gap-4 text-sm"
						>
							<div class="flex items-center gap-1">
								<Clock />
								<span>Updated {formatDate(draft.news.updatedAt)}</span>
							</div>
							<div class="flex items-center gap-1">
								<Calendar />
								<span>Created {formatDate(draft.news.createdAt)}</span>
							</div>
							{#if draft.images && draft.images.length > 0}
								<Badge variant="outline" class="text-xs">
									{draft.images.length} image{draft.images.length === 1
										? ''
										: 's'}
								</Badge>
							{/if}
						</div>

						<!-- Category and Tags -->
						<div class="flex flex-wrap gap-2">
							{#if draft.category}
								<Badge
									variant="secondary"
									class="text-xs"
									style="background-color: {draft.category.color ||
										'var(--secondary)'}; color: var(--secondary-foreground);"
								>
									{draft.category.name}
								</Badge>
							{/if}
							{#if draft.campus}
								<Badge variant="outline" class="text-xs">
									<MapPin class="mr-1" />
									{draft.campus.name}
								</Badge>
							{/if}
							{#each tags.slice(0, 3) as tag}
								<Badge variant="outline" class="text-xs">#{tag}</Badge>
							{/each}
							{#if tags.length > 3}
								<Badge variant="outline" class="text-xs"
									>+{tags.length - 3}</Badge
								>
							{/if}
						</div>
					</CardHeader>

					<!-- Image Preview -->
					{#if draft.images && draft.images.length > 0}
						<CardContent class="pt-0">
							<div class="space-y-3">
								<div
									class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
								>
									{#each draft.images.slice(0, 6) as image}
										<div class="bg-muted/50 overflow-hidden rounded-lg border">
											<img
												src={image.resource.imageUrl}
												alt={image.resource.fileName}
												class="h-auto max-h-64 w-full object-contain"
												loading="lazy"
											/>
										</div>
									{/each}
								</div>
								{#if draft.images.length > 6}
									<p class="text-muted-foreground text-center text-sm">
										+{draft.images.length - 6} more images
									</p>
								{/if}
							</div>
						</CardContent>
					{/if}
				</Card>
			{/each}
		{:else}
			<!-- Empty State -->
			<div class="py-12 text-center">
				<div
					class="bg-muted mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full"
				>
					<FileText class="text-muted-foreground h-12 w-12" />
				</div>
				<h3 class="mb-2 text-lg font-semibold">No draft articles</h3>
				<p class="text-muted-foreground mb-4">
					You don't have any draft news articles yet. Create one to get started!
				</p>
				<Button
					variant="default"
					onclick={() => (window.location.href = '/news/new')}
				>
					<FileText />
					Create your first draft
				</Button>
			</div>
		{/if}
	</div>
</div>
