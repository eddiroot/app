<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { subjectClassAllocationAttendanceComponentType } from '$lib/enums.js';
	import type { SubjectClassAllocationAttendanceComponent } from '$lib/server/db/schema';

	let {
		classStartTime,
		classEndTime,
		components = $bindable([]),
		showSlider = $bindable(false),
		attendanceId,
		disabled = false,
	}: {
		classStartTime: Date;
		classEndTime: Date;
		components?: SubjectClassAllocationAttendanceComponent[];
		showSlider?: boolean;
		attendanceId?: number;
		disabled?: boolean;
	} = $props();

	function timeToPercent(time: Date): number {
		if (time <= classStartTime) return 0;
		if (time >= classEndTime) return 100;
		const totalDuration = classEndTime.getTime() - classStartTime.getTime();
		const elapsed = time.getTime() - classStartTime.getTime();
		return (elapsed / totalDuration) * 100;
	}

	function percentToTime(percent: number): Date {
		const totalDuration = classEndTime.getTime() - classStartTime.getTime();
		const timeOffset = (percent / 100) * totalDuration;
		return new Date(classStartTime.getTime() + timeOffset);
	}

	const breakpoints = $derived(
		components.length > 0
			? components.slice(0, -1).map((comp) => comp.end)
			: [],
	);

	function handleSliderChange(index: number, newTime: Date) {
		const updated = [...components];
		updated[index] = { ...updated[index], end: newTime };
		updated[index + 1] = { ...updated[index + 1], start: newTime };
		components = updated;
	}

	let originalComponents: SubjectClassAllocationAttendanceComponent[] =
		$derived(components);
	let isSaving = $state(false);

	async function handleSave() {
		if (!attendanceId) return;

		isSaving = true;
		try {
			const formData = new FormData();
			formData.append('attendanceId', attendanceId.toString());
			formData.append('components', JSON.stringify(components));

			const response = await fetch('?/updateComponents', {
				method: 'POST',
				body: formData,
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
		onclick={() => (showSlider = !showSlider)}
		aria-label="Toggle attendance time range editor"
		{disabled}
		class="bg-muted/50 relative flex h-2 w-full overflow-hidden rounded-b-md border transition-all {disabled
			? 'cursor-default'
			: 'hover:h-3'}"
	>
		{#each components as component}
			{@const totalDuration = classEndTime.getTime() - classStartTime.getTime()}
			{@const componentDuration =
				component.end.getTime() - component.start.getTime()}
			{@const widthPercent = (componentDuration / totalDuration) * 100}
			{@const colorClass =
				component.type === subjectClassAllocationAttendanceComponentType.absent
					? 'bg-destructive/40'
					: component.type ===
						  subjectClassAllocationAttendanceComponentType.classPass
						? 'bg-warning/40'
						: 'bg-success/40'}
			<div
				class="{colorClass} h-full"
				style="width: {widthPercent}%; transition: width 0.1s linear;"
			></div>
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
					{@const totalDuration =
						classEndTime.getTime() - classStartTime.getTime()}
					{@const componentDuration =
						component.end.getTime() - component.start.getTime()}
					{@const widthPercent = (componentDuration / totalDuration) * 100}
					{@const colorClass =
						component.type ===
						subjectClassAllocationAttendanceComponentType.absent
							? 'bg-destructive/40'
							: component.type ===
								  subjectClassAllocationAttendanceComponentType.classPass
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
							const start = breakpointTime;
							const rect = e.currentTarget
								.closest('.relative.h-8')
								?.getBoundingClientRect();
							if (!rect) return;

							function onMouseMove(moveEvent: MouseEvent) {
								const deltaX = moveEvent.clientX - startX;
								const deltaPercent = (deltaX / rect?.width!) * 100;
								const currentPercent = timeToPercent(start);
								const newPercent = Math.max(
									0,
									Math.min(100, currentPercent + deltaPercent),
								);
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
							{breakpointTime.toLocaleTimeString([], {
								hour: '2-digit',
								minute: '2-digit',
							})}
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
				<Button
					variant="outline"
					size="sm"
					onclick={() => {
						components = originalComponents;
						showSlider = false;
					}}
					disabled={isSaving}>Cancel</Button
				>
				<Button
					variant="default"
					size="sm"
					onclick={handleSave}
					disabled={isSaving}
				>
					{isSaving ? 'Saving...' : 'Save'}
				</Button>
			</div>
		</div>
	</div>
{/if}
