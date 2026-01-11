<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	const { data } = $props();

	const behaviourSchema = z.object({
		id: z.number().optional(),
		name: z.string().min(1, 'Name is required'),
		description: z.string().optional(),
		levelId: z.string().optional()
	});

	const levelSchema = z.object({
		id: z.number().optional(),
		name: z.string().min(1, 'Name is required')
	});

	type BehaviourItem = {
		id: number;
		name: string;
		description: string | null;
		levelId: number | null;
	};

	type LevelItem = {
		id: number;
		name: string;
		level: number;
	};

	let dialogOpen = $state(false);
	let levelDialogOpen = $state(false);
	let editingBehaviour = $state<BehaviourItem | null>(null);
	let editingLevel = $state<LevelItem | null>(null);

	const dataForm = () => data.form;
	const form = superForm(dataForm(), {
		validators: zod4Client(behaviourSchema),
		resetForm: true,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				dialogOpen = false;
				editingBehaviour = null;
			}
		}
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
		}
	});

	const { form: formData, enhance } = form;
	const { form: levelFormData, enhance: levelEnhance } = levelForm;

	function openCreateDialog() {
		editingBehaviour = null;
		$formData = { name: '', description: '', levelId: '' };
		dialogOpen = true;
	}

	function openEditDialog(behaviour: BehaviourItem) {
		editingBehaviour = behaviour;
		$formData = {
			id: behaviour.id,
			name: behaviour.name,
			description: behaviour.description || '',
			levelId: behaviour.levelId?.toString() ?? ''
		};
		dialogOpen = true;
	}

	function openCreateLevelDialog() {
		editingLevel = null;
		$levelFormData = { name: '' };
		levelDialogOpen = true;
	}

	function openEditLevelDialog(level: LevelItem) {
		editingLevel = level;
		$levelFormData = {
			id: level.id,
			name: level.name
		};
		levelDialogOpen = true;
	}

	const canCreateLevel = $derived(data.levelsWithBehaviours.length < 10);

	// Mock action options
	const actionTypes = [
		{ value: 'notify', label: 'Notify' },
		{ value: 'create', label: 'Create' }
	];

	const notifyOptions = [
		{ value: 'year-coordinator', label: 'Year Level Coordinator' },
		{ value: 'guardians', label: 'Guardians' },
		{ value: 'principal', label: 'Principal' },
		{ value: 'head-teacher', label: 'Head Teacher' }
	];

	const createOptions = [
		{ value: 'mark-deduction', label: 'Mark Deduction' },
		{ value: 'detention', label: 'Detention Event' },
		{ value: 'referral', label: 'Behaviour Referral' },
		{ value: 'suspension', label: 'Suspension Notice' }
	];

	let mockActionType = $state<string | undefined>(undefined);
	let mockActionTarget = $state<string | undefined>(undefined);

	const actionTargetOptions = $derived(() => {
		if (mockActionType === 'notify') return notifyOptions;
		if (mockActionType === 'create') return createOptions;
		return [];
	});

	const actionTypeLabel = $derived(
		actionTypes.find((t) => t.value === mockActionType)?.label ?? 'Select action type'
	);
	const actionTargetLabel = $derived(
		actionTargetOptions().find((t) => t.value === mockActionTarget)?.label ?? 'Select target'
	);
</script>

<div class="container mx-auto space-y-6 p-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Behaviour Quick Actions</h1>
			<p class="text-muted-foreground mt-2">
				Manage quick action behaviours for marking student attendance
			</p>
		</div>
		<div class="flex gap-2">
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger
						class={buttonVariants({ variant: 'outline' })}
						onclick={openCreateLevelDialog}
						disabled={!canCreateLevel}
					>
						<Plus class="mr-2" />
						Add Level
					</Tooltip.Trigger>
					{#if !canCreateLevel}
						<Tooltip.Content>
							<p>Only 10 levels are allowed</p>
						</Tooltip.Content>
					{/if}
				</Tooltip.Root>
			</Tooltip.Provider>
			<Button onclick={openCreateDialog}>
				<Plus class="mr-2" />
				Add Behaviour
			</Button>
		</div>
	</div>

	<!-- Behaviours grouped by level -->
	{#each data.levelsWithBehaviours as level}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-xl font-semibold">
						Level {level.levelNumber}: {level.levelName}
					</h2>
					<p class="text-muted-foreground text-sm">{level.behaviours.length} behaviour(s)</p>
				</div>
				<div class="flex gap-2">
					<Button
						variant="ghost"
						size="sm"
						onclick={() =>
							openEditLevelDialog({
								id: level.levelId,
								name: level.levelName,
								level: level.levelNumber
							})}
					>
						<Pencil />
					</Button>
				</div>
			</div>

			<!-- Mock Action UI -->
			<Card.Root class="border-warning/50">
				<Card.Header>
					<Card.Title class="text-sm font-medium">
						Actions for Level {level.levelNumber}
					</Card.Title>
					<Card.Description class="text-xs">
						Configure what happens when a behaviour at this level is recorded
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex gap-2">
					<Select.Root type="single" bind:value={mockActionType}>
						<Select.Trigger class="w-[180px]">
							{actionTypeLabel}
						</Select.Trigger>
						<Select.Content>
							{#each actionTypes as actionType}
								<Select.Item value={actionType.value}>{actionType.label}</Select.Item>
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
				</Card.Content>
			</Card.Root>

			<!-- Behaviours for this level -->
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each level.behaviours as behaviour}
					<Card.Root>
						<Card.Header>
							<Card.Title class="flex items-center justify-between">
								<span>{behaviour.label}</span>
								<Button
									variant="ghost"
									size="icon"
									onclick={() =>
										openEditDialog({
											id: parseInt(behaviour.value),
											name: behaviour.label,
											description: null,
											levelId: level.levelId
										})}
								>
									<Pencil />
								</Button>
							</Card.Title>
						</Card.Header>
					</Card.Root>
				{/each}
			</div>
		</div>
	{/each}

	{#if data.levelsWithBehaviours.length === 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>No behaviour levels</Card.Title>
				<Card.Description>
					Create your first behaviour level to start tracking and actioning student behaviours
				</Card.Description>
			</Card.Header>
		</Card.Root>
	{/if}
</div>

<!-- Behaviour Dialog -->
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
						<Input {...props} bind:value={$formData.name} placeholder="e.g., Out of uniform" />
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
				<Button type="button" variant="outline" onclick={() => (dialogOpen = false)}>Cancel</Button>
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
				<Button type="button" variant="outline" onclick={() => (levelDialogOpen = false)}>
					Cancel
				</Button>
				<Button type="submit">{editingLevel ? 'Update' : 'Create'}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
