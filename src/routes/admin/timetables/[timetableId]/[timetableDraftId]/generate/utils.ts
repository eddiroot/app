import { XMLBuilder } from 'fast-xml-parser';

import {
	getActiveTimetableDraftConstraintsByTimetableDraftId,
	getAllStudentGroupsByTimetableDraftId,
	getAllStudentsWithYearLevelsBySchoolId,
	getBuildingsBySchoolId,
	getEnhancedTimetableDraftActivitiesByTimetableDraftId,
	getSchoolById,
	getSpacesBySchoolId,
	getSubjectsBySchoolId,
	getTeacherSpecializationsByTeacherId,
	getTimetableDraftDaysByTimetableDraftId,
	getTimetableDraftPeriodsByTimetableDraftId,
	getUsersBySchoolIdAndType
} from '$lib/server/db/service';

export type TimetableData = {
	timetableDays: Awaited<ReturnType<typeof getTimetableDraftDaysByTimetableDraftId>>;
	timetablePeriods: Awaited<ReturnType<typeof getTimetableDraftPeriodsByTimetableDraftId>>;
	studentGroups: Awaited<ReturnType<typeof getAllStudentGroupsByTimetableDraftId>>;
	studentsByYear: Awaited<ReturnType<typeof getAllStudentsWithYearLevelsBySchoolId>>;
	activities: Awaited<ReturnType<typeof getEnhancedTimetableDraftActivitiesByTimetableDraftId>>;
	buildings: Awaited<ReturnType<typeof getBuildingsBySchoolId>>;
	spaces: Awaited<ReturnType<typeof getSpacesBySchoolId>>;
	teachers: Awaited<ReturnType<typeof getUsersBySchoolIdAndType>>;
	subjects: Awaited<ReturnType<typeof getSubjectsBySchoolId>>;
	school: Awaited<ReturnType<typeof getSchoolById>>;
	activeConstraints: Awaited<
		ReturnType<typeof getActiveTimetableDraftConstraintsByTimetableDraftId>
	>;
};

async function buildTeachersList(teachers: TimetableData['teachers']) {
	return Promise.all(
		teachers.map(async (teacher) => {
			const qualifiedSubjects = await getTeacherSpecializationsByTeacherId(teacher.id);
			const subjectIds = qualifiedSubjects.map((qs) => qs.subjectId);

			return {
				Name: teacher.id,
				Target_Number_of_Hours: '',
				Qualified_Subjects:
					subjectIds.length > 0
						? {
								Qualified_Subject: subjectIds
							}
						: undefined
			};
		})
	);
}

function buildStudentsList(
	studentGroups: TimetableData['studentGroups'],
	studentsByYear: TimetableData['studentsByYear']
) {
	// Organize data by year level
	const yearLevelMap = new Map<
		string,
		{
			totalStudents: Set<string>;
			groups: Map<
				number | string,
				{
					name: string;
					students: Array<{ id: string; name: string }>;
				}
			>;
		}
	>();

	// Process all rows from studentGroups
	for (const row of studentGroups) {
		const yearLevelKey = row.yearLevel;
		const groupId = row.groupId;
		const groupName = row.groupName;

		// Initialize year level if it doesn't exist
		if (!yearLevelMap.has(yearLevelKey)) {
			yearLevelMap.set(yearLevelKey, {
				totalStudents: new Set(),
				groups: new Map()
			});
		}

		const yearData = yearLevelMap.get(yearLevelKey)!;

		// Initialize group if it doesn't exist
		if (!yearData.groups.has(groupId)) {
			yearData.groups.set(groupId, {
				name: groupName,
				students: []
			});
		}

		// Add student if they exist (leftJoin may return null for empty groups)
		if (row.userId) {
			const studentId = row.userId;
			const studentName = `${row.userFirstName} ${row.userLastName}`;

			yearData.totalStudents.add(studentId);
			yearData.groups.get(groupId)!.students.push({
				id: studentId,
				name: studentName
			});
		}
	}

	// Add all students from studentsByYear to ensure every year level has a complete group
	for (const [yearLevel, students] of Object.entries(studentsByYear)) {
		// Initialize year level if it doesn't exist
		if (!yearLevelMap.has(yearLevel)) {
			yearLevelMap.set(yearLevel, {
				totalStudents: new Set(),
				groups: new Map()
			});
		}

		const yearData = yearLevelMap.get(yearLevel)!;

		// Create the YX group for all students in this year level
		const yearGroupKey = `AllStudents-Y${yearLevel}`;
		const yearGroupStudents = students.map((student) => ({
			id: student.id,
			name: `${student.firstName} ${student.lastName}`
		}));

		yearData.groups.set(yearGroupKey, {
			name: `Year ${yearLevel} - All Students`,
			students: yearGroupStudents
		});

		// Add all students to totalStudents set
		students.forEach((student) => {
			yearData.totalStudents.add(student.id);
		});
	}

	// Convert to FET-compatible nested structure
	const studentsList = [];

	for (const [yearLevel, data] of yearLevelMap.entries()) {
		const yearGroups = [];

		for (const [groupId, groupData] of data.groups.entries()) {
			// Create subgroups for each student in this group
			const subgroups = groupData.students.map((student) => ({
				Name: `S${student.id}`,
				Number_of_Students: 1,
				Comments: student.name
			}));

			yearGroups.push({
				Name: typeof groupId === 'number' ? `G${groupId}` : groupId,
				Number_of_Students: groupData.students.length,
				Comments: groupData.name,
				Subgroup: subgroups
			});
		}

		studentsList.push({
			Name: `Y${yearLevel}`,
			Number_of_Students: data.totalStudents.size,
			Comments: `Year ${yearLevel}`,
			Group: yearGroups
		});
	}

	return studentsList;
}

