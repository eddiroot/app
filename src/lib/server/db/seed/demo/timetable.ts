import { yearLevelEnum } from '$lib/enums';
import { and, eq } from 'drizzle-orm';
import * as schema from '../../schema';
import type { Database } from '../types';
import { ALL_CONSTRAINTS } from './FET-mapping/constraints';
import type { DemoSchoolData, DemoSubjectData, DemoUserData } from './types';

export async function seedDemoTimetable(
    db: Database,
    schoolData: DemoSchoolData,
    subjectData: DemoSubjectData,
    userData: DemoUserData
) {
    const { school, spaces } = schoolData;
    const { year9Offerings, subjects, classes: subjectOfferingClasses } = subjectData;
    const { teachers, students } = userData;

    // Get semester 1 for 2025
    const [semester1] = await db
        .select()
        .from(schema.schoolSemester)
        .where(
            and(
                eq(schema.schoolSemester.schoolId, school.id),
                eq(schema.schoolSemester.schoolYear, 2025),
                eq(schema.schoolSemester.semNumber, 1)
            )
        )
        .limit(1);

    // Create main timetable
    const [timetable] = await db
        .insert(schema.timetable)
        .values({
            schoolId: school.id,
            name: 'Main School Timetable 2025',
            schoolYear: 2025,
            schoolSemesterId: semester1?.id,
            isArchived: false
        })
        .returning();

    console.log(`  Created timetable: ${timetable.name}`);

    // Create a draft for the timetable
    const [draft] = await db
        .insert(schema.timetableDraft)
        .values({
            timetableId: timetable.id,
            name: 'Draft for Main School Timetable 2025'
        })
        .returning();

    // Create timetable days (Monday to Friday)
    await db
        .insert(schema.timetableDay)
        .values([
            { timetableDraftId: draft.id, day: 1 }, // Monday
            { timetableDraftId: draft.id, day: 2 }, // Tuesday
            { timetableDraftId: draft.id, day: 3 }, // Wednesday
            { timetableDraftId: draft.id, day: 4 }, // Thursday
            { timetableDraftId: draft.id, day: 5 }  // Friday
        ])
        .returning();

    // Create timetable periods (6 periods from 9:00 to 15:30)
    const periods = await db
        .insert(schema.timetablePeriod)
        .values([
            { timetableDraftId: draft.id, startTime: '09:00', endTime: '09:50' },
            { timetableDraftId: draft.id, startTime: '09:50', endTime: '10:40' },
            { timetableDraftId: draft.id, startTime: '11:00', endTime: '11:50' }, // 20 min break after period 2
            { timetableDraftId: draft.id, startTime: '11:50', endTime: '12:40' },
            { timetableDraftId: draft.id, startTime: '13:40', endTime: '14:30' }, // 1 hour lunch break after period 4
            { timetableDraftId: draft.id, startTime: '14:30', endTime: '15:20' }
        ])
        .returning();

    // Update the nextPeriodId chain for all periods
    for (let i = 0; i < periods.length; i++) {
        const currentPeriod = periods[i];
        const nextPeriod = periods[i + 1];

        await db
            .update(schema.timetablePeriod)
            .set({ nextPeriodId: nextPeriod ? nextPeriod.id : null })
            .where(eq(schema.timetablePeriod.id, currentPeriod.id));
    }

    console.log('  Created timetable structure (days and periods)');

    // Get Year 9 Semester 1 offerings (6 subjects)
    const year9Sem1Offerings = year9Offerings.filter((o) => o.semester === 1);
    const limitedYear9Offerings = year9Sem1Offerings.slice(0, 6);

    // Create timetable groups for Year 9 students - one group per subject
    const timetableGroups = [];
    for (let i = 0; i < limitedYear9Offerings.length; i++) {
        const offering = limitedYear9Offerings[i];
        const subject = subjects.find((s) => s.id === offering.subjectId);
        const subjectName = subject ? subject.name.replace('Year 9 ', '') : `Subject ${i + 1}`;

        const [group] = await db
            .insert(schema.timetableGroup)
            .values({
                timetableDraftId: draft.id,
                yearLevel: yearLevelEnum.year9,
                name: `Year 9 ${subjectName}`
            })
            .returning();

        timetableGroups.push(group);
    }

    // Assign all students to all groups
    const studentIds = students.filter((s) => s.yearLevel === yearLevelEnum.year9).map((s) => s.id);
    for (const group of timetableGroups) {
        for (const studentId of studentIds) {
            await db.insert(schema.timetableGroupMember).values({
                userId: studentId,
                groupId: group.id
            });
        }
    }

    // Create 2 activities for each group with variety of locations and assignments
    const teacherIds = teachers.map((t) => t.id);

    for (let groupIndex = 0; groupIndex < timetableGroups.length; groupIndex++) {
        const group = timetableGroups[groupIndex];
        const offering = limitedYear9Offerings[groupIndex];
        const teacherId = teacherIds[groupIndex];

        // Activity 1: Group-based activity with preferred rooms
        const [activity1] = await db
            .insert(schema.timetableActivity)
            .values({
                timetableDraftId: draft.id,
                subjectOfferingId: offering.id,
                periodsPerInstance: 1,
                totalPeriods: 3 // 3 periods per week
            })
            .returning();

        // Assign teacher to activity 1
        await db.insert(schema.timetableActivityTeacherPreference).values({
            timetableActivityId: activity1.id,
            teacherId: teacherId
        });

        // Assign group to activity 1
        await db.insert(schema.timetableActivityAssignedGroup).values({
            timetableActivityId: activity1.id,
            timetableGroupId: group.id
        });

        // Assign preferred rooms (rotate through available spaces)
        const spaceIndex = groupIndex % spaces.length;
        await db.insert(schema.timetableActivityPreferredSpace).values({
            timetableActivityId: activity1.id,
            schoolSpaceId: spaces[spaceIndex].id
        });

        // Activity 2: Mix of group and individual student assignments with different rooms
        const [activity2] = await db
            .insert(schema.timetableActivity)
            .values({
                timetableDraftId: draft.id,
                subjectOfferingId: offering.id,
                periodsPerInstance: 2, // Double period
                totalPeriods: 4 // 2 instances of 2 periods each per week
            })
            .returning();

        // Assign teacher to activity 2
        await db.insert(schema.timetableActivityTeacherPreference).values({
            timetableActivityId: activity2.id,
            teacherId: teacherId
        });

        // For some activities, assign to group; for others, assign to individual students or year level
        if (groupIndex % 3 === 0) {
            // Assign to year level
            await db.insert(schema.timetableActivityAssignedYear).values({
                timetableActivityId: activity2.id,
                yearlevel: yearLevelEnum.year9
            });
        } else if (groupIndex % 3 === 1) {
            // Assign to group
            await db.insert(schema.timetableActivityAssignedGroup).values({
                timetableActivityId: activity2.id,
                timetableGroupId: group.id
            });
        } else {
            // Assign to individual students
            for (const studentId of studentIds) {
                await db.insert(schema.timetableActivityAssignedStudent).values({
                    timetableActivityId: activity2.id,
                    userId: studentId
                });
            }
        }

        // Assign different preferred rooms (use next 2 spaces in rotation)
        const space1Index = (groupIndex + 1) % spaces.length;
        const space2Index = (groupIndex + 2) % spaces.length;
        await db.insert(schema.timetableActivityPreferredSpace).values([
            { timetableActivityId: activity2.id, schoolSpaceId: spaces[space1Index].id },
            { timetableActivityId: activity2.id, schoolSpaceId: spaces[space2Index].id }
        ]);
    }

    console.log(`  Created ${timetableGroups.length} timetable groups with activities`);

    // Seed constraints
    await seedTimetableConstraints(db, draft.id);

    // Create timetable allocations
    await seedTimetableAllocations(db, subjectOfferingClasses, spaces);
}

