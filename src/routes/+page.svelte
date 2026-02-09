<script lang="ts">
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
</script>

<PublicHeader />

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

<!-- About Us Section -->
<section class="bg-muted/50 py-16 md:py-24 lg:py-32">
	<div class="container mx-auto px-4 lg:px-8">
		<div class="grid gap-8 md:grid-cols-2 md:items-center lg:gap-12 xl:gap-20">
			<div>
				<img
					class="h-auto w-full rounded-lg shadow-xl"
					src="/screenshots/about.png"
					alt="the eddi team"
				/>
			</div>
			<div class="space-y-6">
				<h2 class="scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">
					Our Mission
				</h2>
				<p class="text-muted-foreground text-xl">
					At Eddi, we are passionate about transforming education through
					technology. Our mission is to create an open-source platform that
					empowers schools to manage their operations efficiently while
					fostering a collaborative and engaging learning environment. We
					believe that by providing educators with the right tools, we can
					enhance the educational experience for both teachers and students,
					ultimately leading to better learning outcomes.
				</p>
			</div>
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
