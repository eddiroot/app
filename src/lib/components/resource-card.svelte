<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import FileIcon from '@lucide/svelte/icons/file';
	import FileAudioIcon from '@lucide/svelte/icons/file-audio';
	import FileImageIcon from '@lucide/svelte/icons/file-image';
	import FileVideoIcon from '@lucide/svelte/icons/file-play';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import LinkIcon from '@lucide/svelte/icons/link';
	import StickyNoteIcon from '@lucide/svelte/icons/sticky-note';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	interface ResourceInfo {
		id?: number;
		name?: string; // Made optional since Resource type doesn't have this
		fileName: string;
		fileSize: number;
		fileType: string;
	}

	let {
		resource,
		variant = 'default',
		onRemove,
		onOpen,
		showRemoveButton = true,
		className = '',
	}: {
		resource: ResourceInfo;
		variant?: 'default' | 'new' | 'existing';
		onRemove?: (id?: number) => void;
		onOpen?: (() => void) | undefined;
		showRemoveButton?: boolean;
		className?: string;
	} = $props();

	function getResourceIcon(fileType: string) {
		switch (fileType) {
			case 'photo':
			case 'image':
				return FileImageIcon;
			case 'video':
				return FileVideoIcon;
			case 'audio':
				return FileAudioIcon;
			case 'document':
			case 'pdf':
				return FileTextIcon;
			case 'link':
				return LinkIcon;
			case 'note':
				return StickyNoteIcon;
			default:
				return FileIcon;
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function getResourceTypeColor(fileType: string): string {
		switch (fileType) {
			case 'photo':
			case 'image':
				return 'bg-purple-100 text-purple-800';
			case 'video':
				return 'bg-red-100 text-red-800';
			case 'audio':
				return 'bg-green-100 text-green-800';
			case 'document':
			case 'pdf':
				return 'bg-blue-100 text-blue-800';
			case 'link':
				return 'bg-cyan-100 text-cyan-800';
			case 'note':
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	let fileType = () => resource.fileType;
	const IconComponent = getResourceIcon(fileType());

	// Handle opening resource
	async function handleOpen() {
		if (onOpen) {
			onOpen();
		} else {
			// Default behavior: open resource for viewing in new tab (no download)
			try {
				const response = await fetch(
					`/api/resources?resourceId=${resource.id}&action=download`,
				);
				const result = await response.json();

				if (result.downloadUrl) {
					// Open resource in new tab/window for viewing
					window.open(result.downloadUrl, '_blank');
				} else {
					alert('Failed to generate resource view link');
				}
			} catch (error) {
				console.error('Error opening resource:', error);
				alert('Failed to open resource');
			}
		}
	}

	// Variant-specific styling
	const variantClasses = { default: '', existing: '', new: '' };

	const iconClasses = {
		default: 'text-muted-foreground',
		existing: 'text-muted-foreground',
		new: 'text-blue-500',
	};
</script>

<button
	class="hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors {variantClasses[
		variant
	]} {className}"
	onclick={handleOpen}
	type="button"
>
	<!-- Resource Icon -->
	<div class="shrink-0">
		<div class="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
			<IconComponent class="h-5 w-5 {iconClasses[variant]}" />
		</div>
	</div>

	<!-- Resource Info -->
	<div class="min-w-0 flex-1">
		<div class="mb-1 flex items-center gap-2">
			<h4 class="truncate text-sm font-medium">
				{resource.fileName}
			</h4>
		</div>
		<div class="text-muted-foreground flex items-center gap-3 text-xs">
			<span>{formatFileSize(resource.fileSize)}</span>
		</div>
	</div>

	<!-- Remove Button -->
	{#if showRemoveButton && onRemove}
		<div class="shrink-0">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="text-muted-foreground h-8 w-8 p-0 transition-colors hover:bg-red-500/20 hover:text-red-600"
				onclick={(e) => {
					e.stopPropagation(); // Prevent triggering the card click
					onRemove?.(resource.id);
				}}
				title="Remove resource"
				aria-label="Remove resource"
			>
				<Trash2Icon class="h-4 w-4" />
			</Button>
		</div>
	{/if}
</button>
