import { RecordFlagEnum } from '$lib/enums';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { notArchived, setFlagExpr } from './utils';

export async function createResource(
	name: string,
	fileName: string,
	objectKey: string,
	contentType: string,
	fileSize: number,
	resourceType: string,
	uploadedBy: string,
	description?: string,
	bucketName: string = 'schools'
) {
	const [resource] = await db
		.insert(table.resource)
		.values({
			fileName,
			objectKey,
			bucketName,
			contentType,
			fileSize,
			resourceType,
			uploadedBy
		})
		.returning();

	return resource;
}

export async function getResourceById(resourceId: number) {
	const [resource] = await db
		.select()
		.from(table.resource)
		.where(and(eq(table.resource.id, resourceId), notArchived(table.resource.flags)))
		.limit(1);

	return resource || null;
}

export async function archiveResource(resourceId: number) {
	const [resource] = await db
		.update(table.resource)
		.set({ flags: setFlagExpr(table.resource.flags, RecordFlagEnum.archived) })
		.where(eq(table.resource.id, resourceId))
		.returning();

	return resource;
}
