<script lang="ts">
	import RichTextarea from '$lib/components/rich-textarea.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { formSchema, type FormSchema } from './schema';

	let { data }: { data: { form: SuperValidated<Infer<FormSchema>> } } = $props();

	const form = superForm(data.form, {
		validators: zod4(formSchema)
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" action="?/create" class="w-2/3 space-y-6" use:enhance>
	<Form.Field {form} name="type">
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
						<Select.Item value="discussion" label="Discussion" />
						<Select.Item value="question" label="Question" />
						<Select.Item value="announcement" label="Announcement" />
						<Select.Item value="qanda" label="Q&A" />
					</Select.Content>
				</Select.Root>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="title">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Title</Form.Label>
				<Input {...props} bind:value={$formData.title} placeholder="Enter the title of your post" />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
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
	<Form.Button>Submit</Form.Button>
</form>
