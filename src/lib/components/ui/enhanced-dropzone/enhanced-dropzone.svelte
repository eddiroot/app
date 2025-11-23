<script lang="ts">
	import ResourceCard from '$lib/components/resource-card.svelte';
	import { cn } from '$lib/utils';
	import CloudUploadIcon from '@lucide/svelte/icons/cloud-upload';

	interface ExistingFile {
		id: number;
		name: string;
		fileName: string;
		size: number;
		resourceType: string;
	}

	let dragover = $state(false);
	let fileInput: HTMLInputElement;

	let {
		files = $bindable(),
		existingFiles = [],
		onRemoveExisting,
		accept = '',
		multiple = false,
		className = '',
		id = ''
	}: {
		files?: FileList | null;
		existingFiles?: ExistingFile[];
		onRemoveExisting?: (id: number, fileName: string) => void;
		accept?: string;
		multiple?: boolean;
		className?: string;
		id?: string;
	} = $props();

	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			addFiles(Array.from(target.files));
		}
	}

	function dropHandle(event: DragEvent) {
		event.preventDefault();
		dragover = false;
		if (event.dataTransfer?.files) {
			addFiles(Array.from(event.dataTransfer.files));
		}
	}

	function addFiles(newFiles: File[]) {
		if (!multiple) {
			// If not multiple, replace existing files
			const dt = new DataTransfer();
			if (newFiles.length > 0) {
				dt.items.add(newFiles[0]);
			}
			files = dt.files;
		} else {
			// If multiple, append to existing files
			const dt = new DataTransfer();

			// Add existing files
			if (files) {
				Array.from(files).forEach((file) => dt.items.add(file));
			}

			// Add new files
			newFiles.forEach((file) => dt.items.add(file));

			files = dt.files;
		}
	}

	function removeFile(index: number) {
		if (!files) return;

		const dt = new DataTransfer();
		Array.from(files).forEach((file, i) => {
			if (i !== index) {
				dt.items.add(file);
			}
		});
		files = dt.files;
	}

	function handleClick() {
		fileInput?.click();
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragover = true;
	}

	function handleDragLeave() {
		dragover = false;
	}

	// Map File to ResourceInfo for the ResourceCard
	function mapFileToResourceInfo(
		file: File,
		index?: number
	): {
		id?: number;
		name: string;
		fileName: string;
		fileSize: number;
		resourceType: string;
	} {
		const type = getResourceTypeFromMimeType(file.type);
		return {
			id: index, // Use index as temporary id for new files
			name: file.name,
			fileName: file.name,
			fileSize: file.size,
			resourceType: type
		};
	}

	// Map ExistingFile to ResourceInfo for the ResourceCard
	function mapExistingFileToResourceInfo(file: ExistingFile): {
		id?: number;
		name: string;
		fileName: string;
		fileSize: number;
		resourceType: string;
	} {
		return {
			id: file.id,
			name: file.name,
			fileName: file.fileName,
			fileSize: file.size,
			resourceType: file.resourceType
		};
	}

	function getResourceTypeFromMimeType(mimeType: string): string {
		if (mimeType.startsWith('image/')) return 'image';
		if (mimeType.startsWith('video/')) return 'video';
		if (mimeType.startsWith('audio/')) return 'audio';
		if (mimeType === 'application/pdf') return 'pdf';
		if (mimeType.includes('document')) return 'document';
		return 'document';
	}

	// Calculate total file count
	const totalFiles = $derived((existingFiles?.length || 0) + (files?.length || 0));
</script>

<div class="space-y-4">
	<!-- Drop Zone -->
	<div
		{id}
		class={cn(
			'hover:bg-muted hover:border-muted-foreground flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
			className
		)}
		role="button"
		tabindex="0"
		ondrop={dropHandle}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		onclick={handleClick}
		onkeydown={(e) => e.key === 'Enter' && handleClick()}
	>
		<div class="flex flex-col items-center justify-center pt-5 pb-6">
			<CloudUploadIcon class="text-muted-foreground mb-2 size-10" />

			<p class="text-muted-foreground mb-2 text-sm">
				<span class="font-semibold">Click to upload</span>
				or drag and drop
			</p>
			<p class="text-muted-foreground text-xs">
				{#if accept}
					Allowed file types:
				{/if}
				{accept
					? `${accept.replace(/\./g, '').replace(/,/g, ', ').toUpperCase()}`
					: 'PNG, JPG, JPEG or PDF'} (max. 10MB each)
			</p>
			{#if totalFiles > 0}
				<p class="text-primary mt-2 text-xs">
					{totalFiles} file{totalFiles !== 1 ? 's' : ''} selected
				</p>
			{/if}
		</div>

		<!-- Hidden File Input -->
		<input
			bind:this={fileInput}
			type="file"
			{accept}
			{multiple}
			onchange={handleChange}
			class="hidden"
		/>
	</div>

	<!-- Selected Files List -->
	{#if totalFiles > 0}
		<div class="-mt-2 space-y-1">
			<p class="text-muted-foreground text-xs font-medium">
				Selected Files ({totalFiles})
			</p>
			<div class="max-h-48 space-y-2 overflow-y-auto">
				<!-- Existing Files -->
				{#each existingFiles || [] as file}
					<ResourceCard
						resource={mapExistingFileToResourceInfo(file)}
						variant="existing"
						onRemove={() => onRemoveExisting?.(file.id, file.fileName)}
						showRemoveButton={true}
						className=""
					/>
				{/each}

				<!-- New Files -->
				{#each Array.from(files || []) as file, index}
					<ResourceCard
						resource={mapFileToResourceInfo(file, index)}
						variant="new"
						onRemove={() => removeFile(index)}
						onOpen={() => {
							// For new files, create a temporary URL to preview
							const url = URL.createObjectURL(file);
							window.open(url, '_blank');
							// Clean up the URL after a delay to prevent memory leaks
							setTimeout(() => URL.revokeObjectURL(url), 1000);
						}}
						showRemoveButton={true}
						className=""
					/>
				{/each}
			</div>
		</div>
	{/if}
</div>
