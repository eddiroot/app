<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import * as Item from '$lib/components/ui/item';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import SearchIcon from '@lucide/svelte/icons/search';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let filter = $state('');
	let selectedSubjectOfferingOverride = $state<number[] | null>(null);

	let allSubjectOfferingIds = $derived(
		data.subjectsAndOfferingsWithYearLevel.map(
			(subjectAndOffering) => subjectAndOffering.subjectOffering.id,
		),
	);
	let selectedSubjectOfferingIds = $derived(
		selectedSubjectOfferingOverride ?? allSubjectOfferingIds,
	);
	let selectedSubjectOfferingIdSet = $derived(
		new Set(selectedSubjectOfferingIds),
	);
	let selectedCount = $derived(selectedSubjectOfferingIds.length);

	let yearGroups = $derived.by(() => {
		const codes = Array.from(
			new Set(
				data.subjectsAndOfferingsWithYearLevel.map(
					(subjectAndOffering) => subjectAndOffering.yearLevel.code,
				),
			),
		).sort(sortYearLevelCodes);

		return codes.map((code) => ({
			code,
			subjects: data.subjectsAndOfferingsWithYearLevel.filter(
				(subjectAndOffering) => subjectAndOffering.yearLevel.code === code,
			),
		}));
	});

	let filteredYearGroups = $derived.by(() => {
		const query = filter.trim().toLowerCase();

		return yearGroups
			.map((group) => ({
				code: group.code,
				subjects: query
					? group.subjects.filter((subjectAndOffering) =>
							[
								subjectAndOffering.subject.name,
								subjectAndOffering.yearLevel.code,
								subjectAndOffering.subjectOffering.year.toString(),
							]
								.join(' ')
								.toLowerCase()
								.includes(query),
						)
					: group.subjects,
			}))
			.filter((group) => group.subjects.length > 0);
	});

	function sortYearLevelCodes(a: string, b: string) {
		const numericA = Number(a);
		const numericB = Number(b);

		if (!Number.isNaN(numericA) && !Number.isNaN(numericB)) {
			return numericA - numericB;
		}

		return a.localeCompare(b);
	}

	function getSubjectsForYearLevel(code: string) {
		return yearGroups.find((group) => group.code === code)?.subjects ?? [];
	}

	function isYearLevelSelected(code: string) {
		const subjects = getSubjectsForYearLevel(code);
		return (
			subjects.length > 0 &&
			subjects.every((subjectAndOffering) =>
				selectedSubjectOfferingIdSet.has(subjectAndOffering.subjectOffering.id),
			)
		);
	}

	function isYearLevelPartiallySelected(code: string) {
		const subjects = getSubjectsForYearLevel(code);
		return (
			subjects.some((subjectAndOffering) =>
				selectedSubjectOfferingIdSet.has(subjectAndOffering.subjectOffering.id),
			) && !isYearLevelSelected(code)
		);
	}

	function setYearLevelSelected(code: string, checked: boolean) {
		const subjectOfferingIdsForYearLevel = getSubjectsForYearLevel(code).map(
			(subjectAndOffering) => subjectAndOffering.subjectOffering.id,
		);

		if (checked) {
			selectedSubjectOfferingOverride = Array.from(
				new Set([
					...selectedSubjectOfferingIds,
					...subjectOfferingIdsForYearLevel,
				]),
			);
		} else {
			selectedSubjectOfferingOverride = selectedSubjectOfferingIds.filter(
				(id) => !subjectOfferingIdsForYearLevel.includes(id),
			);
		}
	}

	function setSubjectSelected(subjectOfferingId: number, checked: boolean) {
		if (checked) {
			selectedSubjectOfferingOverride = Array.from(
				new Set([...selectedSubjectOfferingIds, subjectOfferingId]),
			);
		} else {
			selectedSubjectOfferingOverride = selectedSubjectOfferingIds.filter(
				(id) => id !== subjectOfferingId,
			);
		}
	}
</script>

