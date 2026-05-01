import XMLBuilder from 'fast-xml-builder';

import {
	getActiveTimetableDraftConstraintsByTimetableDraftId,
	getAllStudentGroupsByTimetableDraftId,
	getAllStudentsGroupedByYearLevelsBySchoolId,
	getBuildingsBySchoolId,
	getEnhancedTimetableDraftClassesByTimetableDraftId,
	getSchoolById,
	getSpacesBySchoolId,
	getSubjectsBySchoolId,
	getTimetableDraftDaysByTimetableDraftId,
	getTimetableDraftPeriodsByTimetableDraftId,
	getUsersBySchoolIdAndType,
	getUserSpecialisationsByUserId,
} from '$lib/server/db/service';

export type TimetableData = {
	timetableDays: Awaited<
		ReturnType<typeof getTimetableDraftDaysByTimetableDraftId>
	>;
	timetablePeriods: Awaited<
		ReturnType<typeof getTimetableDraftPeriodsByTimetableDraftId>
	>;
	studentGroups: Awaited<
		ReturnType<typeof getAllStudentGroupsByTimetableDraftId>
	>;
	studentsByYear: Awaited<
		ReturnType<typeof getAllStudentsGroupedByYearLevelsBySchoolId>
	>;
	classes: Awaited<
		ReturnType<typeof getEnhancedTimetableDraftClassesByTimetableDraftId>
	>;
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
			const qualifiedSubjects = await getUserSpecialisationsByUserId(
				teacher.id,
			);
			const subjectIds = qualifiedSubjects.map((qs) => qs.subjectId);

			return {
				Name: teacher.id,
				Target_Number_of_Hours: '',
				Qualified_Subjects:
					subjectIds.length > 0 ? { Qualified_Subject: subjectIds } : undefined,
			};
		}),
	);
}

function buildStudentsList(
	studentGroups: TimetableData['studentGroups'],
	studentsByYear: TimetableData['studentsByYear'],
) {
	// Organize data by year level
	const yearLevelMap = new Map<
		string,
		{
			totalStudents: Set<string>;
			groups: Map<
				number | string,
				{ name: string; students: Array<{ id: string; name: string }> }
			>;
		}
	>();

	// Process all rows from studentGroups
	for (const row of studentGroups) {
		const yearLevelKey = row.yearLevelId.toString();
		const groupId = row.groupId;
		const groupName = row.groupName;

		if (!yearLevelMap.has(yearLevelKey)) {
			yearLevelMap.set(yearLevelKey, {
				totalStudents: new Set(),
				groups: new Map(),
			});
		}

		const yearData = yearLevelMap.get(yearLevelKey)!;

		// Initialize group if it doesn't exist
		if (!yearData.groups.has(groupId)) {
			yearData.groups.set(groupId, { name: groupName, students: [] });
		}

		// Add student if they exist (leftJoin may return null for empty groups)
		if (row.userId) {
			const studentId = row.userId;
			const studentName = `${row.userFirstName} ${row.userLastName}`;

			yearData.totalStudents.add(studentId);
			yearData.groups
				.get(groupId)!
				.students.push({ id: studentId, name: studentName });
		}
	}

	// Add all students from studentsByYear to ensure every year level has a complete group
	for (const [yearLevel, students] of Object.entries(studentsByYear)) {
		// Initialize year level if it doesn't exist
		if (!yearLevelMap.has(yearLevel)) {
			yearLevelMap.set(yearLevel, {
				totalStudents: new Set(),
				groups: new Map(),
			});
		}

		const yearData = yearLevelMap.get(yearLevel)!;

		// Create the YX group for all students in this year level
		const yearGroupKey = `AllStudents-Y${yearLevel}`;
		const yearGroupStudents = students.map((student) => ({
			id: student.id,
			name: `${student.firstName} ${student.lastName}`,
		}));

		yearData.groups.set(yearGroupKey, {
			name: `Year ${yearLevel} - All Students`,
			students: yearGroupStudents,
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
				Comments: student.name,
			}));

			yearGroups.push({
				Name: typeof groupId === 'number' ? `G${groupId}` : groupId,
				Number_of_Students: groupData.students.length,
				Comments: groupData.name,
				Subgroup: subgroups,
			});
		}

		studentsList.push({
			Name: `Y${yearLevel}`,
			Number_of_Students: data.totalStudents.size,
			Comments: `Year ${yearLevel}`,
			Group: yearGroups,
		});
	}

	return studentsList;
}

type FETActivity = {
	Teacher: string[];
	Subject: string;
	Students: string[];
	Duration: number;
	Total_Duration: number;
	Activity_Group_Id: number;
	Active: boolean;
	Comments: string;
	Id: number;
	dbActivityId: number;
	dbClassId: number;
};

