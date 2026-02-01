<script lang="ts">
	import * as Button from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';
	import UserCheck from '@lucide/svelte/icons/user-check';
	import Users from '@lucide/svelte/icons/users';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { createSubjectOfferingClassEventSchema } from '../schemas';

	let { data } = $props();

	let dataForm = () => data.form;
	const form = superForm(dataForm(), {
		validators: zod4(createSubjectOfferingClassEventSchema),
		resetForm: false,
	});

	const { form: formData, enhance, submitting } = form;

	// Convert numeric form values to string for Select components
	let selectedClassId = $derived(
		$formData.subjectOfferingClassId?.toString() || '',
	);
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button.Root variant="ghost" size="icon" href="/admin/events">
			<ArrowLeft />
		</Button.Root>
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Create Class Event</h1>
			<p class="text-muted-foreground text-sm">
				Create an event for a specific class
			</p>
		</div>
	</div>

	<!-- Form -->
	<Card.Root class="max-w-2xl">
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Calendar class="h-5 w-5" />
				Class Event Details
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance class="space-y-6">
				<!-- Event Name -->
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Label for={props.id}>Event Name *</Label>
							<Input
								{...props}
								bind:value={$formData.name}
								placeholder="e.g. Class Test, Field Trip, Presentation Day, Group Assignment Due"
								class="mt-1"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Class Selection -->
				<Form.Field {form} name="subjectOfferingClassId">
					<Form.Control>
						{#snippet children({ props })}
							<Label for={props.id} class="flex items-center gap-2">
								<Users />
								Class *
							</Label>
							<Select.Root
								type="single"
								bind:value={selectedClassId}
								name={props.name}
								onValueChange={(value) => {
									$formData.subjectOfferingClassId = value
										? parseInt(value)
										: 0;
								}}
							>
								<Select.Trigger {...props} class="mt-1">
									{#if selectedClassId}
										{@const selectedClass = data.classes.find(
											(c) => c.id.toString() === selectedClassId,
										)}
										{selectedClass
											? `${selectedClass.subjectName} - Year ${selectedClass.subjectOffering.year} (${selectedClass.name})`
											: 'Select a class...'}
									{:else}
										Select a class...
									{/if}
								</Select.Trigger>
								<Select.Content>
									{#each data.classes as classItem}
										<Select.Item
											value={classItem.id.toString()}
											label="{classItem.subjectName} - Year {classItem
												.subjectOffering.year} ({classItem.name})"
										>
											{classItem.subjectName} - Year {classItem.subjectOffering
												.year} ({classItem.name})
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Date and Time -->
				<div class="grid gap-4 md:grid-cols-2">
					<Form.Field {form} name="start">
						<Form.Control>
							{#snippet children({ props })}
								<Label for={props.id} class="flex items-center gap-2">
									<Clock />
									Start Date & Time *
								</Label>
								<Input
									{...props}
									bind:value={$formData.start}
									type="datetime-local"
									class="mt-1"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="end">
						<Form.Control>
							{#snippet children({ props })}
								<Label for={props.id} class="flex items-center gap-2">
									<Clock />
									End Date & Time *
								</Label>
								<Input
									{...props}
									bind:value={$formData.end}
									type="datetime-local"
									class="mt-1"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<!-- RSVP Requirement -->
				<Form.Field {form} name="requiresRSVP">
					<Form.Control>
						{#snippet children({ props })}
							<div class="flex items-center space-x-3">
								<Checkbox
									{...props}
									bind:checked={$formData.requiresRSVP}
									id={props.id}
								/>
								<div class="grid gap-1.5 leading-none">
									<Label
										for={props.id}
										class="flex items-center gap-2 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										<UserCheck class="h-4 w-4" />
										Require RSVP
									</Label>
									<p class="text-muted-foreground text-xs">
										Parents and students will need to confirm their attendance
										for this event
									</p>
								</div>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Action Buttons -->
				<div class="flex justify-end gap-3 pt-4">
					<Button.Root variant="outline" href="/admin/events"
						>Cancel</Button.Root
					>
					<Button.Root type="submit" disabled={$submitting}
						>Create Class Event</Button.Root
					>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
