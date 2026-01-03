<script lang="ts">
	import { goto } from '$app/navigation';
	import type {
		CourseMapItem,
		CourseMapItemAssessmentPlan,
		LearningArea,
		LearningAreaStandard
	} from '$lib/server/db/schema';
	import CourseMapItemDrawer from '../components/CourseMapItemDrawer.svelte';
	import CourseMapTable from '../components/CourseMapTable.svelte';

	let { data } = $props();

	let courseMapItems = $state([...(data.courseMapItems || [])]);

	$effect(() => {
		if (data.courseMapItems) {
			courseMapItems = [...data.courseMapItems];
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
</script>

<svelte:head>
	<title>Full Year Course Map - {data.subjectOffering?.subject?.name || 'Subject'}</title>
</svelte:head>

<div class="flex h-[calc(100vh-4rem)] flex-col px-3 py-6">
	<div class="mb-4">
		<h1 class="text-2xl font-bold">
			{data.fullSubjectOfferingName || data.subjectOffering?.subject?.name || 'Subject'} Course Map
		</h1>
	</div>

	<div class="min-h-0 flex-1">
		<CourseMapTable
			{courseMapItems}
			yearLevel={data.fullSubjectOfferingName || 'Curriculum Map'}
			onCourseMapItemClick={handleCourseMapItemClick}
			onCourseMapItemEdit={handleCourseMapItemEdit}
			onEmptyCellClick={handleEmptyCellClick}
		/>
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
</div>
