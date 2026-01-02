<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import type {
		CourseMapItem,
		CourseMapItemAssessmentPlan,
		LearningArea,
		LearningAreaStandard
	} from '$lib/server/db/schema';
	import NotebookText from '@lucide/svelte/icons/notebook-text';
	import Plus from '@lucide/svelte/icons/plus';
	import CourseMapItemDrawer from './components/CourseMapItemDrawer.svelte';
	import CurriculumSingleYearView from './components/CurriculumSingleYearView.svelte';

	let { data, form } = $props();

	let courseMapItems = $state([...(data.courseMapItems || [])]);

	$effect(() => {
		if (data.courseMapItems) {
			courseMapItems = [...data.courseMapItems];
		}
	});

	// Use Svelte 5 $effect rune to handle form responses
	$effect(() => {
		if (form) {
			if (form?.success && form?.courseMapItem) {
				// Handle form submission success
				if (form.action === 'create') {
					handleItemCreated(form.courseMapItem);
				} else if (form.action === 'update') {
					handleItemUpdated(form.courseMapItem);
				}
			}
		}
	});

	let drawerOpen = $state(false);
	let selectedCourseMapItem = $state<CourseMapItem | null>(null);
	let courseMapItemLearningAreas = $state<LearningArea[]>([]);
	let learningAreaContent = $state<Record<number, LearningAreaStandard[]>>({});
	let assessmentPlans = $state<CourseMapItemAssessmentPlan[]>([]);
	let isLoadingDrawerData = $state(false);

	// Create mode state
	let isCreateMode = $state(false);
	let createWeek = $state<number | null>(null);
	let createSemester = $state<number | null>(null);

	// Get the first course map item for the Current Topic card
	let currentTopic = $derived(courseMapItems.length > 0 ? courseMapItems[0] : null);

	// Load drawer data for a course map item
	async function loadDrawerData(item: CourseMapItem) {
		isLoadingDrawerData = true;

		try {
			// Load learning areas for this course map item
			const response1 = await fetch(
				`/api/coursemap?action=learning-areas&courseMapItemId=${item.id}`
			);
			if (response1.ok) {
				courseMapItemLearningAreas = await response1.json();
			}

			// Load learning area content for each selected learning area
			const contentPromises = courseMapItemLearningAreas.map(async (learningArea) => {
				const yearLevel = data.subjectOffering?.subject?.yearLevel || 'year9';
				const response = await fetch(
					`/api/coursemap?action=learning-area-content&learningAreaId=${learningArea.id}&yearLevel=${yearLevel}`
				);
				if (response.ok) {
					const content = await response.json();
					return { learningAreaId: learningArea.id, content };
				}
				return { learningAreaId: learningArea.id, content: [] };
			});

			const contentResults = await Promise.all(contentPromises);
			learningAreaContent = contentResults.reduce(
				(acc, { learningAreaId, content }) => {
					acc[learningAreaId] = content;
					return acc;
				},
				{} as Record<number, LearningAreaStandard[]>
			);

			// Load assessment plans
			const response3 = await fetch(
				`/api/coursemap?action=assessment-plans&courseMapItemId=${item.id}`
			);
			if (response3.ok) {
				assessmentPlans = await response3.json();
			}
		} catch (error) {
			console.error('Error loading drawer data:', error);
		} finally {
			isLoadingDrawerData = false;
		}
	}

	function handleEmptyCellClick(week: number, semester: number) {
		// Handle creating new course map item
		selectedCourseMapItem = null;
		courseMapItemLearningAreas = [];
		learningAreaContent = {};
		assessmentPlans = [];
		isCreateMode = true;
		createWeek = week;
		createSemester = semester;
		drawerOpen = true;
	}

	// Handle course map item click - redirect to planning page
	function handleCourseMapItemClick(item: CourseMapItem) {
		goto(`/subjects/${data.subjectOfferingId}/curriculum/${item.id}/planning`);
	}

	// Handle course map item edit - open drawer in edit mode
	function handleCourseMapItemEdit(item: CourseMapItem) {
		selectedCourseMapItem = item;
		courseMapItemLearningAreas = [];
		learningAreaContent = {};
		assessmentPlans = [];
		isCreateMode = false;
		drawerOpen = true;
		loadDrawerData(item);
	}

	// Handle real-time color updates
	function handleColorChange(itemId: number, newColor: string) {
		// Update the color in the local courseMapItems array with proper immutability
		courseMapItems = courseMapItems.map((item) =>
			item.id === itemId ? { ...item, color: newColor } : item
		);

		// Also update the selectedCourseMapItem if it matches
		if (selectedCourseMapItem && selectedCourseMapItem.id === itemId) {
			selectedCourseMapItem = { ...selectedCourseMapItem, color: newColor };
		}
	}

	// Handle new item creation - add to local state immediately
	function handleItemCreated(newItem: CourseMapItem) {
		courseMapItems = [...courseMapItems, newItem];
	}

	// Handle item updates - update local state immediately
	function handleItemUpdated(updatedItem: CourseMapItem) {
		// Use map to create new array and trigger reactivity
		courseMapItems = courseMapItems.map((item) =>
			item.id === updatedItem.id ? updatedItem : item
		);

		// Also update the selectedCourseMapItem if it matches
		if (selectedCourseMapItem && selectedCourseMapItem.id === updatedItem.id) {
			selectedCourseMapItem = { ...updatedItem };
		}
	}

	// Navigate to full year view when clicking outside course map view
	function handleFullCourseMapCardClick(e: MouseEvent) {
		// Only navigate if clicking directly on the card background, not on the CurriculumSingleYearView
		const target = e.target as HTMLElement;
		if (target.closest('.curriculum-view-container')) {
			return;
		}
		goto(`/subjects/${data.subjectOfferingId}/courseMap/FullYear`);
	}

	// Open drawer to create a new topic
	function handleCreateTopicClick() {
		selectedCourseMapItem = null;
		courseMapItemLearningAreas = [];
		learningAreaContent = {};
		assessmentPlans = [];
		isCreateMode = true;
		createWeek = 1;
		createSemester = 1;
		drawerOpen = true;
	}
