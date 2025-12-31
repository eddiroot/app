import { subjectGroupEnum, yearLevelEnum } from '$lib/enums';
import * as schema from '../../schema';
import type { Database } from '../types';
import type { DemoSchoolData, DemoSubjectData, DemoUserData } from './types';
// Subject definitions for the demo school
const DEMO_SUBJECTS = [
    { name: 'Mathematics', group: subjectGroupEnum.mathematics },
    { name: 'English', group: subjectGroupEnum.english },
    { name: 'Science', group: subjectGroupEnum.science },
    { name: 'Physical Education', group: subjectGroupEnum.science },
    { name: 'History', group: subjectGroupEnum.english },
    { name: 'Geography', group: subjectGroupEnum.science }
];

// Year levels for Foundation to Year 10
const F10_YEAR_LEVELS = [
    { level: yearLevelEnum.foundation, name: 'Foundation' },
    { level: yearLevelEnum.year1, name: 'Year 1' },
    { level: yearLevelEnum.year2, name: 'Year 2' },
    { level: yearLevelEnum.year3, name: 'Year 3' },
    { level: yearLevelEnum.year4, name: 'Year 4' },
    { level: yearLevelEnum.year5, name: 'Year 5' },
    { level: yearLevelEnum.year6, name: 'Year 6' },
    { level: yearLevelEnum.year7, name: 'Year 7' },
    { level: yearLevelEnum.year8, name: 'Year 8' },
    { level: yearLevelEnum.year9, name: 'Year 9' },
    { level: yearLevelEnum.year10, name: 'Year 10' }
];

export async function seedDemoSubjects(
    db: Database,
    schoolData: DemoSchoolData,
    userData: DemoUserData
): Promise<DemoSubjectData> {
    const { school, campus, yearLevels } = schoolData;

    // Create core subjects
    const coreSubjects: (typeof schema.coreSubject.$inferSelect)[] = [];

    for (const subjectDef of DEMO_SUBJECTS) {
        const [coreSubject] = await db
            .insert(schema.coreSubject)
            .values({
                name: subjectDef.name,
                description: `Core ${subjectDef.name}`,
                schoolId: school.id,
                subjectGroup: subjectDef.group
            })
            .returning();

        coreSubjects.push(coreSubject);
    }

    console.log(`  Created ${coreSubjects.length} core subjects`);

    // Create subjects for each year level
    const subjects: (typeof schema.subject.$inferSelect)[] = [];

    // Foundation to Year 10 subjects
    for (const coreSubject of coreSubjects) {
        for (const yearLevel of F10_YEAR_LEVELS) {
            // Find the matching yearLevel record
            const yearLevelRecord = yearLevels.find((yl) => yl.yearLevel === yearLevel.level);
            if (!yearLevelRecord) continue;

            const [subject] = await db
                .insert(schema.subject)
                .values({
                    name: `${yearLevel.name} ${coreSubject.name}`,
                    schoolId: school.id,
                    coreSubjectId: coreSubject.id,
                    yearLevelId: yearLevelRecord.id
                })
                .returning();

            subjects.push(subject);
        }
    }


    // Create subject offerings for Current Year
    const currentYear = new Date().getFullYear();
    const offeringsSem1 = subjects.map((subject) => ({
        subjectId: subject.id,
        year: currentYear,
        semester: 1,
        campusId: campus.id
    }));

    const offeringsSem2 = subjects.map((subject) => ({
        subjectId: subject.id,
        year: currentYear,
        semester: 2,
        campusId: campus.id
    }));

    const offerings = await db
        .insert(schema.subjectOffering)
        .values([...offeringsSem1, ...offeringsSem2])
        .returning();

    console.log(`  Created ${offerings.length} subject offerings`);

    // Filter to get Year 9 offerings for student/teacher assignments
    const year9YearLevel = yearLevels.find((yl) => yl.yearLevel === yearLevelEnum.year9);
    const year9Offerings = offerings.filter((offering) => {
        const subject = subjects.find((s) => s.id === offering.subjectId);
        return subject && subject.yearLevelId === year9YearLevel?.id;
    });

    // Create subject offering classes for Year 9 offerings (Semester 1)
    const year9Sem1Offerings = year9Offerings.filter((o) => o.semester === 1);
    const classes = await db
        .insert(schema.subjectOfferingClass)
        .values(
            year9Sem1Offerings.map((offering) => ({
                name: 'A',
                subOfferingId: offering.id
            }))
        )
        .returning();

    console.log(`  Created ${classes.length} subject offering classes for Year 9`);

    // Assign teachers to Year 9 subject offerings based on their specialisation
    const teacherSubjectMap = [
        { teacherIndex: 0, subjectKeyword: 'Mathematics' },
        { teacherIndex: 1, subjectKeyword: 'English' },
        { teacherIndex: 2, subjectKeyword: 'Science' },
        { teacherIndex: 3, subjectKeyword: 'Physical Education' },
        { teacherIndex: 4, subjectKeyword: 'History' },
        { teacherIndex: 5, subjectKeyword: 'Geography' }
    ];

    for (const { teacherIndex, subjectKeyword } of teacherSubjectMap) {
        const matchingOffering = year9Offerings.find((offering) => {
            const subject = subjects.find((s) => s.id === offering.subjectId);
            return subject && subject.name.includes(subjectKeyword);
        });

        if (matchingOffering && userData.teachers[teacherIndex]) {
            await db.insert(schema.userSubjectOffering).values({
                userId: userData.teachers[teacherIndex].id,
                subOfferingId: matchingOffering.id
            });
        }
    }

    console.log(`  Assigned ${userData.teachers.length} teachers to Year 9 subject offerings`);

    // Assign students to Year 9 subject offerings
    const year9Students = userData.students.filter((s) => s.yearLevel === yearLevelEnum.year9);
    for (const student of year9Students) {
        for (const offering of year9Offerings) {
            await db.insert(schema.userSubjectOffering).values({
                userId: student.id,
                subOfferingId: offering.id
            });
        }
    }

    console.log(`  Assigned ${year9Students.length} students to Year 9 subject offerings`);

    // Assign admin to all offerings
    for (const offering of offerings) {
        await db.insert(schema.userSubjectOffering).values({
            userId: userData.admin.id,
            subOfferingId: offering.id
        });
    }

    console.log(`  Assigned admin to all ${offerings.length} subject offerings`);

    // Create course map items for all offerings
    await seedCourseMapItems(db, offerings, subjects, coreSubjects);

    return {
        coreSubjects,
        subjects,
        offerings,
        classes,
        year9Offerings
    };
}

