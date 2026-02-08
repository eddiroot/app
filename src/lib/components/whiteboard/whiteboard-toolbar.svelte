<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import EraseIcon from '@lucide/svelte/icons/eraser';
	import HandIcon from '@lucide/svelte/icons/hand';
	import ImageIcon from '@lucide/svelte/icons/image';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import MousePointerIcon from '@lucide/svelte/icons/mouse-pointer';
	import PenToolIcon from '@lucide/svelte/icons/pen-tool';
	import SquareIcon from '@lucide/svelte/icons/square';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import TriangleIcon from '@lucide/svelte/icons/triangle';
	import TypeIcon from '@lucide/svelte/icons/type';

	interface Props {
		selectedTool: string;
		currentShapeType?: string;
		onSelectTool: () => void;
		onPanTool: () => void;
		onDrawTool: () => void;
		onLineTool: () => void;
		onAddShape: (shapeType: string) => void;
		onAddText: () => void;
		onAddImage: () => void;
		onEraserTool: () => void;
		onClearCanvas: () => void;
	}

	let {
		selectedTool,
		currentShapeType = '',
		onSelectTool,
		onPanTool,
		onDrawTool,
		onLineTool,
		onAddShape,
		onAddText,
		onAddImage,
		onEraserTool,
		onClearCanvas,
	}: Props = $props();
</script>

<div class="absolute top-8 left-1/2 z-10 -translate-x-1/2 transform">
	<div
		class="bg-background/20 border-border/50 rounded-md border shadow-sm backdrop-blur-sm"
	>
		<div class="flex items-center gap-1 px-4 py-2">
			<!-- Selection Tool -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant={selectedTool === 'select' ? 'default' : 'ghost'}
						size="icon"
						onclick={onSelectTool}
						class="h-9 w-9"
					>
						<MousePointerIcon />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>Select</Tooltip.Content>
			</Tooltip.Root>

			<!-- Pan Tool -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant={selectedTool === 'pan' ? 'default' : 'ghost'}
						size="icon"
						onclick={onPanTool}
						class="h-9 w-9"
					>
						<HandIcon />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>Pan</Tooltip.Content>
			</Tooltip.Root>

			<div class="bg-border mx-1 h-6 w-px"></div>

			<!-- Draw Tool -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant={selectedTool === 'draw' ? 'default' : 'ghost'}
						size="icon"
						onclick={onDrawTool}
						class="h-9 w-9"
					>
						<PenToolIcon />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>Draw</Tooltip.Content>
			</Tooltip.Root>

			<!-- Line Tool -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant={selectedTool === 'line' ? 'default' : 'ghost'}
						size="icon"
						onclick={onLineTool}
						class="h-9 w-9"
					>
						<MinusIcon />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>Draw Line</Tooltip.Content>
			</Tooltip.Root>

			<!-- Rectangle Tool -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant={selectedTool === 'shapes' &&
						currentShapeType === 'rectangle'
							? 'default'
							: 'ghost'}
						size="icon"
						onclick={() => onAddShape('rectangle')}
						class="h-9 w-9"
					>
						<SquareIcon />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>Rectangle</Tooltip.Content>
			</Tooltip.Root>

			<!-- Circle Tool -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant={selectedTool === 'shapes' && currentShapeType === 'circle'
							? 'default'
							: 'ghost'}
						size="icon"
						onclick={() => onAddShape('circle')}
						class="h-9 w-9"
					>
						<CircleIcon />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>Circle</Tooltip.Content>
			</Tooltip.Root>

			<!-- Triangle Tool -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant={selectedTool === 'shapes' &&
						currentShapeType === 'triangle'
							? 'default'
							: 'ghost'}
						size="icon"
						onclick={() => onAddShape('triangle')}
						class="h-9 w-9"
					>
						<TriangleIcon />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>Triangle</Tooltip.Content>
			</Tooltip.Root>

			<!-- Text Tool -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant={selectedTool === 'text' ? 'default' : 'ghost'}
						size="icon"
						onclick={onAddText}
						class="h-9 w-9"
					>
						<TypeIcon />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>Add Text</Tooltip.Content>
			</Tooltip.Root>

			<!-- Image Tool -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant={selectedTool === 'image' ? 'default' : 'ghost'}
						size="icon"
						onclick={onAddImage}
						class="h-9 w-9"
					>
						<ImageIcon />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>Upload Image</Tooltip.Content>
			</Tooltip.Root>
			<div class="bg-border mx-1 h-6 w-px"></div>

			<!-- Eraser Tool -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant={selectedTool === 'eraser' ? 'default' : 'ghost'}
						size="icon"
						onclick={onEraserTool}
						class="h-9 w-9"
					>
						<EraseIcon />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>Eraser</Tooltip.Content>
			</Tooltip.Root>

			<!-- Clear Canvas -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button
						variant="ghost"
						size="icon"
						onclick={onClearCanvas}
						class="h-9 w-9"
					>
						<TrashIcon />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>Clear All</Tooltip.Content>
			</Tooltip.Root>
		</div>
	</div>
</div>
