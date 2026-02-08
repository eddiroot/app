<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { ViewMode, type GraphBlockProps } from '$lib/schema/task';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import { evaluate } from 'mathjs';
	import { mode } from 'mode-watcher';
	import type { PlotData, Root } from 'plotly.js-dist-min';
	import { onMount } from 'svelte';

	let {
		config,
		onConfigUpdate,
		response,
		onResponseUpdate,
		viewMode,
	}: GraphBlockProps = $props();

	let plotContainer: Root | undefined = $state();
	let Plotly: typeof import('plotly.js-dist-min');

	onMount(async () => {
		const plotlyModule = await import('plotly.js-dist-min');
		Plotly = plotlyModule.default || plotlyModule;
		await updatePlot();
	});

	function getThemeAwareColor(originalColor: string): string {
		if (mode.current !== 'dark') return originalColor;

		const colorMap: Record<string, string> = {
			'#3b82f6': '#60a5fa',
			'#ef4444': '#f87171',
			'#10b981': '#34d399',
			'#f59e0b': '#fbbf24',
			'#8b5cf6': '#a78bfa',
			'#06b6d4': '#22d3ee',
			'#ec4899': '#f472b6',
			'#84cc16': '#a3e635',
		};

		return colorMap[originalColor] || originalColor;
	}

	function generatePlotData(equation: string) {
		const xValues = [];
		const yValues = [];
		const step = (config.xRange.max - config.xRange.min) / 1000;

		for (let x = config.xRange.min; x <= config.xRange.max; x += step) {
			try {
				const y = evaluate(equation, { x });
				if (typeof y === 'number' && isFinite(y)) {
					xValues.push(x);
					yValues.push(y);
				}
			} catch {}
		}

		return { x: xValues, y: yValues };
	}

	function createTrace(plot: any, isDashed = false): Partial<PlotData> | null {
		const data = generatePlotData(plot.equation);
		if (data.x.length === 0) return null;

		const color = getThemeAwareColor(plot.color || '#3b82f6');
		const trace: Partial<PlotData> = {
			x: data.x,
			y: data.y,
			type: 'scatter',
			mode: 'lines',
			name: plot.label,
			line: { color, width: 2 },
		};

		if (isDashed && trace.line) {
			(trace.line as any).dash = 'dash';
		}

		return trace;
	}

	function getAxisStyle() {
		const isDark = mode.current === 'dark';
		return {
			zeroline: true,
			zerolinecolor: isDark ? '#374151' : '#d1d5db',
			gridcolor: isDark ? '#374151' : '#e5e7eb',
			color: isDark ? '#e5e7eb' : '#374151',
		};
	}

	async function updatePlot() {
		if (!Plotly || !plotContainer) return;

		const traces: Partial<PlotData>[] = [];

		config.staticPlots.forEach((plot) => {
			const trace = createTrace(plot);
			if (trace) traces.push(trace);
		});

		if (
			(viewMode === ViewMode.ANSWER || viewMode === ViewMode.REVIEW) &&
			response?.studentPlots
		) {
			response.studentPlots.forEach((plot) => {
				const trace = createTrace(
					{ ...plot, color: plot.color || '#ef4444' },
					true,
				);
				if (trace) traces.push(trace);
			});
		}

		const layout = {
			title: { text: config.title },
			xaxis: {
				title: { text: config.xAxisLabel },
				range: [config.xRange.min, config.xRange.max],
				...getAxisStyle(),
			},
			yaxis: {
				title: { text: config.yAxisLabel },
				range: [config.yRange.min, config.yRange.max],
				...getAxisStyle(),
			},
			showlegend: traces.length > 1,
			responsive: true,
			height: 500,
			paper_bgcolor: 'rgba(0,0,0,0)',
			plot_bgcolor: 'rgba(0,0,0,0)',
			font: { color: mode.current === 'dark' ? '#e5e7eb' : '#374151' },
		};

		await Plotly.react(plotContainer, traces, layout, {
			displayModeBar: false,
		});
	}

	function createPlot(
		defaultColor: string,
		labelPrefix: string,
		count: number,
	) {
		return {
			id: crypto.randomUUID(),
			equation: 'x',
			color: defaultColor,
			label: `${labelPrefix} ${count + 1}`,
		};
	}

	function updatePlots(
		isStatic: boolean,
		action: 'add' | 'remove' | 'update',
		index?: number,
		field?: string,
		value?: string,
	) {
		if (isStatic) {
			let staticPlots = [...config.staticPlots];

			if (action === 'add') {
				staticPlots.push(createPlot('#3b82f6', 'Plot', staticPlots.length));
			} else if (action === 'remove' && index !== undefined) {
				staticPlots = staticPlots.filter((_, i) => i !== index);
			} else if (
				action === 'update' &&
				index !== undefined &&
				field &&
				value !== undefined
			) {
				staticPlots[index] = { ...staticPlots[index], [field]: value };
			}

			onConfigUpdate({ ...config, staticPlots });
		} else {
			if (!response) return;
			let studentPlots = [...response.studentPlots];

			if (action === 'add') {
				studentPlots.push(
					createPlot('#ef4444', 'My Plot', studentPlots.length),
				);
			} else if (action === 'remove' && index !== undefined) {
				studentPlots = studentPlots.filter((_, i) => i !== index);
			} else if (
				action === 'update' &&
				index !== undefined &&
				field &&
				value !== undefined
			) {
				studentPlots[index] = { ...studentPlots[index], [field]: value };
			}

			onResponseUpdate({ ...response, studentPlots });
		}

		updatePlot();
	}

	$effect(() => {
		if (config || response || mode.current || viewMode) {
			updatePlot();
		}
	});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="flex items-center gap-2">
			<TrendingUpIcon />
			{#if viewMode === ViewMode.CONFIGURE}Configure Graph Block{:else}{config.title}{/if}
		</Card.Title>
	</Card.Header>

	<Card.Content class="space-y-6">
		<!-- CONFIGURE MODE: Configuration UI -->
		{#if viewMode === ViewMode.CONFIGURE}
			<!-- Graph Settings -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="space-y-2 md:col-span-2">
					<Label for="graph-title">Title</Label>
					<Input
						id="graph-title"
						value={config.title}
						oninput={(e) =>
							onConfigUpdate({
								...config,
								title: (e.target as HTMLInputElement).value,
							})}
						placeholder="Graph title"
					/>
				</div>

				<div class="space-y-2">
					<Label for="x-axis-label">X-Axis Label</Label>
					<Input
						id="x-axis-label"
						value={config.xAxisLabel}
						oninput={(e) =>
							onConfigUpdate({
								...config,
								xAxisLabel: (e.target as HTMLInputElement).value,
							})}
						placeholder="x"
					/>
				</div>

				<div class="space-y-2">
					<Label for="y-axis-label">Y-Axis Label</Label>
					<Input
						id="y-axis-label"
						value={config.yAxisLabel}
						oninput={(e) =>
							onConfigUpdate({
								...config,
								yAxisLabel: (e.target as HTMLInputElement).value,
							})}
						placeholder="y"
					/>
				</div>
			</div>

			<!-- Axis Ranges -->
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label>X-Axis Range</Label>
					<div class="flex gap-2">
						<Input
							type="number"
							value={config.xRange.min}
							oninput={(e) =>
								onConfigUpdate({
									...config,
									xRange: {
										...config.xRange,
										min: Number((e.target as HTMLInputElement).value),
									},
								})}
							placeholder="Min"
						/>
						<Input
							type="number"
							value={config.xRange.max}
							oninput={(e) =>
								onConfigUpdate({
									...config,
									xRange: {
										...config.xRange,
										max: Number((e.target as HTMLInputElement).value),
									},
								})}
							placeholder="Max"
						/>
					</div>
				</div>

				<div class="space-y-2">
					<Label>Y-Axis Range</Label>
					<div class="flex gap-2">
						<Input
							type="number"
							value={config.yRange.min}
							oninput={(e) =>
								onConfigUpdate({
									...config,
									yRange: {
										...config.yRange,
										min: Number((e.target as HTMLInputElement).value),
									},
								})}
							placeholder="Min"
						/>
						<Input
							type="number"
							value={config.yRange.max}
							oninput={(e) =>
								onConfigUpdate({
									...config,
									yRange: {
										...config.yRange,
										max: Number((e.target as HTMLInputElement).value),
									},
								})}
							placeholder="Max"
						/>
					</div>
				</div>
			</div>

			<!-- Static Plots Configuration -->
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<Label class="text-base font-semibold">Static Plots</Label>
					<Button onclick={() => updatePlots(true, 'add')} size="sm">
						<PlusIcon class="mr-2" />
						Add Plot
					</Button>
				</div>

				{#each config.staticPlots as plot, index}
					<div class="grid grid-cols-[3fr_3fr_3fr_1fr] gap-3">
						<Input
							value={plot.equation}
							oninput={(e) =>
								updatePlots(
									true,
									'update',
									index,
									'equation',
									(e.target as HTMLInputElement).value,
								)}
							placeholder="e.g., x^2, sin(x), 2*x+1"
						/>

						<Input
							type="color"
							value={plot.color || '#3b82f6'}
							oninput={(e) =>
								updatePlots(
									true,
									'update',
									index,
									'color',
									(e.target as HTMLInputElement).value,
								)}
						/>

						<Input
							value={plot.label}
							oninput={(e) =>
								updatePlots(
									true,
									'update',
									index,
									'label',
									(e.target as HTMLInputElement).value,
								)}
							placeholder="Plot label"
						/>
						<Button
							onclick={() => updatePlots(true, 'remove', index)}
							variant="destructive"
							size="sm"
						>
							<TrashIcon />
						</Button>
					</div>
				{/each}

				{#if config.staticPlots.length === 0}
					<p class="text-muted-foreground py-4 text-center text-sm">
						No static plots configured. Add some example equations for students
						to see.
					</p>
				{/if}
			</div>
		{/if}

		<!-- PRESENTATION MODE: Clean title -->
		{#if viewMode === ViewMode.PRESENT}
			<h3 class="text-lg font-semibold">{config.title}</h3>
		{/if}

		<!-- ANSWER MODE: Student Plot Controls -->
		{#if viewMode === ViewMode.ANSWER}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<Label class="text-base font-semibold">Your Plots</Label>
					<Button onclick={() => updatePlots(false, 'add')} size="sm">
						<PlusIcon class="mr-2" />
						Add Plot
					</Button>
				</div>

				{#each response.studentPlots as plot, index}
					<div class="grid grid-cols-[3fr_3fr_3fr_1fr] gap-3">
						<Input
							value={plot.equation}
							oninput={(e) =>
								updatePlots(
									false,
									'update',
									index,
									'equation',
									(e.target as HTMLInputElement).value,
								)}
							placeholder="e.g., x^2, sin(x), 2*x+1"
						/>

						<Input
							type="color"
							value={plot.color || '#ef4444'}
							oninput={(e) =>
								updatePlots(
									false,
									'update',
									index,
									'color',
									(e.target as HTMLInputElement).value,
								)}
						/>

						<Input
							value={plot.label}
							oninput={(e) =>
								updatePlots(
									false,
									'update',
									index,
									'label',
									(e.target as HTMLInputElement).value,
								)}
							placeholder="Plot label"
						/>
						<Button
							onclick={() => updatePlots(false, 'remove', index)}
							variant="destructive"
							size="sm"
						>
							<TrashIcon />
						</Button>
					</div>
				{/each}
			</div>
		{/if}

		<!-- REVIEW MODE: Show student's plots -->
		{#if viewMode === ViewMode.REVIEW}
			{#if response.studentPlots.length > 0}
				<div class="space-y-4">
					<Label class="text-base font-semibold">Student's Plots</Label>
					{#each response.studentPlots as plot, index}
						<div class="bg-muted/20 rounded-lg border p-3">
							<div class="grid grid-cols-3 gap-4 text-sm">
								<div>
									<span class="font-medium">Equation:</span>
									{plot.equation}
								</div>
								<div>
									<span class="font-medium">Color:</span>
									<span
										class="ml-1 inline-block h-4 w-4 rounded"
										style="background-color: {plot.color || '#ef4444'}"
									></span>
								</div>
								<div>
									<span class="font-medium">Label:</span>
									{plot.label}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-muted-foreground py-4 text-center">
					No student plots submitted.
				</div>
			{/if}
		{/if}

		<div bind:this={plotContainer}></div>
	</Card.Content>
</Card.Root>
