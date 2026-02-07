<script>
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from '$lib/components/ui/table';

	let { data } = $props();

	let spacesByBuilding = $derived(() => {
		const grouped = new Map();
		for (const building of data.buildings) {
			grouped.set(building.id, []);
		}
		for (const space of data.spaces) {
			const buildingSpaces = grouped.get(space.buildingId);
			if (buildingSpaces) {
				buildingSpaces.push(space);
			}
		}
		return grouped;
	});

	let sortedBuildings = $derived(() => {
		return [...data.buildings].sort((a, b) => {
			const aSpaces = spacesByBuilding().get(a.id)?.length || 0;
			const bSpaces = spacesByBuilding().get(b.id)?.length || 0;
			return bSpaces - aSpaces;
		});
	});
</script>

<div class="space-y-4">
	<h1 class="text-2xl leading-tight font-bold">Locations</h1>
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		{#each sortedBuildings() as building}
			<div class="space-y-4">
				<h2 class="text-xl leading-tight font-bold">{building.name}</h2>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Space Name</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Capacity</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each spacesByBuilding().get(building.id) || [] as space}
							<TableRow>
								<TableCell>
									{space.name}
								</TableCell>
								<TableCell>
									{space.type}
								</TableCell>
								<TableCell>
									{space.capacity || '-'}
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		{/each}
	</div>
</div>
