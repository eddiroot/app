<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import EditIcon from '@lucide/svelte/icons/edit';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash';
	// Import constraint form mapping utilities
	import { getConstraintFormComponent, requiresEnhancedProps } from '$lib/constraint-form-mapping';
	// Fallback generic form
	import type { Constraint } from '$lib/server/db/schema/timetables';

	let { data } = $props();
	let {
		user,
		timetableId,
		timetableDraftId,
		currentTimeConstraints,
		currentSpaceConstraints,
		availableTimeConstraints,
		availableSpaceConstraints,
		formData
	} = data;

	// Create reactive state for constraint active status with optimistic updates
	let constraintStates = $state(new Map());

	// Initialize constraint states
	$effect(() => {
		// Initialize states for current constraints
		[...currentTimeConstraints, ...currentSpaceConstraints].forEach((constraint) => {
			constraintStates.set(`${constraint.id}`, {
				active: constraint.active,
				isUpdating: false,
				originalActive: constraint.active
			});
		});
	});

	// Modal state
	let addConstraintModalOpen = $state(false);
	let constraintToAdd = $state<Constraint | null>(null);

	// Form handlers
	function openAddConstraintModal(constraint: Constraint) {
		constraintToAdd = constraint;
		addConstraintModalOpen = true;
	}

	function closeAddConstraintModal() {
		addConstraintModalOpen = false;
		constraintToAdd = null;
	}

	// Handle adding a constraint to the timetable
	async function handleAddConstraint(formData: Record<string, unknown>) {
		if (!constraintToAdd) return;

		try {
			const response = await fetch(
				`/admin/timetables/${timetableId}/${timetableDraftId}/constraints`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						constraintId: constraintToAdd.id,
						parameters: formData
					})
				}
			);

			const result = await response.json();

			if (result.success) {
				// Refresh the page to show the updated constraints
				window.location.reload();
			} else {
				console.error('Failed to add constraint:', result.error);
				// You might want to show a toast notification here
			}
		} catch (error) {
			console.error('Error adding constraint:', error);
			// You might want to show a toast notification here
		} finally {
			closeAddConstraintModal();
		}
	}

	// Handle toggling constraint active status
	async function handleToggleConstraintActive(constraintId: number, newActiveState: boolean) {
		const stateKey = `${constraintId}`;
		const currentState = constraintStates.get(stateKey);

		if (!currentState || currentState.isUpdating) return;

		// Optimistic update
		constraintStates.set(stateKey, {
			...currentState,
			active: newActiveState,
			isUpdating: true
		});

		try {
			const response = await fetch(
				`/admin/timetables/${timetableId}/${timetableDraftId}/constraints`,
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						constraintId: constraintId,
						active: newActiveState
					})
				}
			);

			const result = await response.json();

			if (result.success) {
				// Update successful - finalize the state
				constraintStates.set(stateKey, {
					active: newActiveState,
					isUpdating: false,
					originalActive: newActiveState
				});
			} else {
				// Rollback optimistic update
				constraintStates.set(stateKey, {
					...currentState,
					active: currentState.originalActive,
					isUpdating: false
				});
				console.error('Failed to update constraint:', result.error);
			}
		} catch (error) {
			// Rollback optimistic update
			constraintStates.set(stateKey, {
				...currentState,
				active: currentState.originalActive,
				isUpdating: false
			});
			console.error('Error updating constraint:', error);
		}
	}

	// Handle deleting a constraint from the timetable
	async function handleDeleteConstraint(ttConstraintId: number) {
		if (!confirm('Are you sure you want to remove this constraint from the timetable?')) {
			return;
		}

		try {
			const response = await fetch(
				`/admin/timetables/${timetableId}/${timetableDraftId}/constraints`,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						ttConstraintId: ttConstraintId
					})
				}
			);

			const result = await response.json();

			if (result.success) {
				// Refresh the page to show the updated constraints
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

	// Get the appropriate form component for a constraint using the mapping
	function getFormComponent(constraint: Constraint) {
		return getConstraintFormComponent(constraint.FETName);
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl leading-tight font-bold">Timetabling Constraints</h1>
		<div class="text-muted-foreground text-sm">
			Timetable ID: {timetableId}
		</div>
		<div>
			<Button href="/admin/constraintinfo" variant="outline">Info & Recommendations</Button>
		</div>
	</div>

	<!-- 2x2 Grid Layout -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Top Row: Active Constraints -->

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
							{#each currentTimeConstraints as constraint}
								<div class="flex items-center justify-between rounded-lg border p-3">
									<div class="flex-1">
										<h3 class="font-medium">{constraint.friendlyName}</h3>
										<p class="text-muted-foreground text-sm">
											{constraint.description}
										</p>
									</div>
									<div class="flex items-center gap-3">
										{#if constraint.optional}
											{@const state = constraintStates.get(`${constraint.id}`)}
											<Checkbox
												checked={state?.active ?? constraint.active}
												disabled={state?.isUpdating ?? false}
												onCheckedChange={(checked) =>
													handleToggleConstraintActive(constraint.id, checked === true)}
											/>
										{:else}
											<span class="text-muted-foreground text-xs">Mandatory</span>
										{/if}
										<div class="flex gap-1">
											<Button variant="ghost" size="sm" onclick={() => {}}>
												<EditIcon class="h-4 w-4" />
											</Button>
											{#if constraint.optional}
												<Button
													variant="ghost"
													size="sm"
													onclick={() => handleDeleteConstraint(constraint.id)}
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
				<h2 class="text-xl leading-tight font-bold">Active Space Constraints</h2>
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
							{#each currentSpaceConstraints as constraint}
								<div class="flex items-center justify-between rounded-lg border p-3">
									<div class="flex-1">
										<h3 class="font-medium">{constraint.friendlyName}</h3>
										<p class="text-muted-foreground text-sm">
											{constraint.description}
										</p>
									</div>
									<div class="flex items-center gap-3">
										{#if constraint.optional}
											{@const state = constraintStates.get(`${constraint.id}`)}
											<Checkbox
												checked={state?.active ?? constraint.active}
												disabled={state?.isUpdating ?? false}
												onCheckedChange={(checked) =>
													handleToggleConstraintActive(constraint.id, checked === true)}
											/>
										{:else}
											<span class="text-muted-foreground text-xs">Mandatory</span>
										{/if}
										<div class="flex gap-1">
											<Button variant="ghost" size="sm" onclick={() => {}}>
												<EditIcon class="h-4 w-4" />
											</Button>
											{#if constraint.optional}
												<Button
													variant="ghost"
													size="sm"
													onclick={() => handleDeleteConstraint(constraint.id)}
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

		<!-- Bottom Row: Available Constraints -->

		<!-- Available Time Constraints -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-xl leading-tight font-bold">Available Time Constraints</h2>
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
							{#each availableTimeConstraints as constraint}
								<div class="space-y-3 rounded-lg border p-4">
									<div>
										<div class="flex items-center justify-between">
											<h3 class="font-semibold">{constraint.friendlyName}</h3>
											{#if !constraint.repeatable}
												<span class="text-muted-foreground bg-muted rounded-full px-2 py-1 text-xs">
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
										onclick={() => openAddConstraintModal(constraint)}
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
				<h2 class="text-xl leading-tight font-bold">Available Space Constraints</h2>
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
							{#each availableSpaceConstraints as constraint}
								<div class="space-y-3 rounded-lg border p-4">
									<div>
										<div class="flex items-center justify-between">
											<h3 class="font-semibold">{constraint.friendlyName}</h3>
											{#if !constraint.repeatable}
												<span class="text-muted-foreground bg-muted rounded-full px-2 py-1 text-xs">
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
										onclick={() => openAddConstraintModal(constraint)}
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

<!-- Add Constraint Modal -->
<Dialog.Root bind:open={addConstraintModalOpen}>
	<Dialog.Content class="max-h-[80vh] max-w-2xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Add Constraint: {constraintToAdd?.friendlyName}</Dialog.Title>
			<Dialog.Description>
				Configure the parameters for this constraint and add it to your timetable.
			</Dialog.Description>
		</Dialog.Header>
		{#if constraintToAdd}
			{@const FormComponent = getFormComponent(constraintToAdd)}
			{#if requiresEnhancedProps(constraintToAdd.FETName)}
				<FormComponent
					onSubmit={handleAddConstraint}
					onCancel={closeAddConstraintModal}
					{formData}
				/>
			{:else}
				<FormComponent onSubmit={handleAddConstraint} onCancel={closeAddConstraintModal} />
			{/if}
		{/if}
	</Dialog.Content>
</Dialog.Root>
