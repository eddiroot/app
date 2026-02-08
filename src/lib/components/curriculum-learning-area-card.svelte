<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import X from '@lucide/svelte/icons/x';

	export let learningAreaName: string;
	export let href: string | undefined = undefined;
	export let clickable = false;
	export let editMode = false;
	export let onRemove: (() => void) | undefined = undefined;
</script>

<div class="relative h-16 w-64">
	{#if href}
		<a {href} class="block h-full transition-transform hover:scale-105">
			<Card.Root class="flex h-full w-full items-center py-2">
				<div class="flex h-full w-full">
					<!-- Left side - Logo container -->
					<div class="bg-muted/5 flex w-40 items-center justify-center pl-1">
						<img
							src="/logos/vcaa.jpg"
							alt="VCAA Logo"
							class="max-h-20 max-w-full object-contain"
						/>
					</div>
					<!-- Right side - Learning area name -->
					<div class="flex items-center px-3">
						<h3 class="text-base font-medium wrap-break-word">
							{learningAreaName}
						</h3>
					</div>
				</div>
			</Card.Root>
		</a>
	{:else}
		<Card.Root
			class="flex h-full w-full items-center py-2 {clickable
				? 'cursor-pointer hover:shadow-md'
				: ''}"
		>
			<div class="flex h-full w-full">
				<!-- Left side - Logo container -->
				<div class="bg-muted/5 flex w-40 items-center justify-center pl-1">
					<img
						src="/logos/vcaa.jpg"
						alt="VCAA Logo"
						class="max-h-20 max-w-full object-contain"
					/>
				</div>
				<!-- Right side - Learning area name -->
				<div class="flex items-center px-3">
					<h3 class="text-base font-medium wrap-break-word">
						{learningAreaName}
					</h3>
				</div>
			</div>
		</Card.Root>
	{/if}

	<!-- Remove button in edit mode -->
	{#if editMode && onRemove}
		<Button
			size="sm"
			variant="destructive"
			onclick={onRemove}
			class="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-600 p-0 hover:bg-red-700"
		>
			<X class="h-3 w-3" />
		</Button>
	{/if}
</div>
