<script lang="ts">
	import ResourceCard from '$lib/components/resource-card.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import type { Resource } from '$lib/server/db/schema';
	// Icons
	import File from '@lucide/svelte/icons/file';
	import Plus from '@lucide/svelte/icons/plus';

	let {
		resources = [],
		onAddResource,
		onRemoveResource
	}: {
		resources: Resource[];
		onAddResource?: () => void;
		onRemoveResource?: (resourceId: number) => void;
	} = $props();
</script>

<Popover>
	<PopoverTrigger>
		<span class="cursor-pointer text-sm text-white underline transition-colors hover:text-white/80">
			{resources.length} Resources
		</span>
	</PopoverTrigger>
	<PopoverContent class="w-96 p-0" align="end">
		<div class="p-4">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold">Resources</h3>
				{#if onAddResource}
					<Button size="sm" onclick={onAddResource} class="gap-2">
						<Plus class="h-4 w-4" />
						Add Resource
					</Button>
				{/if}
			</div>

			{#if resources.length === 0}
				<div class="text-muted-foreground py-8 text-center">
					<File class="mx-auto mb-2 h-8 w-8 opacity-50" />
					<p class="text-sm">No resources added yet</p>
				</div>
			{:else}
				<ScrollArea class="max-h-96">
					<div class="space-y-3">
						{#each resources as resource}
							<ResourceCard
								{resource}
								variant="default"
								onRemove={(id) => id !== undefined && onRemoveResource?.(id)}
							/>
						{/each}
					</div>
				</ScrollArea>
			{/if}
		</div>
	</PopoverContent>
</Popover>
