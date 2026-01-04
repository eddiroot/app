import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

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
		.where(and(eq(table.resource.id, resourceId), eq(table.resource.isArchived, false)))
		.limit(1);

	return resource || null;
}

export async function archiveResource(resourceId: number) {
	const [resource] = await db
		.update(table.resource)
		.set({ isArchived: true })
		.where(eq(table.resource.id, resourceId))
		.returning();

	return resource;
}
