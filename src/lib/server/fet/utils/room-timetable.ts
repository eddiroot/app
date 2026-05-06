import { db } from '$lib/server/db/index';
import { userTypeEnum } from '$lib/enums';
import { and, eq, inArray } from 'drizzle-orm';
import * as table from '../../db/schema';
import {
	subject,
	subjectOffering,
	subjectOfferingClass,
} from '../../db/schema';

export type RoomSession = {
	id: number;
	subjectName: string;
	className: string;
	teacherNames: string[];
	start: string;
	end: string;
	durationMinutes: number;
	dayId: number;
	dayNumber: number;
};

export type RoomDaySchedule = {
	dayNumber: number;
	dayName: string;
	sessions: RoomSession[];
	totalHours: number;
};

export type RoomTimetable = {
	spaceId: number;
	spaceName: string;
	spaceType: string;
	days: RoomDaySchedule[];
	totalHoursPerCycle: number;
	averageHoursPerDay: number;
};

function calculateDurationMinutes(start: string, end: string): number {
	const [startHour, startMin] = start.split(':').map(Number);
	const [endHour, endMin] = end.split(':').map(Number);
	return endHour * 60 + endMin - (startHour * 60 + startMin);
}

async function getRoomAllocations(spaceId: number, timetableDraftId: number) {
	const allocations = await db
		.select({
			allocationId: table.fetSubjectClassAllocation.id,
			fetSubOffClassId:
				table.fetSubjectClassAllocation.fetSubjectOfferingClassId,
			dayId: table.fetSubjectClassAllocation.dayId,
			dayNumber: table.timetableDay.day,
			startPeriodId: table.fetSubjectClassAllocation.startPeriodId,
			endPeriodId: table.fetSubjectClassAllocation.endPeriodId,
			start: table.timetablePeriod.start,
		})
		.from(table.fetSubjectClassAllocation)
		.innerJoin(
			table.timetableDay,
			eq(table.fetSubjectClassAllocation.dayId, table.timetableDay.id),
		)
		.innerJoin(
			table.timetablePeriod,
			eq(
				table.fetSubjectClassAllocation.startPeriodId,
				table.timetablePeriod.id,
			),
		)
		.innerJoin(
			table.fetSubjectOfferingClass,
			eq(
				table.fetSubjectClassAllocation.fetSubjectOfferingClassId,
				table.fetSubjectOfferingClass.id,
			),
		)
		.where(
			and(
				eq(table.fetSubjectClassAllocation.schoolSpaceId, spaceId),
				eq(table.fetSubjectOfferingClass.timetableDraftId, timetableDraftId),
				eq(table.fetSubjectClassAllocation.isArchived, false),
				eq(table.fetSubjectOfferingClass.isArchived, false),
			),
		);

	if (allocations.length === 0) return [];

	const endPeriodIds = [...new Set(allocations.map((a) => a.endPeriodId))];
	const endPeriods = await db
		.select({ id: table.timetablePeriod.id, end: table.timetablePeriod.end })
		.from(table.timetablePeriod)
		.where(inArray(table.timetablePeriod.id, endPeriodIds));

	const endPeriodMap = new Map(endPeriods.map((p) => [p.id, p.end]));

	return allocations.map((alloc) => ({
		...alloc,
		end: endPeriodMap.get(alloc.endPeriodId) ?? alloc.start,
	}));
}

async function getSubjectDetailsForClasses(fetClassIds: number[]) {
	if (fetClassIds.length === 0) return [];

	return db
		.select({
			fetClassId: table.fetSubjectOfferingClass.id,
			subjectName: subject.name,
			className: subjectOfferingClass.name,
		})
		.from(table.fetSubjectOfferingClass)
		.innerJoin(
			subjectOffering,
			eq(table.fetSubjectOfferingClass.subjectOfferingId, subjectOffering.id),
		)
		.innerJoin(subject, eq(subjectOffering.subjectId, subject.id))
		.leftJoin(
			subjectOfferingClass,
			eq(subjectOffering.id, subjectOfferingClass.subOfferingId),
		)
		.where(inArray(table.fetSubjectOfferingClass.id, fetClassIds));
}

