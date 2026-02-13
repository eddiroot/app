<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { eventTypeEnum } from '$lib/enums.js';
	import type { Event } from '$lib/server/db/schema/event';
	import { formatTimestampAsTime, generateSubjectColors } from '$lib/utils';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import SchoolIcon from '@lucide/svelte/icons/school';

	interface EventCardProps {
		event: Event;
		subjectInfo?: { name: string; className?: string };
		subjectColor?: number;
		showTime?: boolean;
		rsvpStatus?: 'required' | 'completed' | 'none';
	}

	let {
		event,
		subjectInfo,
		subjectColor,
		showTime = true,
		rsvpStatus = 'none',
	}: EventCardProps = $props();

	let isHovered = $state(false);

	const eventColors = $derived(() => {
		// Handle RSVP status colors first
		if (rsvpStatus === 'required') {
			return {
				borderColor: isHovered
					? 'var(--destructive)'
					: 'color-mix(in srgb, var(--destructive) 50%, transparent)',
				borderTopColor: 'var(--destructive)',
				backgroundColor:
					'color-mix(in srgb, var(--destructive) 10%, var(--background))',
				textColor: 'var(--foreground)',
			};
		}

		if (rsvpStatus === 'completed') {
			return {
				borderColor: isHovered
					? 'var(--success)'
					: 'color-mix(in srgb, var(--success) 50%, transparent)',
				borderTopColor: 'var(--success)',
				backgroundColor:
					'color-mix(in srgb, var(--success) 10%, var(--background))',
				textColor: 'var(--foreground)',
			};
		}

		// For subject and class events, use the same color scheme as timetable cards
		if (
			(event.type === eventTypeEnum.subject ||
				event.type === eventTypeEnum.class) &&
			subjectColor !== undefined
		) {
			const colors = generateSubjectColors(subjectColor);
			return {
				borderColor: isHovered ? colors.borderTop : colors.borderAround,
				borderTopColor: colors.borderTop,
				backgroundColor: colors.background,
				textColor: colors.text,
			};
		}

		if (event.type === eventTypeEnum.school) {
			return {
				borderColor: isHovered
					? 'var(--primary)'
					: 'color-mix(in srgb, var(--primary) 50%, transparent)',
				borderTopColor: 'var(--primary)',
				backgroundColor: 'var(--background)',
				textColor: 'var(--foreground)',
			};
		}

		return {
			borderColor: isHovered
				? 'var(--secondary)'
				: 'color-mix(in srgb, var(--secondary) 50%, transparent)',
			borderTopColor: 'var(--secondary)',
			backgroundColor: 'var(--background)',
			textColor: 'var(--foreground)',
		};
	});

	const eventIcon = $derived(() => {
		switch (event.type) {
			case eventTypeEnum.school:
				return SchoolIcon;
			case eventTypeEnum.campus:
				return MapPinIcon;
			case eventTypeEnum.subject:
				return BookOpenIcon;
			case eventTypeEnum.class:
				return CalendarIcon;
			default:
				return CalendarIcon;
		}
	});

	function handleClick() {
		if (rsvpStatus === 'required') {
			// Navigate to RSVP page
			goto(`/timetable/${event.type}/${event.id}/rsvp`);
		}
	}
</script>

{#snippet cardContent()}
	<Card.Root
		class="h-full overflow-hidden border-2 border-t-4 px-2 pt-0 shadow-lg transition-colors duration-300"
		style="border-color: {eventColors()
			.borderColor}; border-top-color: {eventColors()
			.borderTopColor}; background-color: {eventColors()
			.backgroundColor}; color: {eventColors().textColor};"
	>
		<Card.Header class="p-1">
			{@const Icon = eventIcon()}
			<div class="flex items-start justify-between gap-1">
				<Card.Title
					class="flex-1 overflow-hidden text-left text-base font-medium overflow-ellipsis whitespace-nowrap"
				>
					{event.name}
				</Card.Title>
				<Icon class="mt-0.5 h-3 w-3 shrink-0" />
			</div>

			<div class="space-y-1">
				{#if showTime}
					<Card.Description
						class="flex items-center gap-1 text-xs overflow-ellipsis whitespace-nowrap"
					>
						<ClockIcon class="h-3 w-3 shrink-0" />
						<span class="overflow-hidden overflow-ellipsis">
							{formatTimestampAsTime(event.start)} - {formatTimestampAsTime(
								event.end,
							)}
						</span>
					</Card.Description>
				{/if}

				{#if subjectInfo}
					<Card.Description
						class="overflow-hidden text-xs font-medium overflow-ellipsis whitespace-nowrap"
					>
						{subjectInfo.name}{#if subjectInfo.className}
							- {subjectInfo.className}{/if}
					</Card.Description>
				{/if}
			</div>
		</Card.Header>
	</Card.Root>
{/snippet}

{#snippet tooltipContent()}
	<Tooltip.Content>
		<div class="space-y-1">
			<p class="font-semibold">{event.name}</p>
			{#if showTime}
				<p class="text-sm">
					{formatTimestampAsTime(event.start)} - {formatTimestampAsTime(
						event.end,
					)}
				</p>
			{/if}
			{#if subjectInfo}
				<p class="text-sm">
					{subjectInfo.name}{#if subjectInfo.className}
						- {subjectInfo.className}{/if}
				</p>
			{/if}
			{#if rsvpStatus === 'required'}
				<p class="text-destructive text-sm font-medium">RSVP Required</p>
			{:else if rsvpStatus === 'completed'}
				<p class="text-success text-sm font-medium">RSVP Completed</p>
			{/if}
		</div>
	</Tooltip.Content>
{/snippet}

<Tooltip.Provider>
	<Tooltip.Root>
		{#if rsvpStatus === 'required'}
			<Tooltip.Trigger
				class="block h-full w-full cursor-pointer"
				onclick={handleClick}
				onmouseover={() => (isHovered = true)}
				onmouseleave={() => (isHovered = false)}
				onfocus={() => (isHovered = true)}
				onblur={() => (isHovered = false)}
			>
				{@render cardContent()}
			</Tooltip.Trigger>
		{:else}
			<Tooltip.Trigger
				class="block h-full w-full"
				onmouseover={() => (isHovered = true)}
				onmouseleave={() => (isHovered = false)}
				onfocus={() => (isHovered = true)}
				onblur={() => (isHovered = false)}
			>
				{@render cardContent()}
			</Tooltip.Trigger>
		{/if}
		{@render tooltipContent()}
	</Tooltip.Root>
</Tooltip.Provider>