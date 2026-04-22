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
	import { yearLevelEnum } from '$lib/enums.js';
	import { convertToFullName } from '$lib/utils';
	import InfoIcon from '@lucide/svelte/icons/info';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import {
		createActivitySchema,
		deleteActivitySchema,
		editActivitySchema,
	} from './schema.js';

	let { data } = $props();

	let createActivityDialogOpen = $state(false);
	let editActivityDialogOpen = $state(false);
	let infoDialogOpen = $state(false);
	let getYearLevelZeroIndexCode = () =>
		data.yearLevels[0]?.code || yearLevelEnum.year7;
	let selectedYearLevel = $state(getYearLevelZeroIndexCode());

	let dataCreateActivityForm = () => data.createActivityForm;
	const createForm = superForm(dataCreateActivityForm(), {
		validators: zod4(createActivitySchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				createActivityDialogOpen = false;
				invalidateAll();
			}
		},
	});
	const { form: createFormData, enhance: createEnhance } = createForm;

	let dataEditActivityForm = () => data.editActivityForm;
	const editForm = superForm(dataEditActivityForm(), {
		validators: zod4(editActivitySchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				editActivityDialogOpen = false;
				invalidateAll();
			}
		},
	});
	const { form: editFormData, enhance: editEnhance } = editForm;

	let dataDeleteActivityForm = () => data.deleteActivityForm;
	const deleteForm = superForm(dataDeleteActivityForm(), {
		validators: zod4(deleteActivitySchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				invalidateAll();
			}
		},
	});
	const { form: deleteFormData, enhance: deleteEnhance } = deleteForm;

	let dataTeachers = () => data.teachers;
	const teacherOptions = dataTeachers().map((teacher) => ({
		value: teacher.id,
		label: convertToFullName(
			teacher.firstName,
			teacher.middleName,
			teacher.lastName,
		),
	}));

	let currentSubjectOfferings = $derived(
		data.subjectOfferingsByYearLevel[selectedYearLevel] || [],
	);

	function updateActivitiesForYearLevel(yearLevel: string) {
		selectedYearLevel = yearLevel as yearLevelEnum;
	}

	function handleEditActivity(id: number) {
		const activity = Object.values(data.activitiesBySubjectOfferingId)
			.flat()
			.find((a) => a.id === id);

		if (activity) {
			$editFormData.activityId = activity.id;
			$editFormData.subjectOfferingId = activity.subjectOfferingId;
			$editFormData.teacherIds = activity.teacherIds;
			$editFormData.numInstancesPerWeek =
				activity.totalPeriods / activity.periodsPerInstance;
			$editFormData.periodsPerInstance = activity.periodsPerInstance;
			$editFormData.yearLevelIds = activity.yearLevels.map((y) =>
				y.yearLevelId.toString(),
			);
			$editFormData.groupIds = activity.groupIds;
			$editFormData.studentIds = activity.studentIds;
			$editFormData.spaceIds = activity.spaceIds;
			editActivityDialogOpen = true;
		}
	}

	function handleDeleteActivity(id: number) {
		$deleteFormData.activityId = id;
		setTimeout(() => {
			const form = document.getElementById(
				'delete-activity-form',
			) as HTMLFormElement;
			if (form) {
				form.requestSubmit();
			}
		}, 0);
	}

	function openCreateActivityDialog(subjectOfferingId: number) {
		$createFormData.subjectOfferingId = subjectOfferingId;
		$createFormData.teacherIds = [];
		$createFormData.numInstancesPerWeek = 1;
		$createFormData.periodsPerInstance = 1;
		$createFormData.yearLevelIds = [];
		$createFormData.groupIds = [];
		$createFormData.studentIds = [];
		$createFormData.spaceIds = [];
		createActivityDialogOpen = true;
	}

	const yearLevelOptions = $derived(
		data.yearLevels
			.map((yearLevel) => ({
				value: yearLevel.id.toString(),
				label: yearLevel.code,
			}))
			.filter(
				(option, index, self) =>
					index === self.findIndex((o) => o.value === option.value),
			),
	);

	const groupOptions = $derived(
		data.groups.map((group) => ({
			value: group.id.toString(),
			label: `${group.name} (${group.yearLevelCode})`,
		})),
	);

	const studentOptions = $derived(
		data.students.map((student) => ({
			value: student.id,
			label: `${convertToFullName(student.firstName, student.middleName, student.lastName)} (${student.yearLevel})`,
		})),
	);

	const spaceOptions = $derived(
		data.spaces.map((space) => ({
			value: space.id.toString(),
			label: space.name,
		})),
	);
