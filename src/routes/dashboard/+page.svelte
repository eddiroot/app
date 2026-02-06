<script lang="ts">
	import EventCard from '$lib/components/event-card.svelte';
	import TimetableCard from '$lib/components/timetable-card.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import {
		formatTimestamp,
		generateTimeslots,
		getClassPosition,
		getEventPosition,
	} from '$lib/utils';
	import Pin from '@lucide/svelte/icons/pin';

	let { data } = $props();

	const dayStartHour = 8;
	const dayEndHour = 22;
	let timeslots = $derived(generateTimeslots(dayStartHour, dayEndHour));
	const slotHeightPx = 60;

	// Get the 5 most recent news items for dashboard, with pinned items first
	const recentNews = $derived(
		data.news
			.sort((a, b) => {
				// First sort by pinned status (pinned items first)
				if (a.news.isPinned && !b.news.isPinned) return -1;
				if (!a.news.isPinned && b.news.isPinned) return 1;

				// Then sort by publication date (most recent first)
				const dateA = a.news.publishedAt
					? new Date(a.news.publishedAt).getTime()
					: 0;
				const dateB = b.news.publishedAt
					? new Date(b.news.publishedAt).getTime()
					: 0;
				return dateB - dateA;
			})
			.slice(0, 5),
	);

	// Helper function to truncate text for preview
	const truncateText = (text: string, wordLimit: number = 10) => {
		const words = text.split(' ');
		if (words.length <= wordLimit) return text;
		return words.slice(0, wordLimit).join(' ') + '...';
	};

	// Helper function to format date for news
	const formatNewsDate = (date: Date | null) => {
		if (!date) return '';
		return new Intl.DateTimeFormat('en-AU', {
			day: 'numeric',
			month: 'short',
		}).format(new Date(date));
	};

	// Helper function to get subject color by subject offering ID
	function getSubjectColor(subjectOfferingId?: number): number | undefined {
		if (!subjectOfferingId || !data.userClasses) return undefined;

		const allocation = data.userClasses.find(
			(c) => c.subjectOffering.id === subjectOfferingId,
		);
		return allocation?.userSubjectOffering.color;
	}

	// Helper function to get RSVP status for an event
	function getRSVPStatus(event: any): 'required' | 'none' {
		return event.requiresRSVP ? 'required' : 'none';
	}
</script>

<div
	class="grid h-full grid-cols-1 gap-6 overflow-y-auto p-8 xl:grid-cols-[1fr_1fr_1fr]"