function buildActivitiesList(classes: TimetableData['classes']): FETActivity[] {
	const activitiesList: FETActivity[] = [];

	for (const cls of classes) {
		const teacherIds = cls.teacherIds;

		const studentIdentifiers: string[] = [];
		if (cls.groupIds.length > 0) {
			studentIdentifiers.push(...cls.groupIds.map((id) => 'G' + id.toString()));
		}
		if (cls.yearLevels.length > 0) {
			studentIdentifiers.push(
				...cls.yearLevels.map((yl) => 'Y' + yl.yearLevelId.toString()),
			);
		}
		if (cls.studentIds.length > 0) {
			studentIdentifiers.push(
				...cls.studentIds.map((id) => 'S' + id.toString()),
			);
		}

		if (cls.activities.length === 0) {
			console.warn(`Class ${cls.id} skipped: no activities defined`);
			continue;
		}

		if (teacherIds.length === 0 || studentIdentifiers.length === 0) {
			console.warn(
				`Class ${cls.id} skipped: missing teachers or students`,
			);
			continue;
		}

		// FET requires a Total_Duration on every <Activity>, identical across all
		// activities sharing an Activity_Group_Id. We derive it as the sum of
		// child durations rather than storing it on the row.
		const classTotalDuration = cls.activities.reduce(
			(s, a) => s + a.duration,
			0,
		);

		for (const activity of cls.activities) {
			activitiesList.push({
				Teacher: teacherIds,
				Subject: cls.subjectOfferingId.toString(),
				Students: studentIdentifiers,
				Duration: activity.duration,
				Total_Duration: classTotalDuration,
				Activity_Group_Id: cls.id,
				Active: true,
				Comments: String(activity.id),
				Id: 0,
				dbActivityId: activity.id,
				dbClassId: cls.id,
			});
		}
	}

	activitiesList.forEach((a, index) => {
		a.Id = index + 1;
	});

	return activitiesList;
}

/** Map prefixed (`c-`/`a-`) IDs to FET sequential `Id`s for use in constraints. */
function buildIdMaps(activitiesList: FETActivity[]) {
	const activityDbIdToFetId = new Map<number, number>();
	const classDbIdToFetIds = new Map<number, number[]>();
	for (const a of activitiesList) {
		activityDbIdToFetId.set(a.dbActivityId, a.Id);
		const arr = classDbIdToFetIds.get(a.dbClassId) ?? [];
		arr.push(a.Id);
		classDbIdToFetIds.set(a.dbClassId, arr);
	}
	return { activityDbIdToFetId, classDbIdToFetIds };
}

function resolveActivityRefs(
	refs: unknown,
	activityDbIdToFetId: Map<number, number>,
	classDbIdToFetIds: Map<number, number[]>,
): number[] {
	if (!Array.isArray(refs)) return [];
	const out: number[] = [];
	for (const raw of refs) {
		const ref = String(raw);
		const m = /^([ca])-(\d+)$/.exec(ref);
		if (!m) {
			// Legacy or malformed entries: ignore.
			console.warn(`Skipping unrecognised Activity_Id ref: ${ref}`);
			continue;
		}
		const [, kind, idStr] = m;
		const id = parseInt(idStr, 10);
		if (kind === 'a') {
			const fetId = activityDbIdToFetId.get(id);
			if (fetId !== undefined) out.push(fetId);
		} else {
			const fetIds = classDbIdToFetIds.get(id) ?? [];
			out.push(...fetIds);
		}
	}
	return out;
}

function buildRoomsList(
	spaces: TimetableData['spaces'],
	buildings: TimetableData['buildings'],
) {
	return spaces.map((space) => {
		const building = buildings.find((b) => b.id === space.buildingId);

		return {
			Name: space.id,
			Building: building?.id || '',
			Capacity: space.capacity || 30,
			Virtual: false,
		};
	});
}

// fast-xml-builder renders an array value as N sibling elements with the same
// tag. This is what FET wants for repeatable constraints (e.g. multiple
// ConstraintRoomNotAvailableTimes entries), so we always accumulate into an
// array per fetName — even for singletons — and unwrap single-element arrays
// to stay compact in the common case.
function appendConstraint(
	bucket: Record<string, unknown[]>,
	fetName: string,
	params: unknown,
) {
	if (!bucket[fetName]) bucket[fetName] = [];
	bucket[fetName].push(params);
}

function finaliseBucket(bucket: Record<string, unknown[]>) {
	const out: Record<string, unknown> = {};
	for (const [fetName, entries] of Object.entries(bucket)) {
		out[fetName] = entries.length === 1 ? entries[0] : entries;
	}
	return out;
}

