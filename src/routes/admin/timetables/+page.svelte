<script lang="ts">
	import Autocomplete from '$lib/components/autocomplete.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types.js';
	import { createTimetableSchema } from './schema.js';

	let { data }: { data: PageData } = $props();

	let dialogOpen = $state(false);

	const form = superForm(data.createTimetableForm, {
		validators: zod4(createTimetableSchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance, constraints } = form;

	// Filtered semesters based on selected school year
	const filteredSemesters = $derived(() => {
		if (!$formData.schoolYear) return [];
		return data.semesters
			.filter((semester) => semester.schoolYear === $formData.schoolYear)
			.map((semester) => ({
				value: semester.id,
				label: semester.name ?? 'Unnamed Semester'
			}));
	});
</script>

<div class="mb-6 flex items-center justify-between">
	<div>
		<h1 class="text-2xl font-bold">Timetabling</h1>
		<p class="text-muted-foreground mt-1">
			Welcome to eddi-Timetabling, your one-stop solution for managing your school timetables
			efficiently.
		</p>
	</div>
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
			<PlusIcon />
			Create New</Dialog.Trigger
		>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Create New Timetable</Dialog.Title>
			</Dialog.Header>
			<form method="POST" action="?/createTimetable" use:enhance>
				<div class="grid gap-4 py-4">
					<Form.Field {form} name="name">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Name</Form.Label>
								<Input {...props} bind:value={$formData.name} placeholder="Term 1" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="schoolYear">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>School Year</Form.Label>
								<Input
									{...props}
									type="number"
									bind:value={$formData.schoolYear}
									{...$constraints.schoolYear}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					{#if $formData.schoolYear && filteredSemesters().length > 0}
						<Form.Field {form} name="schoolSemester">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>School Semester</Form.Label>
									<div {...props}>
										<Autocomplete
											options={filteredSemesters()}
											bind:value={$formData.schoolSemester}
											placeholder="Select a semester..."
											searchPlaceholder="Search semesters..."
											emptyText="No semesters found for this year."
										/>
									</div>
									<!-- Hidden input to ensure form serialization -->
									<input
										type="hidden"
										name="schoolSemester"
										value={$formData.schoolSemester || ''}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					{/if}
				</div>
				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (dialogOpen = false)}>
						Cancel
					</Button>
					<Button type="submit" class="gap-2">
						<PlusIcon />
						Create Timetable
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</div>

{#if data.timetablesAndSemesters.length === 0}
	<Card.Root class="p-8 text-center">
		<Card.Content class="pt-6">
			<CalendarIcon class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
			<Card.Title class="mb-2 text-lg">No timetables yet</Card.Title>
			<Card.Description class="mb-4">
				Get started by creating your first timetable for your school.
			</Card.Description>
		</Card.Content>
	</Card.Root>
{:else}
	<div class="grid gap-4">
		{#each data.timetablesAndSemesters as ttAndSem}
			<a href={`/admin/timetables/${ttAndSem.tt.id}`}>
				<Card.Root>
					<Card.Header class="flex items-center justify-between">
						<div class="flex items-center gap-4">
							<div class="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
								<CalendarIcon class="text-primary h-6 w-6" />
							</div>
							<div class="flex flex-col">
								<Card.Title class="text-lg font-semibold">{ttAndSem.tt.name}</Card.Title>
								<div class="mt-1 flex items-center gap-2">
									<Badge variant="secondary" class="text-xs">
										{ttAndSem.tt.schoolYear}
									</Badge>
									<Badge variant="secondary" class="text-xs">
										{ttAndSem.sch_sem.name}
									</Badge>
									{#if ttAndSem.tt.isArchived}
										<Badge variant="outline" class="gap-1 text-xs">
											<ArchiveIcon class="h-3 w-3" />
											Archived
										</Badge>
									{/if}
								</div>
							</div>
						</div>
					</Card.Header>
				</Card.Root>
			</a>
		{/each}
	</div>
{/if}

<div class="text-muted-foreground mt-8 border-t pt-4 text-center text-sm">Powered by FET</div>
