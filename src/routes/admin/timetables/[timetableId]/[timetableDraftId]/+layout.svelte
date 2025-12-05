<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { steps } from './constants';

	let { children } = $props();

	function getCurrentStepData(pathname: string) {
		const urlSuffix = pathname.split('/').pop();
		return (
			steps[urlSuffix as keyof typeof steps] || {
				percentage: 0,
				label: '',
				previous: null,
				next: null
			}
		);
	}

	function buildStepUrl(suffix: string | null): string {
		if (!suffix) return '';
		const basePath = page.url.pathname.split('/').slice(0, -1).join('/');
		return `${basePath}/${suffix}`;
	}

	const currentStep = $derived(getCurrentStepData(page.url.pathname));
</script>

<div class="flex h-full flex-col gap-8">
	<div class="flex flex-shrink-0 flex-row items-center gap-8">
		<Button
			href={currentStep.previous ? buildStepUrl(currentStep.previous) : '#'}
			variant="link"
			size="sm"
			class="gap-2 px-0 has-[>svg]:px-0"
			disabled={!currentStep.previous}
		>
			<ChevronLeft />
			Previous
		</Button>

		<div class="flex-1 space-y-4">
			<div class="space-y-2">
				<div class="flex items-center justify-between text-sm font-medium">
					<span class="text-muted-foreground">Progress</span>
					<span class="text-primary font-semibold">{currentStep.percentage}%</span>
				</div>
				<Progress value={currentStep.percentage} class="h-3" />
			</div>

			<div class="invisible grid grid-cols-10 items-center gap-2 text-xs lg:visible">
				{#each Object.entries(steps) as [_, step]}
					<a
						href={buildStepUrl(step.url.toLowerCase())}
						class="block text-center leading-tight font-medium transition-colors duration-300 {step.percentage <=
						currentStep.percentage
							? 'text-primary'
							: 'text-muted-foreground'}"
					>
						{step.label}
					</a>
				{/each}
			</div>
		</div>

		<Button
			href={currentStep.next ? buildStepUrl(currentStep.next) : '#'}
			variant="link"
			size="sm"
			class="gap-2 px-0 has-[>svg]:px-0"
			disabled={!currentStep.next}
		>
			Next
			<ChevronRight />
		</Button>
	</div>

	<div class="min-h-0 flex-1 overflow-auto">
		{@render children()}
	</div>
</div>
