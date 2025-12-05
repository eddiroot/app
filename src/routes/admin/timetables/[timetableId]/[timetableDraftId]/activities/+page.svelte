<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select/index.js';
	import { convertToFullName, yearLevelToLabel } from '$lib/utils';
	import { EditIcon, InfoIcon, PlusIcon, Trash2Icon } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { createActivitySchema, deleteActivitySchema, editActivitySchema } from './schema.js';

	let { data } = $props();

	let infoDialogOpen = $state(false);
	let createActivityDialogOpen = $state(false);
	let editActivityDialogOpen = $state(false);
	let selectedSubjectForActivity = $state<number | null>(null);

	let selectedYearLevel = $state(data.defaultYearLevel);

	// Create form
	const createForm = superForm(data.createActivityForm, {
		validators: zod4(createActivitySchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				createActivityDialogOpen = false;
				invalidateAll();
			}
		}
	});

	const { form: createFormData, enhance: createEnhance } = createForm;

	// Local state for Select components that need string arrays
	let createGroupIds = $state<string[]>([]);
	let createLocationIds = $state<string[]>([]);

	// Edit form
	const editForm = superForm(data.editActivityForm, {
		validators: zod4(editActivitySchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				editActivityDialogOpen = false;
				invalidateAll();
			}
		}
	});

	const { form: editFormData, enhance: editEnhance } = editForm;

	// Local state for Select components that need string arrays (edit form)
	let editGroupIds = $state<string[]>([]);
	let editLocationIds = $state<string[]>([]);

	// For create form - Fix the effects with untrack
	$effect(() => {
		// Only sync TO local state when form data changes externally
		const formGroupIds = untrack(() => $createFormData.groupIds ?? []);
		createGroupIds = formGroupIds.map((id) => id.toString());
	});

	$effect(() => {
		const formLocationIds = untrack(() => $createFormData.locationIds ?? []);
		createLocationIds = formLocationIds.map((id) => id.toString());
	});

	$effect(() => {
		// Only sync TO form data when local state changes from UI
		const localGroupIds = untrack(() => createGroupIds);
		$createFormData.groupIds = localGroupIds.map((id) => parseInt(id));
	});

	$effect(() => {
		const localLocationIds = untrack(() => createLocationIds);
		$createFormData.locationIds = localLocationIds.map((id) => parseInt(id));
	});

	// Apply the same pattern to edit form effects
	$effect(() => {
		const formGroupIds = untrack(() => $editFormData.groupIds ?? []);
		editGroupIds = formGroupIds.map((id) => id.toString());
	});

	$effect(() => {
		const formLocationIds = untrack(() => $editFormData.locationIds ?? []);
		editLocationIds = formLocationIds.map((id) => id.toString());
	});

	$effect(() => {
		const localGroupIds = untrack(() => editGroupIds);
		$editFormData.groupIds = localGroupIds.map((id) => parseInt(id));
	});

	$effect(() => {
		const localLocationIds = untrack(() => editLocationIds);
		$editFormData.locationIds = localLocationIds.map((id) => parseInt(id));
	});

	const deleteForm = superForm(data.deleteActivityForm, {
		validators: zod4(deleteActivitySchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				invalidateAll();
			}
		}
	});

	const { form: deleteFormData, enhance: deleteEnhance } = deleteForm;

	const teacherOptions = data.teachers.map((teacher) => ({
		value: teacher.id,
		label: convertToFullName(teacher.firstName, teacher.middleName, teacher.lastName)
	}));

	let currentSubjectOfferings = $derived(data.subjectOfferingsByYearLevel[selectedYearLevel] || []);

	function updateActivitiesForYearLevel(yearLevel: string) {
		selectedYearLevel = yearLevel as any;
	}

	function handleEditActivity(id: number) {
		// Find the activity to edit
		const activity = Object.values(data.activitiesBySubjectOfferingId)
			.flat()
			.find((a) => a.id === id);

		if (activity) {
			$editFormData.activityId = activity.id;
			$editFormData.subjectOfferingId = activity.subjectOfferingId;
			$editFormData.teacherIds = activity.teacherIds;
			$editFormData.numInstancesPerWeek = activity.totalPeriods / activity.periodsPerInstance;
			$editFormData.periodsPerInstance = activity.periodsPerInstance;
			$editFormData.yearLevels = activity.yearLevels;
			$editFormData.groupIds = activity.groupIds;
			$editFormData.studentIds = activity.studentIds;
			$editFormData.locationIds = activity.locationIds;
			editActivityDialogOpen = true;
		}
	}

	function handleDeleteActivity(id: number) {
		$deleteFormData.activityId = id;
		// Use setTimeout to ensure the form data is updated before submitting
		setTimeout(() => {
			const form = document.getElementById('delete-activity-form') as HTMLFormElement;
			if (form) {
				form.requestSubmit();
			}
		}, 0);
	}

	function openCreateActivityDialog(subjectOfferingId: number) {
		selectedSubjectForActivity = subjectOfferingId;
		$createFormData.subjectOfferingId = subjectOfferingId;
		$createFormData.teacherIds = [];
		$createFormData.numInstancesPerWeek = 1;
		$createFormData.periodsPerInstance = 1;
		$createFormData.yearLevels = [];
		$createFormData.groupIds = [];
		$createFormData.studentIds = [];
		$createFormData.locationIds = [];
		createActivityDialogOpen = true;
	}

	const yearLevelOptions = data.yearLevels.map((yearLevel) => ({
		value: yearLevel,
		label: yearLevelToLabel(yearLevel)
	}));

	const groupOptions = data.groups.map((group) => ({
		value: group.id.toString(),
		label: `${group.name} (${yearLevelToLabel(group.yearLevel)})`
	}));

	const studentOptions = data.students.map((student) => ({
		value: student.id,
		label: `${convertToFullName(student.firstName, student.middleName, student.lastName)} (${yearLevelToLabel(student.yearLevel)})`
	}));

	const spaceOptions = data.spaces.map((space) => ({
		value: space.id.toString(),
		label: space.name
	}));
