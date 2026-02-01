<script lang="ts">
	import { Dropzone } from '$lib/components/ui/dropzone/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import { filesProxy, superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { formSchema } from './schema';

	let { data } = $props();
	let dataForm = () => data.form;

	const form = superForm(dataForm(), { validators: zod4(formSchema) });
	const { form: formData, enhance, constraints, submitting } = form;

	const files = filesProxy(form, 'files');
</script>

<div class="min-h-screen w-full p-8">
	<form
		method="POST"
		action="?/createTask"
		class="max-w-3xl space-y-4"
		enctype="multipart/form-data"
		use:enhance
	>
		<h1 class="pb-2 text-4xl font-bold">New Task</h1>

		<div class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-8">
			<Form.Field {form} name="title" class="sm:col-span-5">
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
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="type" class="sm:col-span-3">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Type</Form.Label>
						<Select.Root
							type="single"
							bind:value={$formData.type}
							name={props.name}
						>
							<Select.Trigger {...props} class="w-full">
								{$formData.type.charAt(0).toUpperCase() +
									$formData.type.slice(1)}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="lesson" label="Lesson" />
								<Select.Item value="homework" label="Homework" />
								<Select.Item value="test" label="Test" />
								<Select.Item value="assignment" label="Assignment" />
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

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

			<Form.Field {form} name="week" class="col-span-3">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Week (optional)</Form.Label>
						<Input {...props} type="number" bind:value={$formData.week} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			{#if $formData.type === 'homework' || $formData.type === 'assignment'}
				<Form.Field {form} name="dueDate" class="col-span-3">
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
			{/if}
		</div>

		<Form.Field {form} name="description">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Description (optional)</Form.Label>
					<Textarea
						{...props}
						bind:value={$formData.description}
						placeholder="Briefly describe what students will learn in this task"
						rows={4}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<div class="space-y-2">
			<input type="hidden" name="files" bind:value={$formData.files} />
			<Label for="new-task-files">Supporting Material (optional)</Label>
			<Dropzone
				bind:files={$files}
				accept=".png,.jpg,.jpeg,.pdf"
				multiple={true}
				id="new-task-files"
			/>
			<p class="text-muted-foreground text-sm font-medium">
				If you provide supporting materials, eddi will use AI to help generate
				the task content.
			</p>
		</div>

		<div class="flex justify-end gap-2">
			<Form.Button type="submit" size="lg" disabled={$submitting}>
				{#if $submitting}
					<LoaderIcon class="mr-2 animate-spin" />
					Creating...
				{:else}
					Create
				{/if}
			</Form.Button>
		</div>
	</form>
</div>
