<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { teachersMaxGapsSchema } from '$lib/schemas/constraints';

	interface Props {
		onSubmit: (values: Record<string, any>) => void;
		onCancel: () => void;
		initialValues?: Record<string, any>;
	}

	let { onSubmit, onCancel, initialValues = {} }: Props = $props();

	// Form state
	let weightPercentage = $state(initialValues.Weight_Percentage || 100);
	let maxGaps = $state(initialValues.Max_Gaps || 3);
	let comments = $state(initialValues.Comments || '');

	function handleSubmit() {
		const values = {
			Weight_Percentage: weightPercentage,
			Max_Gaps: maxGaps,
			Active: true,
			Comments: comments || null
		};

		// Validate with Zod
		const result = teachersMaxGapsSchema.safeParse(values);
		if (result.success) {
			onSubmit(result.data);
		}
	}

	// Validation with Zod
	let validationErrors = $derived.by(() => {
		const result = teachersMaxGapsSchema.safeParse({
			Weight_Percentage: weightPercentage,
			Max_Gaps: maxGaps,
			Active: true,
			Comments: comments || null
		});
		return result.success ? null : result.error.flatten().fieldErrors;
	});

	let isValid = $derived(validationErrors === null);
</script>

<div class="space-y-6">
	<div class="space-y-4">
		<!-- Weight Percentage -->
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
				<p class="text-destructive text-sm">{validationErrors.Weight_Percentage[0]}</p>
			{/if}
		</div>

		<!-- Max Gaps -->
		<div class="space-y-2">
			<Label for="maxGaps">Maximum Gaps Per Week (0-20)</Label>
			<Input id="maxGaps" type="number" min="0" max="20" bind:value={maxGaps} placeholder="3" />
			{#if validationErrors?.Max_Gaps}
				<p class="text-destructive text-sm">{validationErrors.Max_Gaps[0]}</p>
			{/if}
			<p class="text-muted-foreground text-sm">
				Maximum number of free periods (gaps) teachers can have in their weekly schedule. Lower
				values create more compact schedules.
			</p>
		</div>

		<!-- Comments -->
		<div class="space-y-2">
			<Label for="comments">Comments (Optional)</Label>
			<Textarea
				id="comments"
				bind:value={comments}
				placeholder="Additional notes about gap constraints..."
				rows={3}
			/>
		</div>
	</div>

	<!-- Form Actions -->
	<div class="flex justify-end gap-3">
		<Button variant="outline" onclick={onCancel}>Cancel</Button>
		<Button onclick={handleSubmit} disabled={!isValid}>Add Constraint</Button>
	</div>
</div>