>
	<!-- Your Day - Time-scaled view -->
	<Card.Root class="h-full overflow-hidden shadow-none">
		<Card.Header>
			<Card.Title class="text-xl">Your Day</Card.Title>
		</Card.Header>
		<Card.Content class="h-full overflow-hidden pt-4">
			{#if (data.userClasses && data.userClasses.length > 0) || (data.schoolEvents && data.schoolEvents.length > 0) || (data.campusEvents && data.campusEvents.length > 0) || (data.subjectOfferingEvents && data.subjectOfferingEvents.length > 0)}
				<div class="relative flex h-full flex-col">
					<!-- Time slots -->
					<div class="flex gap-2">
						<div class="flex w-12 flex-col">
							{#each timeslots as slot}
								<div
									class="text-muted-foreground flex items-start justify-start pr-4 text-xs"
									style="height: {slotHeightPx}px; transform: translateY(-8px);"
								>
									{slot}
								</div>
							{/each}
						</div>

						<!-- Classes and events grid -->
						<div
							class="relative flex-1"
							style="height: {timeslots.length * slotHeightPx}px;"
						>
							<!-- Background grid lines -->
							{#each timeslots as slot, index}
								<div
									class="border-border border-b {index === 0 ? 'border-t' : ''}"
									style="height: {slotHeightPx}px;"
								></div>
							{/each}

							<!-- Classes -->
							{#each data.userClasses as cls}
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
									<TimetableCard
										{cls}
										href="/subjects/{cls.subjectOffering.id}"
										showTime={true}
										showRoom={true}
									/>
								</div>
							{/each}

							<!-- School Events -->
							{#each data.schoolEvents || [] as event, eventIndex}
								{@const position = getEventPosition(
									dayStartHour,
									event.event.start,
									event.event.end,
									eventIndex,
									slotHeightPx,
								)}
								{@const rsvpStatus = getRSVPStatus(event.event)}
								<div
									class="absolute right-3 left-1 hover:z-10"
									style="top: {position.top}; height: {position.height};"
								>
									<EventCard event={event.event} {rsvpStatus} />
								</div>
							{/each}

							<!-- Campus Events -->
							{#each data.campusEvents || [] as event, eventIndex}
								{@const position = getEventPosition(
									dayStartHour,
									event.event.start,
									event.event.end,
									eventIndex,
									slotHeightPx,
								)}
								{@const rsvpStatus = getRSVPStatus(event.event)}
								<div
									class="absolute right-3 left-1 hover:z-10"
									style="top: {position.top}; height: {position.height};"
								>
									<EventCard event={event.event} {rsvpStatus} />
								</div>
							{/each}

							<!-- Subject Offering Events -->
							{#each data.subjectOfferingEvents || [] as event, eventIndex}
								{@const position = getEventPosition(
									dayStartHour,
									event.event.start,
									event.event.end,
									eventIndex,
									slotHeightPx,
								)}
								{@const rsvpStatus = getRSVPStatus(event.event)}
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

							<!-- Subject Offering Class Events -->
							{#each data.subjectOfferingClassEvents || [] as event, eventIndex}
								{@const position = getEventPosition(
									dayStartHour,
									event.event.start,
									event.event.end,
									eventIndex,
									slotHeightPx,
								)}
								{@const rsvpStatus = getRSVPStatus(event.event)}
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
					</div>
				</div>
			{:else}
				<p class="text-muted-foreground text-center">
					No events or classes scheduled for today.
				</p>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Recent Forum Announcements -->
	<Card.Root class="h-full overflow-hidden shadow-none">
		<Card.Header>
			<Card.Title class="text-xl">Recent Forum Announcements</Card.Title>
		</Card.Header>
		<Card.Content class="h-full overflow-hidden">
			{#if data.announcements && data.announcements.length > 0}
				<ScrollArea class="h-full">
					<div class="space-y-4 pr-4">
						{#each data.announcements as announcement (announcement.announcement.id)}
							<a
								href="/subjects/{announcement.subjectOffering
									.id}/discussion/{announcement.announcement.id}"
								class="hover:bg-muted/50 block rounded-lg transition-colors"
							>
								<div class="border-border rounded-lg border-2 p-4">
									<div class="flex items-start justify-between gap-3">
										<div class="flex-1">
											<h3 class="text-foreground font-semibold">
												{announcement.announcement.title}
											</h3>
											<div class="mt-1 flex items-center gap-2">
												<Badge variant="secondary" class="text-xs">
													{announcement.subject.name}
												</Badge>
												<span class="text-muted-foreground text-xs">
													{formatTimestamp(announcement.announcement.createdAt)}
												</span>
											</div>
											<p
												class="text-muted-foreground mt-2 line-clamp-3 text-sm"
											>
												{announcement.announcement.content}
											</p>
										</div>
									</div>
								</div>
							</a>
						{/each}
					</div>
				</ScrollArea>
			{:else}
				<p class="text-muted-foreground text-center">
					No recent announcements.
				</p>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- School News -->
	<Card.Root class="h-full overflow-hidden border-2 shadow-none">
		<Card.Header class="flex flex-row items-center justify-between space-y-0">
			<Card.Title class="text-xl">School News</Card.Title>
			<a
				href="/news"
				class="text-primary hover:text-primary/80 text-sm transition-colors"
			>
				View all
			</a>
		</Card.Header>
		<Card.Content class="h-full overflow-hidden">
			{#if recentNews.length > 0}
				<ScrollArea class="h-full">
					<div class="space-y-4 pr-4">
						{#each recentNews as newsItem (newsItem.news.id)}
							<a
								href="/news#{newsItem.news.id}"
								class="hover:bg-muted/50 block rounded-lg transition-colors"
							>
								<div class="border-border relative rounded-lg border-2 p-4">
									{#if newsItem.news.isPinned}
										<div class="absolute top-2 right-2">
											<Pin class="text-primary fill-primary/20 h-3 w-3" />
										</div>
									{/if}

									<div class="flex items-start justify-between gap-3">
										<div class="flex-1 pr-6">
											<h3 class="text-foreground line-clamp-2 font-semibold">
												{newsItem.news.title}
											</h3>

											<div class="mt-1 flex flex-wrap items-center gap-2">
												{#if newsItem.category}
													<Badge
														variant="secondary"
														class="text-xs"
														style="background-color: {newsItem.category.color ||
															'var(--secondary)'}; color: var(--secondary-foreground);"
													>
														{newsItem.category.name}
													</Badge>
												{/if}
												<span class="text-muted-foreground text-xs">
													{formatNewsDate(newsItem.news.publishedAt)}
												</span>
											</div>

											{#if newsItem.news.excerpt}
												<p class="text-muted-foreground mt-2 text-sm">
													{truncateText(newsItem.news.excerpt, 12)}
												</p>
											{/if}
										</div>
									</div>
								</div>
							</a>
						{/each}
					</div>
				</ScrollArea>
			{:else}
				<div class="text-center">
					<p class="text-muted-foreground">No news updates available.</p>
					<a
						href="/news"
						class="text-primary hover:text-primary/80 mt-2 inline-block text-sm transition-colors"
					>
						Check for updates
					</a>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