<div class="space-y-6 p-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight">Subjects</h1>
			<p class="text-muted-foreground text-sm">
				Choose the subject offerings that should be available while building
				this timetable draft.
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button
				type="button"
				variant="outline"
				onclick={() => (selectedSubjectOfferingOverride = [])}
			>
				Clear
			</Button>
			<Button
				type="button"
				onclick={() =>
					(selectedSubjectOfferingOverride = [...allSubjectOfferingIds])}
			>
				Select all
			</Button>
		</div>
	</div>

	<div class="grid gap-4 md:grid-cols-3">
		<Card.Root>
			<Card.Header
				class="flex flex-row items-center justify-between space-y-0 pb-2"
			>
				<Card.Title class="text-sm font-medium">Subject offerings</Card.Title>
				<div class="bg-primary/10 rounded-lg p-2">
					<BookOpenIcon class="text-primary h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">
					{data.subjectsAndOfferingsWithYearLevel.length}
				</div>
				<p class="text-muted-foreground text-xs">
					Available for this timetable
				</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header
				class="flex flex-row items-center justify-between space-y-0 pb-2"
			>
				<Card.Title class="text-sm font-medium">Year levels</Card.Title>
				<div class="bg-primary/10 rounded-lg p-2">
					<LayersIcon class="text-primary h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{yearGroups.length}</div>
				<p class="text-muted-foreground text-xs">
					Grouped by school year level
				</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header
				class="flex flex-row items-center justify-between space-y-0 pb-2"
			>
				<Card.Title class="text-sm font-medium">Selected</Card.Title>
				<div class="bg-primary/10 rounded-lg p-2">
					<CheckCircle2Icon class="text-primary h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{selectedCount}</div>
				<p class="text-muted-foreground text-xs">
					Included in this draft setup
				</p>
			</Card.Content>
		</Card.Root>
	</div>

	<div class="relative max-w-sm">
		<SearchIcon
			class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
		/>
		<Input bind:value={filter} placeholder="Filter subjects..." class="pl-9" />
	</div>

	{#if data.subjectsAndOfferingsWithYearLevel.length === 0}
		<Card.Root class="border-dashed">
			<Card.Content class="flex flex-col items-center gap-3 py-12 text-center">
				<div
					class="bg-muted flex h-14 w-14 items-center justify-center rounded-full"
				>
					<BookOpenIcon class="text-muted-foreground h-6 w-6" />
				</div>
				<div class="space-y-1">
					<p class="text-lg font-semibold">No subjects found</p>
					<p class="text-muted-foreground max-w-sm text-sm">
						Add active subject offerings for this timetable year before
						selecting subjects here.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if filteredYearGroups.length === 0}
		<Card.Root class="border-dashed">
			<Card.Content class="flex flex-col items-center gap-2 py-10 text-center">
				<SearchIcon class="text-muted-foreground h-6 w-6 opacity-60" />
				<p class="text-sm font-medium">No subjects match your filter</p>
				<p class="text-muted-foreground text-sm">
					Try a different subject or year level.
				</p>
				<Button variant="outline" size="sm" onclick={() => (filter = '')}>
					Clear filter
				</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid gap-4 xl:grid-cols-2">
			{#each filteredYearGroups as group (group.code)}
				<Card.Root>
					<Card.Header class="gap-3">
						<div class="flex items-start justify-between gap-3">
							<div class="flex items-center gap-3">
								<Checkbox
									checked={isYearLevelSelected(group.code)}
									indeterminate={isYearLevelPartiallySelected(group.code)}
									aria-label={`Select all Year ${group.code} subjects`}
									onCheckedChange={(value) =>
										setYearLevelSelected(group.code, Boolean(value))}
								/>
								<div>
									<Card.Title>Year {group.code}</Card.Title>
									<Card.Description>
										{group.subjects.length}
										{group.subjects.length === 1 ? 'subject' : 'subjects'}
									</Card.Description>
								</div>
							</div>
							<Badge variant="secondary">
								{getSubjectsForYearLevel(group.code).filter(
									(subjectAndOffering) =>
										selectedSubjectOfferingIdSet.has(
											subjectAndOffering.subjectOffering.id,
										),
								).length} selected
							</Badge>
						</div>
					</Card.Header>
					<Card.Content class="space-y-2">
						{#each group.subjects as subjectAndOffering (subjectAndOffering.subjectOffering.id)}
							<Item.Root variant="outline" size="sm">
								<Item.Content>
									<div class="flex min-w-0 items-center gap-3">
										<Checkbox
											checked={selectedSubjectOfferingIdSet.has(
												subjectAndOffering.subjectOffering.id,
											)}
											aria-label={`Select ${subjectAndOffering.subject.name}`}
											onCheckedChange={(value) =>
												setSubjectSelected(
													subjectAndOffering.subjectOffering.id,
													Boolean(value),
												)}
										/>
										<div class="min-w-0">
											<Item.Title class="truncate">
												{subjectAndOffering.subject.name}
											</Item.Title>
											<Item.Description>
												Offering year {subjectAndOffering.subjectOffering.year}
											</Item.Description>
										</div>
									</div>
								</Item.Content>
							</Item.Root>
						{/each}
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
