<script lang="ts">
	import PublicFooter from '$lib/components/public-footer.svelte';
	import PublicHeader from '$lib/components/public-header.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
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

	import DarkDiscussions from '$lib/assets/screenshots/dark-discussions.png';
	import DarkNews from '$lib/assets/screenshots/dark-news.png';
	import DarkTasks from '$lib/assets/screenshots/dark-tasks.png';
	import LightDiscussions from '$lib/assets/screenshots/light-discussions.png';
	import LightNews from '$lib/assets/screenshots/light-news.png';
	import LightTasks from '$lib/assets/screenshots/light-tasks.png';
</script>

<PublicHeader />

<!-- Main Hero Section -->
<section class="pt-6 pb-12 md:py-24 lg:py-32">
	<div class="container mx-auto px-4 text-center lg:px-8">
		<h2
			class="mx-auto max-w-4xl scroll-m-20 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl"
		>
			Openly redefining education.
		</h2>
		<h3
			class="text-muted-foreground mx-auto mt-8 max-w-4xl text-lg md:text-xl lg:text-2xl"
		>
			Seamlessly orchestrate your school, inspire engagement, and empower
			teachers
		</h3>
		<div class="mt-12 flex justify-center gap-x-3">
			<Button href="/demo" size="lg" class="sm:hidden">Book a demo</Button>
		</div>
	</div>
</section>

{#snippet section(
	title: string,
	description: string,
	imageSide: 'left' | 'right',
	image: { lightSrc: string; darkSrc: string; caption: string },
	features: { icon: typeof Icon; text: string }[],
)}
	{@const imageBaseClass = 'h-auto w-full rounded-lg object-cover shadow-xl'}
	<section
		id={title.replaceAll(' ', '-').toLowerCase()}
		class="{imageSide == 'right' ? 'bg-muted/50' : ''} py-16 md:py-24 lg:py-32"
	>
		<div class="container mx-auto px-4 lg:px-8">
			<div
				class="grid gap-8 md:grid-cols-2 md:items-center lg:gap-12 xl:gap-20"
			>
				{#if imageSide == 'left'}
					<div class="order-last md:order-first">
						<img
							class="dark:hidden {imageBaseClass}"
							src={image.lightSrc}
							alt={image.caption}
						/>
						<img
							class="hidden dark:block {imageBaseClass}"
							src={image.darkSrc}
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
				{#if imageSide == 'right'}
					<div>
						<img
							class="dark:hidden {imageBaseClass}"
							src={image.lightSrc}
							alt={image.caption}
						/>
						<img
							class="hidden dark:block {imageBaseClass}"
							src={image.darkSrc}
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
	'Create wonderful learning experiences',
	'right',
	{
		lightSrc: LightTasks,
		darkSrc: DarkTasks,
		caption: 'Lesson creation interface',
	},
	[
		{ icon: TargetIcon, text: 'Drag-and-drop task builder' },
		{ icon: FileTextIcon, text: 'Utilise general or subject-specific blocks' },
		{ icon: RefreshCwIcon, text: 'Easily mark student attempts' },
	],
)}

{@render section(
	'Discussions',
	'Facilitate engaging discussions',
	'left',
	{
		lightSrc: LightDiscussions,
		darkSrc: DarkDiscussions,
		caption: 'Discussion interface',
	},
	[
		{
			icon: MessageCircleIcon,
			text: 'Ask a question, post an announcement, or host a Q&A',
		},
		{ icon: ThumbsUpIcon, text: 'Encourage student collaboration' },
		{ icon: TagIcon, text: 'Global search with topic tagging' },
	],
)}

{@render section(
	'Calendar',
	'See your classes and events in one place',
	'right',
	{
		lightSrc: '/screenshots/calendar.png',
		darkSrc: '/screenshots/calendar.png',
		caption: 'Calendar interface',
	},
	[
		{ icon: PlusIcon, text: 'Assess RSVPs and attendance' },
		{ icon: LinkIcon, text: 'Sync with external calendars' },
		{ icon: CheckIcon, text: 'Direct integration with our timetabling system' },
	],
)}

{@render section(
	'Attendance',
	'Track attendance effortlessly',
	'left',
	{
		lightSrc: '/screenshots/attendance.png',
		darkSrc: '/screenshots/attendance.png',
		caption: 'Attendance interface',
	},
	[
		{ icon: ClockIcon, text: 'Gain minute-level insights' },
		{ icon: LinkIcon, text: 'Easily record behavioural incidents' },
		{
			icon: MegaphoneIcon,
			text: 'Customisable notification and action system',
		},
	],
)}

{@render section(
	'News',
	'Keep your school community informed',
	'right',
	{ lightSrc: LightNews, darkSrc: DarkNews, caption: 'News interface' },
	[
		{ icon: CalendarIcon, text: 'Schedule announcements' },
		{ icon: MegaphoneIcon, text: 'Instant push notifications' },
		{ icon: TargetIcon, text: 'Target specific groups' },
	],
)}

{@render section(
	'Curriculum',
	'Organise your whole curriculum',
	'left',
	{
		lightSrc: '/screenshots/curriculum.png',
		darkSrc: '/screenshots/curriculum.png',
		caption: 'Curriculum planning interface',
	},
	[
		{ icon: UsersIcon, text: 'Collaborate in real-time' },
		{ icon: ZapIcon, text: 'Align with standards and outcomes' },
		{ icon: FileTextIcon, text: 'Create task guidelines and templates' },
	],
)}

{@render section(
	'Timetables',
	'Create and manage school timetables with minimal effort.',
	'right',
	{
		lightSrc: '/screenshots/timetable-days.png',
		darkSrc: '/screenshots/timetable-days.png',
		caption: 'Timetable creation interface',
	},
	[
		{ icon: ZapIcon, text: 'Hands-off generation' },
		{ icon: UsersIcon, text: 'Involve teachers in the process' },
		{ icon: CalendarIcon, text: 'Publish into student and staff calendars' },
	],
)}

<section id="pricing" class="py-16 md:py-24 lg:py-32">
	<div class="container mx-auto px-4 text-center lg:px-8">
		<div class="mx-auto max-w-3xl space-y-8">
			<h2 class="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
				Pricing
			</h2>
			<div class="flex items-baseline justify-center gap-2">
				<span class="font-mono text-7xl font-bold">$15</span>
				<span class="text-muted-foreground text-lg">per user / year</span>
			</div>
			<p class="text-muted-foreground text-lg">All features included.</p>
			<Button size="lg" href="/demo">Book a Demo</Button>
		</div>
	</div>
</section>

<PublicFooter />
