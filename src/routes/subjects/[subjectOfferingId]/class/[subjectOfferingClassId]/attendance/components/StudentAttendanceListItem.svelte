<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import {
		type BehaviourQuickAction,
		type SubjectClassAllocation,
		type SubjectClassAllocationAttendance,
		type User
	} from '$lib/server/db/schema';
	import { convertToFullName } from '$lib/utils';
	import History from '@lucide/svelte/icons/history';
	import MessageCircleWarning from '@lucide/svelte/icons/message-circle-warning';
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import NotepadText from '@lucide/svelte/icons/notepad-text';
	import { tick } from 'svelte';
	import { fade } from 'svelte/transition';
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

	const form = superForm(
		{
			subjectClassAllocationId: attendanceRecord.subjectClassAllocation.id,
			userId: attendanceRecord.user.id,
			status: attendanceRecord.attendance?.status || '',
			noteTeacher: attendanceRecord.attendance?.noteTeacher || '',
			behaviourQuickActionIds: (attendanceRecord.behaviourQuickActionIds ?? []).map(String)
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

	const statusOptions = [
		{ value: 'present', label: 'Present' },
		{ value: 'absent', label: 'Absent' }
	];

	const selectedStatusLabel = $derived(
		statusOptions.find((option) => option.value === $formData.status)?.label || 'Status'
	);

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

<div class="border-border border-b transition-all last:border-b-0" in:fade={{ duration: 200 }}>
	<div class="flex items-center justify-between p-4">
		<!-- Student info and status -->
		<div class="flex items-center gap-2">
			<div class="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
				<span class="text-sm font-medium">
					{user.firstName.charAt(0)}{user.lastName.charAt(0)}
				</span>
			</div>
			<div class="flex flex-col">
				<h3 class="truncate font-medium">{fullName}</h3>
				<div class="flex items-center gap-2">
					{#if attendance?.noteTeacher}
						<NotebookPen class="size-4" />
					{/if}

					{#if attendance?.noteGuardian}
						<MessageCircleWarning class="text-destructive size-4" />
					{/if}
				</div>
			</div>
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

				<Form.Field {form} name="status" class="space-y-0">
					<Form.Control>
						{#snippet children({ props })}
							<Select.Root
								type="single"
								bind:value={$formData.status}
								name={props.name}
								onValueChange={async () => {
									await tick();
									form.submit();
								}}
							>
								<Select.Trigger {...props} class="w-[120px]">
									{selectedStatusLabel}
								</Select.Trigger>
								<Select.Content>
									{#each statusOptions as option}
										<Select.Item value={option.value} label={option.label} />
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
