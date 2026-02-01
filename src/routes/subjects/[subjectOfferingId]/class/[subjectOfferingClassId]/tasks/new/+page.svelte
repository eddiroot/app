<script lang="ts">
	import { Dropzone } from '$lib/components/ui/dropzone/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Switch } from '$lib/components/ui/switch';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { formSchema } from './schema';

	let { data } = $props();
	let dataForm = () => data.form;

	const form = superForm(dataForm(), { validators: zod4(formSchema) });
	const { form: formData, enhance, constraints, submitting } = form;
</script>

<div class="min-h-screen w-full p-8">
	<div class="mx-auto max-w-3xl">
		{#if submitting && $formData.creationMethod === 'ai'}
			<div
				class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
			>
				<div
					class="bg-background mx-4 flex max-w-sm flex-col items-center space-y-4 rounded-lg p-8 shadow-xl"
				>
					<LoaderIcon class="text-primary h-12 w-12 animate-spin" />
					<div class="text-center">
						<h3 class="text-secondary text-lg font-semibold">
							Generating Task
						</h3>
						<p class="text-muted-foreground mt-1 text-sm">
							Please wait while we create your task...
						</p>
					</div>
				</div>
			</div>
		{/if}

		<form
			method="POST"
			action="?/createTask"
			class="max-w-3xl space-y-4"
			enctype="multipart/form-data"
			use:enhance
		>
			<!-- Header row: Title left, Task Type Tabs right -->
			<div class="mb-2 flex items-center justify-between">
				<h1 class="py-2 text-4xl font-bold">Create New Task</h1>
				<Tabs.Root bind:value={$formData.type} class="flex gap-2">
					<Tabs.List class="bg-muted flex gap-1 rounded-lg">
						<Tabs.Trigger
							value="lesson"
							class="px-4 py-2 text-sm font-medium capitalize"
							>Lesson</Tabs.Trigger
						>
						<Tabs.Trigger
							value="homework"
							class="px-4 py-2 text-sm font-medium capitalize"
							>Homework</Tabs.Trigger
						>
						<Tabs.Trigger
							value="test"
							class="px-4 py-2 text-sm font-medium capitalize"
							>Test</Tabs.Trigger
						>
						<Tabs.Trigger
							value="assignment"
							class="px-4 py-2 text-sm font-medium capitalize"
							>Assignment</Tabs.Trigger
						>
					</Tabs.List>
				</Tabs.Root>
			</div>

			<!-- Hidden form field to ensure type is included in form submission -->
			<input type="hidden" name="type" bind:value={$formData.type} />

			<Form.Field {form} name="title">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Title</Form.Label>
						<Input
							{...props}
							bind:value={$formData.title}
							placeholder="Enter the task title"
							{...$constraints.title}
						/>
					{/snippet}
				</Form.Control>
				<Form.Description
					>Provide a clear and descriptive title for your task.</Form.Description
				>
				<Form.FieldErrors />
			</Form.Field>

			<div class="grid grid-cols-6 gap-4 lg:grid-cols-12">
				<div class="col-span-6">
					<Form.Field {form} name="taskTopicId">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Topic</Form.Label>
								<Select.Root
									type="single"
									bind:value={$formData.taskTopicId}
									name={props.name}
								>
									<Select.Trigger {...props} class="w-full truncate">
										<span class="truncate">
											{data.taskTopics.find(
												(t) => t.id.toString() === $formData.taskTopicId,
											)?.name || 'Select a topic'}
										</span>
									</Select.Trigger>
									<Select.Content>
										{#if data.taskTopics.length === 0}
											<Select.Item
												value=""
												label="No topics available - please create one first"
												disabled
											/>
										{:else}
											{#each data.taskTopics as topic}
												<Select.Item
													value={topic.id.toString()}
													label={topic.name}
												/>
											{/each}
											<Select.Separator />
										{/if}
									</Select.Content>
								</Select.Root>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<!-- Week and Due Date fields remain the same -->
				<div class="col-span-3">
					<Form.Field {form} name="week">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Week (optional)</Form.Label>
								<Input {...props} type="number" bind:value={$formData.week} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<!-- Conditional Due Date field - only show for homework and assignment -->
				{#if $formData.type === 'homework' || $formData.type === 'assignment'}
					<div class="col-span-3">
						<Form.Field {form} name="dueDate">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Due Date (optional)</Form.Label>
									<Input
										{...props}
										type="date"
										bind:value={$formData.dueDate}
										{...$constraints.dueDate}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>
				{/if}
			</div>

			<Form.Field {form} name="aiTutorEnabled">
				<Form.Control>
					{#snippet children({ props })}
						<div class="flex items-center space-x-2">
							<Switch
								{...props}
								bind:checked={$formData.aiTutorEnabled}
								id="ai-tutor-toggle"
							/>
							<Form.Label for="ai-tutor-toggle">Enable Tutoring</Form.Label>
						</div>
					{/snippet}
				</Form.Control>
				<Form.Description>
					Allow students to access the eddi tutor while working on this task.
				</Form.Description>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="description">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Description (optional)</Form.Label>
						<Textarea
							{...props}
							bind:value={$formData.description}
							placeholder="Describe what students will learn in this task"
							rows={4}
						/>
					{/snippet}
				</Form.Control>
				<Form.Description
					>Briefly describe the task content (max 500 characters).</Form.Description
				>
				<Form.FieldErrors />
			</Form.Field>

			<div>
				<Tabs.Root
					bind:value={$formData.creationMethod}
					class="flex w-full gap-0"
				>
					<Tabs.List class="w-full rounded-b-none">
						<Tabs.Trigger value="ai">Generate with AI</Tabs.Trigger>
						<Tabs.Trigger value="manual">Create Manually</Tabs.Trigger>
					</Tabs.List>

					<Tabs.Content value="manual" class="bg-muted rounded-b-lg">
						<div class="flex h-[254px] w-full items-center justify-center p-2">
							<p class="text-muted-foreground text-sm font-medium">
								Switch to <span class="font-semibold">Generate with AI</span> to add
								supporting material.
							</p>
						</div>
					</Tabs.Content>
					<Tabs.Content value="ai" class="bg-muted rounded-b-lg p-2">
						<div class="w-full">
							<div class="p-1">
								<Label>Supporting Material (optional)</Label>
								<p class="text-muted-foreground mt-1 text-sm font-medium">
									Upload materials for AI to analyse and generate task content
									from.
								</p>
							</div>

							<Dropzone
								bind:files={$formData.files}
								accept=".png,.jpg,.jpeg,.pdf"
								multiple={true}
							/>
						</div>
					</Tabs.Content>
				</Tabs.Root>
			</div>
			<input
				type="hidden"
				name="creationMethod"
				bind:value={$formData.creationMethod}
			/>
			<input type="hidden" name="files" bind:value={$formData.files} />

			<div class="flex justify-end gap-2">
				<Form.Button
					type="submit"
					disabled={$submitting || !$formData.taskTopicId}
				>
					{#if $submitting && $formData.creationMethod === 'ai'}
						<LoaderIcon class="mr-2 h-4 w-4 animate-spin" />
						Generating...
					{:else}
						Create
					{/if}
				</Form.Button>
			</div>
		</form>
	</div>
</div>
