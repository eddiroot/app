<script lang="ts">
	import EventCard from '$lib/components/event-card.svelte';
	import TimetableCard from '$lib/components/timetable-card.svelte';
	import * as Button from '$lib/components/ui/button';
	import { days } from '$lib/utils';
	import { generateTimeslots, getClassPosition } from '$lib/utils/timetable';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	let { data } = $props();

	let weekEvents = $derived(data.weekEvents);
	let userRSVPs = $derived(data.userRSVPs);
	let currentWeekStart = $derived(data.currentWeekStart);
	let classAllocation = $derived(data.classAllocation);

	const dayStartHour = 8;
	let timeslots = generateTimeslots(dayStartHour, 22);
	const slotHeightPx = 90;

	function formatWeekDisplay(weekStart: string): string {
		const startDate = new Date(weekStart);
		const endDate = new Date(startDate);
		endDate.setDate(startDate.getDate() + 6);

		const formatOptions: Intl.DateTimeFormatOptions = {
			month: 'short',
			day: 'numeric',
		};

		const startFormatted = startDate.toLocaleDateString('en-AU', formatOptions);
		const endFormatted = endDate.toLocaleDateString('en-AU', formatOptions);

		return `${startFormatted} - ${endFormatted}, ${startDate.getFullYear()}`;
	}

	// Helper function to get events for a specific day
	function getEventsForDay(dayValue: string) {
		return weekEvents.filter((event) => {
			const dayOfWeek = event.event.start.getDay();
			const dayIndex = dayOfWeek === 0 ? -1 : dayOfWeek - 1;
			return (
				dayIndex >= 0 &&
				dayIndex < days.length &&
				days[dayIndex].value === dayValue
			);
		});
	}

	// Helper function to get subject color by subject offering ID
	function getSubjectColor(subjectOfferingId?: number): number | undefined {
		if (!subjectOfferingId || !classAllocation) return undefined;

		const allocation = classAllocation.find(
			(c) => c.subjectOffering.id === subjectOfferingId,
		);
		return allocation?.userSubjectOffering.color;
	}

	// Helper function to check if user has RSVP'd to an event
	function hasUserRSVPd(eventId: number): boolean {
		return userRSVPs.some(
			(rsvp) => rsvp.eventId === eventId && rsvp.isAttending,
		);
	}

	// Helper function to get RSVP status for an event
	function getRSVPStatus(event: any): 'required' | 'completed' | 'none' {
		if (!event.requiresRSVP) return 'none';
		return hasUserRSVPd(event.id) ? 'completed' : 'required';
	}

	// Helper function to check if two time ranges overlap
	function timesOverlap(
		start1: Date,
		end1: Date,
		start2: Date,
		end2: Date,
	): boolean {
		return start1 < end2 && start2 < end1;
	}

	// Get classes for a specific day
	function getClassesForDay(dayValue: string) {
		return classAllocation.filter((c) => {
			const classDate = new Date(c.classAllocation.start);
			const dayOfWeek = classDate.getDay();
			const dayIndex = dayOfWeek === 0 ? -1 : dayOfWeek - 1;
			return (
				dayIndex >= 0 &&
				dayIndex < days.length &&
				days[dayIndex].value === dayValue
			);
		});
	}

	// Get all overlapping items (classes + events) for a given time range on a specific day
	function getOverlappingItems(
		dayValue: string,
		itemStart: Date,
		itemEnd: Date,
	) {
		const items: Array<{
			id: string;
			start: Date;
			end: Date;
			type: 'class' | 'event';
		}> = [];

		for (const cls of getClassesForDay(dayValue)) {
			if (
				timesOverlap(
					itemStart,
					itemEnd,
					cls.classAllocation.start,
					cls.classAllocation.end,
				)
			) {
				items.push({
					id: `class-${cls.subjectOffering.id}-${cls.classAllocation.id}`,
					start: cls.classAllocation.start,
					end: cls.classAllocation.end,
					type: 'class',
				});
			}
		}

		for (const event of getEventsForDay(dayValue)) {
			if (
				timesOverlap(itemStart, itemEnd, event.event.start, event.event.end)
			) {
				items.push({
					id: `event-${event.event.id}`,
					start: event.event.start,
					end: event.event.end,
					type: 'event',
				});
			}
		}

		return items;
	}

	// Get the sorted index of a specific item among its overlapping group (classes first)
	function getItemIndex(
		dayValue: string,
		itemStart: Date,
		itemEnd: Date,
		currentId: string,
	): number {
		const overlapping = getOverlappingItems(dayValue, itemStart, itemEnd);
		overlapping.sort((a, b) => {
			if (a.type !== b.type) return a.type === 'class' ? -1 : 1;
			const d = a.start.getTime() - b.start.getTime();
			return d !== 0 ? d : a.end.getTime() - b.end.getTime();
		});
		const idx = overlapping.findIndex((item) => item.id === currentId);
		return idx >= 0 ? idx : 0;
	}

	// Get total number of overlapping items for a time range on a day
	function getOverlappingCount(
		dayValue: string,
		itemStart: Date,
		itemEnd: Date,
	): number {
		return getOverlappingItems(dayValue, itemStart, itemEnd).length;
	}

	let hoveredItemId: string | null = $state(null);
