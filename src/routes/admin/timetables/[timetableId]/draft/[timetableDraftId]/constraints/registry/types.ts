import type { Component } from 'svelte';
import type { z } from 'zod';

import type { constraintTypeEnum } from '$lib/enums';

/**
 * Keys into `ConstraintFormData`. Each registry entry declares which of these
 * autocomplete option sets its form needs; the page-load then only fetches the
 * union of what's actually in play.
 *
 * Entities in FET:
 *   FET `Name` = DB `id` for teachers / subjects / rooms (`space.id`) / buildings.
 *   Classes (`timetableClasses`) and Activities (`timetableActivities`) are both
 *   exposed: a class is the user-facing concept (subject + teachers + students),
 *   activities are its child FET `<Activity>` instances. Constraint values are
 *   discriminated with a `c-{id}` or `a-{id}` prefix; the FET XML builder
 *   expands `c-{id}` to all child activity IDs at build time.
 *   Students use prefixed identifiers in XML (`Y{yearLevelId}`, `G{groupId}`,
 *   `S{studentId}`); those prefixes are applied during XML generation, not here.
 */
export type FormDataKey =
	| 'subjects'
	| 'teachers'
	| 'students'
	| 'timetableGroups'
	| 'buildings'
	| 'spaces'
	| 'timetableDays'
	| 'timetablePeriods'
	| 'timetableClasses'
	| 'timetableActivities';

export interface ConstraintEntry {
	/** FET XML tag name, e.g. `ConstraintTeachersMaxGapsPerWeek`. */
	fetName: string;
	friendlyName: string;
	description: string;
	type: constraintTypeEnum;
	/** If false, the constraint is mandatory and cannot be toggled/deleted. */
	optional: boolean;
	/** If true, multiple instances of this constraint can coexist in a draft. */
	repeatable: boolean;

	/** Zod schema validating the `parameters` JSON stored on `tt_draft_con`. */
	paramsSchema: z.ZodTypeAny;

	/** Svelte form component used in the add/edit modal. */
	formComponent: Component<ConstraintFormComponentProps>;

	/** Autocomplete option sets this form consumes. Empty when none. */
	requiresFormData: readonly FormDataKey[];
}

/** Server-safe metadata: ConstraintEntry without formComponent. Used by server, seed, and XML generation. */
export type ConstraintMeta = Omit<ConstraintEntry, 'formComponent'>;

export interface AutocompleteOption {
	value: string | number;
	label: string;
}

export interface ConstraintFormData {
	subjects: AutocompleteOption[];
	teachers: AutocompleteOption[];
	students: AutocompleteOption[];
	timetableGroups: AutocompleteOption[];
	buildings: AutocompleteOption[];
	spaces: AutocompleteOption[];
	timetableDays: AutocompleteOption[];
	timetablePeriods: AutocompleteOption[];
	timetableClasses: AutocompleteOption[];
	timetableActivities: AutocompleteOption[];
}

export interface ConstraintFormComponentProps {
	onSubmit: (values: Record<string, unknown>) => void;
	onCancel: () => void;
	initialValues?: Record<string, unknown>;
	formData?: ConstraintFormData;
	submitLabel?: string;
}
