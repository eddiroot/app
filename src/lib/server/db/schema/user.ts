import {
	boolean,
	integer,
	pgSchema,
	text,
	unique,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core'
import {
	relationshipTypeEnum,
	userGenderEnum,
	userHonorificEnum,
	userTypeEnum,
} from '../../../enums'
import { school, schoolCampus, schoolYearLevel } from './school'
import { subject, subjectOffering, subjectOfferingClass } from './subject'
import {
	enumToPgEnum,
	essentials,
	essentialsUUID,
	standardTimestamp,
	timestamps,
} from './utils'

export const userSchema = pgSchema('user')

export const userTypeEnumPg = userSchema.enum(
	'enum_user_type',
	enumToPgEnum(userTypeEnum),
)
export const userHonorificEnumPg = userSchema.enum(
	'enum_user_honorific',
	enumToPgEnum(userHonorificEnum),
)
export const userGenderEnumPg = userSchema.enum(
	'enum_gender',
	enumToPgEnum(userGenderEnum),
)

export const user = userSchema.table(
	'user',
	{
		...essentialsUUID,
		email: text().notNull().unique(),
		passwordHash: text(),
		googleId: text().unique(),
		microsoftId: text().unique(),
		schoolId: integer()
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
		type: userTypeEnumPg().notNull().default(userTypeEnum.none),
		gender: userGenderEnumPg().notNull().default(userGenderEnum.unspecified),
		dateOfBirth: standardTimestamp('date_of_birth'),
		honorific: userHonorificEnumPg(),
		schoolYearLevelId: integer('sch_yl_id')
			.notNull()
			.references(() => schoolYearLevel.id, { onDelete: 'cascade' }),
		firstName: text().notNull(),
		middleName: text(),
		lastName: text().notNull(),
		avatarPath: text(),
		verificationCode: text(),
		emailVerified: boolean().notNull().default(false),
	},
	(self) => [
		uniqueIndex().on(self.email),
		uniqueIndex().on(self.googleId),
		uniqueIndex().on(self.microsoftId),
	],
)

export type User = typeof user.$inferSelect

export const userCampus = userSchema.table('user_cmps', {
	...essentials,
	userId: uuid()
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	schoolCampusId: integer('sch_cmps_id')
		.notNull()
		.references(() => schoolCampus.id, { onDelete: 'cascade' }),
})

export type UserCampus = typeof userCampus.$inferSelect

// Largely for teachers and staff
export const userSpecialisation = userSchema.table('user_specialisation', {
	...essentials,
	userId: uuid()
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	subjectId: integer('sub_id')
		.notNull()
		.references(() => subject.id, { onDelete: 'cascade' }),
})

export type UserSpecialisation = typeof userSpecialisation.$inferSelect

export const userSubjectOffering = userSchema.table('user_sub_off', {
	...essentials,
	userId: uuid()
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	subOfferingId: integer('sub_off_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	isComplete: boolean('is_complete').default(false).notNull(),
	color: integer('color').default(100).notNull(),
})

export type UserSubjectOffering = typeof userSubjectOffering.$inferSelect

export const userSubjectOfferingClass = userSchema.table(
	'sub_off_cls_user',
	{
		...essentials,
		userId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		subOffClassId: integer('sub_off_class_id')
			.notNull()
			.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
		classNote: text(),
	},
	(self) => [unique().on(self.userId, self.subOffClassId)],
)

export type UserSubjectOfferingClass =
	typeof userSubjectOfferingClass.$inferSelect

export const relationshipTypeEnumPg = userSchema.enum(
	'enum_relationship_type',
	enumToPgEnum(relationshipTypeEnum),
)

export const userRelationship = userSchema.table('user_relationship', {
	...essentials,
	userId: uuid()
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	relatedUserId: uuid('related_user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	relationshipType: relationshipTypeEnumPg().notNull(),
})

export type UserRelationship = typeof userRelationship.$inferSelect

export const session = userSchema.table('session', {
	id: text().primaryKey(),
	secretHash: text().notNull(),
	userId: uuid()
		.notNull()
		.references(() => user.id),
	lastVerifiedAt: standardTimestamp('last_verified_at').notNull(),
	...timestamps,
})

export type Session = typeof session.$inferSelect
