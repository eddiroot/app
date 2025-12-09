<script lang="ts">
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import RichTextarea from '$lib/components/ui/textarea/textarea.svelte';
	import { userTypeEnum } from '$lib/enums';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { formSchema } from './schema';

	let { data } = $props();

	const dataForm = () => data.form;
	const form = superForm(dataForm(), {
		validators: zod4(formSchema)
	});

	const { form: formData, enhance } = form;
</script>

<div>
	<h1 class="mb-4 text-3xl font-bold">New Post</h1>
	<form method="POST" action="?/create" class="@container space-y-6" use:enhance>
		<div class="grid grid-cols-1 gap-x-4 gap-y-6 @sm:grid-cols-8">
			<Form.Field {form} name="title" class="@sm:col-span-5">
				<Form.Control>
					{#snippet children({ props })}
						<Form.FormLabel>Title</Form.FormLabel>
						<Input
							{...props}
							bind:value={$formData.title}
							placeholder="Enter the title of your post"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="type" class="@sm:col-span-3">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Type</Form.Label>
						<Select.Root type="single" bind:value={$formData.type} name={props.name}>
							<Select.Trigger {...props} class="w-full">
								{$formData.type == 'qanda'
									? 'Q&A'
									: $formData.type.charAt(0).toUpperCase() + $formData.type.slice(1)}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="question" label="Question" />
								<Select.Item value="discussion" label="Discussion" />
								{#if data.user && data.user.type === userTypeEnum.teacher}
									<Select.Item value="announcement" label="Announcement" />
									<Select.Item value="qanda" label="Q&A" />
								{/if}
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
		<Form.Field {form} name="content">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Content</Form.Label>
					<RichTextarea
						{...props}
						bind:value={$formData.content}
						placeholder="Write your post content here"
						class="h-96"
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		{#if data.user && data.user.type === userTypeEnum.student}
			<div class="flex items-stretch justify-between gap-x-4">
				<Form.Field {form} name="isAnonymous" class="space-y-0">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label class="hover:bg-accent/50 items-start gap-3 rounded-lg border p-3">
								<Checkbox {...props} bind:checked={$formData.isAnonymous} />
								<div class="grid gap-1.5 font-normal">
									<p class="text-sm leading-none font-medium">Anonymous Post</p>
									<p class="text-muted-foreground text-sm">
										Only teachers and staff will see your name.
									</p>
								</div>
							</Form.Label>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Button class="ml-auto h-auto!" size="lg">Submit</Form.Button>
			</div>
		{:else}
			<div class="flex justify-end">
				<Form.Button size="lg">Submit</Form.Button>
			</div>
		{/if}
	</form>
</div>
