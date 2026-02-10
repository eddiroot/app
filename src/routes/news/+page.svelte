<!-- +page.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import {
		Avatar,
		AvatarFallback,
		AvatarImage,
	} from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { userPermissions } from '$lib/enums';
	import { getPermissions } from '$lib/utils';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import Calendar from '@lucide/svelte/icons/calendar';
	import FileText from '@lucide/svelte/icons/file-text';
	import Filter from '@lucide/svelte/icons/filter';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Pin from '@lucide/svelte/icons/pin';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';

	interface NewsItem {
		news: {
			id: number;
			title: string;
			excerpt: string | null;
			content: unknown;
			status: string;
			priority: string;
			visibility: string;
			publishedAt: Date | null;
			expiresAt: Date | null;
			featuredImageUrl: string | null;
			tags: string | null;
			isPinned: boolean;
			viewCount: number;
			createdAt: Date;
			updatedAt: Date;
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
			resource: {
				id: number;
				fileName: string;
				objectKey: string;
				bucketName: string;
				contentType: string;
				fileSize: number;
				resourceType: string;
				uploadedBy: string;
				imageUrl: string; // Server-provided URL
			};
		}>;
	}

	let { data }: { data: { user: any; news: NewsItem[] } } = $props();

	// Check if user can create news
	const canCreateNews = $derived(() => {
		const userPerms = getPermissions(data.user.type);
		return userPerms.includes(userPermissions.createNews);
	});

	// Filter state
	let selectedCategoryId = $state<number | null>(null);
	let searchQuery = $state('');
	let showFilters = $state(false);

	// Get the selected category value for the select component (single value)
	let selectedCategoryValue = $state<string>('all');

	// Get the display label for the selected category
	let selectedCategoryLabel = $derived.by(() => {
		if (selectedCategoryValue === 'all') return 'All categories';
		const category = availableCategories.find(
			(c) => c.id.toString() === selectedCategoryValue,
		);
		return category?.name || 'All categories';
	});

	// Get unique categories from the news data
	const availableCategories = $derived.by(() => {
		const categories = new Map();
		data.news.forEach((item) => {
			if (item.category) {
				categories.set(item.category.id, item.category);
			}
		});
		return Array.from(categories.values()).sort((a, b) =>
			a.name.localeCompare(b.name),
		);
	});

	// Filter news based on selected category and search query
	const filteredNews = $derived.by(() => {
		let filtered = data.news;

		// Filter by category
		if (selectedCategoryId !== null) {
			filtered = filtered.filter(
				(item) => item.category?.id === selectedCategoryId,
			);
		}

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filtered = filtered.filter((item) => {
				const titleMatch = item.news.title.toLowerCase().includes(query);
				const contentMatch = getContentText(item.news.content)
					.toLowerCase()
					.includes(query);
				const categoryMatch =
					item.category?.name.toLowerCase().includes(query) || false;
				const campusMatch =
					item.campus?.name.toLowerCase().includes(query) || false;
				const authorMatch = getAuthorName(item.author)
					.toLowerCase()
					.includes(query);

				// Check tags
				const tags = parseTags(item.news.tags);
				const tagMatch = tags.some((tag: string) =>
					tag.toLowerCase().includes(query),
				);

				return (
					titleMatch ||
					contentMatch ||
					categoryMatch ||
					campusMatch ||
					authorMatch ||
					tagMatch
				);
			});
		}

		return filtered;
	});

	// Separate pinned and regular news from filtered results
	const pinnedNews = $derived.by(() =>
		filteredNews.filter((item) => item.news.isPinned),
	);
	const regularNews = $derived.by(() =>
		filteredNews.filter((item) => !item.news.isPinned),
	);

	const getContentText = (content: unknown): string => {
		if (!content) return '';

		// If content is already a string, return it
		if (typeof content === 'string') {
			return content;
		}

		// If content is an object, try to extract text from it
		if (typeof content === 'object') {
			try {
				const contentObj = content as any;

				// Handle structured content with blocks
				if (contentObj.blocks && Array.isArray(contentObj.blocks)) {
					return contentObj.blocks
						.map((block: any) => {
							switch (block.type) {
								case 'paragraph':
									return block.content || '';
								case 'list':
									if (block.items && Array.isArray(block.items)) {
										return block.items
											.map((item: string) => `• ${item}`)
											.join('\n');
									}
									return '';
								default:
									return block.content || block.text || '';
							}
						})
						.join('\n\n');
				}

				// If it has a text property
				if (contentObj.text) {
					return contentObj.text;
				}

				// If it's a stringified object, parse it
				if (typeof contentObj === 'string') {
					const parsed = JSON.parse(contentObj);
					if (parsed.blocks) {
						return getContentText(parsed);
					}
					if (parsed.text) return parsed.text;
				}

				// Fallback: stringify the object
				return JSON.stringify(content);
			} catch (error) {
				console.warn('Error parsing content:', error);
				return JSON.stringify(content);
			}
		}

		return String(content);
	};

	const renderContentHTML = (content: unknown): string => {
		if (!content) return '';

		// If content is already a string, return it with basic formatting
		if (typeof content === 'string') {
			return content.replace(/\n/g, '<br>');
		}

		// If content is an object, try to render structured content
		if (typeof content === 'object') {
			try {
				const contentObj = content as any;

				// Handle structured content with blocks
				if (contentObj.blocks && Array.isArray(contentObj.blocks)) {
					return contentObj.blocks
						.map((block: any) => {
							switch (block.type) {
								case 'paragraph':
									const paragraphContent = (block.content || '').replace(
										/\n/g,
										'<br>',
									);
									return `<p class="mb-3">${paragraphContent}</p>`;
								case 'list':
									if (block.items && Array.isArray(block.items)) {
										const listItems = block.items
											.map((item: string) => `<li>${item}</li>`)
											.join('');
										return `<ul class="list-disc list-inside mb-3 space-y-1">${listItems}</ul>`;
									}
									return '';
								default:
									const defaultContent = (
										block.content ||
										block.text ||
										''
									).replace(/\n/g, '<br>');
									return `<p class="mb-3">${defaultContent}</p>`;
							}
						})
						.join('');
				}

				// If it has a text property
				if (contentObj.text) {
					return contentObj.text.replace(/\n/g, '<br>');
				}

				// If it's a stringified object, parse it
				if (typeof contentObj === 'string') {
					const parsed = JSON.parse(contentObj);
					if (parsed.blocks) {
						return renderContentHTML(parsed);
					}
					if (parsed.text) return parsed.text.replace(/\n/g, '<br>');
				}

				// Fallback: stringify the object
				return JSON.stringify(content);
			} catch (error) {
				console.warn('Error parsing content:', error);
				return JSON.stringify(content);
			}
		}

		return String(content).replace(/\n/g, '<br>');
	};

	// Helper functions
	const formatDate = (date: Date | null) => {
		if (!date) return '';
		return new Intl.DateTimeFormat('en-AU', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		}).format(new Date(date));
	};

	const getAuthorInitials = (author: NewsItem['author']) => {
		if (!author?.firstName && !author?.lastName) return 'AN';
		return `${author.firstName?.[0] || ''}${author.lastName?.[0] || ''}`.toUpperCase();
	};

	const getAuthorName = (author: NewsItem['author']) => {
		if (!author?.firstName && !author?.lastName) return 'Anonymous';
		return `${author.firstName || ''} ${author.lastName || ''}`.trim();
	};

	const parseTags = (tags: string | null | any[]) => {
		if (!tags) return [];

		// If it's already an array, return it
		if (Array.isArray(tags)) {
			return tags;
		}

		// If it's a string, try to parse as JSON
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
			} catch (error) {
				// If JSON parsing fails, try to split by comma as fallback
				console.warn('Failed to parse tags as JSON:', tags);
				return tags
					.split(',')
					.map((tag) => tag.trim())
					.filter((tag) => tag.length > 0);
			}
		}

		// Fallback to empty array
		return [];
	};

	// Highlight search terms in text
	const highlightSearchTerm = (text: string, searchTerm: string) => {
		if (!searchTerm.trim()) return text;

		const regex = new RegExp(
			`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
			'gi',
		);
		return text.replace(
			regex,
			'<mark class="bg-yellow-200 text-yellow-900 px-0.5 rounded">$1</mark>',
		);
	};

	// Filter functions
	const clearFilters = () => {
		selectedCategoryId = null;
		searchQuery = '';
	};

	const hasActiveFilters = $derived.by(
		() => selectedCategoryId !== null || searchQuery.trim() !== '',
	);

	// Handle URL fragment scrolling on page load
	$effect(() => {
		if (typeof window !== 'undefined' && window.location.hash) {
			const hash = window.location.hash.substring(1); // Remove the #
			const element = document.getElementById(`news-${hash}`);
			if (element) {
				// Wait a bit for the page to fully render
				setTimeout(() => {
					element.scrollIntoView({ behavior: 'smooth', block: 'center' });
					// Add a subtle highlight effect
					element.style.transition = 'box-shadow 0.3s ease';
					element.style.boxShadow = '0 0 20px rgba(156, 163, 175, 0.5)'; // Grey highlight
					setTimeout(() => {
						element.style.boxShadow = '';
					}, 2000);
				}, 100);
			}
		}
	});

	// Handle published parameter - scroll to newly published article
	$effect(() => {
		if (typeof window !== 'undefined') {
			const publishedId = page.url.searchParams.get('published');
			if (publishedId) {
				const element = document.getElementById(`news-${publishedId}`);
				if (element) {
					// Wait a bit for the page to fully render
					setTimeout(() => {
						element.scrollIntoView({ behavior: 'smooth', block: 'center' });
						// Add a highlight effect for newly published articles
						element.style.transition = 'box-shadow 0.3s ease';
						element.style.boxShadow = '0 0 20px rgba(156, 163, 175, 0.5)'; // Grey highlight for published
						setTimeout(() => {
							element.style.boxShadow = '';
						}, 3000); // Longer highlight for published articles
					}, 200); // Slightly longer wait for published articles
				}
			}
		}
	});
</script>

<div class="mx-auto w-full max-w-6xl space-y-6 p-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">School News</h1>
			<p class="text-muted-foreground mt-1">
				Stay updated with the latest announcements and events
			</p>
		</div>
		<div class="flex items-center gap-2">
			{#if canCreateNews()}
				<Button variant="default" size="sm" href="/news/new">
					<Plus />
					Create News
				</Button>
				<Button variant="outline" size="sm" href="/news/drafts">
					<FileText />
					My Drafts
				</Button>
			{/if}
			<Button
				variant="outline"
				size="sm"
				onclick={() => (showFilters = !showFilters)}
				class={hasActiveFilters ? 'border-primary text-primary' : ''}
			>
				<Filter />
				Filters
				{#if hasActiveFilters}
					<Badge
						variant="secondary"
						class="ml-2 h-5 w-5 rounded-full p-0 text-xs"
					>
						{(selectedCategoryId !== null ? 1 : 0) +
							(searchQuery.trim() ? 1 : 0)}
					</Badge>
				{/if}
			</Button>
		</div>
	</div>

	<!-- Success Message for Published Articles -->
	{#if page.url.searchParams.get('published')}
		<div class="rounded-lg border border-green-200 bg-green-50 p-4">
			<div class="text-success text-sm">
				Article has been successfully published!
			</div>
		</div>
	{/if}

	<!-- Filters Section -->
	{#if showFilters}
		<Card class="p-4">
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-medium">Filters</h3>
					{#if hasActiveFilters}
						<Button variant="ghost" size="sm" onclick={clearFilters}>
							<X class="mr-1" />
							Clear all
						</Button>
					{/if}
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<!-- Search -->
					<div class="space-y-2">
						<Label for="search">Search</Label>
						<div class="relative">
							<Search
								class="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
							/>
							<Input
								id="search"
								placeholder="Search news..."
								bind:value={searchQuery}
								class="pl-10"
							/>
						</div>
					</div>

					<!-- Category Filter -->
					<div class="space-y-2">
						<Label for="category">Category</Label>
						<Select.Root
							type="single"
							bind:value={selectedCategoryValue}
							onValueChange={(value) => {
								if (value) {
									selectedCategoryId = value === 'all' ? null : Number(value);
								}
							}}
						>
							<Select.Trigger id="category" class="w-full">
								{selectedCategoryLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="all">All categories</Select.Item>
								{#each availableCategories as category}
									<Select.Item value={category.id.toString()}>
										<div class="flex items-center gap-2">
											{#if category.color}
												<div
													class="h-3 w-3 rounded-full"
													style="background-color: {category.color}"
												></div>
											{/if}
											{category.name}
										</div>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<!-- Active Filters Display -->
				{#if hasActiveFilters}
					<div class="flex flex-wrap gap-2">
						<span class="text-muted-foreground text-sm">Active filters:</span>
						{#if selectedCategoryId !== null}
							{@const selectedCategory = availableCategories.find(
								(c) => c.id === selectedCategoryId,
							)}
							{#if selectedCategory}
								<Badge variant="secondary" class="gap-1">
									{#if selectedCategory.color}
										<div
											class="h-2 w-2 rounded-full"
											style="background-color: {selectedCategory.color}"
										></div>
									{/if}
									{selectedCategory.name}
									<button
										onclick={() => (selectedCategoryId = null)}
										class="hover:bg-muted-foreground/20 ml-1 rounded-sm"
									>
										<X class="h-3 w-3" />
									</button>
								</Badge>
							{/if}
						{/if}
						{#if searchQuery.trim()}
							<Badge variant="secondary" class="gap-1">
								Search: "{searchQuery}"
								<button
									onclick={() => (searchQuery = '')}
									class="hover:bg-muted-foreground/20 ml-1 rounded-sm"
								>
									<X class="h-3 w-3" />
								</button>
							</Badge>
						{/if}
					</div>
				{/if}
			</div>
		</Card>
	{/if}

	<!-- Results Summary -->
	{#if hasActiveFilters}
		<div class="text-muted-foreground text-sm">
			Showing {filteredNews.length} of {data.news.length} news items
			{#if searchQuery.trim()}
				for "<span class="font-medium">{searchQuery}</span>"
			{/if}
		</div>
	{/if}

	<!-- News Content -->
	<div class="space-y-6">
		<!-- Pinned News Section -->
		{#if pinnedNews.length > 0}
			<div class="space-y-4">
				<div class="flex items-center gap-2">
					<h2 class="text-primary text-xl font-semibold">
						Pinned Announcements
					</h2>
					<div class="bg-border h-px flex-1"></div>
				</div>
				<div class="grid gap-4">
					{#each pinnedNews as newsItem (newsItem.news.id)}
						{@const tags = parseTags(newsItem.news.tags)}
						{@const contentText = getContentText(newsItem.news.content)}
						{@const contentHTML = renderContentHTML(newsItem.news.content)}
						<Card
							class="relative transition-all duration-200 hover:shadow-md"
							id="news-{newsItem.news.id}"
						>
							<div class="absolute top-3 right-3">
								<Pin class="text-primary fill-primary" />
							</div>

							{#if newsItem.news.featuredImageUrl}
								<div class="aspect-video w-full overflow-hidden rounded-t-lg">
									<img
										src={newsItem.news.featuredImageUrl}
										alt={newsItem.news.title}
										class="h-full w-full object-cover"
									/>
								</div>
							{/if}

							<CardHeader class="pb-3">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0 flex-1">
										<CardTitle class="pr-6 text-lg leading-6">
											{@html highlightSearchTerm(
												newsItem.news.title,
												searchQuery,
											)}
										</CardTitle>
										{#if contentHTML}
											<div class="text-muted-foreground mt-2 space-y-2 text-sm">
												{@html highlightSearchTerm(contentHTML, searchQuery)}
											</div>
										{/if}
									</div>
								</div>

								<!-- Category and Campus -->
								{#if newsItem.category || newsItem.campus}
									<div class="mt-3 flex flex-wrap gap-2">
										{#if newsItem.category}
											<Badge variant="secondary" class="text-xs">
												{@html highlightSearchTerm(
													newsItem.category.name,
													searchQuery,
												)}
											</Badge>
										{/if}
										{#if newsItem.campus}
											<Badge variant="outline" class="text-xs">
												<MapPin class="mr-1" />
												{@html highlightSearchTerm(
													newsItem.campus.name,
													searchQuery,
												)}
											</Badge>
										{/if}
									</div>
								{/if}
							</CardHeader>

							<CardContent class="pt-0">
								<!-- Image Attachments -->
								{#if newsItem.images && newsItem.images.length > 0}
									<div class="space-y-3">
										<div
											class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
										>
											{#each newsItem.images as image}
												<div
													class="bg-muted/50 overflow-hidden rounded-lg border"
												>
													<img
														src={image.resource.imageUrl}
														alt={image.resource.fileName}
														class="h-auto max-h-64 w-full object-contain"
														loading="lazy"
													/>
												</div>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Tags -->
								{#if tags.length > 0}
									<div
										class="space-y-3 {newsItem.images &&
										newsItem.images.length > 0
											? 'mt-4'
											: ''}"
									>
										<div class="flex flex-wrap gap-1">
											{#each tags.slice(0, 3) as tag}
												<Badge variant="outline" class="px-2 py-0.5 text-xs">
													{@html highlightSearchTerm(tag, searchQuery)}
												</Badge>
											{/each}
											{#if tags.length > 3}
												<Badge variant="outline" class="px-2 py-0.5 text-xs">
													+{tags.length - 3}
												</Badge>
											{/if}
										</div>
									</div>
								{/if}

								<!-- Author and Meta Information -->
								<div
									class="text-muted-foreground flex items-center justify-between text-sm {newsItem.images &&
									newsItem.images.length > 0
										? 'mt-4 border-t pt-4'
										: ''}"
								>
									<div class="flex items-center gap-2">
										<Avatar class="h-6 w-6">
											<AvatarImage
												src={newsItem.author?.avatarPath || ''}
												alt={getAuthorName(newsItem.author)}
											/>
											<AvatarFallback class="text-xs">
												{getAuthorInitials(newsItem.author)}
											</AvatarFallback>
										</Avatar>
										<span class="text-xs">
											{@html highlightSearchTerm(
												getAuthorName(newsItem.author),
												searchQuery,
											)}
										</span>
									</div>

									<div class="flex items-center gap-3 text-xs">
										<div class="flex items-center gap-1">
											<Calendar />
											<span>{formatDate(newsItem.news.publishedAt)}</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Regular News Section -->
		{#if regularNews.length > 0}
			<div class="space-y-4">
				{#if pinnedNews.length > 0}
					<div class="flex items-center gap-2">
						<h2 class="text-xl font-semibold">Latest News</h2>
						<div class="bg-border h-px flex-1"></div>
					</div>
				{/if}
				<div class="grid gap-4">
					{#each regularNews as newsItem (newsItem.news.id)}
						{@const tags = parseTags(newsItem.news.tags)}
						{@const contentText = getContentText(newsItem.news.content)}
						{@const contentHTML = renderContentHTML(newsItem.news.content)}
						<Card
							class="relative transition-all duration-200 hover:shadow-md"
							id="news-{newsItem.news.id}"
						>
							{#if newsItem.news.featuredImageUrl}
								<div class="aspect-video w-full overflow-hidden rounded-t-lg">
									<img
										src={newsItem.news.featuredImageUrl}
										alt={newsItem.news.title}
										class="h-full w-full object-cover"
									/>
								</div>
							{/if}

							<CardHeader class="pb-3">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0 flex-1">
										<CardTitle class="text-lg leading-6">
											{@html highlightSearchTerm(
												newsItem.news.title,
												searchQuery,
											)}
										</CardTitle>
										{#if contentHTML}
											<div class="text-muted-foreground mt-2 space-y-2 text-sm">
												{@html highlightSearchTerm(contentHTML, searchQuery)}
											</div>
										{/if}
									</div>
								</div>

								<!-- Category and Campus -->
								{#if newsItem.category || newsItem.campus}
									<div class="mt-3 flex flex-wrap gap-2">
										{#if newsItem.category}
											<Badge variant="secondary" class="text-xs">
												{@html highlightSearchTerm(
													newsItem.category.name,
													searchQuery,
												)}
											</Badge>
										{/if}
										{#if newsItem.campus}
											<Badge variant="outline" class="text-xs">
												<MapPin class="mr-1" />
												{@html highlightSearchTerm(
													newsItem.campus.name,
													searchQuery,
												)}
											</Badge>
										{/if}
									</div>
								{/if}
							</CardHeader>

							<CardContent class="pt-0">
								<!-- Image Attachments -->
								{#if newsItem.images && newsItem.images.length > 0}
									<div class="space-y-3">
										<div
											class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
										>
											{#each newsItem.images as image}
												<div
													class="bg-muted/50 overflow-hidden rounded-lg border"
												>
													<img
														src={image.resource.imageUrl}
														alt={image.resource.fileName}
														class="h-auto max-h-64 w-full object-contain"
														loading="lazy"
													/>
												</div>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Tags -->
								{#if tags.length > 0}
									<div
										class="space-y-3 {newsItem.images &&
										newsItem.images.length > 0
											? 'mt-4'
											: ''}"
									>
										<div class="flex flex-wrap gap-1">
											{#each tags.slice(0, 3) as tag}
												<Badge variant="outline" class="px-2 py-0.5 text-xs">
													{@html highlightSearchTerm(tag, searchQuery)}
												</Badge>
											{/each}
											{#if tags.length > 3}
												<Badge variant="outline" class="px-2 py-0.5 text-xs">
													+{tags.length - 3}
												</Badge>
											{/if}
										</div>
									</div>
								{/if}

								<!-- Author and Meta Information -->
								<div
									class="text-muted-foreground flex items-center justify-between text-sm {newsItem.images &&
									newsItem.images.length > 0
										? 'mt-4 border-t pt-4'
										: ''}"
								>
									<div class="flex items-center gap-2">
										<Avatar class="h-6 w-6">
											<AvatarImage
												src={newsItem.author?.avatarPath || ''}
												alt={getAuthorName(newsItem.author)}
											/>
											<AvatarFallback class="text-xs">
												{getAuthorInitials(newsItem.author)}
											</AvatarFallback>
										</Avatar>
										<span class="text-xs">
											{@html highlightSearchTerm(
												getAuthorName(newsItem.author),
												searchQuery,
											)}
										</span>
									</div>

									<div class="flex items-center gap-3 text-xs">
										<div class="flex items-center gap-1">
											<Calendar />
											<span>{formatDate(newsItem.news.publishedAt)}</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Empty State -->
		{#if filteredNews.length === 0}
			<div class="py-12 text-center">
				<div
					class="bg-muted mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full"
				>
					<AlertCircle class="text-muted-foreground h-12 w-12" />
				</div>
				{#if hasActiveFilters}
					<h3 class="mb-2 text-lg font-semibold">No matching news found</h3>
					<p class="text-muted-foreground mb-4">
						Try adjusting your filters or search terms to find what you're
						looking for.
					</p>
					<Button variant="outline" onclick={clearFilters}>
						<X class="mr-2" />
						Clear filters
					</Button>
				{:else}
					<h3 class="mb-2 text-lg font-semibold">No news available</h3>
					<p class="text-muted-foreground mb-4">
						There are currently no published news items to display.
					</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
