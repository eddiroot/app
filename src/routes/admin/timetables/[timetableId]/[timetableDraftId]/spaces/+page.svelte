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
			<TableHead>Space Name</TableHead>
		</TableRow>
	</TableHeader>
	<TableBody>
		{#each data.spaces as space}
			<TableRow>
				<TableCell>
					{space.name}
				</TableCell>
			</TableRow>
		{/each}
	</TableBody>
</Table>
