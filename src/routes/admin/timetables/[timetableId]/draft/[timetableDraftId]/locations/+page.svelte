<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from '$lib/components/ui/table';
	import Building2 from '@lucide/svelte/icons/building-2';
	import DoorOpen from '@lucide/svelte/icons/door-open';
	import Layers from '@lucide/svelte/icons/layers';
	import Search from '@lucide/svelte/icons/search';
	import Users from '@lucide/svelte/icons/users';
	import { SvelteMap } from 'svelte/reactivity';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let filter = $state('');

	const normalizedFilter = $derived(filter.trim().toLowerCase());

	const totalCapacity = $derived(
		data.spaces.reduce((total, space) => total + (space.capacity ?? 0), 0),
	);

	const spaceTypes = $derived.by(() =>
		[...new Set(data.spaces.map((space) => space.type))].sort(),
	);

	const filteredSpaces = $derived.by(() => {
		if (!normalizedFilter) return data.spaces;

		return data.spaces.filter((space) => {
			return [
				space.name,
				space.type,
				space.buildingName,
				space.campusName,
				space.capacity?.toString(),
			]
				.filter(Boolean)
				.some((value) => value?.toLowerCase().includes(normalizedFilter));
		});
	});

	const spacesByBuilding = $derived.by(() => {
		const grouped = new SvelteMap<number, PageData['spaces']>();

		for (const building of data.buildings) {
			grouped.set(building.id, []);
		}

		for (const space of filteredSpaces) {
			const buildingSpaces = grouped.get(space.buildingId);
			if (buildingSpaces) {
				buildingSpaces.push(space);
			}
		}

		return grouped;
	});

	const sortedBuildings = $derived.by(() => {
		return [...data.buildings]
			.filter((building) => {
				const buildingSpaces = spacesByBuilding.get(building.id) ?? [];
				if (buildingSpaces.length > 0) return true;
				if (!normalizedFilter) return true;

				return [building.name, building.campusName].some((value) =>
					value.toLowerCase().includes(normalizedFilter),
				);
			})
			.sort((a, b) => {
				const aSpaces = spacesByBuilding.get(a.id)?.length || 0;
				const bSpaces = spacesByBuilding.get(b.id)?.length || 0;
				return bSpaces - aSpaces || a.name.localeCompare(b.name);
			});
	});

	function formatSpaceType(type: string) {
		return type
			.replace(/_/g, ' ')
			.replace(/\b\w/g, (char) => char.toUpperCase());
	}

	function getCapacityLabel(capacity: number | null) {
		if (!capacity) return 'Not set';
		return `${capacity} ${capacity === 1 ? 'person' : 'people'}`;
	}
</script>

<div class="space-y-6 p-6">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight">Locations</h1>
			<p class="text-muted-foreground text-sm">
				Buildings and spaces available for this timetable draft.
			</p>
		</div>

		<div class="relative w-full sm:w-72">
			<Search
				class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
			/>
			<Input
				bind:value={filter}
				placeholder="Filter locations..."
				class="pl-9"
			/>
		</div>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<Card.Root>
			<Card.Header
				class="flex flex-row items-center justify-between space-y-0 pb-2"
			>
				<Card.Title class="text-sm font-medium">Buildings</Card.Title>
				<div class="bg-primary/10 rounded-lg p-2">
					<Building2 class="text-primary h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.buildings.length}</div>
				<p class="text-muted-foreground text-xs">Configured across campuses</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header
				class="flex flex-row items-center justify-between space-y-0 pb-2"
			>
				<Card.Title class="text-sm font-medium">Spaces</Card.Title>
				<div class="bg-primary/10 rounded-lg p-2">
					<DoorOpen class="text-primary h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.spaces.length}</div>
				<p class="text-muted-foreground text-xs">Rooms and shared facilities</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header
				class="flex flex-row items-center justify-between space-y-0 pb-2"
			>
				<Card.Title class="text-sm font-medium">Capacity</Card.Title>
				<div class="bg-primary/10 rounded-lg p-2">
					<Users class="text-primary h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{totalCapacity}</div>
				<p class="text-muted-foreground text-xs">Known seats across spaces</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header
				class="flex flex-row items-center justify-between space-y-0 pb-2"
			>
				<Card.Title class="text-sm font-medium">Space types</Card.Title>
				<div class="bg-primary/10 rounded-lg p-2">
					<Layers class="text-primary h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{spaceTypes.length}</div>
				<p class="text-muted-foreground text-xs">Used by room constraints</p>
			</Card.Content>
		</Card.Root>
	</div>

	{#if data.buildings.length === 0}
		<Card.Root class="border-dashed">
			<Card.Content class="flex flex-col items-center gap-3 py-12 text-center">
				<div
					class="bg-muted flex h-14 w-14 items-center justify-center rounded-full"
				>
					<Building2 class="text-muted-foreground h-6 w-6" />
				</div>
				<div class="space-y-1">
					<p class="text-lg font-semibold">No locations found</p>
					<p class="text-muted-foreground max-w-sm text-sm">
						Add buildings and spaces in school setup before assigning rooms to
						timetable activities.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if filteredSpaces.length === 0 && normalizedFilter}
		<Card.Root class="border-dashed">
			<Card.Content class="flex flex-col items-center gap-2 py-10 text-center">
				<Search class="text-muted-foreground h-6 w-6 opacity-60" />
				<p class="text-sm font-medium">No locations match your filter</p>
				<p class="text-muted-foreground text-sm">
					Try a building, campus, room type, or capacity.
				</p>
				<Button variant="outline" size="sm" onclick={() => (filter = '')}>
					Clear filter
				</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
			{#each sortedBuildings as building (building.id)}
				{@const buildingSpaces = spacesByBuilding.get(building.id) ?? []}
				<Card.Root>
					<Card.Header class="gap-3">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 space-y-1">
								<Card.Title class="truncate text-lg">
									{building.name}
								</Card.Title>
								<Card.Description class="truncate text-sm">
									{building.campusName}
								</Card.Description>
							</div>
							<Badge variant="secondary">
								{buildingSpaces.length}
								{buildingSpaces.length === 1 ? 'space' : 'spaces'}
							</Badge>
						</div>
					</Card.Header>
					<Card.Content class="pt-0">
						{#if buildingSpaces.length === 0}
							<div class="rounded-md border border-dashed p-4 text-sm">
								<p class="font-medium">No spaces in this building</p>
								<p class="text-muted-foreground mt-1">
									Add spaces before this building can be used by the timetable
									generator.
								</p>
							</div>
						{:else}
							<div class="overflow-hidden rounded-md border">
								<Table>
									<TableHeader>
										<TableRow class="bg-muted/40">
											<TableHead>Space</TableHead>
											<TableHead>Type</TableHead>
											<TableHead class="text-right">Capacity</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each buildingSpaces as space (space.id)}
											<TableRow>
												<TableCell class="font-medium">{space.name}</TableCell>
												<TableCell>
													<Badge variant="outline">
														{formatSpaceType(space.type)}
													</Badge>
												</TableCell>
												<TableCell class="text-muted-foreground text-right">
													{getCapacityLabel(space.capacity)}
												</TableCell>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
