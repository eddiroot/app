<script lang="ts">
	import EventCard from '$lib/components/event-card.svelte';
	import TimetableCard from '$lib/components/timetable-card.svelte';
	import * as Button from '$lib/components/ui/button';
	import { days } from '$lib/utils';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import {
		generateTimeslots,
		getClassPosition,
		getEventPosition,
	} from '$lib/utils/timetable';

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
			{#each classAllocation.filter((c) => {
				const classDate = new Date(c.classAllocation.start);
				const dayOfWeek = classDate.getDay();
				const dayIndex = dayOfWeek === 0 ? -1 : dayOfWeek - 1;
				return dayIndex >= 0 && dayIndex < days.length && days[dayIndex].value === day.value;
			}) as cls}
				{@const position = getClassPosition(
					dayStartHour,
					cls.classAllocation.start,
					cls.classAllocation.end,
					slotHeightPx,
				)}
				<div
					class="absolute right-1 left-1 hover:z-10"
					style="top: {position.top}; height: {position.height};"
				>
					<TimetableCard {cls} href="/subjects/{cls.subjectOffering.id}" />
				</div>
			{/each}
			<!-- Events for this day -->
			{#each getEventsForDay(day.value) as event, eventIndex}
				{@const position = getEventPosition(
					dayStartHour,
					event.event.start,
					event.event.end,
					eventIndex,
					slotHeightPx,
				)}
				{@const rsvpStatus = getRSVPStatus(event)}
				<div
					class="absolute right-3 left-1 hover:z-10"
					style="top: {position.top}; height: {position.height};"
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
