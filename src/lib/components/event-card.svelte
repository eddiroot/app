<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import type {
		CampusEvent,
		SchoolEvent,
		SubjectOfferingClassEvent,
		SubjectOfferingEvent
	} from '$lib/server/db/schema/events';
	import { formatTimestampAsTime } from '$lib/utils';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import SchoolIcon from '@lucide/svelte/icons/school';
	import { generateSubjectColors } from '../../routes/calendar/utils.js';

	interface EventCardProps {
		event: SchoolEvent | CampusEvent | SubjectOfferingEvent | SubjectOfferingClassEvent;
		eventType: 'school' | 'campus' | 'subject' | 'class';
		subjectInfo?: {
			name: string;
			className?: string;
		};
		subjectColor?: number;
		showTime?: boolean;
		rsvpStatus?: 'required' | 'completed' | 'none';
	}

	let {
		event,
		eventType,
		subjectInfo,
		subjectColor,
		showTime = true,
		rsvpStatus = 'none'
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
				backgroundColor: 'color-mix(in srgb, var(--destructive) 10%, var(--background))',
				textColor: 'var(--foreground)'
			};
		}

		if (rsvpStatus === 'completed') {
			return {
				borderColor: isHovered
					? 'var(--success)'
					: 'color-mix(in srgb, var(--success) 50%, transparent)',
				borderTopColor: 'var(--success)',
				backgroundColor: 'color-mix(in srgb, var(--success) 10%, var(--background))',
				textColor: 'var(--foreground)'
			};
		}

		// For subject and class events, use the same color scheme as timetable cards
		if ((eventType === 'subject' || eventType === 'class') && subjectColor !== undefined) {
			const colors = generateSubjectColors(subjectColor);
			return {
				borderColor: isHovered ? colors.borderTop : colors.borderAround,
				borderTopColor: colors.borderTop,
				backgroundColor: colors.background,
				textColor: colors.text
			};
		}

		if (eventType === 'school') {
			return {
				borderColor: isHovered
					? 'var(--primary)'
					: 'color-mix(in srgb, var(--primary) 50%, transparent)',
				borderTopColor: 'var(--primary)',
				backgroundColor: 'var(--background)',
				textColor: 'var(--foreground)'
			};
		}

		return {
			borderColor: isHovered
				? 'var(--secondary)'
				: 'color-mix(in srgb, var(--secondary) 50%, transparent)',
			borderTopColor: 'var(--secondary)',
			backgroundColor: 'var(--background)',
			textColor: 'var(--foreground)'
		};
	});

	const eventIcon = $derived(() => {
		switch (eventType) {
			case 'school':
				return SchoolIcon;
			case 'campus':
				return MapPinIcon;
			case 'subject':
				return BookOpenIcon;
			case 'class':
				return CalendarIcon;
			default:
				return CalendarIcon;
		}
	});

	function handleClick() {
		if (rsvpStatus === 'required') {
			// Navigate to RSVP page
			goto(`/timetable/${eventType}/${event.id}/rsvp`);
		}
	}
</script>

{#if rsvpStatus === 'required'}
	<button
		class="block h-full w-full cursor-pointer"
		onclick={handleClick}
		onmouseover={() => (isHovered = true)}
		onmouseleave={() => (isHovered = false)}
		onfocus={() => (isHovered = true)}
		onblur={() => (isHovered = false)}
	>
		<Card.Root
			class="h-full overflow-hidden border-2 border-t-4 px-2 pt-0 shadow-lg transition-colors duration-300"
			style="border-color: {eventColors().borderColor}; border-top-color: {eventColors()
				.borderTopColor}; background-color: {eventColors().backgroundColor}; color: {eventColors()
				.textColor};"
		>
			<Card.Header class="p-1">
				{@const Icon = eventIcon()}
				<div class="flex items-start justify-between gap-1">
					<Card.Title
						class="flex-1 overflow-hidden text-base font-medium text-ellipsis whitespace-nowrap"
					>
						{event.name}
					</Card.Title>
					<Icon class="mt-0.5 h-3 w-3 shrink-0" />
				</div>

				<div class="space-y-1">
					{#if showTime}
						<Card.Description
							class="flex items-center gap-1 text-xs text-ellipsis whitespace-nowrap"
						>
							<ClockIcon class="h-3 w-3" />
							{formatTimestampAsTime(event.startTimestamp)} - {formatTimestampAsTime(
								event.endTimestamp
							)}
						</Card.Description>
					{/if}

					{#if subjectInfo}
						<Card.Description class="text-xs font-medium text-ellipsis whitespace-nowrap">
							{subjectInfo.name}{#if subjectInfo.className}
								- {subjectInfo.className}{/if}
						</Card.Description>
					{/if}
				</div>
			</Card.Header>
		</Card.Root>
	</button>
{:else}
	<div
		class="block h-full"
		role="group"
		onmouseover={() => (isHovered = true)}
		onmouseleave={() => (isHovered = false)}
		onfocus={() => (isHovered = true)}
		onblur={() => (isHovered = false)}
	>
		<Card.Root
			class="h-full overflow-hidden border-2 border-t-4 px-2 pt-0 shadow-lg transition-colors duration-300"
			style="border-color: {eventColors().borderColor}; border-top-color: {eventColors()
				.borderTopColor}; background-color: {eventColors().backgroundColor}; color: {eventColors()
				.textColor};"
		>
			<Card.Header class="p-1">
				{@const Icon = eventIcon()}
				<div class="flex items-start justify-between gap-1">
					<Card.Title
						class="flex-1 overflow-hidden text-base font-medium text-ellipsis whitespace-nowrap"
					>
						{event.name}
					</Card.Title>
					<Icon class="mt-0.5 h-3 w-3 shrink-0" />
				</div>

				<div class="space-y-1">
					{#if showTime}
						<Card.Description
							class="flex items-center gap-1 text-xs text-ellipsis whitespace-nowrap"
						>
							<ClockIcon class="h-3 w-3" />
							{formatTimestampAsTime(event.startTimestamp)} - {formatTimestampAsTime(
								event.endTimestamp
							)}
						</Card.Description>
					{/if}

					{#if subjectInfo}
						<Card.Description class="text-xs font-medium text-ellipsis whitespace-nowrap">
							{subjectInfo.name}{#if subjectInfo.className}
								- {subjectInfo.className}{/if}
						</Card.Description>
					{/if}
				</div>
			</Card.Header>
		</Card.Root>
	</div>
{/if}
