<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	const { data } = $props();

	const behaviourSchema = z.object({
		id: z.number().optional(),
		name: z.string().min(1, 'Name is required'),
		description: z.string().optional()
	});

	let dialogOpen = $state(false);
	let editingBehaviour = $state<(typeof data.behaviourQuickActions)[0] | null>(null);

	const form = superForm(data.form, {
		validators: zod4Client(behaviourSchema),
		resetForm: true,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				dialogOpen = false;
				editingBehaviour = null;
			}
		}
	});

	const { form: formData, enhance } = form;

	function openCreateDialog() {
		editingBehaviour = null;
		$formData = { name: '', description: '' };
		dialogOpen = true;
	}

	function openEditDialog(behaviour: (typeof data.behaviourQuickActions)[0]) {
		editingBehaviour = behaviour;
		$formData = {
			id: behaviour.id,
			name: behaviour.name,
			description: behaviour.description || ''
		};
		dialogOpen = true;
	}

	async function handleDelete(id: number) {
		if (!confirm('Are you sure you want to delete this behaviour quick action?')) {
			return;
		}

		const formData = new FormData();
		formData.append('id', id.toString());

		await fetch('?/delete', {
			method: 'POST',
			body: formData
		});

		window.location.reload();
	}
</script>

<div class="container mx-auto space-y-6 p-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Behaviour Quick Actions</h1>
			<p class="text-muted-foreground mt-2">
				Manage quick action behaviours for marking student attendance
			</p>
		</div>
		<Button onclick={openCreateDialog}>
			<Plus class="mr-2" />
			Add Behaviour
		</Button>
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each data.behaviourQuickActions as behaviour}
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center justify-between">
						<span>{behaviour.name}</span>
						<div class="flex gap-2">
							<Button variant="ghost" size="icon" onclick={() => openEditDialog(behaviour)}>
								<Pencil />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onclick={() => handleDelete(behaviour.id)}
								class="text-destructive"
							>
								<Trash2 />
							</Button>
						</div>
					</Card.Title>
					{#if behaviour.description}
						<Card.Description>{behaviour.description}</Card.Description>
					{/if}
				</Card.Header>
			</Card.Root>
		{/each}
	</div>

	{#if data.behaviourQuickActions.length === 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>No behaviour quick actions</Card.Title>
				<Card.Description>
					Create your first behaviour quick action to start tracking student behaviours
				</Card.Description>
			</Card.Header>
		</Card.Root>
	{/if}
</div>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				{editingBehaviour ? 'Edit' : 'Create'} Behaviour Quick Action
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

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (dialogOpen = false)}>Cancel</Button>
				<Button type="submit">{editingBehaviour ? 'Update' : 'Create'}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
