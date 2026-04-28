<script lang="ts">
	import EditIcon from '@lucide/svelte/icons/edit';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash';

	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import * as Dialog from '$lib/components/ui/dialog';

	import { getFormComponent } from './registry';

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

	// Modal state — used for both Add and Edit.
	let modalOpen = $state(false);
	let modalMode = $state<'add' | 'edit'>('add');
	let modalFetName = $state<string | null>(null);
	let modalTitle = $state('');
	let modalInitialValues = $state<Record<string, unknown>>({});
	let modalTtConstraintId = $state<number | null>(null);

	function openAddModal(constraint: AvailableConstraint) {
		modalMode = 'add';
		modalFetName = constraint.fetName;
		modalTitle = `Add Constraint: ${constraint.friendlyName}`;
		modalInitialValues = {};
		modalTtConstraintId = null;
		modalOpen = true;
	}

	function openEditModal(constraint: AssignedConstraint) {
		modalMode = 'edit';
		modalFetName = constraint.con.fetName;
		modalTitle = `Edit Constraint: ${constraint.con.friendlyName}`;
		modalInitialValues =
			(constraint.tt_draft_con.parameters as Record<string, unknown>) ?? {};
		modalTtConstraintId = constraint.tt_draft_con.id;
		modalOpen = true;
	}

	function closeModal() {
		modalOpen = false;
		modalFetName = null;
		modalTtConstraintId = null;
		modalInitialValues = {};
	}

	async function handleModalSubmit(values: Record<string, unknown>) {
		if (!modalFetName) return;

		const request =
			modalMode === 'add'
				? {
						method: 'POST',
						body: JSON.stringify({
							fetName: modalFetName,
							parameters: values,
						}),
					}
				: {
						method: 'PATCH',
						body: JSON.stringify({
							ttConstraintId: modalTtConstraintId,
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
			closeModal();
		}
	}

	async function handleToggleConstraintActive(
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
				body: JSON.stringify({
					ttConstraintId,
					active: newActiveState,
				}),
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

	async function handleDeleteConstraint(ttConstraintId: number) {
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

	const ModalForm = $derived(modalFetName ? getFormComponent(modalFetName) : null);
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl leading-tight font-bold">Timetabling Constraints</h1>
		<div class="text-muted-foreground text-sm">
			Timetable ID: {timetableId}
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Active Time Constraints -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-xl leading-tight font-bold">Active Time Constraints</h2>
				<span class="text-muted-foreground text-sm">
					{currentTimeConstraints.length} constraints assigned
				</span>
			</div>
			<Card.Root>
				<Card.Content class="p-4">
					{#if currentTimeConstraints.length === 0}
						<p class="text-muted-foreground py-8 text-center">
							No time constraints assigned to this timetable yet.
						</p>
					{:else}
						<div class="space-y-3">
							{#each currentTimeConstraints as constraint (constraint.tt_draft_con.id)}
								<div
									class="flex items-center justify-between rounded-lg border p-3"
								>
									<div class="flex-1">
										<h3 class="font-medium">{constraint.con.friendlyName}</h3>
										<p class="text-muted-foreground text-sm">
											{constraint.con.description}
										</p>
									</div>
									<div class="flex items-center gap-3">
										{#if constraint.con.optional}
											{@const state = constraintStates.get(
												constraint.tt_draft_con.id,
											)}
											<Checkbox
												checked={state?.active ??
													constraint.tt_draft_con.active}
												disabled={state?.isUpdating ?? false}
												onCheckedChange={(checked) =>
													handleToggleConstraintActive(
														constraint.tt_draft_con.id,
														checked === true,
													)}
											/>
										{:else}
											<span class="text-muted-foreground text-xs">
												Mandatory
											</span>
										{/if}
										<div class="flex gap-1">
											<Button
												variant="ghost"
												size="sm"
												onclick={() => openEditModal(constraint)}
											>
												<EditIcon class="h-4 w-4" />
											</Button>
											{#if constraint.con.optional}
												<Button
													variant="ghost"
													size="sm"
													onclick={() =>
														handleDeleteConstraint(constraint.tt_draft_con.id)}
												>
													<TrashIcon class="h-4 w-4" />
												</Button>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Active Space Constraints -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-xl leading-tight font-bold">
					Active Space Constraints
				</h2>
				<span class="text-muted-foreground text-sm">
					{currentSpaceConstraints.length} constraints assigned
				</span>
			</div>
			<Card.Root>
				<Card.Content class="p-4">
					{#if currentSpaceConstraints.length === 0}
						<p class="text-muted-foreground py-8 text-center">
							No space constraints assigned to this timetable yet.
						</p>
					{:else}
						<div class="space-y-3">
							{#each currentSpaceConstraints as constraint (constraint.tt_draft_con.id)}
								<div
									class="flex items-center justify-between rounded-lg border p-3"
								>
									<div class="flex-1">
										<h3 class="font-medium">{constraint.con.friendlyName}</h3>
										<p class="text-muted-foreground text-sm">
											{constraint.con.description}
										</p>
									</div>
									<div class="flex items-center gap-3">
										{#if constraint.con.optional}
											{@const state = constraintStates.get(
												constraint.tt_draft_con.id,
											)}
											<Checkbox
												checked={state?.active ??
													constraint.tt_draft_con.active}
												disabled={state?.isUpdating ?? false}
												onCheckedChange={(checked) =>
													handleToggleConstraintActive(
														constraint.tt_draft_con.id,
														checked === true,
													)}
											/>
										{:else}
											<span class="text-muted-foreground text-xs">
												Mandatory
											</span>
										{/if}
										<div class="flex gap-1">
											<Button
												variant="ghost"
												size="sm"
												onclick={() => openEditModal(constraint)}
											>
												<EditIcon class="h-4 w-4" />
											</Button>
											{#if constraint.con.optional}
												<Button
													variant="ghost"
													size="sm"
													onclick={() =>
														handleDeleteConstraint(constraint.tt_draft_con.id)}
												>
													<TrashIcon class="h-4 w-4" />
												</Button>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Available Time Constraints -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-xl leading-tight font-bold">
					Available Time Constraints
				</h2>
				<span class="text-muted-foreground text-sm">
					{availableTimeConstraints.length} constraints available
				</span>
			</div>
			<Card.Root>
				<Card.Content class="p-4">
					{#if availableTimeConstraints.length === 0}
						<p class="text-muted-foreground py-8 text-center">
							All time constraints are already assigned to this timetable.
						</p>
					{:else}
						<div class="space-y-3">
							{#each availableTimeConstraints as constraint (constraint.fetName)}
								<div class="space-y-3 rounded-lg border p-4">
									<div>
										<div class="flex items-center justify-between">
											<h3 class="font-semibold">{constraint.friendlyName}</h3>
											{#if !constraint.repeatable}
												<span
													class="text-muted-foreground bg-muted rounded-full px-2 py-1 text-xs"
												>
													One-time
												</span>
											{/if}
										</div>
										<p class="text-muted-foreground mt-1 text-sm">
											{constraint.description}
										</p>
									</div>
									<Button
										size="sm"
										class="w-full"
										onclick={() => openAddModal(constraint)}
									>
										<PlusIcon class="mr-2 h-4 w-4" />
										Add Constraint
									</Button>
								</div>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Available Space Constraints -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-xl leading-tight font-bold">
					Available Space Constraints
				</h2>
				<span class="text-muted-foreground text-sm">
					{availableSpaceConstraints.length} constraints available
				</span>
			</div>
			<Card.Root>
				<Card.Content class="p-4">
					{#if availableSpaceConstraints.length === 0}
						<p class="text-muted-foreground py-8 text-center">
							All space constraints are already assigned to this timetable.
						</p>
					{:else}
						<div class="space-y-3">
							{#each availableSpaceConstraints as constraint (constraint.fetName)}
								<div class="space-y-3 rounded-lg border p-4">
									<div>
										<div class="flex items-center justify-between">
											<h3 class="font-semibold">{constraint.friendlyName}</h3>
											{#if !constraint.repeatable}
												<span
													class="text-muted-foreground bg-muted rounded-full px-2 py-1 text-xs"
												>
													One-time
												</span>
											{/if}
										</div>
										<p class="text-muted-foreground mt-1 text-sm">
											{constraint.description}
										</p>
									</div>
									<Button
										size="sm"
										class="w-full"
										onclick={() => openAddModal(constraint)}
									>
										<PlusIcon class="mr-2 h-4 w-4" />
										Add Constraint
									</Button>
								</div>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>

<!-- Add / Edit Constraint Modal -->
<Dialog.Root bind:open={modalOpen}>
	<Dialog.Content class="max-h-[80vh] max-w-2xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>{modalTitle}</Dialog.Title>
			<Dialog.Description>
				Configure the parameters for this constraint.
			</Dialog.Description>
		</Dialog.Header>
		{#if ModalForm}
			<ModalForm
				onSubmit={handleModalSubmit}
				onCancel={closeModal}
				initialValues={modalInitialValues}
				{formData}
				submitLabel={modalMode === 'edit' ? 'Save Changes' : 'Add Constraint'}
			/>
		{/if}
	</Dialog.Content>
</Dialog.Root>
