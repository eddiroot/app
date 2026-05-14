<script lang="ts">
	import ClockIcon from '@lucide/svelte/icons/clock';
	import EditIcon from '@lucide/svelte/icons/edit';
	import InfoIcon from '@lucide/svelte/icons/info';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import TrashIcon from '@lucide/svelte/icons/trash';

	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import * as Item from '$lib/components/ui/item';
	import * as Sheet from '$lib/components/ui/sheet';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import * as Tabs from '$lib/components/ui/tabs';

	import { getEntry, getFormComponent } from './registry';

	let { data } = $props();
	let {
		timetableId,
		timetableDraftId,
		currentTimeConstraints,
		currentSpaceConstraints,
		availableTimeConstraints,
		availableSpaceConstraints,
		formData,
	} = $derived(data);

	const endpoint = $derived(
		`/admin/timetables/${timetableId}/draft/${timetableDraftId}/constraints`,
	);

	type AvailableConstraint = (typeof availableTimeConstraints)[number];
	type AssignedConstraint = (typeof currentTimeConstraints)[number];
	type TypeFilter = 'all' | 'time' | 'space';

	let activeTab = $state('active');
	let activeSearch = $state('');
	let activeTypeFilter = $state<TypeFilter>('all');
	let librarySearch = $state('');
	let libraryTypeFilter = $state<TypeFilter>('all');
	let infoOpen = $state(false);

	const typeFilters: { id: TypeFilter; label: string }[] = [
		{ id: 'all', label: 'All' },
		{ id: 'time', label: 'Time' },
		{ id: 'space', label: 'Space' },
	];

	let constraintStates = $state(new Map());

	$effect(() => {
		[...currentTimeConstraints, ...currentSpaceConstraints].forEach(
			(constraint) => {
				constraintStates.set(constraint.tt_draft_con.id, {
					active: constraint.tt_draft_con.active,
					isUpdating: false,
					originalActive: constraint.tt_draft_con.active,
				});
			},
		);
	});

	// Sheet state — used for both Add and Edit.
	let sheetOpen = $state(false);
	let sheetMode = $state<'add' | 'edit'>('add');
	let sheetFetName = $state<string | null>(null);
	let sheetTitle = $state('');
	let sheetDescription = $state('');
	let sheetInitialValues = $state<Record<string, unknown>>({});
	let sheetTtConstraintId = $state<number | null>(null);

	const totalActive = $derived(
		currentTimeConstraints.length + currentSpaceConstraints.length,
	);
	const totalAvailable = $derived(
		availableTimeConstraints.length + availableSpaceConstraints.length,
	);

	function matchesType(type: string, filter: TypeFilter) {
		return filter === 'all' || type === filter;
	}

	function summaryFor(constraint: AssignedConstraint) {
		const entry = getEntry(constraint.con.fetName);
		const summary = entry?.summarize?.(
			constraint.tt_draft_con.parameters,
			formData,
		);
		return summary ?? constraint.con.description;
	}

	const filteredActive = $derived.by(() => {
		const all = [...currentTimeConstraints, ...currentSpaceConstraints];
		const q = activeSearch.trim().toLowerCase();
		return all.filter((c) => {
			if (!matchesType(c.con.type, activeTypeFilter)) return false;
			if (!q) return true;
			const haystack = `${c.con.friendlyName} ${summaryFor(c)}`.toLowerCase();
			return haystack.includes(q);
		});
	});

	const filteredActiveTime = $derived(
		filteredActive.filter((c) => c.con.type === 'time'),
	);
	const filteredActiveSpace = $derived(
		filteredActive.filter((c) => c.con.type === 'space'),
	);

	const filteredLibrary = $derived.by(() => {
		const all = [...availableTimeConstraints, ...availableSpaceConstraints];
		const q = librarySearch.trim().toLowerCase();
		return all.filter((c) => {
			if (!matchesType(c.type, libraryTypeFilter)) return false;
			if (!q) return true;
			const haystack = `${c.friendlyName} ${c.description}`.toLowerCase();
			return haystack.includes(q);
		});
	});

	const filteredLibraryTime = $derived(
		filteredLibrary.filter((c) => c.type === 'time'),
	);
	const filteredLibrarySpace = $derived(
		filteredLibrary.filter((c) => c.type === 'space'),
	);

	function openAddSheet(constraint: AvailableConstraint) {
		sheetMode = 'add';
		sheetFetName = constraint.fetName;
		sheetTitle = `Add Constraint: ${constraint.friendlyName}`;
		sheetDescription = constraint.description;
		sheetInitialValues = {};
		sheetTtConstraintId = null;
		sheetOpen = true;
	}

	function openEditSheet(constraint: AssignedConstraint) {
		sheetMode = 'edit';
		sheetFetName = constraint.con.fetName;
		sheetTitle = `Edit Constraint: ${constraint.con.friendlyName}`;
		sheetDescription = constraint.con.description;
		sheetInitialValues =
			(constraint.tt_draft_con.parameters as Record<string, unknown>) ?? {};
		sheetTtConstraintId = constraint.tt_draft_con.id;
		sheetOpen = true;
	}

	function closeSheet() {
		sheetOpen = false;
		sheetFetName = null;
		sheetTtConstraintId = null;
		sheetInitialValues = {};
	}

	async function handleSheetSubmit(values: Record<string, unknown>) {
		if (!sheetFetName) return;

		const request =
			sheetMode === 'add'
				? {
						method: 'POST',
						body: JSON.stringify({ fetName: sheetFetName, parameters: values }),
					}
				: {
						method: 'PATCH',
						body: JSON.stringify({
							ttConstraintId: sheetTtConstraintId,
							parameters: values,
						}),
					};

		try {
			const response = await fetch(endpoint, {
				...request,
				headers: { 'Content-Type': 'application/json' },
			});
			const result = await response.json();
			if (result.success) {
				window.location.reload();
			} else {
				console.error('Failed to save constraint:', result.error);
			}
		} catch (error) {
			console.error('Error saving constraint:', error);
		} finally {
			closeSheet();
		}
	}

	async function handleToggleActive(
		ttConstraintId: number,
		newActiveState: boolean,
	) {
		const currentState = constraintStates.get(ttConstraintId);
		if (!currentState || currentState.isUpdating) return;

		constraintStates.set(ttConstraintId, {
			...currentState,
			active: newActiveState,
			isUpdating: true,
		});

		try {
			const response = await fetch(endpoint, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ttConstraintId, active: newActiveState }),
			});
			const result = await response.json();

			if (result.success) {
				constraintStates.set(ttConstraintId, {
					active: newActiveState,
					isUpdating: false,
					originalActive: newActiveState,
				});
			} else {
				constraintStates.set(ttConstraintId, {
					...currentState,
					active: currentState.originalActive,
					isUpdating: false,
				});
				console.error('Failed to update constraint:', result.error);
			}
		} catch (error) {
			constraintStates.set(ttConstraintId, {
				...currentState,
				active: currentState.originalActive,
				isUpdating: false,
			});
			console.error('Error updating constraint:', error);
		}
	}

	async function handleDelete(ttConstraintId: number) {
		if (
			!confirm(
				'Are you sure you want to remove this constraint from the timetable?',
			)
		) {
			return;
		}

		try {
			const response = await fetch(endpoint, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ttConstraintId }),
			});
			const result = await response.json();

			if (result.success) {
				window.location.reload();
			} else {
				console.error('Failed to delete constraint:', result.error);
				alert('Failed to delete constraint. Please try again.');
			}
		} catch (error) {
			console.error('Error deleting constraint:', error);
			alert('Error deleting constraint. Please try again.');
		}
	}

	const SheetForm = $derived(
		sheetFetName ? getFormComponent(sheetFetName) : null,
	);
