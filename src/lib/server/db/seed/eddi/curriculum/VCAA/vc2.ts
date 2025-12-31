import { VCAAF10SubjectEnum, yearLevelEnum } from '$lib/enums';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as schema from '../../../../schema';
import type { Database } from '../../../types';

// Type definitions
interface VC2Standard {
    name: string;
    description: string;
    yearLevel: string;
    elaborations: string[];
}

interface VC2LearningArea {
    name: string;
    description: string;
    standards: VC2Standard[];
}

interface VC2Subject {
    name: string;
    url: string;
    learningAreas: VC2LearningArea[];
}

interface VC2Curriculum {
    scrapedAt: string;
    subjects: VC2Subject[];
}

function mapYearLevel(yearLevel: string): yearLevelEnum {
    const mapping: Record<string, yearLevelEnum> = {
        'Foundation': yearLevelEnum.foundation,
        'F': yearLevelEnum.foundation,
        'Level 1': yearLevelEnum.year1,
        'Level 2': yearLevelEnum.year2,
        'Level 3': yearLevelEnum.year3,
        'Level 4': yearLevelEnum.year4,
        'Level 5': yearLevelEnum.year5,
        'Level 6': yearLevelEnum.year6,
        'Level 7': yearLevelEnum.year7,
        'Level 8': yearLevelEnum.year8,
        'Level 9': yearLevelEnum.year9,
        'Level 10': yearLevelEnum.year10,
        '1': yearLevelEnum.year1,
        '2': yearLevelEnum.year2,
        '3': yearLevelEnum.year3,
        '4': yearLevelEnum.year4,
        '5': yearLevelEnum.year5,
        '6': yearLevelEnum.year6,
        '7': yearLevelEnum.year7,
        '8': yearLevelEnum.year8,
        '9': yearLevelEnum.year9,
        '10': yearLevelEnum.year10,
        '11': yearLevelEnum.year11,
        '12': yearLevelEnum.year12,
    };
    return mapping[yearLevel] || yearLevelEnum.none;
}

/**
 * Get all year levels for a given year level string.
 * For combined levels like "Level 9-10", returns both year levels.
 */
function getYearLevels(yearLevel: string): yearLevelEnum[] {
    const combinedMapping: Record<string, yearLevelEnum[]> = {
        'Foundation-Level 2': [yearLevelEnum.foundation, yearLevelEnum.year1, yearLevelEnum.year2],
        'Level 1-2': [yearLevelEnum.year1, yearLevelEnum.year2],
        'Level 3-4': [yearLevelEnum.year3, yearLevelEnum.year4],
        'Level 5-6': [yearLevelEnum.year5, yearLevelEnum.year6],
        'Level 7-8': [yearLevelEnum.year7, yearLevelEnum.year8],
        'Level 9-10': [yearLevelEnum.year9, yearLevelEnum.year10],
    };

    // Check if it's a combined level
    if (combinedMapping[yearLevel]) {
        return combinedMapping[yearLevel];
    }

    // Single year level
    const single = mapYearLevel(yearLevel);
    return single !== yearLevelEnum.none ? [single] : [];
}

export async function seedVC2Curriculum(db: Database, schoolId: number) {
    // Create curriculum record
    const [vc2Curriculum] = await db
        .insert(schema.curriculum)
        .values({
            name: 'VCAA Victorian Curriculum',
            version: 'VC2',
            schoolId,
            countryCode: 'AU',
            stateCode: 'VIC'
        })
        .returning();


    // Read curriculum data
    const dataPath = join(
        process.cwd(),
        'data',
        'VCAA',
        'VC2',
        'foundation-10',
        'vcaa-f10-currriculum.json'
    );
    const vc2Data: VC2Curriculum = JSON.parse(readFileSync(dataPath, 'utf-8'));

    // Create curriculum subjects
    const subjectMap = new Map<string, typeof schema.curriculumSubject.$inferSelect>();

    for (const subjectEnum of Object.values(VCAAF10SubjectEnum)) {
        const subjectName = subjectEnum
            .split('_')
            .map((word, index) => {
                if (word.toLowerCase() === 'and' && index > 0) return 'and';
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');

        const [curriculumSubject] = await db
            .insert(schema.curriculumSubject)
            .values({
                name: subjectName,
                curriculumId: vc2Curriculum.id
            })
            .returning();

        subjectMap.set(subjectName, curriculumSubject);
    }

    // Process learning areas, standards, and elaborations
    for (const subject of vc2Data.subjects) {
        const curriculumSubject = subjectMap.get(subject.name);
        if (!curriculumSubject) {
            continue;
        }

        for (const learningArea of subject.learningAreas) {
            const [la] = await db
                .insert(schema.learningArea)
                .values({
                    curriculumSubjectId: curriculumSubject.id,
                    name: learningArea.name
                })
                .returning();

            for (const standard of learningArea.standards) {
                const yearLevels = getYearLevels(standard.yearLevel);

                // Create a standard for each year level (duplicates for combined levels)
                for (const yearLevel of yearLevels) {
                    const [las] = await db
                        .insert(schema.learningAreaStandard)
                        .values({
                            learningAreaId: la.id,
                            code: standard.name,
                            description: standard.description,
                            yearLevel
                        })
                        .returning();

                    for (const elaboration of standard.elaborations) {
                        await db.insert(schema.standardElaboration).values({
                            learningAreaStandardId: las.id,
                            standardElaboration: elaboration
                        });
                    }
                }
            }
        }
    }
    return vc2Curriculum;
}