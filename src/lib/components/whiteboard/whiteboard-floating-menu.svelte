<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowDownToLineIcon from '@lucide/svelte/icons/arrow-down-to-line';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowUpToLineIcon from '@lucide/svelte/icons/arrow-up-to-line';
	import Heading1Icon from '@lucide/svelte/icons/heading-1';
	import Heading2Icon from '@lucide/svelte/icons/heading-2';
	import Heading3Icon from '@lucide/svelte/icons/heading-3';
	import Heading4Icon from '@lucide/svelte/icons/heading-4';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import SlidersIcon from '@lucide/svelte/icons/sliders';
	import TypeIcon from '@lucide/svelte/icons/type';
	import WhiteboardLayeringControls from './whiteboard-layering-controls.svelte';

	interface Props {
		selectedTool: string;
		visible: boolean;
		onTextOptionsChange?: (options: TextOptions) => void;
		onShapeOptionsChange?: (options: ShapeOptions) => void;
		onDrawOptionsChange?: (options: DrawOptions) => void;
		onLineArrowOptionsChange?: (options: LineArrowOptions) => void;
		onCanvasInteraction?: () => void;
		onBringToFront?: () => void;
		onSendToBack?: () => void;
		onMoveForward?: () => void;
		onMoveBackward?: () => void;
	}

	interface TextOptions {
		fontSize: number;
		fontFamily: string;
		fontWeight: string;
		colour: string;
		textAlign: string;
		opacity: number;
	}

	interface ShapeOptions {
		strokeWidth: number;
		strokeColour: string;
		fillColour: string;
		strokeDashArray: number[];
		cornerRadius?: number;
		opacity: number;
	}

	interface DrawOptions {
		brushSize: number;
		brushColour: string;
		brushType: string;
		opacity: number;
	}

	interface LineArrowOptions {
		strokeWidth: number;
		strokeColour: string;
		strokeDashArray: number[];
		opacity: number;
	}

	let {
		selectedTool,
		visible,
		onTextOptionsChange,
		onShapeOptionsChange,
		onDrawOptionsChange,
		onLineArrowOptionsChange,
		onCanvasInteraction,
		onBringToFront,
		onSendToBack,
		onMoveForward,
		onMoveBackward
	}: Props = $props();

	// Track which menu panel to show (independent of selectedTool for editing existing objects)
	let activeMenuPanel = $state<string>(selectedTool);

	// Sync activeMenuPanel with selectedTool when tool changes
	$effect(() => {
		activeMenuPanel = selectedTool;
	});

	// Default options
	let textOptions = $state<TextOptions>({
		fontSize: 16,
		fontFamily: 'Arial',
		fontWeight: 'normal',
		colour: '#1E1E1E',
		textAlign: 'left',
		opacity: 1
	});

	let shapeOptions = $state<ShapeOptions>({
		strokeWidth: 2,
		strokeColour: '#1E1E1E',
		fillColour: 'transparent',
		strokeDashArray: [],
		cornerRadius: 0,
		opacity: 1
	});

	let drawOptions = $state<DrawOptions>({
		brushSize: 6,
		brushColour: '#1E1E1E',
		brushType: 'pencil',
		opacity: 1
	});

	let lineArrowOptions = $state<LineArrowOptions>({
		strokeWidth: 2,
		strokeColour: '#1E1E1E',
		strokeDashArray: [],
		opacity: 1
	});

	// Flag to prevent triggering onChange handlers during sync
	let isSyncingFromObject = $state(false);

	let fontSizeValue = $state(16);
	let strokeWidthValue = $state(2);
	let brushSizeValue = $state(6);
	let textOpacityValue = $state(1);
	let shapeOpacityValue = $state(1);
	let drawOpacityValue = $state(1);
	let lineArrowStrokeWidthValue = $state(2);
	let lineArrowOpacityValue = $state(1);

	// Keep options in sync with slider values
	$effect(() => {
		textOptions.fontSize = fontSizeValue;
	});

	$effect(() => {
		shapeOptions.strokeWidth = strokeWidthValue;
	});

	$effect(() => {
		drawOptions.brushSize = brushSizeValue;
	});

	$effect(() => {
		textOptions.opacity = textOpacityValue;
	});

	$effect(() => {
		shapeOptions.opacity = shapeOpacityValue;
	});

	$effect(() => {
		drawOptions.opacity = drawOpacityValue;
	});

	$effect(() => {
		lineArrowOptions.strokeWidth = lineArrowStrokeWidthValue;
	});

	$effect(() => {
		lineArrowOptions.opacity = lineArrowOpacityValue;
	});

	// Keep slider values in sync when options change externally
	$effect(() => {
		if (fontSizeValue !== textOptions.fontSize) {
			fontSizeValue = textOptions.fontSize;
		}
	});

	$effect(() => {
		if (strokeWidthValue !== shapeOptions.strokeWidth) {
			strokeWidthValue = shapeOptions.strokeWidth;
		}
	});

	$effect(() => {
		if (brushSizeValue !== drawOptions.brushSize) {
			brushSizeValue = drawOptions.brushSize;
		}
	});

	$effect(() => {
		if (textOpacityValue !== textOptions.opacity) {
			textOpacityValue = textOptions.opacity;
		}
	});

	$effect(() => {
		if (shapeOpacityValue !== shapeOptions.opacity) {
			shapeOpacityValue = shapeOptions.opacity;
		}
	});

	$effect(() => {
		if (drawOpacityValue !== drawOptions.opacity) {
			drawOpacityValue = drawOptions.opacity;
		}
	});

	$effect(() => {
		if (lineArrowStrokeWidthValue !== lineArrowOptions.strokeWidth) {
			lineArrowStrokeWidthValue = lineArrowOptions.strokeWidth;
		}
	});

	$effect(() => {
		if (lineArrowOpacityValue !== lineArrowOptions.opacity) {
			lineArrowOpacityValue = lineArrowOptions.opacity;
		}
	});

	// Font families available
	const fontFamilies = [
		{ value: 'Arial', label: 'Arial' },
		{ value: 'Times New Roman', label: 'Times New Roman' },
		{ value: 'Georgia', label: 'Georgia' },
		{ value: 'Verdana', label: 'Verdana' },
		{ value: 'Courier New', label: 'Courier New' },
		{ value: 'Impact', label: 'Impact' }
	];

	const fontWeights = [
		{ value: 'normal', label: 'Normal' },
		{ value: 'bold', label: 'Bold' },
		{ value: '300', label: 'Light' }
	];

	// Common colours
	const commonColours = ['#1E1E1E', '#E53E3E', '#4299E1', '#48BB78'];

	// Extended colour palette
	const colourPalette = [
		// Row 1
		['#FFFFFF', '#8B96A5', '#1E1E1E', '#553C23', '#B83280'],
		// Row 2
		['#553C9A', '#3C366B', '#2C5282', '#0987A0', '#2C7A7B'],
		// Row 3
		['#2F855A', '#4D7C0F', '#B7791F', '#C05621', '#C53030']
	] as const;

	const colourShades = {
		'#FFFFFF': [], // No shades for white
		'#8B96A5': ['#8B96A5', '#A0AEC0', '#CBD5E0', '#E2E8F0', '#F7FAFC'], // Gray
		'#1E1E1E': [], // No shades for black
		'#553C23': ['#553C23', '#7C6742', '#A69764', '#D4C99A', '#F0E6D2'], // Brown
		'#B83280': ['#B83280', '#D53F8C', '#ED64A6', '#F687B3', '#FED7E2'], // Pink
		'#553C9A': ['#553C9A', '#805AD5', '#9F7AEA', '#C3A6E3', '#E9D8FD'], // Purple
		'#3C366B': ['#3C366B', '#553C9A', '#7C3AED', '#A78BFA', '#D6BCFA'], // Indigo
		'#2C5282': ['#2C5282', '#3182CE', '#4299E1', '#90CDF4', '#BEE3F8'], // Blue
		'#0987A0': ['#0987A0', '#00B5D8', '#0BC5EA', '#76E4F7', '#C4F1F9'], // Cyan
		'#2C7A7B': ['#2C7A7B', '#319795', '#38B2AC', '#81E6D9', '#B2F5EA'], // Teal
		'#2F855A': ['#2F855A', '#38A169', '#48BB78', '#9AE6B4', '#C6F6D5'], // Green
		'#4D7C0F': ['#4D7C0F', '#65A30D', '#84CC16', '#BEF264', '#ECFCCB'], // Lime
		'#B7791F': ['#B7791F', '#D69E2E', '#F6E05E', '#FAF089', '#FEFCBF'], // Yellow
		'#C05621': ['#C05621', '#DD6B20', '#ED8936', '#FBD38D', '#FEEBCB'], // Orange
		'#C53030': ['#C53030', '#E53E3E', '#F56565', '#FEB2B2', '#FED7D7'] // Red
	} as const;

	type ColourFamily = keyof typeof colourShades;
	let selectedColourFamily = $state<ColourFamily>('#1E1E1E'); // Default to black
	let showExpandedColours = $state(false); // Toggle for expanded colour palette
	let expandedColoursFor = $state<'text' | 'stroke' | 'fill' | 'brush' | 'line' | null>(null); // Track which colour picker opened the expanded palette

	// Function to close the expanded colors panel
	export function closeExpandedColors() {
		showExpandedColours = false;
		expandedColoursFor = null;
	}

	// Functions to update options from selected objects
	export function updateTextOptions(options: Partial<TextOptions>) {
		isSyncingFromObject = true;
		textOptions = { ...textOptions, ...options };
		if (options.fontSize !== undefined) fontSizeValue = options.fontSize;
		if (options.opacity !== undefined) textOpacityValue = options.opacity;
		setTimeout(() => (isSyncingFromObject = false), 0);
	}

	export function updateShapeOptions(options: Partial<ShapeOptions>) {
		isSyncingFromObject = true;
		shapeOptions = { ...shapeOptions, ...options };
		if (options.strokeWidth !== undefined) strokeWidthValue = options.strokeWidth;
		if (options.opacity !== undefined) shapeOpacityValue = options.opacity;
		setTimeout(() => (isSyncingFromObject = false), 0);
	}

	export function updateDrawOptions(options: Partial<DrawOptions>) {
		isSyncingFromObject = true;
		drawOptions = { ...drawOptions, ...options };
		if (options.brushSize !== undefined) brushSizeValue = options.brushSize;
		if (options.opacity !== undefined) drawOpacityValue = options.opacity;
		setTimeout(() => (isSyncingFromObject = false), 0);
	}

	export function updateLineArrowOptions(options: Partial<LineArrowOptions>) {
		isSyncingFromObject = true;
		lineArrowOptions = { ...lineArrowOptions, ...options };
		if (options.strokeWidth !== undefined) lineArrowStrokeWidthValue = options.strokeWidth;
		if (options.opacity !== undefined) lineArrowOpacityValue = options.opacity;
		setTimeout(() => (isSyncingFromObject = false), 0);
	}

	// Function to set the active menu panel (for showing correct options when editing objects)
	export function setActiveMenuPanel(panel: string) {
		activeMenuPanel = panel;
	}

	// Reactive updates
	$effect(() => {
		if (!isSyncingFromObject && activeMenuPanel === 'text' && onTextOptionsChange) {
			onTextOptionsChange(textOptions);
		}
	});

	$effect(() => {
		if (!isSyncingFromObject && activeMenuPanel === 'shapes' && onShapeOptionsChange) {
			onShapeOptionsChange(shapeOptions);
		}
	});

	$effect(() => {
		if (!isSyncingFromObject && activeMenuPanel === 'draw' && onDrawOptionsChange) {
			onDrawOptionsChange(drawOptions);
		}

		if (!isSyncingFromObject && activeMenuPanel === 'eraser' && onDrawOptionsChange) {
			onDrawOptionsChange(drawOptions);
		}
	});

	$effect(() => {
		if (
			!isSyncingFromObject &&
			(activeMenuPanel === 'line' || activeMenuPanel === 'arrow') &&
			onLineArrowOptionsChange
		) {
			onLineArrowOptionsChange(lineArrowOptions);
		}
	});

	const shouldShowMenu = $derived(
		visible &&
			selectedTool !== 'pan' &&
			(activeMenuPanel === 'text' ||
				activeMenuPanel === 'shapes' ||
				activeMenuPanel === 'draw' ||
				activeMenuPanel === 'eraser' ||
				activeMenuPanel === 'line' ||
				activeMenuPanel === 'arrow' ||
				activeMenuPanel === 'select' ||
				activeMenuPanel === 'image')
	);
