<script>
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from '$lib/components/ui/table';
	import { convertToFullName } from '$lib/utils';

	let { data } = $props();
</script>

<Table class="h-full overflow-y-auto">
	<TableHeader>
		<TableRow>
			<TableHead><Checkbox disabled checked /></TableHead>
			<TableHead>Teacher Name</TableHead>
		</TableRow>
	</TableHeader>
	<TableBody>
		{#each data.teachers as teacher}
			<TableRow>
				<TableCell><Checkbox disabled checked /></TableCell>
				<TableCell>
					{convertToFullName(
						teacher.firstName,
						teacher.middleName,
						teacher.lastName,
					)}
				</TableCell>
			</TableRow>
		{/each}
	</TableBody>
</Table>
