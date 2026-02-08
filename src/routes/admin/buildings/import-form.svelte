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
		buildingsImportSchema,
		optionalColumns,
		requiredColumns,
		type BuildingsImportSchema,
	} from './schema.js';

	type Props = {
		data: SuperValidated<Infer<BuildingsImportSchema>>;
		open: boolean;
	};

	let { data, open = $bindable() }: Props = $props();

	let csvValidationResult = $state<CSVValidationResult | null>(null);

	let dataFunc = () => data;
	const { form, errors, enhance, submitting } = superForm(dataFunc(), {
		validators: zod4(buildingsImportSchema),
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
				<Dialog.Title>Import Buildings from CSV</Dialog.Title>
				<Dialog.Description>
					Upload a CSV file to import buildings. The file must contain the
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
					<div>
						<Label for="file">CSV File</Label>
						<Input
							id="file"
							name="file"
							type="file"
							accept=".csv,text/csv"
							bind:files={$file}
							class="mt-1"
						/>
						{#if $errors.file}
							<p class="text-destructive mt-1 text-sm">{$errors.file}</p>
						{/if}
					</div>

					<!-- CSV Validation Results -->
					{#if csvValidationResult}
						<div class="rounded-lg border p-4">
							<div class="mb-3 flex items-center gap-2">
								{#if csvValidationResult.isValid}
									<CheckIcon class="size-5 text-green-600" />
									<span class="font-medium text-green-600">CSV is valid</span>
								{:else}
									<XIcon class="size-5 text-red-600" />
									<span class="font-medium text-red-600"
										>CSV validation failed</span
									>
								{/if}
							</div>

							{#if csvValidationResult.missingColumns.length > 0}
								<div class="mb-3">
									<p class="mb-1 text-sm font-medium text-red-600">
										Missing required columns:
									</p>
									<div class="flex flex-wrap gap-1">
										{#each csvValidationResult.missingColumns as column}
											<span
												class="inline-flex items-center rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800"
											>
												{column}
											</span>
										{/each}
									</div>
								</div>
							{/if}

							{#if csvValidationResult.foundColumns.length > 0}
								<div class="mb-3">
									<p class="mb-1 text-sm font-medium text-green-600">
										Found columns:
									</p>
									<div class="flex flex-wrap gap-1">
										{#each csvValidationResult.foundColumns as column}
											<span
												class="inline-flex items-center rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
											>
												{column}
											</span>
										{/each}
									</div>
								</div>
							{/if}

							{#if csvValidationResult.extraColumns.length > 0}
								<div>
									<p class="mb-1 text-sm font-medium text-yellow-600">
										Extra columns (will be ignored):
									</p>
									<div class="flex flex-wrap gap-1">
										{#each csvValidationResult.extraColumns as column}
											<span
												class="inline-flex items-center rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800"
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

			<Dialog.Footer class="mt-6">
				<Button
					type="button"
					variant="outline"
					onclick={handleDialogClose}
					disabled={$submitting}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					disabled={!csvValidationResult?.isValid || $submitting}
				>
					{$submitting ? 'Importing...' : 'Import Buildings'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
