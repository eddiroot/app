<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Drawer, DrawerContent } from '$lib/components/ui/drawer';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { CourseMapItem, LearningArea, LearningAreaStandard } from '$lib/server/db/schema';
	import { toast } from 'svelte-sonner';

	// Use Svelte 5 $props() for component props
	let {
		open = $bindable(false),
		courseMapItem = null,
		subjectOfferingId,
		availableLearningAreas = [],
		courseMapItemLearningAreas = [],
		learningAreaContent = {},
		isCreateMode = false,
		createWeek = null,
		createSemester = null,
		onColorChange = undefined,
		onItemCreated = undefined,
		onItemUpdated = undefined
	}: {
		open?: boolean;
		courseMapItem?: CourseMapItem | null;
		subjectOfferingId: number;
		availableLearningAreas?: LearningArea[];
		courseMapItemLearningAreas?: LearningArea[];
		learningAreaContent?: Record<number, LearningAreaStandard[]>;
		isCreateMode?: boolean;
		createWeek?: number | null;
		createSemester?: number | null;
		onColorChange?: ((itemId: number, newColor: string) => void) | undefined;
		onItemCreated?: ((newItem: CourseMapItem) => void) | undefined;
		onItemUpdated?: ((updatedItem: CourseMapItem) => void) | undefined;
	} = $props();

	// Form state
	let isEditMode = $state(false);
	let isLoading = $state(false);
	let editForm = $state({
		topic: '',
		description: '',
		startWeek: 1,
		duration: 1,
		color: ''
	});

	// Color options for course map items
	const colorOptions = [
		{ name: 'Blue', value: '#3B82F6', class: 'bg-blue-500' },
		{ name: 'Green', value: '#10B981', class: 'bg-emerald-500' },
		{ name: 'Purple', value: '#8B5CF6', class: 'bg-violet-500' },
		{ name: 'Orange', value: '#F59E0B', class: 'bg-amber-500' },
		{ name: 'Red', value: '#EF4444', class: 'bg-red-500' },
		{ name: 'Pink', value: '#EC4899', class: 'bg-pink-500' },
		{ name: 'Teal', value: '#14B8A6', class: 'bg-teal-500' }
	];

	// Learning area selection state
	let selectedLearningAreaIds = $state<string[]>([]);

	// Color picker state
	let showColorPicker = $state(false);

	// Learning area picker state
	let showLearningAreaPicker = $state(false);

	// New state for assessment plans, lesson plans, and tasks
	let assessmentPlans = $state<any[]>([]);
	let lessonPlans = $state<any[]>([]);
	let tasks = $state<any[]>([]);
	let isLoadingDrawerData = $state(false);

	// Form element reference
	let formElement: HTMLFormElement;

	// Use Svelte 5 $effect for reactive statements

	// Load drawer data when courseMapItem changes
	$effect(() => {
		if (courseMapItem && !isCreateMode) {
			loadDrawerData(courseMapItem.id);
		}
	});

	async function loadDrawerData(courseMapItemId: number) {
		isLoadingDrawerData = true;
		try {
			// Load assessment plans
			const assessmentResponse = await fetch(
				`/api/coursemap?action=assessment-plans&courseMapItemId=${courseMapItemId}`
			);
			if (assessmentResponse.ok) {
				assessmentPlans = await assessmentResponse.json();
			}

			// Load lesson plans
			const lessonResponse = await fetch(
				`/api/coursemap?action=lesson-plans&courseMapItemId=${courseMapItemId}`
			);
			if (lessonResponse.ok) {
				lessonPlans = await lessonResponse.json();
			}

			// Load tasks
			const tasksResponse = await fetch(
				`/api/coursemap?action=tasks&courseMapItemId=${courseMapItemId}`
			);
			if (tasksResponse.ok) {
				tasks = await tasksResponse.json();
			}
		} catch (error) {
			console.error('Error loading drawer data:', error);
		} finally {
			isLoadingDrawerData = false;
		}
	}

	$effect(() => {
		if (courseMapItem && !isEditMode) {
			editForm.topic = courseMapItem.topic || '';
			editForm.description = courseMapItem.description || '';
			editForm.startWeek = courseMapItem.startWeek || 1;
			editForm.duration = courseMapItem.duration || 1;
			editForm.color = courseMapItem.color || colorOptions[0].value;
			selectedLearningAreaIds = courseMapItemLearningAreas.map((la) => la.id.toString());
		} else if (isCreateMode && createWeek) {
			editForm.topic = '';
			editForm.description = '';
			editForm.startWeek = createWeek;
			editForm.duration = 1;
			editForm.color = colorOptions[0].value;
			selectedLearningAreaIds = [];
			isEditMode = true;
		}
	});

	// Reset edit mode and close color picker when switching between items
	let previousCourseMapItem = $state<CourseMapItem | null>(null);
	$effect(() => {
		if (courseMapItem !== previousCourseMapItem) {
			isEditMode = false;
			showColorPicker = false;
			showLearningAreaPicker = false;
			previousCourseMapItem = courseMapItem;
		}
	});

	// Reset edit mode only when drawer first opens with an existing course map item (view mode)
	let previousOpen = $state(false);
	$effect(() => {
		if (open && !previousOpen && courseMapItem && !isCreateMode) {
			isEditMode = false;
			previousOpen = true;
		} else if (!open) {
			previousOpen = false;
		}
	});

	// Close color picker when clicking outside
	$effect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (showColorPicker && event.target) {
				const target = event.target as Element;
				const colorPickerContainer = target.closest('.color-picker-container');
				if (!colorPickerContainer) {
					showColorPicker = false;
				}
			}
		}

		if (showColorPicker) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});

	function toggleLearningArea(learningAreaId: number) {
		const idStr = learningAreaId.toString();
		if (selectedLearningAreaIds.includes(idStr)) {
			selectedLearningAreaIds = selectedLearningAreaIds.filter((id) => id !== idStr);
		} else {
			selectedLearningAreaIds = [...selectedLearningAreaIds, idStr];
		}
	}

	// Helper function to get color name from value
	function getColorName(colorValue: string): string {
		const colorOption = colorOptions.find((option) => option.value === colorValue);
		return colorOption ? colorOption.name : 'Custom';
	}

	function handleEdit() {
		isEditMode = true;
	}

	function handleCancel() {
		isEditMode = false;
		if (courseMapItem) {
			editForm.topic = courseMapItem.topic || '';
			editForm.description = courseMapItem.description || '';
			editForm.startWeek = courseMapItem.startWeek || 1;
			editForm.duration = courseMapItem.duration || 1;
			editForm.color = courseMapItem.color || '';
		}
		selectedLearningAreaIds = courseMapItemLearningAreas.map((la) => la.id.toString());
	}

	async function handleSave() {
		isLoading = true;

		try {
			// First, update local state immediately for instant feedback
			if (isCreateMode && onItemCreated) {
				// Create a temporary item for immediate display
				const tempItem = {
					id: Date.now(), // Temporary ID
					subjectOfferingId: subjectOfferingId,
					topic: editForm.topic,
					description: editForm.description,
					startWeek: editForm.startWeek,
					duration: editForm.duration,
					semester: createSemester || 1,
					color: editForm.color,
					version: 1,
					isArchived: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					originalId: null,
					imageBase64: null
				};

				onItemCreated(tempItem);

				// Close drawer immediately for create mode
				handleClose();

				// Show success message
				toast.success('Course map item created successfully');

				// Now save to server in background
				const formData = new FormData();
				formData.append('topic', editForm.topic);
				formData.append('description', editForm.description);
				formData.append('startWeek', editForm.startWeek.toString());
				formData.append('duration', editForm.duration.toString());
				formData.append(
					'learningAreaIds',
					JSON.stringify(selectedLearningAreaIds.map((id) => Number(id)))
				);
				formData.append('learningAreaIds', JSON.stringify(selectedLearningAreaIds));
				formData.append('semester', (createSemester || 1).toString());

				fetch('?/createCourseMapItem', {
					method: 'POST',
					body: formData
				})
					.then((response) => response.json())
					.then((result) => {
						if (result.success && result.courseMapItem) {
							// Replace temp item with real item from server
							// TODO: Implement replacing temporary item with real server item
							// This would require additional logic in the parent component
						}
					})
					.catch((error) => {
						console.error('Background save failed:', error);
						toast.error('Failed to save to server, but item was added locally');
					});
			} else if (!isCreateMode && courseMapItem && onItemUpdated) {
				// Update existing item immediately
				const updatedItem = {
					...courseMapItem,
					topic: editForm.topic,
					description: editForm.description,
					startWeek: editForm.startWeek,
					duration: editForm.duration,
					color: editForm.color,
					updatedAt: new Date()
				};

				onItemUpdated(updatedItem);

				// Update local reference
				courseMapItem = updatedItem;

				// Exit edit mode but keep drawer open for edit mode
				isEditMode = false;

				// Show success message
				toast.success('Course map item updated successfully');

				// Save to server in background
				const formData = new FormData();
				formData.append('topic', editForm.topic);
				formData.append('description', editForm.description);
				formData.append('startWeek', editForm.startWeek.toString());
				formData.append('duration', editForm.duration.toString());
				formData.append('color', editForm.color);
				formData.append('learningAreaIds', JSON.stringify(selectedLearningAreaIds));
				if (courseMapItem) {
					formData.append('courseMapItemId', courseMapItem.id.toString());
				}

				fetch('?/updateCourseMapItem', {
					method: 'POST',
					body: formData
				})
					.then((response) => response.json())
					.then((result) => {
						// Background update completed
					})
					.catch((error) => {
						console.error('Background update failed:', error);
						toast.error('Failed to save to server, but item was updated locally');
					});
			}
		} catch (error) {
			console.error('Error in handleSave:', error);
			toast.error('An error occurred while saving');
		} finally {
			isLoading = false;
		}
	}

	function handleClose() {
		open = false;
		isEditMode = false;
		showColorPicker = false;
		showLearningAreaPicker = false;
		// Don't reset createSemester and createWeek here - let parent handle it
	}