function buildActivitiesList(activities: TimetableData['activities']) {
	const activitiesList = activities.flatMap((activity) => {
		// Collect all teacher IDs
		const teacherIds = activity.teacherIds;

		// Collect all student identifiers (groups, year levels, and individual students)
		const studentIdentifiers: string[] = [];

		// Add group IDs
		if (activity.groupIds.length > 0) {
			studentIdentifiers.push(...activity.groupIds.map((id) => 'G' + id.toString()));
		}

		// Add year levels
		if (activity.yearLevels.length > 0) {
			studentIdentifiers.push(...activity.yearLevels.map((yl) => 'Y' + yl.toString()));
		}

		// Add individual student IDs
		if (activity.studentIds.length > 0) {
			studentIdentifiers.push(...activity.studentIds.map((id) => 'S' + id.toString()));
		}

		// If no teachers or students assigned, skip this activity
		if (teacherIds.length === 0 || studentIdentifiers.length === 0) {
			console.warn(`Activity ${activity.id} skipped: missing teachers or students`);
			return [];
		}

		// Calculate how many split activities we need
		// If totalPeriods > periodsPerInstance, we create multiple activities (splits)
		const numberOfSplits = Math.ceil(activity.totalPeriods / activity.periodsPerInstance);

		// Create split activities
		const splitActivities = [];
		for (let i = 0; i < numberOfSplits; i++) {
			splitActivities.push({
				Teacher: teacherIds, // Array of teacher IDs - XML builder will create multiple <Teacher> tags
				Subject: activity.subjectOfferingId.toString(),
				Students: studentIdentifiers, // Array of student identifiers - XML builder will create multiple <Students> tags
				Duration: activity.periodsPerInstance, // Duration of this split
				Total_Duration: activity.totalPeriods, // Total duration across all splits
				Activity_Group_Id: activity.id, // Links all splits together by the same unique activity ID
				Active: true,
				Comments: activity.id,
				Id: 0 // Placeholder - will be assigned later
			});
		}

		return splitActivities;
	});

	// Assign unique IDs to each activity
	activitiesList.forEach((activity, index) => {
		activity.Id = index + 1; // FET IDs typically start at 1
	});

	return activitiesList;
}

function buildRoomsList(spaces: TimetableData['spaces'], buildings: TimetableData['buildings']) {
	return spaces.map((space) => {
		const building = buildings.find((b) => b.id === space.buildingId);

		return {
			Name: space.id,
			Building: building?.id || '',
			Capacity: space.capacity || 30,
			Virtual: false
		};
	});
}

function buildConstraintsXML(constraints: TimetableData['activeConstraints']) {
	const timeConstraints = constraints.filter((c) => c.type === 'time');
	const spaceConstraints = constraints.filter((c) => c.type === 'space');

	// Build Time_Constraints_List
	const timeConstraintsXML: Record<string, unknown> = {};
	timeConstraints.forEach((constraint) => {
		try {
			// Parse the JSON parameters
			const parsedParams =
				typeof constraint.parameters === 'string'
					? JSON.parse(constraint.parameters)
					: constraint.parameters;

			// Add to constraints using FET name
			timeConstraintsXML[constraint.FETName] = parsedParams;
		} catch (error) {
			console.error(`Error parsing time constraint ${constraint.FETName}:`, error);
		}
	});

	// Build Space_Constraints_List
	const spaceConstraintsXML: Record<string, unknown> = {};
	spaceConstraints.forEach((constraint) => {
		try {
			// Parse the JSON parameters
			const parsedParams =
				typeof constraint.parameters === 'string'
					? JSON.parse(constraint.parameters)
					: constraint.parameters;

			// Add to constraints using FET name
			spaceConstraintsXML[constraint.FETName] = parsedParams;
		} catch (error) {
			console.error(`Error parsing space constraint ${constraint.FETName}:`, error);
		}
	});

	return { timeConstraintsXML, spaceConstraintsXML };
}

