<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { SchoolTerm } from '$lib/server/db/schema';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		mode: 'create' | 'edit';
		semesterId: number;
		semesterName: string;
		term?: SchoolTerm;
	}

	let {
		open = $bindable(),
		onOpenChange,
		mode,
		semesterId,
		semesterName,
		term,
	}: Props = $props();

	let isSubmitting = $state(false);
</script>

<Dialog.Root {open} {onOpenChange}>
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
				return async ({ update }) => {
					isSubmitting = false;
					await update();
					onOpenChange(false);
				};
			}}
		>
			<input
				type="hidden"
				name="currentYear"
				defaultValue={new Date().getFullYear().toString()}
			/>
			{#if mode === 'create'}
				<input type="hidden" name="semesterId" defaultValue={semesterId} />
			{:else if term}
				<input type="hidden" name="termId" defaultValue={term.id} />
			{/if}

			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="start">Start Date</Label>
					<Input
						id="start"
						name="start"
						type="date"
						defaultValue={term ? term.start.toISOString().split('T')[0] : ''}
						required
						disabled={isSubmitting}
					/>
				</div>

				<div class="grid gap-2">
					<Label for="end">End Date</Label>
					<Input
						id="end"
						name="end"
						type="date"
						defaultValue={term ? term.end.toISOString().split('T')[0] : ''}
						required
						disabled={isSubmitting}
					/>
				</div>
			</div>

			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					onclick={() => onOpenChange(false)}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting
						? 'Saving...'
						: mode === 'create'
							? 'Create Term'
							: 'Save Changes'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