async function seedTimetableConstraints(db: Database, draftId: number) {
    // Convert constraint definitions to database format
    const constraintsToSeed = ALL_CONSTRAINTS.map((constraint) => ({
        FETName: constraint.FETName,
        friendlyName: constraint.friendlyName,
        description: constraint.description,
        type: constraint.type,
        optional: constraint.optional ?? true,
        repeatable: constraint.repeatable ?? true
    }));

    // Check if constraints already exist
    const existingConstraints = await db.select().from(schema.constraint);
    
    let allConstraints;
    if (existingConstraints.length === 0) {
        allConstraints = await db.insert(schema.constraint).values(constraintsToSeed).returning();
    } else {
        allConstraints = existingConstraints;
    }

    // Only add the mandatory constraints to the timetable draft
    const mandatoryConstraints = allConstraints.filter(
        (c) =>
            c.FETName === 'ConstraintBasicCompulsoryTime' ||
            c.FETName === 'ConstraintBasicCompulsorySpace'
    );

    for (const con of mandatoryConstraints) {
        await db.insert(schema.timetableDraftConstraint).values({
            timetableDraftId: draftId,
            constraintId: con.id,
            active: true,
            parameters: {
                Active: true,
                Comments: 'This is a mandatory constraint added by the seeding script.',
                Weight_Percentage: 100
            }
        });
    }

    console.log('  Seeded timetable constraints');
}

