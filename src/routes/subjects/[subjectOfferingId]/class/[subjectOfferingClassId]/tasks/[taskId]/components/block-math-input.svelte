<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { ViewMode, type MathInputBlockProps } from '$lib/schema/task';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import SigmaIcon from '@lucide/svelte/icons/sigma';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import 'mathlive';
	import type { MathfieldElement } from 'mathlive';
	import { on } from 'svelte/events';

	let {
		config,
		onConfigUpdate,
		response,
		onResponseUpdate,
		viewMode,
	}: MathInputBlockProps = $props();

	let activeTab = $state<
		'basic' | 'functions' | 'greek' | 'calculus' | 'advanced'
	>('basic');
	let studentActiveTab = $state<
		'basic' | 'functions' | 'greek' | 'calculus' | 'advanced'
	>('basic');
	let activeMathField = $state<'question' | 'answer'>('question');
	let lastFocusedField = $state<MathfieldElement | null>(null);

	const initMathField = (
		node: MathfieldElement,
		params: {
			getValue: () => string;
			setValue: (val: string) => void;
			readonly?: boolean;
		},
	) => {
		$effect(() => {
			const val = params.getValue();
			if (val !== undefined && node.value !== val) {
				node.value = val;
			}
		});

		$effect(() => {
			return on(node, 'input', () => {
				params.setValue(node.value);
			});
		});

		$effect(() => {
			return on(node, 'focus', () => {
				lastFocusedField = node;
			});
		});

		// Configure the mathfield
		node.setAttribute('virtual-keyboard-mode', 'off');
		node.smartMode = true;
		node.smartFence = true;
		node.smartSuperscript = true;
		node.readOnly = params.readonly || false;

		// Set as last focused if not readonly
		if (!params.readonly) {
			lastFocusedField = node;
		}
	};

	function isAnswerCorrect(): boolean {
		if (!config.answer || !response.answer) return false;
		return config.answer.trim() === response.answer.trim();
	}

	function insertSymbol(symbol: string) {
		if (lastFocusedField && !lastFocusedField.readOnly) {
			lastFocusedField.insert(symbol);
			lastFocusedField.focus();
		}
	}
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.CONFIGURE}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<SigmaIcon />
					Configure Math Input Block
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div class="space-y-2">
					<Label for="text-input">Instruction Text</Label>
					<Textarea
						id="text-input"
						class="min-h-[80px]"
						placeholder="Enter instructions or context for this math problem..."
						value={config.text}
						oninput={(e) =>
							onConfigUpdate({ ...config, text: e.currentTarget.value })}
					/>
					<p class="text-muted-foreground text-xs">
						Provide instructions or context that will be shown to students
						before the question.
					</p>
				</div>

				<div class="space-y-2">
					<Label>Math Symbols</Label>
					<Tabs.Root bind:value={activeTab}>
						<Tabs.List>
							<Tabs.Trigger value="basic">± × ÷</Tabs.Trigger>
							{#if config.advancedMathSymbols}
								<Tabs.Trigger value="functions">sin cos</Tabs.Trigger>
								<Tabs.Trigger value="greek">π α β</Tabs.Trigger>
								<Tabs.Trigger value="calculus">∫ d/dx</Tabs.Trigger>
								<Tabs.Trigger value="advanced">∑ ∞ √</Tabs.Trigger>
							{/if}

							<!-- Toggle advanced symbols button aligned with the tab triggers -->
							<Button
								type="button"
								variant="ghost"
								class="ml-auto"
								aria-pressed={config.advancedMathSymbols}
								aria-label="Toggle advanced math symbols"
								onclick={() =>
									onConfigUpdate({
										...config,
										advancedMathSymbols: !config.advancedMathSymbols,
									})}
							>
								{#if config.advancedMathSymbols}Hide advanced{:else}Show
									advanced{/if}
							</Button>
						</Tabs.List>
						<Tabs.Content value="basic">
							<div class="min-h-[80px] rounded-lg border p-3">
								<div class="flex flex-wrap gap-1">
									{#each [['+', '+'], ['-', '−'], ['\\times', '×'], ['\\div', '÷'], ['=', '='], ['\\neq', '≠'], ['\\leq', '≤'], ['\\geq', '≥'], ['<', '<'], ['>', '>'], ['\\pm', '±'], ['\\mp', '∓'], ['\\%', '%'], ['\\frac{#0}{#0}', '½'], ['^{#0}', 'x²'], ['_{#0}', 'x₁'], ['\\left(#0\\right)', '( )'], ['\\left[#0\\right]', '[ ]'], ['\\left\\{#0\\right\\}', '{ }']] as [latex, display]}
										<Button
											type="button"
											variant="ghost"
											onclick={() => insertSymbol(latex)}
										>
											{display}
										</Button>
									{/each}
								</div>
							</div>
						</Tabs.Content>

						<Tabs.Content value="functions">
							<div class="min-h-[80px] rounded-lg border p-3">
								<div class="flex flex-wrap gap-1">
									{#each [['\\sin', 'sin'], ['\\cos', 'cos'], ['\\tan', 'tan'], ['\\csc', 'csc'], ['\\sec', 'sec'], ['\\cot', 'cot'], ['\\arcsin', 'sin⁻¹'], ['\\arccos', 'cos⁻¹'], ['\\arctan', 'tan⁻¹'], ['\\log', 'log'], ['\\ln', 'ln'], ['\\log_{#0}', 'log₁₀'], ['e^{#0}', 'eˣ'], ['\\exp', 'exp']] as [latex, display]}
										<Button
											type="button"
											variant="ghost"
											onclick={() => insertSymbol(latex)}
										>
											{display}
										</Button>
									{/each}
								</div>
							</div>
						</Tabs.Content>

						<Tabs.Content value="greek">
							<div class="min-h-[80px] rounded-lg border p-3">
								<div class="flex flex-wrap gap-1">
									{#each [['\\pi', 'π'], ['\\alpha', 'α'], ['\\beta', 'β'], ['\\gamma', 'γ'], ['\\delta', 'δ'], ['\\epsilon', 'ε'], ['\\theta', 'θ'], ['\\lambda', 'λ'], ['\\mu', 'μ'], ['\\phi', 'φ'], ['\\psi', 'ψ'], ['\\omega', 'ω'], ['\\Delta', 'Δ'], ['\\Theta', 'Θ'], ['\\Phi', 'Φ'], ['\\Omega', 'Ω']] as [latex, display]}
										<Button
											type="button"
											variant="ghost"
											onclick={() => insertSymbol(latex)}
										>
											{display}
										</Button>
									{/each}
								</div>
							</div>
						</Tabs.Content>

						<Tabs.Content value="calculus">
							<div class="min-h-[80px] rounded-lg border p-3">
								<div class="flex flex-wrap gap-1">
									{#each [['\\frac{d}{dx}', 'd/dx'], ['\\frac{\\partial}{\\partial x}', '∂/∂x'], ['\\int', '∫'], ['\\int_{#0}^{#0}', '∫ᵃᵇ'], ['\\iint', '∬'], ['\\iiint', '∭'], ['\\oint', '∮'], ['\\lim_{#0}', 'lim'], ['\\lim_{x \\to \\infty}', 'lim x→∞'], ['\\nabla', '∇'], ["f'", "f'"], ["f''", "f''"]] as [latex, display]}
										<Button
											type="button"
											variant="ghost"
											onclick={() => insertSymbol(latex)}
										>
											{display}
										</Button>
									{/each}
								</div>
							</div>
						</Tabs.Content>

						<Tabs.Content value="advanced">
							<div class="min-h-[80px] rounded-lg border p-3">
								<div class="flex flex-wrap gap-1">
									{#each [['\\sum', 'Σ'], ['\\sum_{#0}^{#0}', 'Σⁿₖ₌₁'], ['\\prod', '∏'], ['\\prod_{#0}^{#0}', '∏ⁿₖ₌₁'], ['\\sqrt{#0}', '√'], ['\\sqrt[#0]{#0}', 'ⁿ√'], ['\\infty', '∞'], ['\\emptyset', '∅'], ['\\in', '∈'], ['\\notin', '∉'], ['\\subset', '⊂'], ['\\supset', '⊃'], ['\\cup', '∪'], ['\\cap', '∩'], ['\\land', '∧'], ['\\lor', '∨'], ['\\neg', '¬'], ['\\rightarrow', '→'], ['\\leftrightarrow', '↔'], ['\\begin{pmatrix} #0 & #0 \\\\ #0 & #0 \\end{pmatrix}', '⎛⎞'], ['\\begin{bmatrix} #0 & #0 \\\\ #0 & #0 \\end{bmatrix}', '⎡⎤'], ['\\det', 'det']] as [latex, display]}
										<Button
											type="button"
											variant="ghost"
											onclick={() => insertSymbol(latex)}
										>
											{display}
										</Button>
									{/each}
								</div>
							</div>
						</Tabs.Content>
					</Tabs.Root>

					<p class="text-muted-foreground text-xs">
						Click a symbol to insert it into the focused field.
					</p>
				</div>

				<div class="space-y-2">
					<Label for="question-math">Question</Label>
					<math-field
						data-active={activeMathField === 'question'}
						onfocus={() => (activeMathField = 'question')}
						use:initMathField={{
							getValue: () => config.question || '',
							setValue: (val: string) =>
								onConfigUpdate({ ...config, question: val }),
						}}
						class="math-field"
						style="min-height: 60px;"
					></math-field>
					<p class="text-muted-foreground text-xs">
						Enter your equation using the editor above.
					</p>
				</div>

				<div class="space-y-2">
					<Label for="answer-math">Answer</Label>
					<math-field
						data-active={activeMathField === 'answer'}
						onfocus={() => (activeMathField = 'answer')}
						use:initMathField={{
							getValue: () => config.answer || '',
							setValue: (val: string) =>
								onConfigUpdate({ ...config, answer: val }),
						}}
						class="math-field"
					></math-field>
					<p class="text-muted-foreground text-xs">
						Enter the answer. This will be used to check student responses.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.ANSWER || viewMode === ViewMode.REVIEW}
		<Card.Root>
			<Card.Content class="space-y-4">
				{#if config.text}
					<p>{config.text}</p>
				{/if}

				<div class="text-lg font-medium">
					<math-field
						use:initMathField={{
							getValue: () => config.question || '',
							setValue: () => {},
							readonly: true,
						}}
						class="math-field-readonly"
						style="font-size: 18px;"
					></math-field>
				</div>

				<div class="space-y-2">
					<Label>Your Answer</Label>

					{#if viewMode === ViewMode.ANSWER}
						<Tabs.Root bind:value={studentActiveTab}>
							<Tabs.List>
								<Tabs.Trigger value="basic">± × ÷</Tabs.Trigger>
								{#if config.advancedMathSymbols}
									<Tabs.Trigger value="functions">sin cos</Tabs.Trigger>
									<Tabs.Trigger value="greek">π α β</Tabs.Trigger>
									<Tabs.Trigger value="calculus">∫ d/dx</Tabs.Trigger>
									<Tabs.Trigger value="advanced">∑ ∞ √</Tabs.Trigger>
								{/if}
							</Tabs.List>

							{#each [['basic', [['+', '+'], ['-', '−'], ['\\times', '×'], ['\\div', '÷'], ['=', '='], ['\\neq', '≠'], ['\\leq', '≤'], ['\\geq', '≥'], ['<', '<'], ['>', '>'], ['\\pm', '±'], ['\\frac{#0}{#0}', '½'], ['^{#0}', 'x²'], ['_{#0}', 'x₁'], ['\\left(#0\\right)', '( )']]], ['functions', [['\\sin', 'sin'], ['\\cos', 'cos'], ['\\tan', 'tan'], ['\\log', 'log'], ['\\ln', 'ln']]], ['greek', [['\\pi', 'π'], ['\\alpha', 'α'], ['\\beta', 'β'], ['\\gamma', 'γ'], ['\\theta', 'θ']]], ['calculus', [['\\frac{d}{dx}', 'd/dx'], ['\\int', '∫'], ['\\int_{#0}^{#0}', '∫ᵃᵇ'], ['\\lim_{#0}', 'lim']]], ['advanced', [['\\sqrt{#0}', '√'], ['\\sqrt[#0]{#0}', 'ⁿ√'], ['\\infty', '∞'], ['\\sum', 'Σ'], ['\\sum_{#0}^{#0}', 'Σⁿₖ₌₁']]]] as [tabName, symbols]}
								<Tabs.Content value={tabName as string}>
									<div class="min-h-[60px] rounded border p-2">
										<div class="flex flex-wrap gap-1">
											{#each symbols as [latex, display]}
												<Button
													type="button"
													variant="ghost"
													onclick={() => insertSymbol(latex as string)}
												>
													{display}
												</Button>
											{/each}
										</div>
									</div>
								</Tabs.Content>
							{/each}
						</Tabs.Root>
					{/if}
					<math-field
						use:initMathField={{
							getValue: () => response.answer || '',
							setValue: (val: string) =>
								onResponseUpdate({ ...response, answer: val }),
							readonly: viewMode === ViewMode.REVIEW,
						}}
						class="math-field"
					></math-field>
				</div>

				{#if viewMode === ViewMode.REVIEW}
					<div class="mt-6 rounded-lg border p-4">
						{#if isAnswerCorrect()}
							<div class="flex items-center gap-2 text-green-600">
								<CheckCircleIcon class="h-5 w-5" />
								<span class="font-medium">Correct Answer!</span>
							</div>
							<p class="text-muted-foreground mt-1 text-sm">
								Your mathematical expression matches the expected answer.
							</p>
						{:else}
							<div class="flex items-center gap-2 text-red-600">
								<XCircleIcon class="h-5 w-5" />
								<span class="font-medium">Incorrect Answer</span>
							</div>
							<p class="text-muted-foreground mt-1 text-sm">
								Your answer doesn't match the expected solution.
							</p>
							{#if config.answer}
								<div class="mt-3 rounded-md bg-green-50 p-3">
									<p class="text-sm font-medium text-green-800">
										Expected Answer:
									</p>
									<p class="font-mono text-sm text-green-700">
										{config.answer}
									</p>
								</div>
							{/if}
						{/if}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.PRESENT}
		<Card.Root>
			<Card.Content class="space-y-4 pt-6">
				{#if config.text}
					<p class="text-lg text-gray-700">{config.text}</p>
				{/if}

				<div class="text-2xl font-medium">
					<math-field
						use:initMathField={{
							getValue: () => config.question || '',
							setValue: () => {},
							readonly: true,
						}}
						class="math-field-readonly"
						style="font-size: 24px;"
					></math-field>
				</div>
				<div class="space-y-2">
					<Label>Your Answer</Label>
					<math-field
						use:initMathField={{
							getValue: () => response.answer || '',
							setValue: (val: string) =>
								onResponseUpdate({ ...response, answer: val }),
						}}
						class="math-field"
						style="min-height: 60px; font-size: 18px;"
					></math-field>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<style>
	:global(.math-field) {
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 8px;
		min-height: 40px;
		width: 100%;
		background: var(--card);
		font-size: 16px;
	}

	:global(.math-field:focus-within) {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	:global(.math-field-readonly) {
		border: none;
		padding: 8px;
		background: transparent;
	}
</style>
