<script lang="ts">
	import Autocomplete from '$lib/components/autocomplete.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { roomNotAvailableTimesSchema } from '$lib/schemas/constraints';
	import type { EnhancedConstraintFormProps } from '$lib/types/constraint-form-types';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash';

	let { onSubmit, onCancel, initialValues = {}, formData }: EnhancedConstraintFormProps = $props();

	// Form state
	let weightPercentage = $state((initialValues.Weight_Percentage as number) || 100);
	let selectedRoomId = $state<string | number>('');
	let notAvailableTimes = $state<Array<{ Day: number; Period: number }>>(
		(initialValues.Not_Available_Time as Array<{ Day: number; Period: number }>) || [
			{ Day: 0, Period: 0 }
		]
	);
	let comments = $state((initialValues.Comments as string) || '');

	// Initialize selectedRoomId from initialValues if provided
	if (initialValues.Room) {
		selectedRoomId = initialValues.Room as string | number;
	}

	function addNotAvailableTime() {
		notAvailableTimes = [...notAvailableTimes, { Day: 0, Period: 0 }];
	}

	function removeNotAvailableTime(index: number) {
		notAvailableTimes = notAvailableTimes.filter((_, i) => i !== index);
	}

	function handleSubmit() {
		const values = {
			Weight_Percentage: weightPercentage,
			Room: selectedRoomId,
			Number_of_Not_Available_Times: notAvailableTimes.length,
			Not_Available_Time: notAvailableTimes,
			Active: true,
			Comments: comments || null
		};

		// Validate with Zod
		const result = roomNotAvailableTimesSchema.safeParse(values);
		if (result.success) {
			onSubmit(result.data);
		}
	}

	// Validation with Zod
	let validationErrors = $derived.by(() => {
		const result = roomNotAvailableTimesSchema.safeParse({
			Weight_Percentage: weightPercentage,
			Room: selectedRoomId,
			Number_of_Not_Available_Times: notAvailableTimes.length,
			Not_Available_Time: notAvailableTimes,
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

		<!-- Room -->
		<div class="space-y-2">
			<Label for="room">Room *</Label>
			<Autocomplete
				options={formData?.spaces || []}
				placeholder="Select a room..."
				bind:value={selectedRoomId}
			/>
			{#if validationErrors?.Room}
				<p class="text-destructive text-sm">{validationErrors.Room[0]}</p>
			{/if}
			{#if formData?.spaces.length === 0}
				<p class="text-destructive text-sm">All rooms already have this constraint applied.</p>
			{/if}
		</div>

		<!-- Not Available Times -->
		<div class="space-y-2">
			<Label>Not Available Times *</Label>
			{#if validationErrors?.Not_Available_Time}
				<p class="text-destructive text-sm">{validationErrors.Not_Available_Time[0]}</p>
			{/if}
			<div class="space-y-3">
				<div class="flex gap-2">
					<Label class="flex-1 text-xs">Day</Label>
					<Label class="flex-1 text-xs">Period</Label>
				</div>
				{#each notAvailableTimes as time, index}
					<div class="flex items-end gap-2">
						<div class="flex-1 space-y-1">
							<Autocomplete
								options={formData?.timetableDays || []}
								placeholder="Select a day..."
								bind:value={time.Day}
							/>
						</div>

						<div class="flex-1 space-y-1">
							<Autocomplete
								options={formData?.timetablePeriods || []}
								placeholder="Select a period..."
								bind:value={time.Period}
							/>
						</div>

						{#if notAvailableTimes.length > 1}
							<Button
								variant="outline"
								size="sm"
								onclick={() => removeNotAvailableTime(index)}
								type="button"
							>
								<TrashIcon class="h-4 w-4" />
							</Button>
						{/if}
					</div>
				{/each}

				<Button
					variant="outline"
					size="sm"
					onclick={addNotAvailableTime}
					type="button"
					class="w-full"
				>
					<PlusIcon class="mr-2 h-4 w-4" />
					Add Time Slot
				</Button>
			</div>
			<p class="text-muted-foreground text-sm">
				Specify when this room is not available for scheduling (e.g., maintenance, other bookings).
			</p>
		</div>

		<!-- Comments -->
		<div class="space-y-2">
			<Label for="comments">Comments (Optional)</Label>
			<Textarea
				id="comments"
				bind:value={comments}
				placeholder="Reason for unavailability (e.g., maintenance, meetings)..."
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
