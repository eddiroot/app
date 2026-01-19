<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import type { CourseMapItem } from '$lib/server/db/schema/coursemap';
	import type { CurriculumSubjectData } from '$lib/server/db/service/curriculum';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	type Props = {
		curriculumData: CurriculumSubjectData;
		courseMapItems: CourseMapItem[];
		standardMappings: Record<number, number>; // learningAreaStandardId -> courseMapItemId
	};

	let { curriculumData, courseMapItems, standardMappings }: Props = $props();

	// Track expanded state for learning areas and topics
	let expandedLearningAreas = $state(new Set<number>());
	let expandedTopics = $state(new Set<number>());

	// Track topic selections for each standard (standardId -> courseMapItemId)
	// Initialize from server data
	let standardTopicSelections = $state(new Map<number, number>(Object.entries(standardMappings).map(([k, v]) => [parseInt(k), v])));

	// Track pending submissions to show loading state
	let pendingSubmissions = $state(new Set<number>());

	function toggleLearningArea(id: number) {
		const newSet = new Set(expandedLearningAreas);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		expandedLearningAreas = newSet;
	}

	function toggleTopic(id: number) {
		const newSet = new Set(expandedTopics);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		expandedTopics = newSet;
	}

	function handleTopicSelect(standardId: number, value: string | undefined, formElement: HTMLFormElement) {
		const newMap = new Map(standardTopicSelections);
		if (value) {
			newMap.set(standardId, parseInt(value, 10));
		} else {
			newMap.delete(standardId);
		}
		standardTopicSelections = newMap;

		// Add to pending submissions
		pendingSubmissions = new Set([...pendingSubmissions, standardId]);

		// Submit the form
		formElement.requestSubmit();
	}

	function getSelectedCourseMapItem(standardId: number): CourseMapItem | undefined {
		const selectedId = standardTopicSelections.get(standardId);
		return courseMapItems.find((item) => item.id === selectedId);
	}
</script>

