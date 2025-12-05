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
			<TableHead>Subject Name</TableHead>
			<TableHead>Year Level</TableHead>
		</TableRow>
	</TableHeader>
	<TableBody>
		{#each data.subjectsAndOfferings as subjectAndOffering}
			<TableRow>
				<TableCell>
					{subjectAndOffering.subject.name}
				</TableCell>
				<TableCell>
					{subjectAndOffering.subjectOffering.year}
				</TableCell>
			</TableRow>
		{/each}
	</TableBody>
</Table>