</script>

<div class="flex justify-between">
	<h1 class="mb-4 text-3xl font-bold">Timetable Activities</h1>
	<div class="mb-4 flex items-start">
		<Button
			type="button"
			variant="outline"
			size="icon"
			onclick={() => (infoDialogOpen = true)}
		>
			<InfoIcon />
		</Button>
	</div>
</div>
<h2 class="mb-4 text-2xl font-bold">Subject Activities</h2>

<!-- Year Level Navigator -->
<Select.Root
	type="single"
	onValueChange={updateActivitiesForYearLevel}
	bind:value={selectedYearLevel}
>
	<Select.Trigger class="w-full">
		{selectedYearLevel ?? 'Select year level...'}
	</Select.Trigger>
	<Select.Content>
		{#each yearLevelOptions as yearLevel (yearLevel.value)}
			<Select.Item value={yearLevel.label}>
				{yearLevel.label}
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>

<div class="h-4"></div>

{#if currentSubjectOfferings.length === 0}
	<Card class="p-8 text-center">
		<h3 class="mb-2 text-lg font-semibold">No Subjects Found</h3>
		<p class="text-muted-foreground">
			No subjects are available for {selectedYearLevel}. Please add subjects for
			this year level before creating activities.
		</p>
	</Card>
{:else}
	<input type="hidden" name="yearLevel" value={selectedYearLevel} />
	<div class="mb-8 space-y-4">
		<Accordion.Root type="single" class="w-full">
			{#each currentSubjectOfferings as subjectAndOffering (subjectAndOffering.subjectOffering.id)}
				<Accordion.Item value="subject-{subjectAndOffering.subjectOffering.id}">
					<Accordion.Trigger class="w-full">
						<div class="flex w-full items-center justify-between">
							<div class="flex items-center gap-4">
								<h3 class="text-lg font-semibold">
									{subjectAndOffering.subject.name}
								</h3>
								{#if data.activitiesBySubjectOfferingId[subjectAndOffering.subjectOffering.id]?.length > 0}
									<Badge variant="outline" class="text-xs">
										{data.activitiesBySubjectOfferingId[
											subjectAndOffering.subjectOffering.id
										]?.length} activities
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
									{#each data.activitiesBySubjectOfferingId[subjectAndOffering.subjectOffering.id] as activity (activity.id)}
										<div class="bg-background rounded-lg border p-4">
											<div class="mb-3 flex items-start justify-between">
												<div class="flex-1">
													<div class="mb-2 flex items-center gap-3">
														<span class="font-medium"
															>Activity #{activity.id}</span
														>
														<Badge variant="secondary" class="text-xs">
															{activity.periodsPerInstance} periods/instance
														</Badge>
														<Badge variant="secondary" class="text-xs">
															{activity.totalPeriods} periods per week
														</Badge>
													</div>

													<!-- Teachers -->
													{#if activity.teacherIds.length > 0}
														<div class="mb-2 flex items-start gap-2">
															<span
																class="text-muted-foreground text-sm font-medium"
															>
																Teachers:
															</span>
															<div class="flex flex-wrap gap-1">
																{#each activity.teacherIds as teacherId (teacherId)}
																	{@const teacher = data.teachers.find(
																		(t) => t.id === teacherId,
																	)}
																	{#if teacher}
																		<Badge variant="outline" class="text-xs">
																			{convertToFullName(
																				teacher.firstName,
																				teacher.middleName,
																				teacher.lastName,
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
															<span
																class="text-muted-foreground text-sm font-medium"
															>
																Year Levels:
															</span>
															<div class="flex flex-wrap gap-1">
																{#each activity.yearLevels as yearLevel (yearLevel.yearLevelId)}
																	<Badge variant="outline" class="text-xs">
																		{yearLevel}
																	</Badge>
																{/each}
															</div>
														</div>
													{/if}

													<!-- Assigned Groups -->
													{#if activity.groupIds.length > 0}
														<div class="mb-2 flex items-start gap-2">
															<span
																class="text-muted-foreground text-sm font-medium"
															>
																Groups:
															</span>
															<div class="flex flex-wrap gap-1">
																{#each activity.groupIds as groupId (groupId)}
																	{@const group = data.groups.find(
																		(g) => g.id.toString() === groupId,
																	)}
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
															<span
																class="text-muted-foreground text-sm font-medium"
															>
																Students:
															</span>
															<div class="flex flex-wrap gap-1">
																{#each activity.studentIds as studentId (studentId)}
																	{@const student = data.students.find(
																		(s) => s.id === studentId,
																	)}
																	{#if student}
																		<Badge variant="outline" class="text-xs">
																			{convertToFullName(
																				student.firstName,
																				student.middleName,
																				student.lastName,
																			)}
																		</Badge>
																	{/if}
																{/each}
															</div>
														</div>
													{/if}

													<!-- Preferred Locations -->
													{#if activity.spaceIds.length > 0}
														<div class="flex items-start gap-2">
															<span
																class="text-muted-foreground text-sm font-medium"
															>
																Preferred Rooms:
															</span>
															<div class="flex flex-wrap gap-1">
																{#each activity.spaceIds as locationId (locationId)}
																	{@const space = data.spaces.find(
																		(s) => s.id.toString() === locationId,
																	)}
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
														<PencilIcon class="h-4 w-4" />
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
								onclick={() =>
									openCreateActivityDialog(
										subjectAndOffering.subjectOffering.id,
									)}
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
	<input
		type="hidden"
		name="activityId"
		bind:value={$deleteFormData.activityId}
	/>
</form>

<!-- Create Activity Dialog -->
<Dialog.Root bind:open={createActivityDialogOpen}>
	<Dialog.Content class="overflow-y-auto sm:max-h-[90vh] sm:max-w-200">
		<Dialog.Header>
			<Dialog.Title>Create New Activity</Dialog.Title>
			<Dialog.Description
				>Configure the activity details for this subject.</Dialog.Description
			>
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
										return (
											teacherOptions.find((t) => t.value === teacherId)
												?.label || 'Unknown'
										);
									})
									.join(', ')}
							{:else}
								Select teachers...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each teacherOptions as option (option.value)}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $createFormData.teacherIds || [] as teacherId (teacherId)}
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
					<p class="text-muted-foreground text-sm">
						How many times this activity occurs per week
					</p>
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
					<Label for="activity-year-levels"
						>Assign to Year Levels (Optional)</Label
					>
					<Select.Root
						type="multiple"
						bind:value={$createFormData.yearLevelIds}
					>
						<Select.Trigger class="w-full">
							{#if data.yearLevels.length > 0}
								{data.yearLevels
									.filter((y) =>
										($createFormData.yearLevelIds ?? []).includes(
											y.id.toString(),
										),
									)
									.map((y) => y.code)
									.join(', ')}
							{:else}
								Select year levels...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each yearLevelOptions as option (option.value)}
								<Select.Item value={option.value.toString()}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $createFormData.yearLevelIds || [] as yearLevel (yearLevel)}
						<input type="hidden" name="yearLevelIds" value={yearLevel} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Select year levels for activities that apply to entire grade levels
					</p>
				</div>

				<!-- Groups Selection -->
				<div class="grid gap-2">
					<Label for="create-activity-groups">Assign to Groups (Optional)</Label
					>
					<Select.Root type="multiple" bind:value={$createFormData.groupIds}>
						<Select.Trigger class="w-full">
							{#if ($createFormData.groupIds ?? []).length > 0}
								{($createFormData.groupIds ?? [])
									.map((groupId) => {
										return (
											groupOptions.find((g) => g.value === groupId)?.label ||
											'Unknown'
										);
									})
									.join(', ')}
							{:else}
								Select groups...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each groupOptions as option (option.value)}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $createFormData.groupIds || [] as groupId (groupId)}
						<input type="hidden" name="groupIds" value={groupId} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Select groups (classes) that will participate in this activity
					</p>
				</div>
				<!-- Students Selection -->
				<div class="grid gap-2">
					<Label for="activity-students"
						>Assign to Individual Students (Optional)</Label
					>
					<Select.Root type="multiple" bind:value={$createFormData.studentIds}>
						<Select.Trigger class="w-full">
							{#if ($createFormData.studentIds ?? []).length > 0}
								{($createFormData.studentIds ?? [])
									.map((studentId) => {
										return (
											studentOptions.find((s) => s.value === studentId)
												?.label || 'Unknown'
										);
									})
									.join(', ')}
							{:else}
								Select students...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each studentOptions as option (option.value)}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $createFormData.studentIds || [] as studentId (studentId)}
						<input type="hidden" name="studentIds" value={studentId} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Select individual students for personalized or one-on-one activities
					</p>
				</div>

				<!-- Preferred Rooms Selection -->
				<div class="grid gap-2">
					<Label for="activity-rooms">Preferred Rooms (Optional)</Label>
					<Select.Root type="multiple" bind:value={$createFormData.spaceIds}>
						<Select.Trigger class="w-full truncate">
							{#if ($createFormData.spaceIds ?? []).length > 0}
								{($createFormData.spaceIds ?? [])
									.map((locationId) => {
										return (
											spaceOptions.find((s) => s.value === locationId)?.label ||
											'Unknown'
										);
									})
									.join(', ')}
							{:else}
								Select preferred rooms...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each spaceOptions as option (option.value)}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $createFormData.spaceIds || [] as locationId (locationId)}
						<input type="hidden" name="spaceIds" value={locationId} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Optionally select preferred rooms/spaces for this activity
					</p>
				</div>
			</div>
			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					onclick={() => (createActivityDialogOpen = false)}
				>
					Cancel
				</Button>
				<Button type="submit">Create Activity</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Page Information Dialog -->
<Dialog.Root bind:open={infoDialogOpen}>
	<Dialog.Content class="md:max-w-3xl">
		<Dialog.Header>
			<Dialog.Title>Page Information</Dialog.Title>
			<Dialog.Description>
				Important information about managing activities in this timetable:
			</Dialog.Description>
		</Dialog.Header>
		<ol
			class="list-inside list-decimal space-y-2 rounded-md border p-3 text-sm"
		>
			<li>
				When you assign an activity to a <strong>Year Level</strong>, FET
				automatically assigns it to all subgroups within that year. Use this for
				whole-year events such as assemblies, exams, or grade-level sessions
				where no student differentiation is needed.
			</li>
			<li>
				Assign to a <strong>Group</strong> for specific classes or courses that particular
				students are enrolled in. This is the most common use case — for example,
				homeroom classes and elective courses.
			</li>
			<li>
				Assign to a <strong>Subgroup</strong> when you need to split a group further,
				such as lab sections or tutoring groups. This is the most granular level of
				control and is also used for individual student tracking when each student
				is their own subgroup.
			</li>
			<li>
				If a subgroup has fewer than 20 periods per week, it likely has missing
				activities. Check that all required activities have been created and
				assigned correctly.
			</li>
		</ol>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Activity Dialog -->
<Dialog.Root bind:open={editActivityDialogOpen}>
	<Dialog.Content class="overflow-y-auto sm:max-h-[90vh] sm:max-w-200">
		<Dialog.Header>
			<Dialog.Title>Edit Activity</Dialog.Title>
			<Dialog.Description>Update the activity details.</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/editActivity" use:editEnhance>
			<input
				type="hidden"
				name="activityId"
				bind:value={$editFormData.activityId}
			/>
			<input
				type="hidden"
				name="subjectOfferingId"
				bind:value={$editFormData.subjectOfferingId}
			/>
			<div class="grid gap-6 py-4">
				<!-- Teacher Selection -->
				<div class="grid gap-2">
					<Label for="edit-activity-teacher">Teachers *</Label>
					<Select.Root type="multiple" bind:value={$editFormData.teacherIds}>
						<Select.Trigger class="w-full">
							{#if $editFormData.teacherIds?.length > 0}
								{$editFormData.teacherIds
									.map((teacherId) => {
										return (
											teacherOptions.find((t) => t.value === teacherId)
												?.label || 'Unknown'
										);
									})
									.join(', ')}
							{:else}
								Select teachers...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each teacherOptions as option (option.value)}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $editFormData.teacherIds || [] as teacherId (teacherId)}
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
					<p class="text-muted-foreground text-sm">
						How many times this activity occurs per week
					</p>
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
					<Label for="edit-activity-year-levels"
						>Assign to Year Levels (Optional)</Label
					>
					<Select.Root type="multiple" bind:value={$editFormData.yearLevelIds}>
						<Select.Trigger class="w-full">
							{#if data.yearLevels.length > 0}
								{data.yearLevels
									.filter((y) =>
										($editFormData.yearLevelIds ?? []).includes(
											y.id.toString(),
										),
									)
									.map((y) => y.code)
									.join(', ')}
							{:else}
								Select year levels...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each yearLevelOptions as option (option.value)}
								<Select.Item value={option.value.toString()}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $editFormData.yearLevelIds || [] as yearLevel (yearLevel)}
						<input type="hidden" name="yearLevelIds" value={yearLevel} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Select year levels for activities that apply to entire grade levels
					</p>
				</div>

				<!-- Groups Selection -->
				<div class="grid gap-2">
					<Label for="edit-activity-groups">Assign to Groups (Optional)</Label>
					<Select.Root type="multiple" bind:value={$editFormData.groupIds}>
						<Select.Trigger class="w-full">
							{#if ($editFormData.groupIds ?? []).length > 0}
								{($editFormData.groupIds ?? [])
									.map((groupId) => {
										return (
											groupOptions.find((g) => g.value === groupId)?.label ||
											'Unknown'
										);
									})
									.join(', ')}
							{:else}
								Select groups...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each groupOptions as option (option.value)}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $editFormData.groupIds || [] as groupId (groupId)}
						<input type="hidden" name="groupIds" value={groupId} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Select groups (classes) that will participate in this activity
					</p>
				</div>

				<!-- Students Selection -->
				<div class="grid gap-2">
					<Label for="edit-activity-students"
						>Assign to Individual Students (Optional)</Label
					>
					<Select.Root type="multiple" bind:value={$editFormData.studentIds}>
						<Select.Trigger class="w-full">
							{#if ($editFormData.studentIds ?? []).length > 0}
								{($editFormData.studentIds ?? [])
									.map((studentId) => {
										return (
											studentOptions.find((s) => s.value === studentId)
												?.label || 'Unknown'
										);
									})
									.join(', ')}
							{:else}
								Select students...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each studentOptions as option (option.value)}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $editFormData.studentIds || [] as studentId (studentId)}
						<input type="hidden" name="studentIds" value={studentId} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Select individual students for personalized or one-on-one activities
					</p>
				</div>

				<!-- Preferred Rooms Selection -->
				<div class="grid gap-2">
					<Label for="edit-activity-rooms">Preferred Rooms (Optional)</Label>
					<Select.Root type="multiple" bind:value={$editFormData.spaceIds}>
						<Select.Trigger class="w-full truncate">
							{#if ($editFormData.spaceIds ?? []).length > 0}
								{($editFormData.spaceIds ?? [])
									.map((locationId) => {
										return (
											spaceOptions.find((s) => s.value === locationId)?.label ||
											'Unknown'
										);
									})
									.join(', ')}
							{:else}
								Select preferred rooms...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each spaceOptions as option (option.value)}
								<Select.Item value={option.value}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#each $editFormData.spaceIds || [] as locationId (locationId)}
						<input type="hidden" name="spaceIds" value={locationId} />
					{/each}
					<p class="text-muted-foreground text-sm">
						Optionally select preferred rooms/spaces for this activity
					</p>
				</div>
			</div>
			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					onclick={() => (editActivityDialogOpen = false)}
				>
					Cancel
				</Button>
				<Button type="submit">Update Activity</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
