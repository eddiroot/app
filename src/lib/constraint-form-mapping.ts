/**
 * Constraint Form Mapping
 * Maps FET constraint names to their corresponding custom form components
 */

// Import form components
import BasicCompulsorySpaceForm from '$lib/components/constraints/basic-compulsory-space-form.svelte';
import BasicCompulsoryTimeForm from '$lib/components/constraints/basic-compulsory-time-form.svelte';
import MinDaysBetweenActivitiesForm from '$lib/components/constraints/min-days-between-activities-form.svelte';
import RoomNotAvailableTimesForm from '$lib/components/constraints/room-not-available-times-form.svelte';
import SubjectPreferredRoomsForm from '$lib/components/constraints/subject-preferred-rooms-form.svelte';
import TeachersMaxGapsForm from '$lib/components/constraints/teachers-max-gaps-form.svelte';

// List of FET constraint names that have custom forms implemented
export const implementedConstraints = [
	'ConstraintSubjectPreferredRooms',
	'ConstraintRoomNotAvailableTimes',
	'ConstraintTeachersMaxGapsPerWeek',
	'ConstraintMinDaysBetweenActivities',
	'ConstraintBasicCompulsoryTime',
	'ConstraintBasicCompulsorySpace'
];

/**
 * Get the appropriate form component for a constraint using a switch statement
 * @param FETName - The FET constraint name
 * @returns The corresponding form component or the default ConstraintForm
 */
export function getConstraintFormComponent(FETName: string) {
	switch (FETName) {
		// Time Constraints
		case 'ConstraintSubjectPreferredRooms':
			return SubjectPreferredRoomsForm;
		case 'ConstraintRoomNotAvailableTimes':
			return RoomNotAvailableTimesForm;
		case 'ConstraintTeachersMaxGapsPerWeek':
			return TeachersMaxGapsForm;
		case 'ConstraintMinDaysBetweenActivities':
			return MinDaysBetweenActivitiesForm;
		case 'ConstraintBasicCompulsoryTime':
			return BasicCompulsoryTimeForm;
		case 'ConstraintBasicCompulsorySpace':
			return BasicCompulsorySpaceForm;
		default:
			return null;
	}
}

/**
 * Check if a constraint has a custom form implementation
 * @param FETName - The FET constraint name
 * @returns True if the constraint has a custom form, false otherwise
 */
export function hasCustomForm(FETName: string): boolean {
	return implementedConstraints.includes(FETName);
}

/**
 * Check if a constraint form requires enhanced props (formData for autocomplete)
 * @param FETName - The FET constraint name
 * @returns True if the constraint form needs enhanced props, false otherwise
 */
export function requiresEnhancedProps(FETName: string): boolean {
	return [
		'ConstraintSubjectPreferredRooms',
		'ConstraintMinDaysBetweenActivities',
		'ConstraintRoomNotAvailableTimes'
	].includes(FETName);
}