</script>

<div class="space-y-6 p-6">
	<!-- Page header -->
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight">Constraints</h1>
			<p class="text-muted-foreground text-sm">
				Configure the timetabling rules the generator must respect.
			</p>
		</div>
		<Button
			type="button"
			variant="outline"
			size="icon"
			onclick={() => (infoOpen = true)}
			aria-label="About constraints"
		>
			<InfoIcon />
		</Button>
	</div>

	<Tabs.Root bind:value={activeTab}>
		<Tabs.List class="grid w-full max-w-md grid-cols-2">
			<Tabs.Trigger value="active" class="gap-2">
				Active
				<Badge variant="secondary" class="text-xs">{totalActive}</Badge>
			</Tabs.Trigger>
			<Tabs.Trigger value="library" class="gap-2">
				Library
				<Badge variant="secondary" class="text-xs">{totalAvailable}</Badge>
			</Tabs.Trigger>
		</Tabs.List>

		<!-- ACTIVE TAB -->
		<Tabs.Content value="active" class="mt-6 space-y-4">
			<div class="flex flex-wrap items-center gap-3">
				<div class="relative max-w-sm min-w-[16rem] flex-1">
					<SearchIcon
						class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
					/>
					<Input
						bind:value={activeSearch}
						placeholder="Search active constraints..."
						class="pl-9"
					/>
				</div>
				<div class="flex items-center gap-1">
					{#each typeFilters as filter (filter.id)}
						<Button
							variant={activeTypeFilter === filter.id ? 'default' : 'outline'}
							size="sm"
							onclick={() => (activeTypeFilter = filter.id)}
						>
							{filter.label}
						</Button>
					{/each}
				</div>
			</div>

			{#if totalActive === 0}
				<Card.Root class="border-dashed">
					<Card.Content
						class="flex flex-col items-center gap-3 py-12 text-center"
					>
						<div
							class="bg-muted flex h-14 w-14 items-center justify-center rounded-full"
						>
							<SlidersHorizontalIcon class="text-muted-foreground h-6 w-6" />
						</div>
						<div class="space-y-1">
							<p class="text-lg font-semibold">No active constraints</p>
							<p class="text-muted-foreground max-w-sm text-sm">
								Open the Library to browse and add constraints to this
								timetable.
							</p>
						</div>
						<Button size="sm" onclick={() => (activeTab = 'library')}>
							Browse Library
						</Button>
					</Card.Content>
				</Card.Root>
			{:else if filteredActive.length === 0}
				<Card.Root class="border-dashed">
					<Card.Content
						class="flex flex-col items-center gap-2 py-10 text-center"
					>
						<SearchIcon class="text-muted-foreground h-6 w-6 opacity-60" />
						<p class="text-sm font-medium">No constraints match your filter</p>
						<Button
							variant="outline"
							size="sm"
							onclick={() => {
								activeSearch = '';
								activeTypeFilter = 'all';
							}}
						>
							Clear filters
						</Button>
					</Card.Content>
				</Card.Root>
			{:else}
				{#if filteredActiveTime.length > 0}
					<div class="space-y-2">
						<div class="flex items-center gap-2 px-1">
							<ClockIcon class="text-muted-foreground h-4 w-4" />
							<h2 class="text-sm font-semibold tracking-tight">
								Time ({filteredActiveTime.length})
							</h2>
						</div>
						<div class="space-y-2">
							{#each filteredActiveTime as constraint (constraint.tt_draft_con.id)}
								{@const state = constraintStates.get(
									constraint.tt_draft_con.id,
								)}
								<Item.Root variant="outline">
									<Item.Media>
										<div
											class="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg"
										>
											<ClockIcon class="h-4 w-4" />
										</div>
									</Item.Media>
									<Item.Content>
										<div class="flex items-center gap-2">
											<Item.Title class="truncate">
												{constraint.con.friendlyName}
											</Item.Title>
											{#if !constraint.con.optional}
												<Badge variant="secondary" class="text-xs">
													Mandatory
												</Badge>
											{/if}
											{#if constraint.con.repeatable}
												<Badge variant="outline" class="text-xs">
													Repeatable
												</Badge>
											{/if}
										</div>
										<Item.Description class="truncate">
											{summaryFor(constraint)}
										</Item.Description>
									</Item.Content>
									<Item.Actions class="gap-1">
										{#if constraint.con.optional}
											<Switch
												checked={state?.active ??
													constraint.tt_draft_con.active}
												disabled={state?.isUpdating ?? false}
												onCheckedChange={(checked) =>
													handleToggleActive(
														constraint.tt_draft_con.id,
														checked,
													)}
												aria-label="Toggle constraint active"
											/>
										{/if}
										<Button
											variant="ghost"
											size="icon"
											onclick={() => openEditSheet(constraint)}
											aria-label="Edit constraint"
										>
											<EditIcon class="h-4 w-4" />
										</Button>
										{#if constraint.con.optional}
											<Button
												variant="ghost"
												size="icon"
												onclick={() => handleDelete(constraint.tt_draft_con.id)}
												aria-label="Remove constraint"
											>
												<TrashIcon class="h-4 w-4" />
											</Button>
										{/if}
									</Item.Actions>
								</Item.Root>
							{/each}
						</div>
					</div>
				{/if}

				{#if filteredActiveSpace.length > 0}
					<div class="space-y-2">
						<div class="flex items-center gap-2 px-1">
							<MapPinIcon class="text-muted-foreground h-4 w-4" />
							<h2 class="text-sm font-semibold tracking-tight">
								Space ({filteredActiveSpace.length})
							</h2>
						</div>
						<div class="space-y-2">
							{#each filteredActiveSpace as constraint (constraint.tt_draft_con.id)}
								{@const state = constraintStates.get(
									constraint.tt_draft_con.id,
								)}
								<Item.Root variant="outline">
									<Item.Media>
										<div
											class="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg"
										>
											<MapPinIcon class="h-4 w-4" />
										</div>
									</Item.Media>
									<Item.Content>
										<div class="flex items-center gap-2">
											<Item.Title class="truncate">
												{constraint.con.friendlyName}
											</Item.Title>
											{#if !constraint.con.optional}
												<Badge variant="secondary" class="text-xs">
													Mandatory
												</Badge>
											{/if}
											{#if constraint.con.repeatable}
												<Badge variant="outline" class="text-xs">
													Repeatable
												</Badge>
											{/if}
										</div>
										<Item.Description class="truncate">
											{summaryFor(constraint)}
										</Item.Description>
									</Item.Content>
									<Item.Actions class="gap-1">
										{#if constraint.con.optional}
											<Switch
												checked={state?.active ??
													constraint.tt_draft_con.active}
												disabled={state?.isUpdating ?? false}
												onCheckedChange={(checked) =>
													handleToggleActive(
														constraint.tt_draft_con.id,
														checked,
													)}
												aria-label="Toggle constraint active"
											/>
										{/if}
										<Button
											variant="ghost"
											size="icon"
											onclick={() => openEditSheet(constraint)}
											aria-label="Edit constraint"
										>
											<EditIcon class="h-4 w-4" />
										</Button>
										{#if constraint.con.optional}
											<Button
												variant="ghost"
												size="icon"
												onclick={() => handleDelete(constraint.tt_draft_con.id)}
												aria-label="Remove constraint"
											>
												<TrashIcon class="h-4 w-4" />
											</Button>
										{/if}
									</Item.Actions>
								</Item.Root>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</Tabs.Content>

		<!-- LIBRARY TAB -->
		<Tabs.Content value="library" class="mt-6 space-y-4">
			<div class="flex flex-wrap items-center gap-3">
				<div class="relative max-w-sm min-w-[16rem] flex-1">
					<SearchIcon
						class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
					/>
					<Input
						bind:value={librarySearch}
						placeholder="Search library..."
						class="pl-9"
					/>
				</div>
				<div class="flex items-center gap-1">
					{#each typeFilters as filter (filter.id)}
						<Button
							variant={libraryTypeFilter === filter.id ? 'default' : 'outline'}
							size="sm"
							onclick={() => (libraryTypeFilter = filter.id)}
						>
							{filter.label}
						</Button>
					{/each}
				</div>
			</div>

			{#if totalAvailable === 0}
				<Card.Root class="border-dashed">
					<Card.Content
						class="flex flex-col items-center gap-3 py-12 text-center"
					>
						<div
							class="bg-muted flex h-14 w-14 items-center justify-center rounded-full"
						>
							<SlidersHorizontalIcon class="text-muted-foreground h-6 w-6" />
						</div>
						<div class="space-y-1">
							<p class="text-lg font-semibold">All constraints configured</p>
							<p class="text-muted-foreground max-w-sm text-sm">
								Every available constraint type has already been added to this
								timetable.
							</p>
						</div>
					</Card.Content>
				</Card.Root>
			{:else if filteredLibrary.length === 0}
				<Card.Root class="border-dashed">
					<Card.Content
						class="flex flex-col items-center gap-2 py-10 text-center"
					>
						<SearchIcon class="text-muted-foreground h-6 w-6 opacity-60" />
						<p class="text-sm font-medium">No constraints match your filter</p>
						<Button
							variant="outline"
							size="sm"
							onclick={() => {
								librarySearch = '';
								libraryTypeFilter = 'all';
							}}
						>
							Clear filters
						</Button>
					</Card.Content>
				</Card.Root>
			{:else}
				{#if filteredLibraryTime.length > 0}
					<div class="space-y-2">
						<div class="flex items-center gap-2 px-1">
							<ClockIcon class="text-muted-foreground h-4 w-4" />
							<h2 class="text-sm font-semibold tracking-tight">
								Time ({filteredLibraryTime.length})
							</h2>
						</div>
						<div class="space-y-2">
							{#each filteredLibraryTime as constraint (constraint.fetName)}
								<Item.Root variant="outline">
									<Item.Media>
										<div
											class="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg"
										>
											<ClockIcon class="h-4 w-4" />
										</div>
									</Item.Media>
									<Item.Content>
										<div class="flex items-center gap-2">
											<Item.Title class="truncate">
												{constraint.friendlyName}
											</Item.Title>
											{#if constraint.repeatable}
												<Badge variant="outline" class="text-xs">
													Repeatable
												</Badge>
											{:else}
												<Badge variant="secondary" class="text-xs">
													One-time
												</Badge>
											{/if}
										</div>
										<Item.Description class="line-clamp-2">
											{constraint.description}
										</Item.Description>
									</Item.Content>
									<Item.Actions>
										<Button size="sm" onclick={() => openAddSheet(constraint)}>
											<PlusIcon class="mr-1 h-4 w-4" />
											Add
										</Button>
									</Item.Actions>
								</Item.Root>
							{/each}
						</div>
					</div>
				{/if}

				{#if filteredLibrarySpace.length > 0}
					<div class="space-y-2">
						<div class="flex items-center gap-2 px-1">
							<MapPinIcon class="text-muted-foreground h-4 w-4" />
							<h2 class="text-sm font-semibold tracking-tight">
								Space ({filteredLibrarySpace.length})
							</h2>
						</div>
						<div class="space-y-2">
							{#each filteredLibrarySpace as constraint (constraint.fetName)}
								<Item.Root variant="outline">
									<Item.Media>
										<div
											class="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg"
										>
											<MapPinIcon class="h-4 w-4" />
										</div>
									</Item.Media>
									<Item.Content>
										<div class="flex items-center gap-2">
											<Item.Title class="truncate">
												{constraint.friendlyName}
											</Item.Title>
											{#if constraint.repeatable}
												<Badge variant="outline" class="text-xs">
													Repeatable
												</Badge>
											{:else}
												<Badge variant="secondary" class="text-xs">
													One-time
												</Badge>
											{/if}
										</div>
										<Item.Description class="line-clamp-2">
											{constraint.description}
										</Item.Description>
									</Item.Content>
									<Item.Actions>
										<Button size="sm" onclick={() => openAddSheet(constraint)}>
											<PlusIcon class="mr-1 h-4 w-4" />
											Add
										</Button>
									</Item.Actions>
								</Item.Root>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>

<!-- Add / Edit Constraint Sheet -->
<Sheet.Root bind:open={sheetOpen}>
	<Sheet.Content
		class="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
		side="right"
	>
		<Sheet.Header class="border-b px-6 py-4">
			<Sheet.Title>{sheetTitle}</Sheet.Title>
			<Sheet.Description class="text-sm">
				{sheetDescription}
			</Sheet.Description>
		</Sheet.Header>
		<div class="flex-1 overflow-y-auto px-6 py-4">
			{#if SheetForm}
				<SheetForm
					onSubmit={handleSheetSubmit}
					onCancel={closeSheet}
					initialValues={sheetInitialValues}
					{formData}
					submitLabel={sheetMode === 'edit' ? 'Save Changes' : 'Add Constraint'}
				/>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Info dialog -->
<Dialog.Root bind:open={infoOpen}>
	<Dialog.Content class="md:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>About constraints</Dialog.Title>
			<Dialog.Description>
				How constraints shape timetable generation.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 text-sm">
			<div class="rounded-md border p-4">
				<p class="font-medium">Active vs Library</p>
				<p class="text-muted-foreground mt-1">
					The <span class="text-foreground font-medium">Active</span> tab lists
					constraints currently attached to this timetable draft. The
					<span class="text-foreground font-medium">Library</span> tab is the catalogue
					of constraint types you can add.
				</p>
			</div>
			<div class="rounded-md border p-4">
				<p class="font-medium">Time vs Space</p>
				<p class="text-muted-foreground mt-1">
					<ClockIcon class="mr-1 mb-0.5 inline-block h-3.5 w-3.5" />
					<span class="text-foreground font-medium">Time</span> constraints
					govern when activities run (gaps, ordering, availability).
					<MapPinIcon class="mr-1 mb-0.5 ml-2 inline-block h-3.5 w-3.5" />
					<span class="text-foreground font-medium">Space</span> constraints govern
					where activities run (rooms, buildings, capacities).
				</p>
			</div>
			<div class="rounded-md border p-4">
				<p class="font-medium">Mandatory, optional, repeatable</p>
				<p class="text-muted-foreground mt-1">
					<span class="text-foreground font-medium">Mandatory</span> constraints
					are required by FET and cannot be removed.
					<span class="text-foreground font-medium">Optional</span> constraints
					can be toggled on/off or removed.
					<span class="text-foreground font-medium">Repeatable</span> constraints
					can be added multiple times with different parameters (e.g. one per subject).
				</p>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
