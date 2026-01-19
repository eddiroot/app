<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import StandardsTable from './component/StandardsTable.svelte';

	let { data } = $props();

	// Track selected curriculum and subject
	let selectedCurriculumId = $state<number | null>(null);
	let selectedSubjectId = $state<number | null>(null);

	// Get curriculum subjects when a curriculum is selected
	let curriculumSubjects = $derived(
		selectedCurriculumId
			? data.curriculumSubjects.filter(() => data.selectedCurriculum?.id === selectedCurriculumId) 
			: []
	);

	function handleCurriculumSelect(curriculumId: number) {
		selectedCurriculumId = curriculumId;
		selectedSubjectId = null;
		// Update URL to fetch curriculum subjects
		goto(`?curriculumId=${curriculumId}`, { replaceState: true, keepFocus: true });
	}

	function handleSubjectSelect(subjectId: number) {
		selectedSubjectId = subjectId;
	}

	// Sync selected curriculum from URL data
	$effect(() => {
		if (data.selectedCurriculum?.id) {
			selectedCurriculumId = data.selectedCurriculum.id;
		}
	});
</script>

<svelte:head>
	<title>Curriculum Alignment - {data.subjectOffering?.subject?.name || 'Subject'}</title>
</svelte:head>

<!-- Main Content -->
<div class="min-h-[calc(100vh-4rem)] p-4">
	{#if data.currentCurriculumSubjectInfo}
		<!-- Already aligned - show simple display without card -->
        <div class="flex w-full items-start justify-between pt-4">
			<h1 class="text-foreground text-3xl font-bold ">
				{data.currentCurriculumSubjectInfo.curriculum.name} {data.currentCurriculumSubjectInfo.curriculumSubject.name} {data.yearLevel ? `Year ${data.yearLevel.replace('year', '')}` : ''} Curriculum
			</h1>
            <form method="POST" action="?/removeCurriculum">
                <Button variant="outline" size="sm" type="submit">
                    Change Curriculum
                </Button>
            </form>
		</div>

		<!-- Standards Table -->
		{#if data.curriculumData}
			<StandardsTable 
				curriculumData={data.curriculumData} 
				courseMapItems={data.courseMapItems}
				standardMappings={data.standardMappings}
			/>
		{:else}
			<p class="text-muted-foreground mt-4">No curriculum data available for this year level.</p>
		{/if}
	{:else}
		<!-- Alignment form -->
		<div class="flex justify-center">
		<Card.Root class="flex h-[700px] w-full max-w-4xl flex-col">
			<Card.Header class="shrink-0 pt-4 text-center">
				<Card.Title class="text-2xl">Align your Subject with a Curriculum</Card.Title>
			</Card.Header>
			<Card.Content class="flex-1 space-y-4">
				<!-- Curriculum Selection -->
				<div class="flex flex-wrap justify-center gap-2">
					{#each data.curriculums as curriculum (curriculum.id)}
						<Card.Root
							class="cursor-pointer transition-all hover:shadow-md {selectedCurriculumId === curriculum.id ? 'border-primary border-2' : ''}"
							onclick={() => handleCurriculumSelect(curriculum.id)}
						>
							<Card.Content class="flex items-center justify-center px-4 py-3">
								<span class="text-center text-sm font-medium">{curriculum.name}</span>
							</Card.Content>
						</Card.Root>
					{/each}
				</div>

				<!-- Curriculum Subjects Section -->
				{#if selectedCurriculumId && data.curriculumSubjects.length > 0}
					<div>
						<h3 class="mb-3 text-center text-sm font-medium">Curriculum Subjects</h3>
						<div class="flex flex-wrap items-center justify-center gap-2">
							{#each data.curriculumSubjects as curriculumSubject (curriculumSubject.id)}
								<Card.Root
									class="cursor-pointer transition-all hover:shadow-md {selectedSubjectId === curriculumSubject.id ? 'border-primary border-2' : ''}"
									onclick={() => handleSubjectSelect(curriculumSubject.id)}
								>
									<Card.Content class="flex items-center justify-center px-3 py-2">
										<span class="text-center text-sm">{curriculumSubject.name}</span>
									</Card.Content>
								</Card.Root>
							{/each}
						</div>
					</div>
				{/if}
			</Card.Content>
			<Card.Footer class="shrink-0 justify-end px-6 py-3">
				<form method="POST" action="?/alignCurriculum">
					<input type="hidden" name="curriculumSubjectId" value={selectedSubjectId ?? ''} />
					<Button type="submit" size="sm" disabled={!selectedSubjectId}>
						Align
					</Button>
				</form>
			</Card.Footer>
		</Card.Root>
		</div>
	{/if}
</div>
