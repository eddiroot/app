import BasicCompulsorySpaceForm from './basic-compulsory-space/form.svelte';
import BasicCompulsoryTimeForm from './basic-compulsory-time/form.svelte';
import MinDaysBetweenActivitiesForm from './min-days-between-activities/form.svelte';
import RoomNotAvailableTimesForm from './room-not-available-times/form.svelte';
import SubjectPreferredRoomsForm from './subject-preferred-rooms/form.svelte';
import TeachersMaxGapsPerWeekForm from './teachers-max-gaps-per-week/form.svelte';

const FORM_COMPONENTS: Record<string, unknown> = {
	ConstraintBasicCompulsoryTime: BasicCompulsoryTimeForm,
	ConstraintBasicCompulsorySpace: BasicCompulsorySpaceForm,
	ConstraintTeachersMaxGapsPerWeek: TeachersMaxGapsPerWeekForm,
	ConstraintMinDaysBetweenActivities: MinDaysBetweenActivitiesForm,
	ConstraintSubjectPreferredRooms: SubjectPreferredRoomsForm,
	ConstraintRoomNotAvailableTimes: RoomNotAvailableTimesForm,
};

export function getFormComponent(fetName: string) {
	return FORM_COMPONENTS[fetName] ?? null;
}
