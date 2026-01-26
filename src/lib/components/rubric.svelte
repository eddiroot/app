<script lang="ts">
	interface RubricData {
		rubric: { id: number; title: string; description?: string | null };
		rows: Array<{
			row: { id: number; title: string };
			cells: Array<{
				id: number;
				level: 'exemplary' | 'accomplished' | 'developing' | 'beginning';
				description: string;
				marks: number;
			}>;
		}>;
	}

	let { rubricData }: { rubricData: RubricData } = $props();
</script>

<div class="bg-background overflow-hidden rounded-lg border shadow-sm">
	<!-- Rubric Header -->
	<div class="bg-muted/30 border-b p-6">
		<h3 class="text-xl font-bold">{rubricData.rubric.title}</h3>
		{#if rubricData.rubric.description}
			<p class="text-muted-foreground mt-2 text-sm">
				{rubricData.rubric.description}
			</p>
		{/if}
	</div>

	<!-- Rubric Content -->
	<div class="p-6">
		<!-- Performance Level Headers -->
		<div class="bg-muted/50 mb-6 grid grid-cols-5 gap-4 rounded-lg border p-3">
			<div class="text-sm font-semibold">Rubric Criteria</div>
			<div class="text-center text-sm font-semibold">Exemplary</div>
			<div class="text-center text-sm font-semibold">Accomplished</div>
			<div class="text-center text-sm font-semibold">Developing</div>
			<div class="text-center text-sm font-semibold">Beginning</div>
		</div>

		<!-- Rubric Rows -->
		<div class="space-y-4">
			{#each rubricData.rows as { row, cells }}
				<div class="grid grid-cols-5 gap-4">
					<!-- Criteria Title -->
					<div
						class="bg-muted/30 flex items-center justify-center rounded-lg border p-3 text-center text-sm font-medium"
					>
						{row.title}
					</div>

					<!-- Performance Level Cards -->
					{#each ['exemplary', 'accomplished', 'developing', 'beginning'] as level}
						{@const cell = cells.find((c) => c.level === level)}
						<div class="bg-card min-h-[100px] rounded-lg border p-3">
							{#if cell}
								<div class="space-y-2">
									<p class="text-muted-foreground text-sm leading-relaxed">
										{cell.description}
									</p>
									<div
										class="text-foreground/70 mt-2 border-t pt-2 text-xs font-medium"
									>
										{cell.marks}
										{cell.marks === 1 ? 'mark' : 'marks'}
									</div>
								</div>
							{:else}
								<p class="text-muted-foreground text-center text-sm italic">
									Not defined
								</p>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>
