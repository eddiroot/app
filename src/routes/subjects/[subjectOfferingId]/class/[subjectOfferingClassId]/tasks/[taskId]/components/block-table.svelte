<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { ViewMode, type TableBlockProps } from '$lib/schema/task';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TableIcon from '@lucide/svelte/icons/table';

	let { config, onConfigUpdate, viewMode }: TableBlockProps = $props();

	function initialiseData(rows: number, columns: number): string[][] {
		const data: string[][] = [];
		for (let i = 0; i < rows; i++) {
			data[i] = [];
			for (let j = 0; j < columns; j++) {
				if (config.data?.[i]?.[j] !== undefined) {
					data[i][j] = config.data[i][j];
				} else {
					data[i][j] = i === 0 ? `Header ${j + 1}` : '';
				}
			}
		}
		return data;
	}

	async function updateTableSize(newRows: number, newColumns: number) {
		const newData = initialiseData(newRows, newColumns);
		const newConfig = {
			...config,
			rows: Math.max(1, newRows),
			columns: Math.max(1, newColumns),
			data: newData,
		};
		await onConfigUpdate(newConfig);
	}

	async function updateCellData(row: number, col: number, value: string) {
		const newData = [...config.data];
		if (!newData[row]) {
			newData[row] = [];
		}
		newData[row][col] = value;

		const newConfig = { ...config, data: newData };
		await onConfigUpdate(newConfig);
	}

	async function addRow() {
		await updateTableSize(config.rows + 1, config.columns);
	}

	async function removeRow() {
		if (config.rows > 1) {
			await updateTableSize(config.rows - 1, config.columns);
		}
	}

	async function addColumn() {
		await updateTableSize(config.rows, config.columns + 1);
	}

	async function removeColumn() {
		if (config.columns > 1) {
			await updateTableSize(config.rows, config.columns - 1);
		}
	}
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.CONFIGURE}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<TableIcon />
					Configure Table Block
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-6">
				<!-- Title Configuration -->
				<div class="space-y-2">
					<Label for="table-title">Table Title</Label>
					<Input
						id="table-title"
						value={config.title}
						oninput={(e) => {
							const value = (e.target as HTMLInputElement)?.value;
							if (value !== undefined) {
								const newConfig = { ...config, title: value };
								onConfigUpdate(newConfig);
							}
						}}
						placeholder="Enter table title..."
					/>
				</div>

				<!-- Size Controls -->
				<div class="flex gap-4">
					<div class="space-y-2">
						<Label>Rows</Label>
						<div class="flex items-center gap-2">
							<Button
								size="sm"
								variant="outline"
								onclick={removeRow}
								disabled={config.rows <= 1}
							>
								<MinusIcon />
							</Button>
							<span class="min-w-[2rem] text-center">{config.rows}</span>
							<Button size="sm" variant="outline" onclick={addRow}>
								<PlusIcon />
							</Button>
						</div>
					</div>

					<div class="space-y-2">
						<Label>Columns</Label>
						<div class="flex items-center gap-2">
							<Button
								size="sm"
								variant="outline"
								onclick={removeColumn}
								disabled={config.columns <= 1}
							>
								<MinusIcon />
							</Button>
							<span class="min-w-[2rem] text-center">{config.columns}</span>
							<Button size="sm" variant="outline" onclick={addColumn}>
								<PlusIcon />
							</Button>
						</div>
					</div>
				</div>

				<!-- Table Editor -->
				<div class="space-y-2">
					<Label>Table Content</Label>
					<div class="overflow-x-auto">
						<table class="w-full">
							<tbody>
								{#each Array(config.rows) as _, rowIndex}
									<tr>
										{#each Array(config.columns) as _, colIndex}
											<td class="p-1">
												<Input
													value={config.data?.[rowIndex]?.[colIndex] || ''}
													oninput={(e) => {
														const value =
															(e.target as HTMLInputElement)?.value || '';
														updateCellData(rowIndex, colIndex, value);
													}}
													placeholder={rowIndex === 0
														? `Header ${colIndex + 1}`
														: `Cell ${rowIndex + 1}-${colIndex + 1}`}
													class="w-full"
												/>
											</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if viewMode === ViewMode.ANSWER || viewMode === ViewMode.REVIEW || viewMode === ViewMode.PRESENT}
		<div class="group relative">
			{#if config.title || (config.data && config.data.length > 0)}
				<Card.Root>
					<Card.Content>
						{#if config.title}
							<h3 class="mb-4 text-lg font-medium">{config.title}</h3>
						{/if}

						<div class="overflow-x-auto">
							<table class="w-full border-collapse border">
								<tbody>
									{#each config.data || [] as row, rowIndex}
										<tr>
											{#each row as cell}
												<td
													class="border-border border p-3 {rowIndex === 0
														? 'font-semibold'
														: ''}"
												>
													{cell || ''}
												</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</Card.Content>
				</Card.Root>
			{:else}
				<div
					class="flex h-48 w-full items-center justify-center rounded-lg border border-dashed"
				>
					<div class="text-center">
						<TableIcon class="text-muted-foreground mx-auto h-12 w-12" />
						<p class="text-muted-foreground mt-2 text-sm">No table created</p>
						<p class="text-muted-foreground text-xs">
							Please configure this table block in the task editor.
						</p>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