async function seedTimetableAllocations(
    db: Database,
    subjectOfferingClasses: (typeof schema.subjectOfferingClass.$inferSelect)[],
    spaces: (typeof schema.schoolSpace.$inferSelect)[]
) {
    // Calculate the most recent Monday
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const mostRecentMonday = new Date(today);
    mostRecentMonday.setDate(today.getDate() - daysToSubtract);
    mostRecentMonday.setHours(0, 0, 0, 0);

    const baseDate = mostRecentMonday;

    // Helper function to create a Date string for a specific day
    const createDate = (weekOffset: number, dayOffset: number) => {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + weekOffset * 7 + dayOffset);
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    };

    // Helper function to create a time string
    const createTime = (hour: number, minute: number = 0) => {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
    };

    // Define different weekly patterns to add variety (for 6 subjects)
    const weeklyPatterns = [
        // Week 1 Pattern - Standard Schedule
        [
            [0, 1, 2, 3, 4, 5], // Monday: Math, English, Science, PE, History, Geography
            [1, 2, 0, 4, 3, 5], // Tuesday
            [2, 0, 1, 5, 4, 3], // Wednesday
            [3, 4, 5, 1, 2, 0], // Thursday
            [5, 3, 4, 0, 1, 2]  // Friday
        ],
        // Week 2 Pattern - Math Heavy Start
        [
            [0, 0, 1, 2, 3, 4],
            [2, 1, 5, 0, 3, 4],
            [3, 2, 0, 1, 4, 5],
            [4, 5, 3, 2, 0, 1],
            [1, 0, 4, 5, 2, 3]
        ],
        // Week 3 Pattern - Science Focus
        [
            [2, 2, 0, 1, 3, 5],
            [0, 1, 3, 2, 4, 5],
            [1, 3, 2, 0, 5, 4],
            [5, 0, 1, 3, 2, 4],
            [3, 4, 5, 2, 1, 0]
        ],
        // Week 4 Pattern - Balanced Mix
        [
            [1, 3, 0, 2, 5, 4],
            [5, 0, 2, 1, 4, 3],
            [4, 1, 3, 5, 0, 2],
            [0, 2, 5, 4, 1, 3],
            [2, 4, 1, 3, 0, 5]
        ]
    ];

    const timetableEntries = [];

    // Create 4 weeks of timetable data with different patterns
    for (let week = 0; week < 4; week++) {
        const pattern = weeklyPatterns[week];

        // Create entries for each day of the week
        for (let day = 0; day < 5; day++) {
            const dayPattern = pattern[day];

            // Create 6 classes per day with the specified pattern
            for (let period = 0; period < 6; period++) {
                const subjectIndex = dayPattern[period];
                
                // Skip if we don't have enough subject offering classes
                if (subjectIndex >= subjectOfferingClasses.length) continue;

                let hour: number, minute: number;

                // Define time slots for each period
                switch (period) {
                    case 0: hour = 8; minute = 0; break;   // 8:00-9:00 AM
                    case 1: hour = 9; minute = 0; break;   // 9:00-10:00 AM
                    case 2: hour = 10; minute = 30; break; // 10:30-11:30 AM (after break)
                    case 3: hour = 11; minute = 30; break; // 11:30 AM-12:30 PM
                    case 4: hour = 13; minute = 30; break; // 1:30-2:30 PM (after lunch)
                    case 5: hour = 14; minute = 30; break; // 2:30-3:30 PM
                    default: hour = 8; minute = 0; break;
                }

                const timetableEntry = {
                    subjectOfferingClassId: subjectOfferingClasses[subjectIndex].id,
                    schoolSpaceId: spaces[subjectIndex % spaces.length].id,
                    date: createDate(week, day),
                    startTime: createTime(hour, minute),
                    endTime: createTime(hour + 1, minute) // 1 hour duration
                };

                timetableEntries.push(timetableEntry);
            }
        }
    }

    if (timetableEntries.length > 0) {
        await db.insert(schema.subjectClassAllocation).values(timetableEntries);
    }

    console.log(`  Created ${Math.ceil(timetableEntries.length / 30)} weeks of class allocations`);
}
