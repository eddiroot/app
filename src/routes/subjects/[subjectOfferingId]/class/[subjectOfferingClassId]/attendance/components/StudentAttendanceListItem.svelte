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

	type AttendanceRecord = {
		user: Pick<User, 'id' | 'firstName' | 'middleName' | 'lastName'>;
		attendance?: SubjectClassAllocationAttendance | null;
		subjectClassAllocation: Pick<SubjectClassAllocation, 'id'>;
		behaviourQuickActionIds?: number[];
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
	const attendance = $derived(attendanceRecord.attendance);
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
</script>

<div class="space-y-2 rounded-md border p-2 transition-all">
	<div class="flex items-center justify-between gap-x-4">
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
								class="w-[120px] rounded-r-none border-r-0 {type === 'marked' &&
								$formData.status === 'present'
									? 'bg-success! text-success-foreground! disabled:opacity-100'
									: ''} {type === 'marked' && $formData.status === 'absent'
									? 'bg-destructive! text-destructive-foreground! disabled:opacity-100'
									: ''}"
								onclick={async () => {
									await tick();
									form.submit();
								}}
								variant="outline"
								disabled={type === 'marked'}
							>
								{$formData.status.slice(0, 1).toUpperCase() + $formData.status.slice(1)}
							</Button>
							<Select.Root
								type="single"
								bind:value={$formData.status}
								name={props.name}
								onValueChange={async () => {
									await tick();
									form.submit();
								}}
							>
								<Select.Trigger {...props} class="rounded-l-none" />
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
			<Button variant="outline" onclick={() => (dialogOpen = true)} disabled={type === 'unmarked'}>
				<NotepadText />
			</Button>
			<Button variant="outline" href={`${page.url.pathname}/${user.id}`}>
				<History />
			</Button>
		</div>
	</div>
	<div class="bg-muted/50 relative flex h-2 w-full overflow-hidden rounded-full">
		<div class="bg-destructive/40 h-full transition-all" style="width: 10%"></div>
		<div class="bg-success/40 h-full transition-all" style="width: 45%"></div>
		<div class="bg-warning/40 h-full transition-all" style="width: 8%"></div>
		<div class="bg-success/40 h-full transition-all" style="width: 37%"></div>
	</div>

	<!-- For future use in a modal to adjust the times -->
	<!-- <Slider type="multiple" value={[10, 20, 30]} max={100} class="max-w-full"></Slider> -->
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
