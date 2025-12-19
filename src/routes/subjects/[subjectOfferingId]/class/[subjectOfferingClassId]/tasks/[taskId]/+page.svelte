<script lang="ts">
	import { page } from '$app/state';
	import { type TaskBlock } from '$lib/server/db/schema';
	import { dndState, draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	// UI Components
	import { Badge } from '$lib/components/ui/badge';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	// Block Components
	import BlockAudio from './components/block-audio.svelte';
	import BlockBalancingEquations from './components/block-balancing-equations.svelte';
	import BlockChoice from './components/block-choice.svelte';
	import BlockClose from './components/block-close.svelte';
	import BlockFillBlank from './components/block-fill-blank.svelte';
	import BlockGraph from './components/block-graph.svelte';
	import BlockHeading from './components/block-heading.svelte';
	import BlockHighlightText from './components/block-highlight-text.svelte';
	import BlockImage from './components/block-image.svelte';
	import BlockMatching from './components/block-matching.svelte';
	import BlockMathInput from './components/block-math-input.svelte';
	import BlockRichText from './components/block-rich-text-editor.svelte';
	import BlockShortAnswer from './components/block-short-answer.svelte';
	import BlockTable from './components/block-table.svelte';
	import BlockVideo from './components/block-video.svelte';
	import BlockWhiteboard from './components/block-whiteboard.svelte';
	// Icons
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import EyeIcon from '@lucide/svelte/icons/eye';

	import {
		createBlock,
		deleteBlock,
		updateBlock,
		updateBlockOrder,
		updateTaskTitle,
		upsertBlockResponse
	} from './client';

	import {
		gradeReleaseEnum,
		quizModeEnum,
		taskBlockTypeEnum,
		taskStatusEnum,
		userTypeEnum
	} from '$lib/enums';
	import {
		blockTypes,
		ViewMode,
		type BlockAudioConfig,
		type BlockBalancingEquationsConfig,
		type BlockChoiceConfig,
		type BlockCloseConfig,
		type BlockFillBlankConfig,
		type BlockGraphConfig,
		type BlockHeadingConfig,
		type BlockHighlightTextConfig,
		type BlockImageConfig,
		type BlockMatchingConfig,
		type BlockMathInputConfig,
		type BlockResponse,
		type BlockRichTextConfig,
		type BlockShortAnswerConfig,
		type BlockTableConfig,
		type BlockVideoConfig,
		type BlockWhiteboardConfig
	} from '$lib/schema/task';
	import { formatTimer } from '$lib/utils';
	import { PencilIcon, SettingsIcon } from '@lucide/svelte';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import PresentationIcon from '@lucide/svelte/icons/presentation';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { quizSettingsFormSchema, startQuizFormSchema, statusFormSchema } from './schema';

	let { data } = $props();

	let blocks = $state(data.blocks);
	let responses = $state<Record<number, any>>({});

	let mouseOverElement = $state<string>('');
	let viewMode = $state<ViewMode>(
		data.user.type == userTypeEnum.student ? ViewMode.ANSWER : ViewMode.CONFIGURE
	);
	let selectedStudent = $state<string | null>(null);
	let showSettings = $state(false);

	let timeRemaining = $state<number>(0);
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	const statusForm = superForm(data.statusForm, {
		validators: zod4(statusFormSchema),
		resetForm: false
	});
	const { form: statusFormData, enhance: statusEnhance } = statusForm;

	const quizSettingsForm = superForm(data.quizSettingsForm, {
		validators: zod4(quizSettingsFormSchema),
		resetForm: false,
		onUpdated: ({ form }) => {
			if (form.valid) {
				showSettings = false;
			}
		}
	});
	const { form: quizSettingsFormData, enhance: quizSettingsEnhance } = quizSettingsForm;

	const startQuizForm = superForm(data.startQuizForm, {
		validators: zod4(startQuizFormSchema),
		resetForm: false
	});
	const { enhance: startQuizEnhance } = startQuizForm;

	const isContentBlocked = $derived(() => {
		if (data.user.type !== userTypeEnum.student) return false;

		if (data.classTask.quizMode === quizModeEnum.none) return false;

		if (!data.isQuizStarted) {
			return true;
		}

		return false;
	});

	$effect(() => {
		const isStudentInQuizMode =
			data.user.type === userTypeEnum.student &&
			(data.classTask.quizMode === quizModeEnum.scheduled ||
				data.classTask.quizMode === quizModeEnum.manual);

		if (isStudentInQuizMode && data.classTask.quizDurationMinutes && data.classTask.quizStartTime) {
			const startTime = new Date(data.classTask.quizStartTime).getTime();
			const durationMs = data.classTask.quizDurationMinutes * 60 * 1000;
			const elapsed = Date.now() - startTime;
			const remaining = Math.max(0, (durationMs - elapsed) / 1000);

			timeRemaining = remaining;

			if (remaining > 0) {
				startTimer();
			}
		}

		return () => {
			if (timerInterval) {
				clearInterval(timerInterval);
			}
		};
	});

	function startTimer() {
		if (timerInterval) clearInterval(timerInterval);

		timerInterval = setInterval(() => {
			timeRemaining -= 1;
		}, 1000);
	}

	$effect(() => {
		blocks.forEach((block) => {
			if (!Object.prototype.hasOwnProperty.call(responses, block.id)) {
				const serverResponse =
					data.user.type === userTypeEnum.student ? data.blockResponses![block.id]?.response : null;
				responses[block.id] = serverResponse || getInitialResponse(block.type);
			}
		});
	});

	function getInitialResponse(blockType: taskBlockTypeEnum): BlockResponse | null {
		switch (blockType) {
			case taskBlockTypeEnum.choice:
				return { answers: [] };
			case taskBlockTypeEnum.fillBlank:
				return { answers: [] };
			case taskBlockTypeEnum.matching:
				return { matches: [] };
			case taskBlockTypeEnum.shortAnswer:
				return { answer: '' };
			case taskBlockTypeEnum.close:
				return { answer: '' };
			case taskBlockTypeEnum.highlightText:
				return { selectedText: [] };
			case taskBlockTypeEnum.graph:
				return { studentPlots: [] };
			case taskBlockTypeEnum.balancingEquations:
				return { coefficients: { reactants: [], products: [] } };
			case taskBlockTypeEnum.mathInput:
				return { answer: '' };
			default:
				return null;
		}
	}

	function getCurrentResponse(blockId: number, blockType: taskBlockTypeEnum) {
		const initialResponse = getInitialResponse(blockType);
		if (!initialResponse) return null;

		if (data.user.type == userTypeEnum.student) {
			return responses[blockId] || data.blockResponses![blockId]?.response || initialResponse;
		}

		if (viewMode === ViewMode.REVIEW && selectedStudent) {
			return data.groupedBlockResponses![selectedStudent]?.[blockId]?.response || initialResponse;
		}

		return responses[blockId] || initialResponse;
	}

	async function handleConfigUpdate(block: TaskBlock, config: any) {
		await updateBlock({ block, config });
		const blockIndex = blocks.findIndex((b) => b.id === block.id);
		if (blockIndex !== -1) {
			blocks[blockIndex] = { ...blocks[blockIndex], config };
		}
	}

	async function handleResponseUpdate(blockId: number, response: any) {
		responses[blockId] = response;

		if (data.user.type !== userTypeEnum.student) return;

		try {
			await upsertBlockResponse(blockId, data.classTask.id, response);
		} catch (error) {
			console.error('Failed to save response:', error);
		}
	}

	const draggedOverClasses = 'border-accent-foreground';
	const notDraggedOverClasses = 'border-bg';

	function resetDndState() {
		dndState.isDragging = false;
		dndState.draggedItem = null;
		dndState.sourceContainer = '';
		dndState.targetContainer = null;
	}

	async function handleDrop(state: DragDropState<TaskBlock>) {
		const { draggedItem, sourceContainer, targetContainer } = state;
		if (!targetContainer) {
			resetDndState();
			return;
		}

		if (sourceContainer === 'blockPalette' && targetContainer.startsWith('task')) {
			const index = blocks.findIndex((b) => b.id.toString() === targetContainer.split('-')[1]);

			const { block } = await createBlock({
				taskId: data.task.id,
				type: draggedItem.type,
				config: draggedItem.config,
				index: targetContainer === 'task-bottom' ? blocks.length : index
			});

			if (!block) {
				alert('Failed to create block. Please try again.');
				resetDndState();
				return;
			}

			if (targetContainer === 'task-bottom') {
				blocks = [...blocks, block];
			} else if (index !== -1) {
				blocks = [...blocks.slice(0, index), block, ...blocks.slice(index)];
			} else {
				alert('Failed to insert block at the correct position. Please try again.');
				resetDndState();
				return;
			}
		}

		// Handle drops from two-column layout to main task
		if (sourceContainer.startsWith('two-column-') && targetContainer.startsWith('task')) {
			const index = blocks.findIndex((b) => b.id.toString() === targetContainer.split('-')[1]);

			const { block } = await createBlock({
				taskId: data.task.id,
				type: draggedItem.type,
				config: draggedItem.config,
				index: targetContainer === 'task-bottom' ? blocks.length : index
			});

			if (!block) {
				alert('Failed to create block. Please try again.');
				resetDndState();
				return;
			}

			if (targetContainer === 'task-bottom') {
				blocks = [...blocks, block];
			} else if (index !== -1) {
				blocks = [...blocks.slice(0, index), block, ...blocks.slice(index)];
			} else {
				alert('Failed to insert block at the correct position. Please try again.');
				resetDndState();
				return;
			}
		}

		if (sourceContainer.startsWith('task') && targetContainer.startsWith('task')) {
			const sourceIndex = draggedItem.index;
			const targetIndex = blocks.findIndex(
				(b) => b.id.toString() === targetContainer.split('-')[1]
			);

			if (targetIndex === -1 || sourceIndex === -1) {
				alert('Failed to find block for drag and drop. Please try again.');
				resetDndState();
				return;
			}

			if (sourceIndex === targetIndex) {
				resetDndState();
				return;
			}

			const newBlocks = [...blocks];
			const [movedBlock] = newBlocks.splice(sourceIndex, 1);

			// Adjust target index if moving downwards (after removing the source item, indices shift)
			const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
			newBlocks.splice(adjustedTargetIndex, 0, movedBlock);

			const finalisedBlocks = newBlocks.map((block, index) => ({
				...block,
				index
			}));

			const blockOrder = finalisedBlocks.map(({ id, index }) => ({
				id,
				index
			}));

			try {
				await updateBlockOrder({ blockOrder });
			} catch (error) {
				blocks = [...blocks];
				alert('Failed to update block order. Please try again.');
				console.error('Error updating block order:', error);
			}

			blocks = finalisedBlocks;
		}

		if (sourceContainer.startsWith('task') && targetContainer === 'blockPalette') {
			const { success } = await deleteBlock(draggedItem.id);
			if (!success) {
				alert('Failed to delete block. Please try again.');
				resetDndState();
				return;
			}
			blocks = blocks.filter((block) => block.id !== draggedItem.id);
		}

		// Handle drops from main task to two-column layout
		if (sourceContainer.startsWith('task') && targetContainer.startsWith('two-column-')) {
			const { success } = await deleteBlock(draggedItem.id);
			if (!success) {
				alert('Failed to move block to column. Please try again.');
				resetDndState();
				return;
			}
			blocks = blocks.filter((block) => block.id !== draggedItem.id);
		}

		resetDndState();
	}
</script>

<div
	class="grid h-full gap-4 p-4 {viewMode === ViewMode.CONFIGURE
		? 'grid-cols-[200px_1fr_300px]'
		: 'grid-cols-[200px_1fr]'}"
