<script lang="ts">
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from '$lib/components/ui/table';

	let { data } = $props();
	let allYearLevelCodes = $derived(
		Array.from(
			new Set(
				data.subjectsAndOfferingsWithYearLevel.map(
					(subjectAndOffering) => subjectAndOffering.yearLevel.code,
				),
			),
		),
	);

	let getAllSubjectOfferingIds = () =>
		data.subjectsAndOfferingsWithYearLevel.map(
			(subjectAndOffering) => subjectAndOffering.subjectOffering.id,
		);
	let selectedSubjectOfferingIds = $state<number[]>(getAllSubjectOfferingIds());
</script>

<div class="space-y-4">
	<h1 class="text-2xl leading-tight font-bold">Subjects</h1>
	<div class="grid grid-cols-1 md:grid-cols-2">
		{#each allYearLevelCodes as code}
			<div class="mb-4 space-y-4">
				<h2 class="text-xl leading-tight font-bold">Year {code}</h2>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead
								><Checkbox
									disabled
									checked={data.subjectsAndOfferingsWithYearLevel
										.filter(
											(subjectAndOffering) =>
												subjectAndOffering.yearLevel.code === code,
										)
										.every((subjectAndOffering) =>
											selectedSubjectOfferingIds.includes(
												subjectAndOffering.subjectOffering.id,
											),
										)}
									onCheckedChange={(value) => {
										if (value) {
											const subjectOfferingIdsForYearLevel =
												data.subjectsAndOfferingsWithYearLevel
													.filter(
														(subjectAndOffering) =>
															subjectAndOffering.yearLevel.code === code,
													)
													.map(
														(subjectAndOffering) =>
															subjectAndOffering.subjectOffering.id,
													);
											selectedSubjectOfferingIds = Array.from(
												new Set([
													...selectedSubjectOfferingIds,
													...subjectOfferingIdsForYearLevel,
												]),
											);
										} else {
											selectedSubjectOfferingIds =
												selectedSubjectOfferingIds.filter(
													(subjectOfferingId) =>
														!data.subjectsAndOfferingsWithYearLevel
															.filter(
																(subjectAndOffering) =>
																	subjectAndOffering.yearLevel.code === code,
															)
															.map(
																(subjectAndOffering) =>
																	subjectAndOffering.subjectOffering.id,
															)
															.includes(subjectOfferingId),
												);
										}
									}}
								/></TableHead
							>
							<TableHead>Subject Name</TableHead>
							<TableHead>Year</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each data.subjectsAndOfferingsWithYearLevel.filter((subjectAndOffering) => subjectAndOffering.yearLevel.code === code) as subjectAndOffering}
							<TableRow>
								<TableCell
									><Checkbox
										disabled
										checked={selectedSubjectOfferingIds.includes(
											subjectAndOffering.subjectOffering.id,
										)}
										onCheckedChange={(value) => {
											if (value) {
												selectedSubjectOfferingIds = [
													...selectedSubjectOfferingIds,
													subjectAndOffering.subjectOffering.id,
												];
											} else {
												selectedSubjectOfferingIds =
													selectedSubjectOfferingIds.filter(
														(id) =>
															id !== subjectAndOffering.subjectOffering.id,
													);
											}
										}}
									/></TableCell
								>
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
			</div>
		{/each}
	</div>
</div>
