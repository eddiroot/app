<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import type { SchoolTerm } from '$lib/server/db/schema/schools';
	import { formatDate } from '$lib/utils';
	import { Pencil } from '@lucide/svelte';
	import TermDialog from './term-dialog.svelte';

	let { data, form } = $props();

	let semestersWithTerms = $state(form?.semestersWithTerms || data.semestersWithTerms);
	let publicHolidays = $state(form?.publicHolidays || data.publicHolidays);
	let currentYear = $state(form?.currentYear || data.currentYear);
	let selectedYearValue = $derived(currentYear.toString());

	// Dialog states
	let showTermDialog = $state(false);
	let dialogMode = $state<'create' | 'edit'>('create');
	let selectedSemesterId = $state<number>(0);
	let selectedSemesterName = $state('');
	let selectedTerm = $state<SchoolTerm | undefined>(undefined);

	function calculateWeeks(startDate: string, endDate: string) {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
		return diffWeeks;
	}

	// Generate year options (5 years before and after current year)
	const yearOptions = $derived(
		Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).map((year) => ({
			value: year.toString(),
			label: year.toString()
		}))
	);

	const semester1 = $derived(semestersWithTerms.find((s) => s.name?.includes('1')));
	const semester2 = $derived(semestersWithTerms.find((s) => s.name?.includes('2')));

	// Trigger form submission when year changes
	function handleYearChange(newYearValue: string) {
		const newYear = parseInt(newYearValue);
		if (newYear !== currentYear) {
			const formElement = document.querySelector('form[action="?/changeYear"]') as HTMLFormElement;
			if (formElement) {
				const yearInput = formElement.querySelector('input[name="year"]') as HTMLInputElement;
				if (yearInput) {
					yearInput.value = newYear.toString();
				}
				formElement.requestSubmit();
			}
		}
	}

	function openCreateDialog(semesterId: number, semesterName: string) {
		selectedSemesterId = semesterId;
		selectedSemesterName = semesterName;
		selectedTerm = undefined;
		dialogMode = 'create';
		showTermDialog = true;
	}

	function openEditDialog(term: SchoolTerm, semesterName: string) {
		selectedTerm = term;
		selectedSemesterName = semesterName;
		dialogMode = 'edit';
		showTermDialog = true;
	}

	function handleDeleteTerm(termId: number) {
		const formElement = document.querySelector('form[action="?/deleteTerm"]') as HTMLFormElement;
		if (formElement) {
			const termIdInput = formElement.querySelector('input[name="termId"]') as HTMLInputElement;
			if (termIdInput) {
				termIdInput.value = termId.toString();
			}
			formElement.requestSubmit();
		}
	}

	function handleDialogSuccess(resultData?: any) {
		if (
			resultData &&
			typeof resultData === 'object' &&
			'semestersWithTerms' in resultData &&
			'publicHolidays' in resultData &&
			'currentYear' in resultData
		) {
			semestersWithTerms = resultData.semestersWithTerms as typeof semestersWithTerms;
			publicHolidays = (resultData.publicHolidays as typeof publicHolidays) || [];
			currentYear = resultData.currentYear as number;
		}
		showTermDialog = false;
	}
</script>

