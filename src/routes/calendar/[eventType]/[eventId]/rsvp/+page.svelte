<script lang="ts">
	import * as Button from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Form from '$lib/components/ui/form';
	import { Label } from '$lib/components/ui/label';
	import { formatTimestampAsDate, formatTimestampAsTime } from '$lib/utils';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import School from '@lucide/svelte/icons/school';
	import UserCheck from '@lucide/svelte/icons/user-check';
	import Users from '@lucide/svelte/icons/users';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { rsvpSchema } from '../../../schemas';

	let { data } = $props();

	let dataForm = () => data.form;
	const form = superForm(dataForm(), {
		validators: zod4(rsvpSchema),
		resetForm: false,
	});

	const { form: formData, enhance, submitting } = form;

	function getEventTypeInfo(eventType: string) {
		switch (eventType) {
			case 'school':
				return {
					icon: School,
					title: 'School Event',
					description:
						'This event affects all students and staff across the school',
				};
			case 'campus':
				return {
					icon: MapPin,
					title: 'Campus Event',
					description:
						'This event affects all students and staff on this campus',
				};
			case 'subject':
				return {
					icon: BookOpen,
					title: 'Subject Event',
					description: 'This event affects all students in this subject',
				};
			case 'class':
				return {
					icon: Users,
					title: 'Class Event',
					description: 'This event affects all students in this class',
				};
			default:
				return { icon: Calendar, title: 'Event', description: 'Event details' };
		}
	}

	let dataEventType = () => data.eventType;
	const eventTypeInfo = getEventTypeInfo(dataEventType());
</script>

<div class="space-y-6 p-8">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button.Root variant="ghost" size="icon" href="/timetable">
			<ArrowLeft />
		</Button.Root>
		<div>
			<h1 class="text-2xl font-bold tracking-tight">RSVP Required</h1>
			<p class="text-muted-foreground text-sm">
				Please confirm your attendance for this event
			</p>
		</div>
	</div>

	<!-- Event Details -->
	<Card.Root class="max-w-2xl">
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<eventTypeInfo.icon class="h-5 w-5" />
				{data.event.name}
			</Card.Title>
			<Card.Description>
				{eventTypeInfo.description}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="space-y-4">
				<!-- Event Type Badge -->
				<div
					class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors"
				>
					{eventTypeInfo.title}
				</div>

				<!-- Date and Time -->
				<div class="flex flex-col gap-3 text-sm">
					<div class="flex items-center gap-2">
						<Calendar class="text-muted-foreground h-4 w-4" />
						<span>{formatTimestampAsDate(data.event.start)}</span>
					</div>
					<div class="flex items-center gap-2">
						<Clock class="text-muted-foreground h-4 w-4" />
						<span>
							{formatTimestampAsTime(data.event.start)} - {formatTimestampAsTime(
								data.event.end,
							)}
						</span>
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- RSVP Form -->
	<Card.Root class="max-w-2xl">
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<UserCheck class="h-5 w-5" />
				Confirm Attendance
			</Card.Title>
			<Card.Description>
				{#if data.hasExistingRSVP}
					Update your RSVP for this event
				{:else}
					Please confirm whether you will be attending this event
				{/if}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance class="space-y-6">
				<Form.Field {form} name="willAttend">
					<Form.Control>
						{#snippet children({ props })}
							<div class="flex items-center space-x-3">
								<Checkbox
									{...props}
									bind:checked={$formData.willAttend}
									id={props.id}
								/>
								<div class="grid gap-1.5 leading-none">
									<Label
										for={props.id}
										class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										I will attend this event
									</Label>
									<p class="text-muted-foreground text-xs">
										Check this box to confirm your attendance
									</p>
								</div>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Action Buttons -->
				<div class="flex justify-end gap-3 pt-4">
					<Button.Root variant="outline" href="/timetable">Cancel</Button.Root>
					<Button.Root type="submit" disabled={$submitting}>
						{data.hasExistingRSVP ? 'Update RSVP' : 'Confirm RSVP'}
					</Button.Root>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
