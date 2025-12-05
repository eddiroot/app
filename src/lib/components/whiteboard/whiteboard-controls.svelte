<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import HomeIcon from '@lucide/svelte/icons/home';
	import RedoIcon from '@lucide/svelte/icons/redo';
	import UndoIcon from '@lucide/svelte/icons/undo';
	import ZoomInIcon from '@lucide/svelte/icons/zoom-in';
	import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';

	interface Props {
		currentZoom: number;
		onZoomIn: () => void;
		onZoomOut: () => void;
		onResetZoom: () => void;
		onRecenterView: () => void;
		onUndo?: () => void;
		onRedo?: () => void;
		canUndo?: boolean;
		canRedo?: boolean;
	}

	let {
		currentZoom,
		onZoomIn,
		onZoomOut,
		onResetZoom,
		onRecenterView,
		onUndo,
		onRedo,
		canUndo = false,
		canRedo = false
	}: Props = $props();
</script>

<div class="absolute bottom-8 left-8">
	<div
		class="bg-background/20 border-border/50 flex items-center gap-1 rounded-md border px-2 py-1 shadow-sm backdrop-blur-sm"
	>
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button
					variant="ghost"
					size="icon"
					onclick={onUndo}
					disabled={!canUndo || !onUndo}
					class="h-8 w-8"
				>
					<UndoIcon />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>Undo</Tooltip.Content>
		</Tooltip.Root>

		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button
					variant="ghost"
					size="icon"
					onclick={onRedo}
					disabled={!canRedo || !onRedo}
					class="h-8 w-8"
				>
					<RedoIcon />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>Redo</Tooltip.Content>
		</Tooltip.Root>

		<div class="bg-border mx-1 h-6 w-px"></div>

		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button variant="ghost" size="icon" onclick={onZoomOut} class="h-8 w-8">
					<ZoomOutIcon />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>Zoom Out</Tooltip.Content>
		</Tooltip.Root>

		<Button variant="ghost" size="sm" onclick={onResetZoom} class="h-8 px-2 font-mono text-xs">
			{Math.round(currentZoom * 100)}%
		</Button>

		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button variant="ghost" size="icon" onclick={onZoomIn} class="h-8 w-8">
					<ZoomInIcon />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>Zoom In</Tooltip.Content>
		</Tooltip.Root>

		<div class="bg-border mx-1 h-6 w-px"></div>

		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button variant="ghost" size="icon" onclick={onRecenterView} class="h-8 w-8">
					<HomeIcon />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>Recenter View</Tooltip.Content>
		</Tooltip.Root>
	</div>
</div>
