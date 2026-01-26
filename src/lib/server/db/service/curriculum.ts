import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurriculumSubjectsByCurriculumId(
	curriculumId: number,
) {
	const results = await db
		.select()
		.from(table.curriculumSubject)
		.where(eq(table.curriculumSubject.curriculumId, curriculumId));

	return results;
}
