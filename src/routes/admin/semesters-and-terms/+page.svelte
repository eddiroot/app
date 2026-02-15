<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';

	import * as Select from '$lib/components/ui/select';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import TermItem from './term-item.svelte';

	let { data } = $props();

	let semestersWithTerms = $derived(data.semestersWithTerms);
	let selectedYearValue = $derived(new Date().getFullYear().toString());

	const pastAndNextXYears = (x: number) => {
		const currentYear = new Date().getFullYear();
		return Array.from({ length: x * 2 + 1 }, (_, i) => currentYear - x + i).map(
			String,
		);
	};
</script>

<div class="container mx-auto space-y-4">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Semesters & Terms</h1>
		<div class="flex gap-2">
			<Select.Root type="single" name="year" bind:value={selectedYearValue}>
				<Select.Trigger>
					{selectedYearValue}
				</Select.Trigger>
				<Select.Content>
					{#each pastAndNextXYears(5) as year}
						<Select.Item value={year} label={year}>
							{year}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<form method="POST" action="?/createSemester" use:enhance>
				<input type="hidden" name="year" value={selectedYearValue} />
				<Button type="submit">
					<PlusIcon /> Create Semester
				</Button>
			</form>
		</div>
	</div>

	<div class="space-y-4">
		{#each semestersWithTerms.filter((swt) => swt.year.toString() === selectedYearValue) as semester}
			<Card.Root>
				<Card.Header>
					<Card.Title>
						Semester {semester.number} - {semester.year}
					</Card.Title>
					<Card.Action>
						<div class="flex gap-2">
							<form method="POST" action="?/createTerm" use:enhance>
								<input
									type="hidden"
									name="semesterId"
									defaultValue={semester.id}
								/>
								<Button type="submit" variant="outline" size="sm">
									<PlusIcon /> Create Term
								</Button>
							</form>
							<form method="POST" action="?/deleteSemester" use:enhance>
								<input
									type="hidden"
									name="semesterId"
									defaultValue={semester.id}
								/>
								<Button type="submit" variant="destructive" size="sm">
									<Trash2Icon />
								</Button>
							</form>
						</div>
					</Card.Action>
				</Card.Header>
				<Card.Content class="space-y-4">
					{#each semester.terms as term}
						<TermItem {term} />
					{/each}
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</div>
