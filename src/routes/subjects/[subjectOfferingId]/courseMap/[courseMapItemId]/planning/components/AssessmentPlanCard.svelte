<script lang="ts">
	import * as Card from '$lib/components/ui/card';

	export let assessmentPlan: {
		id: number;
		name: string;
		imageBase64?: string | null;
		description?: string | null;
	};
	export let href: string | undefined = undefined;
</script>

{#if href}
	<a {href} class="block">
		<Card.Root
			class="group h-32 w-72 overflow-hidden p-0 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
		>
			<div class="flex h-full items-stretch">
				<!-- Text content on left -->
				<div class="flex min-w-0 flex-1 flex-col justify-center p-4">
					<h3 class="text-left text-base leading-tight font-bold">{assessmentPlan.name}</h3>
				</div>

				<!-- Image container taking up the right third of the card -->
				<div class="relative h-32 w-32 shrink-0">
					{#if assessmentPlan.imageBase64}
						<img
							src={`data:image/png;base64,${assessmentPlan.imageBase64}`}
							alt="Assessment plan preview"
							class="absolute top-0 left-0 h-32 w-full object-cover transition-all group-hover:brightness-90"
						/>
					{:else}
						<!-- Gradient background when no image -->
						<div
							class="absolute top-0 left-0 h-32 w-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 transition-all group-hover:brightness-90"
						></div>
					{/if}
				</div>
			</div>
		</Card.Root>
	</a>
{:else}
	<Card.Root
		class="group h-32 w-72 cursor-pointer overflow-hidden p-0 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
	>
		<div class="flex h-full items-stretch">
			<!-- Text content on left -->
			<div class="flex min-w-0 flex-1 flex-col justify-center p-4">
				<h3 class="text-left text-base leading-tight font-bold">{assessmentPlan.name}</h3>
			</div>

			<!-- Image container taking up the right third of the card -->
			<div class="relative h-32 w-32 shrink-0">
				{#if assessmentPlan.imageBase64}
					<img
						src={`data:image/png;base64,${assessmentPlan.imageBase64}`}
						alt="Assessment plan preview"
						class="absolute top-0 left-0 h-32 w-full object-cover transition-all group-hover:brightness-90"
					/>
				{:else}
					<!-- Gradient background when no image -->
					<div
						class="absolute top-0 left-0 h-32 w-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 transition-all group-hover:brightness-90"
					></div>
				{/if}
			</div>
		</div>
	</Card.Root>
{/if}