</script>

<svelte:head>
	<title>Course Map - {data.subjectOffering?.subject?.name || 'Subject'}</title>
</svelte:head>

<div class="container mx-auto space-y-6 p-6">
	<!-- Hero Bar -->
	<div class="bg-muted/30 rounded-lg p-6">
		<h1 class="text-3xl font-bold">
			{data.fullSubjectOfferingName || `${data.subjectOffering?.subject?.yearLevel || 'Year'} ${data.subjectOffering?.subject?.name || 'Subject'}`} Course Map
		</h1>
	</div>

	<!-- Main Grid Layout -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Left Column - Current Topic Card (Full Height) -->
		<div class="lg:col-span-1">
			<Card.Root class="h-full">
				<Card.Content class="p-4">
					{#if currentTopic}
						<!-- Display current topic name -->
						<h3 class="mb-4 text-lg font-semibold">{currentTopic.topic}</h3>

						<!-- Tasks Section -->
						<div class="mb-4">
							<h4 class="text-muted-foreground mb-2 text-sm font-medium">Tasks</h4>
							<p class="text-muted-foreground text-sm">No tasks yet</p>
						</div>

						<!-- Task Plans Section -->
						<div class="mb-4">
							<h4 class="text-muted-foreground mb-2 text-sm font-medium">Task Plans</h4>
							<p class="text-muted-foreground text-sm">No task plans yet</p>
						</div>

						<!-- Resources Section -->
						<div>
							<h4 class="text-muted-foreground mb-2 text-sm font-medium">Resources</h4>
							<p class="text-muted-foreground text-sm">No resources yet</p>
						</div>
					{:else}
						<!-- No topics - show create option -->
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold">Create a Topic</h3>
							<button
								type="button"
								class="hover:bg-muted rounded-full p-2 transition-colors"
								onclick={handleCreateTopicClick}
								aria-label="Create new topic"
							>
								<Plus />
							</button>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Right Column - 2 Rows -->
		<div class="flex flex-col gap-6 lg:col-span-2">
			<!-- Full Course Map Card -->
			<Card.Root
				class="cursor-pointer transition-shadow hover:shadow-md"
				onclick={handleFullCourseMapCardClick}
			>
				<Card.Content class="p-4">
					<h3 class="mb-4 text-lg font-semibold">Full Course Map</h3>
					<div class="curriculum-view-container overflow-hidden rounded-lg">
						<CurriculumSingleYearView
							{courseMapItems}
							yearLevel={data.subjectOffering?.subject?.yearLevel || 'Year 9'}
							onCourseMapItemClick={handleCourseMapItemClick}
							onCourseMapItemEdit={handleCourseMapItemEdit}
							onEmptyCellClick={handleEmptyCellClick}
							compact={true}
						/>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Bottom Row - Teachers and Curriculum Cards -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<!-- Teachers Card -->
				<Card.Root>
					<Card.Content class="p-4">
						<h3 class="mb-4 text-lg font-semibold">Teachers</h3>
						{#if data.teachers && data.teachers.length > 0}
							<div class="flex flex-wrap gap-2">
								{#each data.teachers as teacher}
									<Avatar.Root>
										{#if teacher.avatarUrl}
											<Avatar.Image src={teacher.avatarUrl} alt={`${teacher.firstName} ${teacher.lastName}`} />
										{/if}
										<Avatar.Fallback>
											{teacher.firstName?.[0] || ''}{teacher.lastName?.[0] || ''}
										</Avatar.Fallback>
									</Avatar.Root>
								{/each}
							</div>
						{:else}
							<p class="text-muted-foreground text-sm">No teachers assigned</p>
						{/if}
					</Card.Content>
				</Card.Root>

				<!-- Curriculum Card -->
				<Card.Root>
					<Card.Content class="p-4">
						<h3 class="mb-4 text-lg font-semibold">Curriculum</h3>
						{#if data.curriculumSubjectInfo}
							<div class="flex items-center gap-2">
								<NotebookText class="text-muted-foreground" />
								<span>{data.curriculumSubjectInfo.curriculum.name} {data.curriculumSubjectInfo.curriculumSubject.name}</span>
							</div>
						{:else}
							<p class="text-muted-foreground text-sm">Select a Curriculum</p>
						{/if}
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>
</div>

<CourseMapItemDrawer
	bind:open={drawerOpen}
	courseMapItem={selectedCourseMapItem}
	subjectOfferingId={data.subjectOfferingId}
	availableLearningAreas={data.availableLearningAreas}
	{courseMapItemLearningAreas}
	{learningAreaContent}
	{isCreateMode}
	{createWeek}
	{createSemester}
	onColorChange={handleColorChange}
	onItemCreated={handleItemCreated}
	onItemUpdated={handleItemUpdated}
/>