</script>

{#if shouldShowMenu}
	<div class="absolute top-1/2 left-8 z-20 flex -translate-y-1/2 transform gap-2">
		<Card.Root class="bg-background/20 border-border/50 max-w-80 min-w-64 backdrop-blur-sm">
			{#if activeMenuPanel === 'text'}
				<Card.Header class="pb-3">
					<Card.Title class="flex items-center gap-2 text-sm">
						<TypeIcon />
						Text Options
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Font Size -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Font Size</Label>
						<div class="flex gap-2">
							<Button
								variant={fontSizeValue === 32 ? 'default' : 'outline'}
								size="sm"
								onclick={() => (fontSizeValue = 32)}
								class="flex h-8 flex-1 items-center justify-center"
							>
								<Heading1Icon />
							</Button>
							<Button
								variant={fontSizeValue === 24 ? 'default' : 'outline'}
								size="sm"
								onclick={() => (fontSizeValue = 24)}
								class="flex h-8 flex-1 items-center justify-center"
							>
								<Heading2Icon />
							</Button>
							<Button
								variant={fontSizeValue === 16 ? 'default' : 'outline'}
								size="sm"
								onclick={() => (fontSizeValue = 16)}
								class="flex h-8 flex-1 items-center justify-center"
							>
								<Heading3Icon />
							</Button>
							<Button
								variant={fontSizeValue === 12 ? 'default' : 'outline'}
								size="sm"
								onclick={() => (fontSizeValue = 12)}
								class="flex h-8 flex-1 items-center justify-center"
							>
								<Heading4Icon />
							</Button>
						</div>
					</div>

					<!-- Font Family -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Font Family</Label>
						<Select.Root type="single" bind:value={textOptions.fontFamily}>
							<Select.Trigger class="h-8">
								{textOptions.fontFamily}
							</Select.Trigger>
							<Select.Content>
								{#each fontFamilies as font}
									<Select.Item value={font.value} label={font.label} />
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<!-- Font Weight -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Font Weight</Label>
						<Select.Root type="single" bind:value={textOptions.fontWeight}>
							<Select.Trigger class="h-8">
								{fontWeights.find((w) => w.value === textOptions.fontWeight)?.label || 'Normal'}
							</Select.Trigger>
							<Select.Content>
								{#each fontWeights as weight}
									<Select.Item value={weight.value} label={weight.label} />
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<Separator />

					<!-- Text Colour -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Text Colour</Label>
						<div class="mb-2 flex flex-wrap items-center gap-1">
							{#each commonColours as colour}
								<button
									class="h-10 w-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {textOptions.colour ===
									colour
										? 'border-primary ring-primary/20 ring-2'
										: 'border-border hover:border-primary/50'}"
									onclick={() => (textOptions.colour = colour)}
									aria-label="Select colour {colour}"
								>
									<div class="h-full w-full rounded-sm" style="background-color: {colour}"></div>
								</button>
							{/each}

							<!-- Separator line -->
							<div class="bg-border mx-1 h-8 w-px"></div>

							<!-- Expanded colours toggle button -->
							<button
								class="h-10 w-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {showExpandedColours &&
								expandedColoursFor === 'text'
									? 'border-primary ring-primary/20 ring-2'
									: 'border-border hover:border-primary/50'}"
								onclick={() => {
									if (showExpandedColours && expandedColoursFor === 'text') {
										showExpandedColours = false;
										expandedColoursFor = null;
									} else {
										showExpandedColours = true;
										expandedColoursFor = 'text';
									}
								}}
								aria-label="Toggle expanded colour palette"
							>
								<div
									class="h-full w-full rounded-sm"
									style="background-color: {textOptions.colour}"
								></div>
							</button>
						</div>
					</div>

					<Separator />

					<!-- Opacity -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Opacity</Label>
						<div class="flex items-center gap-3">
							<Slider
								type="single"
								bind:value={textOpacityValue}
								min={0.1}
								max={1}
								step={0.1}
								class="flex-1"
							/>
							<span class="text-muted-foreground w-12 text-right text-xs"
								>{Math.round(textOpacityValue * 100)}%</span
							>
						</div>
					</div>
				

				<Separator />

				<!-- Layering Controls -->
				<WhiteboardLayeringControls
					{onBringToFront}
					{onSendToBack}
					{onMoveForward}
					{onMoveBackward}
				/>
			</Card.Content>
		{:else if activeMenuPanel === 'shapes'}
				<Card.Header class="pb-3">
					<Card.Title class="flex items-center gap-2 text-sm">
						<SlidersIcon />
						Shape Options
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Stroke Width -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Stroke Width</Label>
						<div class="flex gap-2">
							<Button
								variant={strokeWidthValue === 1 ? 'default' : 'outline'}
								size="sm"
								onclick={() => (strokeWidthValue = 1)}
								class="flex h-10 w-10 items-center justify-center"
							>
								<MinusIcon class="h-3 w-3" strokeWidth={1} />
							</Button>
							<Button
								variant={strokeWidthValue === 2 ? 'default' : 'outline'}
								size="sm"
								onclick={() => (strokeWidthValue = 2)}
								class="flex h-10 w-10 items-center justify-center"
							>
								<MinusIcon strokeWidth={4} />
							</Button>
							<Button
								variant={strokeWidthValue === 3 ? 'default' : 'outline'}
								size="sm"
								onclick={() => (strokeWidthValue = 3)}
								class="flex h-10 w-10 items-center justify-center"
							>
								<MinusIcon class="h-5 w-5" strokeWidth={7} />
							</Button>
						</div>
					</div>

					<!-- Border Style -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Border Style</Label>
						<div class="flex gap-2">
							<Button
								variant={JSON.stringify(shapeOptions.strokeDashArray) === JSON.stringify([])
									? 'default'
									: 'outline'}
								size="sm"
								onclick={() => (shapeOptions.strokeDashArray = [])}
								class="flex h-10 w-10 items-center justify-center"
							>
								<MinusIcon />
							</Button>
							<Button
								variant={JSON.stringify(shapeOptions.strokeDashArray) === JSON.stringify([5, 5])
									? 'default'
									: 'outline'}
								size="sm"
								onclick={() => (shapeOptions.strokeDashArray = [5, 5])}
								class="flex h-10 w-10 items-center justify-center"
							>
								<svg width="16" height="16" viewBox="0 0 16 16">
									<line
										x1="2"
										y1="8"
										x2="14"
										y2="8"
										stroke="currentColor"
										stroke-width="2"
										stroke-dasharray="3,2"
									/>
								</svg>
							</Button>
							<Button
								variant={JSON.stringify(shapeOptions.strokeDashArray) === JSON.stringify([2, 2])
									? 'default'
									: 'outline'}
								size="sm"
								onclick={() => (shapeOptions.strokeDashArray = [2, 2])}
								class="flex h-10 w-10 items-center justify-center"
							>
								<svg width="16" height="16" viewBox="0 0 16 16">
									<line
										x1="2"
										y1="8"
										x2="14"
										y2="8"
										stroke="currentColor"
										stroke-width="2"
										stroke-dasharray="1.5,1.5"
									/>
								</svg>
							</Button>
						</div>
					</div>

					<Separator />

					<!-- Stroke Colour -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Stroke Colour</Label>
						<div class="mb-2 flex flex-wrap items-center gap-1">
							{#each commonColours as colour}
								<button
									class="h-10 w-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {shapeOptions.strokeColour ===
									colour
										? 'border-primary ring-primary/20 ring-2'
										: 'border-border hover:border-primary/50'}"
									onclick={() => (shapeOptions.strokeColour = colour)}
									aria-label="Select stroke colour {colour}"
								>
									<div class="h-full w-full rounded-sm" style="background-color: {colour}"></div>
								</button>
							{/each}

							<!-- Separator line -->
							<div class="bg-border mx-1 h-8 w-px"></div>

							<!-- Expanded colours toggle button -->
							<button
								class="h-10 w-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {showExpandedColours &&
								expandedColoursFor === 'stroke'
									? 'border-primary ring-primary/20 ring-2'
									: 'border-border hover:border-primary/50'}"
								onclick={() => {
									if (showExpandedColours && expandedColoursFor === 'stroke') {
										showExpandedColours = false;
										expandedColoursFor = null;
									} else {
										showExpandedColours = true;
										expandedColoursFor = 'stroke';
									}
								}}
								aria-label="Toggle expanded colour palette"
							>
								<div
									class="h-full w-full rounded-sm"
									style="background-color: {shapeOptions.strokeColour}"
								></div>
							</button>
						</div>
					</div>

					<Separator />

					<!-- Fill Colour -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Fill Colour</Label>
						<div class="mb-2 flex gap-2">
							<Button
								variant={shapeOptions.fillColour === 'transparent' ? 'default' : 'outline'}
								size="sm"
								onclick={() => (shapeOptions.fillColour = 'transparent')}
								class="h-7 text-xs"
							>
								No Fill
							</Button>
						</div>
						<div class="mb-2 flex flex-wrap items-center gap-1">
							{#each commonColours as colour}
								<button
									class="h-10 w-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {shapeOptions.fillColour ===
									colour
										? 'border-primary ring-primary/20 ring-2'
										: 'border-border hover:border-primary/50'}"
									onclick={() => (shapeOptions.fillColour = colour)}
									aria-label="Select fill colour {colour}"
								>
									<div class="h-full w-full rounded-sm" style="background-color: {colour}"></div>
								</button>
							{/each}

							<!-- Separator line -->
							<div class="bg-border mx-1 h-8 w-px"></div>

							<!-- Expanded colours toggle button -->
							<button
								class="h-10 w-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {showExpandedColours &&
								expandedColoursFor === 'fill'
									? 'border-primary ring-primary/20 ring-2'
									: 'border-border hover:border-primary/50'}"
								onclick={() => {
									if (showExpandedColours && expandedColoursFor === 'fill') {
										showExpandedColours = false;
										expandedColoursFor = null;
									} else {
										showExpandedColours = true;
										expandedColoursFor = 'fill';
									}
								}}
								aria-label="Toggle expanded colour palette"
							>
								<div
									class="h-full w-full rounded-sm"
									style="background-color: {shapeOptions.fillColour}"
								></div>
							</button>
						</div>
					</div>

					<Separator />

					<!-- Opacity -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Opacity</Label>
						<div class="flex items-center gap-3">
							<Slider
								type="single"
								bind:value={shapeOpacityValue}
								min={0.1}
								max={1}
								step={0.1}
								class="flex-1"
							/>
							<span class="text-muted-foreground w-12 text-right text-xs"
								>{Math.round(shapeOpacityValue * 100)}%</span
							>
						</div>
					</div>
				

				<Separator />

				<!-- Layering Controls -->
				<WhiteboardLayeringControls
					{onBringToFront}
					{onSendToBack}
					{onMoveForward}
					{onMoveBackward}
				/>
			</Card.Content>
		{:else if activeMenuPanel === 'draw' || activeMenuPanel === 'eraser'}
				<Card.Header class="pb-3">
					<Card.Title class="flex items-center gap-2 text-sm">
						<PaletteIcon />
						Draw Options
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Brush Size -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Brush Size</Label>
						<div class="flex gap-2">
							<Button
								variant={brushSizeValue === 2 ? 'default' : 'outline'}
								size="sm"
								onclick={() => (brushSizeValue = 2)}
								class="flex h-10 w-10 items-center justify-center"
							>
								<MinusIcon class="h-3 w-3" strokeWidth={1} />
							</Button>
							<Button
								variant={brushSizeValue === 6 ? 'default' : 'outline'}
								size="sm"
								onclick={() => (brushSizeValue = 6)}
								class="flex h-10 w-10 items-center justify-center"
							>
								<MinusIcon strokeWidth={4} />
							</Button>
							<Button
								variant={brushSizeValue === 12 ? 'default' : 'outline'}
								size="sm"
								onclick={() => (brushSizeValue = 12)}
								class="flex h-10 w-10 items-center justify-center"
							>
								<MinusIcon class="h-5 w-5" strokeWidth={7} />
							</Button>
						</div>
					</div>

					<Separator />

					<!-- Brush Colour -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Brush Colour</Label>
						<div class="mb-2 flex flex-wrap items-center gap-1">
							{#each commonColours as colour}
								<button
									class="h-10 w-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {drawOptions.brushColour ===
									colour
										? 'border-primary ring-primary/20 ring-2'
										: 'border-border hover:border-primary/50'}"
									onclick={() => (drawOptions.brushColour = colour)}
									aria-label="Select brush colour {colour}"
								>
									<div class="h-full w-full rounded-sm" style="background-color: {colour}"></div>
								</button>
							{/each}

							<!-- Separator line -->
							<div class="bg-border mx-1 h-8 w-px"></div>

							<!-- Expanded colours toggle button -->
							<button
								class="h-10 w-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {showExpandedColours &&
								expandedColoursFor === 'brush'
									? 'border-primary ring-primary/20 ring-2'
									: 'border-border hover:border-primary/50'}"
								onclick={() => {
									if (showExpandedColours && expandedColoursFor === 'brush') {
										showExpandedColours = false;
										expandedColoursFor = null;
									} else {
										showExpandedColours = true;
										expandedColoursFor = 'brush';
									}
								}}
								aria-label="Toggle expanded colour palette"
							>
								<div
									class="h-full w-full rounded-sm"
									style="background-color: {drawOptions.brushColour}"
								></div>
							</button>
						</div>
					</div>

					<Separator />

					<!-- Opacity -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Opacity</Label>
						<div class="flex items-center gap-3">
							<Slider
								type="single"
								bind:value={drawOpacityValue}
								min={0.1}
								max={1}
								step={0.1}
								class="flex-1"
							/>
							<span class="text-muted-foreground w-12 text-right text-xs"
								>{Math.round(drawOpacityValue * 100)}%</span
							>
						</div>
					</div>
				

				<Separator />

				<!-- Layering Controls -->
				<WhiteboardLayeringControls
					{onBringToFront}
					{onSendToBack}
					{onMoveForward}
					{onMoveBackward}
				/>
			</Card.Content>
		{:else if activeMenuPanel === 'line' || activeMenuPanel === 'arrow'}
				<Card.Header class="pb-3">
					<Card.Title class="flex items-center gap-2 text-sm">
						{#if activeMenuPanel === 'line'}
							<MinusIcon />
							Line Options
						{:else}
							<!-- Using arrow right icon for arrow tool -->
							<svg
								width="24"
								height="24"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 8l4 4m0 0l-4 4m4-4H3"
								></path>
							</svg>
							Arrow Options
						{/if}
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Stroke Width -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Stroke Width</Label>
						<div class="flex gap-2">
							<Button
								variant={lineArrowStrokeWidthValue === 1 ? 'default' : 'outline'}
								size="sm"
								onclick={() => (lineArrowStrokeWidthValue = 1)}
								class="flex h-10 w-10 items-center justify-center"
							>
								<MinusIcon class="h-3 w-3" strokeWidth={1} />
							</Button>
							<Button
								variant={lineArrowStrokeWidthValue === 3 ? 'default' : 'outline'}
								size="sm"
								onclick={() => (lineArrowStrokeWidthValue = 3)}
								class="flex h-10 w-10 items-center justify-center"
							>
								<MinusIcon strokeWidth={3} />
							</Button>
							<Button
								variant={lineArrowStrokeWidthValue === 6 ? 'default' : 'outline'}
								size="sm"
								onclick={() => (lineArrowStrokeWidthValue = 6)}
								class="flex h-10 w-10 items-center justify-center"
							>
								<MinusIcon class="h-5 w-5" strokeWidth={6} />
							</Button>
						</div>
					</div>

					<Separator />

					<!-- Stroke Colour -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Colour</Label>
						<div class="mb-2 flex flex-wrap items-center gap-1">
							{#each commonColours as colour}
								<button
									class="h-10 w-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {lineArrowOptions.strokeColour ===
									colour
										? 'border-primary ring-primary/20 ring-2'
										: 'border-border hover:border-primary/50'}"
									onclick={() => (lineArrowOptions.strokeColour = colour)}
									aria-label="Select colour {colour}"
								>
									<div class="h-full w-full rounded-sm" style="background-color: {colour}"></div>
								</button>
							{/each}

							<!-- Separator line -->
							<div class="bg-border mx-1 h-8 w-px"></div>

							<!-- Expanded colours toggle button -->
							<button
								class="h-10 w-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {showExpandedColours &&
								expandedColoursFor === 'line'
									? 'border-primary ring-primary/20 ring-2'
									: 'border-border hover:border-primary/50'}"
								onclick={() => {
									if (showExpandedColours && expandedColoursFor === 'line') {
										showExpandedColours = false;
										expandedColoursFor = null;
									} else {
										showExpandedColours = true;
										expandedColoursFor = 'line';
									}
								}}
								aria-label="Toggle expanded colour palette"
							>
								<div
									class="h-full w-full rounded-sm"
									style="background-color: {lineArrowOptions.strokeColour}"
								></div>
							</button>
						</div>
					</div>

					<Separator />

					<!-- Line Style -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Line Style</Label>
						<div class="flex gap-2">
							<Button
								variant={lineArrowOptions.strokeDashArray.length === 0 ? 'default' : 'outline'}
								size="sm"
								onclick={() => (lineArrowOptions.strokeDashArray = [])}
								class="h-8 flex-1"
							>
								Solid
							</Button>
							<Button
								variant={lineArrowOptions.strokeDashArray.length > 0 ? 'default' : 'outline'}
								size="sm"
								onclick={() => (lineArrowOptions.strokeDashArray = [5, 5])}
								class="h-8 flex-1"
							>
								Dashed
							</Button>
						</div>
					</div>

					<Separator />

					<!-- Opacity -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Opacity</Label>
						<div class="flex items-center gap-3">
							<Slider
								type="single"
								bind:value={lineArrowOpacityValue}
								min={0.1}
								max={1}
								step={0.1}
								class="flex-1"
							/>
							<span class="text-muted-foreground w-12 text-right text-xs"
								>{Math.round(lineArrowOpacityValue * 100)}%</span
							>
						</div>
					</div>
				

				<Separator />

				<!-- Layering Controls -->
				<WhiteboardLayeringControls
					{onBringToFront}
					{onSendToBack}
					{onMoveForward}
					{onMoveBackward}
				/>
			</Card.Content>
		{:else if activeMenuPanel === 'image'}
				<Card.Header class="pb-3">
					<Card.Title class="flex items-center gap-2 text-sm">
						<SlidersIcon />
						Image Options
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Opacity -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Opacity</Label>
						<div class="flex items-center gap-3">
							<Slider
								type="single"
								bind:value={shapeOpacityValue}
								min={0.1}
								max={1}
								step={0.1}
								class="flex-1"
							/>
							<span class="text-muted-foreground w-12 text-right text-xs"
								>{Math.round(shapeOpacityValue * 100)}%</span
							>
						</div>
					</div>

					<Separator />

					<!-- Layering Controls -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Layering</Label>
						<div class="grid grid-cols-2 gap-2">
							<Button
								variant="outline"
								size="sm"
								onclick={onBringToFront}
								class="flex items-center justify-center gap-2"
								disabled={!onBringToFront}
							>
								<ArrowUpToLineIcon class="h-4 w-4" />
								<span>To Front</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={onSendToBack}
								class="flex items-center justify-center gap-2"
								disabled={!onSendToBack}
							>
								<ArrowDownToLineIcon class="h-4 w-4" />
								<span>To Back</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={onMoveForward}
								class="flex items-center justify-center gap-2"
								disabled={!onMoveForward}
							>
								<ArrowUpIcon class="h-4 w-4" />
								<span>Forward</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={onMoveBackward}
								class="flex items-center justify-center gap-2"
								disabled={!onMoveBackward}
							>
								<ArrowDownIcon class="h-4 w-4" />
								<span>Backward</span>
							</Button>
						</div>
					</div>
				</Card.Content>
			{:else if activeMenuPanel === 'select'}
				<Card.Header class="pb-3">
					<Card.Title class="flex items-center gap-2 text-sm">
						<LayersIcon />
						Object Options
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Layering Controls -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Layering</Label>
						<div class="grid grid-cols-2 gap-2">
							<Button
								variant="outline"
								size="sm"
								onclick={onBringToFront}
								class="flex items-center justify-center gap-2"
								disabled={!onBringToFront}
							>
								<ArrowUpToLineIcon class="h-4 w-4" />
								<span>To Front</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={onSendToBack}
								class="flex items-center justify-center gap-2"
								disabled={!onSendToBack}
							>
								<ArrowDownToLineIcon class="h-4 w-4" />
								<span>To Back</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={onMoveForward}
								class="flex items-center justify-center gap-2"
								disabled={!onMoveForward}
							>
								<ArrowUpIcon class="h-4 w-4" />
								<span>Forward</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={onMoveBackward}
								class="flex items-center justify-center gap-2"
								disabled={!onMoveBackward}
							>
								<ArrowDownIcon class="h-4 w-4" />
								<span>Backward</span>
							</Button>
						</div>
					</div>
				</Card.Content>
			{/if}
		</Card.Root>

		<!-- Side Panel for Expanded Colours -->
		{#if showExpandedColours}
			<Card.Root class="bg-background/20 border-border/50 w-64 backdrop-blur-sm">
				<Card.Header class="pb-3">
					<Card.Title class="flex items-center gap-2 text-sm">
						<PaletteIcon />
						Colour Palette
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Colour Grid -->
					<div class="space-y-2">
						<Label class="text-xs font-medium">Colours</Label>
						<div class="space-y-1">
							{#each colourPalette as row}
								<div class="flex gap-1">
									{#each row as colour}
										<button
											class="h-10 w-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {selectedColourFamily ===
											colour
												? 'border-primary ring-primary/20 ring-2'
												: 'border-border hover:border-primary/50'}"
											onclick={() => {
												selectedColourFamily = colour as ColourFamily;
												// Apply colour based on which tool opened the panel
												if (expandedColoursFor === 'text') {
													textOptions.colour = colour;
												} else if (expandedColoursFor === 'stroke') {
													shapeOptions.strokeColour = colour;
												} else if (expandedColoursFor === 'fill') {
													shapeOptions.fillColour = colour;
												} else if (expandedColoursFor === 'brush') {
													drawOptions.brushColour = colour;
												} else if (expandedColoursFor === 'line') {
													lineArrowOptions.strokeColour = colour;
												}
											}}
											aria-label="Select colour family {colour}"
										>
											<div
												class="h-full w-full rounded-sm"
												style="background-color: {colour}"
											></div>
										</button>
									{/each}
								</div>
							{/each}
						</div>
					</div>

					<!-- Shades -->
					<div class="space-y-2">
						<Label class="text-muted-foreground text-xs font-medium">Shades</Label>
						{#if colourShades[selectedColourFamily].length === 0}
							<div class="text-muted-foreground py-2 text-xs italic">
								No shades available for this colour
							</div>
						{:else}
							<div class="flex gap-1">
								{#each colourShades[selectedColourFamily] as shade}
									<button
										class="h-10 w-10 rounded-md border-2 p-0.5 transition-colors hover:scale-105 {(expandedColoursFor ===
											'text' &&
											textOptions.colour === shade) ||
										(expandedColoursFor === 'stroke' && shapeOptions.strokeColour === shade) ||
										(expandedColoursFor === 'fill' && shapeOptions.fillColour === shade) ||
										(expandedColoursFor === 'brush' && drawOptions.brushColour === shade) ||
										(expandedColoursFor === 'line' && lineArrowOptions.strokeColour === shade)
											? 'border-primary ring-primary/20 ring-2'
											: 'border-border hover:border-primary/50'}"
										onclick={() => {
											// Apply shade based on which tool opened the panel
											if (expandedColoursFor === 'text') {
												textOptions.colour = shade;
											} else if (expandedColoursFor === 'stroke') {
												shapeOptions.strokeColour = shade;
											} else if (expandedColoursFor === 'fill') {
												shapeOptions.fillColour = shade;
											} else if (expandedColoursFor === 'brush') {
												drawOptions.brushColour = shade;
											} else if (expandedColoursFor === 'line') {
												lineArrowOptions.strokeColour = shade;
											}
										}}
										aria-label="Select shade {shade}"
									>
										<div class="h-full w-full rounded-sm" style="background-color: {shade}"></div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
{/if}
