import type { AutocompleteOption } from './constraint-data-fetchers'

/**
 * Enhanced constraint form component that provides data for autocomplete
 */
export interface ConstraintFormData {
	subjects: AutocompleteOption[]
	teachers: AutocompleteOption[]
	students: AutocompleteOption[]
	timetableGroups: AutocompleteOption[]
	buildings: AutocompleteOption[]
	spaces: AutocompleteOption[]
	timetableDays: AutocompleteOption[]
	timetablePeriods: AutocompleteOption[]
	timetableActivities: AutocompleteOption[]
}

export interface EnhancedConstraintFormProps {
	onSubmit: (values: Record<string, unknown>) => void
	onCancel: () => void
	initialValues?: Record<string, unknown>
	formData?: ConstraintFormData
}
