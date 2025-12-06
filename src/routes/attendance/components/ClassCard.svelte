<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { formatTimestampAsTime } from '$lib/utils';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import XIcon from '@lucide/svelte/icons/x';
	import type { ScheduleWithAttendanceRecord } from '../utils.js';

	let { record }: { record: ScheduleWithAttendanceRecord } = $props();

	let hasAttendance = $derived(record.attendance !== null);
	let isPresent = $derived(record.attendance?.didAttend ?? false);
	let hasNote = $derived(
		record.attendance?.attendanceNote && record.attendance.attendanceNote.trim() !== ''
	);
</script>

<Card.Root
	class="relative flex p-0 {hasAttendance
		? isPresent
			? 'bg-success/10 border-success/20'
			: 'bg-destructive/10 border-destructive/20'
		: 'bg-muted/20 border-dashed'}"
>
	<Card.Content class="flex flex-1 flex-col justify-between p-3 pl-6">
		<!-- Status indicator bar -->
		<div
			class="absolute inset-y-2 left-2 w-1 rounded-full {hasAttendance
				? isPresent
					? 'bg-success'
					: 'bg-destructive'
				: 'bg-muted'}"
		></div>

		<!-- Main content -->
		<div class="flex-1">
			<div class="mb-1 flex items-center justify-between">
				<div class="text-sm font-medium {hasAttendance ? '' : 'text-muted-foreground'}">
					{record.subject.name} - {record.subjectOfferingClass.name}
				</div>

				<!-- Status icon -->
				<div class="shrink-0">
					{#if hasAttendance}
						{#if isPresent}
							<CheckIcon class="text-success h-4 w-4" />
						{:else}
							<XIcon class="text-destructive h-4 w-4" />
						{/if}
					{:else}
						<ClockIcon class="text-muted-foreground h-4 w-4" />
					{/if}
				</div>
			</div>

			<!-- Status and time -->
			<div
				class="text-xs {hasAttendance
					? isPresent
						? 'text-success-foreground/70'
						: 'text-destructive-foreground/70'
					: 'text-muted-foreground/70'}"
			>
				{hasAttendance
					? isPresent
						? 'Present'
						: hasNote
							? 'Explained Absence'
							: 'Unexplained Absence'
					: 'Scheduled'}
				- {formatTimestampAsTime(record.subjectClassAllocation.startTimestamp)}
			</div>
		</div>
	</Card.Content>
</Card.Root>
