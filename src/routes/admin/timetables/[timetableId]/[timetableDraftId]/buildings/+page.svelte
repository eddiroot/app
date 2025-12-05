<script>
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';

	let { data } = $props();
</script>

<Table>
	<TableHeader>
		<TableRow>
			<TableHead>Building Name</TableHead>
		</TableRow>
	</TableHeader>
	<TableBody>
		{#each data.buildings as building}
			<TableRow>
				<TableCell>
					{building.name}
				</TableCell>
			</TableRow>
		{/each}
	</TableBody>
</Table>