</script>

<div class="bg-background sticky top-0 z-50 space-y-4 p-8">
	<!-- Week Navigation -->
	<div class="flex items-center justify-between">
		<Button.Root
			variant="outline"
			size="sm"
			href="?week={new Date(
				new Date(currentWeekStart).setDate(
					new Date(currentWeekStart).getDate() - 7,
				),
			)
				.toISOString()
				.split('T')[0]}"
		>
			<ChevronLeft />
			Previous Week
		</Button.Root>

		<div class="text-center text-lg font-semibold">
			Week of {formatWeekDisplay(currentWeekStart)}
		</div>

		<Button.Root
			variant="outline"
			size="sm"
			href="?week={new Date(
				new Date(currentWeekStart).setDate(
					new Date(currentWeekStart).getDate() + 7,
				),
			)
				.toISOString()
				.split('T')[0]}"
		>
			Next Week
			<ChevronRight />
		</Button.Root>
	</div>

	<!-- Day titles -->
	<div class="grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr]">
		<div class="text-center text-base font-semibold text-transparent">Time</div>
		{#each days as day}
			<div
				class="border-primary/20 text-foreground hidden text-center text-base font-semibold md:block"
			>
				{day.name}
			</div>
			<div
				class="border-primary/20 text-foreground text-center text-base font-semibold md:hidden"
			>
				{day.shortName}
			</div>
		{/each}
	</div>
</div>

<!-- Timetable grid -->
<div
	class="relative mt-4 grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr] p-8 pt-0"
	style="height: {timeslots.length * slotHeightPx + 12}px;"
>
	<!-- Time legend column -->
	<div class="bg-background relative">
		{#each timeslots as slot}
			<div
				class="text-muted-foreground flex items-start justify-start pr-4 text-xs"
				style="height: {slotHeightPx}px; transform: translateY(-8px);"
			>
				{slot}
			</div>
		{/each}
	</div>

	{#each days as day}
		<div class="border-border relative border-r last:border-r-0">
			<!-- Background timeslot lines -->
			{#each timeslots}
				<div
					class="border-border border-t"
					style="height: {slotHeightPx}px;"
				></div>
			{/each}

			<!-- Classes for this day -->
			{#each getClassesForDay(day.value) as cls}
				{@const position = getClassPosition(
					dayStartHour,
					cls.classAllocation.start,
					cls.classAllocation.end,
					slotHeightPx,
				)}
				{@const itemId = `class-${cls.subjectOffering.id}-${cls.classAllocation.id}`}
				{@const count = getOverlappingCount(
					day.value,
					cls.classAllocation.start,
					cls.classAllocation.end,
				)}
				{@const idx = getItemIndex(
					day.value,
					cls.classAllocation.start,
					cls.classAllocation.end,
					itemId,
				)}
				{@const hovered = hoveredItemId === itemId}
				<div
					role="presentation"
					class="absolute transition-all duration-200"
					style="top: {position.top}; height: {position.height};{hovered
						? ` min-height: ${slotHeightPx}px;`
						: ''} left: {hovered ? 0 : idx * (100 / count)}%; width: {hovered
						? 100
						: 100 / count}%; z-index: {hovered ? 50 : 30 - idx};"
					onmouseenter={() => (hoveredItemId = itemId)}
					onmouseleave={() => (hoveredItemId = null)}
				>
					<TimetableCard {cls} href="/subjects/{cls.subjectOffering.id}" />
				</div>
			{/each}
			<!-- Events for this day -->
			{#each getEventsForDay(day.value) as event}
				{@const position = getClassPosition(
					dayStartHour,
					event.event.start,
					event.event.end,
					slotHeightPx,
				)}
				{@const rsvpStatus = getRSVPStatus(event)}
				{@const itemId = `event-${event.event.id}`}
				{@const count = getOverlappingCount(
					day.value,
					event.event.start,
					event.event.end,
				)}
				{@const idx = getItemIndex(
					day.value,
					event.event.start,
					event.event.end,
					itemId,
				)}
				{@const hovered = hoveredItemId === itemId}
				<div
					role="presentation"
					class="absolute transition-all duration-200"
					style="top: {position.top}; height: {position.height};{hovered
						? ` min-height: ${slotHeightPx - 30}px;`
						: ''} left: {hovered ? 0 : idx * (100 / count)}%; width: {hovered
						? 100
						: 100 / count}%; z-index: {hovered ? 50 : 10 - idx};"
					onmouseenter={() => (hoveredItemId = itemId)}
					onmouseleave={() => (hoveredItemId = null)}
				>
					<EventCard
						event={event.event}
						subjectInfo={event.subject}
						subjectColor={getSubjectColor(event.subjectOffering?.id)}
						{rsvpStatus}
					/>
				</div>
			{/each}
		</div>
	{/each}
</div>
