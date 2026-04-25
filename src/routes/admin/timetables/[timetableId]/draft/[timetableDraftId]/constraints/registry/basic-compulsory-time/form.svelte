<script lang="ts">
	import { untrack } from 'svelte';

	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';

	import type { ConstraintFormComponentProps } from '../types';
	import { basicCompulsoryTimeSchema } from './index';

	let {
		onSubmit,
		onCancel,
		initialValues = {},
		submitLabel = 'Add Constraint',
	}: ConstraintFormComponentProps = $props();

	let weightPercentage = $state(
		untrack(() => (initialValues.Weight_Percentage as number) ?? 100),
	);
	let comments = $state(untrack(() => (initialValues.Comments as string) ?? ''));

	let validationErrors = $derived.by(() => {
		const result = basicCompulsoryTimeSchema.safeParse({
			Weight_Percentage: weightPercentage,
			Active: true,
			Comments: comments || null,
		});
		return result.success ? null : result.error.flatten().fieldErrors;
	});

	let isValid = $derived(validationErrors === null);

	function handleSubmit() {
		const result = basicCompulsoryTimeSchema.safeParse({
			Weight_Percentage: weightPercentage,
			Active: true,
			Comments: comments || null,
		});
		if (result.success) {
			onSubmit(result.data);
		}
	}
</script>

<div class="space-y-6">
	<div class="space-y-4">
		<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
			<h3 class="mb-2 font-semibold text-blue-900">Mandatory Constraint</h3>
			<p class="text-sm text-blue-800">
				This constraint ensures all activities are scheduled within the defined
				time periods. It is required for the timetabling system to function
				properly.
			</p>
		</div>

		<div class="space-y-2">
			<Label for="weight">Weight Percentage (1-100)</Label>
			<Input
				id="weight"
				type="number"
				min="1"
				max="100"
				bind:value={weightPercentage}
				placeholder="100"
			/>
			{#if validationErrors?.Weight_Percentage}
				<p class="text-destructive text-sm">
					{validationErrors.Weight_Percentage[0]}
				</p>
			{/if}
			<p class="text-muted-foreground text-sm">
				For mandatory constraints, this should typically be set to 100%.
			</p>
		</div>

		<div class="space-y-2">
			<Label for="comments">Comments (Optional)</Label>
			<Textarea
				id="comments"
				bind:value={comments}
				placeholder="Additional notes about this mandatory constraint..."
				rows={3}
			/>
		</div>
	</div>

	<div class="flex justify-end gap-3">
		<Button variant="outline" onclick={onCancel}>Cancel</Button>
		<Button onclick={handleSubmit} disabled={!isValid}>{submitLabel}</Button>
	</div>
</div>
