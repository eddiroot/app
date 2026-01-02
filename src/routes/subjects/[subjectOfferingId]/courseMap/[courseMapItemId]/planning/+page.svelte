<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import VcaaLearningAreaCard from '$lib/components/curriculum-learning-area-card.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet';
	import { Textarea } from '$lib/components/ui/textarea';
	import Archive from '@lucide/svelte/icons/archive';
	import BookTest from '@lucide/svelte/icons/book';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Check from '@lucide/svelte/icons/check';
	import Clock from '@lucide/svelte/icons/clock';
	import Edit from '@lucide/svelte/icons/edit';
	import Plus from '@lucide/svelte/icons/plus';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import X from '@lucide/svelte/icons/x';
	import AssessmentPlanCard from './components/AssessmentPlanCard.svelte';
	import LessonPlanCard from './components/LessonPlanCard.svelte';
	import ResourceFileInput from './components/ResourceFileInput.svelte';
	import ResourcesPopover from './components/ResourcesPopover.svelte';

	let { data, form } = $props();
	let lessonPlanDescription = $state('');
	let assessmentPlanDescription = $state('');
	let isGeneratingLesson = $state(false);
	let isGeneratingAssessment = $state(false);
	let generatedLessonPlan = $state<any>(null);
	let generatedAssessmentPlan = $state<any>(null);
	let lessonPlanDrawerOpen = $state(false);
	let assessmentPlanDrawerOpen = $state(false);
	let isCreatingLessonPlan = $state(false);
	let isCreatingAssessmentPlan = $state(false);
	let currentLessonInstruction = $state('');
	let currentAssessmentInstruction = $state('');
	let resourceFileInput: any;

	// Edit mode state
	let editMode = $state(false);
	let editedTopic = $state(data.courseMapItem.topic);
	let editedDescription = $state(data.courseMapItem.description || '');
	let editedStartWeek = $state(data.courseMapItem.startWeek ?? 1);
	let editedDuration = $state(data.courseMapItem.duration ?? 1);
	let editedLearningAreas = $state([...data.learningAreas]); // Local copy for edit mode

	// Update edited values when data changes
	$effect(() => {
		editedTopic = data.courseMapItem.topic;
		editedDescription = data.courseMapItem.description || '';
		editedStartWeek = data.courseMapItem.startWeek ?? 1;
		editedDuration = data.courseMapItem.duration ?? 1;
		editedLearningAreas = [...data.learningAreas];
	});

	// Function to save all changes
	async function saveChanges() {
		try {
			const formData = new FormData();
			formData.set('topic', editedTopic);
			formData.set('description', editedDescription);
			formData.set('startWeek', (editedStartWeek ?? 1).toString());
			formData.set('duration', (editedDuration ?? 1).toString());
			formData.set('learningAreaIds', JSON.stringify(editedLearningAreas.map((la) => la.id)));

			const response = await fetch('?/updateCourseMapItem', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();
			if (result.type === 'success') {
				editMode = false;
				invalidateAll();
			} else {
				alert('Failed to save changes');
			}
		} catch (error) {
			console.error('Error saving changes:', error);
			alert('Failed to save changes');
		}
	}

	// Function to cancel changes
	function cancelChanges() {
		editedTopic = data.courseMapItem.topic;
		editedDescription = data.courseMapItem.description || '';
		editedStartWeek = data.courseMapItem.startWeek ?? 1;
		editedDuration = data.courseMapItem.duration ?? 1;
		editedLearningAreas = [...data.learningAreas];
		editMode = false;
	}

	// Function to remove learning area locally (only affects UI until save)
	function removeLearningAreaLocally(learningAreaId: number) {
		editedLearningAreas = editedLearningAreas.filter((la) => la.id !== learningAreaId);
	}

	// Resource management functions
	function handleAddResource() {
		resourceFileInput?.triggerUpload();
	}

	function handleResourceAdded() {
		invalidateAll();
	}

	async function handleRemoveResource(resourceId: number) {
		try {
			const formData = new FormData();
			formData.set('resourceId', resourceId.toString());

			const response = await fetch('?/removeResource', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();
			if (result.type === 'success') {
				invalidateAll();
			} else {
				alert('Failed to remove resource');
			}
		} catch (error) {
			console.error('Error removing resource:', error);
			alert('Failed to remove resource');
		}
	}

	async function handleOpenResource(resource: any) {
		try {
			const response = await fetch(`/api/resources?resourceId=${resource.id}&action=download`);
			const result = await response.json();

			if (result.downloadUrl) {
				// Open resource in new tab/window
				window.open(result.downloadUrl, '_blank');
			} else {
				alert('Failed to generate resource link');
			}
		} catch (error) {
			console.error('Error opening resource:', error);
			alert('Failed to open resource');
		}
	}

	// Handle form response
	$effect(() => {
		if (form?.success && form?.lessonPlan) {
			lessonPlanDrawerOpen = false;
			lessonPlanDescription = '';
			generatedLessonPlan = null;
			currentLessonInstruction = '';
			invalidateAll();
		} else if (form?.success && form?.assessmentPlan) {
			assessmentPlanDrawerOpen = false;
			assessmentPlanDescription = '';
			generatedAssessmentPlan = null;
			currentAssessmentInstruction = '';
			invalidateAll();
		} else if (form?.success && form?.planData) {
			generatedLessonPlan = form.planData;
			currentLessonInstruction = (form.instruction as string) || lessonPlanDescription;
		}
	});
</script>

<!-- Hero Section with Course Map Item Image -->
<div class="relative mb-8 h-64 w-full overflow-hidden">
	{#if data.courseMapItem.imageBase64}
		<img
			src={`data:image/png;base64,${data.courseMapItem.imageBase64}`}
			alt={data.courseMapItem.topic}
			class="absolute inset-0 h-full w-full object-cover"
		/>
		<div class="absolute inset-0 bg-black/40"></div>
	{:else}
		<!-- Use course map item color as background -->
		<div
			class="absolute inset-0"
			style="background-color: {data.courseMapItem.color || '#6B7280'}"
		></div>
		<!-- Add gradient overlay for better contrast -->
		<div class="absolute inset-0 bg-gradient-to-br from-black/20 via-black/30 to-black/50"></div>
	{/if}

	<!-- Course Map Item Details Overlay (centered) -->
	<div
		class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white"
	>
		{#if editMode}
			<Input
				bind:value={editedTopic}
				class="mb-2 border-white/20 bg-white/10 text-center text-4xl font-bold text-white placeholder:text-white/70"
				placeholder="Course topic"
			/>
		{:else}
			<h1 class="mb-2 text-4xl font-bold">{data.courseMapItem.topic}</h1>
		{/if}
		<div class="flex flex-wrap items-center justify-center gap-6 text-sm">
			<div class="flex items-center gap-1">
				<Calendar />
				{#if editMode}
					<span>Week</span>
					<Input
						bind:value={editedStartWeek}
						type="number"
						class="h-6 w-16 border-white/20 bg-white/10 text-center text-xs text-white"
					/>
				{:else}
					Week {data.courseMapItem.startWeek}
				{/if}
			</div>
			<div class="flex items-center gap-1">
				<Clock />
				{#if editMode}
					<Input
						bind:value={editedDuration}
						type="number"
						class="h-6 w-16 border-white/20 bg-white/10 text-center text-xs text-white"
					/>
					<span>weeks</span>
				{:else}
					{data.courseMapItem.duration} weeks
				{/if}
			</div>
			<div class="flex items-center gap-1">
				<BookTest />
				Subject
			</div>
			<div class="flex items-center gap-1">
				<Archive />
				<ResourcesPopover
					resources={data.resources}
					onAddResource={handleAddResource}
					onRemoveResource={handleRemoveResource}
				/>
			</div>
		</div>
	</div>

	<!-- Edit Button -->
	<div class="absolute top-4 right-4">
		{#if editMode}
			<div class="flex gap-2">
				<Button
					size="sm"
					variant="default"
					onclick={saveChanges}
					class="bg-green-600 px-4 font-medium text-white hover:bg-green-700"
				>
					<Check class="mr-2 h-4 w-4" />
					Save
				</Button>
				<Button
					size="sm"
					variant="outline"
					onclick={cancelChanges}
					class="bg-white px-4 font-medium text-gray-700 hover:bg-gray-50"
				>
					<X class="mr-2 h-4 w-4" />
					Cancel
				</Button>
			</div>
		{:else}
			<Button
				size="default"
				variant="secondary"
				onclick={() => (editMode = true)}
				class="px-6 py-2 font-medium shadow-lg"
			>
				<Edit class="mr-2 h-4 w-4" />
				Edit
			</Button>
		{/if}
	</div>
</div>

<div class="mx-auto max-w-6xl space-y-12 px-6">
	<!-- Description Section -->
	{#if data.courseMapItem.description || editMode}
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold">Description</h2>
			{#if editMode}
				<Textarea
					bind:value={editedDescription}
					placeholder="Enter course description..."
					class="min-h-[100px] resize-y"
				/>
			{:else}
				<p class="text-muted-foreground leading-relaxed">{data.courseMapItem.description}</p>
			{/if}
		</div>
	{/if}

	<!-- Curriculum Learning Areas -->
	{#if data.learningAreas.length > 0 || data.availableLearningAreas.length > 0}
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-semibold">Curriculum Learning Areas</h2>
				{#if data.availableLearningAreas.length > 0}
					{@const unassignedLearningAreas = data.availableLearningAreas.filter(
						(available) =>
							!(editMode ? editedLearningAreas : data.learningAreas).some(
								(assigned) => assigned.id === available.id
							)
					)}
					{#if unassignedLearningAreas.length > 0}
						<Sheet>
							<SheetTrigger>
								<Button variant="outline" size="sm" class="gap-2">
									<Plus />
									Learning Area
								</Button>
							</SheetTrigger>
							<SheetContent class="w-[400px] max-w-[90vw] p-6">
								<SheetHeader class="mb-6 space-y-2">
									<SheetTitle>Add Learning Area</SheetTitle>
									<p class="text-muted-foreground text-sm">
										Select a learning area to associate with this course map item.
									</p>
								</SheetHeader>

								<div class="space-y-4">
									{#each unassignedLearningAreas as learningArea}
										{#if editMode}
											<div
												class="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
											>
												<div class="flex-1">
													<h4 class="text-sm font-medium">{learningArea.name}</h4>
												</div>
												<Button
													type="button"
													size="sm"
													variant="outline"
													onclick={() => {
														// Add to local state in edit mode
														editedLearningAreas = [...editedLearningAreas, learningArea];
													}}
												>
													Add
												</Button>
											</div>
										{:else}
											<form
												method="POST"
												action="?/addLearningArea"
												use:enhance={() => {
													return async ({ result, update }) => {
														if (result.type === 'success') {
															invalidateAll();
														}
														await update();
													};
												}}
											>
												<input type="hidden" name="learningAreaId" value={learningArea.id} />
												<div
													class="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
												>
													<div class="flex-1">
														<h4 class="text-sm font-medium">{learningArea.name}</h4>
													</div>
													<Button type="submit" size="sm" variant="outline">Add</Button>
												</div>
											</form>
										{/if}
									{/each}
								</div>
							</SheetContent>
						</Sheet>
					{/if}
				{/if}
			</div>

			{#if data.learningAreas.length > 0 || editedLearningAreas.length > 0}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each editMode ? editedLearningAreas : data.learningAreas as la}
						<VcaaLearningAreaCard
							learningAreaName={la.name}
							{editMode}
							onRemove={editMode ? () => removeLearningAreaLocally(la.id) : undefined}
						/>
					{/each}
				</div>
			{:else}
				<div class="py-8 text-center">
					<p class="text-muted-foreground">No learning areas assigned yet.</p>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Lesson Plans Section -->
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<h2 class="text-2xl font-semibold">Lesson Plans</h2>
			<Sheet bind:open={lessonPlanDrawerOpen}>
				<SheetTrigger>
					<Button variant="outline" class="gap-2">
						<Plus />
						Lesson Plan
					</Button>
				</SheetTrigger>
				<SheetContent class="w-[600px] max-w-[90vw] space-y-4 p-6">
					<SheetHeader class="space-y-2">
						<div class="flex items-center gap-2">
							<div class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
								<Sparkles class="text-primary h-4 w-4" />
							</div>
							<SheetTitle>Create Lesson Plan</SheetTitle>
						</div>
						<p class="text-muted-foreground text-sm">
							Describe what you want this lesson plan to cover and AI will generate a structured
							plan for you.
						</p>
					</SheetHeader>

					{#if generatedLessonPlan}
						<div
							class="from-primary/5 to-primary/10 border-primary/20 space-y-3 rounded-lg border bg-gradient-to-br p-4"
						>
							<div class="mb-2 flex items-center gap-2">
								<div class="bg-primary/20 flex h-6 w-6 items-center justify-center rounded">
									<Sparkles class="text-primary h-3 w-3" />
								</div>
								<h4 class="text-sm font-semibold">Generated Lesson Plan Summary</h4>
							</div>

							<div class="space-y-3">
								<div class="rounded-lg border bg-white/50 p-3">
									<h5 class="mb-2 text-sm font-medium">{generatedLessonPlan.name}</h5>
									<p class="text-muted-foreground text-sm">{generatedLessonPlan.summary}</p>
								</div>

								<div class="text-muted-foreground text-xs">
									This is a preview of your lesson plan. If you like it, click "Create Lesson Plan"
									to see the complete details and create it.
								</div>

								<div class="flex w-full gap-2">
									<Button
										type="button"
										size="sm"
										class="flex-1"
										disabled={isCreatingLessonPlan}
										onclick={() => {
											// Prevent multiple clicks
											if (isCreatingLessonPlan) return;

											// Generate full lesson plan
											const createForm = new FormData();
											createForm.set('planData', JSON.stringify(generatedLessonPlan));
											if (form?.imageBase64) {
												createForm.set('imageBase64', form.imageBase64);
											}

											isCreatingLessonPlan = true;
											fetch('?/createLessonPlan', {
												method: 'POST',
												body: createForm
											})
												.then(async (response) => {
													const result = await response.json();
													if (result.type === 'success') {
														lessonPlanDrawerOpen = false;
														lessonPlanDescription = '';
														generatedLessonPlan = null;
														currentLessonInstruction = '';
														invalidateAll();
													}
													isCreatingLessonPlan = false;
												})
												.catch(() => {
													isCreatingLessonPlan = false;
												});
										}}
									>
										{#if isCreatingLessonPlan}
											<RefreshCw class="mr-1 h-3 w-3 animate-spin" />
											Creating...
										{:else}
											Create Lesson Plan
										{/if}
									</Button>
									<Button
										type="button"
										size="sm"
										variant="outline"
										disabled={isGeneratingLesson}
										onclick={() => {
											// Prevent multiple clicks
											if (isGeneratingLesson) return;

											// Regenerate with the same instruction
											isGeneratingLesson = true;
											const formData = new FormData();
											formData.set('instruction', currentLessonInstruction);

											fetch('?/generateLessonPlanResponse', {
												method: 'POST',
												body: formData
											})
												.then(async (response) => {
													const result = await response.json();
													if (result.type === 'success' && result.data) {
														generatedLessonPlan = result.data.planData;
													}
													isGeneratingLesson = false;
												})
												.catch(() => {
													isGeneratingLesson = false;
												});
										}}
									>
										{#if isGeneratingLesson}
											<RefreshCw class="mr-1 h-3 w-3 animate-spin" />
											Regenerating...
										{:else}
											Regenerate
										{/if}
									</Button>
								</div>
							</div>
						</div>
					{/if}

					<form
						method="POST"
						action="?/generateLessonPlanResponse"
						use:enhance={() => {
							isGeneratingLesson = true;
							return async ({ result, update }) => {
								isGeneratingLesson = false;
								if (result.type === 'success' && result.data) {
									generatedLessonPlan = result.data.planData;
									currentLessonInstruction =
										(result.data.instruction as string) || lessonPlanDescription;
								}
								await update();
							};
						}}
						class="space-y-3"
					>
						<div class="space-y-2">
							<div class="space-y-2">
								<Label for="lesson-description" class="text-sm font-medium">
									{#if generatedLessonPlan}
										Describe a different lesson idea:
									{:else}
										What should this lesson plan cover?
									{/if}
								</Label>
								<Textarea
									id="lesson-description"
									name="instruction"
									bind:value={lessonPlanDescription}
									placeholder={generatedLessonPlan
										? 'Describe a different lesson plan...'
										: "E.g., 'Introduction to photosynthesis with hands-on plant experiments for year 7 students' or 'Creative writing workshop focusing on character development using short story techniques'"}
									class={generatedLessonPlan
										? 'min-h-[40px] resize-y'
										: 'min-h-[120px] resize-none'}
									required
								/>
								{#if !generatedLessonPlan}
									<p class="text-muted-foreground text-xs">
										Be specific about the topic, activities, and any particular learning objectives
										you want to include.
									</p>
								{/if}
							</div>
						</div>

						<div class="flex gap-3">
							{#if generatedLessonPlan}
								<Button
									type="submit"
									disabled={isGeneratingLesson || !lessonPlanDescription.trim()}
									class="flex-1 gap-2"
									onclick={() => {
										// Clear current plan to regenerate with new description
										generatedLessonPlan = null;
									}}
								>
									{#if isGeneratingLesson}
										<RefreshCw class="h-4 w-4 animate-spin" />
										Generating New Plan...
									{:else}
										<Sparkles />
										Generate Different Plan
									{/if}
								</Button>
								<Button type="button" variant="outline">Manual</Button>
							{:else}
								<Button
									type="submit"
									disabled={isGeneratingLesson || !lessonPlanDescription.trim()}
									class="flex-1 gap-2"
								>
									{#if isGeneratingLesson}
										<RefreshCw class="h-4 w-4 animate-spin" />
										Generating Summary...
									{:else}
										<Sparkles />
										Generate Summary with AI
									{/if}
								</Button>
								<Button type="button" variant="outline">Manual</Button>
							{/if}
						</div>

						{#if form?.message}
							<div class="bg-destructive/10 border-destructive/20 rounded-lg border p-3">
								<p class="text-destructive text-sm">{form.message}</p>
							</div>
						{/if}
					</form>
				</SheetContent>
			</Sheet>
		</div>

		{#if data.lessonPlans.length > 0}
			<div class="flex flex-wrap justify-start gap-4">
				{#each data.lessonPlans as plan}
					<LessonPlanCard lessonPlan={plan} href={`${page.url.pathname}/lesson-plans/${plan.id}`} />
				{/each}
			</div>
		{:else}
			<div class="py-12 text-center">
				<svg
					class="text-muted-foreground mx-auto mb-4 h-12 w-12"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				<p class="text-muted-foreground">No lesson plans yet. Create your first one!</p>
			</div>
		{/if}
	</div>

	<!-- Assessment Plans Section -->
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<h2 class="text-2xl font-semibold">Assessment Plans</h2>
			<Sheet bind:open={assessmentPlanDrawerOpen}>
				<SheetTrigger>
					<Button variant="outline" class="gap-2">
						<Plus />
						Assessment Plan
					</Button>
				</SheetTrigger>
				<SheetContent class="w-[600px] max-w-[90vw] space-y-4 p-6">
					<SheetHeader class="space-y-2">
						<div class="flex items-center gap-2">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
								<Sparkles class="h-4 w-4 text-orange-600" />
							</div>
							<SheetTitle>Create Assessment Plan</SheetTitle>
						</div>
						<p class="text-muted-foreground text-sm">
							Describe what you want this assessment plan to cover and AI will generate a structured
							plan with rubric for you.
						</p>
					</SheetHeader>

					{#if generatedAssessmentPlan}
						<div
							class="space-y-3 rounded-lg border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-orange-600/10 p-4"
						>
							<div class="mb-2 flex items-center gap-2">
								<div class="flex h-6 w-6 items-center justify-center rounded bg-orange-500/20">
									<Sparkles class="h-3 w-3 text-orange-600" />
								</div>
								<h4 class="text-sm font-semibold">Generated Assessment Plan Summary</h4>
							</div>

							<div class="space-y-3">
								<div class="rounded-lg border bg-white/50 p-3">
									<h5 class="mb-2 text-sm font-medium">{generatedAssessmentPlan.name}</h5>
									<p class="text-muted-foreground text-sm">{generatedAssessmentPlan.summary}</p>
								</div>

								<div class="text-muted-foreground text-xs">
									This is a preview of your assessment plan. If you like it, click "Create
									Assessment Plan" to see the complete details and create it.
								</div>

								<div class="flex w-full gap-2">
									<Button
										type="button"
										size="sm"
										class="flex-1"
										disabled={isCreatingAssessmentPlan}
										onclick={() => {
											// Prevent multiple clicks
											if (isCreatingAssessmentPlan) return;

											// Generate full assessment plan
											const createForm = new FormData();
											createForm.set('planData', JSON.stringify(generatedAssessmentPlan));
											if (form?.imageBase64) {
												createForm.set('imageBase64', form.imageBase64);
											}

											isCreatingAssessmentPlan = true;
											fetch('?/createAssessmentPlan', {
												method: 'POST',
												body: createForm
											})
												.then(async (response) => {
													const result = await response.json();
													if (result.type === 'success') {
														assessmentPlanDrawerOpen = false;
														assessmentPlanDescription = '';
														generatedAssessmentPlan = null;
														currentAssessmentInstruction = '';
														invalidateAll();
													}
													isCreatingAssessmentPlan = false;
												})
												.catch(() => {
													isCreatingAssessmentPlan = false;
												});
										}}
									>
										{#if isCreatingAssessmentPlan}
											<RefreshCw class="mr-1 h-3 w-3 animate-spin" />
											Creating...
										{:else}
											Create Assessment Plan
										{/if}
									</Button>
									<Button
										type="button"
										size="sm"
										variant="outline"
										disabled={isGeneratingAssessment}
										onclick={() => {
											// Prevent multiple clicks
											if (isGeneratingAssessment) return;

											// Regenerate with the same instruction
											isGeneratingAssessment = true;
											const formData = new FormData();
											formData.set('instruction', currentAssessmentInstruction);

											fetch('?/generateAssessmentPlanResponse', {
												method: 'POST',
												body: formData
											})
												.then(async (response) => {
													const result = await response.json();
													if (result.type === 'success' && result.data) {
														generatedAssessmentPlan = result.data.planData;
													}
													isGeneratingAssessment = false;
												})
												.catch(() => {
													isGeneratingAssessment = false;
												});
										}}
									>
										{#if isGeneratingAssessment}
											<RefreshCw class="mr-1 h-3 w-3 animate-spin" />
											Regenerating...
										{:else}
											Regenerate
										{/if}
									</Button>
								</div>
							</div>
						</div>
					{/if}

					<form
						method="POST"
						action="?/generateAssessmentPlanResponse"
						use:enhance={() => {
							isGeneratingAssessment = true;
							return async ({ result, update }) => {
								isGeneratingAssessment = false;
								if (result.type === 'success' && result.data) {
									generatedAssessmentPlan = result.data.planData;
									currentAssessmentInstruction =
										(result.data.instruction as string) || assessmentPlanDescription;
								}
								await update();
							};
						}}
						class="space-y-3"
					>
						<div class="space-y-2">
							<div class="space-y-2">
								<Label for="assessment-description" class="text-sm font-medium">
									{#if generatedAssessmentPlan}
										Describe a different assessment idea:
									{:else}
										What should this assessment plan cover?
									{/if}
								</Label>
								<Textarea
									id="assessment-description"
									name="instruction"
									bind:value={assessmentPlanDescription}
									placeholder={generatedAssessmentPlan
										? 'Describe a different assessment plan...'
										: "E.g., 'Research project on renewable energy with practical experiment and presentation for year 8 students' or 'Creative writing portfolio with peer review and self-reflection components'"}
									class={generatedAssessmentPlan
										? 'min-h-[40px] resize-y'
										: 'min-h-[120px] resize-none'}
									required
								/>
								{#if !generatedAssessmentPlan}
									<p class="text-muted-foreground text-xs">
										Be specific about the assessment type, topic, and any particular evaluation
										criteria you want to include.
									</p>
								{/if}
							</div>
						</div>

						<div class="flex gap-3">
							{#if generatedAssessmentPlan}
								<Button
									type="submit"
									disabled={isGeneratingAssessment || !assessmentPlanDescription.trim()}
									class="flex-1 gap-2"
									onclick={() => {
										// Clear current plan to regenerate with new description
										generatedAssessmentPlan = null;
									}}
								>
									{#if isGeneratingAssessment}
										<RefreshCw class="h-4 w-4 animate-spin" />
										Generating New Plan...
									{:else}
										<Sparkles />
										Generate Different Plan
									{/if}
								</Button>
								<Button type="button" variant="outline">Manual</Button>
							{:else}
								<Button
									type="submit"
									disabled={isGeneratingAssessment || !assessmentPlanDescription.trim()}
									class="flex-1 gap-2"
								>
									{#if isGeneratingAssessment}
										<RefreshCw class="h-4 w-4 animate-spin" />
										Generating Summary...
									{:else}
										<Sparkles />
										Generate Summary with AI
									{/if}
								</Button>
								<Button type="button" variant="outline">Manual</Button>
							{/if}
						</div>

						{#if form?.message}
							<div class="bg-destructive/10 border-destructive/20 rounded-lg border p-3">
								<p class="text-destructive text-sm">{form.message}</p>
							</div>
						{/if}
					</form>
				</SheetContent>
			</Sheet>
		</div>

		{#if data.assessmentPlans.length > 0}
			<div class="flex flex-wrap justify-start gap-4">
				{#each data.assessmentPlans as plan}
					<AssessmentPlanCard
						assessmentPlan={plan}
						href={`${page.url.pathname}/assessment-plans/${plan.id}`}
					/>
				{/each}
			</div>
		{:else}
			<div class="py-12 text-center">
				<svg
					class="text-muted-foreground mx-auto mb-4 h-12 w-12"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
					/>
				</svg>
				<p class="text-muted-foreground">No assessment plans yet. Create your first one!</p>
			</div>
		{/if}
	</div>
</div>

<!-- Resource File Input -->
<ResourceFileInput
	bind:this={resourceFileInput}
	courseMapItemId={data.courseMapItem.id}
	onResourceAdded={handleResourceAdded}
/>
