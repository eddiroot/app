<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { SchoolTerm } from '$lib/server/db/schema/schools';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		mode: 'create' | 'edit';
		semesterId: number;
		semesterName: string;
		currentYear: number;
		term?: SchoolTerm;
		onSuccess: (data?: any) => void;
	}

	let {
		open = $bindable(),
		onOpenChange,
		mode,
		semesterId,
		semesterName,
		currentYear,
		term,
		onSuccess
	}: Props = $props();

	let isSubmitting = $state(false);
	let formError = $state('');

	let termName = $state(term?.name || '');
	let startDate = $state(
		term?.startDate ? new Date(term.startDate).toISOString().split('T')[0] : ''
	);
	let endDate = $state(term?.endDate ? new Date(term.endDate).toISOString().split('T')[0] : '');

	// Reset form when term changes
	$effect(() => {
		termName = term?.name || '';
		startDate = term?.startDate ? new Date(term.startDate).toISOString().split('T')[0] : '';
		endDate = term?.endDate ? new Date(term.endDate).toISOString().split('T')[0] : '';
		formError = '';
	});

	function handleOpenChange(newOpen: boolean) {
		if (!isSubmitting) {
			onOpenChange(newOpen);
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>
				{mode === 'create' ? 'Create New Term' : 'Edit Term'}
			</Dialog.Title>
			<Dialog.Description>
				{mode === 'create'
					? `Add a new term to ${semesterName}`
					: `Edit term details for ${semesterName}`}
			</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action={mode === 'create' ? '?/createTerm' : '?/updateTerm'}
			use:enhance={() => {
				isSubmitting = true;
				formError = '';
				return async ({ result, update }) => {
					isSubmitting = false;
					if (result.type === 'success') {
						await update();
						onSuccess(result.data);
						onOpenChange(false);
					} else if (result.type === 'failure') {
						formError = 'An error occurred';
					}
				};
			}}
		>
			<input type="hidden" name="currentYear" value={currentYear} />
			{#if mode === 'create'}
				<input type="hidden" name="semesterId" value={semesterId} />
			{:else if term}
				<input type="hidden" name="termId" value={term.id} />
			{/if}

			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="startDate">Start Date</Label>
					<Input
						id="startDate"
						name="startDate"
						type="date"
						bind:value={startDate}
						required
						disabled={isSubmitting}
					/>
				</div>

				<div class="grid gap-2">
					<Label for="endDate">End Date</Label>
					<Input
						id="endDate"
						name="endDate"
						type="date"
						bind:value={endDate}
						required
						disabled={isSubmitting}
					/>
				</div>

				{#if formError}
					<p class="text-destructive text-sm">{formError}</p>
				{/if}
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => handleOpenChange(false)}>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Term' : 'Save Changes'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
