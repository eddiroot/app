<script>
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { convertToFullName } from '$lib/utils.js';

	let { data } = $props();
</script>

<Table>
	<TableHeader>
		<TableRow>
			<TableHead>Teacher Name</TableHead>
		</TableRow>
	</TableHeader>
	<TableBody>
		{#each data.teachers as teacher}
			<TableRow>
				<TableCell>
					{convertToFullName(teacher.firstName, teacher.middleName, teacher.lastName)}
				</TableCell>
			</TableRow>
		{/each}
	</TableBody>
</Table>
