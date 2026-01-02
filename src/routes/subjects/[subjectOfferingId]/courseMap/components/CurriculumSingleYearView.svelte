<script lang="ts">
	import type { CourseMapItem } from '$lib/server/db/schema';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Plus from '@lucide/svelte/icons/plus';
	import CourseMapItemTableCell from './CourseMapItemTableCell.svelte';

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

<div class="w-full">
	<!-- Single Curriculum Map Grid -->
	<div class="w-full">
		{#if !compact}
			<div class="mb-4">
				<h3 class="flex items-center gap-2 text-lg font-semibold">
					<Calendar class="h-5 w-5" />
					{yearLevel} Curriculum Map
				</h3>
			</div>
		{/if}

		<div class="w-full overflow-x-auto {compact ? 'rounded-lg' : ''}">
			<table class="border-border w-full border-collapse border {compact ? 'rounded-lg overflow-hidden' : ''}">
				<!-- Week headers -->
				<thead>
					<tr>
						<th
							class="text-muted-foreground bg-muted/30 w-24 border p-2 text-left text-xs font-medium {compact ? 'first:rounded-tl-lg' : ''}"
						>
							Semester
						</th>
						{#each Array.from({ length: 18 }, (_, i) => i + 1) as weekNum}
							<th class="bg-muted/50 w-16 border p-1 text-center text-xs font-medium {compact && weekNum === 18 ? 'rounded-tr-lg' : ''}">
								{weekNum}
							</th>
						{/each}
					</tr>
				</thead>


				<tbody>
					<!-- Semester rows -->
					{#each [1, 2] as semester}
						{@const semesterItems = courseMapItemsBySemester[semester] || []}
						{@const currentSemester = semester}
						{@const isLastSemester = semester === 2}

						<tr>
							<!-- Semester label -->
							<td class="text-muted-foreground bg-muted/30 border p-2 text-xs font-medium {compact && isLastSemester ? 'rounded-bl-lg' : ''}">
								<div>
									<div class="font-medium">Semester {semester}</div>
									<div class="text-xs opacity-70">
										{semesterItems.length} items
									</div>
								</div>
							</td>

							<!-- Week columns -->
							{#each Array.from({ length: 18 }, (_, i) => i + 1) as weekNum}
								{@const weekItems = getItemsForSemesterWeek(currentSemester, weekNum)}
								{@const isLastCell = isLastSemester && weekNum === 18}

								<td
									class="border-border/50 bg-muted/20 hover:bg-muted/40 relative {compact ? 'h-20' : 'h-80'} border transition-colors {compact && isLastCell ? 'rounded-br-lg' : ''}"
								>
									{#if weekItems.length === 0}
										<!-- Empty week - clickable area with plus icon on hover -->
										<button
											type="button"
											class="group absolute inset-0 m-0 flex cursor-pointer items-center justify-center border-0 bg-transparent p-0"
											aria-label="Add item to week {weekNum} semester {currentSemester}"
											onclick={() => handleAddItem(currentSemester, weekNum)}
										>
											<span
												class="pointer-events-none opacity-0 transition-opacity duration-200 group-hover:opacity-100"
											>
												<Plus class="text-muted-foreground {compact ? '' : 'h-6 w-6'}" />
											</span>
										</button>
									{:else}
										<!-- Show course map items -->
										{#each weekItems.slice(0, 1) as item, index}
											{@const position = getItemPosition(item, weekNum)}
											{#if position.isStart}
												<!-- Only render the widget at the start week -->
												<div class="absolute inset-0" style="padding: 1px;">
													{#key `${item.id}-${item.color}-${item.topic}`}
														<CourseMapItemTableCell
															{item}
															isStart={true}
															weekLength={calculateWeekLength(item, weekNum)}
															{onCourseMapItemClick}
															{onCourseMapItemEdit}
															{compact}
														/>
													{/key}
												</div>
											{/if}
										{/each}

										{#if weekItems.length > 1}
											<div
												class="text-muted-foreground bg-background absolute right-1 bottom-1 z-20 rounded px-1 text-[8px]"
											>
												+{weekItems.length - 1}
											</div>
										{/if}
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
