<script lang="ts">
	import type { CourseMapItem } from '$lib/server/db/schema';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';

	let {
		item,
		isStart = true,
		weekLength = 1,
		onCourseMapItemClick,
		onCourseMapItemEdit,
		compact = false
	}: {
		item: CourseMapItem;
		isStart?: boolean;
		weekLength?: number;
		onCourseMapItemClick: (item: CourseMapItem) => void;
		onCourseMapItemEdit: (item: CourseMapItem) => void;
		compact?: boolean;
	} = $props();

	// Use Svelte 5 $derived for reactive computations
	let itemColor = $derived(item.color || '#3B82F6');
	
	// Convert hex to RGB for lighter background
	function hexToRgb(hex: string): { r: number; g: number; b: number } {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16)
				}
			: { r: 59, g: 130, b: 246 };
	}

	let lightBackgroundColor = $derived.by(() => {
		const rgb = hexToRgb(itemColor);
		// Mix 30% of the color with 70% white to create a light tint
		const r = Math.round(rgb.r * 0.3 + 255 * 0.7);
		const g = Math.round(rgb.g * 0.3 + 255 * 0.7);
		const b = Math.round(rgb.b * 0.3 + 255 * 0.7);
		return `rgb(${r}, ${g}, ${b})`;
	});

	function handleItemClick(e: Event) {
		// Prevent event bubbling to avoid triggering click when three-dot is clicked
		if ((e.target as HTMLElement)?.closest('.edit-button')) {
			return;
		}
		onCourseMapItemClick(item);
	}

	function handleEditClick(e: Event) {
		e.stopPropagation();
		onCourseMapItemEdit(item);
	}
</script>

{#if isStart}
	<!-- Only render the item widget at the start week -->
	<div
		class="group h-full w-full cursor-pointer overflow-hidden rounded-xl border-2 shadow-sm"
		style="background-color: {lightBackgroundColor}; border-color: {itemColor}; color: {itemColor};"
		onclick={handleItemClick}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && handleItemClick(e)}
	>
		<div class="relative flex h-full min-h-0 flex-col items-center justify-center {compact ? 'p-2' : 'p-4'} text-center">
			<!-- Title - centered with color matching the border -->
			<div class="flex w-full items-center justify-center">
				<h4 class="flex-1 text-center {compact ? 'text-sm font-bold' : 'text-lg font-bold'} leading-tight {compact ? 'line-clamp-2' : ''}">
					{item.topic}
				</h4>
			</div>

			{#if !compact}
				<!-- Three-dot edit button - top right -->
				<button
					class="edit-button absolute right-2 top-2 rounded p-1 opacity-0 transition-opacity hover:bg-black/10 group-hover:opacity-100"
					style="color: {itemColor}"
					onclick={handleEditClick}
					aria-label="Edit {item.topic}"
				>
					<MoreHorizontal class="h-4 w-4" />
				</button>
			{/if}
		</div>
	</div>
{/if}