>
	<!-- Contents Pane -->
	<div class="flex flex-col gap-2">
		{#if data.user.type !== 'student'}
			<form method="POST" action="?/status" use:statusEnhance>
				<Form.Field form={statusForm} name="status">
					<Form.Control>
						{#snippet children({ props })}
							<Select.Root
								{...props}
								type="single"
								name="status"
								required
								bind:value={$statusFormData.status}
								onValueChange={(value) => {
									if (value) {
										$statusFormData.status = value as any;
										// Auto-submit the form when value changes
										setTimeout(() => {
											const form = document.querySelector(
												'form[action="?/status"]'
											) as HTMLFormElement;
											if (form) form.submit();
										}, 0);
									}
								}}
							>
								<Select.Trigger class="w-full">
									{$statusFormData.status[0].toUpperCase() + $statusFormData.status.slice(1)}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value={taskStatusEnum.draft}>Draft</Select.Item>
									<Select.Item value={taskStatusEnum.published}>Published</Select.Item>
								</Select.Content>
							</Select.Root>
						{/snippet}
					</Form.Control>
				</Form.Field>
			</form>
			<Button
				variant={viewMode === ViewMode.CONFIGURE ? 'secondary' : 'outline'}
				onclick={() => (viewMode = ViewMode.CONFIGURE)}
				size="lg"
			>
				<PencilIcon />
				Edit
			</Button>
			<Button variant="outline" disabled onclick={() => (viewMode = ViewMode.PRESENT)} size="lg">
				<PresentationIcon />
				Present
			</Button>
			<Button
				variant={viewMode === ViewMode.ANSWER ? 'secondary' : 'outline'}
				onclick={() => (viewMode = ViewMode.ANSWER)}
				size="lg"
			>
				<EyeIcon />
				Preview
			</Button>
			<Button
				variant={viewMode === ViewMode.REVIEW ? 'secondary' : 'outline'}
				onclick={() => (viewMode = ViewMode.REVIEW)}
				size="lg"
			>
				<CheckCircleIcon />
				Review
			</Button>
			{#if data.task.type === 'test'}
				<Button variant="outline" onclick={() => (showSettings = true)} size="lg">
					<SettingsIcon />
					Settings
				</Button>
			{/if}
		{/if}
		<Card.Root class="h-full">
			<Card.Header>
				<Card.Title>{viewMode === ViewMode.REVIEW ? 'Students' : 'Content'}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-1">
				{#if viewMode === ViewMode.REVIEW}
					{#each data.responses! as response}
						<Button
							onclick={() => (selectedStudent = response.student.id)}
							size="lg"
							variant={selectedStudent === response.student.id ? 'default' : 'ghost'}
						>
							{response.student.firstName}
							{response.student.lastName}
						</Button>
					{/each}
				{:else}
					{#each blocks.filter((block) => block.type === taskBlockTypeEnum.heading) as block}
						{#if block.type === taskBlockTypeEnum.heading}
							<p class="text-muted-foreground">
								{'-'.repeat((block.config as BlockHeadingConfig).size - 2 || 0)}
								{(block.config as BlockHeadingConfig).text}
							</p>
						{:else}
							<p class="text-muted-foreground">Untitled Heading</p>
						{/if}
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Task Blocks -->
	<Card.Root class="h-full overflow-y-auto">
		<Card.Content class="h-full space-y-4">
			<div class={viewMode === ViewMode.CONFIGURE ? 'ml-[38px]' : ''}>
				<div class="flex items-center gap-4">
					<BlockHeading
						config={{
							text: data.task.title,
							size: 1
						}}
						onConfigUpdate={async (config) =>
							await updateTaskTitle({ taskId: data.task.id, title: config.text })}
						{viewMode}
					/>

					{#if data.isQuizStarted && data.user.type === userTypeEnum.student}
						<div
							class="border-warning bg-warning/10 flex items-center gap-2 rounded-lg border px-3 py-2"
						>
							<ClockIcon class="text-warning h-5 w-5" />
							<span class="text-warning font-mono text-lg font-bold">
								{formatTimer(timeRemaining)}
							</span>
							<span class="text-warning text-sm">remaining</span>
						</div>
					{/if}

					{#if data.user.type === userTypeEnum.teacher && data.classTask.quizMode === quizModeEnum.manual && !data.isQuizStarted && data.classTask.status === 'published'}
						<form method="POST" action="?/startQuiz" use:startQuizEnhance>
							<Button
								type="submit"
								size="lg"
								class="bg-success text-success-foreground hover:bg-success/90"
							>
								<ClockIcon class="mr-2 h-4 w-4" />
								Start Quiz
							</Button>
						</form>
					{/if}
				</div>

				{#if page.url.searchParams.get('submitted') === 'true'}
					<div class="mt-4">
						<Badge
							variant="default"
							class="border-success bg-success/10 text-success flex w-fit items-center gap-2"
						>
							<CheckCircleIcon />
							Task submitted successfully!
						</Badge>
					</div>
				{/if}
			</div>
			<div class="flex h-full flex-col">
				{#if isContentBlocked()}
					<div class="flex h-full flex-col items-center justify-center">
						<ClockIcon class="text-primary mx-auto mb-4 h-12 w-12" />
						<h3 class="mb-4 text-xl font-semibold">Quiz Not Available</h3>
						{#if data.classTask.quizMode === quizModeEnum.scheduled && data.classTask.quizStartTime}
							{@const startTime = new Date(data.classTask.quizStartTime)}
							{@const now = new Date()}
							{@const timeDiff = startTime.getTime() - now.getTime()}
							<p class="text-muted-foreground mb-4">This quiz will become available at:</p>
							<div class="bg-primary/10 mb-4 rounded-lg p-3">
								<p class="text-primary font-mono text-lg font-bold">
									{startTime.toLocaleString()}
								</p>
							</div>
							{#if timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000}
								{@const hours = Math.floor(timeDiff / (1000 * 60 * 60))}
								{@const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))}
								<div class="bg-warning/10 mb-4 rounded-lg p-3">
									<p class="text-warning text-sm font-medium">
										Available in: {hours}h {minutes}m
									</p>
								</div>
							{/if}
							<p class="text-muted-foreground text-sm">
								The quiz will start automatically at the scheduled time.
							</p>
						{:else if data.classTask.quizMode === quizModeEnum.manual}
							<p class="text-muted-foreground text-sm">
								Please await instructions from your teacher.
							</p>
						{/if}
					</div>
				{:else}
					<!-- Normal Content Rendering -->
					{#each blocks as block}
						<div
							class="ml-[38px] min-h-4 rounded-md {dndState.targetContainer === `task-${block.id}`
								? 'border-accent-foreground my-2 h-8 border border-dashed'
								: ''}"
							use:droppable={{
								container: `task-${block.id}`,
								callbacks: {
									onDrop: handleDrop
								}
							}}
						></div>

						<div
							class="grid {viewMode === ViewMode.CONFIGURE
								? 'grid-cols-[30px_1fr]'
								: 'grid-cols-1'} items-center gap-2"
							role="group"
							onmouseover={() => (mouseOverElement = `task-${block.id}`)}
							onfocus={() => (mouseOverElement = `task-${block.id}`)}
						>
							{#if viewMode === ViewMode.CONFIGURE && mouseOverElement === `task-${block.id}`}
								<div
									use:draggable={{
										container: 'task',
										dragData: block
									}}
									class="group hover:bg-muted relative flex h-6 w-6 cursor-grab items-center justify-center rounded transition-colors active:cursor-grabbing"
								>
									<GripVerticalIcon
										class="text-muted-foreground group-hover:text-foreground h-3 w-3 rounded transition-colors"
									/>
								</div>
							{:else if viewMode === ViewMode.CONFIGURE}
								<div></div>
							{/if}
							<div>
								{#if block.type === taskBlockTypeEnum.heading}
									<BlockHeading
										config={block.config as BlockHeadingConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										{viewMode}
									/>
								{:else if block.type === taskBlockTypeEnum.richText}
									<BlockRichText
										config={block.config as BlockRichTextConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										{viewMode}
									/>
								{:else if block.type === taskBlockTypeEnum.whiteboard}
									<BlockWhiteboard
										blockId={block.id}
										config={block.config as BlockWhiteboardConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										{viewMode}
									/>
								{:else if block.type === taskBlockTypeEnum.choice}
									<BlockChoice
										config={block.config as BlockChoiceConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										response={getCurrentResponse(block.id, block.type)}
										onResponseUpdate={async (response) =>
											await handleResponseUpdate(block.id, response)}
										{viewMode}
									/>
								{:else if block.type === taskBlockTypeEnum.fillBlank}
									<BlockFillBlank
										config={block.config as BlockFillBlankConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										response={getCurrentResponse(block.id, block.type)}
										onResponseUpdate={async (response) =>
											await handleResponseUpdate(block.id, response)}
										{viewMode}
									/>
								{:else if block.type === taskBlockTypeEnum.matching}
									<BlockMatching
										config={block.config as BlockMatchingConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										response={getCurrentResponse(block.id, block.type)}
										onResponseUpdate={async (response) =>
											await handleResponseUpdate(block.id, response)}
										{viewMode}
									/>
								{:else if block.type === taskBlockTypeEnum.shortAnswer}
									<BlockShortAnswer
										config={block.config as BlockShortAnswerConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										response={getCurrentResponse(block.id, block.type)}
										onResponseUpdate={async (response) =>
											await handleResponseUpdate(block.id, response)}
										{viewMode}
									/>
								{:else if block.type === taskBlockTypeEnum.close}
									<BlockClose
										config={block.config as BlockCloseConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										response={getCurrentResponse(block.id, block.type)}
										onResponseUpdate={async (response) =>
											await handleResponseUpdate(block.id, response)}
										{viewMode}
									/>
								{:else if block.type === taskBlockTypeEnum.highlightText}
									<BlockHighlightText
										config={block.config as BlockHighlightTextConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										response={getCurrentResponse(block.id, block.type)}
										onResponseUpdate={async (response) =>
											await handleResponseUpdate(block.id, response)}
										{viewMode}
									/>
								{:else if block.type === taskBlockTypeEnum.table}
									<BlockTable
										config={block.config as BlockTableConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										{viewMode}
									/>
								{:else if block.type === taskBlockTypeEnum.graph}
									<BlockGraph
										config={block.config as BlockGraphConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										response={getCurrentResponse(block.id, block.type)}
										onResponseUpdate={async (response) =>
											await handleResponseUpdate(block.id, response)}
										{viewMode}
									/>
								{:else if block.type === taskBlockTypeEnum.balancingEquations}
									<BlockBalancingEquations
										config={block.config as BlockBalancingEquationsConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										response={getCurrentResponse(block.id, block.type)}
										onResponseUpdate={async (response) =>
											await handleResponseUpdate(block.id, response)}
										{viewMode}
									/>
								{:else if block.type === taskBlockTypeEnum.mathInput}
									<BlockMathInput
										config={block.config as BlockMathInputConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										response={getCurrentResponse(block.id, block.type)}
										onResponseUpdate={async (response) =>
											await handleResponseUpdate(block.id, response)}
										{viewMode}
									/>
								{:else if block.type === taskBlockTypeEnum.audio}
									<BlockAudio
										config={block.config as BlockAudioConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										{viewMode}
									/>
								{:else if block.type === taskBlockTypeEnum.image}
									<BlockImage
										config={block.config as BlockImageConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										{viewMode}
									/>
								{:else if block.type === taskBlockTypeEnum.video}
									<BlockVideo
										config={block.config as BlockVideoConfig}
										onConfigUpdate={async (config) => await handleConfigUpdate(block, config)}
										{viewMode}
									/>
								{:else}
									<p>Block of type {block.type} is not yet implemented.</p>
								{/if}
							</div>
						</div>
					{/each}
					{#if viewMode === ViewMode.CONFIGURE}
						<div
							use:droppable={{
								container: `task-bottom`,
								callbacks: {
									onDrop: handleDrop
								}
							}}
							class="my-4 ml-[38px] flex min-h-24 items-center justify-center rounded-lg border border-dashed transition-colors {dndState.targetContainer ===
							'task-bottom'
								? draggedOverClasses
								: notDraggedOverClasses}"
						>
							<span class="text-muted-foreground text-sm">Add more blocks here</span>
						</div>
					{/if}
				{/if}
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Block Pane -->
	{#if viewMode === ViewMode.CONFIGURE}
		<div class="flex flex-col gap-4">
			<Card.Root class="h-full">
				<Card.Header>
					<Card.Title class="text-lg">Task Blocks</Card.Title>
					<Card.Description>
						Drag and drop blocks from the palette to the task content area. If you'd like to delete
						a block, simply drag it to the area below.
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex h-full flex-col gap-4">
					<div
						class="grid grid-cols-2 gap-3 rounded-lg p-2 {(dndState.sourceContainer.startsWith(
							'task'
						) ||
							dndState.sourceContainer.startsWith('two-column-')) &&
						dndState.targetContainer === 'blockPalette'
							? 'border-destructive border border-dashed'
							: notDraggedOverClasses}"
						use:droppable={{
							container: `blockPalette`,
							callbacks: {
								onDrop: handleDrop
							}
						}}
					>
						{#each blockTypes as { type, name, initialConfig, icon }}
							{@const Icon = icon}
							<div
								class="flex flex-col items-center justify-center gap-1 {buttonVariants({
									variant: 'outline'
								})} aspect-square h-18 w-full"
								use:draggable={{
									container: 'blockPalette',
									dragData: { type, config: initialConfig, id: 0 }
								}}
							>
								<Icon class="size-8" />
								<span class="text-center text-xs leading-tight">{name}</span>
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	{/if}
</div>

<Dialog.Root bind:open={showSettings}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>Settings</Dialog.Title>
			<Dialog.Description>Configure timing and grading settings for this task.</Dialog.Description>
		</Dialog.Header>

		<form method="POST" action="?/updateQuizSettings" class="space-y-4" use:quizSettingsEnhance>
			<!-- Quiz Mode -->
			<Form.Field form={quizSettingsForm} name="quizMode">
				<Form.Control>
					{#snippet children({ props })}
						<div class="space-y-2">
							<Label for="quizMode">Quiz Mode</Label>
							<Select.Root
								{...props}
								type="single"
								name="quizMode"
								bind:value={$quizSettingsFormData.quizMode}
							>
								<Select.Trigger>
									{#if $quizSettingsFormData.quizMode === quizModeEnum.none}
										Regular Task
									{:else if $quizSettingsFormData.quizMode === quizModeEnum.scheduled}
										Scheduled Start
									{:else if $quizSettingsFormData.quizMode === quizModeEnum.manual}
										Manual Start
									{:else}
										Select quiz mode
									{/if}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value={quizModeEnum.none}>Regular Task</Select.Item>
									<Select.Item value={quizModeEnum.scheduled}>Scheduled Start</Select.Item>
									<Select.Item value={quizModeEnum.manual}>Manual Start</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			{#if $quizSettingsFormData.quizMode === quizModeEnum.scheduled}
				<!-- Scheduled Start Time -->
				<Form.Field form={quizSettingsForm} name="quizStartTime">
					<Form.Control>
						{#snippet children({ props })}
							<div class="space-y-2">
								<Label for="quizStartTime">Start Time</Label>
								<Input
									{...props}
									type="datetime-local"
									name="quizStartTime"
									bind:value={$quizSettingsFormData.quizStartTime}
									required
								/>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			{/if}

			{#if $quizSettingsFormData.quizMode !== quizModeEnum.none}
				<!-- Quiz Duration -->
				<Form.Field form={quizSettingsForm} name="quizDurationMinutes">
					<Form.Control>
						{#snippet children({ props })}
							<div class="space-y-2">
								<Label for="quizDurationMinutes">Duration (minutes)</Label>
								<Input
									{...props}
									type="number"
									name="quizDurationMinutes"
									bind:value={$quizSettingsFormData.quizDurationMinutes}
									min="1"
									max="480"
									required
								/>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Grade Release -->
				<Form.Field form={quizSettingsForm} name="gradeRelease">
					<Form.Control>
						{#snippet children({ props })}
							<div class="space-y-2">
								<Label for="gradeRelease">Grade Release</Label>
								<Select.Root
									{...props}
									type="single"
									name="gradeRelease"
									bind:value={$quizSettingsFormData.gradeRelease}
								>
									<Select.Trigger>
										{#if $quizSettingsFormData.gradeRelease === gradeReleaseEnum.instant}
											Instant
										{:else if $quizSettingsFormData.gradeRelease === gradeReleaseEnum.manual}
											Manual
										{:else if $quizSettingsFormData.gradeRelease === gradeReleaseEnum.scheduled}
											Scheduled
										{:else}
											Select grade release
										{/if}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value={gradeReleaseEnum.instant}>Instant</Select.Item>
										<Select.Item value={gradeReleaseEnum.manual}>Manual</Select.Item>
										<Select.Item value={gradeReleaseEnum.scheduled}>Scheduled</Select.Item>
									</Select.Content>
								</Select.Root>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				{#if $quizSettingsFormData.gradeRelease === gradeReleaseEnum.scheduled}
					<!-- Grade Release Time -->
					<Form.Field form={quizSettingsForm} name="gradeReleaseTime">
						<Form.Control>
							{#snippet children({ props })}
								<div class="space-y-2">
									<Label for="gradeReleaseTime">Grade Release Time</Label>
									<Input
										{...props}
										type="datetime-local"
										name="gradeReleaseTime"
										bind:value={$quizSettingsFormData.gradeReleaseTime}
										required
									/>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				{/if}
			{/if}

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (showSettings = false)}>
					Cancel
				</Button>
				<Button type="submit">Save Settings</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
