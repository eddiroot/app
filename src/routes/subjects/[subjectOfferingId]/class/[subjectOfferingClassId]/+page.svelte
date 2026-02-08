<script lang="ts">
	import ResourceCard from '$lib/components/resource-card.svelte';
	import * as Card from '$lib/components/ui/card';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	let { data } = $props();

	const sortedAssessments = $derived(
		data.assessments
			? [...data.assessments].sort(
					(a, b) =>
						new Date(b.task.createdAt).getTime() -
						new Date(a.task.createdAt).getTime(),
				)
			: [],
	);

	const sortedTasks = $derived(
		data.tasks
			? [...data.tasks].sort(
					(a, b) =>
						new Date(b.task.createdAt).getTime() -
						new Date(a.task.createdAt).getTime(),
				)
			: [],
	);

	const sortedResources = $derived(
		data.resources
			? [...data.resources].sort(
					(a, b) =>
						new Date(b.resource.createdAt).getTime() -
						new Date(a.resource.createdAt).getTime(),
				)
			: [],
	);
</script>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-foreground text-3xl font-bold">
				{data.thisSubjectOffering?.name ?? 'Home'}
				{data.thisSubjectOfferingClass.subjectOfferingClass.name}
			</h1>
			<p class="text-muted-foreground mt-1">
				Teacher: {data.thisSubjectOfferingTeachers
					.map(
						(teacher) =>
							`${teacher.teacher.firstName} ${teacher.teacher.lastName}`,
					)
					.join(', ')}
			</p>
		</div>
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
		<!-- Announcements -->
		<Card.Root class="shadow-none xl:col-span-2">
			<Card.Header>
				<Card.Title class="text-lg">Announcements</Card.Title>
			</Card.Header>
			<Card.Content>
				<ScrollArea class="h-64">
					<div class="space-y-2 pr-4">
						{#if data.announcements && data.announcements.length > 0}
							{#each data.announcements as announcement}
								<a
									href={`/subjects/${data.subjectOfferingId}/discussion/${announcement.id}`}
									class="block"
								>
									<div
										class="border-border hover:bg-muted/50 cursor-pointer rounded-lg border p-3 transition-colors"
									>
										<div class="flex flex-col">
											<span class="text-foreground text-base font-semibold"
												>{announcement.title}</span
											>
											<span
												class="text-muted-foreground text-sm leading-relaxed"
												>{announcement.content}</span
											>
											<span class="text-muted-foreground mt-1 text-xs"
												>{new Date(
													announcement.createdAt,
												).toLocaleString()}</span
											>
										</div>
									</div>
								</a>
							{/each}
						{:else}
							<div class="text-muted-foreground text-sm">
								No announcements yet.
							</div>
						{/if}
					</div>
				</ScrollArea>
			</Card.Content>
		</Card.Root>

		<!-- Contact Information -->
		<Card.Root class="shadow-none">
			<Card.Header>
				<Card.Title class="text-lg">Contacts</Card.Title>
			</Card.Header>
			<Card.Content>
				<ScrollArea class="h-64">
					<div class="space-y-2">
						{#each data.thisSubjectOfferingTeachers as teacher}
							<div class="border-border rounded-lg border p-3">
								<h4 class="text-foreground text-sm font-medium">
									{teacher.teacher.firstName}
									{teacher.teacher.lastName}
								</h4>
								<p class="text-muted-foreground mt-1 text-sm">
									{teacher.teacher.email}
								</p>
							</div>
						{/each}
					</div>
				</ScrollArea>
			</Card.Content>
		</Card.Root>

		<!-- Assessments -->
		<Card.Root class="shadow-none">
			<Card.Header>
				<Card.Title class="text-lg">Assessments</Card.Title>
			</Card.Header>
			<Card.Content>
				<ScrollArea class="h-64">
					<div class="space-y-2 pr-4">
						{#if sortedAssessments.length > 0}
							{#each sortedAssessments as assessment}
								<a
									href={`/subjects/${data.subjectOfferingId}/class/${data.subjectOfferingClassId}/tasks/${assessment.task.id}`}
									class="block"
								>
									<div
										class="border-border hover:bg-muted/50 cursor-pointer rounded-lg border p-3 transition-colors"
									>
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<h4 class="text-foreground text-sm font-medium">
													{assessment.task.title}
												</h4>
												{#if assessment.task.description}
													<p
														class="text-muted-foreground mt-1 text-sm leading-relaxed"
													>
														{assessment.task.description}
													</p>
												{/if}
												<div class="mt-1 flex items-center gap-2">
													{#if assessment.subjectOfferingClassTask.due}
														<span class="text-muted-foreground text-xs"
															>Due: {new Date(
																assessment.subjectOfferingClassTask.due,
															).toLocaleDateString()}</span
														>
													{/if}
													<span class="text-muted-foreground text-xs"
														>Created: {new Date(
															assessment.task.createdAt,
														).toLocaleDateString()}</span
													>
												</div>
											</div>
										</div>
									</div>
								</a>
							{/each}
						{:else}
							<div class="text-muted-foreground text-sm">
								No assessments found.
							</div>
						{/if}
					</div>
				</ScrollArea>
			</Card.Content>
		</Card.Root>

		<Card.Root class="shadow-none">
			<Card.Header>
				<Card.Title class="text-lg">Lessons & Homework</Card.Title>
			</Card.Header>
			<Card.Content>
				<ScrollArea class="h-64">
					<div class="space-y-2 pr-4">
						{#if sortedTasks.length > 0}
							{#each sortedTasks as task}
								<a
									href={`/subjects/${data.subjectOfferingId}/class/${data.subjectOfferingClassId}/tasks/${task.task.id}`}
									class="block"
								>
									<div
										class="border-border hover:bg-muted/50 cursor-pointer rounded-lg border p-3 transition-colors"
									>
										<div class="flex flex-col">
											<span class="text-foreground text-base font-semibold"
												>{task.task.title}</span
											>
											{#if task.task.description}
												<p
													class="text-muted-foreground mt-1 text-sm leading-relaxed"
												>
													{task.task.description}
												</p>
											{/if}
											<div class="mt-1 flex items-center gap-2">
												{#if task.task.type}
													<span
														class="bg-secondary text-secondary-foreground rounded px-2 py-1 text-xs"
														>{task.task.type}</span
													>
												{/if}
												{#if task.subjectOfferingClassTask.due}
													<span class="text-muted-foreground text-xs"
														>Due: {new Date(
															task.subjectOfferingClassTask.due,
														).toLocaleDateString()}</span
													>
												{/if}
												<span class="text-muted-foreground text-xs"
													>Created: {new Date(
														task.task.createdAt,
													).toLocaleDateString()}</span
												>
											</div>
										</div>
									</div>
								</a>
							{/each}
						{:else}
							<div class="text-muted-foreground text-sm">
								No lessons or homework found.
							</div>
						{/if}
					</div>
				</ScrollArea>
			</Card.Content>
		</Card.Root>

		<!-- Resources -->
		<Card.Root class="shadow-none">
			<Card.Header>
				<Card.Title class="text-lg">Resources</Card.Title>
			</Card.Header>
			<Card.Content>
				<ScrollArea class="h-64">
					<div class="space-y-2 pr-4">
						{#if sortedResources.length > 0}
							{#each sortedResources as resource}
								<ResourceCard
									resource={{
										id: resource.resource.id,
										fileName:
											resource.resourceRelation.title ||
											resource.resource.fileName,
										fileSize: resource.resource.fileSize,
										fileType: resource.resource.fileType,
									}}
									variant="default"
									showRemoveButton={false}
									onOpen={() => {
										if (resource.downloadUrl) {
											window.open(resource.downloadUrl, '_blank');
										} else {
											alert('Download unavailable');
										}
									}}
								/>
							{/each}
						{:else}
							<div class="text-muted-foreground text-sm">
								No resources found.
							</div>
						{/if}
					</div>
				</ScrollArea>
			</Card.Content>
		</Card.Root>
	</div>
</div>
