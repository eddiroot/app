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
	let itemKey = $derived(`${item.id}-${item.color}-${item.topic}`);

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
		class="border-opacity-20 group absolute inset-0.5 cursor-pointer overflow-hidden rounded-sm border text-white shadow-sm"
		style="background-color: {itemColor}; border-color: {itemColor}; width: calc({weekLength *
			100}% - 2px); z-index: 10;"
		onclick={handleItemClick}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && handleItemClick(e)}
	>
		<div class="relative flex h-full min-h-0 flex-col items-center justify-center {compact ? 'p-1' : 'p-2'} text-center">
			<!-- Title - centered and larger -->
			<div class="flex w-full items-center justify-center">
				<h4 class="flex-1 text-center {compact ? 'text-[10px]' : 'text-sm'} leading-tight font-semibold {compact ? 'line-clamp-2' : ''}">
					{item.topic}
				</h4>
			</div>

			{#if !compact}
				<!-- Three-dot edit button - top right -->
				<button
					class="edit-button absolute top-1 right-1 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/20"
					onclick={handleEditClick}
					aria-label="Edit {item.topic}"
				>
					<MoreHorizontal class="h-3 w-3" />
				</button>

				<!-- Week range indicator - bottom right -->
				<div class="absolute right-1 bottom-1 text-xs font-medium opacity-70">
					{item.duration || 1}w
				</div>
			{/if}
		</div>
	</div>
{/if}
