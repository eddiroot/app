<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select/index.js';
	import { yearLevelEnum } from '$lib/enums.js';
	import { convertToFullName } from '$lib/utils';
	import InfoIcon from '@lucide/svelte/icons/info';
	import ListIcon from '@lucide/svelte/icons/list';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import {
		createClassSchema,
		deleteClassSchema,
		editClassSchema,
	} from './schema.js';

	let { data } = $props();

	let createClassDialogOpen = $state(false);
	let editClassDialogOpen = $state(false);
	let infoDialogOpen = $state(false);
	let getYearLevelZeroIndexCode = () =>
		data.yearLevels[0]?.code || yearLevelEnum.year7;
	let selectedYearLevel = $state(getYearLevelZeroIndexCode());

	const baseHref = `/admin/timetables/${page.params.timetableId}/draft/${page.params.timetableDraftId}/classes`;

	let dataCreateClassForm = () => data.createClassForm;
	const createForm = superForm(dataCreateClassForm(), {
		validators: zod4(createClassSchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				createClassDialogOpen = false;
				invalidateAll();
			}
		},
	});
	const { form: createFormData, enhance: createEnhance } = createForm;

	let dataEditClassForm = () => data.editClassForm;
	const editForm = superForm(dataEditClassForm(), {
		validators: zod4(editClassSchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				editClassDialogOpen = false;
				invalidateAll();
			}
		},
	});
	const { form: editFormData, enhance: editEnhance } = editForm;

	let dataDeleteClassForm = () => data.deleteClassForm;
	const deleteForm = superForm(dataDeleteClassForm(), {
		validators: zod4(deleteClassSchema),
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

	function updateClassesForYearLevel(yearLevel: string) {
		selectedYearLevel = yearLevel as yearLevelEnum;
	}

	function handleEditClass(id: number) {
		const cls = Object.values(data.classesBySubjectOfferingId)
			.flat()
			.find((c) => c.id === id);

		if (cls) {
			$editFormData.classId = cls.id;
			$editFormData.subjectOfferingId = cls.subjectOfferingId;
			$editFormData.teacherIds = cls.teacherIds;
			$editFormData.yearLevelIds = cls.yearLevels.map((y) =>
				y.yearLevelId.toString(),
			);
			$editFormData.groupIds = cls.groupIds;
			$editFormData.studentIds = cls.studentIds;
			$editFormData.spaceIds = cls.spaceIds;
			editClassDialogOpen = true;
		}
	}

	function handleDeleteClass(id: number) {
		$deleteFormData.classId = id;
		setTimeout(() => {
			const form = document.getElementById(
				'delete-class-form',
			) as HTMLFormElement;
			if (form) {
				form.requestSubmit();
			}
		}, 0);
	}

	function openCreateClassDialog(subjectOfferingId: number) {
		$createFormData.subjectOfferingId = subjectOfferingId;
		$createFormData.teacherIds = [];
		$createFormData.yearLevelIds = [];
		$createFormData.groupIds = [];
		$createFormData.studentIds = [];
		$createFormData.spaceIds = [];
		createClassDialogOpen = true;
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
	<h1 class="mb-4 text-3xl font-bold">Timetable Classes</h1>
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
<h2 class="mb-4 text-2xl font-bold">Subject Classes</h2>

<!-- Year Level Navigator -->
<Select.Root
	type="single"
	onValueChange={updateClassesForYearLevel}
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
			this year level before creating classes.
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
								{#if data.classesBySubjectOfferingId[subjectAndOffering.subjectOffering.id]?.length > 0}
									<Badge variant="outline" class="text-xs">
										{data.classesBySubjectOfferingId[
											subjectAndOffering.subjectOffering.id
										]?.length} classes
									</Badge>
								{/if}
							</div>
						</div>
					</Accordion.Trigger>

					<Accordion.Content>
						{#if data.classesBySubjectOfferingId[subjectAndOffering.subjectOffering.id]?.length > 0}
							<div class="mb-4">
								<h4 class="mb-3 font-medium">Existing Classes</h4>
								<div class="grid gap-3">
									{#each data.classesBySubjectOfferingId[subjectAndOffering.subjectOffering.id] as cls (cls.id)}
										<div class="bg-background rounded-lg border p-4">
											<div class="mb-3 flex items-start justify-between">
												<div class="flex-1">
													<div class="mb-2 flex items-center gap-3">
														<span class="font-medium">Class #{cls.id}</span>
														<Badge variant="secondary" class="text-xs">
															{cls.activities.length} activities
														</Badge>
													</div>

													<!-- Teachers -->
													{#if cls.teacherIds.length > 0}
														<div class="mb-2 flex items-start gap-2">
															<span
																class="text-muted-foreground text-sm font-medium"
															>
																Teachers:
															</span>
															<div class="flex flex-wrap gap-1">
																{#each cls.teacherIds as teacherId (teacherId)}
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
													{#if cls.yearLevels.length > 0}
														<div class="mb-2 flex items-start gap-2">
															<span
																class="text-muted-foreground text-sm font-medium"
															>
																Year Levels:
															</span>
															<div class="flex flex-wrap gap-1">
																{#each cls.yearLevels as yearLevel (yearLevel.yearLevelId)}
																	<Badge variant="outline" class="text-xs">
																		{yearLevel.yearLevelCode}
																	</Badge>
																{/each}
															</div>
														</div>
													{/if}

													<!-- Assigned Groups -->
													{#if cls.groupIds.length > 0}
														<div class="mb-2 flex items-start gap-2">
															<span
																class="text-muted-foreground text-sm font-medium"
															>
																Groups:
															</span>
															<div class="flex flex-wrap gap-1">
																{#each cls.groupIds as groupId (groupId)}
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
													{#if cls.studentIds.length > 0}
														<div class="mb-2 flex items-start gap-2">
															<span
																class="text-muted-foreground text-sm font-medium"
															>
																Students:
															</span>
															<div class="flex flex-wrap gap-1">
																{#each cls.studentIds as studentId (studentId)}
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
													{#if cls.spaceIds.length > 0}
														<div class="flex items-start gap-2">
															<span
																class="text-muted-foreground text-sm font-medium"
															>
																Preferred Rooms:
															</span>
															<div class="flex flex-wrap gap-1">
																{#each cls.spaceIds as locationId (locationId)}
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
														href="{baseHref}/{cls.id}/activities"
														title="Manage activities"
													>
														<ListIcon class="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onclick={() => handleEditClass(cls.id)}
													>
														<PencilIcon class="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onclick={() => handleDeleteClass(cls.id)}
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

						<!-- Create Class Button -->
						<div class="mt-4">
							<Button
								type="button"
								onclick={() =>
									openCreateClassDialog(subjectAndOffering.subjectOffering.id)}
							>
								<PlusIcon class="mr-2 h-4 w-4" />
								Create Class
							</Button>
						</div>
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	</div>
{/if}

<!-- Hidden Delete Form -->
<form
	id="delete-class-form"
	method="POST"
	action="?/deleteClass"
	use:deleteEnhance
	class="hidden"
>
	<input type="hidden" name="classId" bind:value={$deleteFormData.classId} />
</form>

<!-- Create Class Dialog -->
<Dialog.Root bind:open={createClassDialogOpen}>
	<Dialog.Content class="overflow-y-auto sm:max-h-[90vh] sm:max-w-200">
		<Dialog.Header>
			<Dialog.Title>Create New Class</Dialog.Title>
			<Dialog.Description>
				Configure the class details for this subject. After creating, manage
				individual activities for the class to control how it splits across the
				week.
			</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/createClass" use:createEnhance>
			<input
				type="hidden"
				name="subjectOfferingId"
				bind:value={$createFormData.subjectOfferingId}
			/>
			<div class="grid gap-6 py-4">
				<!-- Teacher Selection -->
				<div class="grid gap-2">
					<Label for="class-teacher">Teachers *</Label>
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
						Select one or more teachers to assign to this class
					</p>
				</div>

				<!-- Year Levels Selection -->
				<div class="grid gap-2">
					<Label for="class-year-levels">Assign to Year Levels (Optional)</Label>
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
						Select year levels for classes that apply to entire grade levels
					</p>
				</div>

				<!-- Groups Selection -->
				<div class="grid gap-2">
					<Label for="create-class-groups">Assign to Groups (Optional)</Label>
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
						Select groups (classes) that will participate in this class
					</p>
				</div>

				<!-- Students Selection -->
				<div class="grid gap-2">
					<Label for="class-students"
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
						Select individual students for personalized or one-on-one classes
					</p>
				</div>

				<!-- Preferred Rooms Selection -->
				<div class="grid gap-2">
					<Label for="class-rooms">Preferred Rooms (Optional)</Label>
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
						Optionally select preferred rooms/spaces for this class
					</p>
				</div>
			</div>
			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					onclick={() => (createClassDialogOpen = false)}
				>
					Cancel
				</Button>
				<Button type="submit">Create Class</Button>
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
				Important information about managing classes in this timetable:
			</Dialog.Description>
		</Dialog.Header>
		<ol
			class="list-inside list-decimal space-y-2 rounded-md border p-3 text-sm"
		>
			<li>
				A <strong>Class</strong> represents a group of students taught a subject
				by one or more teachers. After creating a class, open it and add the
				individual <strong>Activities</strong> that determine how it appears in
				the schedule (e.g. one 2-period block + one 1-period single).
			</li>
			<li>
				Each Activity has a <strong>Duration</strong> (number of consecutive
				periods for that single appearance) and a <strong>Total Duration</strong
				> (sum of durations across all activities of the same class). FET uses
				these to schedule the class consistently.
			</li>
			<li>
				When you assign a class to a <strong>Year Level</strong>, FET
				automatically assigns it to all subgroups within that year. Use this
				for whole-year events such as assemblies, exams, or grade-level
				sessions where no student differentiation is needed.
			</li>
			<li>
				Assign to a <strong>Group</strong> for specific cohorts that particular
				students are enrolled in. This is the most common use case — for
				example, homeroom classes and elective courses.
			</li>
			<li>
				Assign to individual <strong>Students</strong> for the most granular
				level of control, used for individual tracking when each student is
				their own subgroup.
			</li>
		</ol>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Class Dialog -->
<Dialog.Root bind:open={editClassDialogOpen}>
	<Dialog.Content class="overflow-y-auto sm:max-h-[90vh] sm:max-w-200">
		<Dialog.Header>
			<Dialog.Title>Edit Class</Dialog.Title>
			<Dialog.Description>Update the class details.</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/editClass" use:editEnhance>
			<input
				type="hidden"
				name="classId"
				bind:value={$editFormData.classId}
			/>
			<input
				type="hidden"
				name="subjectOfferingId"
				bind:value={$editFormData.subjectOfferingId}
			/>
			<div class="grid gap-6 py-4">
				<!-- Teacher Selection -->
				<div class="grid gap-2">
					<Label for="edit-class-teacher">Teachers *</Label>
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
						Select one or more teachers to assign to this class
					</p>
				</div>

				<!-- Year Levels Selection -->
				<div class="grid gap-2">
					<Label for="edit-class-year-levels"
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
						Select year levels for classes that apply to entire grade levels
					</p>
				</div>

				<!-- Groups Selection -->
				<div class="grid gap-2">
					<Label for="edit-class-groups">Assign to Groups (Optional)</Label>
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
						Select groups (classes) that will participate in this class
					</p>
				</div>

				<!-- Students Selection -->
				<div class="grid gap-2">
					<Label for="edit-class-students"
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
						Select individual students for personalized or one-on-one classes
					</p>
				</div>

				<!-- Preferred Rooms Selection -->
				<div class="grid gap-2">
					<Label for="edit-class-rooms">Preferred Rooms (Optional)</Label>
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
						Optionally select preferred rooms/spaces for this class
					</p>
				</div>
			</div>
			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					onclick={() => (editClassDialogOpen = false)}
				>
					Cancel
				</Button>
				<Button type="submit">Update Class</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