function buildConstraintsXML(
	constraints: TimetableData['activeConstraints'],
	activityDbIdToFetId: Map<number, number>,
	classDbIdToFetIds: Map<number, number[]>,
) {
	const timeBucket: Record<string, unknown[]> = {};
	const spaceBucket: Record<string, unknown[]> = {};

	for (const constraint of constraints) {
		try {
			const parsedParams =
				typeof constraint.parameters === 'string'
					? JSON.parse(constraint.parameters)
					: constraint.parameters;

			// Resolve any Activity_Id refs from `c-{id}`/`a-{id}` to FET sequential IDs.
			if (
				parsedParams &&
				typeof parsedParams === 'object' &&
				'Activity_Id' in parsedParams
			) {
				const resolved = resolveActivityRefs(
					(parsedParams as { Activity_Id: unknown }).Activity_Id,
					activityDbIdToFetId,
					classDbIdToFetIds,
				);
				(parsedParams as Record<string, unknown>).Activity_Id = resolved;
				if ('Number_of_Activities' in parsedParams) {
					(parsedParams as Record<string, unknown>).Number_of_Activities =
						resolved.length;
				}
			}

			const bucket = constraint.type === 'time' ? timeBucket : spaceBucket;
			appendConstraint(bucket, constraint.fetName, parsedParams);
		} catch (error) {
			console.error(
				`Error parsing ${constraint.type} constraint ${constraint.fetName}:`,
				error,
			);
		}
	}

	return { timeBucket, spaceBucket };
}

function buildPreferredRoomsConstraints(
	classes: TimetableData['classes'],
	activitiesList: FETActivity[],
) {
	const preferredRoomsConstraints: Array<{
		Weight_Percentage: number;
		Activity_Id: number;
		Number_of_Preferred_Rooms: number;
		Preferred_Room: string[];
		Active: boolean;
		Comments: string;
	}> = [];

	const classesWithLocations = classes.filter(
		(cls) => cls.locationIds.length > 0,
	);

	for (const cls of classesWithLocations) {
		const activityInstances = activitiesList.filter(
			(act) => act.dbClassId === cls.id,
		);

		for (const activityInstance of activityInstances) {
			preferredRoomsConstraints.push({
				Weight_Percentage: 95,
				Activity_Id: activityInstance.Id,
				Number_of_Preferred_Rooms: cls.locationIds.length,
				Preferred_Room: cls.locationIds.map((id) => id.toString()),
				Active: true,
				Comments: `Preferred rooms for class ${cls.id}`,
			});
		}
	}

	return preferredRoomsConstraints;
}

export async function buildFETInput({
	timetableDays,
	timetablePeriods,
	studentGroups,
	studentsByYear,
	classes,
	buildings,
	spaces,
	teachers,
	subjects,
	school,
	activeConstraints,
}: TimetableData) {
	const daysList = timetableDays.map((day) => ({ Name: day.id }));

	const hoursList = timetablePeriods.map((period) => ({ Name: period.id }));

	const subjectsList = subjects.map((subject) => ({ Name: subject.id }));

	const teachersList = await buildTeachersList(teachers);
	const studentsList = buildStudentsList(studentGroups, studentsByYear);
	const activitiesList = buildActivitiesList(classes);
	const { activityDbIdToFetId, classDbIdToFetIds } = buildIdMaps(activitiesList);

	const buildingsList = buildings.map((building) => ({ Name: building.id }));

	const roomsList = buildRoomsList(spaces, buildings);

	const { timeBucket, spaceBucket } = buildConstraintsXML(
		activeConstraints,
		activityDbIdToFetId,
		classDbIdToFetIds,
	);

	// Auto-synthesised ConstraintActivityPreferredRooms entries derived from
	// each class's location preferences. Merged into the bucket so they
	// coexist with any user-added entries of the same fetName.
	const preferredRoomsConstraints = buildPreferredRoomsConstraints(
		classes,
		activitiesList,
	);
	for (const entry of preferredRoomsConstraints) {
		appendConstraint(spaceBucket, 'ConstraintActivityPreferredRooms', entry);
	}

	const timeConstraintsXML = finaliseBucket(timeBucket);
	const spaceConstraintsXML = finaliseBucket(spaceBucket);

	// Strip internal-only fields from activities before serialization.
	const xmlActivities = activitiesList.map(
		({ dbActivityId: _a, dbClassId: _c, ...rest }) => rest,
	);

	const xmlData = {
		'?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
		fet: {
			'@_version': '7.3.0',
			Institution_Name: school?.id || 'Unknown School',
			Comments:
				'This is a timetable generated for a school working with eddi. Full credit goes to Liviu Lalescu and Volker Dirr for their work on FET (Free Timetabling Software) which we utilise to generate the output.',
			Days_List: { Number_of_Days: daysList.length, Day: daysList },
			Hours_List: { Number_of_Hours: hoursList.length, Hour: hoursList },
			Subjects_List: { Subject: subjectsList },
			Activity_Tags_List: {},
			Teachers_List: { Teacher: teachersList },
			Students_List: { Year: studentsList },
			Activities_List: { Activity: xmlActivities },
			Buildings_List: { Building: buildingsList },
			Rooms_List: { Room: roomsList },
			Time_Constraints_List: timeConstraintsXML,
			Space_Constraints_List: spaceConstraintsXML,
			Timetable_Generation_Options_List: {},
		},
	};

	const xmlBuilderOptions = {
		ignoreAttributes: false,
		format: true,
		suppressEmptyNode: true,
		attributeNamePrefix: '@_',
	};

	const builder = new XMLBuilder(xmlBuilderOptions);
	const xmlDataWithConstraints = builder.build(xmlData);
	return xmlDataWithConstraints;
}
