<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import type { SchoolTerm } from '$lib/server/db/schema/school';
	import TermDialog from './term-dialog.svelte';

	let { data } = $props();

	let semestersWithTerms = $derived(data.semestersWithTerms);
	let selectedYearValue = $derived(data.currentYear.toString());

	// Dialog states
	let showTermDialog = $state(false);
	let dialogMode = $state<'create' | 'edit'>('create');
	let selectedSemesterId = $state<number>(0);
	let selectedSemesterName = $state('');
	let selectedTerm = $state<SchoolTerm | undefined>(undefined);

	// function openEditDialog(term: SchoolTerm, semesterName: string) {
	// 	selectedTerm = term;
	// 	selectedSemesterName = semesterName;
	// 	dialogMode = 'edit';
	// 	showTermDialog = true;
	// }
</script>

<div class="container mx-auto space-y-4">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Terms</h1>

		<Select.Root type="single" name="year" bind:value={selectedYearValue}>
			<Select.Trigger class="w-[180px]">
				{selectedYearValue}
			</Select.Trigger>
			<Select.Content>
				{#each semestersWithTerms
					.map((s) => s.year.toString())
					.filter((item, index, arr) => {
						return arr.indexOf(item) === index;
					}) as year}
					<Select.Item value={year} label={year}>
						{year}
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- Term Dialog -->
	<TermDialog
		bind:open={showTermDialog}
		onOpenChange={(open) => (showTermDialog = open)}
		mode={dialogMode}
		semesterId={selectedSemesterId}
		semesterName={selectedSemesterName}
		term={selectedTerm}
	/>

	List all terms here for the selected year with an edit button and an archive
	button on each.
	{JSON.stringify(semestersWithTerms)}
</div>
