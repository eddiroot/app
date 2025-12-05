<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Form from '$lib/components/ui/form';
	import Input from '$lib/components/ui/input/input.svelte';
	import { formatTime } from '$lib/utils.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { addPeriodSchema, updateCycleWeeksRepeatSchema, updateDaysSchema } from './schema.js';

	let { data } = $props();

	let updateDaysFormElement: HTMLFormElement;
	let updateCycleWeeksRepeatFormElement: HTMLFormElement;

	const updateDaysForm = superForm(data.updateDaysForm, {
		validators: zod4(updateDaysSchema),
		resetForm: false
	});
	const { form: updateDaysData, enhance: updateDaysEnhance } = updateDaysForm;

	const addPeriodForm = superForm(data.addPeriodForm, {
		validators: zod4(addPeriodSchema),
		resetForm: true
	});
	const { form: addPeriodData, enhance: addPeriodEnhance } = addPeriodForm;

	const updateCycleWeeksRepeatForm = superForm(data.updateCycleWeeksRepeatForm, {
		validators: zod4(updateCycleWeeksRepeatSchema),
		resetForm: false
	});
	const { form: updateCycleWeeksRepeatData, enhance: updateCycleWeeksRepeatEnhance } =
		updateCycleWeeksRepeatForm;
</script>

<div class="space-y-8">
	<form
		method="POST"
		bind:this={updateCycleWeeksRepeatFormElement}
		action="?/updateCycleWeeksRepeat"
		class="space-y-4"
		use:updateCycleWeeksRepeatEnhance
	>
		<h2 class="text-2xl leading-tight font-bold">Cycle Weeks Repeat</h2>
		<Form.Field form={updateCycleWeeksRepeatForm} name="cycleWeeksRepeat">
			<Form.Control>
				{#snippet children({ props })}
					<div class="flex items-center gap-4">
						<Input
							{...props}
							type="number"
							min="1"
							max="52"
							class="w-32"
							bind:value={$updateCycleWeeksRepeatData.cycleWeeksRepeat}
							onchange={() => {
								updateCycleWeeksRepeatFormElement.requestSubmit();
							}}
						/>
						<span class="text-muted-foreground text-sm">
							week{$updateCycleWeeksRepeatData.cycleWeeksRepeat !== 1 ? 's' : ''}
						</span>
					</div>
				{/snippet}
			</Form.Control>
			<Form.Description>
				The number of weeks in the timetable cycle before it repeats (Usually 1 or 2)
			</Form.Description>
			<Form.FieldErrors />
		</Form.Field>
	</form>

	<!-- <form
		method="POST"
		bind:this={updateDaysFormElement}
		action="?/updateDays"
		class="space-y-4"
		use:updateDaysEnhance
	>
		<h2 class="text-2xl leading-tight font-bold">Days</h2>

		<Form.Field form={updateDaysForm} name="selectedDays">
			<ol class="grid grid-cols-5 gap-2">
				{#each days as day}
					{@const isSelected = $updateDaysData.selectedDays.includes(day.number)}
					{@const canUncheck = $updateDaysData.selectedDays.length > 1 || !isSelected}
					<li>
						<Form.Control>
							{#snippet children({ props })}
								<input
									{...props}
									type="checkbox"
									id={day.number.toString()}
									name="selectedDays"
									value={day.number}
									class="peer hidden"
									bind:group={$updateDaysData.selectedDays}
									disabled={!canUncheck}
									onchange={() => {
										updateDaysFormElement.requestSubmit();
									}}
								/>
							{/snippet}
						</Form.Control>
						<label
							for={day.number.toString()}
							class="border-border peer-checked:border-primary peer-checked:bg-primary/10 inline-flex w-full cursor-pointer items-center justify-center rounded-lg border-2 p-5 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
							class:cursor-not-allowed={!canUncheck}
						>
							<span class="text-xl font-bold">{day.name}</span>
						</label>
					</li>
				{/each}
			</ol>
			<Form.FieldErrors />
		</Form.Field>
	</form> -->

	<div class="space-y-4">
		<h2 class="text-2xl leading-tight font-bold">Periods</h2>
		<form method="POST" action="?/updatePeriods" class="flex flex-row gap-2" use:addPeriodEnhance>
			<Form.Field form={addPeriodForm} name="startTime">
				<Form.Control>
					{#snippet children({ props })}
						<Input
							{...props}
							type="time"
							class="w-32"
							placeholder="Start time"
							bind:value={$addPeriodData.startTime}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field form={addPeriodForm} name="endTime">
				<Form.Control>
					{#snippet children({ props })}
						<Input
							{...props}
							type="time"
							class="w-32"
							placeholder="End time"
							bind:value={$addPeriodData.endTime}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Button type="submit"><PlusIcon />Add</Button>
		</form>

		{#if data.periods.length === 0}
			<p class="text-muted-foreground text-sm">No periods defined yet. Add a period above.</p>
		{:else}
			<ol class="space-y-2">
				{#each data.periods as period}
					<li
						class="border-border bg-card flex min-h-10 w-full items-center justify-between rounded-lg border-2 px-4 py-3 transition-colors"
					>
						<div class="flex flex-col">
							<span class="font-semibold">
								{formatTime(period.startTime)} - {formatTime(period.endTime)}
							</span>
							{#if period.duration !== null}
								<span class="text-muted-foreground text-sm">
									{period.duration} minute{period.duration !== 1 ? 's' : ''}
								</span>
							{/if}
						</div>
						{#if data.periods.length > 1}
							<form method="POST" action="?/deletePeriod" use:enhance class="ml-2">
								<input type="hidden" name="periodId" value={period.id} />
								<Button type="submit" variant="destructive" size="icon">
									<TrashIcon />
								</Button>
							</form>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}

		{#if data.periods.length === 1}
			<p class="text-muted-foreground text-sm">
				At least one period is required. Add more periods above or delete periods when you have more
				than one.
			</p>
		{/if}
	</div>
</div>
