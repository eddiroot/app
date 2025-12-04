<script lang="ts">
	import '../app.css';

	import { ModeWatcher } from 'mode-watcher';

	import { page } from '$app/state';

	import AiSidebar from '$lib/components/ai-sidebar.svelte';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Resizable from '$lib/components/ui/resizable';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';
	import type { Task } from '$lib/server/db/schema';

	let { children, data } = $props();

	const user = $derived(() => data?.user);
	let isMobile = new IsMobile();
	let aiSidebarPane: ReturnType<typeof Resizable.Pane> | undefined = $state();

	const generateBreadcrumbItems = (url: string) => {
		const segments = url.split('/').filter(Boolean);

		if (segments.length === 0) {
			return [];
		}

		const items: Array<{ label: string; href: string; isLast: boolean }> = [];
		let currentPath = '';

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			currentPath += `/${segment}`;

			let label = segment;
			let href = currentPath;

			if (segments[i - 1] === 'subjects' && !isNaN(Number(segment))) {
				const subjectOfferingId = Number(segment);
				const subject = data?.subjects?.find((s) => s.subjectOffering.id === subjectOfferingId);
				label = subject?.subject.name || `Subject ${segment}`;
			} else if (
				segments[i - 1] === 'class' &&
				segments[i - 2] &&
				!isNaN(Number(segments[i - 2]))
			) {
				// This is the class ID in /subjects/[subjectOfferingId]/class/[classId]
				const subjectOfferingId = Number(segments[i - 2]);
				const classId = Number(segment);
				const subject = data?.subjects?.find((s) => s.subjectOffering.id === subjectOfferingId);
				const classItem = subject?.classes?.find((c) => c.id === classId);
				label = classItem?.name || `Class ${segment}`;
			} else if (segments[i - 1] === 'tasks' && !isNaN(Number(segment))) {
				const taskId = Number(segment);
				const pageData = page.data;
				const task = pageData?.task || pageData?.tasks?.find((l: Task) => l.id === taskId);
				label = task?.title || `Task ${segment}`;
			} else if (segments[i - 1] === 'whiteboard' && !isNaN(Number(segment))) {
				const whiteboardId = Number(segment);
				const pageData = page.data;
				const whiteboard =
					pageData?.whiteboard || pageData?.whiteboards?.find((w: Task) => w.id === whiteboardId);
				label = whiteboard?.title || `Whiteboard ${segment}`;
			} else {
				label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
			}

			items.push({
				label,
				href,
				isLast: i === segments.length - 1
			});
		}

		return items;
	};
</script>

<svelte:head>
	<title>{data?.school?.name || 'eddi'}</title>
	<!-- <meta name="description" content="" /> -->
</svelte:head>
<ModeWatcher />
<div class="[--header-height:calc(--spacing(14))]">
	<Sidebar.Provider class="flex flex-col">
		<header class="bg-background sticky top-0 z-50 h-14">
			<nav class="mx-auto flex h-full items-center justify-between border-b p-2">
				<div class="flex items-center gap-x-4">
					{#if user()}
						<Sidebar.Trigger name="left" aria-label="Toggle Navigation Sidebar" />
					{/if}
					<Breadcrumb.Root>
						<Breadcrumb.List>
							{#if generateBreadcrumbItems(page.url.pathname).length == 0 && !data?.school?.name}
								<Breadcrumb.Item>
									<Breadcrumb.Page class="ml-2 text-lg font-bold">eddi</Breadcrumb.Page>
								</Breadcrumb.Item>
							{/if}
							{#each generateBreadcrumbItems(page.url.pathname) as item (item.href)}
								<Breadcrumb.Item>
									{#if item.isLast}
										<Breadcrumb.Page>{item.label}</Breadcrumb.Page>
									{:else}
										<Breadcrumb.Link href={item.href}>{item.label}</Breadcrumb.Link>
									{/if}
								</Breadcrumb.Item>
								{#if !item.isLast}
									<Breadcrumb.Separator />
								{/if}
							{/each}
						</Breadcrumb.List>
					</Breadcrumb.Root>
				</div>
				<div class="flex items-center gap-x-2">
					{#if !user() && page.url.pathname !== '/login'}
						<Button href="/login">Login</Button>
					{/if}
					<ThemeToggle />
					{#if user()}
						<Sidebar.Trigger
							name="right"
							aria-label="Toggle AI Sidebar"
							onclick={() => {
								if (isMobile.current.valueOf()) return;
								if (aiSidebarPane && aiSidebarPane.getSize() > 0) {
									aiSidebarPane?.collapse();
								} else if (aiSidebarPane && aiSidebarPane.getSize() == 0) {
									aiSidebarPane?.resize(30);
									aiSidebarPane?.expand();
								}
							}}
						/>
					{/if}
				</div>
			</nav>
		</header>

		<div class="flex flex-1">
			{#if user()}
				<AppSidebar
					subjects={data?.subjects || []}
					user={user()}
					school={data?.school || null}
					campuses={data?.campuses ?? []}
				/>
			{/if}
			<Resizable.PaneGroup direction="horizontal">
				<Resizable.Pane defaultSize={100}>
					<Sidebar.Inset class="h-[calc(100svh-var(--header-height))]! overflow-auto">
						{@render children()}
					</Sidebar.Inset>
				</Resizable.Pane>

				{#if user()}
					{#if aiSidebarPane && aiSidebarPane.getSize() > 0}
						<Resizable.Handle withHandle class="hidden md:flex" />
					{/if}
					<Resizable.Pane defaultSize={0} collapsible={true} bind:this={aiSidebarPane}>
						<AiSidebar pathname={page.url.pathname} />
					</Resizable.Pane>
				{/if}
			</Resizable.PaneGroup>
		</div>
	</Sidebar.Provider>
</div>
