<script lang="ts">
	import Autocomplete from '$lib/components/autocomplete.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { subjectPreferredRoomsSchema } from '$lib/schemas/constraints';
	import type { EnhancedConstraintFormProps } from '$lib/types/constraint-form-types';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash';

	let { onSubmit, onCancel, initialValues = {}, formData }: EnhancedConstraintFormProps = $props();

	// Form state - use IDs instead of names
	let weightPercentage = $state((initialValues.Weight_Percentage as number) || 100);
	let subjectId = $state((initialValues.Subject as string) || '');
	let numberOfRooms = $state((initialValues.Number_of_Preferred_Rooms as number) || 1);
	let preferredRoomIds = $state<(string | number)[]>(
		(initialValues.Preferred_Room as (string | number)[]) || ['']
	);
	let comments = $state((initialValues.Comments as string) || '');

	// Update rooms array when numberOfRooms changes
	$effect(() => {
		if (numberOfRooms > preferredRoomIds.length) {
			// Add more rooms
			const diff = numberOfRooms - preferredRoomIds.length;
			preferredRoomIds = [...preferredRoomIds, ...Array(diff).fill('')];
		} else if (numberOfRooms < preferredRoomIds.length) {
			// Remove excess rooms
			preferredRoomIds = preferredRoomIds.slice(0, numberOfRooms);
		}
	});

	function addRoom() {
		preferredRoomIds = [...preferredRoomIds, ''];
		numberOfRooms = preferredRoomIds.length;
	}

	function removeRoom(index: number) {
		preferredRoomIds = preferredRoomIds.filter((_, i) => i !== index);
		numberOfRooms = preferredRoomIds.length;
	}

	function handleSubmit() {
		const values = {
			Weight_Percentage: weightPercentage,
			Subject: subjectId, // Now using subject ID
			Number_of_Preferred_Rooms: numberOfRooms,
			Preferred_Room: preferredRoomIds.filter((roomId) => roomId !== ''),
			Active: true,
			Comments: comments || null
		};

		// Validate with Zod
		const result = subjectPreferredRoomsSchema.safeParse(values);
		if (result.success) {
			onSubmit(result.data);
		}
	}

	// Validation with Zod
	let validationErrors = $derived.by(() => {
		const result = subjectPreferredRoomsSchema.safeParse({
			Weight_Percentage: weightPercentage,
			Subject: subjectId,
			Number_of_Preferred_Rooms: numberOfRooms,
			Preferred_Room: preferredRoomIds.filter((roomId) => roomId !== ''),
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

		<!-- Subject -->
		<div class="space-y-2">
			<Label for="subject">Subject *</Label>
			<Autocomplete
				options={formData?.subjects || []}
				bind:value={subjectId}
				placeholder="Select a subject..."
				searchPlaceholder="Search subjects..."
				emptyText="No subjects found."
			/>
			{#if validationErrors?.Subject}
				<p class="text-destructive text-sm">{validationErrors.Subject[0]}</p>
			{/if}
		</div>

		<!-- Preferred Rooms -->
		<div class="space-y-2">
			<Label>Preferred Rooms *</Label>
			<div class="space-y-3">
				{#each preferredRoomIds as roomId, index}
					<div class="flex gap-2">
						<Autocomplete
							options={formData?.spaces || []}
							bind:value={preferredRoomIds[index]}
							placeholder="Select a room..."
							searchPlaceholder="Search rooms..."
							emptyText="No rooms found."
							class="flex-1"
						/>
						{#if preferredRoomIds.length > 1}
							<Button variant="outline" size="sm" onclick={() => removeRoom(index)} type="button">
								<TrashIcon class="h-4 w-4" />
							</Button>
						{/if}
					</div>
				{/each}

				<Button variant="outline" size="sm" onclick={addRoom} type="button" class="w-full">
					<PlusIcon class="mr-2 h-4 w-4" />
					Add Room
				</Button>
			</div>
			{#if validationErrors?.Preferred_Room}
				<p class="text-destructive text-sm">{validationErrors.Preferred_Room[0]}</p>
			{/if}
			<p class="text-muted-foreground text-sm">
				Add multiple rooms that can be used for this subject. The system will prefer these rooms
				when scheduling.
			</p>
		</div>

		<!-- Comments -->
		<div class="space-y-2">
			<Label for="comments">Comments (Optional)</Label>
			<Textarea
				id="comments"
				bind:value={comments}
				placeholder="Additional notes or requirements..."
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
