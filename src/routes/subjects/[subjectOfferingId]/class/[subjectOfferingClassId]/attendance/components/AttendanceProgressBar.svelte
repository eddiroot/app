<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { subjectClassAllocationAttendanceComponentType } from '$lib/enums.js';
	import type { SubjectClassAllocationAttendanceComponent } from '$lib/server/db/schema';

	let {
		classStartTime,
		classEndTime,
		components = $bindable([]),
		showSlider = $bindable(false),
		currentTime,
		attendanceId,
		disabled = false
	}: {
		classStartTime: string;
		classEndTime: string;
		components?: SubjectClassAllocationAttendanceComponent[];
		showSlider?: boolean;
		currentTime: string;
		attendanceId?: number;
		disabled?: boolean;
	} = $props();

	// Parse time strings to get seconds since midnight
	function parseTime(timeStr: string): number {
		const parts = timeStr.split(':').map(Number);
		if (parts.length === 3) {
			return parts[0] * 3600 + parts[1] * 60 + parts[2];
		}
		return parts[0] * 3600 + parts[1] * 60;
	}

	// Convert seconds since midnight to time string HH:MM:SS
	function secondsToTimeString(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);
		return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	// Format time for display (HH:MM AM/PM)
	function formatTimeForDisplay(timeStr: string): string {
		const seconds = parseTime(timeStr);
		const hours = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
		return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
	}

	const classStartSeconds = $derived(parseTime(classStartTime));
	const classEndSeconds = $derived(parseTime(classEndTime));
	const totalSeconds = $derived(classEndSeconds - classStartSeconds);
	const currentSeconds = $derived(parseTime(currentTime));

	// Convert time to percentage of class duration
	function timeToPercent(timeStr: string): number {
		const seconds = parseTime(timeStr);
		const relativeSeconds = seconds - classStartSeconds;
		return (relativeSeconds / totalSeconds) * 100;
	}

	// Convert percentage to time string
	function percentToTime(percent: number): string {
		const relativeSeconds = (percent / 100) * totalSeconds;
		const absoluteSeconds = classStartSeconds + relativeSeconds;
		return secondsToTimeString(absoluteSeconds);
	}

	// Calculate breakpoint times for draggable handles
	const breakpoints = $derived(
		components.length > 0 ? components.slice(0, -1).map((comp) => comp.endTime) : []
	);

	function handleSliderChange(index: number, newTime: string) {
		const updated = [...components];

		// Update the end time of current component and start time of next
		updated[index] = { ...updated[index], endTime: newTime };
		updated[index + 1] = { ...updated[index + 1], startTime: newTime };

		components = updated;
	}

	let originalComponents: SubjectClassAllocationAttendanceComponent[] = [];
	let isSaving = $state(false);

	function handleBarClick() {
		if (!showSlider) {
			// Store original state when opening slider
			originalComponents = JSON.parse(JSON.stringify(components));
		}
		showSlider = !showSlider;
	}

	function handleCancel() {
		// Restore original state
		components = originalComponents;
		showSlider = false;
	}

	async function handleSave() {
		if (!attendanceId) return;

		isSaving = true;
		try {
			const formData = new FormData();
			formData.append('attendanceId', attendanceId.toString());
			formData.append(
				'components',
				JSON.stringify(
					components.map((c) => ({
						id: c.id,
						startTime: c.startTime,
						endTime: c.endTime
					}))
				)
			);

			const response = await fetch('?/updateComponents', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				showSlider = false;
			}
		} catch (err) {
			console.error('Failed to save components:', err);
		} finally {
			isSaving = false;
		}
	}
</script>

