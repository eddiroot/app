import {
	boolean,
	integer,
	pgSchema,
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
import { campus, school, yearLevel } from './schools';
import { subject, subjectOffering, subjectOfferingClass } from './subjects';
import { timestamps } from './utils';

export const userSchema = pgSchema('user');

export const userTypeEnumPg = userSchema.enum('enum_user_type', [
	userTypeEnum.none,
	userTypeEnum.student,
	userTypeEnum.teacher,
	userTypeEnum.guardian,
	userTypeEnum.principal,
	userTypeEnum.schoolAdmin
]);

export const userHonorificEnumPg = userSchema.enum('enum_user_honorific', [
	userHonorificEnum.mr,
	userHonorificEnum.ms,
	userHonorificEnum.mrs,
	userHonorificEnum.dr,
	userHonorificEnum.prof
]);

export const userGenderEnumPg = userSchema.enum('enum_gender', [
	userGenderEnum.male,
	userGenderEnum.female,
	userGenderEnum.nonBinary,
	userGenderEnum.other,
	userGenderEnum.unspecified
]);

export const user = userSchema.table('user', {
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
	yearLevelId: integer('year_level_id').notNull().references(() => yearLevel.id, { onDelete: 'cascade' }),
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

export const userCampus = userSchema.table('user_cmps', {
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

export const userSubjectOffering = userSchema.table('user_sub_off', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	subOfferingId: integer('sub_off_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	isComplete: integer('is_complete').default(0).notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	color: integer('color').default(100).notNull(),
	...timestamps
});

export type UserSubjectOffering = typeof userSubjectOffering.$inferSelect;

export const userSubjectOfferingClass = userSchema.table(
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

export const relationshipTypeEnumPg = userSchema.enum('enum_relationship_type', [
	relationshipTypeEnum.mother,
	relationshipTypeEnum.father,
	relationshipTypeEnum.guardian
]);

export const userRelationship = userSchema.table('user_relationship', {
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

export const session = userSchema.table('session', {
	id: text('id').primaryKey(),
	secretHash: text('secret_hash').notNull(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id),
	lastVerifiedAt: timestamp({ mode: 'date' }).notNull(),
	createdAt: timestamp({ mode: 'date' }).notNull()
});

export type Session = typeof session.$inferSelect;

export const userTeacherSpecialization = userSchema.table(
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
