<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';

	let { children, data } = $props();

	const user = $derived(() => data?.user);
</script>

<svelte:head>
	<title>{`eddi${data?.school?.name ? ` - ${data.school.name}` : ''}`}</title>
	<meta
		name="description"
		content="eddi is the all-in-one solution for schools."
	/>
</svelte:head>

<Toaster />
<ModeWatcher defaultMode="system" />
<Sidebar.Provider class="flex flex-col">
	<div class="flex flex-1">
		{#if user()}
			<AppSidebar
				subjects={data?.subjects || []}
				user={user()}
				school={data?.school || null}
				schoolLogoUrl={data?.schoolLogoUrl || null}
				campuses={data?.campuses ?? []}
			/>
		{/if}
		<Sidebar.Inset>
			{@render children()}
		</Sidebar.Inset>
	</div>
</Sidebar.Provider>
