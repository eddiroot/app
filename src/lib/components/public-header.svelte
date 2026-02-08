<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
	import { navigationMenuTriggerStyle } from '$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { cn } from '$lib/utils';
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
		<a href="/">
			<h1 class="text-2xl font-bold">eddi</h1>
		</a>
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
								href: '/#tasks',
								title: 'Tasks',
								content:
									'Engage students with interactive and collaborative lessons and assessments.',
							})}
							{@render ListItem({
								href: '/#curriculum',
								title: 'Curriculum',
								content: 'Plan and organise your school curriculum with ease.',
							})}
							{@render ListItem({
								href: '/#discussions',
								title: 'Discussions',
								content:
									'Foster meaningful discussions with a structured discussion system.',
							})}
							{@render ListItem({
								href: '/#calendars',
								title: 'Calendar',
								content:
									'Integrated calendar for classes and events to keep everyone organised.',
							})}
							{@render ListItem({
								href: '/#attendance',
								title: 'Attendance',
								content:
									'Track attendance effortlessly with tools to mark the roll and manage absences.',
							})}
							{@render ListItem({
								href: '/#news',
								title: 'News',
								content:
									'Keep everyone informed with instant updates and announcements.',
							})}
							{@render ListItem({
								href: '/#timetables',
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
		{#if !page.url.pathname.startsWith('/demo')}
			<div class="flex justify-end">
				<Button href="/demo" size="lg">Book a demo</Button>
			</div>
		{/if}
	</nav>
</header>