</script>

<Tooltip.Provider>
	<Drawer bind:open onClose={handleClose} direction="right">
		<DrawerContent
			class="bg-background flex max-h-[100vh] !max-w-[800px] flex-col overflow-hidden rounded-l-lg"
		>
			<!-- Header -->
			<div class="border-border flex shrink-0 items-center justify-between border-b p-6 pb-2">
				<h2 class="text-3xl font-bold">
					{#if isCreateMode}
						Create Task
					{:else if isEditMode}
						Edit Task
					{:else}
						{courseMapItem?.topic || 'Task Details'}
					{/if}
				</h2>

				<!-- Top Right Action Buttons -->
				<div class="flex items-center gap-2">
					{#if isCreateMode}
						<Button size="sm" onclick={handleSave} disabled={isLoading || !editForm.topic.trim()}>
							Create Task
						</Button>
					{/if}
				</div>
			</div>

			<!-- Hidden form for SvelteKit form actions -->
			<!-- Form removed - using direct API calls for immediate updates -->

			<!-- Metadata Section -->
			{#if isEditMode || isCreateMode}
				<div class="border-border shrink-0 border-b p-6 pt-4 pb-4">
					<div class="grid grid-cols-12 gap-4">
						<!-- Topic -->
						<div class="col-span-6">
							<Label for="topic" class="text-sm font-medium">Topic</Label>
							<Input
								id="topic"
								bind:value={editForm.topic}
								placeholder="Enter topic"
								class="mt-2"
							/>
						</div>

						<!-- Week & Duration -->
						<div class="col-span-2">
							<Label for="startWeek" class="text-sm font-medium">Week</Label>
							<Input
								id="startWeek"
								type="number"
								bind:value={editForm.startWeek}
								min="1"
								max="18"
								class="mt-2"
							/>
						</div>
						<div class="col-span-2">
							<Label for="duration" class="text-sm font-medium">Duration</Label>
							<Input
								id="duration"
								type="number"
								bind:value={editForm.duration}
								min="1"
								max="18"
								class="mt-2"
							/>
						</div>

						<!-- Color Picker -->
						<div class="color-picker-container relative col-span-2">
							<Label class="text-sm font-medium">Color</Label>
							<div class="relative mt-2">
								<button
									type="button"
									class="border-input bg-background hover:bg-accent flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors"
									onclick={() => (showColorPicker = !showColorPicker)}
									title="Select color"
									aria-label="Select color"
								>
									<div class="flex items-center gap-2">
										<div
											class="border-border h-4 w-4 rounded-full border"
											style="background-color: {editForm.color}"
										></div>
										<span class="truncate">{getColorName(editForm.color)}</span>
									</div>
									<svg
										class="text-muted-foreground h-4 w-4 shrink-0 transition-transform {showColorPicker
											? 'rotate-180'
											: ''}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 9l-7 7-7-7"
										></path>
									</svg>
								</button>
								{#if showColorPicker}
									<div
										class="bg-background border-border absolute top-full right-0 left-0 z-[60] mt-1 min-w-max rounded-md border p-3 shadow-lg"
									>
										<div class="grid grid-cols-2 gap-2">
											{#each colorOptions as color}
												<button
													type="button"
													class="h-8 w-full rounded border-2 transition-all hover:scale-105 {editForm.color ===
													color.value
														? 'border-foreground ring-ring ring-2 ring-offset-2'
														: 'border-border hover:border-foreground'} {color.class}"
													onclick={() => {
														editForm.color = color.value;
														showColorPicker = false;
													}}
													title={color.name}
													aria-label="Select {color.name} color"
												>
													<span class="sr-only">{color.name}</span>
												</button>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Main Content Area -->
			<div class="flex-1 overflow-y-auto p-6 pt-0">
				<div class="space-y-6">
					<!-- Description -->
					{#if isEditMode || isCreateMode}
						<div>
							<Label for="description" class="text-sm font-medium">Description</Label>
							<Textarea
								id="description"
								bind:value={editForm.description}
								placeholder="Enter description"
								rows={3}
								class="mt-2"
							/>
						</div>
					{:else if courseMapItem?.description}
						<div>
							<Label class="text-xl font-bold">Description</Label>
							<p class="mt-2 text-base">{courseMapItem.description}</p>
						</div>
					{/if}

					<!-- Learning Areas Section -->
					{#if availableLearningAreas.length > 0}
						<div>
							<h3 class="mb-4 text-xl font-bold">Learning Areas</h3>

							{#if isEditMode || isCreateMode}
								<!-- Edit Mode: Multi-select dropdown using Select UI -->
								<Select.Root
									type="multiple"
									bind:value={selectedLearningAreaIds}
									name="learningAreaIds"
								>
									<Select.Trigger class="w-full">
										{#if selectedLearningAreaIds.length > 0}
											{selectedLearningAreaIds.length} selected
										{:else}
											Select learning areas...
										{/if}
									</Select.Trigger>
									<Select.Content class="z-50 max-h-48 overflow-y-auto rounded-md border shadow-lg">
										{#each availableLearningAreas as learningArea}
											<Select.Item value={learningArea.id.toString()}>
												<div class="flex items-center">
													<span class="flex-1 truncate text-sm">{learningArea.name}</span>
													{#if learningArea.description}
														<HoverCard.Root>
															<HoverCard.Trigger
																type="button"
																aria-label="Show description"
																class="ml-2 focus:outline-none"
															></HoverCard.Trigger>
															<HoverCard.Content
																class="z-50 max-w-xs rounded-lg border p-3 text-xs leading-relaxed shadow-lg"
															>
																{learningArea.description}
															</HoverCard.Content>
														</HoverCard.Root>
													{/if}
												</div>
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							{:else}
								<!-- View Mode: Vertical list layout -->
								{#if courseMapItemLearningAreas.length > 0}
									<div class="space-y-4">
										{#each courseMapItemLearningAreas as learningArea}
											{@const contents = learningAreaContent[learningArea.id] || []}

											<div>
												<!-- Learning Area name as header -->
												<h4 class="mb-2 text-lg font-semibold">{learningArea.name}</h4>

												<!-- Standards as dot points -->
												{#if contents.length > 0}
													<ul class="ml-4 space-y-1">
														{#each contents as content}
															<li class="flex items-start text-sm">
																<span class="mt-1 mr-2">•</span>
																<div>
																	<span class="font-medium">{content.name}</span>
																	{#if content.description}
																		<span class="text-gray-600"> - {content.description}</span>
																	{/if}
																</div>
															</li>
														{/each}
													</ul>
												{:else}
													<p class="ml-4 text-sm text-gray-500 italic">No standards available</p>
												{/if}
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-sm">No learning areas selected</p>
								{/if}
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<!-- Bottom Action Bar -->
			<div class="border-border bg-background sticky bottom-0 shrink-0 border-t">
				{#if isEditMode && !isCreateMode}
					<div class="flex gap-2 p-4">
						<Button variant="outline" class="flex-1" onclick={handleCancel}>Cancel</Button>
						<Button class="flex-1" onclick={handleSave} disabled={isLoading}>Save Changes</Button>
					</div>
				{:else if !isCreateMode}
					<!-- View Mode Action Bar -->
					<div class="flex gap-2 p-4">
						<Button variant="outline" class="flex-1" onclick={handleClose}>Close</Button>
						<Button class="flex-1" onclick={handleEdit}>Edit</Button>
					</div>
				{/if}
			</div>
		</DrawerContent>
	</Drawer>
</Tooltip.Provider>
