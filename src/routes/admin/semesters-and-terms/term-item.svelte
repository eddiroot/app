<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Item from '$lib/components/ui/item';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	let { term } = $props();
	let form = $state<HTMLFormElement>();
</script>

<Item.Root variant="outline">
	<Item.Content>
		<Item.Title>Term {term.number}</Item.Title>
	</Item.Content>
	<Item.Actions>
		<form
			method="POST"
			action="?/updateTerm"
			class="flex gap-2"
			bind:this={form}
			use:enhance
		>
			<input type="hidden" name="termId" value={term.id} />
			<Input
				type="date"
				name="start"
				defaultValue={term.start.toISOString().split('T')[0]}
				onchange={() => form?.requestSubmit()}
			/>
			<Input
				type="date"
				name="end"
				defaultValue={term.end.toISOString().split('T')[0]}
				onchange={() => form?.requestSubmit()}
			/>
		</form>
		<form method="POST" action="?/deleteTerm" use:enhance>
			<input type="hidden" name="termId" value={term.id} />
			<Button type="submit" variant="destructive" size="sm">
				<Trash2Icon />
			</Button>
		</form>
	</Item.Actions>
</Item.Root>
