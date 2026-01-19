<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Card from '$lib/components/ui/card';
	import * as Item from '$lib/components/ui/item/index.js';
	import type {
		CourseMapItem,
		CourseMapItemAssessmentPlan,
		LearningArea,
		LearningAreaStandard
	} from '$lib/server/db/schema';
	import NoteBookText from '@lucide/svelte/icons/notebook-text';
	import CourseMapItemDrawer from './components/CourseMapItemDrawer.svelte';
	import CourseMapTable from './components/CourseMapTable.svelte';

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
				const yearLevel = 'year9'; // TODO: Get from proper source
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
		goto(`/subjects/${data.subjectOfferingId}/courseMap/${item.id}/planning`);
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
		goto(`/subjects/${data.subjectOfferingId}/courseMap/fullYear`);
	}

	function handleTopicItemClick(item: CourseMapItem) {
		goto(`/subjects/${data.subjectOfferingId}/courseMap/${item.id}/planning`);
	}

</script>

<svelte:head>
	<title>Course Map - {data.subjectOffering?.subject?.name || 'Subject'}</title>
</svelte:head>

<!-- Full-width Hero Bar -->
<div class="w-full px-6 py-18 relative bg-cover bg-center" style="background-image: url('/hero-coursemap.jpg');">
    <div class="absolute inset-0 bg-linear-to-br from-black/20 via-black/30 to-black/50"></div>
    <h1 class="text-center text-4xl font-bold text-white relative">
        {data.subjectOffering?.subject?.name || 'Subject'}: Course Map
    </h1>
</div>


<!-- Main Content -->
<div class="flex h-[calc(100vh-180px)] flex-col gap-3 overflow-hidden p-3">
	<!-- Main Grid Layout -->
	<div class="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-3">
		<!-- Left Column - Current Topic Card (Full Height) -->
		<div class="min-h-0 lg:col-span-1">
			<Card.Root class="flex h-full flex-col overflow-hidden gap-3 py-4">
				<Card.Header class="gap-0">
					<Card.Title class ="text-lg font-bold">
						Topic
					</Card.Title>
				</Card.Header>
				<Card.Content class="flex-1 overflow-auto px-4 pb-4 py-0">
					<div class="flex w-full max-w-md flex-col  gap-6">
					<div class="flex w-full max-w-md flex-col gap-4">
					{#each courseMapItems as item (item.id)}
					<Item.Root variant="outline"
						onclick={() => handleTopicItemClick(item)}>
						{#snippet child({ props })}
						<a href="#/" {...props}>
						<Item.Media variant="image">
						<img
							src={`https://avatar.vercel.sh/${item.topic}`}
							alt={item.topic}
							width="32"
							height="32"
							class="size-8 rounded object-cover grayscale"
						/>
						</Item.Media>
						<Item.Content>
						<Item.Title class="line-clamp-1">
							{item.topic}
						</Item.Title>
						<Item.Description class="line-clamp-1">{item.description}</Item.Description>
						</Item.Content>
						</a>
						{/snippet}
					</Item.Root>
					{/each}
					</div>
					</div>
						
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Right Column - 2 Rows -->
		<div class="flex min-h-0 flex-col gap-3 lg:col-span-2">
			<!-- Full Course Map Card -->
			<Card.Root
				class="flex min-h-0 flex-1 cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-md gap-3 py-4"
				onclick={handleFullCourseMapCardClick}
			>
			<Card.Header>
					<Card.Title class ="text-lg font-bold">
						Course Map
					</Card.Title>
				</Card.Header>
				<Card.Content class="flex min-h-0 flex-1 flex-col px-4 ">
				<div class="curriculum-view-container min-h-0 flex-1 rounded-lg">
						<CourseMapTable
							{courseMapItems}
							yearLevel={data.fullSubjectOfferingName || 'Curriculum Map'}
							onCourseMapItemClick={handleCourseMapItemClick}
							onCourseMapItemEdit={handleCourseMapItemEdit}
							onEmptyCellClick={handleEmptyCellClick}
							compact={true}
						/>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Bottom Row - Teachers and Curriculum Cards -->
			<div class="grid shrink-0 grid-cols-1 gap-3 md:grid-cols-2">
				<!-- Teachers Card -->
				<Card.Root class= " gap-3 py-4">
					<Card.Header>
						<Card.Title class ="text-lg font-bold">
							Teachers
						</Card.Title>
					</Card.Header>
					<Card.Content class="px-4">
						{#if data.teachers && data.teachers.length > 0}
							<div class="flex flex-wrap gap-2  px-4">
								{#each data.teachers as teacher}
									<Avatar.Root class="h-10 w-10 rounded-lg">
										{#if teacher.avatarUrl}
											<Avatar.Image src={teacher.avatarUrl} alt={`${teacher.firstName} ${teacher.lastName}`} />
										{/if}
										<Avatar.Fallback class="rounded-lg">
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
				<Card.Root onclick={() => goto(`/subjects/${data.subjectOfferingId}/courseMap/curriculum`)} class=" gap-3 py-4">
					<Card.Header>
						<Card.Title class ="text-lg font-bold">
							Curriculum
						</Card.Title>
					</Card.Header>
					<Card.Content class="pl-4">
						{#if data.curriculumSubjectInfo}
							<div class="flex items-center gap-2 px-4">
								<NoteBookText class="h-4 w-4 "/>
								<span>{data.curriculumSubjectInfo.curriculum.name} {data.curriculumSubjectInfo.curriculumSubject.name} </span>
							</div>
						{:else}
							<p class="text-muted-foreground text-m pt-2">Assign a curriculum</p>
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
