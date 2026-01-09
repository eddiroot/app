import { subjectGroupEnum, yearLevelEnum } from "$lib/enums";


// Student year levels: Year 7 - 10
export const DEMO_YEAR_LEVELS: yearLevelEnum[] = [...Object.values(yearLevelEnum).slice(8,12), yearLevelEnum.none];

export type DemoYearLevelIds = {
    'none': number;
    '7': number;
    '8': number;
    '9': number;
    '10': number;
}

export const STUDENTS_PER_YEAR_LEVEL = 60;
export const TOTAL_TEACHERS = 30;

// Subjects
export const DEMO_SUBJECTS = [
    { name: 'Mathematics', group: subjectGroupEnum.mathematics },
    { name: 'English', group: subjectGroupEnum.english },
    { name: 'Science', group: subjectGroupEnum.science },
    { name: 'Physical Education', group: subjectGroupEnum.science },
    { name: 'History', group: subjectGroupEnum.english },
    { name: 'Geography', group: subjectGroupEnum.science }
];