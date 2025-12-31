import { constraintTypeEnum } from '../../../../../enums';

export interface ConstraintDefinition {
	FETName: string;
	friendlyName: string;
	description: string;
	type: constraintTypeEnum;
	optional: boolean; // whether this constraint is optional or mandatory, null if uncertain
	repeatable: boolean; // whether this constraint can be added multiple times, null if uncertain
}

export const TIME_CONSTRAINTS: ConstraintDefinition[] = [
	{
		FETName: 'ConstraintBasicCompulsoryTime',
		friendlyName: 'Basic Compulsory Time',
		description: 'Ensures that a teacher never instructs two or more activities at the same time, and students have maximum one activity per period. Essential foundation constraint that must always be included.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintStudentsEarlyMaxBeginningsAtSecondHour',
		friendlyName: 'Students Early Max Beginnings At Second Hour',
		description: 'Limits the maximum number of activities that can begin at the second hour for students. Helps manage student schedules to avoid too many early starts.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintStudentsMaxGapsPerWeek',
		friendlyName: 'Students Max Gaps Per Week',
		description: 'Limits the maximum number of free periods (gaps) students can have per week. Maintains structured learning environment and supervision requirements, especially important for younger students.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintMinDaysBetweenActivities',
		friendlyName: 'Minimum Days Between Activities',
		description: 'Ensures activities are spread across multiple days. Prevents clustering all lessons of a subject on consecutive days. Automatically added for split activities.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintTeacherNotAvailableTimes',
		friendlyName: 'Teacher Not Available Times',
		description: 'Blocks specific time periods when teachers cannot teach due to meetings, training, or personal commitments. Not available periods are not counted as gaps in gap calculations.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintTeacherMaxDaysPerWeek',
		friendlyName: 'Teacher Max Days Per Week',
		description: 'Allows teachers to have free days for work-life balance. Essential for part-time teachers and often desired for full-time staff.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivitiesPreferredStartingTimes',
		friendlyName: 'Activities Preferred Starting Times',
		description: 'Sets preferred starting times for multiple activities based on criteria like teacher, subject, or activity tag. Provides bulk time preferences for activity groups.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivityPreferredStartingTimes',
		friendlyName: 'Activity Preferred Starting Times',
		description: 'Provides multiple acceptable time options for a single activity. Allows flexible scheduling with constraints.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivityPreferredStartingTime',
		friendlyName: 'Activity Preferred Starting Time',
		description: 'Guides activity placement to optimal time slots. Used for subject-specific timing preferences like physical education in morning periods.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintTeachersMaxGapsPerWeek',
		friendlyName: 'Teachers Max Gaps Per Week',
		description: 'Minimizes free periods during work days for efficiency and teacher satisfaction. Recommended for optimization, helps create efficient schedules.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintSubactivitiesPreferredTimeSlots',
		friendlyName: 'Subactivities Preferred Time Slots',
		description: 'Sets preferred time slots for subactivities of a specific component number. Used for complex activity arrangements.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	// Teacher Daily/Weekly Constraints
	{
		FETName: 'ConstraintTeachersMinHoursDaily',
		friendlyName: 'Teachers Min Hours Daily',
		description: 'Ensures teachers have minimum teaching hours per day for contract requirements or workload balancing. Can create substitution problems if teachers are absent.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintTeachersMaxHoursDaily',
		friendlyName: 'Teachers Max Hours Daily',
		description: 'Prevents teacher overload on single days for workload balancing and teacher wellbeing. Recommended for maintaining balanced schedules.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintTeacherMinHoursDaily',
		friendlyName: 'Teacher Min Hours Daily',
		description: 'Ensures specific teacher has minimum teaching hours per day. Individual teacher version of the general constraint.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintTeacherMaxHoursDaily',
		friendlyName: 'Teacher Max Hours Daily',
		description: 'Prevents specific teacher overload on single days. Individual teacher version for customized workload management.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintTeachersMaxDaysPerWeek',
		friendlyName: 'Teachers Max Days Per Week',
		description: 'Allows all teachers to have free days. General version for school-wide policy.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintTeacherMinDaysPerWeek',
		friendlyName: 'Teacher Min Days Per Week',
		description: 'Forces specific teacher to work minimum days. Rarely needed - usually better achieved through other constraints.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	// Teacher Gap Constraints
	{
		FETName: 'ConstraintTeachersMaxGapsPerDay',
		friendlyName: 'Teachers Max Gaps Per Day',
		description: 'Prevents scattered schedules within a day for all teachers. Improves teacher efficiency and reduces waiting time.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintTeacherMaxGapsPerDay',
		friendlyName: 'Teacher Max Gaps Per Day',
		description: 'Prevents scattered schedules within a day for specific teacher. Individual version for customized scheduling.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintTeacherMaxGapsPerWeek',
		friendlyName: 'Teacher Max Gaps Per Week',
		description: 'Minimizes free periods during work days for specific teacher. Individual version for personalized gap management.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	// Student Constraints
	{
		FETName: 'ConstraintStudentsMaxHoursDaily',
		friendlyName: 'Students Max Hours Daily',
		description: 'Prevents student overload for age-appropriate scheduling and attention span considerations. Recommended for all student groups.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintStudentsMinHoursDaily',
		friendlyName: 'Students Min Hours Daily',
		description: 'Ensures students have minimum daily instruction for curriculum requirements.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintStudentsSetMaxHoursDaily',
		friendlyName: 'Students Set Max Hours Daily',
		description: 'Prevents student overload for specific student groups. Allows differentiated scheduling by year level or program.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintStudentsSetMinHoursDaily',
		friendlyName: 'Students Set Min Hours Daily',
		description: 'Ensures specific student groups have minimum daily instruction. Useful for different programs or year levels.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintStudentsSetNotAvailableTimes',
		friendlyName: 'Students Set Not Available Times',
		description: 'Blocks specific time periods when student groups cannot attend classes due to assemblies, field trips, or special events.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintStudentsSetMaxGapsPerWeek',
		friendlyName: 'Students Set Max Gaps Per Week',
		description: 'Limits maximum gaps for specific student groups. Allows differentiated gap policies by year level.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintStudentsSetMaxGapsPerDay',
		friendlyName: 'Students Set Max Gaps Per Day',
		description: 'Prevents scattered schedules within a day for specific student groups. Maintains structured learning environment.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintStudentsSetEarlyMaxBeginningsAtSecondHour',
		friendlyName: 'Students Set Early Max Beginnings At Second Hour',
		description: 'Limits activities beginning at second hour for specific student groups. Helps manage differentiated start times.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	// Continuous Hours Constraints
	{
		FETName: 'ConstraintTeachersMaxHoursContinuously',
		friendlyName: 'Teachers Max Hours Continuously',
		description: 'Prevents fatigue from too many consecutive hours of teaching. Recommended for health and safety.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintTeacherMaxHoursContinuously',
		friendlyName: 'Teacher Max Hours Continuously',
		description: 'Prevents fatigue from too many consecutive hours for specific teacher. Individual version for customized scheduling.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintStudentsMaxHoursContinuously',
		friendlyName: 'Students Max Hours Continuously',
		description: 'Prevents fatigue from too many consecutive hours for students. Important for attention span management.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: false
	},
	// Activity Tag Constraints
	{
		FETName: 'ConstraintTeachersActivityTagMaxHoursDaily',
		friendlyName: 'Teachers Activity Tag Max Hours Daily',
		description: 'Limits specific types of activities per day for all teachers. Prevents too much of intensive subjects like labs or sports.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintTeacherActivityTagMaxHoursDaily',
		friendlyName: 'Teacher Activity Tag Max Hours Daily',
		description: 'Limits specific types of activities per day for individual teacher. Customized activity type management.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintTeachersActivityTagMaxHoursContinuously',
		friendlyName: 'Teachers Activity Tag Max Hours Continuously',
		description: 'Limits consecutive hours of specific activity types for all teachers. Prevents fatigue from intensive subjects.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintStudentsActivityTagMaxHoursDaily',
		friendlyName: 'Students Activity Tag Max Hours Daily',
		description: 'Limits specific types of activities per day for students. Prevents overload of intensive subjects.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintStudentsActivityTagMaxHoursContinuously',
		friendlyName: 'Students Activity Tag Max Hours Continuously',
		description: 'Limits consecutive hours of specific activity types for students. Manages attention span for intensive subjects.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	// Break and Interval Constraints
	{
		FETName: 'ConstraintBreakTimes',
		friendlyName: 'Break Times',
		description: 'Easy way to declare that all teachers and students are unavailable during breaks. Used for lunch breaks, assembly periods, whole-school events.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintTeacherIntervalMaxDaysPerWeek',
		friendlyName: 'Teacher Interval Max Days Per Week',
		description: 'Limits maximum days per week a teacher works within specific time intervals. Advanced scheduling control.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintStudentsIntervalMaxDaysPerWeek',
		friendlyName: 'Students Interval Max Days Per Week',
		description: 'Limits maximum days per week students have activities within specific time intervals.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintStudentsSetIntervalMaxDaysPerWeek',
		friendlyName: 'Students Set Interval Max Days Per Week',
		description: 'Limits maximum days per week specific student groups have activities within specific time intervals.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	// Activity Relationship Constraints
	{
		FETName: 'ConstraintTwoActivitiesConsecutive',
		friendlyName: 'Two Activities Consecutive',
		description: 'Forces activities to be scheduled back-to-back. Used for theory-practice combinations and double periods.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintTwoActivitiesGrouped',
		friendlyName: 'Two Activities Grouped',
		description: 'Groups activities on same day without enforcing order. Used for related subjects and room efficiency.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintTwoActivitiesOrdered',
		friendlyName: 'Two Activities Ordered',
		description: 'Enforces sequence where first activity comes before second. Used for prerequisites and logical progression. Very restrictive.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivitiesNotOverlapping',
		friendlyName: 'Activities Not Overlapping',
		description: 'Prevents activities from overlapping in time. Special cases beyond basic constraints.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintMinGapsBetweenActivities',
		friendlyName: 'Min Gaps Between Activities',
		description: 'Ensures minimum time between related activities. Used for digestion time and preparation needs.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	// Same Time Scheduling
	{
		FETName: 'ConstraintActivitiesSameStartingTime',
		friendlyName: 'Activities Same Starting Time',
		description: 'Forces activities to start at exactly same time. Used for parallel courses and option blocks.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivitiesSameStartingDay',
		friendlyName: 'Activities Same Starting Day',
		description: 'Groups activities on same day, any hours. Used for course groupings and teacher efficiency.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivitiesSameStartingHour',
		friendlyName: 'Activities Same Starting Hour',
		description: 'Schedules activities at same hour across different days. Used for parallel scheduling patterns.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	// Activity Time Slot Constraints
	{
		FETName: 'ConstraintActivityPreferredTimeSlots',
		friendlyName: 'Activity Preferred Time Slots',
		description: 'Provides multiple acceptable time slots for a single activity. Advanced time preference management.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivitiesPreferredTimeSlots',
		friendlyName: 'Activities Preferred Time Slots',
		description: 'Sets preferred time slots for multiple activities based on various criteria. Bulk time slot preference management.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	// Special Scheduling Constraints
	{
		FETName: 'ConstraintActivityEndsStudentsDay',
		friendlyName: 'Activity Ends Students Day',
		description: 'Ensures specific activities are scheduled at end of day. Used for activities not attended by all students.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivitiesEndStudentsDay',
		friendlyName: 'Activities End Students Day',
		description: 'Ensures multiple activities are scheduled at end of day based on criteria. Bulk version for end-of-day scheduling.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	// Advanced Time Slot Constraints
	{
		FETName: 'ConstraintActivitiesOccupyMaxTimeSlotsFromSelection',
		friendlyName: 'Activities Occupy Max Time Slots From Selection',
		description: 'Limits the number of time slots occupied by activities from a predefined selection. Advanced scheduling control.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivitiesMaxSimultaneousInSelectedTimeSlots',
		friendlyName: 'Activities Max Simultaneous In Selected Time Slots',
		description: 'Limits maximum number of activities running simultaneously in selected time slots. Resource management.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivitiesMinSimultaneousInSelectedTimeSlots',
		friendlyName: 'Activities Min Simultaneous In Selected Time Slots',
		description: 'Ensures minimum number of activities running simultaneously in selected time slots. Resource utilization.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintMaxTotalActivitiesFromSetInSelectedTimeSlots',
		friendlyName: 'Max Total Activities From Set In Selected Time Slots',
		description: 'Limits total number of activities from a set that can occur in selected time slots. Advanced resource planning.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivityTagsNotOverlapping',
		friendlyName: 'Activity Tags Not Overlapping',
		description: 'Prevents activities with specific tags from overlapping in time. Tag-based scheduling control.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	// Teacher Wellness Constraints
	{
		FETName: 'ConstraintTeacherMinRestingHours',
		friendlyName: 'Teacher Min Resting Hours',
		description: 'Ensures minimum resting hours between teaching periods for specific teacher. Teacher wellness and work-life balance.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintTeachersMaxAfternoonsPerWeek',
		friendlyName: 'Teachers Max Afternoons Per Week',
		description: 'Limits maximum afternoon sessions per week for all teachers. Work-life balance consideration.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintStudentsMinHoursPerMorning',
		friendlyName: 'Students Min Hours Per Morning',
		description: 'Ensures students have minimum hours of instruction per morning session. Morning productivity optimization.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintTeachersMaxZeroGapsPerAfternoon',
		friendlyName: 'Teachers Max Zero Gaps Per Afternoon',
		description: 'Limits afternoon periods with zero gaps for all teachers. Advanced gap management.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintTeacherMaxTwoActivityTagsPerDayFromN1N2N3',
		friendlyName: 'Teacher Max Two Activity Tags Per Day From N1N2N3',
		description: 'Specialized constraint for limiting activity tag combinations per day for specific teacher. Advanced tag management.',
		type: constraintTypeEnum.time,
		optional: false,
		repeatable: true
	}
];

export const SPACE_CONSTRAINTS: ConstraintDefinition[] = [
	{
		FETName: 'ConstraintBasicCompulsorySpace',
		friendlyName: 'Basic Compulsory Space',
		description: 'Ensures that a room never has two or more activities scheduled simultaneously. Essential foundation constraint for room allocation.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintRoomNotAvailableTimes',
		friendlyName: 'Room Not Available Times',
		description: 'Blocks specific time periods when rooms cannot be used due to maintenance, special events, or shared facilities.',
		type: constraintTypeEnum.space,
		optional: true,
		repeatable: true
	},
	{
		FETName: 'ConstraintSubjectPreferredRoom',
		friendlyName: 'Subject Preferred Room',
		description: 'Links subjects to specialized facilities for equipment requirements. Essential for science labs, computer rooms, etc.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintSubjectPreferredRooms',
		friendlyName: 'Subject Preferred Rooms',
		description: 'Assigns multiple preferred rooms for a specific subject. Provides flexibility while maintaining specialization.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintSubjectActivityTagPreferredRoom',
		friendlyName: 'Subject Activity Tag Preferred Room',
		description: 'Links subject-activity tag combinations to specific rooms. Advanced room assignment based on multiple criteria.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintSubjectActivityTagPreferredRooms',
		friendlyName: 'Subject Activity Tag Preferred Rooms',
		description: 'Links subject-activity tag combinations to multiple preferred rooms. Flexible specialized room assignment.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivityPreferredRoom',
		friendlyName: 'Activity Preferred Room',
		description: 'Assigns a preferred room for a specific activity. Individual activity room preference.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivityPreferredRooms',
		friendlyName: 'Activity Preferred Rooms',
		description: 'Assigns multiple preferred rooms for a specific activity. Provides room options for individual activities.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivityTagPreferredRoom',
		friendlyName: 'Activity Tag Preferred Room',
		description: 'Links activity tags to specific rooms. Room assignment based on activity type.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivityTagPreferredRooms',
		friendlyName: 'Activity Tag Preferred Rooms',
		description: 'Links activity tags to multiple preferred rooms. Flexible room assignment by activity type.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	},
	// Teacher Room Constraints
	{
		FETName: 'ConstraintTeacherHomeRoom',
		friendlyName: 'Teacher Home Room',
		description: 'Assigns a home room for a specific teacher. Reduces movement and provides teacher base.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintTeacherHomeRooms',
		friendlyName: 'Teacher Home Rooms',
		description: 'Assigns multiple home rooms for a specific teacher. Provides room options while maintaining teacher base.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	},
	// Student Room Constraints
	{
		FETName: 'ConstraintStudentsSetHomeRoom',
		friendlyName: 'Students Set Home Room',
		description: 'Assigns a home room for specific student groups. Maintains class identity and reduces movement.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintStudentsSetHomeRooms',
		friendlyName: 'Students Set Home Rooms',
		description: 'Assigns multiple home rooms for specific student groups. Provides room flexibility while maintaining group cohesion.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	},
	// Building Change Constraints
	{
		FETName: 'ConstraintTeachersMaxBuildingChangesPerDay',
		friendlyName: 'Teachers Max Building Changes Per Day',
		description: 'Limits building changes for all teachers to reduce travel time and improve efficiency.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: false
	},
	{
		FETName: 'ConstraintTeacherMaxBuildingChangesPerDay',
		friendlyName: 'Teacher Max Building Changes Per Day',
		description: 'Limits building changes for specific teacher. Individual control over teacher movement.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintStudentsSetMaxBuildingChangesPerDay',
		friendlyName: 'Students Set Max Building Changes Per Day',
		description: 'Limits building changes for specific student groups. Reduces student travel time and supervision issues.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintStudentsSetMinGapsBetweenBuildingChanges',
		friendlyName: 'Students Set Min Gaps Between Building Changes',
		description: 'Ensures minimum time between building changes for student groups. Allows adequate transition time.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	},
	// Advanced Room Constraints
	{
		FETName: 'ConstraintActivitiesOccupyMaxDifferentRooms',
		friendlyName: 'Activities Occupy Max Different Rooms',
		description: 'Limits the number of different rooms used by a set of activities. Promotes room efficiency and reduces setup.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	},
	{
		FETName: 'ConstraintActivitiesSameRoomIfConsecutive',
		friendlyName: 'Activities Same Room If Consecutive',
		description: 'Ensures consecutive activities use the same room when possible. Reduces unnecessary movement.',
		type: constraintTypeEnum.space,
		optional: false,
		repeatable: true
	}
];

export const ALL_CONSTRAINTS = [...TIME_CONSTRAINTS, ...SPACE_CONSTRAINTS];
