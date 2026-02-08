import { index, integer, pgSchema, primaryKey, text } from 'drizzle-orm/pg-core'
import { resource } from './resource'
import { subjectOffering } from './subject'
import { rubric, task } from './task'
import { essentials, hexColor } from './utils'

export const curriculumSchema = pgSchema('curriculum')

export const curriculumItem = curriculumSchema.table(
	'crclm_itm',
	{
		...essentials,
		topic: text().notNull(),
		description: text(),
		startWeek: integer(),
		duration: integer(),
		hexColor,
		subjectOfferingId: integer('sub_off_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	},
	(self) => [index().on(self.subjectOfferingId)],
)

export type CurriculumItem = typeof curriculumItem.$inferSelect

export const curriculumItemResource = curriculumSchema.table(
	'crclm_itm_res',
	{
		curriculumItemId: integer('crclm_itm_id')
			.notNull()
			.references(() => curriculumItem.id, { onDelete: 'cascade' }),
		resourceId: integer('res_id')
			.notNull()
			.references(() => resource.id, { onDelete: 'cascade' }),
	},
	(self) => [
		primaryKey({ columns: [self.curriculumItemId, self.resourceId] }),
		index().on(self.curriculumItemId),
		index().on(self.resourceId),
	],
)

export type CurriculumItemResource = typeof curriculumItemResource.$inferInsert

export const curriculumItemTask = curriculumSchema.table(
	'crclm_itm_tp',
	{
		...essentials,
		name: text().notNull(),
		scope: text().array(),
		description: text(),
		curriculumItemId: integer('crclm_itm_id')
			.notNull()
			.references(() => curriculumItem.id, { onDelete: 'cascade' }),
		taskId: integer().references(() => task.id, { onDelete: 'set null' }),
		rubricId: integer().references(() => rubric.id, { onDelete: 'set null' }),
	},
	(self) => [
		index().on(self.curriculumItemId),
		index().on(self.taskId),
		index().on(self.rubricId),
	],
)

export type CurriculumItemTaskPlan = typeof curriculumItemTask.$inferSelect

export const curriculumItemTaskResource = curriculumSchema.table(
	'crclm_itm_tp_res',
	{
		curriculumItemTaskPlanId: integer('crclm_itm_tp_id')
			.notNull()
			.references(() => curriculumItemTask.id, { onDelete: 'cascade' }),
		resourceId: integer('res_id')
			.notNull()
			.references(() => resource.id, { onDelete: 'cascade' }),
	},
	(self) => [
		primaryKey({ columns: [self.curriculumItemTaskPlanId, self.resourceId] }),
		index().on(self.curriculumItemTaskPlanId),
		index().on(self.resourceId),
	],
)

export type CurriculumItemTaskPlanResource =
	typeof curriculumItemTaskResource.$inferInsert
