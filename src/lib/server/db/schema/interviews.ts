import { boolean, integer, jsonb, pgSchema, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const interviewSchema = pgSchema('interviews');

export const interviewConfigs = interviewSchema.table('interview_configs', {
	id: uuid('id').primaryKey().defaultRandom(),
	schoolId: integer('school_id').notNull(),
	wholeSchool: boolean('whole_school').notNull().default(false),
	yearLevels: jsonb('year_levels'), // array of year level strings
	interviewDates: jsonb('interview_dates'), // array of date strings
	durationMinutes: integer('duration_minutes').notNull().default(15),
	autoAssign: boolean('auto_assign').notNull().default(true),
	deliveryModes: jsonb('delivery_modes'), // array of 'in_person' | 'online'
	dateTimeRanges: jsonb('date_time_ranges'), // { [date]: { start, end, breaks } }
	slotGenerationMode: varchar('slot_generation_mode', { length: 16 }).notNull().default('teacher'), // 'teacher' or 'class'
	isActive: boolean('is_active').notNull().default(false),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const interviewSlots = interviewSchema.table('interview_slots', {
	id: uuid('id').primaryKey().defaultRandom(),
	configId: uuid('config_id').notNull(),
	teacherId: uuid('teacher_id').notNull(),
	classId: integer('class_id'), // nullable for teacher-based slots
	date: varchar('date', { length: 16 }).notNull(), // YYYY-MM-DD
	startTime: varchar('start_time', { length: 8 }).notNull(), // HH:mm
	endTime: varchar('end_time', { length: 8 }).notNull(), // HH:mm
	duration: integer('duration').notNull(),
	deliveryMode: varchar('delivery_mode', { length: 16 }).notNull(),
	status: varchar('status', { length: 16 }).notNull().default('available'), // available/booked/blocked
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const interviewBookings = interviewSchema.table('interview_bookings', {
	id: uuid('id').primaryKey().defaultRandom(),
	slotId: uuid('slot_id').notNull(),
	parentId: uuid('parent_id').notNull(),
	studentId: uuid('student_id').notNull(),
	status: varchar('status', { length: 16 }).notNull().default('scheduled'),
	notes: varchar('notes', { length: 512 }),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});
