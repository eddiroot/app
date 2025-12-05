<script lang="ts">
	import TypeBadge from '$lib/components/type-badge.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import { convertToFullName } from '$lib/utils.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { createAllocationSchema } from './schema.js';

	let { data } = $props();

	const createForm = superForm(data.createForm, {
		validators: zod4(createAllocationSchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				createDialogOpen = false;
				$createFormData.userId = '';
				$createFormData.subjectOfferingClassId = '0';
			}
		}
	});

	const { form: createFormData, enhance: createEnhance, errors: createFormErrors } = createForm;

	let createDialogOpen = $state(false);

	let searchTerm = $state('');

	const filteredAllocations = $derived(() => {
		if (!searchTerm) return data.allocations;
		return data.allocations.filter((allocation) => {
			const userName = convertToFullName(
				allocation.user.firstName,
				allocation.user.middleName,
				allocation.user.lastName
			);
			const subjectName = allocation.subject?.name;
			const className = allocation.subjectOfferingClass?.name;

			return (
				userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				className.toLowerCase().includes(searchTerm.toLowerCase())
			);
		});
	});

	function getSubjectDisplayName(subjectClass: (typeof data.subjectOfferingClasses)[number]) {
		return `${subjectClass.subjectName} - ${subjectClass.name}`;
	}
</script>

<div class="flex h-full flex-col space-y-2">
	<h1 class="text-3xl font-bold tracking-tight">Allocations</h1>
	<p class="text-muted-foreground">
		Manage which users are allocated to which classes and their roles within them.
	</p>

	<div class="flex min-h-0 flex-1 flex-col">
		<!-- Search -->
		<div class="flex gap-2 py-4">
			<div class="relative flex-1">
				<SearchIcon
					class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
				/>
				<Input
					type="text"
					placeholder="Search allocations..."
					bind:value={searchTerm}
					class="pl-9"
				/>
			</div>
			<Dialog.Root bind:open={createDialogOpen}>
				<Dialog.Trigger class={buttonVariants()}>
					<PlusIcon />
					Add Allocation
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-[425px]">
					<Dialog.Header>
						<Dialog.Title>Create New Allocation</Dialog.Title>
					</Dialog.Header>
					<form method="POST" action="?/create" use:createEnhance class="space-y-4">
						<div class="space-y-2">
							<Label for="user">Student</Label>
							<Select.Root type="single" bind:value={$createFormData.userId}>
								<Select.Trigger class="w-full">
									{#if $createFormData.userId}
										{#each data.users as user}
											{#if user.id === $createFormData.userId}
												{convertToFullName(user.firstName, user.middleName, user.lastName)} - {user.email}
											{/if}
										{/each}
									{:else}
										Select a user
									{/if}
								</Select.Trigger>
								<Select.Content>
									{#each data.users as user}
										<Select.Item value={user.id}>
											{convertToFullName(user.firstName, user.middleName, user.lastName)} - {user.email}
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<input type="hidden" name="userId" bind:value={$createFormData.userId} />
						</div>
						<div class="space-y-2">
							<Label for="class">Class</Label>
							<Select.Root type="single" bind:value={$createFormData.subjectOfferingClassId}>
								<Select.Trigger class="w-full">
									{#if $createFormData.subjectOfferingClassId}
										{#each data.subjectOfferingClasses as subjectClass}
											{#if subjectClass.id.toString() === $createFormData.subjectOfferingClassId}
												{getSubjectDisplayName(subjectClass)}
											{/if}
										{/each}
									{:else}
										Select a class
									{/if}
								</Select.Trigger>
								<Select.Content>
									{#each data.subjectOfferingClasses as subjectClass}
										<Select.Item value={subjectClass.id.toString()}>
											{getSubjectDisplayName(subjectClass)}
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<input
								type="hidden"
								name="subjectOfferingClassId"
								bind:value={$createFormData.subjectOfferingClassId}
							/>
						</div>
						<div class="flex justify-end gap-2">
							<Button type="button" variant="outline" onclick={() => (createDialogOpen = false)}>
								Cancel
							</Button>
							<Button type="submit">Create Allocation</Button>
						</div>
					</form>
				</Dialog.Content>
			</Dialog.Root>
		</div>

		<!-- Allocations Table -->
		<div class="flex flex-1 flex-col overflow-hidden rounded-md border">
			<Table.Root class="h-full">
				<Table.Header class="bg-background sticky top-0 z-10">
					<Table.Row>
						<Table.Head>Student</Table.Head>
						<Table.Head>Subject</Table.Head>
						<Table.Head>Class</Table.Head>
						<Table.Head>Role</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body class="overflow-auto">
					{#each filteredAllocations() as allocation}
						<Table.Row>
							<Table.Cell>
								<div>
									<div class="font-medium">
										{convertToFullName(
											allocation.user.firstName,
											allocation.user.middleName,
											allocation.user.lastName
										)}
									</div>
									<div class="text-muted-foreground text-sm">
										{allocation.user.email}
									</div>
								</div>
							</Table.Cell>
							<Table.Cell>
								{allocation.subject.name}
							</Table.Cell>
							<Table.Cell>
								{allocation.subjectOfferingClass.name}
							</Table.Cell>
							<Table.Cell>
								<TypeBadge type={allocation.user.type} />
							</Table.Cell>
							<Table.Cell class="text-right">
								<Button size="sm" variant="destructive" disabled>
									<Trash2Icon />
								</Button>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={5} class="text-center py-8 text-muted-foreground">
								No allocations found
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</div>
</div>
