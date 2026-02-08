<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
	} from '$lib/components/ui/card';
	import CardDescription from '$lib/components/ui/card/card-description.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { formSchema } from './schema';

	let { data } = $props();

	let dataForm = () => data.form;
	const form = superForm(dataForm(), {
		validators: zod4(formSchema),
		onResult: async (result) => {
			if (result.result.type === 'success') {
				toast.success(
					'Issue reported! We will look into this as soon as possible.',
				);
			}
		},
	});

	const { form: formData, enhance } = form;
</script>

<div class="flex h-full items-center justify-center p-4">
	<div class="w-full max-w-lg">
		<Card class="border-none shadow-none">
			<CardHeader>
				<CardTitle class="text-2xl">Report an Issue</CardTitle>
				<CardDescription
					>Let us know about any problems you're experiencing.</CardDescription
				>
			</CardHeader>
			<CardContent>
				<form method="POST" class="space-y-4" use:enhance>
					<Form.Field {form} name="firstName">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>First Name</Form.Label>
								<Input
									{...props}
									bind:value={$formData.firstName}
									placeholder="John"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="lastName">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Last Name</Form.Label>
								<Input
									{...props}
									bind:value={$formData.lastName}
									placeholder="Doe"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="email">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Email Address</Form.Label>
								<Input
									{...props}
									type="email"
									bind:value={$formData.email}
									placeholder="john.doe@school.edu.au"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="issueTitle">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Issue Title</Form.Label>
								<Input
									{...props}
									bind:value={$formData.issueTitle}
									placeholder="Brief summary of the issue"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="issueDescription">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Issue Description</Form.Label>
								<Textarea
									{...props}
									bind:value={$formData.issueDescription}
									placeholder="Please describe the issue in detail, including steps to reproduce if applicable..."
									rows={5}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<div class="grid grid-cols-[0.4fr_0.6fr] gap-4 pt-2">
						<Button variant="outline" href="/support">Back</Button>
						<Form.Button>Submit Report</Form.Button>
					</div>
				</form>
			</CardContent>
		</Card>
	</div>
</div>
