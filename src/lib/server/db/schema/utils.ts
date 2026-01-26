import {
	boolean,
	integer,
	text,
	time,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';

export const idUUID = uuid('id').defaultRandom().primaryKey();
export const idINT = integer('id')
	.primaryKey()
	.generatedAlwaysAsIdentity({ startWith: 1000 });

export const isArchived = boolean().notNull().default(false);

export const standardTimestamp = (name: string) =>
	timestamp(name, {
		mode: 'date', // Date mode for performance
		precision: 3, // Millisecond precision
		withTimezone: false, // Schools use local time without timezone
	});
export const standardTime = (name: string) =>
	time(name, {
		precision: 3, // Millisecond precision
		withTimezone: false, // Schools use local time without timezone
	});

export const timestamps = {
	createdAt: standardTimestamp('created_at').defaultNow().notNull(),
	updatedAt: standardTimestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
};

export const essentials = { id: idINT, isArchived, ...timestamps };
export const essentialsUUID = { id: idUUID, isArchived, ...timestamps };
export const essentialsNoId = { isArchived, ...timestamps };

export const hexColor = text().notNull().default('#FFFFFF');

export function enumToPgEnum<T extends Record<string, string>>(
	myEnum: T,
): [T[keyof T], ...T[keyof T][]] {
	return Object.values(myEnum) as [T[keyof T], ...T[keyof T][]];
}
