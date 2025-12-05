<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
	import type { ComponentProps } from 'svelte';
	import { useSidebar } from './context.svelte.js';

	let {
		ref = $bindable(null),
		class: className,
		onclick,
		name,
		...restProps
	}: ComponentProps<typeof Button> & {
		onclick?: (e: MouseEvent) => void;
		name: string;
	} = $props();

	const sidebar = useSidebar();
</script>

<Button
	data-sidebar="trigger"
	data-slot="sidebar-trigger"
	variant="ghost"
	size="icon"
	class={className}
	type="button"
	onclick={(e) => {
		onclick?.(e);
		if (name === 'left') {
			sidebar.toggleLeft();
		} else if (name === 'right') {
			sidebar.toggleRight();
		}
	}}
	{...restProps}
>
	{#if name == 'right'}
		<MessageCircle />
	{:else}
		<PanelLeftIcon />
	{/if}
	<span class="sr-only">Toggle Sidebar</span>
</Button>
