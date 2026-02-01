<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import Save from '@lucide/svelte/icons/save';
	import Send from '@lucide/svelte/icons/send';
	import Upload from '@lucide/svelte/icons/upload';
	import X from '@lucide/svelte/icons/x';

	let { data } = $props();

	// Helper functions
	function reconstructContent(content: unknown): string {
		if (!content) return '';
		if (typeof content === 'string') return content;
		if (typeof content === 'object') {
			try {
				const contentObj = content as any;
				if (contentObj.blocks && Array.isArray(contentObj.blocks)) {
					return contentObj.blocks
						.map((block: any) => {
							if (block.type === 'paragraph') return block.content;
							if (block.type === 'list')
								return block.items
									.map((item: string) => '• ' + item)
									.join('\n');
							return '';
						})
						.join('\n\n')
						.trim();
				}
			} catch (error) {
				console.error('Error reconstructing content:', error);
			}
		}
		return '';
	}

	function parseTags(tags: unknown): string {
		if (!tags) return '';
		if (Array.isArray(tags)) return tags.join(', ');
		if (typeof tags === 'string') {
			try {
				const parsed = JSON.parse(tags);
				if (Array.isArray(parsed)) return parsed.join(', ');
				return tags;
			} catch {
				return tags;
			}
		}
		return '';
	}

	// Form state
	let title = $derived(
		page.form?.formData?.title || data.newsItem.news.title || '',
	);
	let content = $derived(
		page.form?.formData?.content ||
			reconstructContent(data.newsItem.news.content) ||
			'',
	);
	let selectedCategory = $derived(
		page.form?.formData?.categoryId?.toString() ||
			data.newsItem.news.categoryId?.toString() ||
			'',
	);
	let selectedCampus = $derived(
		page.form?.formData?.campusId?.toString() ||
			data.newsItem.news.schoolCampusId?.toString() ||
			'',
	);
	let selectedVisibility = $derived(
		page.form?.formData?.visibility ||
			data.newsItem.news.visibility ||
			'public',
	);
	let isPinned = $derived(
		page.form?.formData?.isPinned || data.newsItem.news.isPinned || false,
	);
	let submitting = $state(false);
	let selectedImages: File[] = $state([]);
	let fileInput: HTMLInputElement;
	let tagInput = $state('');
	let tagsList: string[] = $derived(
		page.form?.formData?.tags
			? Array.isArray(page.form.formData.tags)
				? page.form.formData.tags
				: [page.form.formData.tags]
			: (parseTags(data.newsItem.news.tags) || '')
					.split(',')
					.map((t) => t.trim())
					.filter((t) => t),
	);

	// Validation state
	let validationErrors = $state<Record<string, string>>({});
	let showValidationErrors = $state(false);

	// Validation functions
	const validateForm = (): boolean => {
		const errors: Record<string, string> = {};

		// Title validation
		if (!title.trim()) {
			errors.title = 'Title is required';
		} else if (title.trim().length < 3) {
			errors.title = 'Title must be at least 3 characters long';
		} else if (title.trim().length > 200) {
			errors.title = 'Title must be less than 200 characters';
		}

		// Content validation
		if (!content.trim()) {
			errors.content = 'Content is required';
		} else if (content.trim().length < 10) {
			errors.content = 'Content must be at least 10 characters long';
		} else if (content.trim().length > 10000) {
			errors.content = 'Content must be less than 10,000 characters';
		}

		// Image validation
		if (selectedImages.length > 10) {
			errors.images = 'Maximum 10 images allowed';
		}

		// File size validation (5MB per file)
		const maxSize = 5 * 1024 * 1024; // 5MB
		const oversizedFiles = selectedImages.filter((file) => file.size > maxSize);
		if (oversizedFiles.length > 0) {
			errors.images = `Some images are too large. Maximum size is 5MB per image.`;
		}

		// File type validation
		const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
		const invalidFiles = selectedImages.filter(
			(file) => !allowedTypes.includes(file.type),
		);
		if (invalidFiles.length > 0) {
			errors.images = 'Only PNG, JPEG, JPG, and WebP images are allowed';
		}

		// Tag validation
		if (tagsList.length > 20) {
			errors.tags = 'Maximum 20 tags allowed';
		}

		const longTags = tagsList.filter((tag) => tag.length > 50);
		if (longTags.length > 0) {
			errors.tags = 'Tags must be less than 50 characters each';
		}

		validationErrors = errors;
		return Object.keys(errors).length === 0;
	};

	// Real-time validation for individual fields
	const validateField = (field: string) => {
		if (!showValidationErrors) return;

		const errors = { ...validationErrors };

		switch (field) {
			case 'title':
				if (!title.trim()) {
					errors.title = 'Title is required';
				} else if (title.trim().length < 3) {
					errors.title = 'Title must be at least 3 characters long';
				} else if (title.trim().length > 200) {
					errors.title = 'Title must be less than 200 characters';
				} else {
					delete errors.title;
				}
				break;
			case 'content':
				if (!content.trim()) {
					errors.content = 'Content is required';
				} else if (content.trim().length < 10) {
					errors.content = 'Content must be at least 10 characters long';
				} else if (content.trim().length > 10000) {
					errors.content = 'Content must be less than 10,000 characters';
				} else {
					delete errors.content;
				}
				break;
		}

		validationErrors = errors;
	};

	// Handle file selection
	function handleImageSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (!files || files.length === 0) return;

		const newFiles = Array.from(files);
		selectedImages = [...selectedImages, ...newFiles].slice(0, 10);
		target.value = '';

		// Validate images after selection
		if (showValidationErrors) {
			validateForm();
		}
	}

	// Remove image
	function removeImage(index: number) {
		selectedImages = selectedImages.filter((_, i) => i !== index);
	}

	// Add tag
	function addTag() {
		const trimmedTag = tagInput.trim();
		if (trimmedTag && !tagsList.includes(trimmedTag)) {
			if (tagsList.length >= 20) {
				validationErrors = {
					...validationErrors,
					tags: 'Maximum 20 tags allowed',
				};
				showValidationErrors = true;
				return;
			}
			if (trimmedTag.length > 50) {
				validationErrors = {
					...validationErrors,
					tags: 'Tags must be less than 50 characters each',
				};
				showValidationErrors = true;
				return;
			}
			tagsList = [...tagsList, trimmedTag];
			tagInput = '';
			// Clear tag error if it exists
			if (validationErrors.tags) {
				const errors = { ...validationErrors };
				delete errors.tags;
				validationErrors = errors;
			}
		}
	}

	// Remove tag
	function removeTag(index: number) {
		tagsList = tagsList.filter((_, i) => i !== index);
	}

	// Handle tag input keypress
	function handleTagKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addTag();
		}
	}

	// Handle form submission
	const handleSubmit = (action: 'save' | 'publish') => {
		showValidationErrors = true;

		if (!validateForm()) {
			// Scroll to first error
			const firstErrorField = Object.keys(validationErrors)[0];
			const errorElement = document.getElementById(firstErrorField);
			if (errorElement) {
				errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
			return;
		}

		submitting = true;
		const form = document.getElementById('newsForm') as HTMLFormElement;
		const actionInput = form.querySelector(
			'input[name="action"]',
		) as HTMLInputElement;
		actionInput.value = action;

		// Add tags to form as hidden inputs
		const tagsContainer = form.querySelector(
			'.tags-inputs-container',
		) as HTMLDivElement;
		tagsContainer.innerHTML = '';
		tagsList.forEach((tag) => {
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = 'tags';
			input.value = tag;
			tagsContainer.appendChild(input);
		});

		// Add images to form
		const imageContainer = form.querySelector(
			'.image-inputs-container',
		) as HTMLDivElement;
		imageContainer.innerHTML = '';

		selectedImages.forEach((file) => {
			const input = document.createElement('input');
			input.type = 'file';
			input.name = 'images';
			input.style.display = 'none';
			const dataTransfer = new DataTransfer();
			dataTransfer.items.add(file);
			input.files = dataTransfer.files;
			imageContainer.appendChild(input);
		});

		form.submit();
	};
</script>

{#if submitting}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
	>
		<div
			class="bg-background mx-4 flex max-w-sm flex-col items-center space-y-4 rounded-lg p-8 shadow-xl"
		>
			<LoaderIcon class="text-primary h-12 w-12 animate-spin" />
			<div class="text-center">
				<h3 class="text-secondary text-lg font-semibold">Updating Article</h3>
				<p class="text-muted-foreground mt-1 text-sm">
					Please wait while we update your article...
				</p>
			</div>
		</div>
	</div>
{/if}

<div class="bg-background min-h-screen">
	<div class="mx-auto max-w-6xl p-6">
		<Button variant="ghost" href="/news/drafts" class="mb-6">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back to Drafts
		</Button>

		<h1 class="mb-2 text-2xl font-bold">Edit News Article</h1>

		{#if data.newsItem.news.status === 'draft'}
			<div class="mb-6 rounded border border-blue-200 bg-blue-50 p-3">
				<p class="text-sm text-blue-800">📝 This is a draft article.</p>
			</div>
		{:else}
			<div class="mb-6 rounded border border-green-200 bg-green-50 p-3">
				<p class="text-sm text-green-800">✅ This article is published.</p>
			</div>
		{/if}

		{#if page.form?.error}
			<div class="mb-6 rounded border border-red-200 bg-red-50 p-4">
				<p class="text-sm text-red-800">{page.form.error}</p>
			</div>
		{/if}

		{#if showValidationErrors && Object.keys(validationErrors).length > 0}
			<div class="mb-6 rounded border border-red-200 bg-red-50 p-4">
				<h3 class="mb-2 text-sm font-medium text-red-800">
					Please fix the following errors:
				</h3>
				<ul class="space-y-1 text-sm text-red-700">
					{#each Object.entries(validationErrors) as [field, error]}
						<li>• {error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<form
			method="POST"
			enctype="multipart/form-data"
			id="newsForm"
			class="grid grid-cols-3 gap-6"
		>
			<input type="hidden" name="action" value="save" />
			<input type="hidden" name="categoryId" bind:value={selectedCategory} />
			<input type="hidden" name="campusId" bind:value={selectedCampus} />
			<input type="hidden" name="visibility" bind:value={selectedVisibility} />
			<div class="image-inputs-container"></div>
			<div class="tags-inputs-container"></div>

			<!-- Left Column: Main Content Card (2/3 width) -->
			<div class="col-span-2">
				<div class="bg-card rounded-lg border p-6 shadow-sm">
					<div class="space-y-6">
						<div>
							<Label for="title">Title *</Label>
							<Input
								id="title"
								name="title"
								bind:value={title}
								placeholder="Enter article title..."
								required
								class="mt-1 {validationErrors.title
									? 'border-red-500 focus:border-red-500'
									: ''}"
								oninput={() => validateField('title')}
							/>
							{#if validationErrors.title}
								<p class="mt-1 text-sm text-red-500">
									{validationErrors.title}
								</p>
							{:else}
								<p class="text-muted-foreground mt-1 text-xs">
									{title.length}/200 characters
								</p>
							{/if}
						</div>

						<div>
							<Label for="content">Content *</Label>
							<Textarea
								id="content"
								name="content"
								bind:value={content}
								placeholder="Write your article content here...

You can format your content using:
• **Bold text** for emphasis
• *Italic text* for emphasis  
• Line breaks for paragraphs
• • Bullet points like this
• 1. Numbered lists
• Links: [Link text](URL)"
								rows={16}
								required
								class="mt-1 {validationErrors.content
									? 'border-red-500 focus:border-red-500'
									: ''}"
								oninput={() => validateField('content')}
							/>
							{#if validationErrors.content}
								<p class="mt-1 text-sm text-red-500">
									{validationErrors.content}
								</p>
							{:else}
								<p class="text-muted-foreground mt-1 text-xs">
									{content.length}/10,000 characters
								</p>
							{/if}
						</div>

						<!-- Existing Images -->
						{#if data.images && data.images.length > 0}
							<div>
								<Label>Current Images</Label>
								<div class="mt-2 grid grid-cols-3 gap-2">
									{#each data.images as image}
										<img
											src="/api/resources/{image.resource.id}/download"
											alt={image.resource.fileName}
											class="h-20 w-full rounded border object-cover"
										/>
									{/each}
								</div>
							</div>
						{/if}

						<div>
							<Label>Add New Images (optional)</Label>
							<Button
								type="button"
								variant="outline"
								onclick={() => fileInput?.click()}
								class="mt-1 h-16 w-full border-dashed {validationErrors.images
									? 'border-red-500'
									: ''}"
							>
								<div class="flex flex-col items-center gap-1">
									<Upload />
									<span class="text-sm">Click to upload images</span>
								</div>
							</Button>
							{#if validationErrors.images}
								<p class="mt-1 text-sm text-red-500">
									{validationErrors.images}
								</p>
							{:else if selectedImages.length > 0}
								<p class="text-muted-foreground mt-1 text-xs">
									{selectedImages.length}/10 new images selected
								</p>
							{/if}

							{#if selectedImages.length > 0}
								<div class="mt-2 grid grid-cols-3 gap-2">
									{#each selectedImages as file, index}
										<div class="relative">
											<img
												src={URL.createObjectURL(file)}
												alt={file.name}
												class="h-20 w-full rounded border object-cover"
											/>
											<Button
												type="button"
												variant="destructive"
												size="sm"
												onclick={() => removeImage(index)}
												class="absolute -top-1 -right-1 h-6 w-6 p-0"
											>
												<X class="h-3 w-3" />
											</Button>
											<p class="text-muted-foreground mt-1 truncate text-xs">
												{file.name}
											</p>
										</div>
									{/each}
								</div>
							{/if}

							<input
								bind:this={fileInput}
								type="file"
								multiple
								accept=".png,.jpg,.jpeg,.webp"
								class="hidden"
								onchange={handleImageSelect}
							/>
						</div>

						<div>
							<Label>Tags</Label>
							<div class="mt-1 space-y-2">
								<div class="flex gap-2">
									<Input
										bind:value={tagInput}
										placeholder="Enter a tag..."
										class="flex-1 {validationErrors.tags
											? 'border-red-500 focus:border-red-500'
											: ''}"
										onkeypress={handleTagKeyPress}
									/>
									<Button
										type="button"
										onclick={addTag}
										variant="outline"
										disabled={!tagInput.trim()}
									>
										Add
									</Button>
								</div>
								{#if validationErrors.tags}
									<p class="text-sm text-red-500">{validationErrors.tags}</p>
								{:else if tagsList.length > 0}
									<p class="text-muted-foreground text-xs">
										{tagsList.length}/20 tags
									</p>
								{/if}

								{#if tagsList.length > 0}
									<div class="flex flex-wrap gap-2">
										{#each tagsList as tag, index}
											<div
												class="bg-secondary flex items-center gap-1 rounded px-2 py-1 text-sm"
											>
												<span>{tag}</span>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onclick={() => removeTag(index)}
													class="hover:bg-destructive hover:text-destructive-foreground h-4 w-4 p-0"
												>
													<X class="h-3 w-3" />
												</Button>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Right Column: Metadata & Actions (1/3 width) -->
			<div class="space-y-4">
				<!-- Metadata Card -->
				<div class="bg-card rounded-lg border p-4 shadow-sm">
					<div class="space-y-4">
						<div>
							<Label>Category</Label>
							<Select.Root type="single" bind:value={selectedCategory}>
								<Select.Trigger class="mt-1">
									{#if selectedCategory}
										{data.categories.find(
											(c) => c.id.toString() === selectedCategory,
										)?.name || 'No category'}
									{:else}
										No category
									{/if}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="">No category</Select.Item>
									{#each data.categories as category}
										<Select.Item value={category.id.toString()}
											>{category.name}</Select.Item
										>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

						<div>
							<Label>Campus</Label>
							<Select.Root type="single" bind:value={selectedCampus}>
								<Select.Trigger class="mt-1">
									{#if selectedCampus}
										{data.userCampuses.find(
											(c) => c.id.toString() === selectedCampus,
										)?.name || 'All campuses'}
									{:else}
										All campuses
									{/if}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="">All campuses</Select.Item>
									{#each data.userCampuses as campus}
										<Select.Item value={campus.id.toString()}
											>{campus.name}</Select.Item
										>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

						<div>
							<Label>Visibility</Label>
							<Select.Root type="single" bind:value={selectedVisibility}>
								<Select.Trigger class="mt-1">
									{#if selectedVisibility === 'public'}
										Everyone (Public)
									{:else if selectedVisibility === 'internal'}
										School Community Only
									{:else if selectedVisibility === 'staff'}
										Staff Members Only
									{:else if selectedVisibility === 'students'}
										Students Only
									{:else}
										Everyone (Public)
									{/if}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="public">Everyone (Public)</Select.Item>
									<Select.Item value="internal"
										>School Community Only</Select.Item
									>
									<Select.Item value="staff">Staff Members Only</Select.Item>
									<Select.Item value="students">Students Only</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>

						<div class="flex items-center space-x-2 pt-2">
							<Checkbox id="isPinned" name="isPinned" bind:checked={isPinned} />
							<Label for="isPinned" class="text-sm"
								>Pin to top of news feed</Label
							>
						</div>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="space-y-3">
					<Button
						type="button"
						onclick={() => handleSubmit('save')}
						disabled={submitting}
						variant="outline"
						class="w-full"
					>
						{#if submitting}
							<LoaderIcon class="mr-2 h-4 w-4 animate-spin" />
							Saving...
						{:else}
							<Save class="mr-2 h-4 w-4" />
							{data.newsItem.news.status === 'draft'
								? 'Save Draft'
								: 'Save Changes'}
						{/if}
					</Button>

					<Button
						type="button"
						onclick={() => handleSubmit('publish')}
						disabled={submitting}
						class="w-full"
					>
						{#if submitting}
							<LoaderIcon class="mr-2 h-4 w-4 animate-spin" />
							{data.newsItem.news.status === 'published'
								? 'Updating...'
								: 'Publishing...'}
						{:else}
							<Send class="mr-2 h-4 w-4" />
							{data.newsItem.news.status === 'published'
								? 'Update & Publish'
								: 'Publish Now'}
						{/if}
					</Button>
				</div>
			</div>
		</form>
	</div>
</div>
