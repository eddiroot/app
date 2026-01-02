<script lang="ts">
	let {
		courseMapItemId,
		onResourceAdded
	}: {
		courseMapItemId: number;
		onResourceAdded?: () => void;
	} = $props();

	let fileInput: HTMLInputElement;

	// Function to trigger file selection
	export function triggerUpload() {
		fileInput?.click();
	}

	// Function to infer resource type from file extension
	function inferResourceType(fileName: string): string {
		const extension = fileName.split('.').pop()?.toLowerCase();
		
		switch (extension) {
			case 'jpg':
			case 'jpeg':
			case 'png':
			case 'gif':
			case 'bmp':
			case 'webp':
			case 'svg':
				return 'image';
			case 'mp4':
			case 'mov':
			case 'avi':
			case 'mkv':
			case 'webm':
			case 'wmv':
				return 'video';
			case 'mp3':
			case 'wav':
			case 'ogg':
			case 'flac':
			case 'm4a':
				return 'audio';
			case 'pdf':
				return 'pdf';
			case 'doc':
			case 'docx':
			case 'txt':
			case 'rtf':
				return 'document';
			default:
				return 'file';
		}
	}

	// Function to extract name from filename (without extension)
	function extractName(fileName: string): string {
		return fileName.replace(/\.[^/.]+$/, '');
	}

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		
		if (!files || files.length === 0) return;

		const file = files[0];
		const formData = new FormData();
		
		// Auto-infer name and type
		formData.set('name', extractName(file.name));
		formData.set('resourceType', inferResourceType(file.name));
		formData.set('file', file);
		formData.set('courseMapItemId', courseMapItemId.toString());

		try {
			const response = await fetch('?/uploadResource', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();
			if (result.type === 'success') {
				onResourceAdded?.();
			} else {
				alert('Failed to upload resource');
			}
		} catch (error) {
			console.error('Error uploading resource:', error);
			alert('Failed to upload resource');
		}

		// Reset input
		target.value = '';
	}
</script>

<!-- Hidden file input -->
<input
	bind:this={fileInput}
	type="file"
	class="hidden"
	onchange={handleFileSelect}
	accept="*/*"
/>
