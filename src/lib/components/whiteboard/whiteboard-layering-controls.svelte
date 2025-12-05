<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowDownToLineIcon from '@lucide/svelte/icons/arrow-down-to-line';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowUpToLineIcon from '@lucide/svelte/icons/arrow-up-to-line';

	interface Props {
		onBringToFront?: () => void;
		onSendToBack?: () => void;
		onMoveForward?: () => void;
		onMoveBackward?: () => void;
	}

	let { onBringToFront, onSendToBack, onMoveForward, onMoveBackward }: Props = $props();
</script>

<!-- Layering Controls -->
<div class="space-y-2">
	<Label class="text-xs font-medium">Layering</Label>
	<div class="flex gap-1">
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button
					variant="outline"
					size="icon"
					onclick={onBringToFront}
					class="h-8 w-8"
					disabled={!onBringToFront}
				>
					<ArrowUpToLineIcon />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<p>Bring to Front</p>
			</Tooltip.Content>
		</Tooltip.Root>

		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button
					variant="outline"
					size="icon"
					onclick={onMoveForward}
					class="h-8 w-8"
					disabled={!onMoveForward}
				>
					<ArrowUpIcon />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<p>Move Forward</p>
			</Tooltip.Content>
		</Tooltip.Root>

		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button
					variant="outline"
					size="icon"
					onclick={onMoveBackward}
					class="h-8 w-8"
					disabled={!onMoveBackward}
				>
					<ArrowDownIcon />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<p>Move Backward</p>
			</Tooltip.Content>
		</Tooltip.Root>

		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button
					variant="outline"
					size="icon"
					onclick={onSendToBack}
					class="h-8 w-8"
					disabled={!onSendToBack}
				>
					<ArrowDownToLineIcon />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<p>Send to Back</p>
			</Tooltip.Content>
		</Tooltip.Root>
	</div>
</div>
