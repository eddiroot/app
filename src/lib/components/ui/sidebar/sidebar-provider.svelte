<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import {
		SIDEBAR_COOKIE_MAX_AGE,
		SIDEBAR_COOKIE_NAME,
		SIDEBAR_WIDTH,
		SIDEBAR_WIDTH_ICON
	} from './constants.js';
	import { setSidebar } from './context.svelte.js';

	let {
		ref = $bindable(null),
		leftOpen = $bindable(true),
		rightOpen = $bindable(false),
		onLeftOpenChange = () => {},
		onRightOpenChange = () => {},
		class: className,
		style,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		leftOpen?: boolean;
		rightOpen?: boolean;
		onLeftOpenChange?: (open: boolean) => void;
		onRightOpenChange?: (open: boolean) => void;
	} = $props();

	const sidebar = setSidebar({
		leftOpen: () => leftOpen,
		rightOpen: () => rightOpen,
		setLeftOpen: (value: boolean) => {
			leftOpen = value;
			onLeftOpenChange(value);

			// This sets the cookie to keep the sidebar state.
			document.cookie = `left-${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
		},
		setRightOpen: (value: boolean) => {
			rightOpen = value;
			onRightOpenChange(value);

			// This sets the cookie to keep the sidebar state.
			document.cookie = `right-${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
		}
	});
</script>

<svelte:window onkeydown={sidebar.handleShortcutKeydown} />

<Tooltip.Provider delayDuration={0}>
	<div
		data-slot="sidebar-wrapper"
		style="--sidebar-width: {SIDEBAR_WIDTH}; --sidebar-width-icon: {SIDEBAR_WIDTH_ICON}; {style}"
		class={cn(
			'group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full',
			className
		)}
		bind:this={ref}
		{...restProps}
	>
		{@render children?.()}
	</div>
</Tooltip.Provider>
