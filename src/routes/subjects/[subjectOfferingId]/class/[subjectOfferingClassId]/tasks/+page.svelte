<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Select from '$lib/components/ui/select';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import FileIcon from '@lucide/svelte/icons/file';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	let { data } = $props();
	let topicsWithTasks = $derived(data.topicsWithTasks || []);
	let showUploadDialog = $state(false);

	let showDeleteDialog = $state(false);
	let resourcePendingDelete = $state<{ id: number; title: string } | null>(
		null,
	);
	let deletingResource = $state(false);

	const uploadSchema = z.object({
		file: z
			.instanceof(File)
			.refine((file) => file.size > 0, 'Please select a file to upload'),
		title: z.string().optional(),
		description: z.string().optional(),
		topicId: z.number().min(1, 'Please select a topic'),
	});

	let dataForm = () => data.form;
	const form = superForm(dataForm(), {
		validators: zod4(uploadSchema),
		onUpdated: async ({ form }) => {
			if (form.valid) {
				// Successful submit: close dialog and clear local state so next open is empty
				showUploadDialog = false;
				selectedFile = null;
				selectedTopic = undefined;
				if (fileInput) fileInput.value = '';
				$formData.file = undefined as unknown as File; // clear file reference
				$formData.title = '' as any;
				$formData.description = '' as any;
				$formData.topicId = undefined as any;
				await invalidateAll();
			}
		},
	});

	const { form: formData, enhance, submitting } = form;

	let fileInput: HTMLInputElement;
	let selectedFile = $state<File | null>(null);
	let selectedTopic = $state<string | undefined>(undefined);

	// When switching to other subject task pages, we need to update the state
	$effect(() => {
		topicsWithTasks = data.topicsWithTasks || [];
	});

	// Update formData when topic is selected
	$effect(() => {
		if (selectedTopic) {
			$formData.topicId = parseInt(selectedTopic);
		}
	});

	function handleFileSelect() {
		const files = fileInput?.files;
		if (files && files.length > 0) {
			selectedFile = files[0];
			$formData.file = selectedFile;
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	// Open confirmation dialog
	function requestDelete(resourceId: number, title: string) {
		resourcePendingDelete = { id: resourceId, title };
		showDeleteDialog = true;
	}

	// Confirm deletion
	async function confirmDelete() {
		if (!resourcePendingDelete || deletingResource) return;
		deletingResource = true;
		try {
			const formData = new FormData();
			formData.append('resourceId', resourcePendingDelete.id.toString());
			const response = await fetch('?/delete', {
				method: 'POST',
				body: formData,
			});
			if (response.ok) {
				toast.success('Resource deleted');
				showDeleteDialog = false;
				resourcePendingDelete = null;
				await invalidateAll();
			} else {
				const result = await response.json().catch(() => ({}));
				toast.error(result.message || 'Failed to delete resource');
			}
		} catch (e) {
			console.error('Error deleting resource:', e);
			toast.error('Failed to delete resource');
		} finally {
			deletingResource = false;
		}
	}

	function openUploadDialog() {
		// Reset all fields before opening
		selectedFile = null;
		selectedTopic = undefined;
		if (fileInput) fileInput.value = '';
		$formData.file = undefined as unknown as File;
		$formData.title = '' as any;
		$formData.description = '' as any;
		$formData.topicId = undefined as any;
		showUploadDialog = true;
	}
</script>

<div class="space-y-6 p-8">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Tasks</h1>
		{#if data?.user?.type !== 'student'}
			<div class="flex items-center gap-2">
				<Button onclick={openUploadDialog} variant="outline">
					<UploadIcon />
					Upload Resource
				</Button>
				<Button href={`${page.url.pathname}/new`}>
					<PlusIcon />
					New Task
				</Button>
			</div>
		{/if}
	</div>

	<div class="space-y-8">
		{#each topicsWithTasks as { topic, tasks, resources }}
			<div>
				<div class="flex items-center gap-2">
					<h2 class="text-foreground text-xl font-semibold">{topic.name}</h2>
				</div>

				<div
					class="mt-4 grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-8"
				>
					{#if tasks.length === 0 && resources.length === 0}
						<div class="text-muted-foreground col-span-full text-sm">
							No tasks or resources available for this topic.
						</div>
					{/if}

					<!-- Tasks -->
					{#each tasks as task}
						<a
							href={`${page.url.pathname}/${task.task.id}`}
							class="block h-full"
						>
							<Card.Root class="h-full transition-shadow hover:shadow-md">
								<Card.Header>
									<Card.Title>
										{task.task.title}
									</Card.Title>
								</Card.Header>
								<Card.Content class="h-12 w-72 truncate break-all">
									{#if task.task.description}
										<span
											class="text-muted-foreground h-12 truncate text-sm text-wrap"
										>
											{task.task.description}
										</span>
									{/if}
								</Card.Content>
								<Card.Footer>
									<span class="text-muted-foreground text-sm">
										<div>Status: {task.status}</div>
									</span>
								</Card.Footer>
							</Card.Root>
						</a>
					{/each}

					<!-- Resources -->
					{#each resources as resource}
						<Card.Root class="w-full">
							<Card.Header>
								<a target="_blank" href={resource.downloadUrl}>
									<Card.Title
										class="w-48 truncate py-0.5 break-all hover:underline"
									>
										{resource.resourceRelation.title &&
										resource.resourceRelation.title.trim() !== ''
											? resource.resourceRelation.title
											: resource.resource.fileName}
									</Card.Title>
								</a>
							</Card.Header>
							{#if resource.resourceRelation.description}
								<Card.Content class="h-12 w-72 truncate break-all">
									{#if resource.resourceRelation.description}
										<span
											class="text-muted-foreground h-12 truncate text-sm text-wrap"
										>
											{resource.resourceRelation.description}
										</span>
									{/if}
								</Card.Content>
							{/if}
							<Card.Footer class="flex items-center justify-between">
								<span class="text-muted-foreground text-sm">
									{formatFileSize(resource.resource.fileSize)}
								</span>
								<Card.Action class="space-x-1">
									{#if resource.downloadUrl}
										<Button
											variant="outline"
											target="_blank"
											href={resource.downloadUrl}
										>
											<DownloadIcon />
										</Button>
									{/if}
									<Button
										variant="destructive"
										onclick={() =>
											requestDelete(
												resource.resource.id,
												resource.resourceRelation.title &&
													resource.resourceRelation.title.trim() !== ''
													? resource.resourceRelation.title
													: resource.resource.fileName,
											)}
									>
										<TrashIcon />
									</Button>
								</Card.Action>
							</Card.Footer>
						</Card.Root>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Upload Resource Dialog -->
	<Dialog.Root bind:open={showUploadDialog}>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Upload Resource</Dialog.Title>
				<Dialog.Description>
					Upload a file to share with your class. Select a topic to organise the
					resource.
				</Dialog.Description>
			</Dialog.Header>
			<form
				method="post"
				action="?/upload"
				use:enhance
				enctype="multipart/form-data"
				class="space-y-4"
			>
				<div class="space-y-2">
					<label for="file-input" class="text-sm font-medium">Select File</label
					>
					<button
						type="button"
						class="border-muted-foreground/25 hover:border-muted-foreground/50 w-full cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors"
						onclick={() => fileInput?.click()}
					>
						{#if selectedFile}
							<div class="space-y-1">
								<FileIcon class="text-muted-foreground mx-auto h-8 w-8" />
								<div class="text-sm font-medium">{selectedFile.name}</div>
								<div class="text-muted-foreground text-xs">
									{formatFileSize(selectedFile.size)}
								</div>
							</div>
						{:else}
							<div class="space-y-1">
								<UploadIcon class="text-muted-foreground mx-auto h-8 w-8" />
								<div class="text-muted-foreground text-sm">
									Click to select a file
								</div>
							</div>
						{/if}
					</button>
					<input
						bind:this={fileInput}
						id="file-input"
						type="file"
						name="file"
						class="hidden"
						onchange={handleFileSelect}
						required
					/>
				</div>
				<div class="space-y-2">
					<label for="topic-select" class="text-sm font-medium">Topic</label>
					<Select.Root
						type="single"
						value={selectedTopic}
						onValueChange={(value: string | undefined) => {
							selectedTopic = value;
							if (value) {
								$formData.topicId = parseInt(value);
							}
						}}
					>
						<Select.Trigger class="w-full">
							{#if selectedTopic}
								{data.topics?.find((t) => t.id === parseInt(selectedTopic!))
									?.name || 'Select a topic'}
							{:else}
								Select a topic
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each data.topics || [] as topic}
								<Select.Item value={topic.id.toString()} label={topic.name}>
									{topic.name}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<input type="hidden" name="topicId" value={$formData.topicId} />
				</div>

				<div class="space-y-2">
					<label for="title" class="text-sm font-medium">Title (optional)</label
					>
					<Input
						id="title"
						name="title"
						placeholder="Resource title"
						bind:value={$formData.title}
					/>
				</div>
				<div class="space-y-2">
					<label for="description" class="text-sm font-medium"
						>Description (optional)</label
					>
					<Textarea
						id="description"
						name="description"
						placeholder="Resource description"
						class="h-36 max-h-56 break-all"
						bind:value={$formData.description}
					/>
				</div>

				<div class="flex justify-end space-x-2">
					<Button
						type="button"
						variant="outline"
						onclick={() => (showUploadDialog = false)}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={$submitting || !selectedFile || !selectedTopic}
					>
						{#if $submitting}
							Uploading...
						{:else}
							Upload Resource
						{/if}
					</Button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Delete Confirmation Dialog -->
	<Dialog.Root bind:open={showDeleteDialog}>
		<Dialog.Content class="sm:max-w-[420px]">
			<Dialog.Header>
				<Dialog.Title>Delete resource</Dialog.Title>
				<Dialog.Description class="w-full truncate text-wrap wrap-break-word">
					{#if resourcePendingDelete}
						<span class="font-semibold break-all">
							"{resourcePendingDelete.title}"
						</span>
						will be permanently removed. This action cannot be undone.
					{:else}
						This action cannot be undone.
					{/if}
				</Dialog.Description>
			</Dialog.Header>
			<div class="flex justify-end gap-2 pt-2">
				<Button
					type="button"
					variant="outline"
					onclick={() => {
						showDeleteDialog = false;
						resourcePendingDelete = null;
					}}
					disabled={deletingResource}
				>
					Cancel
				</Button>
				<Button
					type="button"
					variant="destructive"
					onclick={confirmDelete}
					disabled={deletingResource}
				>
					{#if deletingResource}Deleting...{:else}Delete{/if}
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Root>
</div>
