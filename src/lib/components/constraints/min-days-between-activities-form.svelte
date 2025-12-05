<script lang="ts">
	import Autocomplete from '$lib/components/autocomplete.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import type { AutocompleteOption } from '$lib/constraint-data-fetchers';
	import { minDaysBetweenActivitiesSchema } from '$lib/schemas/constraints';
	import type { EnhancedConstraintFormProps } from '$lib/types/constraint-form-types';
	import TrashIcon from '@lucide/svelte/icons/trash';

	let { onSubmit, onCancel, initialValues = {}, formData }: EnhancedConstraintFormProps = $props();

	// Form state
	let weightPercentage = $state((initialValues.Weight_Percentage as number) || 95);
	let consecutiveIfSameDay = $state((initialValues.Consecutive_If_Same_Day as boolean) ?? true);
	let minDays = $state((initialValues.MinDays as number) || 1);
	let comments = $state((initialValues.Comments as string) || '');

	// Activity selection state
	let selectedActivities = $state<AutocompleteOption[]>([]);
	let selectedActivity = $state<string>('');

	function addActivity(option: AutocompleteOption) {
		if (!selectedActivities.find((a) => a.value === option.value)) {
			selectedActivities = [...selectedActivities, option];
			selectedActivity = '';
		}
	}

	function removeActivity(index: number) {
		selectedActivities = selectedActivities.filter((_, i) => i !== index);
	}

	function handleSubmit() {
		const activityIds = selectedActivities.map((activity) => activity.value);
		const values = {
			Weight_Percentage: weightPercentage,
			Consecutive_If_Same_Day: consecutiveIfSameDay,
			MinDays: minDays,
			Number_of_Activities: activityIds.length,
			Activity_Id: activityIds,
			Active: true,
			Comments: comments || null
		};

		// Validate with Zod
		const result = minDaysBetweenActivitiesSchema.safeParse(values);
		if (result.success) {
			onSubmit(result.data);
		}
	}

	// Validation with Zod
	let validationErrors = $derived.by(() => {
		const activityIds = selectedActivities.map((activity) => activity.value);
		const result = minDaysBetweenActivitiesSchema.safeParse({
			Weight_Percentage: weightPercentage,
			Consecutive_If_Same_Day: consecutiveIfSameDay,
			MinDays: minDays,
			Number_of_Activities: activityIds.length,
			Activity_Id: activityIds,
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
				placeholder="95"
			/>
			{#if validationErrors?.Weight_Percentage}
				<p class="text-destructive text-sm">{validationErrors.Weight_Percentage[0]}</p>
			{/if}
		</div>

		<!-- Minimum Days -->
		<div class="space-y-2">
			<Label for="minDays">Minimum Days Between Activities (1-6)</Label>
			<Input id="minDays" type="number" min="1" max="6" bind:value={minDays} placeholder="1" />
			{#if validationErrors?.MinDays}
				<p class="text-destructive text-sm">{validationErrors.MinDays[0]}</p>
			{/if}
			<p class="text-muted-foreground text-sm">
				Minimum number of days that must pass between the specified activities.
			</p>
		</div>

		<!-- Consecutive If Same Day -->
		<div class="flex items-center space-x-2">
			<Checkbox id="consecutive" bind:checked={consecutiveIfSameDay} />
			<Label
				for="consecutive"
				class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
			>
				Consecutive if same day
			</Label>
		</div>
		<p class="text-muted-foreground ml-6 text-sm">
			If activities are scheduled on the same day, they should be consecutive periods.
		</p>

		<!-- Activities -->
		<div class="space-y-2">
			<Label>Activities * (minimum 2 required)</Label>
			<div class="space-y-3">
				<!-- Existing Activities -->
				{#if selectedActivities.length > 0}
					<div class="space-y-2">
						{#each selectedActivities as activity, index}
							<div class="flex items-center gap-2">
								<Input value={activity.label} readonly class="flex-1" />
								<Button
									variant="outline"
									size="sm"
									onclick={() => removeActivity(index)}
									type="button"
								>
									<TrashIcon class="h-4 w-4" />
								</Button>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Add new Activity -->
				<div class="space-y-2">
					<Autocomplete
						options={formData?.timetableActivities || []}
						placeholder="Select an activity..."
						bind:value={selectedActivity}
						onselect={(option) => addActivity(option)}
					/>
				</div>
			</div>
			{#if validationErrors?.Activity_Id}
				<p class="text-destructive text-sm">{validationErrors.Activity_Id[0]}</p>
			{/if}
			<p class="text-muted-foreground text-sm">
				Specify the activities that should be spaced apart. You need at least 2 activities for this
				constraint to work.
			</p>
		</div>

		<!-- Comments -->
		<div class="space-y-2">
			<Label for="comments">Comments (Optional)</Label>
			<Textarea
				id="comments"
				bind:value={comments}
				placeholder="Reason for spacing activities (e.g., student fatigue, preparation time)..."
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