</script>

<div class="mb-4 flex items-start justify-between">
	<div></div>
	<div class="flex gap-2">
		<Button
			type="button"
			variant="outline"
			size="icon"
			onclick={() => (infoDialogOpen = true)}
			class="ml-auto"
		>
			<InfoIcon class="h-4 w-4" />
		</Button>
	</div>
</div>
<h1 class="mb-4 text-3xl font-bold">Timetable Activities</h1>
<h2 class="mb-4 text-2xl font-bold">Subject Activities</h2>

<!-- Year Level Navigator -->
<Select.Root
	type="single"
	onValueChange={updateActivitiesForYearLevel}
	bind:value={selectedYearLevel}
>
	<Select.Trigger class="w-full">
		{#if selectedYearLevel}
			{yearLevelToLabel(selectedYearLevel)}
		{:else}
			Select year level...
		{/if}
	</Select.Trigger>
	<Select.Content>
		{#each data.yearLevels as yearLevel}
			<Select.Item value={yearLevel}>
				{yearLevelToLabel(yearLevel)}
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>

<div class="h-4"></div>

{#if currentSubjectOfferings.length === 0}
	<Card class="p-8 text-center">
		<h3 class="mb-2 text-lg font-semibold">No Subjects Found</h3>
		<p class="text-muted-foreground">
			No subjects are available for {yearLevelToLabel(selectedYearLevel)}. Please add subjects for
			this year level before creating activities.
		</p>
	</Card>
{:else}
	<input type="hidden" name="yearLevel" value={selectedYearLevel} />
	<div class="mb-8 space-y-4">
		<Accordion.Root type="single" class="w-full">
			{#each currentSubjectOfferings as subjectAndOffering, index}
				<Accordion.Item value="subject-{subjectAndOffering.subjectOffering.id}">
					<Accordion.Trigger class="w-full">
						<div class="flex w-full items-center justify-between">
							<div class="flex items-center gap-4">
								<h3 class="text-lg font-semibold">{subjectAndOffering.subject.name}</h3>
								{#if data.activitiesBySubjectOfferingId[subjectAndOffering.subjectOffering.id]?.length > 0}
									<Badge variant="outline" class="text-xs">
										{data.activitiesBySubjectOfferingId[subjectAndOffering.subjectOffering.id]
											?.length} activities
									</Badge>
								{/if}
							</div>
						</div>
					</Accordion.Trigger>

					<Accordion.Content>
						{#if data.activitiesBySubjectOfferingId[subjectAndOffering.subjectOffering.id]?.length > 0}
							<div class="mb-4">
								<h4 class="mb-3 font-medium">Existing Activities</h4>
								<div class="grid gap-3">
									{#each data.activitiesBySubjectOfferingId[subjectAndOffering.subjectOffering.id] as activity}
										<div class="bg-background rounded-lg border p-4">
											<div class="mb-3 flex items-start justify-between">
												<div class="flex-1">
													<div class="mb-2 flex items-center gap-3">
														<span class="font-medium">Activity #{activity.id}</span>
														<Badge variant="secondary" class="text-xs">
															{activity.periodsPerInstance} periods/instance
														</Badge>
														<Badge variant="secondary" class="text-xs">
															{activity.totalPeriods} total periods
														</Badge>
													</div>

													<!-- Teachers -->
													{#if activity.teacherIds.length > 0}
														<div class="mb-2 flex items-start gap-2">
															<span class="text-muted-foreground text-sm font-medium">
																Teachers:
															</span>
															<div class="flex flex-wrap gap-1">
																{#each activity.teacherIds as teacherId}
																	{@const teacher = data.teachers.find((t) => t.id === teacherId)}
																	{#if teacher}
																		<Badge variant="outline" class="text-xs">
																			{convertToFullName(
																				teacher.firstName,
																				teacher.middleName,
																				teacher.lastName
																			)}
																		</Badge>
																	{/if}
																{/each}
															</div>
														</div>
													{/if}

													<!-- Assigned Year Levels -->
													{#if activity.yearLevels.length > 0}
														<div class="mb-2 flex items-start gap-2">
															<span class="text-muted-foreground text-sm font-medium">
																Year Levels:
															</span>
															<div class="flex flex-wrap gap-1">
																{#each activity.yearLevels as yearLevel}
																	<Badge variant="outline" class="text-xs">
																		{yearLevelToLabel(yearLevel)}
																	</Badge>
																{/each}
															</div>
														</div>
													{/if}

													<!-- Assigned Groups -->
													{#if activity.groupIds.length > 0}
														<div class="mb-2 flex items-start gap-2">
															<span class="text-muted-foreground text-sm font-medium">
																Groups:
															</span>
															<div class="flex flex-wrap gap-1">
																{#each activity.groupIds as groupId}
																	{@const group = data.groups.find((g) => g.id === groupId)}
																	{#if group}
																		<Badge variant="outline" class="text-xs">
																			{group.name}
																		</Badge>
																	{/if}
																{/each}
															</div>
														</div>
													{/if}

													<!-- Assigned Students -->
													{#if activity.studentIds.length > 0}
														<div class="mb-2 flex items-start gap-2">
															<span class="text-muted-foreground text-sm font-medium">
																Students:
															</span>
															<div class="flex flex-wrap gap-1">
																{#each activity.studentIds as studentId}
																	{@const student = data.students.find((s) => s.id === studentId)}
																	{#if student}
																		<Badge variant="outline" class="text-xs">
																			{convertToFullName(
																				student.firstName,
																				student.middleName,
																				student.lastName
																			)}
																		</Badge>
																	{/if}
																{/each}
															</div>
														</div>
													{/if}

													<!-- Preferred Locations -->
													{#if activity.locationIds.length > 0}
														<div class="flex items-start gap-2">
															<span class="text-muted-foreground text-sm font-medium">
																Preferred Rooms:
															</span>
															<div class="flex flex-wrap gap-1">
																{#each activity.locationIds as locationId}
																	{@const space = data.spaces.find((s) => s.id === locationId)}
																	{#if space}
																		<Badge variant="outline" class="text-xs">
																			{space.name}
																		</Badge>
																	{/if}
																{/each}
															</div>
														</div>
													{/if}
												</div>

												<!-- Action Buttons -->

												<div class="flex gap-1">
													<Button
														variant="ghost"
														size="sm"
														onclick={() => handleEditActivity(activity.id)}
													>
														<EditIcon class="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onclick={() => handleDeleteActivity(activity.id)}
													>
														<Trash2Icon class="h-4 w-4" />
													</Button>
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Create Activity Button -->
						<div class="mt-4">
							<Button
								type="button"
								onclick={() => openCreateActivityDialog(subjectAndOffering.subjectOffering.id)}
							>
								<PlusIcon class="mr-2 h-4 w-4" />
								Create Activity
							</Button>
						</div>
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	</div>
{/if}

<h2 class="mb-4 text-2xl font-bold">Special Activities</h2>

<!-- Hidden Delete Form -->
<form
	id="delete-activity-form"
	method="POST"
	action="?/deleteActivity"
	use:deleteEnhance
	class="hidden"
>
	<input type="hidden" name="activityId" bind:value={$deleteFormData.activityId} />
</form>

<!-- Create Activity Dialog -->
<Dialog.Root bind:open={createActivityDialogOpen}>
	<Dialog.Content class="overflow-y-auto sm:max-h-[90vh] sm:max-w-[800px]">
		<Dialog.Header>
			<Dialog.Title>Create New Activity</Dialog.Title>
			<Dialog.Description>Configure the activity details for this subject.</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/createActivity" use:createEnhance>
			<input
				type="hidden"
				name="subjectOfferingId"
				bind:value={$createFormData.subjectOfferingId}
			/>
			<div class="grid gap-6 py-4">
				<!-- Teacher Selection -->
				<div class="grid gap-2">
					<Label for="activity-teacher">Teachers *</Label>
					<Select.Root type="multiple" bind:value={$createFormData.teacherIds}>
						<Select.Trigger class="w-full">
							{#if $createFormData.teacherIds?.length > 0}
								{$createFormData.teacherIds
									.map((teacherId) => {
										return teacherOptions.find((t) => t.value === teacherId)?.label || 'Unknown';
									})
									.join(', ')}
							{:else}
								Select teachers...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each teacherOptions as option}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $createFormData.teacherIds || [] as teacherId}
						<input type="hidden" name="teacherIds" value={teacherId} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Select one or more teachers to assign to this activity
					</p>
				</div>

				<!-- Instances Per Week -->
				<div class="grid gap-2">
					<Label for="instances-per-week">Instances Per Week *</Label>
					<Input
						id="instances-per-week"
						name="numInstancesPerWeek"
						type="number"
						min="1"
						max="20"
						bind:value={$createFormData.numInstancesPerWeek}
						placeholder="1"
					/>
					<p class="text-muted-foreground text-sm">How many times this activity occurs per week</p>
				</div>

				<!-- Periods Per Instance -->
				<div class="grid gap-2">
					<Label for="periods-per-instance">Periods Per Instance *</Label>
					<Input
						id="periods-per-instance"
						name="periodsPerInstance"
						type="number"
						min="1"
						max="10"
						bind:value={$createFormData.periodsPerInstance}
						placeholder="1"
					/>
					<p class="text-muted-foreground text-sm">
						How many consecutive periods for each instance
					</p>
				</div>

				<!-- Year Levels Selection -->
				<div class="grid gap-2">
					<Label for="activity-year-levels">Assign to Year Levels (Optional)</Label>
					<Select.Root type="multiple" bind:value={$createFormData.yearLevels}>
						<Select.Trigger class="w-full">
							{#if ($createFormData.yearLevels ?? []).length > 0}
								{($createFormData.yearLevels ?? [])
									.map((yearLevel) => {
										return yearLevelOptions.find((y) => y.value === yearLevel)?.label || 'Unknown';
									})
									.join(', ')}
							{:else}
								Select year levels...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each yearLevelOptions as option}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $createFormData.yearLevels || [] as yearLevel}
						<input type="hidden" name="yearLevels" value={yearLevel} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Select year levels for activities that apply to entire grade levels
					</p>
				</div>

				<!-- Groups Selection -->
				<div class="grid gap-2">
					<Label for="create-activity-groups">Assign to Groups (Optional)</Label>
					<Select.Root type="multiple" bind:value={createGroupIds}>
						<Select.Trigger class="w-full">
							{#if createGroupIds.length > 0}
								{createGroupIds
									.map((groupId) => {
										return groupOptions.find((g) => g.value === groupId)?.label || 'Unknown';
									})
									.join(', ')}
							{:else}
								Select groups...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each groupOptions as option}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $createFormData.groupIds || [] as groupId}
						<input type="hidden" name="groupIds" value={groupId} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Select groups (classes) that will participate in this activity
					</p>
				</div>
				<!-- Students Selection -->
				<div class="grid gap-2">
					<Label for="activity-students">Assign to Individual Students (Optional)</Label>
					<Select.Root type="multiple" bind:value={$createFormData.studentIds}>
						<Select.Trigger class="w-full">
							{#if ($createFormData.studentIds ?? []).length > 0}
								{($createFormData.studentIds ?? [])
									.map((studentId) => {
										return studentOptions.find((s) => s.value === studentId)?.label || 'Unknown';
									})
									.join(', ')}
							{:else}
								Select students...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each studentOptions as option}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $createFormData.studentIds || [] as studentId}
						<input type="hidden" name="studentIds" value={studentId} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Select individual students for personalized or one-on-one activities
					</p>
				</div>

				<!-- Preferred Rooms Selection -->
				<div class="grid gap-2">
					<Label for="activity-rooms">Preferred Rooms (Optional)</Label>
					<Select.Root type="multiple" bind:value={createLocationIds}>
						<Select.Trigger class="w-full">
							{#if createLocationIds.length > 0}
								{createLocationIds
									.map((roomId) => {
										return spaceOptions.find((s) => s.value === roomId)?.label || 'Unknown';
									})
									.join(', ')}
							{:else}
								Select preferred rooms...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each spaceOptions as option}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $createFormData.locationIds || [] as locationId}
						<input type="hidden" name="locationIds" value={locationId} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Optionally select preferred rooms/spaces for this activity
					</p>
				</div>
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (createActivityDialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit">Create Activity</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Activity Dialog -->
<Dialog.Root bind:open={editActivityDialogOpen}>
	<Dialog.Content class="overflow-y-auto sm:max-h-[90vh] sm:max-w-[800px]">
		<Dialog.Header>
			<Dialog.Title>Edit Activity</Dialog.Title>
			<Dialog.Description>Update the activity details.</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/editActivity" use:editEnhance>
			<input type="hidden" name="activityId" bind:value={$editFormData.activityId} />
			<input type="hidden" name="subjectOfferingId" bind:value={$editFormData.subjectOfferingId} />
			<div class="grid gap-6 py-4">
				<!-- Teacher Selection -->
				<div class="grid gap-2">
					<Label for="edit-activity-teacher">Teachers *</Label>
					<Select.Root type="multiple" bind:value={$editFormData.teacherIds}>
						<Select.Trigger class="w-full">
							{#if $editFormData.teacherIds?.length > 0}
								{$editFormData.teacherIds
									.map((teacherId) => {
										return teacherOptions.find((t) => t.value === teacherId)?.label || 'Unknown';
									})
									.join(', ')}
							{:else}
								Select teachers...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each teacherOptions as option}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $editFormData.teacherIds || [] as teacherId}
						<input type="hidden" name="teacherIds" value={teacherId} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Select one or more teachers to assign to this activity
					</p>
				</div>

				<!-- Instances Per Week -->
				<div class="grid gap-2">
					<Label for="edit-instances-per-week">Instances Per Week *</Label>
					<Input
						id="edit-instances-per-week"
						name="numInstancesPerWeek"
						type="number"
						min="1"
						max="20"
						bind:value={$editFormData.numInstancesPerWeek}
						placeholder="1"
					/>
					<p class="text-muted-foreground text-sm">How many times this activity occurs per week</p>
				</div>

				<!-- Periods Per Instance -->
				<div class="grid gap-2">
					<Label for="edit-periods-per-instance">Periods Per Instance *</Label>
					<Input
						id="edit-periods-per-instance"
						name="periodsPerInstance"
						type="number"
						min="1"
						max="10"
						bind:value={$editFormData.periodsPerInstance}
						placeholder="1"
					/>
					<p class="text-muted-foreground text-sm">
						How many consecutive periods for each instance
					</p>
				</div>

				<!-- Year Levels Selection -->
				<div class="grid gap-2">
					<Label for="edit-activity-year-levels">Assign to Year Levels (Optional)</Label>
					<Select.Root type="multiple" bind:value={$editFormData.yearLevels}>
						<Select.Trigger class="w-full">
							{#if ($editFormData.yearLevels ?? []).length > 0}
								{($editFormData.yearLevels ?? [])
									.map((yearLevel) => {
										return yearLevelOptions.find((y) => y.value === yearLevel)?.label || 'Unknown';
									})
									.join(', ')}
							{:else}
								Select year levels...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each yearLevelOptions as option}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $editFormData.yearLevels || [] as yearLevel}
						<input type="hidden" name="yearLevels" value={yearLevel} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Select year levels for activities that apply to entire grade levels
					</p>
				</div>

				<!-- Groups Selection -->
				<div class="grid gap-2">
					<Label for="edit-activity-groups">Assign to Groups (Optional)</Label>
					<Select.Root type="multiple" bind:value={editGroupIds}>
						<Select.Trigger class="w-full">
							{#if editGroupIds.length > 0}
								{editGroupIds
									.map((groupId) => {
										return groupOptions.find((g) => g.value === groupId)?.label || 'Unknown';
									})
									.join(', ')}
							{:else}
								Select groups...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each groupOptions as option}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $editFormData.groupIds || [] as groupId}
						<input type="hidden" name="groupIds" value={groupId} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Select groups (classes) that will participate in this activity
					</p>
				</div>

				<!-- Students Selection -->
				<div class="grid gap-2">
					<Label for="edit-activity-students">Assign to Individual Students (Optional)</Label>
					<Select.Root type="multiple" bind:value={$editFormData.studentIds}>
						<Select.Trigger class="w-full">
							{#if ($editFormData.studentIds ?? []).length > 0}
								{($editFormData.studentIds ?? [])
									.map((studentId) => {
										return studentOptions.find((s) => s.value === studentId)?.label || 'Unknown';
									})
									.join(', ')}
							{:else}
								Select students...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each studentOptions as option}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $editFormData.studentIds || [] as studentId}
						<input type="hidden" name="studentIds" value={studentId} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Select individual students for personalized or one-on-one activities
					</p>
				</div>

				<!-- Preferred Rooms Selection -->
				<div class="grid gap-2">
					<Label for="edit-activity-rooms">Preferred Rooms (Optional)</Label>
					<Select.Root type="multiple" bind:value={editLocationIds}>
						<Select.Trigger class="w-full">
							{#if editLocationIds.length > 0}
								{editLocationIds
									.map((roomId) => {
										return spaceOptions.find((s) => s.value === roomId)?.label || 'Unknown';
									})
									.join(', ')}
							{:else}
								Select preferred rooms...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each spaceOptions as option}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $editFormData.locationIds || [] as locationId}
						<input type="hidden" name="locationIds" value={locationId} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Optionally select preferred rooms/spaces for this activity
					</p>
				</div>
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (editActivityDialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit">Update Activity</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Page Information Dialog -->
<Dialog.Root bind:open={infoDialogOpen}>
	<Dialog.Content class="sm:max-h-[1000px] sm:max-w-[1000px]">
		<Dialog.Header>
			<Dialog.Title>Page Information</Dialog.Title>
			<Dialog.Description>
				Important information about managing students and groups in this timetable:
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="page-info">Information</Label>
				<p
					class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[200px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					placeholder="Type important information about this page here..."
				>
					Important NOTE: When you assign an activity to a Year or Group, FET automatically assigns
					it to ALL subgroups within that Year or Group. Assign to YEAR when: ✅ All students in the
					year attend (assembly, exams, grade-level events) ✅ No student differentiation needed
					Assign to GROUP when: ✅ This is a specific class/course that particular students enrolled
					in ✅ Most common use case for subject classes ✅ Examples: homeroom classes, elective
					courses Assign to SUBGROUP when: ✅ You need to split a group further (lab sections,
					tutoring groups) ✅ Individual student tracking (when each student is a subgroup) ✅ Most
					granular level of control Subgroups with too few hours (less than 20/week) = probably
					missing activities
				</p>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
