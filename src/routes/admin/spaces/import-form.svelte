<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import { validateCSVFile, type CSVValidationResult } from '$lib/utils';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import {
		fileProxy,
		superForm,
		type Infer,
		type SuperValidated,
	} from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import {
		locationsImportSchema,
		optionalColumns,
		requiredColumns,
		type LocationsImportSchema,
	} from './schema.js';

	type Props = {
		data: SuperValidated<Infer<LocationsImportSchema>>;
		open: boolean;
	};

	let { data, open = $bindable() }: Props = $props();

	let csvValidationResult = $state<CSVValidationResult | null>(null);

	let dataForm = () => data;
	const { form, errors, enhance, submitting } = superForm(dataForm(), {
		validators: zod4(locationsImportSchema),
		resetForm: false,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				invalidateAll();
				open = false;
				csvValidationResult = null;
			}
		},
	});

	function handleDialogClose() {
		if (!$submitting) {
			open = false;
			csvValidationResult = null;
			$form.file = undefined as any;
		}
	}

	const file = fileProxy(form, 'file');

	file.subscribe((files) => {
		if (files && files.length > 0 && files[0].size > 0) {
			validateCSVFile(files[0], requiredColumns, optionalColumns).then(
				(result) => {
					csvValidationResult = result;
				},
			);
		} else {
			csvValidationResult = null;
		}
	});
</script>

<Dialog.Root bind:open onOpenChange={handleDialogClose}>
	<Dialog.Content class="max-w-2xl">
		<form method="POST" enctype="multipart/form-data" use:enhance>
			<Dialog.Header>
				<Dialog.Title>Import Locations from CSV</Dialog.Title>
				<Dialog.Description>
					Upload a CSV file to import locations. The file must contain the
					required columns listed below.
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-6">
				<!-- Required Columns Info -->
				<div class="bg-muted rounded-lg p-4">
					<h4 class="mb-2 text-sm font-medium">Required Columns:</h4>
					<div class="flex flex-wrap gap-2">
						{#each requiredColumns as column}
							<span
								class="bg-primary/10 text-primary ring-primary/20 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
							>
								{column}
							</span>
						{/each}
					</div>
					{#if optionalColumns.length > 0}
						<h4 class="mt-3 mb-2 text-sm font-medium">Optional Columns:</h4>
						<div class="flex flex-wrap gap-2">
							{#each optionalColumns as column}
								<span
									class="bg-secondary/10 text-secondary ring-secondary/20 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
								>
									{column}
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- File Upload -->
				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="csvFile">CSV File</Label>
						<Input
							id="csvFile"
							name="file"
							type="file"
							accept=".csv"
							bind:files={$file}
						/>
					</div>
					{#if $errors.file}
						<div
							class="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md p-3"
						>
							<XIcon class="size-4 shrink-0" />
							<span class="text-sm">{$errors.file}</span>
						</div>
					{/if}

					<!-- Validation Results -->
					{#if csvValidationResult}
						<div class="space-y-3">
							<div class="flex items-center gap-2">
								{#if csvValidationResult.isValid}
									<CheckIcon class="text-primary size-5" />
									<span class="text-primary text-sm font-medium"
										>CSV format is valid</span
									>
								{:else}
									<XIcon class="text-destructive size-5" />
									<span class="text-destructive text-sm font-medium"
										>CSV format has issues</span
									>
								{/if}
							</div>

							{#if csvValidationResult.foundColumns.length > 0}
								<div>
									<h5 class="mb-1 text-sm font-medium">Found Columns:</h5>
									<div class="flex flex-wrap gap-1">
										{#each csvValidationResult.foundColumns as column}
											{@const isRequired = requiredColumns.some(
												(req) => req.toLowerCase() === column.toLowerCase(),
											)}
											{@const isOptional = optionalColumns.some(
												(opt) => opt.toLowerCase() === column.toLowerCase(),
											)}
											<span
												class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset
												{isRequired
													? 'bg-primary/10 text-primary ring-primary/20'
													: isOptional
														? 'bg-secondary/10 text-secondary ring-secondary/20'
														: 'bg-muted text-muted-foreground ring-border'}"
											>
												{column}
											</span>
										{/each}
									</div>
								</div>
							{/if}

							{#if csvValidationResult.missingColumns.length > 0}
								<div>
									<h5 class="text-destructive mb-1 text-sm font-medium">
										Missing Required Columns:
									</h5>
									<div class="flex flex-wrap gap-1">
										{#each csvValidationResult.missingColumns as column}
											<span
												class="bg-destructive/10 text-destructive ring-destructive/20 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
											>
												{column}
											</span>
										{/each}
									</div>
								</div>
							{/if}

							{#if csvValidationResult.extraColumns.length > 0}
								<div>
									<h5 class="text-muted-foreground mb-1 text-sm font-medium">
										Extra Columns (will be ignored):
									</h5>
									<div class="flex flex-wrap gap-1">
										{#each csvValidationResult.extraColumns as column}
											<span
												class="bg-muted text-muted-foreground ring-border inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
											>
												{column}
											</span>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<Dialog.Footer class="mt-4">
				<Button
					variant="outline"
					onclick={handleDialogClose}
					disabled={$submitting}>Cancel</Button
				>
				<Button
					type="submit"
					disabled={!csvValidationResult?.isValid ||
						$submitting ||
						!!$errors.file}
				>
					{#if $submitting}
						Processing...
					{:else}
						Import Locations
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