async function seedCourseMapItems(
    db: Database,
    offerings: (typeof schema.subjectOffering.$inferSelect)[],
    subjects: (typeof schema.subject.$inferSelect)[],
    coreSubjects: (typeof schema.coreSubject.$inferSelect)[]
) {
    const weeksPerSemester = 18;
    const totalWeeks = 36;
    const duration = 6;
    let itemCount = 0;

    for (const offering of offerings) {
        const subject = subjects.find((s) => s.id === offering.subjectId);
        if (!subject) continue;

        const coreSubject = coreSubjects.find((cs) => cs.id === subject.coreSubjectId);
        if (!coreSubject) continue;

        const subjectName = coreSubject.name;
        const baseTopics = getBaseTopicsForSubject(subjectName);

        for (let week = 1; week <= totalWeeks; week += duration) {
            const topicIndex = Math.floor(((week - 1) / totalWeeks) * baseTopics.length);
            const topic = baseTopics[topicIndex] || `${subjectName} Review`;

            const semester = week <= weeksPerSemester ? 1 : 2;
            const startWeekInSemester = semester === 1 ? week : week - weeksPerSemester;

            await db.insert(schema.courseMapItem).values({
                subjectOfferingId: offering.id,
                topic: topic,
                description: `${topic} activities and learning for ${subjectName}`,
                startWeek: startWeekInSemester,
                duration: duration,
                semester: semester,
                color: getSubjectColor(subjectName)
            });

            itemCount++;
        }
    }

    console.log(`  Created ${itemCount} course map items`);
}

function getBaseTopicsForSubject(subjectName: string): string[] {
    const topicMap: Record<string, string[]> = {
        Mathematics: [
            'Number and Algebra',
            'Measurement and Geometry',
            'Statistics and Probability',
            'Linear Equations',
            'Quadratic Functions'
        ],
        English: [
            'Reading Comprehension',
            'Creative Writing',
            'Poetry Analysis',
            'Essay Writing',
            'Literature Study',
            'Media Literacy',
        ],
        Science: [
            'Biology Fundamentals',
            'Chemistry Basics',
            'Physics Principles',
            'Scientific Method',
            'Environmental Science',
            'Human Body Systems',
        ],
        'Physical Education': [
            'Fitness and Health',
            'Team Sports',
            'Individual Sports',
            'Motor Skills',
            'Sports Psychology',
            'Nutrition',
        ],
        History: [
            'Ancient Civilizations',
            'Medieval Times',
            'Industrial Revolution',
            'World Wars',
            'Modern History',
            'Australian History'
        ],
        Geography: [
            'Physical Geography',
            'Human Geography',
            'Climate and Weather',
            'Environmental Systems',
            'Urban Geography',
            'Global Issues',
        ]
    };

    return topicMap[subjectName] || [
        `${subjectName} Fundamentals`,
        `${subjectName} Practice`,
        `${subjectName} Assessment`
    ];
}

function getSubjectColor(subjectName: string): string {
    const colorMap: Record<string, string> = {
        Mathematics: '#3B82F6',
        English: '#8B5CF6',
        Science: '#10B981',
        'Physical Education': '#EF4444',
        History: '#F59E0B',
        Geography: '#06B6D4'
    };

    return colorMap[subjectName] || '#6B7280';
}
