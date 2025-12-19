<script lang="ts">
	import { page } from '$app/state';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	// import Slider from '$lib/components/ui/slider/slider.svelte';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { subjectClassAllocationAttendanceStatus } from '$lib/enums';
	import type { SubjectClassAllocationAttendanceComponent } from '$lib/server/db/schema';
	import {
		type BehaviourQuickAction,
		type SubjectClassAllocation,
		type SubjectClassAllocationAttendance,
		type User
	} from '$lib/server/db/schema';
	import { convertToFullName } from '$lib/utils';
	import History from '@lucide/svelte/icons/history';
	import NotepadText from '@lucide/svelte/icons/notepad-text';
	import { tick } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { attendanceSchema } from '../schema';
	import AttendanceProgressBar from './AttendanceProgressBar.svelte';

	type AttendanceRecord = {
		user: Pick<User, 'id' | 'firstName' | 'middleName' | 'lastName'>;
		attendance?: SubjectClassAllocationAttendance | null;
		subjectClassAllocation: Pick<SubjectClassAllocation, 'id' | 'startTime' | 'endTime'>;
		behaviourQuickActionIds?: number[];
		attendanceComponents?: SubjectClassAllocationAttendanceComponent[];
	};

	let {
		attendanceRecord,
		behaviourQuickActions = [],
		type = 'unmarked'
	}: {
		attendanceRecord: AttendanceRecord;
		behaviourQuickActions?: BehaviourQuickAction[];
		type?: 'unmarked' | 'marked';
	} = $props();

	const attendanceRecordData = () => attendanceRecord;
	const form = superForm(
		{
			subjectClassAllocationId: attendanceRecordData().subjectClassAllocation.id,
			userId: attendanceRecordData().user.id,
			status:
				attendanceRecordData().attendance?.status || subjectClassAllocationAttendanceStatus.present,
			noteTeacher: attendanceRecordData().attendance?.noteTeacher || '',
			behaviourQuickActionIds: (attendanceRecordData().behaviourQuickActionIds ?? []).map(String)
		},
		{
			validators: zod4Client(attendanceSchema),
			invalidateAll: 'force',
			resetForm: false,
			onResult({ result }) {
				if (result.type === 'success') {
					dialogOpen = false;
				}
			}
		}
	);

	const { form: formData, enhance: formEnhance } = form;

	const user = $derived(attendanceRecord.user);
	const fullName = $derived(convertToFullName(user.firstName, user.middleName, user.lastName));
	let dialogOpen = $state(false);

	const selectedBehavioursLabel = $derived(
		$formData.behaviourQuickActionIds.length === 0
			? 'Behaviours'
			: `${$formData.behaviourQuickActionIds.length} selected`
	);

	const behaviourOptions = $derived(
		behaviourQuickActions.map((behaviour) => ({
			value: behaviour.id.toString(),
			label: behaviour.name
		}))
	);

	const classStartTime = $derived(attendanceRecord.subjectClassAllocation.startTime);
	const classEndTime = $derived(attendanceRecord.subjectClassAllocation.endTime);
	let showSlider = $state(false);

	// Parse time string to seconds since midnight
	function parseTimeToSeconds(timeStr: string): number {
		const parts = timeStr.split(':').map(Number);
		if (parts.length === 3) {
			return parts[0] * 3600 + parts[1] * 60 + parts[2];
		}
		return parts[0] * 3600 + parts[1] * 60;
	}

	// Get current time as HH:MM:SS string (with milliseconds for smooth progress)
	function getCurrentTimeString(): string {
		const now = new Date();
		const hours = now.getHours();
		const minutes = now.getMinutes();
		const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`;
	}

	// Check if current time is within class time
	function isWithinClassTime(): boolean {
		const now = new Date();
		const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
		const startSeconds = parseTimeToSeconds(classStartTime);
		const endSeconds = parseTimeToSeconds(classEndTime);
		return currentSeconds >= startSeconds && currentSeconds <= endSeconds;
	}

	let isClassActive = $state(isWithinClassTime());

	// Track current time for progress display
	let currentTime = $state(getCurrentTimeString());

	// Update isClassActive and currentTime every second
	$effect(() => {
		const interval = setInterval(() => {
			isClassActive = isWithinClassTime();
			currentTime = getCurrentTimeString();
		}, 1000);

		return () => clearInterval(interval);
	});

	// Initialize components from attendance record
	let components = $state<SubjectClassAllocationAttendanceComponent[]>([]);

	// Update components when attendanceRecord changes
	$effect(() => {
		components = attendanceRecord.attendanceComponents || [];
	});
</script>

<div class="transition-all">
	<div class="flex items-center justify-between gap-x-4 rounded-t-md border-x border-t p-3">
		<div class="flex items-center gap-2">
			<Avatar.Root class="h-10 w-10">
				<Avatar.Fallback>
					{user.firstName.charAt(0)}{user.lastName.charAt(0)}
				</Avatar.Fallback>
			</Avatar.Root>
			<h3 class="truncate font-medium">{fullName}</h3>
		</div>

		<div class="flex items-center gap-2">
			<form
				method="POST"
				action="?/updateAttendance"
				use:formEnhance
				class="flex items-center gap-2"
			>
				<input type="hidden" name="userId" value={user.id} />
				<input
					type="hidden"
					name="subjectClassAllocationId"
					value={attendanceRecord.subjectClassAllocation.id}
				/>

				<Form.Field {form} name="status" class="flex gap-0 space-y-0">
					<Form.Control>
						{#snippet children({ props })}
							<Button
								class="border-input w-[120px] rounded-r-none disabled:opacity-100! {type ===
									'marked' && $formData.status === 'present'
									? 'bg-success/50! text-success-foreground!'
									: ''} {type === 'marked' && $formData.status === 'absent'
									? 'bg-destructive/50! text-destructive-foreground!'
									: ''}"
								onclick={async () => {
									await tick();
									form.submit();
								}}
								variant="outline"
								disabled={type === 'marked' || !isClassActive}
							>
								{$formData.status.slice(0, 1).toUpperCase() + $formData.status.slice(1)}
							</Button>
							<Select.Root
								type="single"
								bind:value={$formData.status}
								name={props.name}
								disabled={!isClassActive}
								onValueChange={async () => {
									await tick();
									form.submit();
								}}
							>
								<Select.Trigger {...props} class="rounded-l-none border-l-0" />
								<Select.Content>
									<Select.Item value="present" label="Present" />
									<Select.Item value="absent" label="Absent" />
								</Select.Content>
							</Select.Root>
						{/snippet}
					</Form.Control>
				</Form.Field>

				<Form.Field {form} name="behaviourQuickActionIds" class="space-y-0">
					<Form.Control>
						{#snippet children({ props })}
							<Select.Root
								type="multiple"
								{...props}
								disabled={!isClassActive}
								bind:value={$formData.behaviourQuickActionIds}
								onValueChange={async () => {
									await tick();
									form.submit();
								}}
							>
								<Select.Trigger class="w-[140px]">
									{selectedBehavioursLabel}
								</Select.Trigger>
								<Select.Content>
									{#each behaviourOptions as option}
										<Select.Item value={option.value}>
											{option.label}
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{/snippet}
					</Form.Control>
				</Form.Field>
			</form>
			<Button
				variant="outline"
				onclick={() => (dialogOpen = true)}
				disabled={type === 'unmarked' || !isClassActive}
			>
				<NotepadText />
			</Button>
			<Button variant="outline" href={`${page.url.pathname}/${user.id}`}>
				<History />
			</Button>
		</div>
	</div>

	<!-- Attendance Progress Bar -->
	<AttendanceProgressBar
		{classStartTime}
		{classEndTime}
		bind:components
		bind:showSlider
		{currentTime}
		attendanceId={attendanceRecord.attendance?.id}
		disabled={type === 'unmarked' || !isClassActive}
	/>
</div>

<!-- Modal Dialog -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="max-w-md">
		<form method="POST" action="?/updateAttendance" use:formEnhance>
			<Dialog.Header>
				<Dialog.Title>{fullName}</Dialog.Title>
			</Dialog.Header>
			<input type="hidden" name="userId" value={user.id} />
			<input
				type="hidden"
				name="subjectClassAllocationId"
				value={attendanceRecord.subjectClassAllocation.id}
			/>
			<div class="py-4">
				<Form.Field {form} name="noteTeacher">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label class="text-sm font-medium">Additional Notes</Form.Label>
							<Textarea
								{...props}
								bind:value={$formData.noteTeacher}
								class="min-h-20 resize-none"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => (dialogOpen = false)}>Close</Button>
				<Button variant="default" type="submit">Save</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