<!-- Attendance Progress Bar -->
{#if !showSlider}
	<button
		type="button"
		onclick={handleBarClick}
		aria-label="Toggle attendance time range editor"
		{disabled}
		class="bg-muted/50 relative flex h-2 w-full overflow-hidden rounded-b-md border transition-all {disabled
			? 'cursor-default'
			: 'hover:h-3'}"
	>
		{#each components as component}
			{@const componentStartSeconds = parseTime(component.startTime)}
			{@const componentEndSeconds = parseTime(component.endTime)}
			{@const cappedEndSeconds = Math.min(componentEndSeconds, currentSeconds)}
			{@const visibleStartSeconds = Math.max(componentStartSeconds, classStartSeconds)}
			{@const visibleEndSeconds = Math.max(
				visibleStartSeconds,
				Math.min(cappedEndSeconds, classEndSeconds)
			)}
			{@const visibleDuration = visibleEndSeconds - visibleStartSeconds}
			{@const widthPercent = (visibleDuration / totalSeconds) * 100}
			{@const colorClass =
				component.type === subjectClassAllocationAttendanceComponentType.absent
					? 'bg-destructive/40'
					: component.type === subjectClassAllocationAttendanceComponentType.classPass
						? 'bg-warning/40'
						: 'bg-success/40'}
			{#if visibleDuration > 0}
				<div
					class="{colorClass} h-full"
					style="width: {widthPercent}%; transition: width 0.1s linear;"
				></div>
			{/if}
		{/each}
	</button>
{:else}
	<!-- Slider View -->
	<div class="rounded-b-md border-x border-b p-4">
		<div class="relative h-8 w-full">
			<!-- Background colored sections -->
			<div
				class="absolute inset-x-0 top-1/2 flex h-2 -translate-y-1/2 overflow-hidden rounded-full"
			>
				{#each components as component}
					{@const componentDuration = parseTime(component.endTime) - parseTime(component.startTime)}
					{@const widthPercent = (componentDuration / totalSeconds) * 100}
					{@const colorClass =
						component.type === subjectClassAllocationAttendanceComponentType.absent
							? 'bg-destructive/40'
							: component.type === subjectClassAllocationAttendanceComponentType.classPass
								? 'bg-warning/40'
								: 'bg-success/40'}
					<div class="{colorClass} h-full" style="width: {widthPercent}%"></div>
				{/each}
			</div>

			<!-- Draggable handles -->
			{#each breakpoints as breakpointTime, index}
				{@const positionPercent = timeToPercent(breakpointTime)}
				<div
					class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
					style="left: {positionPercent}%"
				>
					<button
						type="button"
						class="bg-background relative h-6 w-6 cursor-grab rounded-full border-2 shadow-md transition-all hover:scale-110 active:scale-105 active:cursor-grabbing"
						onmousedown={(e) => {
							e.preventDefault();
							const startX = e.clientX;
							const startTime = breakpointTime;
							const rect = e.currentTarget.closest('.relative.h-8')?.getBoundingClientRect();
							if (!rect) return;

							function onMouseMove(moveEvent: MouseEvent) {
								const deltaX = moveEvent.clientX - startX;
								const deltaPercent = (deltaX / rect?.width!) * 100;
								const currentPercent = timeToPercent(startTime);
								const newPercent = Math.max(0, Math.min(100, currentPercent + deltaPercent));
								const newTime = percentToTime(newPercent);
								handleSliderChange(index, newTime);
							}

							function onMouseUp() {
								document.removeEventListener('mousemove', onMouseMove);
								document.removeEventListener('mouseup', onMouseUp);
							}

							document.addEventListener('mousemove', onMouseMove);
							document.addEventListener('mouseup', onMouseUp);
						}}
					>
						<span
							class="text-muted-foreground absolute top-8 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap"
						>
							{formatTimeForDisplay(breakpointTime)}
						</span>
					</button>
				</div>
			{/each}
		</div>

		<div class="mt-6 flex items-center justify-between">
			<div class="flex gap-4 text-sm">
				<div class="flex items-center gap-2">
					<div class="bg-success/40 h-3 w-3 rounded-sm"></div>
					<span>Present</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="bg-warning/40 h-3 w-3 rounded-sm"></div>
					<span>Class Pass</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="bg-destructive/40 h-3 w-3 rounded-sm"></div>
					<span>Absent</span>
				</div>
			</div>
			<div class="flex gap-2">
				<Button variant="outline" size="sm" onclick={handleCancel} disabled={isSaving}
					>Cancel</Button
				>
				<Button variant="default" size="sm" onclick={handleSave} disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save'}
				</Button>
			</div>
		</div>
	</div>
{/if}
