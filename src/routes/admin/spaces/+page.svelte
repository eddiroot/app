<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import DataTableCheckbox from '$lib/components/ui/data-table/data-table-checkbox.svelte';
	import {
		FlexRender,
		createSvelteTable,
		renderComponent,
	} from '$lib/components/ui/data-table/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import {
		type ColumnDef,
		type ColumnFiltersState,
		type RowSelectionState,
		type SortingState,
		type VisibilityState,
		getCoreRowModel,
		getFilteredRowModel,
		getSortedRowModel,
	} from '@tanstack/table-core';
	import ImportForm from './import-form.svelte';

	const { data } = $props();

	const columns: ColumnDef<(typeof data.spaces)[number]>[] = [
		{
			id: 'select',
			header: ({ table }) =>
				renderComponent(DataTableCheckbox, {
					checked: table.getIsAllPageRowsSelected(),
					indeterminate:
						table.getIsSomePageRowsSelected() &&
						!table.getIsAllPageRowsSelected(),
					onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
					'aria-label': 'Select all',
				}),
			cell: ({ row }) =>
				renderComponent(DataTableCheckbox, {
					checked: row.getIsSelected(),
					onCheckedChange: (value) => row.toggleSelected(!!value),
					'aria-label': 'Select row',
				}),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: 'name',
			header: 'Name',
			filterFn: 'includesString',
			size: 200,
		},
		{
			accessorKey: 'type',
			header: 'Type',
			filterFn: 'includesString',
			size: 120,
			cell: ({ getValue }) => {
				const type = getValue() as string;
				return type.charAt(0).toUpperCase() + type.slice(1);
			},
		},
		{
			accessorKey: 'buildingName',
			header: 'Building',
			filterFn: 'includesString',
			size: 150,
		},
		{
			accessorKey: 'campusName',
			header: 'Campus',
			filterFn: 'includesString',
			size: 150,
		},
		{
			accessorKey: 'capacity',
			header: 'Capacity',
			size: 100,
			cell: ({ getValue }) => {
				const capacity = getValue() as number | null;
				return capacity ? capacity.toString() : 'N/A';
			},
		},
		{
			accessorKey: 'description',
			header: 'Description',
			filterFn: 'includesString',
			size: 250,
			cell: ({ getValue }) => {
				const description = getValue() as string | null;
				return description || 'No description';
			},
		},
		{
			accessorKey: 'isArchived',
			header: 'Status',
			size: 100,
			cell: ({ getValue }) => {
				const isArchived = getValue() as boolean;
				return isArchived ? 'Archived' : 'Active';
			},
		},
	];

	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let rowSelection = $state<RowSelectionState>({});
	let columnVisibility = $state<VisibilityState>({ description: false });

	const table = createSvelteTable({
		get data() {
			return data.spaces;
		},
		columns,
		state: {
			get sorting() {
				return sorting;
			},
			get columnVisibility() {
				return columnVisibility;
			},
			get rowSelection() {
				return rowSelection;
			},
			get columnFilters() {
				return columnFilters;
			},
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		onColumnFiltersChange: (updater) => {
			if (typeof updater === 'function') {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		onColumnVisibilityChange: (updater) => {
			if (typeof updater === 'function') {
				columnVisibility = updater(columnVisibility);
			} else {
				columnVisibility = updater;
			}
		},
		onRowSelectionChange: (updater) => {
			if (typeof updater === 'function') {
				rowSelection = updater(rowSelection);
			} else {
				rowSelection = updater;
			}
		},
	});

	let importDialogOpen = $state(false);

	function handleImportClick() {
		importDialogOpen = true;
	}
</script>

<div class="flex h-full flex-col space-y-2">
	<h1 class="text-3xl font-bold tracking-tight">Spaces</h1>
	<div class="flex min-h-0 flex-1 flex-col">
		<div class="flex items-center py-4">
			<Input
				placeholder="Filter spaces..."
				value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
				oninput={(e) =>
					table.getColumn('name')?.setFilterValue(e.currentTarget.value)}
				onchange={(e) => {
					table.getColumn('name')?.setFilterValue(e.currentTarget.value);
				}}
				class="max-w-sm"
			/>
			<div class="ml-auto flex space-x-2">
				<Button variant="outline" onclick={handleImportClick}>
					<UploadIcon class="mr-2 size-4" />
					Import CSV
				</Button>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="outline">
								Columns <ChevronDownIcon class="ml-2 size-4" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						{#each table
							.getAllColumns()
							.filter((col) => col.getCanHide()) as column (column.id)}
							<DropdownMenu.CheckboxItem
								bind:checked={
									() => column.getIsVisible(),
									(v) => column.toggleVisibility(!!v)
								}
							>
								{column.id === 'type'
									? 'Type'
									: column.id === 'campusName'
										? 'Campus'
										: column.id === 'isActive'
											? 'Status'
											: column.columnDef.header}
							</DropdownMenu.CheckboxItem>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>
		<div class="flex flex-1 flex-col overflow-hidden rounded-md border">
			<Table.Root class="h-full">
				<Table.Header class="bg-background sticky top-0 z-10">
					{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
						<Table.Row>
							{#each headerGroup.headers as header (header.id)}
								<Table.Head class="[&:has([role=checkbox])]:pl-3">
									{#if !header.isPlaceholder}
										<FlexRender
											content={header.column.columnDef.header}
											context={header.getContext()}
										/>
									{/if}
								</Table.Head>
							{/each}
						</Table.Row>
					{/each}
				</Table.Header>
				<Table.Body class="overflow-auto">
					{#each table.getRowModel().rows as row (row.id)}
						<Table.Row data-state={row.getIsSelected() && 'selected'}>
							{#each row.getVisibleCells() as cell (cell.id)}
								<Table.Cell class="[&:has([role=checkbox])]:pl-3">
									<FlexRender
										content={cell.column.columnDef.cell}
										context={cell.getContext()}
									/>
								</Table.Cell>
							{/each}
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={columns.length} class="h-24 text-center"
								>No results.</Table.Cell
							>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
		<div class="flex items-center justify-end space-x-2 pt-4">
			<div class="text-muted-foreground flex-1 text-sm">
				{table.getFilteredSelectedRowModel().rows.length} of
				{table.getFilteredRowModel().rows.length} row(s) selected.
			</div>
		</div>
	</div>

	<!-- CSV Import Form -->
	<ImportForm data={data.form} bind:open={importDialogOpen} />
</div>
