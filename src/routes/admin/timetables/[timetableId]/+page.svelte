<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types.js';
	import { createTimetableDraftSchema, publishTimetableDraftSchema } from './schema.js';

	let { data }: { data: PageData } = $props();

	let dialogOpen = $state(false);
	let publishDialogOpen = $state(false);

	const createDraftForm = superForm(data.createTimetableForm, {
		validators: zod4(createTimetableDraftSchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				dialogOpen = false;
				if (form.message) {
					toast.success(form.message);
				}
			} else if (form.message) {
				toast.error(form.message);
			}
		}
	});

	const publishDraftForm = superForm(data.publishTimetableDraftForm, {
		validators: zod4(publishTimetableDraftSchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				publishDialogOpen = false;
				if (form.message) {
					toast.success(form.message, {
						description: 'The timetable is now available to students and teachers.'
					});
				}
			} else if (form.message) {
				toast.error(form.message);
			}
		}
	});

	const { form: createFormData, enhance, constraints } = createDraftForm;
	const {
		form: publishFormData,
		enhance: publishEnhance,
		constraints: publishConstraints
	} = publishDraftForm;
</script>

<div class="mb-6 flex items-center justify-between">
	<div>
		<h1 class="text-2xl font-bold">Timetabling</h1>
		<h1 class="text-1xl font-bold">{data.timetable.name}</h1>
	</div>
	<div class="flex gap-2">
		<Dialog.Root bind:open={publishDialogOpen}>
			<Dialog.Trigger class={buttonVariants({ variant: 'default' })}>Publish Draft</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-[500px]">
				<Dialog.Header>
					<Dialog.Title>Publish Timetable Draft</Dialog.Title>
					<Dialog.Description>
						Select a draft to publish. This will make it available to students and teachers.
					</Dialog.Description>
				</Dialog.Header>
				<form method="POST" action="?/publishTimetableDraft" use:publishEnhance>
					<div class="grid gap-4 py-4">
						{#if data.timetableDrafts.length === 0}
							<div class="text-muted-foreground py-8 text-center">
								<p>No drafts available to publish.</p>
								<p class="mt-2 text-sm">Create a draft first to get started.</p>
							</div>
						{:else}
							<Form.Field form={publishDraftForm} name="draftId">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>Select Draft to Publish</Form.Label>
										<div class="max-h-[300px] space-y-2 overflow-y-auto">
											{#each data.timetableDrafts as draft}
												<label
													class="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
													class:bg-muted={$publishFormData.draftId === draft.id}
												>
													<input
														{...props}
														type="radio"
														name="draftId"
														value={draft.id}
														bind:group={$publishFormData.draftId}
														class="h-4 w-4"
													/>
													<div class="flex flex-1 items-center gap-3">
														<CalendarIcon class="text-muted-foreground h-5 w-5" />
														<div class="flex-1">
															<div class="font-medium">{draft.name}</div>
															<div class="text-muted-foreground text-xs">
																Created {draft.createdAt.toLocaleDateString(undefined, {
																	year: 'numeric',
																	month: 'short',
																	day: 'numeric'
																})}
															</div>
														</div>
														{#if draft.isArchived}
															<Badge variant="outline" class="gap-1 text-xs">
																<ArchiveIcon class="h-3 w-3" />
																Archived
															</Badge>
														{/if}
													</div>
												</label>
											{/each}
										</div>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
						{/if}
					</div>
					<Dialog.Footer>
						<Button type="button" variant="outline" onclick={() => (publishDialogOpen = false)}>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={!$publishFormData.draftId || data.timetableDrafts.length === 0}
						>
							Publish Selected Draft
						</Button>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>

		<Dialog.Root bind:open={dialogOpen}>
			<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
				<PlusIcon />
				Create New
			</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-[425px]">
				<Dialog.Header>
					<Dialog.Title>Create New Timetable Draft</Dialog.Title>
				</Dialog.Header>
				<form method="POST" action="?/createTimetableDraft" use:enhance>
					<div class="grid gap-4 py-4">
						<Form.Field form={createDraftForm} name="name">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Name</Form.Label>
									<Input {...props} bind:value={$createFormData.name} placeholder="Version 1.0" />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>
					<Dialog.Footer>
						<Button type="button" variant="outline" onclick={() => (dialogOpen = false)}>
							Cancel
						</Button>
						<Button type="submit" class="gap-2">
							<PlusIcon />
							Create New Draft
						</Button>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>
</div>

{#if data.timetableDrafts.length === 0}
	<Card.Root class="p-8 text-center">
		<Card.Content class="pt-6">
			<CalendarIcon class="text-muted-foreground mx-auto mb-4 h-12 w-12" />
			<Card.Title class="mb-2 text-lg">No drafts yet</Card.Title>
			<Card.Description class="mb-4">
				Get started by creating your first timetable draft for your school.
			</Card.Description>
		</Card.Content>
	</Card.Root>
{:else}
	<div class="grid gap-4">
		{#each data.timetableDrafts as draft}
			<a href={`/admin/timetables/${data.timetable.id}/${draft.id}/times`}>
				<Card.Root>
					<Card.Header class="flex items-center justify-between">
						<div class="flex items-center gap-4">
							<div class="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
								<CalendarIcon class="text-primary h-6 w-6" />
							</div>
							<div class="flex flex-col">
								<Card.Title class="text-lg font-semibold">{draft.name}</Card.Title>
								<div class="mt-1 flex items-center gap-2">
									<Badge variant="secondary" class="text-xs">
										{draft.createdAt.toLocaleDateString(undefined, {
											year: 'numeric',
											month: 'short',
											day: 'numeric'
										})}
									</Badge>
									{#if draft.isArchived}
										<Badge variant="outline" class="gap-1 text-xs">
											<ArchiveIcon class="h-3 w-3" />
											Archived
										</Badge>
									{/if}
								</div>
							</div>
						</div>
					</Card.Header>
				</Card.Root>
			</a>
		{/each}
	</div>
{/if}

<div class="text-muted-foreground mt-8 border-t pt-4 text-center text-sm">Powered by FET</div>