async function getTeachersForClasses(fetClassIds: number[]) {
	if (fetClassIds.length === 0) return new Map<number, string[]>();

	const teachers = await db
		.select({
			fetClassId: table.fetSubjectOfferingClassUser.fetSubOffClassId,
			firstName: table.user.firstName,
			lastName: table.user.lastName,
		})
		.from(table.fetSubjectOfferingClassUser)
		.innerJoin(
			table.user,
			eq(table.fetSubjectOfferingClassUser.userId, table.user.id),
		)
		.where(
			and(
				inArray(
					table.fetSubjectOfferingClassUser.fetSubOffClassId,
					fetClassIds,
				),
				eq(table.fetSubjectOfferingClassUser.isArchived, false),
				eq(table.user.type, userTypeEnum.teacher),
			),
		);

	const teacherMap = new Map<number, string[]>();
	for (const t of teachers) {
		const existing = teacherMap.get(t.fetClassId) ?? [];
		existing.push(`${t.firstName} ${t.lastName}`);
		teacherMap.set(t.fetClassId, existing);
	}
	return teacherMap;
}

export async function generateRoomTimetable(
	spaceId: number,
	timetableDraftId: number,
): Promise<RoomTimetable> {
	const spaceResult = await db
		.select({
			id: table.schoolSpace.id,
			name: table.schoolSpace.name,
			type: table.schoolSpace.type,
		})
		.from(table.schoolSpace)
		.where(eq(table.schoolSpace.id, spaceId))
		.limit(1);

	if (spaceResult.length === 0) {
		throw new Error(`Space with ID ${spaceId} not found`);
	}
	const space = spaceResult[0];

	const timetableDays = await db
		.select()
		.from(table.timetableDay)
		.where(eq(table.timetableDay.timetableDraftId, timetableDraftId))
		.orderBy(table.timetableDay.day);

	const allocations = await getRoomAllocations(spaceId, timetableDraftId);

	if (allocations.length === 0) {
		return {
			spaceId,
			spaceName: space.name,
			spaceType: space.type,
			days: timetableDays.map((day) => ({
				dayNumber: day.day,
				dayName: 'Day ' + day.day,
				sessions: [],
				totalHours: 0,
			})),
			totalHoursPerCycle: 0,
			averageHoursPerDay: 0,
		};
	}

	const fetClassIds = [...new Set(allocations.map((a) => a.fetSubOffClassId))];

	const [subjectDetails, teacherMap] = await Promise.all([
		getSubjectDetailsForClasses(fetClassIds),
		getTeachersForClasses(fetClassIds),
	]);

	const subjectMap = new Map(subjectDetails.map((s) => [s.fetClassId, s]));

	const sessions: RoomSession[] = allocations.map((alloc) => {
		const detail = subjectMap.get(alloc.fetSubOffClassId);
		return {
			id: alloc.allocationId,
			subjectName: detail?.subjectName ?? 'Unknown',
			className: detail?.className ?? '',
			teacherNames: teacherMap.get(alloc.fetSubOffClassId) ?? [],
			start: alloc.start,
			end: alloc.end,
			durationMinutes: calculateDurationMinutes(alloc.start, alloc.end),
			dayId: alloc.dayId,
			dayNumber: alloc.dayNumber,
		};
	});

	const days: RoomDaySchedule[] = timetableDays.map((day) => {
		const daySessions = sessions
			.filter((s) => s.dayNumber === day.day)
			.sort((a, b) => a.start.localeCompare(b.start));

		return {
			dayNumber: day.day,
			dayName: 'Day ' + day.day,
			sessions: daySessions,
			totalHours:
				daySessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60,
		};
	});

	const totalHoursPerCycle = days.reduce((sum, d) => sum + d.totalHours, 0);
	const daysWithSessions = days.filter((d) => d.sessions.length > 0).length;

	return {
		spaceId,
		spaceName: space.name,
		spaceType: space.type,
		days,
		totalHoursPerCycle,
		averageHoursPerDay:
			daysWithSessions > 0 ? totalHoursPerCycle / daysWithSessions : 0,
	};
}
