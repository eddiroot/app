<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { generateSubjectColors } from '../../routes/calendar/utils.js';

	interface Props {
		cls: any;
		href: string;
		showTime?: boolean;
		showRoom?: boolean;
	}

	let { cls, href, showTime = true, showRoom = true }: Props = $props();

	let isHovered = $state(false);
	const colors = $derived(generateSubjectColors(cls.userSubjectOffering.color));
</script>

<a
	{href}
	class="block h-full"
	onmouseover={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	onfocus={() => (isHovered = true)}
	onblur={() => (isHovered = false)}
>
	<!-- Timetable card layout -->
	<Card.Root
		class="h-full overflow-hidden border-2 border-t-4 px-2 pt-0 shadow-lg transition-colors duration-300"
		style="border-color: {isHovered
			? colors.borderTop
			: colors.borderAround}; border-top-color: {colors.borderTop}; color: {colors.text};"
	>
		<Card.Header class="p-1">
			<Card.Title class="overflow-hidden pt-2 text-base text-ellipsis whitespace-nowrap">
				{cls.subject.name}
			</Card.Title>
			{#if showTime || showRoom}
				<Card.Description class="overflow-hidden text-xs text-ellipsis whitespace-nowrap">
					{#if showTime}
						{cls.classAllocation.startTime} - {cls.classAllocation.endTime}
					{/if}
					{#if showTime && showRoom}
						{' '}
					{/if}
					{#if showRoom}
						{cls.schoolSpace.name}
					{/if}
				</Card.Description>
			{/if}
		</Card.Header>
	</Card.Root>
</a>
