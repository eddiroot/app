<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as ScrollArea from '$lib/components/ui/scroll-area/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import WorkflowIcon from '@lucide/svelte/icons/workflow';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	const { data } = $props();

	const behaviourSchema = z.object({
		id: z.number().optional(),
		name: z.string().min(1, 'Name is required'),
		description: z.string().optional(),
		levelId: z.string().optional(),
	});

	const levelSchema = z.object({
		id: z.number().optional(),
		name: z.string().min(1, 'Name is required'),
	});

	type BehaviourItem = {
		id: number;
		name: string;
		description: string | null;
		levelId: number | null;
	};

	type LevelItem = { id: number; name: string; level: number };

	let dialogOpen = $state(false);
	let levelDialogOpen = $state(false);
	let editingBehaviour = $state<BehaviourItem | null>(null);
	let editingLevel = $state<LevelItem | null>(null);
	let workflowDialogOpen = $state(false);
	let workflowLevelNumber = $state<number | null>(null);

	const dataForm = () => data.form;
	const form = superForm(dataForm(), {
		validators: zod4Client(behaviourSchema),
		resetForm: true,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				dialogOpen = false;
				editingBehaviour = null;
			}
		},
	});

	const dataLevelForm = () => data.levelForm;
	const levelForm = superForm(dataLevelForm(), {
		validators: zod4Client(levelSchema),
		resetForm: true,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				levelDialogOpen = false;
				editingLevel = null;
			}
		},
	});

	const { form: formData, enhance } = form;
	const { form: levelFormData, enhance: levelEnhance } = levelForm;

	function openCreateDialog(levelId?: number) {
		editingBehaviour = null;
		$formData = {
			name: '',
			description: '',
			levelId: levelId?.toString() ?? '',
		};
		dialogOpen = true;
	}

	function openEditDialog(behaviour: BehaviourItem) {
		editingBehaviour = behaviour;
		$formData = {
			id: behaviour.id,
			name: behaviour.name,
			description: behaviour.description || '',
			levelId: behaviour.levelId?.toString() ?? '',
		};
		dialogOpen = true;
	}

	function openCreateLevelDialog() {
		editingLevel = null;
		$levelFormData = { name: '', number: data.levelsWithBehaviours.length + 1 };
		levelDialogOpen = true;
	}

	function openEditLevelDialog(level: LevelItem) {
		editingLevel = level;
		$levelFormData = { id: level.id, name: level.name, number: level.level };
		levelDialogOpen = true;
	}

	function openWorkflowDialog(levelNumber: number) {
		workflowLevelNumber = levelNumber;
		workflowDialogOpen = true;
	}

	const canCreateLevel = $derived(data.levelsWithBehaviours.length < 10);

	// Mock action options
	const actionTypes = [
		{ value: 'notify', label: 'Notify' },
		{ value: 'create', label: 'Create' },
	];

	const notifyOptions = [
		{ value: 'year-coordinator', label: 'Year Level Coordinator' },
		{ value: 'guardians', label: 'Guardians' },
		{ value: 'principal', label: 'Principal' },
		{ value: 'head-teacher', label: 'Head Teacher' },
	];

	const createOptions = [
		{ value: 'mark-deduction', label: 'Mark Deduction' },
		{ value: 'detention', label: 'Detention Event' },
		{ value: 'referral', label: 'Behaviour Referral' },
		{ value: 'suspension', label: 'Suspension Notice' },
	];

	let mockActionType = $state<string | undefined>(undefined);
	let mockActionTarget = $state<string | undefined>(undefined);

	const actionTargetOptions = $derived(() => {
		if (mockActionType === 'notify') return notifyOptions;
		if (mockActionType === 'create') return createOptions;
		return [];
	});

	const actionTypeLabel = $derived(
		actionTypes.find((t) => t.value === mockActionType)?.label ??
			'Select action type',
	);
	const actionTargetLabel = $derived(
		actionTargetOptions().find((t) => t.value === mockActionTarget)?.label ??
			'Select target',
	);
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Behaviours</h1>
		<p class="text-muted-foreground mt-2">
			Manage behaviours for classroom incident reporting
		</p>
	</div>

	<!-- Behaviours grouped by level -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each data.levelsWithBehaviours as level}
			<Card.Root>
				<Card.Header>
					<Card.Title>
						Level {level.levelNumber}: {level.levelName}
					</Card.Title>
					<Card.Description class="mt-1">
						{level.behaviours.length} behaviour(s), {actionTypes.length} action(s)
					</Card.Description>
					<Card.Action>
						<Button
							variant="ghost"
							size="icon"
							onclick={() =>
								openEditLevelDialog({
									id: level.levelId,
									name: level.levelName,
									level: level.levelNumber,
								})}
						>
							<PencilIcon class="h-4 w-4" />
						</Button>
						<Button
							size="icon"
							variant="ghost"
							onclick={() => openWorkflowDialog(level.levelNumber)}
						>
							<WorkflowIcon class="h-4 w-4" />
						</Button>
						<Button size="icon" onclick={() => openCreateDialog(level.levelId)}>
							<Plus />
						</Button>
					</Card.Action>
				</Card.Header>
				<Card.Content>
					<ScrollArea.Root class="h-60 w-full rounded-md border">
						<ul class="divide-y">
							{#each level.behaviours as behaviour}
								<li
									class="hover:bg-accent/50 flex items-center justify-between p-2"
								>
									<span class="text-sm">{behaviour.label}</span>
									<Button
										variant="ghost"
										size="icon"
										onclick={() =>
											openEditDialog({
												id: parseInt(behaviour.value),
												name: behaviour.label,
												description: null,
												levelId: level.levelId,
											})}
									>
										<PencilIcon />
									</Button>
								</li>
							{/each}
						</ul>
					</ScrollArea.Root>
				</Card.Content>
			</Card.Root>
		{/each}

		{#if canCreateLevel}
			<Card.Root
				class="hover:border-primary hover:bg-accent/50 cursor-pointer border-2 border-dashed transition-colors"
				onclick={openCreateLevelDialog}
			>
				<Card.Content
					class="flex h-full min-h-[200px] items-center justify-center p-6"
				>
					<div class="flex flex-col items-center gap-2 text-center">
						<Plus class="text-muted-foreground h-8 w-8" />
						<div>
							<p class="font-semibold">Add Level</p>
							<p class="text-muted-foreground text-sm">
								Create a new behaviour level
							</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		{:else}
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger
						class="border-border bg-card text-card-foreground w-full cursor-not-allowed rounded-lg border-2 border-dashed opacity-50 shadow-sm"
					>
						<div
							class="flex h-full min-h-[200px] items-center justify-center p-6"
						>
							<div class="flex flex-col items-center gap-2 text-center">
								<Plus class="text-muted-foreground h-8 w-8" />
								<div>
									<p class="font-semibold">Add Level</p>
									<p class="text-muted-foreground text-sm">
										Create a new behaviour level
									</p>
								</div>
							</div>
						</div>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Only 10 levels are allowed</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		{/if}
	</div>

	{#if data.levelsWithBehaviours.length === 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>No behaviour levels</Card.Title>
				<Card.Description>
					Create your first behaviour level to start tracking and actioning
					student behaviours
				</Card.Description>
			</Card.Header>
		</Card.Root>
	{/if}
</div>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				{editingBehaviour ? 'Edit' : 'Create'} Behaviour
			</Dialog.Title>
		</Dialog.Header>

		<form
			method="POST"
			action={editingBehaviour ? '?/update' : '?/create'}
			use:enhance
			class="space-y-4"
		>
			{#if editingBehaviour}
				<input type="hidden" name="id" value={editingBehaviour.id} />
			{/if}

			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Name</Form.Label>
						<Input
							{...props}
							bind:value={$formData.name}
							placeholder="e.g., Out of uniform"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="description">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Description (Optional)</Form.Label>
						<Textarea
							{...props}
							bind:value={$formData.description}
							placeholder="Add a description..."
							class="resize-none"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="levelId">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Level</Form.Label>
						<Select.Root type="single" bind:value={$formData.levelId}>
							<Select.Trigger {...props} class="w-full">
								{$formData.levelId
									? `Level ${data.levelsWithBehaviours.find((l) => l.levelId.toString() === $formData.levelId)?.levelNumber}: ${data.levelsWithBehaviours.find((l) => l.levelId.toString() === $formData.levelId)?.levelName}`
									: 'Select a level'}
							</Select.Trigger>
							<Select.Content>
								{#each data.levelsWithBehaviours as level}
									<Select.Item value={level.levelId.toString()}>
										Level {level.levelNumber}: {level.levelName}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					onclick={() => (dialogOpen = false)}>Cancel</Button
				>
				<Button type="submit">{editingBehaviour ? 'Update' : 'Create'}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Level Dialog -->
<Dialog.Root bind:open={levelDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				{editingLevel ? 'Edit' : 'Create'} Behaviour Level
			</Dialog.Title>
		</Dialog.Header>

		<form
			method="POST"
			action={editingLevel ? '?/updateLevel' : '?/createLevel'}
			use:levelEnhance
			class="space-y-4"
		>
			{#if editingLevel}
				<input type="hidden" name="id" value={editingLevel.id} />
			{/if}

			<Form.Field form={levelForm} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Name</Form.Label>
						<Input
							{...props}
							bind:value={$levelFormData.name}
							placeholder="e.g., Minor Infractions"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					onclick={() => (levelDialogOpen = false)}
				>
					Cancel
				</Button>
				<Button type="submit">{editingLevel ? 'Update' : 'Create'}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={workflowDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				Actions for Level {workflowLevelNumber}
			</Dialog.Title>
		</Dialog.Header>
		<Card.Description class="mb-2 text-xs">
			Configure what happens when a behaviour at this level is recorded
		</Card.Description>
		<div class="flex gap-2">
			<Select.Root type="single" bind:value={mockActionType}>
				<Select.Trigger class="w-[180px]">
					{actionTypeLabel}
				</Select.Trigger>
				<Select.Content>
					{#each actionTypes as actionType}
						<Select.Item value={actionType.value}
							>{actionType.label}</Select.Item
						>
					{/each}
				</Select.Content>
			</Select.Root>

			{#if mockActionType}
				<Select.Root type="single" bind:value={mockActionTarget}>
					<Select.Trigger class="w-[220px]">
						{actionTargetLabel}
					</Select.Trigger>
					<Select.Content>
						{#each actionTargetOptions() as option}
							<Select.Item value={option.value}>{option.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			{/if}
		</div>
		<Dialog.Footer>
			<Button
				type="button"
				variant="outline"
				onclick={() => (workflowDialogOpen = false)}
			>
				Close
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
