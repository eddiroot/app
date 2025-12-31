import {
	boolean,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	unique,
	uuid
} from 'drizzle-orm/pg-core';
import {
	relationshipTypeEnum,
	userGenderEnum,
	userHonorificEnum,
	userTypeEnum
} from '../../../enums';
import { campus, school } from './schools';
import { subject, subjectOffering, subjectOfferingClass } from './subjects';
import { timestamps, yearLevelEnumPg } from './utils';

export const userTypeEnumPg = pgEnum('enum_user_type', [
	userTypeEnum.none,
	userTypeEnum.student,
	userTypeEnum.teacher,
	userTypeEnum.guardian,
	userTypeEnum.principal,
	userTypeEnum.schoolAdmin
]);

export const userHonorificEnumPg = pgEnum('enum_user_honorific', [
	userHonorificEnum.mr,
	userHonorificEnum.ms,
	userHonorificEnum.mrs,
	userHonorificEnum.dr,
	userHonorificEnum.prof
]);

export const userGenderEnumPg = pgEnum('enum_gender', [
	userGenderEnum.male,
	userGenderEnum.female,
	userGenderEnum.nonBinary,
	userGenderEnum.other,
	userGenderEnum.unspecified
]);

export const user = pgTable('user', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash'),
	googleId: text('google_id').unique(),
	microsoftId: text('microsoft_id').unique(),
	schoolId: integer('school_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	type: userTypeEnumPg().notNull().default(userTypeEnum.none),
	gender: userGenderEnumPg().notNull().default(userGenderEnum.unspecified),
	dateOfBirth: timestamp('date_of_birth', { withTimezone: true, mode: 'date' }),
	honorific: userHonorificEnumPg(),
	yearLevel: yearLevelEnumPg().notNull(),
	firstName: text('first_name').notNull(),
	middleName: text('middle_name'),
	lastName: text('last_name').notNull(),
	avatarUrl: text('avatar_url'),
	verificationCode: text('verification_code'),
	emailVerified: boolean('email_verified').notNull().default(false),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type User = typeof user.$inferSelect;

export const userCampus = pgTable('user_cmps', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	campusId: integer('cmps_id')
		.notNull()
		.references(() => campus.id, { onDelete: 'cascade' }),
	...timestamps
});

export type UserCampus = typeof userCampus.$inferSelect;

export const userSubjectOffering = pgTable('user_sub_off', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	subOfferingId: integer('sub_off_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	isComplete: integer('is_complete').default(0).notNull(),
	isArchived: integer('is_archived').default(0).notNull(),
	color: integer('color').default(100).notNull(),
	...timestamps
});

export type UserSubjectOffering = typeof userSubjectOffering.$inferSelect;

export const userSubjectOfferingClass = pgTable(
	'sub_off_cls_user',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		subOffClassId: integer('sub_off_class_id')
			.notNull()
			.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
		classNote: text('class_note'),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [unique().on(self.userId, self.subOffClassId)]
);

export type UserSubjectOfferingClass = typeof userSubjectOfferingClass.$inferSelect;

export const relationshipTypeEnumPg = pgEnum('enum_relationship_type', [
	relationshipTypeEnum.mother,
	relationshipTypeEnum.father,
	relationshipTypeEnum.guardian
]);

export const userRelationship = pgTable('user_relationship', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	relatedUserId: uuid('related_user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	relationshipType: relationshipTypeEnumPg().notNull(),
	...timestamps
});

export type UserRelationship = typeof userRelationship.$inferSelect;

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	secretHash: text('secret_hash').notNull(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id),
	lastVerifiedAt: timestamp({ mode: 'date' }).notNull(),
	createdAt: timestamp({ mode: 'date' }).notNull()
});

export type Session = typeof session.$inferSelect;

export const userTeacherSpecialization = pgTable(
	'user_teacher_specialization',
	{
		teacherId: uuid('teacher_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		subjectId: integer('subject_id')
			.notNull()
			.references(() => subject.id, { onDelete: 'cascade' }),
		...timestamps
	},
	(table) => {
		return {
			pk: primaryKey({
				name: 'teacher_spec_pkey',
				columns: [table.teacherId, table.subjectId]
			})
		};
	}
);

export type TeacherSpecialization = typeof userTeacherSpecialization.$inferSelect;
