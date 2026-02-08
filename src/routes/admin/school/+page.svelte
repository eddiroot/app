<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { fileProxy, superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { schoolFormSchema } from './schema';

	let { data } = $props();

	let dataForm = () => data.form;
	const form = superForm(dataForm(), {
		validators: zod4(schoolFormSchema),
		resetForm: false,
	});

	const { form: formData, enhance: enhanceForm } = form;

	function getSchoolInitials(name: string): string {
		return name
			.split(' ')
			.map((word) => word[0]?.toUpperCase())
			.join('')
			.slice(0, 2);
	}

	const file = fileProxy(form, 'logo');
</script>

<div class="space-y-8">
	<h1 class="text-3xl font-bold tracking-tight">School</h1>

	<!-- School Details Form -->
	<form
		method="POST"
		enctype="multipart/form-data"
		class="max-w-2xl space-y-8"
		use:enhanceForm
	>
		<!-- Logo Section -->
		<div class="flex items-center gap-6">
			<Avatar.Root class="h-20 w-20">
				{#if data.school?.logoPath}
					<Avatar.Image src={data.school.logoPath} alt="Current school logo" />
				{:else}
					<Avatar.Fallback class="text-lg">
						{data.school?.name ? getSchoolInitials(data.school.name) : 'SL'}
					</Avatar.Fallback>
				{/if}
			</Avatar.Root>

			<Form.Field {form} name="logo">
				<Form.Control>
					<Form.Label>School Logo</Form.Label>
					<Input
						id="logo"
						name="logo"
						type="file"
						accept="image/jpeg,image/jpg,image/png,image/webp"
						bind:files={$file}
					/>
				</Form.Control>
				<Form.Description>
					Upload a JPEG, PNG, or WebP image. Maximum file size: 5MB.
				</Form.Description>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>School Name</Form.Label>
					<Input
						{...props}
						bind:value={$formData.name}
						placeholder="Enter your school name"
						class="text-lg"
					/>
				{/snippet}
			</Form.Control>
			<Form.Description>
				This is the official name of your school that will appear throughout the
				system.
			</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<div class="flex justify-end gap-2">
			<Form.Button type="submit">Save School Details</Form.Button>
		</div>
	</form>
</div>
