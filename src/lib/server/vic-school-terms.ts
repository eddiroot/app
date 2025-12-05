/**
 * Victorian School Term Dates (2025-2030)
 * Source: https://www.vic.gov.au/school-term-dates-and-holidays-victoria
 *
 * This file contains school term dates for Victorian government schools and kindergartens.
 * Note: For government schools, students typically start one day after the listed start date.
 */

export interface TermDate {
	termNumber: number;
	year: number;
	startDate: Date;
	endDate: Date;
	governmentSchoolStudentStartDate?: Date; // One day after the listed start date
}

export interface SchoolYear {
	year: number;
	terms: TermDate[];
}

const VICTORIAN_SCHOOL_TERMS: SchoolYear[] = [
	{
		year: 2025,
		terms: [
			{
				termNumber: 1,
				year: 2025,
				startDate: new Date('2025-01-28'),
				endDate: new Date('2025-04-04'),
				governmentSchoolStudentStartDate: new Date('2025-01-29')
			},
			{
				termNumber: 2,
				year: 2025,
				startDate: new Date('2025-04-22'),
				endDate: new Date('2025-07-04')
			},
			{
				termNumber: 3,
				year: 2025,
				startDate: new Date('2025-07-21'),
				endDate: new Date('2025-09-19')
			},
			{
				termNumber: 4,
				year: 2025,
				startDate: new Date('2025-10-06'),
				endDate: new Date('2025-12-19')
			}
		]
	},
	{
		year: 2026,
		terms: [
			{
				termNumber: 1,
				year: 2026,
				startDate: new Date('2026-01-27'),
				endDate: new Date('2026-04-02'),
				governmentSchoolStudentStartDate: new Date('2026-01-28')
			},
			{
				termNumber: 2,
				year: 2026,
				startDate: new Date('2026-04-20'),
				endDate: new Date('2026-06-26')
			},
			{
				termNumber: 3,
				year: 2026,
				startDate: new Date('2026-07-13'),
				endDate: new Date('2026-09-18')
			},
			{
				termNumber: 4,
				year: 2026,
				startDate: new Date('2026-10-05'),
				endDate: new Date('2026-12-18')
			}
		]
	},
	{
		year: 2027,
		terms: [
			{
				termNumber: 1,
				year: 2027,
				startDate: new Date('2027-01-27'),
				endDate: new Date('2027-03-25'),
				governmentSchoolStudentStartDate: new Date('2027-01-28')
			},
			{
				termNumber: 2,
				year: 2027,
				startDate: new Date('2027-04-12'),
				endDate: new Date('2027-06-25')
			},
			{
				termNumber: 3,
				year: 2027,
				startDate: new Date('2027-07-12'),
				endDate: new Date('2027-09-17')
			},
			{
				termNumber: 4,
				year: 2027,
				startDate: new Date('2027-10-04'),
				endDate: new Date('2027-12-17')
			}
		]
	},
	{
		year: 2028,
		terms: [
			{
				termNumber: 1,
				year: 2028,
				startDate: new Date('2028-01-27'),
				endDate: new Date('2028-03-31'),
				governmentSchoolStudentStartDate: new Date('2028-01-28')
			},
			{
				termNumber: 2,
				year: 2028,
				startDate: new Date('2028-04-18'),
				endDate: new Date('2028-06-30')
			},
			{
				termNumber: 3,
				year: 2028,
				startDate: new Date('2028-07-17'),
				endDate: new Date('2028-09-22')
			},
			{
				termNumber: 4,
				year: 2028,
				startDate: new Date('2028-10-09'),
				endDate: new Date('2028-12-21')
			}
		]
	},
	{
		year: 2029,
		terms: [
			{
				termNumber: 1,
				year: 2029,
				startDate: new Date('2029-01-29'),
				endDate: new Date('2029-03-29'),
				governmentSchoolStudentStartDate: new Date('2029-01-30')
			},
			{
				termNumber: 2,
				year: 2029,
				startDate: new Date('2029-04-16'),
				endDate: new Date('2029-06-29')
			},
			{
				termNumber: 3,
				year: 2029,
				startDate: new Date('2029-07-16'),
				endDate: new Date('2029-09-21')
			},
			{
				termNumber: 4,
				year: 2029,
				startDate: new Date('2029-10-08'),
				endDate: new Date('2029-12-21')
			}
		]
	},
	{
		year: 2030,
		terms: [
			{
				termNumber: 1,
				year: 2030,
				startDate: new Date('2030-01-29'),
				endDate: new Date('2030-04-05'),
				governmentSchoolStudentStartDate: new Date('2030-01-30')
			},
			{
				termNumber: 2,
				year: 2030,
				startDate: new Date('2030-04-23'),
				endDate: new Date('2030-06-28')
			},
			{
				termNumber: 3,
				year: 2030,
				startDate: new Date('2030-07-15'),
				endDate: new Date('2030-09-20')
			},
			{
				termNumber: 4,
				year: 2030,
				startDate: new Date('2030-10-07'),
				endDate: new Date('2030-12-20')
			}
		]
	}
];

/**
 * Get all term dates for a specific year
 */
export function getTermsByYear(year: number): [TermDate, TermDate, TermDate, TermDate] | null {
	const schoolYear = VICTORIAN_SCHOOL_TERMS.find((sy) => sy.year === year);

	if (!schoolYear) return null;

	return schoolYear.terms as [TermDate, TermDate, TermDate, TermDate];
}

/**
 * Get a specific term by year and term number
 */
export function getTerm(year: number, termNumber: number): TermDate | null {
	const terms = getTermsByYear(year);
	return terms?.find((t) => t.termNumber === termNumber) || null;
}

/**
 * Get the current term based on today's date
 */
export function getCurrentTerm(date: Date = new Date()): TermDate | null {
	for (const schoolYear of VICTORIAN_SCHOOL_TERMS) {
		for (const term of schoolYear.terms) {
			if (date >= term.startDate && date <= term.endDate) {
				return term;
			}
		}
	}
	return null;
}

/**
 * Get the next upcoming term
 */
export function getNextTerm(date: Date = new Date()): TermDate | null {
	for (const schoolYear of VICTORIAN_SCHOOL_TERMS) {
		for (const term of schoolYear.terms) {
			if (term.startDate > date) {
				return term;
			}
		}
	}
	return null;
}

/**
 * Check if a date falls within school holidays
 */
export function isSchoolHoliday(date: Date): boolean {
	for (const schoolYear of VICTORIAN_SCHOOL_TERMS) {
		for (let i = 0; i < schoolYear.terms.length; i++) {
			const currentTerm = schoolYear.terms[i];
			const nextTerm = schoolYear.terms[i + 1];

			if (nextTerm && date > currentTerm.endDate && date < nextTerm.startDate) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Get all available school years
 */
export function getAvailableYears(): number[] {
	return VICTORIAN_SCHOOL_TERMS.map((sy) => sy.year);
}

export default VICTORIAN_SCHOOL_TERMS;
