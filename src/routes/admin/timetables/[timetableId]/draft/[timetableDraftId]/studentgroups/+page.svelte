<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Autocomplete from '$lib/components/autocomplete.svelte';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Item from '$lib/components/ui/item';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select/index.js';
	import { convertToFullName } from '$lib/utils';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import InfoIcon from '@lucide/svelte/icons/info';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import UserX from '@lucide/svelte/icons/user-x';
	import UsersIcon from '@lucide/svelte/icons/users';
	import WandSparkles from '@lucide/svelte/icons/wand-sparkles';

	let { data } = $props();

	let yearLevels = $derived(() => {
		const uniqueValues = [...new Set(data.students.map((s) => s.yearLevel))];
		return uniqueValues
			.map((value) => {
				const student = data.students.find((s) => s.yearLevel === value);
				return { id: student!.yearLevelId, value };
			})
			.sort((a, b) => {
				const aFmtd = parseInt(a.value);
				const bFmtd = parseInt(b.value);
				if (isNaN(aFmtd) && isNaN(bFmtd)) {
					return a.value.localeCompare(b.value);
				} else if (isNaN(aFmtd)) {
					return 1;
				} else if (isNaN(bFmtd)) {
					return -1;
				} else {
					return aFmtd - bFmtd;
				}
			});
	});

	let yearLevel = $derived(yearLevels().length > 0 ? yearLevels()[0] : null);
	let createDialogOpen = $state(false);
	let infoDialogOpen = $state(false);
	let deleteGroupTarget = $state<{ id: number; name: string } | null>(null);
	let groupName = $state('');
	let creatingGroup = $state(false);
	let deletingGroup = $state(false);
	let groupFilter = $state('');

	let yearLevelGroups = $derived(() => {
		if (!yearLevel) return [];
		return data.groups.filter((group) => group.yearLevelId === yearLevel?.id);
	});

	let filteredGroups = $derived(() => {
		const q = groupFilter.trim().toLowerCase();
		if (!q) return yearLevelGroups();
		return yearLevelGroups().filter((g) => g.name.toLowerCase().includes(q));
	});

	let yearLevelStudents = $derived(() => {
		if (!yearLevel) return [];
		return data.students.filter((s) => s.yearLevel === yearLevel?.value);
	});

	let assignedStudentIds = $derived(() => {
		const ids = new Set<string>();
		for (const g of yearLevelGroups()) {
			for (const s of data.studentsByGroupId[g.id] ?? []) {
				ids.add(s.id);
			}
		}
		return ids;
	});

	let unassignedCount = $derived(
		yearLevelStudents().filter((s) => !assignedStudentIds().has(s.id)).length,
	);

	function getStudentOptionsForGroup(groupId: number) {
		if (!yearLevel) return [];

		const studentsInGroup = data.studentsByGroupId[groupId] || [];
		const studentIdsInGroup = new Set(studentsInGroup.map((s) => s.id));

		const availableStudents = data.students.filter(
			(student) =>
				student.yearLevel === yearLevel?.value &&
				!studentIdsInGroup.has(student.id),
		);

		return availableStudents.map((student) => ({
			value: student.id,
			label: `${convertToFullName(
				student.firstName,
				student.middleName,
				student.lastName,
			)} (${student.email})`,
		}));
	}

	function getInitials(firstName: string, lastName: string) {
		return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
	}

	function openCreateDialog() {
		groupName = '';
		createDialogOpen = true;
	}

	async function createGroup() {
		if (!yearLevel || !groupName.trim()) return;

		creatingGroup = true;
		try {
			const formData = new FormData();
			formData.append('yearLevelId', yearLevel.id.toString());
			formData.append('name', groupName);

			const response = await fetch('?/createGroup', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				createDialogOpen = false;
				groupName = '';
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error creating group:', error);
		} finally {
			creatingGroup = false;
		}
	}

	async function addStudentToGroup(groupId: number, userId: string) {
		try {
			const formData = new FormData();
			formData.append('groupId', groupId.toString());
			formData.append('userId', userId);

			const response = await fetch('?/addStudent', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error adding student to group:', error);
		}
	}

	async function removeStudentFromGroup(groupId: number, userId: string) {
		try {
			const formData = new FormData();
			formData.append('groupId', groupId.toString());
			formData.append('userId', userId);

			const response = await fetch('?/removeStudent', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error removing student from group:', error);
		}
	}

	async function confirmDeleteGroup() {
		if (!deleteGroupTarget) return;
		deletingGroup = true;
		try {
			const formData = new FormData();
			formData.append('groupId', deleteGroupTarget.id.toString());

			const response = await fetch('?/deleteGroup', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				deleteGroupTarget = null;
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error deleting group:', error);
		} finally {
			deletingGroup = false;
		}
	}
</script>

<div class="space-y-6 p-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight">Student Groups</h1>
			<p class="text-muted-foreground text-sm">
				Organise students into the groups that map to the classes they will
				attend.
			</p>
		</div>
		<Button
			type="button"
			variant="outline"
			size="icon"
			onclick={() => (infoDialogOpen = true)}
			aria-label="Page information"
		>
			<InfoIcon />
		</Button>
	</div>

	<!-- Toolbar -->
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div class="flex flex-wrap items-end gap-2">
			<div class="grid gap-1.5">
				<Label for="year-level" class="text-xs">Year level</Label>
				<Select.Root
					type="single"
					name="yearLevel"
					onValueChange={(id) => {
						if (!id) {
							yearLevel = null;
						} else {
							const newYearLevel = yearLevels().find(
								(yl) => yl.id.toString() === id,
							);
							if (newYearLevel) {
								yearLevel = newYearLevel;
							}
						}
					}}
					value={yearLevel ? yearLevel.id.toString() : ''}
				>
					<Select.Trigger id="year-level" class="w-[180px]">
						{yearLevel ? yearLevel.value : 'Select a year level'}
					</Select.Trigger>
					<Select.Content>
						{#each yearLevels() as yl (yl.id)}
							<Select.Item value={yl.id.toString()} label={yl.value}>
								{yl.value}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="grid gap-1.5">
				<Label for="group-filter" class="text-xs">Filter groups</Label>
				<div class="relative">
					<Search
						class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
					/>
					<Input
						id="group-filter"
						bind:value={groupFilter}
						placeholder="Filter by group name..."
						class="w-[220px] pl-9"
						disabled={!yearLevel}
					/>
				</div>
			</div>
		</div>
		<div class="flex flex-wrap gap-2">
			<form method="POST" action="?/autoCreateGroups" use:enhance>
				<input
					type="hidden"
					name="yearLevelId"
					value={yearLevel ? yearLevel.id.toString() : ''}
				/>
				<Button type="submit" variant="secondary" disabled={!yearLevel}>
					<WandSparkles />
					Auto-create from subjects
				</Button>
			</form>
			<Button type="button" onclick={openCreateDialog} disabled={!yearLevel}>
				<PlusIcon />
				Create group
			</Button>
		</div>
	</div>

	{#if yearLevel}
		<!-- Summary cards -->
		<div class="grid gap-4 md:grid-cols-3">
			<Card.Root>
				<Card.Header
					class="flex flex-row items-center justify-between space-y-0 pb-2"
				>
					<Card.Title class="text-sm font-medium">Groups</Card.Title>
					<div class="bg-primary/10 rounded-lg p-2">
						<LayersIcon class="text-primary h-4 w-4" />
					</div>
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{yearLevelGroups().length}</div>
					<p class="text-muted-foreground text-xs">
						In {yearLevel.value}
					</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header
					class="flex flex-row items-center justify-between space-y-0 pb-2"
				>
					<Card.Title class="text-sm font-medium">Students assigned</Card.Title>
					<div class="bg-primary/10 rounded-lg p-2">
						<GraduationCap class="text-primary h-4 w-4" />
					</div>
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">
						{assignedStudentIds().size}
						<span class="text-muted-foreground text-base font-normal"
							>/ {yearLevelStudents().length}</span
						>
					</div>
					<p class="text-muted-foreground text-xs">
						Across all groups in this year level
					</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header
					class="flex flex-row items-center justify-between space-y-0 pb-2"
				>
					<Card.Title class="text-sm font-medium">Unassigned</Card.Title>
					<div class="bg-muted rounded-lg p-2">
						<UserX class="text-muted-foreground h-4 w-4" />
					</div>
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{unassignedCount}</div>
					<p class="text-muted-foreground text-xs">
						Students with no group yet
					</p>
				</Card.Content>
			</Card.Root>
		</div>

		{#if yearLevelGroups().length > 0}
			{#if filteredGroups().length > 0}
				<Accordion.Root type="single" class="w-full space-y-2">
					{#each filteredGroups() as group (group.id)}
						{@const groupStudents = data.studentsByGroupId[group.id] || []}
						{@const isEmpty = groupStudents.length === 0}
						<Accordion.Item
							value="group-{group.id}"
							class="bg-card rounded-lg border px-4"
						>
							<Accordion.Trigger class="w-full hover:no-underline">
								<div
									class="flex w-full flex-wrap items-center justify-between gap-3 pr-2"
								>
									<div class="flex items-center gap-3">
										<h3 class="text-lg font-semibold">{group.name}</h3>
										<Badge variant={isEmpty ? 'outline' : 'secondary'}>
											{groupStudents.length}
											{groupStudents.length === 1 ? 'student' : 'students'}
										</Badge>
										{#if isEmpty}
											<Badge variant="outline" class="text-muted-foreground">
												Empty
											</Badge>
										{/if}
									</div>
								</div>
							</Accordion.Trigger>
							<Accordion.Content class="space-y-4 pt-2">
								<!-- Add Student -->
								<div class="space-y-1.5">
									<Label class="text-muted-foreground text-xs">
										Add student
									</Label>
									{#key group.id}
										<Autocomplete
											options={getStudentOptionsForGroup(group.id)}
											placeholder="Search students to add..."
											searchPlaceholder="Search students..."
											emptyText="No available students found."
											onselect={(option) =>
												addStudentToGroup(group.id, option.value as string)}
											closeOnSelect={false}
										/>
									{/key}
								</div>

								<!-- Students List -->
								{#if groupStudents.length > 0}
									<div class="space-y-2">
										{#each groupStudents as student (student.id)}
											<Item.Root variant="outline">
												<Item.Content>
													<div class="flex items-center gap-3">
														<div
															class="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
														>
															{getInitials(student.firstName, student.lastName)}
														</div>
														<div class="min-w-0">
															<Item.Title class="truncate">
																{convertToFullName(
																	student.firstName,
																	student.middleName,
																	student.lastName,
																)}
															</Item.Title>
															<Item.Description class="truncate">
																{student.email}
															</Item.Description>
														</div>
													</div>
												</Item.Content>
												<Item.Actions>
													<Button
														variant="ghost"
														size="icon"
														aria-label="Remove from group"
														onclick={() =>
															removeStudentFromGroup(group.id, student.id)}
													>
														<Trash2Icon class="text-destructive h-4 w-4" />
													</Button>
												</Item.Actions>
											</Item.Root>
										{/each}
									</div>
								{:else}
									<div
										class="text-muted-foreground flex flex-col items-center gap-1.5 rounded-md border border-dashed py-6 text-center text-sm"
									>
										<UserPlus class="h-5 w-5 opacity-60" />
										<p>No students yet — use the search above to add some.</p>
									</div>
								{/if}

								<div class="flex justify-end border-t pt-3">
									<Button
										variant="outline"
										size="sm"
										class="text-destructive hover:text-destructive"
										onclick={(e) => {
											e.stopPropagation();
											deleteGroupTarget = { id: group.id, name: group.name };
										}}
									>
										<Trash2Icon class="h-4 w-4" />
										Delete group
									</Button>
								</div>
							</Accordion.Content>
						</Accordion.Item>
					{/each}
				</Accordion.Root>
			{:else}
				<Card.Root class="border-dashed">
					<Card.Content
						class="flex flex-col items-center gap-2 py-10 text-center"
					>
						<Search class="text-muted-foreground h-6 w-6 opacity-60" />
						<p class="text-sm font-medium">No groups match your filter</p>
						<p class="text-muted-foreground text-sm">
							Try a different search term or clear the filter.
						</p>
						<Button
							variant="outline"
							size="sm"
							onclick={() => (groupFilter = '')}
						>
							Clear filter
						</Button>
					</Card.Content>
				</Card.Root>
			{/if}
		{:else}
			<Card.Root class="border-dashed">
				<Card.Content
					class="flex flex-col items-center gap-3 py-12 text-center"
				>
					<div
						class="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full"
					>
						<UsersIcon class="text-primary h-6 w-6" />
					</div>
					<div class="space-y-1">
						<p class="text-lg font-semibold">No groups yet</p>
						<p class="text-muted-foreground max-w-sm text-sm">
							Create groups for {yearLevel.value} students, or auto-generate one group
							per subject offering for this year level.
						</p>
					</div>
					<div class="flex flex-wrap justify-center gap-2 pt-1">
						<form method="POST" action="?/autoCreateGroups" use:enhance>
							<input
								type="hidden"
								name="yearLevelId"
								value={yearLevel.id.toString()}
							/>
							<Button type="submit" variant="secondary">
								<WandSparkles />
								Auto-create from subjects
							</Button>
						</form>
						<Button type="button" onclick={openCreateDialog}>
							<PlusIcon />
							Create group
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}
	{:else}
		<Card.Root class="border-dashed">
			<Card.Content class="flex flex-col items-center gap-3 py-12 text-center">
				<div
					class="bg-muted flex h-14 w-14 items-center justify-center rounded-full"
				>
					<UsersIcon class="text-muted-foreground h-6 w-6" />
				</div>
				<div class="space-y-1">
					<p class="text-lg font-semibold">Select a year level</p>
					<p class="text-muted-foreground max-w-sm text-sm">
						Pick a year level above to view and manage its student groups.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<!-- Create Group Dialog -->
<Dialog.Root bind:open={createDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Create new group</Dialog.Title>
			<Dialog.Description>
				{#if yearLevel}
					Add a group to <span class="text-foreground font-medium"
						>{yearLevel.value}</span
					>.
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-2">
			<div class="grid gap-2">
				<Label for="create-name">Group name</Label>
				<Input
					id="create-name"
					bind:value={groupName}
					placeholder="e.g. Year 10 English"
					required
				/>
			</div>
		</div>
		<Dialog.Footer>
			<Button
				type="button"
				variant="outline"
				onclick={() => (createDialogOpen = false)}
			>
				Cancel
			</Button>
			<Button
				type="button"
				onclick={createGroup}
				disabled={!groupName.trim() || creatingGroup}
			>
				{creatingGroup ? 'Creating...' : 'Create group'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Group Confirmation -->
<Dialog.Root
	open={deleteGroupTarget !== null}
	onOpenChange={(open) => {
		if (!open) deleteGroupTarget = null;
	}}
>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Delete group?</Dialog.Title>
			<Dialog.Description>
				{#if deleteGroupTarget}
					This will permanently delete <span class="text-foreground font-medium"
						>{deleteGroupTarget.name}</span
					> and unassign all of its students. This action cannot be undone.
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button
				type="button"
				variant="outline"
				onclick={() => (deleteGroupTarget = null)}
			>
				Cancel
			</Button>
			<Button
				type="button"
				variant="destructive"
				onclick={confirmDeleteGroup}
				disabled={deletingGroup}
			>
				{deletingGroup ? 'Deleting...' : 'Delete group'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Page Information Dialog -->
<Dialog.Root bind:open={infoDialogOpen}>
	<Dialog.Content class="md:max-w-3xl">
		<Dialog.Header>
			<Dialog.Title>About student groups</Dialog.Title>
			<Dialog.Description>
				How groups feed into your timetable activities.
			</Dialog.Description>
		</Dialog.Header>
		<ol
			class="list-inside list-decimal space-y-2 rounded-md border p-4 text-sm"
		>
			<li>
				Create groups that represent the classes or subjects that students will
				be attending. For example, if there is a Year 10 English class, create a
				group named "Year 10 English".
			</li>
			<li>
				Assign students to these groups based on the classes they are enrolled
				in. A student taking Year 10 English and Year 10 Math would be assigned
				to both the "Year 10 English" and "Year 10 Math" groups.
			</li>
			<li>
				When creating activities, link them to the appropriate groups. For
				instance, the activity for the Year 10 English class should be
				associated with the "Year 10 English" group.
			</li>
			<li>
				The more groups the better. If you have 60 students that need to do
				English but you can only have 30 students per class, create two groups
				such as "Year 10 English A" and "Year 10 English B" so the students are
				split across different classes.
			</li>
		</ol>
	</Dialog.Content>
</Dialog.Root>
