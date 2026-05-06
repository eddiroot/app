<script lang="ts">
	import { enhance as kitEnhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select/index.js';
	import { yearLevelEnum } from '$lib/enums.js';
	import { convertToFullName } from '$lib/utils';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import DoorOpenIcon from '@lucide/svelte/icons/door-open';
	import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
	import InfoIcon from '@lucide/svelte/icons/info';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import UsersIcon from '@lucide/svelte/icons/users';
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
	let activityDialogOpen = $state(false);
	let infoDialogOpen = $state(false);
	let selectedActivityClassId = $state<number | null>(null);
	let editingActivityId = $state<number | null>(null);
	let createActivityDuration = $state(1);
	let editActivityDuration = $state(1);
	let getYearLevelZeroIndexCode = () =>
		data.yearLevels[0]?.code || yearLevelEnum.year7;
	let getInitialYearLevelCode = () => {
		const yearLevelParam = page.url.searchParams.get('yearLevel');
		return data.yearLevels.some((yearLevel) => yearLevel.code === yearLevelParam)
			? yearLevelParam!
			: getYearLevelZeroIndexCode();
	};
	let selectedYearLevel = $state(getInitialYearLevelCode());

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

		const url = new URL(page.url);
		url.searchParams.set('yearLevel', yearLevel);
		history.replaceState(history.state, '', url);
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

	function openActivityDialog(classId: number) {
		selectedActivityClassId = classId;
		editingActivityId = null;
		createActivityDuration = 1;
		activityDialogOpen = true;
	}

	function openEditActivity(activityId: number, duration: number) {
		editingActivityId = activityId;
		editActivityDuration = duration;
	}

	function handleDeleteActivity(activityId: number) {
		setTimeout(() => {
			const form = document.getElementById(
				`delete-activity-form-${activityId}`,
			) as HTMLFormElement;
			form?.requestSubmit();
		}, 0);
	}

	function activityEnhanceDone(resetCreateDuration = false) {
		return async ({
			update,
		}: {
			update: (options?: { reset?: boolean }) => Promise<void>;
		}) => {
			await update({ reset: false });
			if (resetCreateDuration) {
				createActivityDuration = 1;
			}
			editingActivityId = null;
			await invalidateAll();
		};
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

	const allClasses = $derived(
		Object.values(data.classesBySubjectOfferingId).flat(),
	);

	const currentClasses = $derived(
		currentSubjectOfferings.flatMap(
			(subjectAndOffering) =>
				data.classesBySubjectOfferingId[
					subjectAndOffering.subjectOffering.id
				] ?? [],
		),
	);

	const totalActivities = $derived(
		allClasses.reduce((total, cls) => total + cls.activities.length, 0),
	);

	const selectedActivityClass = $derived(
		allClasses.find((cls) => cls.id === selectedActivityClassId) ?? null,
	);

	function getTeacherName(teacherId: string) {
		const teacher = data.teachers.find((t) => t.id === teacherId);
		if (!teacher) return null;

		return convertToFullName(
			teacher.firstName,
			teacher.middleName,
			teacher.lastName,
		);
	}

	function getGroupName(groupId: string) {
		return data.groups.find((group) => group.id.toString() === groupId)?.name;
	}

	function getStudentName(studentId: string) {
		const student = data.students.find((s) => s.id === studentId);
		if (!student) return null;

		return convertToFullName(
			student.firstName,
			student.middleName,
			student.lastName,
		);
	}

	function getSpaceName(spaceId: string) {
		return data.spaces.find((space) => space.id.toString() === spaceId)?.name;
	}

	function getActivityCount(cls: { activities: { duration: number }[] }) {
		return cls.activities.length;
	}

	function getTotalActivityDuration(cls: {
		activities: { duration: number }[];
	}) {
		return cls.activities.reduce(
			(total, activity) => total + activity.duration,
			0,
		);
	}

	function getLongestActivityDuration(cls: {
		activities: { duration: number }[];
	}) {
		return cls.activities.reduce(
			(longest, activity) => Math.max(longest, activity.duration),
			0,
		);
	}

	function getAverageActivityDuration(cls: {
		activities: { duration: number }[];
	}) {
		if (cls.activities.length === 0) return 0;
		return getTotalActivityDuration(cls) / cls.activities.length;
	}

	function getPeriodLabel(count: number) {
		return `${count} period${count === 1 ? '' : 's'}`;
	}
</script>

<div class="space-y-6 p-6">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight">Classes</h1>
			<p class="text-muted-foreground text-sm">
				Build subject classes, assign cohorts, and manage their timetable
				activities.
			</p>
		</div>
		<div class="flex items-end gap-2">
			<div class="grid gap-1.5">
				<Label for="year-level-filter" class="text-xs">Year level</Label>
				<Select.Root
					type="single"
					onValueChange={updateClassesForYearLevel}
					bind:value={selectedYearLevel}
				>
					<Select.Trigger id="year-level-filter" class="w-36">
						{selectedYearLevel ?? 'Select...'}
					</Select.Trigger>
					<Select.Content>
						{#each yearLevelOptions as yearLevel (yearLevel.value)}
							<Select.Item value={yearLevel.label}>
								{yearLevel.label}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<Button
				type="button"
				variant="outline"
				size="icon"
				onclick={() => (infoDialogOpen = true)}
				aria-label="About classes"
			>
				<InfoIcon />
			</Button>
		</div>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<Card.Root>
			<Card.Header
				class="flex flex-row items-center justify-between space-y-0 pb-2"
			>
				<Card.Title class="text-sm font-medium">Classes</Card.Title>
				<div class="bg-primary/10 rounded-lg p-2">
					<BookOpenIcon class="text-primary h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{allClasses.length}</div>
				<p class="text-muted-foreground text-xs">Configured in this draft</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header
				class="flex flex-row items-center justify-between space-y-0 pb-2"
			>
				<Card.Title class="text-sm font-medium">Activities</Card.Title>
				<div class="bg-primary/10 rounded-lg p-2">
					<CalendarClockIcon class="text-primary h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{totalActivities}</div>
				<p class="text-muted-foreground text-xs">Scheduled appearances</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header
				class="flex flex-row items-center justify-between space-y-0 pb-2"
			>
				<Card.Title class="text-sm font-medium">Subjects</Card.Title>
				<div class="bg-primary/10 rounded-lg p-2">
					<GraduationCapIcon class="text-primary h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{currentSubjectOfferings.length}</div>
				<p class="text-muted-foreground text-xs">For {selectedYearLevel}</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header
				class="flex flex-row items-center justify-between space-y-0 pb-2"
			>
				<Card.Title class="text-sm font-medium">Current level</Card.Title>
				<div class="bg-primary/10 rounded-lg p-2">
					<UsersIcon class="text-primary h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{currentClasses.length}</div>
				<p class="text-muted-foreground text-xs">
					Classes assigned to {selectedYearLevel}
				</p>
			</Card.Content>
		</Card.Root>
	</div>

	{#if currentSubjectOfferings.length === 0}
		<Card.Root class="border-dashed">
			<Card.Content class="flex flex-col items-center gap-3 py-12 text-center">
				<div
					class="bg-muted flex h-14 w-14 items-center justify-center rounded-full"
				>
					<BookOpenIcon class="text-muted-foreground h-6 w-6" />
				</div>
				<div class="space-y-1">
					<p class="text-lg font-semibold">No subjects found</p>
					<p class="text-muted-foreground max-w-md text-sm">
						No subjects are available for {selectedYearLevel}. Add subjects for
						this year level before creating classes.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<input type="hidden" name="yearLevel" value={selectedYearLevel} />
		<div class="space-y-4">
			<Accordion.Root type="single" class="w-full space-y-3">
				{#each currentSubjectOfferings as subjectAndOffering (subjectAndOffering.subjectOffering.id)}
					{@const subjectClasses =
						data.classesBySubjectOfferingId[
							subjectAndOffering.subjectOffering.id
						] ?? []}
					<Accordion.Item
						value="subject-{subjectAndOffering.subjectOffering.id}"
						class="bg-card rounded-lg border px-4"
					>
						<Accordion.Trigger class="w-full py-4 hover:no-underline">
							<div
								class="flex w-full min-w-0 items-center justify-between gap-3 pr-2"
							>
								<div class="min-w-0 text-left">
									<p class="truncate text-lg font-semibold">
										{subjectAndOffering.subject.name}
									</p>
									<p class="text-muted-foreground text-xs">
										{selectedYearLevel}
									</p>
								</div>
								<Badge
									variant={subjectClasses.length > 0 ? 'secondary' : 'outline'}
								>
									{subjectClasses.length}
									{subjectClasses.length === 1 ? 'class' : 'classes'}
								</Badge>
							</div>
						</Accordion.Trigger>

						<Accordion.Content class="pb-4">
							{#if subjectClasses.length > 0}
								<div class="grid gap-3">
									{#each subjectClasses as cls (cls.id)}
										<div class="rounded-md border p-4">
											<div
												class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
											>
												<div class="min-w-0 flex-1 space-y-3">
													<div class="flex flex-wrap items-center gap-2">
														<p class="font-medium">Class #{cls.id}</p>
														<Badge variant="secondary" class="text-xs">
															{getActivityCount(cls)}
															{getActivityCount(cls) === 1
																? 'activity'
																: 'activities'}
														</Badge>
													</div>

													<div class="grid gap-2 sm:grid-cols-4">
														<div class="bg-muted/40 rounded-md border p-3">
															<p
																class="text-muted-foreground text-xs font-medium"
															>
																Activities
															</p>
															<p class="mt-1 text-lg font-semibold">
																{getActivityCount(cls)}
															</p>
														</div>
														<div class="bg-muted/40 rounded-md border p-3">
															<p
																class="text-muted-foreground text-xs font-medium"
															>
																Total
															</p>
															<p class="mt-1 text-lg font-semibold">
																{getPeriodLabel(getTotalActivityDuration(cls))}
															</p>
														</div>
														<div class="bg-muted/40 rounded-md border p-3">
															<p
																class="text-muted-foreground text-xs font-medium"
															>
																Longest
															</p>
															<p class="mt-1 text-lg font-semibold">
																{getPeriodLabel(
																	getLongestActivityDuration(cls),
																)}
															</p>
														</div>
														<div class="bg-muted/40 rounded-md border p-3">
															<p
																class="text-muted-foreground text-xs font-medium"
															>
																Average
															</p>
															<p class="mt-1 text-lg font-semibold">
																{getAverageActivityDuration(cls).toFixed(1)}
															</p>
														</div>
													</div>

													<div class="grid gap-3 text-sm md:grid-cols-2">
														<div class="space-y-1">
															<p
																class="text-muted-foreground text-xs font-medium"
															>
																Teachers
															</p>
															<div class="flex flex-wrap gap-1">
																{#each cls.teacherIds as teacherId (teacherId)}
																	{@const teacherName =
																		getTeacherName(teacherId)}
																	{#if teacherName}
																		<Badge variant="outline"
																			>{teacherName}</Badge
																		>
																	{/if}
																{/each}
															</div>
														</div>

														<div class="space-y-1">
															<p
																class="text-muted-foreground text-xs font-medium"
															>
																Cohorts
															</p>
															<div class="flex flex-wrap gap-1">
																{#each cls.yearLevels as yearLevel (yearLevel.yearLevelId)}
																	<Badge variant="outline">
																		{yearLevel.yearLevelCode}
																	</Badge>
																{/each}
																{#each cls.groupIds as groupId (groupId)}
																	{@const groupName = getGroupName(groupId)}
																	{#if groupName}
																		<Badge variant="outline">{groupName}</Badge>
																	{/if}
																{/each}
																{#if cls.yearLevels.length === 0 && cls.groupIds.length === 0}
																	<span class="text-muted-foreground text-sm">
																		No cohorts assigned
																	</span>
																{/if}
															</div>
														</div>

														{#if cls.studentIds.length > 0}
															<div class="space-y-1">
																<p
																	class="text-muted-foreground text-xs font-medium"
																>
																	Students
																</p>
																<div class="flex flex-wrap gap-1">
																	{#each cls.studentIds as studentId (studentId)}
																		{@const studentName =
																			getStudentName(studentId)}
																		{#if studentName}
																			<Badge variant="outline">
																				{studentName}
																			</Badge>
																		{/if}
																	{/each}
																</div>
															</div>
														{/if}

														{#if cls.spaceIds.length > 0}
															<div class="space-y-1">
																<p
																	class="text-muted-foreground text-xs font-medium"
																>
																	Preferred rooms
																</p>
																<div class="flex flex-wrap gap-1">
																	{#each cls.spaceIds as spaceId (spaceId)}
																		{@const spaceName = getSpaceName(spaceId)}
																		{#if spaceName}
																			<Badge variant="outline">
																				<DoorOpenIcon class="h-3 w-3" />
																				{spaceName}
																			</Badge>
																		{/if}
																	{/each}
																</div>
															</div>
														{/if}
													</div>
												</div>

												<div class="flex shrink-0 gap-1">
													<Button
														variant="ghost"
														size="icon-sm"
														title="Manage activities"
														onclick={() => openActivityDialog(cls.id)}
														aria-label="Manage activities"
													>
														<CalendarClockIcon class="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon-sm"
														onclick={() => handleEditClass(cls.id)}
														aria-label="Edit class"
													>
														<PencilIcon class="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon-sm"
														onclick={() => handleDeleteClass(cls.id)}
														aria-label="Delete class"
													>
														<Trash2Icon class="h-4 w-4" />
													</Button>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="rounded-md border border-dashed p-4 text-sm">
									<p class="font-medium">No classes for this subject</p>
									<p class="text-muted-foreground mt-1">
										Create a class to assign teachers, cohorts, students, and
										preferred rooms.
									</p>
								</div>
							{/if}

							<div class="mt-4">
								<Button
									type="button"
									size="sm"
									onclick={() =>
										openCreateClassDialog(
											subjectAndOffering.subjectOffering.id,
										)}
								>
									<PlusIcon class="h-4 w-4" />
									Create Class
								</Button>
							</div>
						</Accordion.Content>
					</Accordion.Item>
				{/each}
			</Accordion.Root>
		</div>
	{/if}
</div>

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

<Dialog.Root bind:open={activityDialogOpen}>
	<Dialog.Content class="overflow-y-auto sm:max-h-[90vh] sm:max-w-3xl">
		<Dialog.Header>
			<Dialog.Title>
				{#if selectedActivityClass}
					Class #{selectedActivityClass.id} Activities
				{:else}
					Class Activities
				{/if}
			</Dialog.Title>
			<Dialog.Description>
				Set the duration for each scheduled appearance of this class.
			</Dialog.Description>
		</Dialog.Header>

		{#if selectedActivityClass}
			<div class="space-y-4">
				<div class="grid gap-3 sm:grid-cols-4">
					<div class="rounded-md border p-3">
						<div class="flex items-center justify-between gap-2">
							<p class="text-muted-foreground text-xs font-medium">
								Activities
							</p>
							<LayersIcon class="text-primary h-4 w-4" />
						</div>
						<p class="mt-1 text-lg font-semibold">
							{getActivityCount(selectedActivityClass)}
						</p>
					</div>
					<div class="rounded-md border p-3">
						<div class="flex items-center justify-between gap-2">
							<p class="text-muted-foreground text-xs font-medium">Total</p>
							<CalendarClockIcon class="text-primary h-4 w-4" />
						</div>
						<p class="mt-1 text-lg font-semibold">
							{getPeriodLabel(getTotalActivityDuration(selectedActivityClass))}
						</p>
					</div>
					<div class="rounded-md border p-3">
						<div class="flex items-center justify-between gap-2">
							<p class="text-muted-foreground text-xs font-medium">Longest</p>
							<ClockIcon class="text-primary h-4 w-4" />
						</div>
						<p class="mt-1 text-lg font-semibold">
							{getPeriodLabel(
								getLongestActivityDuration(selectedActivityClass),
							)}
						</p>
					</div>
					<div class="rounded-md border p-3">
						<div class="flex items-center justify-between gap-2">
							<p class="text-muted-foreground text-xs font-medium">Average</p>
							<CalendarClockIcon class="text-primary h-4 w-4" />
						</div>
						<p class="mt-1 text-lg font-semibold">
							{getAverageActivityDuration(selectedActivityClass).toFixed(1)}
						</p>
					</div>
				</div>

				<form
					method="POST"
					action="?/createActivity"
					use:kitEnhance={() => activityEnhanceDone(true)}
					class="rounded-md border p-4"
				>
					<input
						type="hidden"
						name="classId"
						value={selectedActivityClass.id}
					/>
					<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
						<div class="grid flex-1 gap-2">
							<Label for="create-activity-duration">Add activity duration</Label
							>
							<Input
								id="create-activity-duration"
								name="duration"
								type="number"
								min="1"
								max="20"
								bind:value={createActivityDuration}
							/>
						</div>
						<Button type="submit">
							<PlusIcon class="h-4 w-4" />
							Add Activity
						</Button>
					</div>
				</form>

				{#if selectedActivityClass.activities.length === 0}
					<div class="rounded-md border border-dashed p-6 text-center">
						<p class="font-medium">No activities yet</p>
						<p class="text-muted-foreground mt-1 text-sm">
							Add at least one duration to split this class across the week.
						</p>
					</div>
				{:else}
					<div class="grid gap-2">
						{#each selectedActivityClass.activities as activity, index (activity.id)}
							{#if editingActivityId === activity.id}
								<form
									method="POST"
									action="?/editActivity"
									use:kitEnhance={() => activityEnhanceDone()}
									class="rounded-md border p-3"
								>
									<input type="hidden" name="activityId" value={activity.id} />
									<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
										<div class="grid flex-1 gap-2">
											<Label for="edit-activity-duration-{activity.id}">
												Activity {index + 1} duration
											</Label>
											<Input
												id="edit-activity-duration-{activity.id}"
												name="duration"
												type="number"
												min="1"
												max="20"
												bind:value={editActivityDuration}
											/>
										</div>
										<div class="flex gap-2">
											<Button type="submit" size="sm">Save</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onclick={() => (editingActivityId = null)}
											>
												Cancel
											</Button>
										</div>
									</div>
								</form>
							{:else}
								<div
									class="flex items-center justify-between gap-4 rounded-md border p-3"
								>
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<p class="font-medium">Activity {index + 1}</p>
											<Badge variant="outline">ID #{activity.id}</Badge>
										</div>
										<p class="text-muted-foreground text-sm">
											{getPeriodLabel(activity.duration)} consecutive
										</p>
									</div>
									<div class="flex shrink-0 items-center gap-2">
										<Badge variant="secondary">
											{getPeriodLabel(activity.duration)}
										</Badge>
										<Button
											variant="ghost"
											size="icon-sm"
											onclick={() =>
												openEditActivity(activity.id, activity.duration)}
											aria-label="Edit activity"
										>
											<PencilIcon class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											onclick={() => handleDeleteActivity(activity.id)}
											aria-label="Delete activity"
										>
											<Trash2Icon class="h-4 w-4" />
										</Button>
										<form
											id="delete-activity-form-{activity.id}"
											method="POST"
											action="?/deleteActivity"
											use:kitEnhance={() => activityEnhanceDone()}
											class="hidden"
										>
											<input
												type="hidden"
												name="activityId"
												value={activity.id}
											/>
										</form>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

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
					<Label for="class-year-levels">Assign to Year Levels (Optional)</Label
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
				individual <strong>Activities</strong> that determine how it appears in the
				schedule (e.g. one 2-period block + one 1-period single).
			</li>
			<li>
				Each Activity has a <strong>Duration</strong> (number of consecutive
				periods for that single appearance) and a
				<strong>Total Duration</strong> (sum of durations across all activities of
				the same class). FET uses these to schedule the class consistently.
			</li>
			<li>
				When you assign a class to a <strong>Year Level</strong>, FET
				automatically assigns it to all subgroups within that year. Use this for
				whole-year events such as assemblies, exams, or grade-level sessions
				where no student differentiation is needed.
			</li>
			<li>
				Assign to a <strong>Group</strong> for specific cohorts that particular students
				are enrolled in. This is the most common use case — for example, homeroom
				classes and elective courses.
			</li>
			<li>
				Assign to individual <strong>Students</strong> for the most granular level
				of control, used for individual tracking when each student is their own subgroup.
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
			<input type="hidden" name="classId" bind:value={$editFormData.classId} />
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
