<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import CardDescription from '$lib/components/ui/card/card-description.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { toast } from 'svelte-sonner';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { formSchema, type FormSchema } from './schema';

	let { data }: { data: { form: SuperValidated<Infer<FormSchema>> } } = $props();

	// svelte-ignore state_referenced_locally
	const form = superForm(data.form, {
		validators: zod4(formSchema),
		onResult: async (result) => {
			if (result.result.type === 'success') {
				toast.success('Thanks, we have your details and will be in touch soon!');
			}
		}
	});

	const { form: formData, enhance } = form;
</script>

<div class="flex h-full items-center justify-center p-4">
	<div class="w-full max-w-lg">
		<Card class="border-none shadow-none">
			<CardHeader>
				<CardTitle class="text-2xl">Get Started</CardTitle>
				<CardDescription
					>We need some details from you before we can get the ball rolling.</CardDescription
				>
			</CardHeader>
			<CardContent>
				<form method="POST" class="space-y-4" use:enhance>
					<Form.Field {form} name="firstName">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>First Name</Form.Label>
								<Input {...props} bind:value={$formData.firstName} placeholder="John" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="lastName">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Last Name</Form.Label>
								<Input {...props} bind:value={$formData.lastName} placeholder="Doe" />
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

					<Form.Field {form} name="schoolName">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>School Name</Form.Label>
								<Input {...props} bind:value={$formData.schoolName} placeholder="School of eddi" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="agreeToContact" class="flex items-start space-x-2">
						<Form.Control>
							{#snippet children({ props })}
								<Checkbox {...props} bind:checked={$formData.agreeToContact} />
								<div class="space-y-1">
									<Form.Label class="cursor-pointer text-sm font-normal">
										I agree to be contacted by the eddi team to schedule a setup session
									</Form.Label>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<div class="grid grid-cols-[0.4fr_0.6fr] gap-4 pt-2">
						<Button variant="outline" href="/">Back</Button>
						<Form.Button disabled={!$formData.agreeToContact}>Create Account</Form.Button>
					</div>
				</form>
			</CardContent>
		</Card>
	</div>
</div>
