<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button, {
		buttonVariants,
	} from '$lib/components/ui/button/button.svelte';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { cn } from '$lib/utils';
	import Menu from '@lucide/svelte/icons/menu';
	import type { HTMLAttributes } from 'svelte/elements';

	const isMobile = new IsMobile();
	let drawerOpen = $state(false);

	const navItems: Array<{
		name: string;
		singleColumn: boolean;
		subItems: { name: string; href: string; description: string }[];
	}> = [
		{
			name: 'Features',
			singleColumn: false,
			subItems: [
				{
					name: 'Tasks',
					href: '/#tasks',
					description:
						'Engage students with interactive and collaborative lessons and assessments.',
				},
				{
					name: 'Discussions',
					href: '/#discussions',
					description:
						'Foster meaningful discussions with a structured discussion system.',
				},
				{
					name: 'Calendar',
					href: '/#calendar',
					description:
						'Integrated calendar for classes and events to keep everyone organised.',
				},
				{
					name: 'Attendance',
					href: '/#attendance',
					description:
						'Track attendance effortlessly with tools to mark the roll and manage absences.',
				},
				{
					name: 'News',
					href: '/#news',
					description:
						'Keep everyone informed with instant updates and announcements.',
				},
				{
					name: 'Curriculum',
					href: '/#curriculum',
					description: 'Plan and organise your school curriculum with ease.',
				},
				{
					name: 'Timetables',
					href: '/#timetables',
					description:
						'Create and manage school timetables with minimal effort.',
				},
			],
		},
		{
			name: 'Support',
			singleColumn: true,
			subItems: [
				{
					name: 'Book Call',
					description: 'Request a call with our engineering team.',
					href: '/support/one-on-one',
				},
				{
					name: 'Feature Request',
					description: 'Suggest new features that could help us improve.',
					href: '/support/feature-request',
				},
				{
					name: 'Report Issue',
					description: 'Report issues you encounter while using eddi.',
					href: '/support/report-an-issue',
				},
			],
		},
		{
			name: 'Pricing',
			singleColumn: true,
			subItems: [
				{
					name: 'Our Ethos',
					description: 'Learn about our commitment to supporting every school.',
					href: '/#pricing',
				},
				{
					name: 'Cost',
					description: 'View the simple pricing plan that has schools raving.',
					href: '/#pricing',
				},
			],
		},
	];

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
	<nav class="flex items-center justify-between sm:grid sm:grid-cols-3">
		<a href="/">
			<h1 class="text-2xl font-bold">eddi</h1>
		</a>
		<NavigationMenu.Root
			viewport={isMobile.current}
			class="hidden justify-self-center sm:flex"
		>
			<NavigationMenu.List>
				{#each navItems as navItem (navItem.name)}
					<NavigationMenu.Item>
						<NavigationMenu.Trigger>{navItem.name}</NavigationMenu.Trigger>
						<NavigationMenu.Content>
							<ul
								class="grid gap-2 p-2 {navItem.singleColumn
									? 'w-56 sm:w-56 md:w-60 lg:w-64'
									: 'w-75 sm:w-100 md:w-125 md:grid-cols-2 lg:w-150'}"
							>
								{#each navItem.subItems as subItem (subItem.name)}
									{@render ListItem({
										href: subItem.href,
										title: subItem.name,
										content: subItem.description,
									})}
								{/each}
							</ul>
						</NavigationMenu.Content>
					</NavigationMenu.Item>
				{/each}
			</NavigationMenu.List>
		</NavigationMenu.Root>
		{#if !page.url.pathname.startsWith('/demo')}
			<div class="hidden justify-end sm:flex">
				<Button href="/demo" size="lg">Book a demo</Button>
			</div>
		{/if}
		<div class="sm:hidden">
			<Drawer.Root direction="right" bind:open={drawerOpen}>
				<Drawer.Trigger
					class={buttonVariants({ variant: 'ghost', size: 'icon-lg' })}
				>
					<Menu class="size-6" />
				</Drawer.Trigger>
				<Drawer.Content>
					<div class="mx-auto w-full max-w-sm">
						<div class="space-y-4 p-4 pb-0">
							{#each navItems as navItem (navItem.name)}
								<div>
									<h2 class="mb-2 text-xl font-bold">{navItem.name}</h2>
									<div class="grid grid-cols-2 gap-2">
										{#each navItem.subItems as subItem (subItem.name)}
											<button
												onclick={() => {
													drawerOpen = false;
													setTimeout(() => {
														if (
															page.url.pathname === '/' &&
															subItem.href.startsWith('/#')
														) {
															const element = document.getElementById(
																subItem.href.replace('/#', ''),
															);
															element?.scrollIntoView({ behavior: 'smooth' });
															return;
														} else {
															goto(subItem.href);
														}
													}, 200);
												}}
												class="flex h-16 items-center justify-center rounded-md border text-center text-sm font-semibold"
											>
												{subItem.name}
											</button>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</Drawer.Content>
			</Drawer.Root>
		</div>
	</nav>
</header>
