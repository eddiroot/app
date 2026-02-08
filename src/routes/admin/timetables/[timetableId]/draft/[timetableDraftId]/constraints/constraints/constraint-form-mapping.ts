/**
 * Constraint Form Mapping
 * Maps FET constraint names to their corresponding custom form components
 */

// Import form components
import BasicCompulsorySpaceForm from '../constraint-forms/basic-compulsory-space-form.svelte'
import BasicCompulsoryTimeForm from '../constraint-forms/basic-compulsory-time-form.svelte'
import MinDaysBetweenActivitiesForm from '../constraint-forms/min-days-between-activities-form.svelte'
import RoomNotAvailableTimesForm from '../constraint-forms/room-not-available-times-form.svelte'
import SubjectPreferredRoomsForm from '../constraint-forms/subject-preferred-rooms-form.svelte'
import TeachersMaxGapsForm from '../constraint-forms/teachers-max-gaps-form.svelte'

// List of FET constraint names that have custom forms implemented
export const implementedConstraints = [
	'ConstraintSubjectPreferredRooms',
	'ConstraintRoomNotAvailableTimes',
	'ConstraintTeachersMaxGapsPerWeek',
	'ConstraintMinDaysBetweenActivities',
	'ConstraintBasicCompulsoryTime',
	'ConstraintBasicCompulsorySpace',
]

/**
 * Get the appropriate form component for a constraint using a switch statement
 * @param fetName - The FET constraint name
 * @returns The corresponding form component or the default ConstraintForm
 */
export function getConstraintFormComponent(fetName: string) {
	switch (fetName) {
		// Time Constraints
		case 'ConstraintSubjectPreferredRooms':
			return SubjectPreferredRoomsForm
		case 'ConstraintRoomNotAvailableTimes':
			return RoomNotAvailableTimesForm
		case 'ConstraintTeachersMaxGapsPerWeek':
			return TeachersMaxGapsForm
		case 'ConstraintMinDaysBetweenActivities':
			return MinDaysBetweenActivitiesForm
		case 'ConstraintBasicCompulsoryTime':
			return BasicCompulsoryTimeForm
		case 'ConstraintBasicCompulsorySpace':
			return BasicCompulsorySpaceForm
		default:
			return null
	}
}

/**
 * Check if a constraint has a custom form implementation
 * @param fetName - The FET constraint name
 * @returns True if the constraint has a custom form, false otherwise
 */
export function hasCustomForm(fetName: string): boolean {
	return implementedConstraints.includes(fetName)
}

/**
 * Check if a constraint form requires enhanced props (formData for autocomplete)
 * @param fetName - The FET constraint name
 * @returns True if the constraint form needs enhanced props, false otherwise
 */
export function requiresEnhancedProps(fetName: string): boolean {
	return [
		'ConstraintSubjectPreferredRooms',
		'ConstraintMinDaysBetweenActivities',
		'ConstraintRoomNotAvailableTimes',
	].includes(fetName)
}
