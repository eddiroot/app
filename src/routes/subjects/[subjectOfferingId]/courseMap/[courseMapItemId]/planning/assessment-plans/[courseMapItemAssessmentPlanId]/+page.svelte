<script lang="ts">
	import Rubric from '$lib/components/rubric.svelte';
	let { data } = $props();

	// Resizable splitter state
	let isDragging = $state(false);
	let leftWidth = $state(50); // Percentage, default to center
	let containerRef: HTMLDivElement;

	function handleMouseDown(event: MouseEvent) {
		isDragging = true;
		event.preventDefault();
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging || !containerRef) return;

		const rect = containerRef.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const percentage = (x / rect.width) * 100;

		// Constrain between 20% and 80%
		leftWidth = Math.min(80, Math.max(20, percentage));
	}

	function handleMouseUp() {
		isDragging = false;
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	}
</script>

<!-- Hero Section with Assessment Plan Image -->
<div class="relative mb-8 h-64 w-full overflow-hidden">
	{#if data.assessmentPlan.imageBase64}
		<img
			src={`data:image/png;base64,${data.assessmentPlan.imageBase64}`}
			alt={data.assessmentPlan.name}
			class="absolute inset-0 h-full w-full object-cover"
		/>
		<div class="absolute inset-0 bg-black/40"></div>
	{:else if data.courseMapItem.imageBase64}
		<img
			src={`data:image/png;base64,${data.courseMapItem.imageBase64}`}
			alt={data.courseMapItem.topic}
			class="absolute inset-0 h-full w-full object-cover"
		/>
		<div class="absolute inset-0 bg-black/40"></div>
	{:else}
		<div class="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-600/10"></div>
	{/if}

	<!-- Assessment Plan Title Overlay (centered) -->
	<div
		class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white"
	>
		<h1 class="mb-2 text-4xl font-bold">{data.assessmentPlan.name}</h1>
		<p class="text-lg opacity-90">Topic: {data.courseMapItem.topic}</p>
	</div>
</div>

<div class="w-full space-y-8 px-4 sm:px-6 lg:px-8">
	<!-- Resizable Two Column Layout -->
	<div bind:this={containerRef} class="h-screen-minus-hero relative hidden lg:flex">
		<!-- Left Column: Information -->
		<div class="overflow-y-auto pr-4" style="width: {leftWidth}%;">
			<div class="space-y-8">
				<!-- Scopes Section -->
				{#if data.assessmentPlan.scope?.length}
					<div class="space-y-4">
						<h2 class="text-2xl font-semibold">Assessment Scopes</h2>
						<ul class="text-muted-foreground ml-6 list-disc space-y-2 leading-relaxed">
							{#each data.assessmentPlan.scope as scope}
								<li>{scope}</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Curriculum Standards Section -->
				{#if data.standards.length > 0}
					<div class="space-y-4">
						<h2 class="text-2xl font-semibold">Curriculum Standards Assessed</h2>
						<ul class="ml-6 list-disc space-y-3">
							{#each data.standards as standard}
								<li>
									<div class="font-medium">{standard.name}:</div>
									{#if standard.description}
										<div class="text-muted-foreground mt-1">{standard.description}</div>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Description Section -->
				{#if data.assessmentPlan.description}
					<div class="space-y-4">
						<h2 class="text-2xl font-semibold">Description</h2>
						<p class="text-muted-foreground leading-relaxed">{data.assessmentPlan.description}</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Resizable Separator -->
		<div
			class="bg-border hover:bg-border/80 group relative flex w-2 cursor-col-resize items-center justify-center transition-colors"
			role="button"
			tabindex="0"
			onmousedown={handleMouseDown}
		>
			<div
				class="bg-muted-foreground/40 group-hover:bg-muted-foreground/60 h-8 w-1 rounded-full transition-colors"
			></div>
		</div>

		<!-- Right Column: Rubric -->
		<div class="flex-1 overflow-y-auto pl-4">
			{#if data.rubric}
				<div class="h-full space-y-6">
					<h2 class="text-2xl font-semibold">Assessment Rubric</h2>
					<div class="w-full">
						<Rubric rubricData={data.rubric} />
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Mobile Layout (Non-resizable) -->
	<div class="space-y-8 lg:hidden">
		<!-- Scopes Section -->
		{#if data.assessmentPlan.scope?.length}
			<div class="space-y-4">
				<h2 class="text-2xl font-semibold">Assessment Scopes</h2>
				<ul class="text-muted-foreground ml-6 list-disc space-y-2 leading-relaxed">
					{#each data.assessmentPlan.scope as scope}
						<li>{scope}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Curriculum Standards Section -->
		{#if data.standards.length > 0}
			<div class="space-y-4">
				<h2 class="text-2xl font-semibold">Curriculum Standards Assessed</h2>
				<ul class="ml-6 list-disc space-y-3">
					{#each data.standards as standard}
						<li>
							<div class="font-medium">{standard.name}:</div>
							{#if standard.description}
								<div class="text-muted-foreground mt-1">{standard.description}</div>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Description Section -->
		{#if data.assessmentPlan.description}
			<div class="space-y-4">
				<h2 class="text-2xl font-semibold">Description</h2>
				<p class="text-muted-foreground leading-relaxed">{data.assessmentPlan.description}</p>
			</div>
		{/if}

		<!-- Rubric Section -->
		{#if data.rubric}
			<div class="space-y-6">
				<h2 class="text-2xl font-semibold">Assessment Rubric</h2>
				<Rubric rubricData={data.rubric} />
			</div>
		{/if}
	</div>
</div>
