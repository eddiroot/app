<script lang="ts">
	import * as Button from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';
	import UserCheck from '@lucide/svelte/icons/user-check';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { createSchoolEventSchema } from '../schemas';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let dataForm = () => data.form;
	const form = superForm(dataForm(), {
		validators: zod4(createSchoolEventSchema),
		resetForm: false,
	});

	const { form: formData, enhance, submitting } = form;
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button.Root variant="ghost" size="icon" href="/admin/events">
			<ArrowLeft />
		</Button.Root>
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Create School Event</h1>
			<p class="text-muted-foreground text-sm">
				Create a school-wide event that will appear on all student and staff
				timetables
			</p>
		</div>
	</div>

	<!-- Form -->
	<Card.Root class="max-w-2xl">
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Calendar class="h-5 w-5" />
				Event Details
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
								placeholder="e.g. Open Day, Speech Night"
								class="mt-1"
							/>
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
						>Create School Event</Button.Root
					>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