function buildPreferredRoomsConstraints(
	activities: TimetableData['activities'],
	activitiesList: ReturnType<typeof buildActivitiesList>
) {
	const preferredRoomsConstraints: Array<{
		Weight_Percentage: number;
		Activity_Id: number;
		Number_of_Preferred_Rooms: number;
		Preferred_Room: string[];
		Active: boolean;
		Comments: string;
	}> = [];

	// Group activities by their location preferences
	const activitiesWithLocations = activities.filter((activity) => activity.locationIds.length > 0);

	activitiesWithLocations.forEach((activity) => {
		// Find all activity instances for this activity in the activitiesList
		const activityInstances = activitiesList.filter(
			(act) => act.Subject === activity.subjectOfferingId.toString()
		);

		// For each instance, add a constraint with the preferred rooms
		activityInstances.forEach((activityInstance) => {
			preferredRoomsConstraints.push({
				Weight_Percentage: 95,
				Activity_Id: activityInstance.Id,
				Number_of_Preferred_Rooms: activity.locationIds.length,
				Preferred_Room: activity.locationIds.map((id) => id.toString()),
				Active: true,
				Comments: `Preferred rooms for activity ${activity.id}`
			});
		});
	});

	return preferredRoomsConstraints;
}

export async function buildFETInput({
	timetableDays,
	timetablePeriods,
	studentGroups,
	studentsByYear,
	activities,
	buildings,
	spaces,
	teachers,
	subjects,
	school,
	activeConstraints
}: TimetableData) {
	const daysList = timetableDays.map((day) => ({
		Name: day.id
	}));

	const hoursList = timetablePeriods.map((period) => ({
		Name: period.id
	}));

	const subjectsList = subjects.map((subject) => ({
		Name: subject.id
	}));

	const teachersList = await buildTeachersList(teachers);
	const studentsList = buildStudentsList(studentGroups, studentsByYear);
	const activitiesList = buildActivitiesList(activities);

	const buildingsList = buildings.map((building) => ({
		Name: building.id
	}));

	const roomsList = buildRoomsList(spaces, buildings);

	const { timeConstraintsXML, spaceConstraintsXML } = buildConstraintsXML(activeConstraints);

	const preferredRoomsConstraints = buildPreferredRoomsConstraints(activities, activitiesList);

	// Add the preferred rooms constraints to the space constraints
	if (preferredRoomsConstraints.length > 0) {
		spaceConstraintsXML['ConstraintActivityPreferredRooms'] = preferredRoomsConstraints;
	}

	const xmlData = {
		'?xml': {
			'@_version': '1.0',
			'@_encoding': 'UTF-8'
		},
		fet: {
			'@_version': '7.3.0',
			Institution_Name: school?.id || 'Unknown School',
			Comments:
				'This is a timetable generated for a school working with eddi. Full credit goes to Liviu Lalescu and Volker Dirr for their work on FET (Free Timetabling Software) which we utilise to generate the output.',
			Days_List: {
				Number_of_Days: daysList.length,
				Day: daysList
			},
			Hours_List: {
				Number_of_Hours: hoursList.length,
				Hour: hoursList
			},
			Subjects_List: {
				Subject: subjectsList
			},
			Activity_Tags_List: {},
			Teachers_List: {
				Teacher: teachersList
			},
			Students_List: {
				Year: studentsList
			},
			Activities_List: {
				Activity: activitiesList
			},
			Buildings_List: {
				Building: buildingsList
			},
			Rooms_List: {
				Room: roomsList
			},
			Time_Constraints_List: timeConstraintsXML,
			Space_Constraints_List: spaceConstraintsXML,
			Timetable_Generation_Options_List: {}
		}
	};

	const xmlBuilderOptions = {
		ignoreAttributes: false,
		format: true,
		suppressEmptyNode: true,
		attributeNamePrefix: '@_'
	};

	const builder = new XMLBuilder(xmlBuilderOptions);
	const xmlDataWithConstraints = builder.build(xmlData);
	return xmlDataWithConstraints;
}
