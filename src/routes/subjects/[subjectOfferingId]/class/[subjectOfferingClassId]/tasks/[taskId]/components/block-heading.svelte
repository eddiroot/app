<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { ViewMode, type HeadingBlockProps } from '$lib/schema/task';

	let { config, onConfigUpdate, viewMode }: HeadingBlockProps = $props();

	const getClassesBySize = (size: number): string => {
		const coreClasses =
			'h-auto w-full resize-none scroll-m-20 border-none bg-transparent p-0 shadow-none focus:ring-0 focus:outline-none tracking-tight ';
		switch (size) {
			case 1:
				return coreClasses + 'text-5xl font-extrabold';
			case 2:
				return coreClasses + 'text-4xl font-semibold';
			case 3:
				return coreClasses + 'text-3xl font-semibold';
			case 4:
				return coreClasses + 'text-2xl font-semibold';
			case 5:
				return coreClasses + 'text-xl font-semibold';
			case 6:
				return coreClasses + 'text-lg font-semibold';
			default:
				return coreClasses + '';
		}
	};
</script>

<div class="w-full">
	{#if viewMode === ViewMode.CONFIGURE}
		<div class="flex gap-x-1">
			<input
				value={config.text}
				oninput={(e) => {
					const value = (e.target as HTMLInputElement)?.value;
					if (value !== undefined) {
						const newConfig = { ...config, text: value };
						onConfigUpdate(newConfig);
					}
				}}
				class={getClassesBySize(config.size)}
				placeholder="Enter heading text..."
			/>
			{#if config.size !== 1}
				<Select.Root
					type="single"
					onValueChange={(value) => {
						const newSize = parseInt(value);
						const newConfig = { ...config, size: newSize };
						onConfigUpdate(newConfig);
					}}
				>
					<Select.Trigger>
						{config.size}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Label>Heading Level</Select.Label>
							{#each ['2', '3', '4', '5', '6'] as size (size)}
								<Select.Item value={size} label={size}>
									{size}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			{/if}
		</div>
	{:else if config.size === 1}
		<h1 class="scroll-m-20 text-5xl font-extrabold tracking-tight">{config.text}</h1>
	{:else if config.size === 2}
		<h2 class="scroll-m-20 text-4xl font-semibold tracking-tight">{config.text}</h2>
	{:else if config.size === 3}
		<h3 class="scroll-m-20 text-3xl font-semibold tracking-tight">{config.text}</h3>
	{:else if config.size === 4}
		<h4 class="scroll-m-20 text-2xl font-semibold tracking-tight">{config.text}</h4>
	{:else if config.size === 5}
		<h5 class="scroll-m-20 text-xl font-semibold tracking-tight">{config.text}</h5>
	{:else if config.size === 6}
		<h6 class="scroll-m-20 text-lg font-semibold tracking-tight">{config.text}</h6>
	{/if}
</div>
