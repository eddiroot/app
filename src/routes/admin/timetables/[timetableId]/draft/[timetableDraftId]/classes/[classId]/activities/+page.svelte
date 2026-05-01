<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
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

	let createDialogOpen = $state(false);
	let editDialogOpen = $state(false);

	const backHref = `/admin/timetables/${page.params.timetableId}/draft/${page.params.timetableDraftId}/classes`;

	const createForm = superForm(data.createActivityForm, {
		validators: zod4(createActivitySchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				createDialogOpen = false;
				invalidateAll();
			}
		},
	});
	const { form: createFormData, enhance: createEnhance } = createForm;

	const editForm = superForm(data.editActivityForm, {
		validators: zod4(editActivitySchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				editDialogOpen = false;
				invalidateAll();
			}
		},
	});
	const { form: editFormData, enhance: editEnhance } = editForm;

	const deleteForm = superForm(data.deleteActivityForm, {
		validators: zod4(deleteActivitySchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				invalidateAll();
			}
		},
	});
	const { form: deleteFormData, enhance: deleteEnhance } = deleteForm;

	function openCreateDialog() {
		const totalSoFar = data.activities.reduce((s, a) => s + a.duration, 0);
		$createFormData.duration = 1;
		$createFormData.totalDuration = Math.max(totalSoFar + 1, 1);
		createDialogOpen = true;
	}

	function openEditDialog(activityId: number) {
		const activity = data.activities.find((a) => a.id === activityId);
		if (!activity) return;
		$editFormData.activityId = activity.id;
		$editFormData.duration = activity.duration;
		$editFormData.totalDuration = activity.totalDuration;
		editDialogOpen = true;
	}

	function handleDelete(activityId: number) {
		$deleteFormData.activityId = activityId;
		setTimeout(() => {
			const form = document.getElementById(
				'delete-activity-form',
			) as HTMLFormElement;
			form?.requestSubmit();
		}, 0);
	}

	const totalDurationSum = $derived(
		data.activities.reduce((s, a) => s + a.duration, 0),
	);
	const expectedTotal = $derived(data.activities[0]?.totalDuration ?? 0);
	const totalsMatch = $derived(
		data.activities.length === 0 || totalDurationSum === expectedTotal,
	);
</script>

<div class="mb-4 flex items-center gap-3">
	<Button variant="ghost" size="icon" href={backHref}>
		<ArrowLeftIcon class="h-4 w-4" />
	</Button>
	<h1 class="text-3xl font-bold">Class #{data.classId} — Activities</h1>
</div>

<p class="text-muted-foreground mb-6 text-sm">
	Each activity becomes one FET <code>&lt;Activity&gt;</code>. Set the
	<strong>Duration</strong> for that single appearance, and the
	<strong>Total Duration</strong> for the sum across all activities of this
	class. All activities of a class must share the same Total Duration.
</p>

{#if !totalsMatch}
	<Card class="border-destructive bg-destructive/5 mb-4 p-4">
		<p class="text-destructive text-sm">
			Sum of activity durations ({totalDurationSum}) does not match Total
			Duration ({expectedTotal}). FET will reject the input.
		</p>
	</Card>
{/if}

<div class="mb-4 flex justify-end">
	<Button onclick={openCreateDialog}>
		<PlusIcon class="mr-2 h-4 w-4" />
		Add Activity
	</Button>
</div>

{#if data.activities.length === 0}
	<Card class="p-8 text-center">
		<h3 class="mb-2 text-lg font-semibold">No Activities Yet</h3>
		<p class="text-muted-foreground">
			Add at least one activity to control how this class is split across the
			week.
		</p>
	</Card>
{:else}
	<div class="grid gap-3">
		{#each data.activities as activity (activity.id)}
			<div class="bg-background rounded-lg border p-4">
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<div class="mb-1 flex items-center gap-3">
							<span class="font-medium">Activity #{activity.id}</span>
							<Badge variant="secondary" class="text-xs">
								Duration: {activity.duration} period{activity.duration === 1
									? ''
									: 's'}
							</Badge>
							<Badge variant="outline" class="text-xs">
								Total: {activity.totalDuration} periods/week
							</Badge>
						</div>
					</div>
					<div class="flex gap-1">
						<Button
							variant="ghost"
							size="sm"
							onclick={() => openEditDialog(activity.id)}
						>
							<PencilIcon class="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onclick={() => handleDelete(activity.id)}
						>
							<Trash2Icon class="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}

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

<Dialog.Root bind:open={createDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Add Activity</Dialog.Title>
			<Dialog.Description>
				Defines one FET activity instance for this class.
			</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/createActivity" use:createEnhance>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="create-duration">Duration (periods) *</Label>
					<Input
						id="create-duration"
						name="duration"
						type="number"
						min="1"
						max="20"
						bind:value={$createFormData.duration}
					/>
					<p class="text-muted-foreground text-sm">
						Consecutive periods for this single appearance.
					</p>
				</div>
				<div class="grid gap-2">
					<Label for="create-total-duration">Total Duration (periods/week) *</Label>
					<Input
						id="create-total-duration"
						name="totalDuration"
						type="number"
						min="1"
						max="40"
						bind:value={$createFormData.totalDuration}
					/>
					<p class="text-muted-foreground text-sm">
						Sum of all activity durations in this class. Must match across all
						activities of the same class.
					</p>
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
				<Button type="submit">Add</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={editDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Edit Activity</Dialog.Title>
		</Dialog.Header>
		<form method="POST" action="?/editActivity" use:editEnhance>
			<input
				type="hidden"
				name="activityId"
				bind:value={$editFormData.activityId}
			/>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="edit-duration">Duration (periods) *</Label>
					<Input
						id="edit-duration"
						name="duration"
						type="number"
						min="1"
						max="20"
						bind:value={$editFormData.duration}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="edit-total-duration">Total Duration (periods/week) *</Label>
					<Input
						id="edit-total-duration"
						name="totalDuration"
						type="number"
						min="1"
						max="40"
						bind:value={$editFormData.totalDuration}
					/>
				</div>
			</div>
			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					onclick={() => (editDialogOpen = false)}
				>
					Cancel
				</Button>
				<Button type="submit">Save</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