<div class="container mx-auto space-y-4">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Terms</h1>

		<Select.Root
			type="single"
			name="year"
			value={selectedYearValue}
			onValueChange={handleYearChange}
		>
			<Select.Trigger class="w-[180px]">
				{currentYear}
			</Select.Trigger>
			<Select.Content>
				{#each yearOptions as year (year.value)}
					<Select.Item value={year.value} label={year.label}>
						{year.label}
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<!-- Hidden form for year changes -->
		<form
			method="POST"
			action="?/changeYear"
			class="hidden"
			use:enhance={() => {
				return async ({ result }) => {
					if (
						result.type === 'success' &&
						result.data &&
						typeof result.data === 'object' &&
						'semestersWithTerms' in result.data &&
						'publicHolidays' in result.data &&
						'currentYear' in result.data
					) {
						semestersWithTerms = result.data.semestersWithTerms as typeof semestersWithTerms;
						publicHolidays = (result.data.publicHolidays as typeof publicHolidays) || [];
						currentYear = result.data.currentYear as number;
					}
				};
			}}
		>
			<input type="hidden" name="year" value={currentYear} />
		</form>

		<!-- Hidden form for deleting terms -->
		<form
			method="POST"
			action="?/deleteTerm"
			class="hidden"
			use:enhance={() => {
				return async ({ result }) => {
					if (
						result.type === 'success' &&
						result.data &&
						typeof result.data === 'object' &&
						'semestersWithTerms' in result.data
					) {
						semestersWithTerms = result.data.semestersWithTerms as typeof semestersWithTerms;
						publicHolidays = (result.data.publicHolidays as typeof publicHolidays) || [];
						currentYear = result.data.currentYear as number;
					}
				};
			}}
		>
			<input type="hidden" name="termId" value="" />
			<input type="hidden" name="currentYear" value={currentYear} />
		</form>
	</div>

	<!-- Term Dialog -->
	<TermDialog
		bind:open={showTermDialog}
		onOpenChange={(open) => (showTermDialog = open)}
		mode={dialogMode}
		semesterId={selectedSemesterId}
		semesterName={selectedSemesterName}
		{currentYear}
		term={selectedTerm}
		onSuccess={handleDialogSuccess}
	/>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Semester 1 -->
		<div class="lg:col-span-1">
			<Card.Root>
				<Card.Header>
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<Card.Title class="text-lg">
								Semester 1:
								{#if semester1}
									<span class="text-muted-foreground text-sm font-normal">
										{formatDate(semester1.terms[0].startDate.toString())} - {formatDate(
											semester1.terms[1].endDate.toString()
										)}
									</span>
								{/if}
							</Card.Title>
						</div>
					</div>
				</Card.Header>
				<Card.Content class="space-y-6">
					{#if semester1?.terms && semester1.terms.length > 0}
						{#each semester1.terms as term, index}
							<div class="space-y-2 rounded-lg border p-3">
								<div class="flex items-center justify-between">
									<h3 class="font-semibold">{term.name}</h3>
									<div class="flex gap-1">
										<Button
											size="icon"
											variant="ghost"
											class="h-8 w-8"
											onclick={() => openEditDialog(term, 'Semester 1')}
										>
											<Pencil class="h-4 w-4" />
										</Button>
										<!-- <Button
											size="icon"
											variant="ghost"
											class="h-8 w-8"
											onclick={() => handleDeleteTerm(term.id)}
										>
											<Trash2 class="h-4 w-4" />
										</Button> -->
									</div>
								</div>
								<div class="space-y-1 text-sm">
									<div class="flex justify-between">
										<span class="text-muted-foreground">Start Date:</span>
										<span>{formatDate(term.startDate.toString())}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-muted-foreground">End Date:</span>
										<span>{formatDate(term.endDate.toString())}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-muted-foreground">Total Weeks:</span>
										<span>{calculateWeeks(term.startDate.toString(), term.endDate.toString())}</span
										>
									</div>
								</div>
							</div>
						{/each}
					{:else}
						<p class="text-muted-foreground text-sm">No terms defined for Semester 1</p>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Semester 2 -->
		<div class="lg:col-span-1">
			<Card.Root>
				<Card.Header>
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<Card.Title class="text-lg">
								Semester 2:
								{#if semester2}
									<span class="text-muted-foreground text-sm font-normal">
										{formatDate(semester2.terms[0].startDate.toString())} - {formatDate(
											semester2.terms[1].endDate.toString()
										)}
									</span>
								{/if}
							</Card.Title>
						</div>
					</div>
				</Card.Header>
				<Card.Content class="space-y-6">
					{#if semester2?.terms && semester2.terms.length > 0}
						{#each semester2.terms as term}
							<div class="space-y-2 rounded-lg border p-3">
								<div class="flex items-center justify-between">
									<h3 class="font-semibold">{term.name}</h3>
									<div class="flex gap-1">
										<Button
											size="icon"
											variant="ghost"
											class="h-8 w-8"
											onclick={() => openEditDialog(term, 'Semester 2')}
										>
											<Pencil class="h-4 w-4" />
										</Button>
										<!-- <Button
											size="icon"
											variant="ghost"
											class="h-8 w-8"
											onclick={() => handleDeleteTerm(term.id)}
										>
											<Trash2 class="h-4 w-4" />
										</Button> -->
									</div>
								</div>
								<div class="space-y-1 text-sm">
									<div class="flex justify-between">
										<span class="text-muted-foreground">Start Date:</span>
										<span>{formatDate(term.startDate.toString())}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-muted-foreground">End Date:</span>
										<span>{formatDate(term.endDate.toString())}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-muted-foreground">Total Weeks:</span>
										<span>{calculateWeeks(term.startDate.toString(), term.endDate.toString())}</span
										>
									</div>
								</div>
							</div>
						{/each}
					{:else}
						<p class="text-muted-foreground text-sm">No terms defined for Semester 2</p>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Third Column: School Holidays and Public Holidays -->
		<div class="lg:col-span-1">
			<div class="space-y-6">
				<!-- School Holidays -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">School Holidays</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="space-y-2 text-sm">
							{#if semester1?.terms && semester1.terms.length >= 2}
								<div class="flex justify-between">
									<span class="text-muted-foreground">Term 1-2 Break:</span>
									<span
										>{formatDate(semester1.terms[0].endDate.toString())} - {formatDate(
											semester1.terms[1].startDate.toString()
										)}</span
									>
								</div>
							{/if}
							{#if semester1?.terms && semester2?.terms && semester1.terms.length > 0 && semester2.terms.length > 0}
								<div class="flex justify-between">
									<span class="text-muted-foreground">Mid-year Break:</span>
									<span
										>{formatDate(semester1.terms[semester1.terms.length - 1].endDate.toString())} - {formatDate(
											semester2.terms[0].startDate.toString()
										)}</span
									>
								</div>
							{/if}
							{#if semester2?.terms && semester2.terms.length >= 2}
								<div class="flex justify-between">
									<span class="text-muted-foreground">Term 3-4 Break:</span>
									<span
										>{formatDate(semester2.terms[0].endDate.toString())} - {formatDate(
											semester2.terms[1].startDate.toString()
										)}</span
									>
								</div>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Public Holidays -->
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Public Holidays</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="max-h-[350px] space-y-2 overflow-y-auto">
							{#each publicHolidays as holiday}
								<div class="space-y-1 border-b pb-2 last:border-b-0">
									<p class="text-sm font-medium">{holiday.name}</p>
									<p class="text-muted-foreground text-xs">
										{formatDate(holiday.date)}
									</p>
								</div>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>
</div>
