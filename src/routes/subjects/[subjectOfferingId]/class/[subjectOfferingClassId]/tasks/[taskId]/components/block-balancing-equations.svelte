<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		ViewMode,
		type BalancingEquationsBlockProps,
		type BlockBalancingEquationsConfig,
	} from '$lib/schema/task';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';

	let {
		config,
		onConfigUpdate,
		response,
		onResponseUpdate,
		viewMode,
	}: BalancingEquationsBlockProps = $props();

	function formatChemical(formula: string): string {
		// Convert chemical formulas to display format with subscripts
		return formula.replace(/(\d+)/g, '<sub>$1</sub>');
	}

	function isEquationBalanced(): boolean {
		if (!response?.coefficients || !config.reactants || !config.products)
			return false;

		// Check if all student answers match the correct coefficients
		for (let index = 0; index < config.reactants.length; index++) {
			const reactant = config.reactants[index];
			if (!reactant.given) {
				const studentAnswer = response.coefficients.reactants[index];
				if (!studentAnswer || studentAnswer !== reactant.coefficient) {
					return false;
				}
			}
		}

		for (let index = 0; index < config.products.length; index++) {
			const product = config.products[index];
			if (!product.given) {
				const studentAnswer = response.coefficients.products[index];
				if (!studentAnswer || studentAnswer !== product.coefficient) {
					return false;
				}
			}
		}

		return true;
	}

	function saveChanges(newConfig: BlockBalancingEquationsConfig) {
		onConfigUpdate(newConfig);
	}

	function addReactant() {
		const newConfig = { ...config };
		newConfig.reactants.push({ formula: '', coefficient: 1, given: false });
		saveChanges(newConfig);
	}

	function addProduct() {
		const newConfig = { ...config };
		newConfig.products.push({ formula: '', coefficient: 1, given: false });
		saveChanges(newConfig);
	}

	function removeReactant(index: number) {
		if (config.reactants.length <= 1) return;
		const newConfig = { ...config };
		newConfig.reactants.splice(index, 1);
		saveChanges(newConfig);
	}

	function removeProduct(index: number) {
		if (config.products.length <= 1) return;
		const newConfig = { ...config };
		newConfig.products.splice(index, 1);
		saveChanges(newConfig);
	}

	async function updateCoefficient(
		type: 'reactants' | 'products',
		index: number,
		value: string,
	) {
		const coefficient = parseInt(value) || 1;
		const newResponse = { ...response };
		if (!newResponse.coefficients) {
			newResponse.coefficients = { reactants: [], products: [] };
		}
		newResponse.coefficients[type][index] = coefficient;
		await onResponseUpdate(newResponse);
	}
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.CONFIGURE}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<FlaskConicalIcon />
					Configure Balancing Block
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div class="space-y-2">
					<Label for="question-text">Question/Instructions</Label>
					<Textarea
						id="question-text"
						value={config.question || ''}
						oninput={(e) => {
							const value = (e.target as HTMLTextAreaElement)?.value;
							if (value !== undefined) {
								const newConfig = { ...config, question: value };
								saveChanges(newConfig);
							}
						}}
						placeholder="Enter instructions for balancing the equation..."
						class="min-h-[60px] resize-none"
					/>
				</div>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<Label>Reactants</Label>
						<Button size="sm" onclick={addReactant}>
							<PlusIcon class="h-4 w-4" />
							Add Reactant
						</Button>
					</div>
					<div class="space-y-3">
						{#each config.reactants as reactant, index}
							<div class="flex items-center gap-3 rounded-lg border p-3">
								<div class="flex-1">
									<Input
										value={reactant.formula}
										oninput={(e) => {
											const value = (e.target as HTMLInputElement)?.value;
											if (value !== undefined) {
												const newConfig = { ...config };
												newConfig.reactants[index].formula = value;
												saveChanges(newConfig);
											}
										}}
										placeholder="Chemical formula (e.g., H2O, CO2)"
										class="w-full"
									/>
								</div>
								<div class="flex items-center gap-2">
									<Label class="text-sm">Coefficient:</Label>
									<Input
										value={reactant.coefficient?.toString() || '1'}
										oninput={(e) => {
											const value =
												parseInt((e.target as HTMLInputElement)?.value) || 1;
											const newConfig = { ...config };
											newConfig.reactants[index].coefficient = value;
											saveChanges(newConfig);
										}}
										placeholder="1"
										class="w-16"
										type="number"
										min="1"
									/>
									<Label class="text-sm">Given:</Label>
									<Checkbox
										checked={reactant.given}
										onchange={(e) => {
											const checked = (e.target as HTMLInputElement)?.checked;
											const newConfig = { ...config };
											newConfig.reactants[index].given = checked || false;
											saveChanges(newConfig);
										}}
									/>
								</div>
								<Button
									variant="destructive"
									disabled={config.reactants.length == 1}
									size="icon"
									onclick={() => removeReactant(index)}
								>
									<TrashIcon class="h-4 w-4" />
								</Button>
							</div>
						{/each}
					</div>
				</div>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<Label>Products</Label>
						<Button size="sm" onclick={addProduct}>
							<PlusIcon class="h-4 w-4" />
							Add Product
						</Button>
					</div>
					<div class="space-y-3">
						{#each config.products as product, index}
							<div class="flex items-center gap-3 rounded-lg border p-3">
								<div class="flex-1">
									<Input
										value={product.formula}
										oninput={(e) => {
											const value = (e.target as HTMLInputElement)?.value;
											if (value !== undefined) {
												const newConfig = { ...config };
												newConfig.products[index].formula = value;
												saveChanges(newConfig);
											}
										}}
										placeholder="Chemical formula (e.g., H2O, CO2)"
										class="w-full"
									/>
								</div>
								<div class="flex items-center gap-2">
									<Label class="text-sm">Coefficient:</Label>
									<Input
										value={product.coefficient?.toString() || '1'}
										oninput={(e) => {
											const value =
												parseInt((e.target as HTMLInputElement)?.value) || 1;
											const newConfig = { ...config };
											newConfig.products[index].coefficient = value;
											saveChanges(newConfig);
										}}
										placeholder="1"
										class="w-16"
										type="number"
										min="1"
									/>
									<Label class="text-sm">Given:</Label>
									<Checkbox
										checked={product.given}
										onchange={(e) => {
											const checked = (e.target as HTMLInputElement)?.checked;
											const newConfig = { ...config };
											newConfig.products[index].given = checked || false;
											saveChanges(newConfig);
										}}
									/>
								</div>
								<Button
									variant="destructive"
									disabled={config.products.length == 1}
									size="icon"
									onclick={() => removeProduct(index)}
								>
									<TrashIcon class="h-4 w-4" />
								</Button>
							</div>
						{/each}
					</div>
				</div>

				<!-- Preview -->
				{#if config.reactants.some((r) => r.formula) && config.products.some((p) => p.formula)}
					<div class="space-y-2">
						<Label>Preview</Label>
						<div class="bg-background rounded-lg border p-4">
							<div class="flex items-center gap-2 font-mono text-lg">
								{#each config.reactants as reactant, index}
									{#if reactant.formula}
										{#if index > 0}<span class="mx-2">+</span>{/if}
										<span class="text-primary">
											{reactant.given ? reactant.coefficient : '_'}
										</span>
										<span>{@html formatChemical(reactant.formula)}</span>
									{/if}
								{/each}
								<span class="mx-4 text-2xl">→</span>
								{#each config.products as product, index}
									{#if product.formula}
										{#if index > 0}<span class="mx-2">+</span>{/if}
										<span class="text-primary">
											{product.given ? product.coefficient : '_'}
										</span>
										<span>{@html formatChemical(product.formula)}</span>
									{/if}
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.ANSWER || viewMode === ViewMode.REVIEW}
		{#if config.reactants.length > 0 && config.products.length > 0}
			<Card.Root>
				<Card.Content>
					{#if config.question}
						<div class="mb-6">
							<h3 class="mb-2 text-lg font-medium">{config.question}</h3>
						</div>
					{/if}

					<div class="mb-6">
						<p class="text-muted-foreground mb-4 text-sm">
							Balance the chemical equation by entering the correct
							coefficients:
						</p>

						<div
							class="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-4 font-mono text-xl"
						>
							{#each config.reactants as reactant, index}
								{#if reactant.formula}
									{#if index > 0}<span class="mx-2">+</span>{/if}
									{#if reactant.given}
										<span class="font-bold text-blue-600"
											>{reactant.coefficient}</span
										>
									{:else}
										<Input
											value={response.coefficients?.reactants[
												index
											]?.toString() || ''}
											oninput={(e) =>
												updateCoefficient(
													'reactants',
													index,
													(e.target as HTMLInputElement).value,
												)}
											disabled={viewMode === ViewMode.REVIEW}
											placeholder="?"
											class="h-8 w-12 border-2 text-center font-bold text-blue-600"
										/>
									{/if}
									<span class="ml-1"
										>{@html formatChemical(reactant.formula)}</span
									>
								{/if}
							{/each}

							<span class="mx-4 text-3xl font-bold">→</span>

							{#each config.products as product, index}
								{#if product.formula}
									{#if index > 0}<span class="mx-2">+</span>{/if}
									{#if product.given}
										<span class="font-bold text-blue-600"
											>{product.coefficient}</span
										>
									{:else}
										<Input
											value={response.coefficients?.products[
												index
											]?.toString() || ''}
											oninput={(e) =>
												updateCoefficient(
													'products',
													index,
													(e.target as HTMLInputElement).value,
												)}
											disabled={viewMode === ViewMode.REVIEW}
											placeholder="?"
											class="h-8 w-12 border-2 text-center font-bold text-blue-600"
										/>
									{/if}
									<span class="ml-1"
										>{@html formatChemical(product.formula)}</span
									>
								{/if}
							{/each}
						</div>
					</div>

					{#if viewMode === ViewMode.ANSWER}
						{#if isEquationBalanced()}
							<div class="rounded-lg border border-green-200 bg-green-50 p-4">
								<div class="flex items-center gap-2 text-green-700">
									<CheckCircleIcon class="h-5 w-5" />
									<span class="font-medium">Equation Balanced!</span>
								</div>
								<p class="mt-1 text-sm text-green-600">
									Great job! The chemical equation is now properly balanced.
								</p>
							</div>
						{:else if response.coefficients}
							<div class="rounded-lg border border-orange-200 bg-orange-50 p-4">
								<div class="flex items-center gap-2 text-orange-700">
									<XCircleIcon class="h-5 w-5" />
									<span class="font-medium">Not Balanced Yet</span>
								</div>
								<p class="mt-1 text-sm text-orange-600">
									Check your coefficients. Make sure the number of each element
									is equal on both sides.
								</p>
							</div>
						{/if}
					{/if}

					{#if viewMode === ViewMode.REVIEW}
						<div class="mt-4 rounded-lg border p-4">
							<div class="flex items-center gap-2">
								{#if isEquationBalanced()}
									<CheckCircleIcon class="h-5 w-5 text-green-600" />
									<span class="font-medium text-green-700"
										>Correctly Balanced</span
									>
								{:else}
									<XCircleIcon class="h-5 w-5 text-red-600" />
									<span class="font-medium text-red-700"
										>Incorrectly Balanced</span
									>
								{/if}
							</div>
							<p class="text-muted-foreground mt-1 text-sm">
								{#if isEquationBalanced()}
									The student successfully balanced the chemical equation.
								{:else}
									The student's answer does not properly balance the chemical
									equation.
								{/if}
							</p>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		{:else}
			<div
				class="flex h-48 w-full items-center justify-center rounded-lg border border-dashed"
			>
				<div class="text-center">
					<FlaskConicalIcon class="text-muted-foreground mx-auto h-12 w-12" />
					<p class="text-muted-foreground mt-2 text-sm">
						No chemical equation created
					</p>
					<p class="text-muted-foreground text-xs">
						Switch to edit mode to create a balancing question
					</p>
				</div>
			</div>
		{/if}
	{:else}
		<!-- PRESENTATION MODE: Placeholder for presentation-specific rendering -->
	{/if}
</div>
