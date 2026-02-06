<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
	import { navigationMenuTriggerStyle } from '$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { cn } from '$lib/utils';
	import { Icon } from '@lucide/svelte';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import LinkIcon from '@lucide/svelte/icons/link';
	import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import TagIcon from '@lucide/svelte/icons/tag';
	import TargetIcon from '@lucide/svelte/icons/target';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ZapIcon from '@lucide/svelte/icons/zap';
	import type { HTMLAttributes } from 'svelte/elements';

	const isMobile = new IsMobile();

	type ListItemProps = HTMLAttributes<HTMLAnchorElement> & {
		title: string;
		href: string;
		content: string;
	};
</script>

{#snippet ListItem({
	title,
	content,
	href,
	class: className,
	...restProps
}: ListItemProps)}
	<li>
		<NavigationMenu.Link>
			{#snippet child()}
				<a
					{href}
					class={cn(
						'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none',
						className,
					)}
					{...restProps}
				>
					<div class="text-sm leading-none font-medium">{title}</div>
					<p class="text-muted-foreground line-clamp-2 text-sm leading-snug">
						{content}
					</p>
				</a>
			{/snippet}
		</NavigationMenu.Link>
	</li>
{/snippet}

<header class="container mx-auto px-4 py-6 lg:px-8">
	<nav class="grid grid-cols-3 items-center">
		<h1 class="text-2xl font-bold">eddi</h1>
		<NavigationMenu.Root
			class="justify-self-center"
			viewport={isMobile.current}
		>
			<NavigationMenu.List>
				<NavigationMenu.Item>
					<NavigationMenu.Trigger>Features</NavigationMenu.Trigger>
					<NavigationMenu.Content>
						<ul
							class="grid w-[300px] gap-2 p-2 sm:w-[400px] md:w-[500px] md:grid-cols-2 lg:w-[600px]"
						>
							{@render ListItem({
								href: '#tasks',
								title: 'Tasks',
								content:
									'Engage students with interactive and collaborative lessons and assessments.',
							})}
							{@render ListItem({
								href: '#curriculum',
								title: 'Curriculum',
								content: 'Plan and organise your school curriculum with ease.',
							})}
							{@render ListItem({
								href: '#discussions',
								title: 'Discussions',
								content:
									'Foster meaningful discussions with a structured discussion system.',
							})}
							{@render ListItem({
								href: '#calendars',
								title: 'Calendar',
								content:
									'Integrated calendar for classes and events to keep everyone organised.',
							})}
							{@render ListItem({
								href: '#attendance',
								title: 'Attendance',
								content:
									'Track attendance effortlessly with tools to mark the roll and manage absences.',
							})}
							{@render ListItem({
								href: '#news',
								title: 'News',
								content:
									'Keep everyone informed with instant updates and announcements.',
							})}
							{@render ListItem({
								href: '#timetables',
								title: 'Timetables',
								content:
									'Create and manage school timetables with minimal effort.',
							})}
						</ul>
					</NavigationMenu.Content>
				</NavigationMenu.Item>
				<!-- <NavigationMenu.Item>
					<NavigationMenu.Link>
						{#snippet child()}
							<a href="/impact" class={navigationMenuTriggerStyle()}>Impact</a>
						{/snippet}
					</NavigationMenu.Link>
				</NavigationMenu.Item> -->
				<NavigationMenu.Item>
					<NavigationMenu.Trigger>Support</NavigationMenu.Trigger>
					<NavigationMenu.Content>
						<ul
							class="grid w-[300px] gap-2 p-2 sm:w-[400px] md:w-[500px] md:grid-cols-2 lg:w-[600px]"
						>
							{@render ListItem({
								href: '/support/one-on-one',
								title: 'One-on-One',
								content:
									'Request a call with our engineering team for personalised assistance.',
							})}
							{@render ListItem({
								href: '/support/feature-request',
								title: 'Feature Request',
								content: 'Suggest new features to help us improve eddi.',
							})}
							{@render ListItem({
								href: '/support/report-an-issue',
								title: 'Report an Issue',
								content:
									'Report bugs or issues you encounter while using eddi.',
							})}
						</ul>
					</NavigationMenu.Content>
				</NavigationMenu.Item>
				<NavigationMenu.Item>
					<NavigationMenu.Link>
						{#snippet child()}
							<a href="/pricing" class={navigationMenuTriggerStyle()}>Pricing</a
							>
						{/snippet}
					</NavigationMenu.Link>
				</NavigationMenu.Item>
			</NavigationMenu.List>
		</NavigationMenu.Root>
		<div class="flex justify-end">
			<Button href="/demo" size="lg">Book a demo</Button>
		</div>
	</nav>
</header>

<!-- Main Hero Section -->
<section class="pt-6 pb-12 md:py-24 lg:py-32">
	<div class="container mx-auto px-4 text-center lg:px-8">
		<h2
			class="mx-auto max-w-4xl scroll-m-20 text-6xl font-bold tracking-tight lg:text-7xl"
		>
			Openly redefining education.
		</h2>
		<h3 class="text-muted-foreground mx-auto mt-8 max-w-4xl text-2xl">
			Seamlessly orchestrate your school, inspire engagement, and empower
			teachers.
		</h3>
		<div class="mt-12 flex justify-center">
			<Button size="lg" variant="secondary">Watch the video</Button>
		</div>
	</div>
</section>

{#snippet section(
	title: string,
	description: string,
	direction: 'left' | 'right',
	image: { src: string; caption: string },
	features: { icon: typeof Icon; text: string }[],
)}
	<section
		id={title.replaceAll(' ', '-').toLowerCase()}
		class="{direction == 'left' ? 'bg-muted/50' : ''} py-16 md:py-24 lg:py-32"
	>
		<div class="container mx-auto px-4 lg:px-8">
			<div
				class="grid gap-8 md:grid-cols-2 md:items-center lg:gap-12 xl:gap-20"
			>
				{#if direction == 'right'}
					<div class="order-last md:order-first">
						<img
							class="h-auto w-full rounded-lg shadow-xl"
							src={image.src}
							alt={image.caption}
						/>
					</div>
				{/if}
				<div class="space-y-6">
					<h2 class="scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">
						{title}
					</h2>
					<p class="text-muted-foreground text-xl">
						{description}
					</p>
					<ul class="space-y-3 text-lg">
						{#each features as feature, index (index)}
							<li class="flex items-center">
								<feature.icon class="mr-3 h-5 w-5 shrink-0" />
								{feature.text}
							</li>
						{/each}
					</ul>
				</div>
				{#if direction == 'left'}
					<div>
						<img
							class="h-auto w-full rounded-lg shadow-xl"
							src={image.src}
							alt={image.caption}
						/>
					</div>
				{/if}
			</div>
		</div>
	</section>
{/snippet}

{@render section(
	'Tasks',
	'Engage students with interactive and collaborative lessons and assessments.',
	'left',
	{ src: '/screenshots/task.png', caption: 'Lesson creation interface' },
	[
		{ icon: TargetIcon, text: 'Auto-generate learning objectives' },
		{ icon: FileTextIcon, text: 'Content suggestions and templates' },
		{ icon: RefreshCwIcon, text: 'Instant content refinement' },
	],
)}

{@render section(
	'Curriculum',
	'Plan and organise your school curriculum with ease.',
	'right',
	{
		src: '/screenshots/curriculum.png',
		caption: 'Curriculum planning interface',
	},
	[
		{ icon: UsersIcon, text: 'Collaborative curriculum design' },
		{ icon: ZapIcon, text: 'Align with standards and outcomes' },
		{ icon: CalendarIcon, text: 'Integrate with timetables and calendars' },
	],
)}

{@render section(
	'Discussions',
	'Create a collaborative learning environment with a structured discussion system.',
	'left',
	{ src: '/screenshots/discussion.png', caption: 'Discussion interface' },
	[
		{ icon: MessageCircleIcon, text: 'Threaded discussion format' },
		{ icon: ThumbsUpIcon, text: 'Upvoting and answer validation' },
		{ icon: TagIcon, text: 'Topic tagging and search' },
	],
)}

{@render section(
	'Calendars',
	'Integrated calendar for classes and events to keep everyone organised.',
	'right',
	{ src: '/screenshots/calendar.png', caption: 'Calendar interface' },
	[
		{ icon: CheckIcon, text: 'Automatic class scheduling' },
		{ icon: PlusIcon, text: 'Event creation for classes and schools' },
		{ icon: LinkIcon, text: 'Sync with external calendars' },
	],
)}

{@render section(
	'Attendance',
	'Track attendance effortlessly with tools to mark the roll and manage absences.',
	'left',
	{ src: '/screenshots/attendance.png', caption: 'Attendance interface' },
	[
		{ icon: LinkIcon, text: 'Syncs with guardian-submitted absences' },
		{ icon: ClockIcon, text: 'Behaviour and attendance records' },
		{ icon: MegaphoneIcon, text: 'Notifications for unexplained absences' },
	],
)}

{@render section(
	'News',
	'Keep everyone informed with instant updates and announcements.',
	'right',
	{ src: '/screenshots/discussion.png', caption: 'News interface' },
	[
		{ icon: MegaphoneIcon, text: 'Instant push notifications' },
		{ icon: CalendarIcon, text: 'Schedule announcements' },
		{ icon: TargetIcon, text: 'Target specific groups' },
	],
)}

{@render section(
	'Timetables',
	'Create and manage school timetables with minimal effort.',
	'left',
	{
		src: '/screenshots/timetable-days.png',
		caption: 'Timetable creation interface',
	},
	[
		{ icon: ZapIcon, text: 'Hands-off generation' },
		{ icon: UsersIcon, text: 'Involve teachers in the process' },
		{ icon: CalendarIcon, text: 'Publish into student and staff calendars' },
	],
)}