<div class="w-full mt-4">
	<Table.Root class="table-fixed w-full border border-border">
		<Table.Header>
			<Table.Row class="bg-muted">
				<Table.Head class="w-[55%] border-r border-border">Description</Table.Head>
				<Table.Head class="w-[12%] border-r border-border text-center">Type</Table.Head>
				<Table.Head class="w-[10%] border-r border-border text-center">Code</Table.Head>
				<Table.Head class="w-[23%]">Topic</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each curriculumData.learningAreas as learningAreaData}
				<!-- Learning Area Row (clickable to expand/collapse) -->
				<Table.Row
					class="cursor-pointer hover:bg-transparent"
					onclick={() => toggleLearningArea(learningAreaData.learningArea.id)}
				>
					<Table.Cell class="font-semibold border-r border-border align-top">
						<div class="flex items-start gap-2">
							<ChevronRight
								class="h-4 w-4 shrink-0 transition-transform duration-200 mt-0.5 {expandedLearningAreas.has(
									learningAreaData.learningArea.id
								)
									? 'rotate-90'
									: ''}"
							/>
							<span class="whitespace-normal">{learningAreaData.learningArea.name}</span>
						</div>
					</Table.Cell>
					<Table.Cell class="border-r border-border align-center text-center">Learning Area</Table.Cell>
					<Table.Cell class="border-r border-border align-top"></Table.Cell>
					<Table.Cell class="align-top"></Table.Cell>
				</Table.Row>

				{#if expandedLearningAreas.has(learningAreaData.learningArea.id)}
					<!-- Topics within Learning Area -->
					{#each learningAreaData.topics as topicData}
						<!-- Topic Row (clickable to expand/collapse) -->
						<Table.Row
							class="cursor-pointer hover:bg-transparent"
							onclick={() => toggleTopic(topicData.topic.id)}
						>
							<Table.Cell class="pl-8 font-medium border-r border-border align-top">
								<div class="flex items-start gap-2">
									<ChevronRight
										class="h-4 w-4 shrink-0 transition-transform duration-200 mt-0.5 {expandedTopics.has(
											topicData.topic.id
										)
											? 'rotate-90'
											: ''}"
									/>
									<span class="whitespace-normal">{topicData.topic.name}</span>
								</div>
							</Table.Cell>
							<Table.Cell class="border-r border-border align-top text-center">LA Topic</Table.Cell>
							<Table.Cell class="border-r border-border align-top"></Table.Cell>
							<Table.Cell class="align-top"></Table.Cell>
						</Table.Row>

						{#if expandedTopics.has(topicData.topic.id)}
							<!-- Standards within Topic -->
							{#each topicData.standardsWithElaborations as standardData}
								{@const selectedItem = getSelectedCourseMapItem(
									standardData.learningAreaStandard.id
								)}
								{@const standardId = standardData.learningAreaStandard.id}
								<Table.Row class="hover:bg-transparent">
									<Table.Cell class="pl-12 border-r border-border align-top whitespace-normal">
										{standardData.learningAreaStandard.description}
									</Table.Cell>
									<Table.Cell class="border-r border-border text-center">Standard</Table.Cell>
									<Table.Cell class="border-r border-border text-center"
										>{standardData.learningAreaStandard.code}</Table.Cell
									>
									<Table.Cell class="p-0">
										<form
											method="POST"
											action="?/setStandardMapping"
											use:enhance={() => {
												return async ({ update }) => {
													pendingSubmissions = new Set([...pendingSubmissions].filter(id => id !== standardId));
													await update({ reset: false });
												};
											}}
											id="form-standard-{standardId}"
										>
											<input type="hidden" name="learningAreaStandardId" value={standardId} />
											<input type="hidden" name="courseMapItemId" value={selectedItem?.id ?? ''} />
											<Select.Root
												type="single"
												value={selectedItem ? String(selectedItem.id) : undefined}
												onValueChange={(value) => {
													const form = document.getElementById(`form-standard-${standardId}`) as HTMLFormElement;
													const input = form.querySelector('input[name="courseMapItemId"]') as HTMLInputElement;
													input.value = value ?? '';
													handleTopicSelect(standardId, value, form);
												}}
											>
												<Select.Trigger
													class="w-full h-full rounded-none border-0 shadow-none bg-transparent dark:bg-transparent hover:bg-muted/50 focus-visible:ring-0 focus-visible:border-0 px-3 py-2 justify-between"
												>
													<span class="flex items-center gap-2 text-sm truncate">
														{#if selectedItem}
															<div
																class="w-3 h-3 rounded-full shrink-0"
																style="background-color: {selectedItem.color}"
															></div>
														{/if}
														{selectedItem?.topic ?? 'Select topic...'}
													</span>
												</Select.Trigger>
												<Select.Content>
													{#each courseMapItems as item}
														<Select.Item value={String(item.id)}>
															<div class="flex items-center gap-2">
																<div
																	class="w-3 h-3 rounded-full shrink-0"
																	style="background-color: {item.color}"
																></div>
																{item.topic}
															</div>
														</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
										</form>
									</Table.Cell>
								</Table.Row>
							{/each}
						{/if}
					{/each}

					<!-- Orphan Standards (directly under learning area, no topic) -->
					{#each learningAreaData.orphanStandards as standardData}
						{@const selectedItem = getSelectedCourseMapItem(
							standardData.learningAreaStandard.id
						)}
						{@const standardId = standardData.learningAreaStandard.id}
						<Table.Row class="hover:bg-transparent">
							<Table.Cell class="pl-8 border-r border-border align-top whitespace-normal">
								{standardData.learningAreaStandard.description}
							</Table.Cell>
							<Table.Cell class="border-r border-border text-center">Standard</Table.Cell>
							<Table.Cell class="border-r border-border text-center"
								>{standardData.learningAreaStandard.code}</Table.Cell
							>
							<Table.Cell class="p-0">
								<form
									method="POST"
									action="?/setStandardMapping"
									use:enhance={() => {
										return async ({ update }) => {
											pendingSubmissions = new Set([...pendingSubmissions].filter(id => id !== standardId));
											await update({ reset: false });
										};
									}}
									id="form-standard-{standardId}"
								>
									<input type="hidden" name="learningAreaStandardId" value={standardId} />
									<input type="hidden" name="courseMapItemId" value={selectedItem?.id ?? ''} />
									<Select.Root
										type="single"
										value={selectedItem ? String(selectedItem.id) : undefined}
										onValueChange={(value) => {
											const form = document.getElementById(`form-standard-${standardId}`) as HTMLFormElement;
											const input = form.querySelector('input[name="courseMapItemId"]') as HTMLInputElement;
											input.value = value ?? '';
											handleTopicSelect(standardId, value, form);
										}}
									>
										<Select.Trigger
											class="w-full h-full rounded-none border-0 shadow-none bg-transparent dark:bg-transparent hover:bg-muted/50 focus-visible:ring-0 focus-visible:border-0 px-3 py-2 justify-between"
										>
											<span class="flex items-center gap-2 text-sm truncate">
												{#if selectedItem}
													<div
														class="w-3 h-3 rounded-full shrink-0"
														style="background-color: {selectedItem.color}"
													></div>
												{/if}
												{selectedItem?.topic ?? 'Select topic...'}
											</span>
										</Select.Trigger>
										<Select.Content>
											{#each courseMapItems as item}
												<Select.Item value={String(item.id)}>
													<div class="flex items-center gap-2">
														<div
															class="w-3 h-3 rounded-full shrink-0"
															style="background-color: {item.color}"
														></div>
														{item.topic}
													</div>
												</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</form>
							</Table.Cell>
						</Table.Row>
					{/each}
				{/if}
			{/each}
		</Table.Body>
	</Table.Root>
</div>
