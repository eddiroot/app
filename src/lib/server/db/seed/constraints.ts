import { eq, notInArray } from 'drizzle-orm';

import * as table from '$lib/server/db/schema';

import { ALL_ENTRIES } from '../../../../routes/admin/timetables/[timetableId]/draft/[timetableDraftId]/constraints/registry/server';
import type { Database } from './types';

/**
 * Synchronises the `constraint` catalogue in the DB with the code-based
 * registry. Rows present in the DB but absent from the registry are archived
 * (not deleted) to preserve historic FK references from draft rows.
 *
 * The `constraint.fetName` column has no unique index, so upsert is done
 * manually: read existing rows, insert what's missing, update what's drifted.
 */
export async function syncConstraintsFromRegistry(db: Database) {
	if (ALL_ENTRIES.length === 0) return;

	const existing = await db
		.select({
			id: table.constraint.id,
			fetName: table.constraint.fetName,
			friendlyName: table.constraint.friendlyName,
			description: table.constraint.description,
			type: table.constraint.type,
			optional: table.constraint.optional,
			repeatable: table.constraint.repeatable,
			isArchived: table.constraint.isArchived,
		})
		.from(table.constraint);

	const byFetName = new Map(existing.map((row) => [row.fetName, row]));

	const toInsert: (typeof table.constraint.$inferInsert)[] = [];

	for (const entry of ALL_ENTRIES) {
		const current = byFetName.get(entry.fetName);
		if (!current) {
			toInsert.push({
				fetName: entry.fetName,
				friendlyName: entry.friendlyName,
				description: entry.description,
				type: entry.type,
				optional: entry.optional,
				repeatable: entry.repeatable,
				isArchived: false,
			});
			continue;
		}

		const drifted =
			current.friendlyName !== entry.friendlyName ||
			current.description !== entry.description ||
			current.type !== entry.type ||
			current.optional !== entry.optional ||
			current.repeatable !== entry.repeatable ||
			current.isArchived === true;

		if (drifted) {
			await db
				.update(table.constraint)
				.set({
					friendlyName: entry.friendlyName,
					description: entry.description,
					type: entry.type,
					optional: entry.optional,
					repeatable: entry.repeatable,
					isArchived: false,
				})
				.where(eq(table.constraint.id, current.id));
		}
	}

	if (toInsert.length > 0) {
		await db.insert(table.constraint).values(toInsert);
	}

	const knownFetNames = ALL_ENTRIES.map((e) => e.fetName);
	await db
		.update(table.constraint)
		.set({ isArchived: true })
		.where(notInArray(table.constraint.fetName, knownFetNames));
}
