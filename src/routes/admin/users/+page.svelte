<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import DataTableCheckbox from '$lib/components/ui/data-table/data-table-checkbox.svelte';
	import {
		FlexRender,
		createSvelteTable,
		renderComponent
	} from '$lib/components/ui/data-table/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import {
		type ColumnDef,
		type ColumnFiltersState,
		type RowSelectionState,
		type SortingState,
		type VisibilityState,
		getCoreRowModel,
		getFilteredRowModel,
		getSortedRowModel
	} from '@tanstack/table-core';
	import TypeBadge from '../../../lib/components/type-badge.svelte';

	const { data } = $props();

	const columns: ColumnDef<(typeof data.users)[number]>[] = [
		{
			id: 'select',
			header: ({ table }) =>
				renderComponent(DataTableCheckbox, {
					checked: table.getIsAllPageRowsSelected(),
					indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
					onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
					'aria-label': 'Select all'
				}),
			cell: ({ row }) =>
				renderComponent(DataTableCheckbox, {
					checked: row.getIsSelected(),
					onCheckedChange: (value) => row.toggleSelected(!!value),
					'aria-label': 'Select row'
				}),
			enableSorting: false,
			enableHiding: false
		},
		{
			accessorKey: 'firstName',
			header: 'First Name',
			filterFn: 'includesString',
			size: 150
		},
		{
			accessorKey: 'middleName',
			header: 'Middle Name',
			filterFn: 'includesString',
			size: 150
		},
		{
			accessorKey: 'lastName',
			header: 'Last Name',
			filterFn: 'includesString',
			size: 150
		},
		{
			accessorKey: 'email',
			header: 'Email',
			filterFn: 'includesString',
			size: 200
		},
		{
			accessorKey: 'type',
			header: 'Type',
			filterFn: 'includesString',
			size: 100,
			cell: ({ getValue }) => {
				const type = getValue() as string;
				return renderComponent(TypeBadge, { type });
			}
		},
		{
			accessorKey: 'yearLevel',
			header: 'Year Level',
			filterFn: 'includesString',
			size: 100
		}
	];

	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let rowSelection = $state<RowSelectionState>({});
	let columnVisibility = $state<VisibilityState>({
		middleName: false
	});

	const table = createSvelteTable({
		get data() {
			return data.users;
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
			}
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
		}
	});
</script>

<div class="flex h-full flex-col space-y-2">
	<h1 class="text-3xl font-bold tracking-tight">Users</h1>
	<div class="flex min-h-0 flex-1 flex-col">
		<div class="flex items-center py-4">
			<Input
				placeholder="Filter emails..."
				value={(table.getColumn('email')?.getFilterValue() as string) ?? ''}
				oninput={(e) => table.getColumn('email')?.setFilterValue(e.currentTarget.value)}
				onchange={(e) => {
					table.getColumn('email')?.setFilterValue(e.currentTarget.value);
				}}
				class="max-w-sm"
			/>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="outline" class="ml-auto">
							Columns <ChevronDownIcon class="ml-2 size-4" />
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					{#each table.getAllColumns().filter((col) => col.getCanHide()) as column (column.id)}
						<DropdownMenu.CheckboxItem
							bind:checked={() => column.getIsVisible(), (v) => column.toggleVisibility(!!v)}
						>
							{column.id == 'type' ? 'Type' : column.columnDef.header}
						</DropdownMenu.CheckboxItem>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
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
									<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
								</Table.Cell>
							{/each}
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
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
</div>
