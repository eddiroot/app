<script lang="ts">
	import type { CourseMapItem } from '$lib/server/db/schema';
	import Plus from '@lucide/svelte/icons/plus';
	import CourseMapTableCell from './CourseMapTableCell.svelte';

	let {
		courseMapItems,
		yearLevel,
		onCourseMapItemClick,
		onCourseMapItemEdit,
		onEmptyCellClick,
		compact = false
	}: {
		courseMapItems: CourseMapItem[];
		yearLevel: string;
		onCourseMapItemClick: (item: CourseMapItem) => void;
		onCourseMapItemEdit: (item: CourseMapItem) => void;
		onEmptyCellClick: (week: number, term: number) => void;
		compact?: boolean;
	} = $props();

	const courseMapItemsBySemester = $derived(
		courseMapItems.reduce(
			(acc, item) => {
				const semester = item.semester || 1;
				if (!acc[semester]) {
					acc[semester] = [];
				}
				acc[semester].push(item);
				return acc;
			},
			{} as Record<number, CourseMapItem[]>
		)
	);

	function handleAddItem(semester: number, weekNum: number) {
		onEmptyCellClick(weekNum, semester);
	}

	function getItemsForSemesterWeek(semester: number, weekNum: number): CourseMapItem[] {
		const semesterItems = courseMapItemsBySemester[semester] || [];
		return semesterItems.filter((item) => {
			const startWeek = item.startWeek || 1;
			const duration = item.duration || 1;
			const endWeek = startWeek + duration - 1;
			return weekNum >= startWeek && weekNum <= endWeek;
		});
	}

	function getItemPosition(
		item: CourseMapItem,
		weekNum: number
	): { isStart: boolean; isEnd: boolean; position: number } {
		const startWeek = item.startWeek || 1;
		const duration = item.duration || 1;
		const endWeek = startWeek + duration - 1;
		const isStart = weekNum === startWeek;
		const isEnd = weekNum === endWeek;
		const position = weekNum - startWeek;
		return { isStart, isEnd, position };
	}

	function calculateWeekLength(item: CourseMapItem, currentWeek: number): number {
		const startWeek = item.startWeek || 1;
		const duration = item.duration || 1;
		const endWeek = startWeek + duration - 1;
		const remainingWeeks = Math.min(endWeek - currentWeek + 1, 18 - currentWeek + 1);
		return remainingWeeks;
	}
</script>

<div class="flex h-full w-full flex-col overflow-hidden rounded-lg">
	<!-- Black header row -->
	<div class="grid w-full gap-2 rounded-t-lg bg-black px-1 py-5" style="grid-template-columns: 2.5fr repeat(18, 1fr);">
		<div class="text-center text-xs font-medium text-white">Semester</div>
		{#each Array.from({ length: 18 }, (_, i) => i + 1) as weekNum}
			<div class="text-center text-xs font-medium text-white">{weekNum}</div>
		{/each}
	</div>

	<!-- Table body with light grey background -->
	<div class="flex-1 rounded-b-lg bg-zinc-200 px-1 py-2">
		<div class="flex h-full w-full flex-col gap-2">
			<!-- Semester rows -->
			{#each [1, 2] as semester}
				<div class="grid w-full flex-1 gap-2" style="grid-template-columns: 2.5fr repeat(18, 1fr);">
					<!-- Semester label column -->
					<div class="flex items-center justify-center rounded-xl border border-zinc-300 bg-white shadow-sm">
						<span class="text-sm font-medium">Sem {semester}</span>
					</div>

					<!-- Week columns -->
					{#each Array.from({ length: 18 }, (_, i) => i + 1) as weekNum}
						{@const weekItems = getItemsForSemesterWeek(semester, weekNum)}
						{@const position = weekItems.length > 0 ? getItemPosition(weekItems[0], weekNum) : null}
						{@const isOccupied = weekItems.length > 0}

						{#if position?.isStart}
							<!-- Render spanning item at start week -->
							{@const itemWeeks = calculateWeekLength(weekItems[0], weekNum)}
							<div class="relative" style="grid-column: span {itemWeeks};">
								{#key `${weekItems[0].id}-${weekItems[0].color}-${weekItems[0].topic}`}
									<CourseMapTableCell
										item={weekItems[0]}
										isStart={true}
										weekLength={itemWeeks}
										{onCourseMapItemClick}
										{onCourseMapItemEdit}
										{compact}
									/>
								{/key}
								{#if weekItems.length > 1}
									<div class="absolute bottom-1 right-1 z-20 rounded bg-black px-1 text-[8px] text-white">
										+{weekItems.length - 1}
									</div>
								{/if}
							</div>
						{:else if !isOccupied}
							<!-- Empty cell -->
							<div class="h-full w-full rounded-xl border border-zinc-300 bg-white shadow-sm">
								<button
									type="button"
									class="group h-full w-full"
									aria-label="Add item to week {weekNum} semester {semester}"
									onclick={() => handleAddItem(semester, weekNum)}
								>
									<div class="flex h-full items-center justify-center">
										<Plus class="text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 {compact ? 'h-4 w-4' : 'h-6 w-6'}" />
									</div>
								</button>
							</div>
						{/if}
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>
