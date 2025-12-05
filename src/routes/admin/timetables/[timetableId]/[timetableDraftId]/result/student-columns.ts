import { renderComponent, renderSnippet } from '$lib/components/ui/data-table/index.js';
import type { ColumnDef } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';
import StudentColumnHeader from './student-column-header.svelte';

export type StudentStatistic = {
	userId: string;
	userName: string;
	userType: string;
	numberOfEnrolledClasses: number;
	totalHoursPerCycle: number;
	averageHoursPerDay: number;
	maxHoursPerDay: number;
	minHoursPerDay: number;
	numberOfFreeDays: number;
	dailyHours: Record<number, number>;
};

export const studentColumns: ColumnDef<StudentStatistic>[] = [
	{
		accessorKey: 'userName',
		header: ({ column }) =>
			renderComponent(StudentColumnHeader, {
				onclick: column.getToggleSortingHandler(),
				label: 'Student Name'
			}),
		cell: ({ row }) => {
			const nameSnippet = createRawSnippet(() => ({
				render: () => `<div class="font-medium">${row.getValue('userName')}</div>`
			}));
			return renderSnippet(nameSnippet);
		}
	},
	{
		accessorKey: 'numberOfEnrolledClasses',
		header: ({ column }) =>
			renderComponent(StudentColumnHeader, {
				onclick: column.getToggleSortingHandler(),
				label: '# of Enrolled Classes',
				align: 'right'
			}),
		cell: ({ row }) => {
			const classes = row.getValue('numberOfEnrolledClasses') as number;
			const classesSnippet = createRawSnippet(() => ({
				render: () => `<div class="text-right">${classes}</div>`
			}));
			return renderSnippet(classesSnippet);
		}
	},
	{
		accessorKey: 'totalHoursPerCycle',
		header: ({ column }) =>
			renderComponent(StudentColumnHeader, {
				onclick: column.getToggleSortingHandler(),
				label: 'Total Hours/Cycle',
				align: 'right'
			}),
		cell: ({ row }) => {
			const hours = row.getValue('totalHoursPerCycle') as number;
			const hoursSnippet = createRawSnippet(() => ({
				render: () => `<div class="text-right">${hours.toFixed(2)}h</div>`
			}));
			return renderSnippet(hoursSnippet);
		}
	},
	{
		accessorKey: 'averageHoursPerDay',
		header: ({ column }) =>
			renderComponent(StudentColumnHeader, {
				onclick: column.getToggleSortingHandler(),
				label: 'Avg Hours/Day',
				align: 'right'
			}),
		cell: ({ row }) => {
			const hours = row.getValue('averageHoursPerDay') as number;
			const avgSnippet = createRawSnippet(() => ({
				render: () => `<div class="text-right">${hours.toFixed(2)}h</div>`
			}));
			return renderSnippet(avgSnippet);
		}
	},
	{
		accessorKey: 'maxHoursPerDay',
		header: ({ column }) =>
			renderComponent(StudentColumnHeader, {
				onclick: column.getToggleSortingHandler(),
				label: 'Max Hours/Day',
				align: 'right'
			}),
		cell: ({ row }) => {
			const hours = row.getValue('maxHoursPerDay') as number;
			const maxSnippet = createRawSnippet(() => ({
				render: () => `<div class="text-right">${hours.toFixed(2)}h</div>`
			}));
			return renderSnippet(maxSnippet);
		}
	},
	{
		accessorKey: 'minHoursPerDay',
		header: ({ column }) =>
			renderComponent(StudentColumnHeader, {
				onclick: column.getToggleSortingHandler(),
				label: 'Min Hours/Day',
				align: 'right'
			}),
		cell: ({ row }) => {
			const hours = row.getValue('minHoursPerDay') as number;
			const minSnippet = createRawSnippet(() => ({
				render: () => `<div class="text-right">${hours.toFixed(2)}h</div>`
			}));
			return renderSnippet(minSnippet);
		}
	},
	{
		accessorKey: 'numberOfFreeDays',
		header: ({ column }) =>
			renderComponent(StudentColumnHeader, {
				onclick: column.getToggleSortingHandler(),
				label: 'Free Days',
				align: 'right'
			}),
		cell: ({ row }) => {
			const days = row.getValue('numberOfFreeDays') as number;
			const freeDaysSnippet = createRawSnippet(() => ({
				render: () => `<div class="text-right">${days}</div>`
			}));
			return renderSnippet(freeDaysSnippet);
		}
	}
];
