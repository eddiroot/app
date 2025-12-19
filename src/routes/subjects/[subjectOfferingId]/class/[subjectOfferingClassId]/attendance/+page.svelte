<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { convertToFullName } from '$lib/utils';
	import { flip } from 'svelte/animate';

	import { fade } from 'svelte/transition';
	import StudentAttendanceListItem from './components/StudentAttendanceListItem.svelte';

	const { data } = $props();
	const attendances = $derived(data.attendances || []);
	const behaviourQuickActions = $derived(data.behaviourQuickActions || []);

	let searchTerm = $state('');

	const filteredAttendances = $derived(
		attendances.filter((attendance) => {
			const fullName = convertToFullName(
				attendance.user.firstName,
				attendance.user.middleName,
				attendance.user.lastName
			);
			return fullName.toLowerCase().includes(searchTerm.toLowerCase());
		})
	);

	const unmarkedAttendances = $derived(
		filteredAttendances
			.filter((attendance) => {
				// Include if no attendance record
				return !attendance.attendance;
			})
			.sort((a, b) => {
				const aName = convertToFullName(a.user.firstName, a.user.middleName, a.user.lastName);
				const bName = convertToFullName(b.user.firstName, b.user.middleName, b.user.lastName);
				return aName.localeCompare(bName);
			})
	);

	const markedAttendances = $derived(
		filteredAttendances
			.filter((attendance) => {
				// Include if attendance record
				return !!attendance.attendance;
			})
			.sort((a, b) => {
				const aName = convertToFullName(a.user.firstName, a.user.middleName, a.user.lastName);
				const bName = convertToFullName(b.user.firstName, b.user.middleName, b.user.lastName);
				return aName.localeCompare(bName);
			})
	);
</script>

<div class="flex h-full flex-col space-y-6 p-8">
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<h1 class="text-3xl font-bold tracking-tight">Attendance</h1>
		{#if attendances.length >= 0}
			<Input placeholder="Search students..." bind:value={searchTerm} class="w-full max-w-sm" />
		{/if}
	</div>

	<!-- Unmarked Attendance Section -->
	{#if unmarkedAttendances.length > 0}
		<div class="space-y-4">
			<h2 class="text-foreground text-xl font-semibold">
				Unrecorded ({unmarkedAttendances.length})
			</h2>
			<div class="space-y-3">
				{#each unmarkedAttendances as attendanceRecord (attendanceRecord.user.id)}
					<div animate:flip={{ duration: 400 }} in:fade={{ duration: 200 }}>
						<StudentAttendanceListItem {attendanceRecord} {behaviourQuickActions} type="unmarked" />
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Marked Attendance Section -->
	{#if markedAttendances.length > 0}
		<div class="space-y-4">
			<h2 class="text-foreground text-xl font-semibold">
				Recorded ({markedAttendances.length})
			</h2>
			<div class="space-y-3">
				{#each markedAttendances as attendanceRecord (attendanceRecord.user.id)}
					<div animate:flip={{ duration: 400 }} in:fade={{ duration: 200 }}>
						<StudentAttendanceListItem {attendanceRecord} {behaviourQuickActions} type="marked" />
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- No results messages -->
	{#if filteredAttendances.length === 0 && attendances.length > 0}
		<div class="text-muted-foreground py-8 text-center">
			No students found matching your search.
		</div>
	{:else if unmarkedAttendances.length === 0 && markedAttendances.length === 0 && attendances.length > 0}
		<div class="text-muted-foreground py-8 text-center">
			No students found matching your search.
		</div>
	{/if}
</div>
