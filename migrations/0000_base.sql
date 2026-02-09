CREATE EXTENSION IF NOT EXISTS vector;
CREATE SCHEMA "curriculum";
--> statement-breakpoint
CREATE SCHEMA "event";
--> statement-breakpoint
CREATE SCHEMA "task";
--> statement-breakpoint
CREATE SCHEMA "school";
--> statement-breakpoint
CREATE SCHEMA "timetable";
--> statement-breakpoint
CREATE SCHEMA "subject";
--> statement-breakpoint
CREATE SCHEMA "user";
--> statement-breakpoint
CREATE SCHEMA "resource";
--> statement-breakpoint
CREATE SCHEMA "news";
--> statement-breakpoint
CREATE TYPE "event"."enum_event_type" AS ENUM('school', 'campus', 'subject', 'class');--> statement-breakpoint
CREATE TYPE "task"."enum_grade_release" AS ENUM('instant', 'scheduled', 'manual');--> statement-breakpoint
CREATE TYPE "task"."enum_quiz_mode" AS ENUM('none', 'scheduled', 'manual');--> statement-breakpoint
CREATE TYPE "task"."enum_rubric_level" AS ENUM('exemplary', 'accomplished', 'developing', 'beginning');--> statement-breakpoint
CREATE TYPE "task"."enum_task_block_type" AS ENUM('heading', 'rich_text', 'math_input', 'image', 'video', 'audio', 'fill_blank', 'choice', 'whiteboard', 'matching', 'short_answer', 'close', 'highlight_text', 'table', 'graph', 'balancing_equations', 'submission');--> statement-breakpoint
CREATE TYPE "task"."enum_task_status" AS ENUM('draft', 'in_progress', 'completed', 'published', 'locked', 'graded');--> statement-breakpoint
CREATE TYPE "task"."enum_task_type" AS ENUM('lesson', 'homework', 'test', 'assignment');--> statement-breakpoint
CREATE TYPE "task"."enum_whiteboard_object_type" AS ENUM('Rect', 'Circle', 'Path', 'Textbox', 'Image');--> statement-breakpoint
CREATE TYPE "school"."enum_grade_scale" AS ENUM('IB_DP', 'IB_MYP', 'IB_PYP', 'IB_CP', 'GPA', 'percentage');--> statement-breakpoint
CREATE TYPE "school"."enum_sch_space_type" AS ENUM('classroom', 'laboratory', 'gymnasium', 'pool', 'library', 'auditorium');--> statement-breakpoint
CREATE TYPE "school"."enum_year_level" AS ENUM('N', 'F', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');--> statement-breakpoint
CREATE TYPE "timetable"."enum_constraint_type" AS ENUM('time', 'space');--> statement-breakpoint
CREATE TYPE "timetable"."enum_tt_queue_status" AS ENUM('queued', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "subject"."enum_sub_off_cls_allo_att_comp_type" AS ENUM('present', 'absent', 'class_pass');--> statement-breakpoint
CREATE TYPE "subject"."enum_sub_cls_allo_att_stat" AS ENUM('present', 'absent');--> statement-breakpoint
CREATE TYPE "subject"."enum_sub_thread_res_type" AS ENUM('comment', 'answer');--> statement-breakpoint
CREATE TYPE "subject"."enum_sub_thread_type" AS ENUM('discussion', 'question', 'announcement', 'qanda');--> statement-breakpoint
CREATE TYPE "user"."enum_relationship_type" AS ENUM('mother', 'father', 'grandmother', 'grandfather', 'aunt', 'uncle', 'sister', 'brother', 'guardian');--> statement-breakpoint
CREATE TYPE "user"."enum_gender" AS ENUM('male', 'female', 'non-binary', 'other', 'unspecified');--> statement-breakpoint
CREATE TYPE "user"."enum_user_honorific" AS ENUM('Mr', 'Ms', 'Mrs', 'Dr', 'Prof');--> statement-breakpoint
CREATE TYPE "user"."enum_user_type" AS ENUM('N', 'student', 'guardian', 'teacher', 'staff', 'principal', 'admin');--> statement-breakpoint
CREATE TYPE "news"."enum_news_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "news"."enum_news_status" AS ENUM('draft', 'scheduled', 'published');--> statement-breakpoint
CREATE TYPE "news"."enum_news_visibility" AS ENUM('public', 'internal', 'staff', 'students');--> statement-breakpoint
CREATE TABLE "curriculum"."crclm_itm" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "curriculum"."crclm_itm_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"topic" text NOT NULL,
	"description" text,
	"startWeek" integer,
	"duration" integer,
	"hexColor" text DEFAULT '#FFFFFF' NOT NULL,
	"sub_off_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curriculum"."crclm_itm_res" (
	"crclm_itm_id" integer NOT NULL,
	"res_id" integer NOT NULL,
	CONSTRAINT "crclm_itm_res_crclm_itm_id_res_id_pk" PRIMARY KEY("crclm_itm_id","res_id")
);
--> statement-breakpoint
CREATE TABLE "curriculum"."crclm_itm_tp" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "curriculum"."crclm_itm_tp_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"scope" text[],
	"description" text,
	"crclm_itm_id" integer NOT NULL,
	"taskId" integer,
	"rubricId" integer
);
--> statement-breakpoint
CREATE TABLE "curriculum"."crclm_itm_tp_res" (
	"crclm_itm_tp_id" integer NOT NULL,
	"res_id" integer NOT NULL,
	CONSTRAINT "crclm_itm_tp_res_crclm_itm_tp_id_res_id_pk" PRIMARY KEY("crclm_itm_tp_id","res_id")
);
--> statement-breakpoint
CREATE TABLE "event"."evt" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event"."evt_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"type" "event"."enum_event_type" NOT NULL,
	"start" timestamp (3) NOT NULL,
	"end" timestamp (3) NOT NULL,
	"requiresRSVP" boolean DEFAULT false NOT NULL,
	"sch_id" integer,
	"sch_cmps_id" integer,
	"sub_off_id" integer,
	"sub_off_cls_id" integer
);
--> statement-breakpoint
CREATE TABLE "event"."evt_rsvp" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event"."evt_rsvp_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL,
	"eventId" integer NOT NULL,
	"isAttending" boolean NOT NULL,
	CONSTRAINT "evt_rsvp_userId_eventId_unique" UNIQUE("userId","eventId")
);
--> statement-breakpoint
CREATE TABLE "task"."cls_task_block_res" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "task"."cls_task_block_res_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"taskBlockId" integer NOT NULL,
	"authorId" uuid NOT NULL,
	"cls_task_id" integer NOT NULL,
	"response" jsonb,
	"feedback" text,
	"marks" double precision,
	CONSTRAINT "cls_task_block_res_taskBlockId_authorId_cls_task_id_unique" UNIQUE("taskBlockId","authorId","cls_task_id")
);
--> statement-breakpoint
CREATE TABLE "task"."cls_task_res" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "task"."cls_task_res_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"cls_task_id" integer NOT NULL,
	"comment" text,
	"feedback" text,
	"authorId" uuid NOT NULL,
	"teacherId" uuid,
	"quiz_started_at" timestamp (3),
	"quiz_submitted_at" timestamp (3),
	CONSTRAINT "cls_task_res_cls_task_id_authorId_unique" UNIQUE("cls_task_id","authorId")
);
--> statement-breakpoint
CREATE TABLE "task"."cls_task_res_resource" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "task"."cls_task_res_resource_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"cls_task_res_id" integer NOT NULL,
	"res_id" integer NOT NULL,
	"authorId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task"."rubric" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "task"."rubric_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task"."rubric_cell" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "task"."rubric_cell_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"rowId" integer NOT NULL,
	"level" "task"."enum_rubric_level" NOT NULL,
	"description" text NOT NULL,
	"marks" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task"."rubric_cell_feedback" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "task"."rubric_cell_feedback_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"feedback" text,
	"cls_task_res_id" integer NOT NULL,
	"rubricRowId" integer NOT NULL,
	"rubricCellId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task"."rubric_row" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "task"."rubric_row_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"rubricId" integer NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task"."sub_off_cls_task" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "task"."sub_off_cls_task_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"index" integer NOT NULL,
	"status" "task"."enum_task_status" DEFAULT 'draft' NOT NULL,
	"sub_off_cls_id" integer NOT NULL,
	"taskId" integer NOT NULL,
	"authorId" uuid NOT NULL,
	"crclm_item_id" integer,
	"week" integer,
	"due" timestamp (3),
	"rubricId" integer,
	"quizMode" "task"."enum_quiz_mode" DEFAULT 'none' NOT NULL,
	"quiz_start" timestamp (3),
	"quizDurationMinutes" integer,
	"gradeRelease" "task"."enum_grade_release" DEFAULT 'instant' NOT NULL,
	"grade_release_time" timestamp (3),
	CONSTRAINT "sub_off_cls_task_sub_off_cls_id_taskId_unique" UNIQUE("sub_off_cls_id","taskId")
);
--> statement-breakpoint
CREATE TABLE "task"."task" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "task"."task_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"type" "task"."enum_task_type" NOT NULL,
	"description" text NOT NULL,
	"rubricId" integer,
	"sub_off_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task"."task_block" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "task"."task_block_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"taskId" integer NOT NULL,
	"type" "task"."enum_task_block_type" NOT NULL,
	"config" jsonb NOT NULL,
	"index" integer DEFAULT 0 NOT NULL,
	"availableMarks" integer
);
--> statement-breakpoint
CREATE TABLE "task"."wb" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "task"."wb_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"title" text,
	"taskId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task"."wb_obj" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "task"."wb_obj_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"whiteboardId" integer NOT NULL,
	"objectId" text NOT NULL,
	"objectType" "task"."enum_whiteboard_object_type" NOT NULL,
	"objectData" jsonb NOT NULL,
	CONSTRAINT "wb_obj_objectId_unique" UNIQUE("objectId")
);
--> statement-breakpoint
CREATE TABLE "school"."grade_scale" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "school"."grade_scale_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"gradeScaleType" "school"."enum_grade_scale" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school"."grade_scale_level" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "school"."grade_scale_level_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"grade_scale_id" integer NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"minimumScore" double precision NOT NULL,
	"maximumScore" double precision NOT NULL,
	"gradeValue" double precision
);
--> statement-breakpoint
CREATE TABLE "school"."sch" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "school"."sch_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"logoPath" text,
	"countryCode" varchar(2) NOT NULL,
	"stateCode" varchar(3) NOT NULL,
	CONSTRAINT "sch_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "school"."sch_bvr" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "school"."sch_bvr_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sch_id" integer NOT NULL,
	"level_id" integer NOT NULL,
	CONSTRAINT "sch_bvr_sch_id_name_unique" UNIQUE("sch_id","name")
);
--> statement-breakpoint
CREATE TABLE "school"."sch_bvr_lvl" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "school"."sch_bvr_lvl_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"level" integer NOT NULL,
	"name" text NOT NULL,
	"sch_id" integer NOT NULL,
	CONSTRAINT "sch_bvr_lvl_sch_id_level_unique" UNIQUE("sch_id","level"),
	CONSTRAINT "valid_level_range" CHECK ("school"."sch_bvr_lvl"."level" >= 0 AND "school"."sch_bvr_lvl"."level" <= 10)
);
--> statement-breakpoint
CREATE TABLE "school"."sch_bldng" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "school"."sch_bldng_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sch_cmps_id" integer NOT NULL,
	CONSTRAINT "sch_bldng_sch_cmps_id_name_unique" UNIQUE("sch_cmps_id","name")
);
--> statement-breakpoint
CREATE TABLE "school"."sch_cmps" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "school"."sch_cmps_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"address" text NOT NULL,
	"sch_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school"."sch_sem" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "school"."sch_sem_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"year" integer NOT NULL,
	"number" integer NOT NULL,
	"sch_id" integer NOT NULL,
	CONSTRAINT "sch_sem_sch_id_number_unique" UNIQUE("sch_id","number")
);
--> statement-breakpoint
CREATE TABLE "school"."sch_space" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "school"."sch_space_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "school"."enum_sch_space_type" NOT NULL,
	"capacity" integer,
	"sch_bldng_id" integer NOT NULL,
	CONSTRAINT "sch_space_sch_bldng_id_name_unique" UNIQUE("sch_bldng_id","name")
);
--> statement-breakpoint
CREATE TABLE "school"."sch_term" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "school"."sch_term_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"number" integer NOT NULL,
	"start" timestamp (3) NOT NULL,
	"end" timestamp (3) NOT NULL,
	"sch_sem_id" integer NOT NULL,
	CONSTRAINT "sch_term_sch_sem_id_number_unique" UNIQUE("sch_sem_id","number")
);
--> statement-breakpoint
CREATE TABLE "school"."sch_yl" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "school"."sch_yl_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"code" "school"."enum_year_level" NOT NULL,
	"sch_id" integer NOT NULL,
	"grade_scale_id" integer
);
--> statement-breakpoint
CREATE TABLE "timetable"."con" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."con_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"fetName" text NOT NULL,
	"friendlyName" text NOT NULL,
	"description" text NOT NULL,
	"type" "timetable"."enum_constraint_type" NOT NULL,
	"optional" boolean NOT NULL,
	"repeatable" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable"."fet_sub_off_cls_allo" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."fet_sub_off_cls_allo_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"fet_sub_off_cls_id" integer NOT NULL,
	"sch_space_id" integer NOT NULL,
	"dayId" integer NOT NULL,
	"start_period_id" integer NOT NULL,
	"end_period_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable"."fet_sub_off_cls" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."fet_sub_off_cls_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"tt_draft_id" integer NOT NULL,
	"sub_off_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable"."fet_sub_off_cls_user" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."fet_sub_off_cls_user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL,
	"fet_sub_off_class_id" integer NOT NULL,
	CONSTRAINT "fet_sub_off_cls_user_userId_fet_sub_off_class_id_unique" UNIQUE("userId","fet_sub_off_class_id")
);
--> statement-breakpoint
CREATE TABLE "timetable"."tt" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."tt_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"year" integer NOT NULL,
	"sch_id" integer NOT NULL,
	"sch_sem_id" integer,
	CONSTRAINT "tt_sch_id_name_unique" UNIQUE("sch_id","name")
);
--> statement-breakpoint
CREATE TABLE "timetable"."tt_activity" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."tt_activity_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"periods_per_instance" integer DEFAULT 1 NOT NULL,
	"total_periods" integer NOT NULL,
	"tt_draft_id" integer NOT NULL,
	"sub_off_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable"."tt_activity_assign_grp" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."tt_activity_assign_grp_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"tt_activity_id" integer NOT NULL,
	"tt_group_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable"."tt_activity_assign_stu" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."tt_activity_assign_stu_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"tt_activity_id" integer NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable"."tt_activity_assign_yr" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."tt_activity_assign_yr_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"tt_activity_id" integer NOT NULL,
	"yearLevelId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable"."tt_activity_preferred_space" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."tt_activity_preferred_space_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"tt_activity_id" integer NOT NULL,
	"sch_space_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable"."tt_activity_teacher_pref" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."tt_activity_teacher_pref_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"tt_activity_id" integer NOT NULL,
	"teacher_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable"."tt_day" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."tt_day_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"tt_draft_id" integer NOT NULL,
	"day" integer NOT NULL,
	CONSTRAINT "tt_day_tt_draft_id_day_unique" UNIQUE("tt_draft_id","day")
);
--> statement-breakpoint
CREATE TABLE "timetable"."tt_draft" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."tt_draft_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"cycle_week_repeats" integer DEFAULT 1 NOT NULL,
	"tt_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable"."tt_draft_con" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."tt_draft_con_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"tt_draft_id" integer NOT NULL,
	"con_id" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"parameters" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable"."tt_group" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."tt_group_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"yearLevel" integer NOT NULL,
	"tt_draft_id" integer NOT NULL,
	CONSTRAINT "tt_group_tt_draft_id_name_unique" UNIQUE("tt_draft_id","name")
);
--> statement-breakpoint
CREATE TABLE "timetable"."tt_group_member" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."tt_group_member_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"tt_group_id" integer NOT NULL,
	"userId" uuid NOT NULL,
	CONSTRAINT "tt_group_member_tt_group_id_userId_unique" UNIQUE("tt_group_id","userId")
);
--> statement-breakpoint
CREATE TABLE "timetable"."tt_period" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."tt_period_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"start" time(3) NOT NULL,
	"end" time(3) NOT NULL,
	"duration" integer GENERATED ALWAYS AS (EXTRACT(EPOCH FROM ("end" - "start")) / 60) STORED,
	"tt_draft_id" integer NOT NULL,
	CONSTRAINT "tt_period_tt_draft_id_start_unique" UNIQUE("tt_draft_id","start")
);
--> statement-breakpoint
CREATE TABLE "timetable"."tt_queue" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "timetable"."tt_queue_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"file_name" text NOT NULL,
	"status" "timetable"."enum_tt_queue_status" DEFAULT 'queued' NOT NULL,
	"tt_id" integer NOT NULL,
	"tt_draft_id" integer NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject"."att_behaviour" (
	"att_id" integer NOT NULL,
	"behaviour_id" integer NOT NULL,
	CONSTRAINT "att_behaviour_att_id_behaviour_id_pk" PRIMARY KEY("att_id","behaviour_id")
);
--> statement-breakpoint
CREATE TABLE "subject"."sub" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subject"."sub_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"sch_id" integer NOT NULL,
	"sub_grp_id" integer,
	"sch_yl_id" integer NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "subject"."sub_off_cls_allo" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subject"."sub_off_cls_allo_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"sub_off_cls_id" integer NOT NULL,
	"sch_spa_id" integer NOT NULL,
	"start" timestamp (3) NOT NULL,
	"end" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject"."sub_off_cls_allo_att" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subject"."sub_off_cls_allo_att_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"sub_class_allo_id" integer NOT NULL,
	"userId" uuid NOT NULL,
	"status" "subject"."enum_sub_cls_allo_att_stat" NOT NULL,
	"noteGuardian" text,
	"noteTeacher" text,
	CONSTRAINT "sub_off_cls_allo_att_sub_class_allo_id_userId_unique" UNIQUE("sub_class_allo_id","userId")
);
--> statement-breakpoint
CREATE TABLE "subject"."sub_off_cls_allo_att_comp" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subject"."sub_off_cls_allo_att_comp_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"att_id" integer NOT NULL,
	"type" "subject"."enum_sub_off_cls_allo_att_comp_type" NOT NULL,
	"start" timestamp (3) NOT NULL,
	"end" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject"."sub_grp" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subject"."sub_grp_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sch_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject"."sub_off" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subject"."sub_off_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"sub_id" integer NOT NULL,
	"year" integer NOT NULL,
	"sch_cmps_id" integer NOT NULL,
	"grade_scale_id" integer
);
--> statement-breakpoint
CREATE TABLE "subject"."sub_off_cls" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subject"."sub_off_cls_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"tt_draft_id" integer,
	"sub_off_id" integer NOT NULL,
	CONSTRAINT "sub_off_cls_sub_off_id_name_unique" UNIQUE("sub_off_id","name")
);
--> statement-breakpoint
CREATE TABLE "subject"."sub_off_cls_res" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subject"."sub_off_cls_res_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"title" text,
	"description" text,
	"sub_off_cls_id" integer NOT NULL,
	"res_id" integer NOT NULL,
	"crclm_item_id" integer,
	"author_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject"."sub_sel_constraint" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subject"."sub_sel_constraint_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"schoolId" integer NOT NULL,
	"yearLevel" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"min" integer DEFAULT 0 NOT NULL,
	"max" integer
);
--> statement-breakpoint
CREATE TABLE "subject"."constraint_subject" (
	"constraint_id" integer NOT NULL,
	"sub_id" integer NOT NULL,
	CONSTRAINT "constraint_subject_constraint_id_sub_id_pk" PRIMARY KEY("constraint_id","sub_id")
);
--> statement-breakpoint
CREATE TABLE "subject"."sub_thread" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subject"."sub_thread_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"type" "subject"."enum_sub_thread_type" NOT NULL,
	"sub_off_id" integer NOT NULL,
	"userId" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"isAnonymous" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject"."sub_thread_like" (
	"sub_thread_id" integer NOT NULL,
	"userId" uuid NOT NULL,
	CONSTRAINT "sub_thread_like_sub_thread_id_userId_pk" PRIMARY KEY("sub_thread_id","userId")
);
--> statement-breakpoint
CREATE TABLE "subject"."sub_thread_resp" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subject"."sub_thread_resp_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"type" "subject"."enum_sub_thread_res_type" NOT NULL,
	"sub_thread_id" integer NOT NULL,
	"userId" uuid NOT NULL,
	"content" text NOT NULL,
	"parent_id" integer,
	"isAnonymous" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject"."sub_thread_resp_like" (
	"sub_thread_resp_id" integer NOT NULL,
	"userId" uuid NOT NULL,
	CONSTRAINT "sub_thread_resp_like_sub_thread_resp_id_userId_pk" PRIMARY KEY("sub_thread_resp_id","userId")
);
--> statement-breakpoint
CREATE TABLE "user"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"secretHash" text NOT NULL,
	"userId" uuid NOT NULL,
	"last_verified_at" timestamp (3) NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user"."user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"passwordHash" text,
	"googleId" text,
	"microsoftId" text,
	"schoolId" integer NOT NULL,
	"type" "user"."enum_user_type" DEFAULT 'N' NOT NULL,
	"gender" "user"."enum_gender" DEFAULT 'unspecified' NOT NULL,
	"date_of_birth" timestamp (3),
	"honorific" "user"."enum_user_honorific",
	"sch_yl_id" integer NOT NULL,
	"firstName" text NOT NULL,
	"middleName" text,
	"lastName" text NOT NULL,
	"avatarPath" text,
	"verificationCode" text,
	"emailVerified" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_googleId_unique" UNIQUE("googleId"),
	CONSTRAINT "user_microsoftId_unique" UNIQUE("microsoftId")
);
--> statement-breakpoint
CREATE TABLE "user"."user_cmps" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user"."user_cmps_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL,
	"sch_cmps_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user"."user_relationship" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user"."user_relationship_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL,
	"related_user_id" uuid NOT NULL,
	"relationshipType" "user"."enum_relationship_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user"."user_specialisation" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user"."user_specialisation_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL,
	"sub_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user"."user_sub_off" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user"."user_sub_off_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL,
	"sub_off_id" integer NOT NULL,
	"is_complete" boolean DEFAULT false NOT NULL,
	"color" integer DEFAULT 100 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user"."sub_off_cls_user" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user"."sub_off_cls_user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL,
	"sub_off_class_id" integer NOT NULL,
	"classNote" text,
	CONSTRAINT "sub_off_cls_user_userId_sub_off_class_id_unique" UNIQUE("userId","sub_off_class_id")
);
--> statement-breakpoint
CREATE TABLE "resource"."res" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "resource"."res_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"bucketName" text NOT NULL,
	"objectKey" text NOT NULL,
	"fileName" text NOT NULL,
	"fileSize" integer NOT NULL,
	"fileType" text NOT NULL,
	"uploadedBy" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news"."news" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "news"."news_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" jsonb NOT NULL,
	"status" "news"."enum_news_status" DEFAULT 'draft' NOT NULL,
	"priority" "news"."enum_news_priority" DEFAULT 'normal' NOT NULL,
	"visibility" "news"."enum_news_visibility" DEFAULT 'public' NOT NULL,
	"published_at" timestamp (3),
	"expires_at" timestamp (3),
	"tags" jsonb,
	"isPinned" boolean DEFAULT false NOT NULL,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"schoolId" integer NOT NULL,
	"sch_cmps_id" integer,
	"categoryId" integer,
	"authorId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news"."news_category" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "news"."news_category_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text,
	"schoolId" integer NOT NULL,
	CONSTRAINT "news_category_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "news"."news_resource" (
	"isArchived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"newsId" integer NOT NULL,
	"resourceId" integer NOT NULL,
	"authorId" uuid NOT NULL,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "news_resource_newsId_resourceId_pk" PRIMARY KEY("newsId","resourceId")
);
--> statement-breakpoint
ALTER TABLE "curriculum"."crclm_itm" ADD CONSTRAINT "crclm_itm_sub_off_id_sub_off_id_fk" FOREIGN KEY ("sub_off_id") REFERENCES "subject"."sub_off"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum"."crclm_itm_res" ADD CONSTRAINT "crclm_itm_res_crclm_itm_id_crclm_itm_id_fk" FOREIGN KEY ("crclm_itm_id") REFERENCES "curriculum"."crclm_itm"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum"."crclm_itm_res" ADD CONSTRAINT "crclm_itm_res_res_id_res_id_fk" FOREIGN KEY ("res_id") REFERENCES "resource"."res"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum"."crclm_itm_tp" ADD CONSTRAINT "crclm_itm_tp_crclm_itm_id_crclm_itm_id_fk" FOREIGN KEY ("crclm_itm_id") REFERENCES "curriculum"."crclm_itm"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum"."crclm_itm_tp" ADD CONSTRAINT "crclm_itm_tp_taskId_task_id_fk" FOREIGN KEY ("taskId") REFERENCES "task"."task"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum"."crclm_itm_tp" ADD CONSTRAINT "crclm_itm_tp_rubricId_rubric_id_fk" FOREIGN KEY ("rubricId") REFERENCES "task"."rubric"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum"."crclm_itm_tp_res" ADD CONSTRAINT "crclm_itm_tp_res_crclm_itm_tp_id_crclm_itm_tp_id_fk" FOREIGN KEY ("crclm_itm_tp_id") REFERENCES "curriculum"."crclm_itm_tp"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum"."crclm_itm_tp_res" ADD CONSTRAINT "crclm_itm_tp_res_res_id_res_id_fk" FOREIGN KEY ("res_id") REFERENCES "resource"."res"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event"."evt" ADD CONSTRAINT "evt_sch_id_sch_id_fk" FOREIGN KEY ("sch_id") REFERENCES "school"."sch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event"."evt" ADD CONSTRAINT "evt_sch_cmps_id_sch_cmps_id_fk" FOREIGN KEY ("sch_cmps_id") REFERENCES "school"."sch_cmps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event"."evt" ADD CONSTRAINT "evt_sub_off_id_sub_off_id_fk" FOREIGN KEY ("sub_off_id") REFERENCES "subject"."sub_off"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event"."evt" ADD CONSTRAINT "evt_sub_off_cls_id_sub_off_cls_id_fk" FOREIGN KEY ("sub_off_cls_id") REFERENCES "subject"."sub_off_cls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event"."evt_rsvp" ADD CONSTRAINT "evt_rsvp_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."cls_task_block_res" ADD CONSTRAINT "cls_task_block_res_taskBlockId_task_block_id_fk" FOREIGN KEY ("taskBlockId") REFERENCES "task"."task_block"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."cls_task_block_res" ADD CONSTRAINT "cls_task_block_res_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."cls_task_block_res" ADD CONSTRAINT "cls_task_block_res_cls_task_id_sub_off_cls_task_id_fk" FOREIGN KEY ("cls_task_id") REFERENCES "task"."sub_off_cls_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."cls_task_res" ADD CONSTRAINT "cls_task_res_cls_task_id_sub_off_cls_task_id_fk" FOREIGN KEY ("cls_task_id") REFERENCES "task"."sub_off_cls_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."cls_task_res" ADD CONSTRAINT "cls_task_res_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."cls_task_res" ADD CONSTRAINT "cls_task_res_teacherId_user_id_fk" FOREIGN KEY ("teacherId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."cls_task_res_resource" ADD CONSTRAINT "cls_task_res_resource_cls_task_res_id_cls_task_res_id_fk" FOREIGN KEY ("cls_task_res_id") REFERENCES "task"."cls_task_res"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."cls_task_res_resource" ADD CONSTRAINT "cls_task_res_resource_res_id_res_id_fk" FOREIGN KEY ("res_id") REFERENCES "resource"."res"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."cls_task_res_resource" ADD CONSTRAINT "cls_task_res_resource_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."rubric_cell" ADD CONSTRAINT "rubric_cell_rowId_rubric_row_id_fk" FOREIGN KEY ("rowId") REFERENCES "task"."rubric_row"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."rubric_cell_feedback" ADD CONSTRAINT "rubric_cell_feedback_cls_task_res_id_cls_task_res_id_fk" FOREIGN KEY ("cls_task_res_id") REFERENCES "task"."cls_task_res"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."rubric_cell_feedback" ADD CONSTRAINT "rubric_cell_feedback_rubricRowId_rubric_row_id_fk" FOREIGN KEY ("rubricRowId") REFERENCES "task"."rubric_row"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."rubric_cell_feedback" ADD CONSTRAINT "rubric_cell_feedback_rubricCellId_rubric_cell_id_fk" FOREIGN KEY ("rubricCellId") REFERENCES "task"."rubric_cell"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."rubric_row" ADD CONSTRAINT "rubric_row_rubricId_rubric_id_fk" FOREIGN KEY ("rubricId") REFERENCES "task"."rubric"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."sub_off_cls_task" ADD CONSTRAINT "sub_off_cls_task_sub_off_cls_id_sub_off_cls_id_fk" FOREIGN KEY ("sub_off_cls_id") REFERENCES "subject"."sub_off_cls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."sub_off_cls_task" ADD CONSTRAINT "sub_off_cls_task_taskId_task_id_fk" FOREIGN KEY ("taskId") REFERENCES "task"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."sub_off_cls_task" ADD CONSTRAINT "sub_off_cls_task_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."sub_off_cls_task" ADD CONSTRAINT "sub_off_cls_task_crclm_item_id_crclm_itm_id_fk" FOREIGN KEY ("crclm_item_id") REFERENCES "curriculum"."crclm_itm"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."sub_off_cls_task" ADD CONSTRAINT "sub_off_cls_task_rubricId_rubric_id_fk" FOREIGN KEY ("rubricId") REFERENCES "task"."rubric"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."task" ADD CONSTRAINT "task_rubricId_rubric_id_fk" FOREIGN KEY ("rubricId") REFERENCES "task"."rubric"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."task" ADD CONSTRAINT "task_sub_off_id_sub_off_id_fk" FOREIGN KEY ("sub_off_id") REFERENCES "subject"."sub_off"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."task_block" ADD CONSTRAINT "task_block_taskId_task_id_fk" FOREIGN KEY ("taskId") REFERENCES "task"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."wb" ADD CONSTRAINT "wb_taskId_task_id_fk" FOREIGN KEY ("taskId") REFERENCES "task"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task"."wb_obj" ADD CONSTRAINT "wb_obj_whiteboardId_wb_id_fk" FOREIGN KEY ("whiteboardId") REFERENCES "task"."wb"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school"."grade_scale_level" ADD CONSTRAINT "grade_scale_level_grade_scale_id_grade_scale_id_fk" FOREIGN KEY ("grade_scale_id") REFERENCES "school"."grade_scale"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school"."sch_bvr" ADD CONSTRAINT "sch_bvr_sch_id_sch_id_fk" FOREIGN KEY ("sch_id") REFERENCES "school"."sch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school"."sch_bvr" ADD CONSTRAINT "sch_bvr_level_id_sch_bvr_lvl_id_fk" FOREIGN KEY ("level_id") REFERENCES "school"."sch_bvr_lvl"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school"."sch_bvr_lvl" ADD CONSTRAINT "sch_bvr_lvl_sch_id_sch_id_fk" FOREIGN KEY ("sch_id") REFERENCES "school"."sch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school"."sch_bldng" ADD CONSTRAINT "sch_bldng_sch_cmps_id_sch_cmps_id_fk" FOREIGN KEY ("sch_cmps_id") REFERENCES "school"."sch_cmps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school"."sch_cmps" ADD CONSTRAINT "sch_cmps_sch_id_sch_id_fk" FOREIGN KEY ("sch_id") REFERENCES "school"."sch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school"."sch_sem" ADD CONSTRAINT "sch_sem_sch_id_sch_id_fk" FOREIGN KEY ("sch_id") REFERENCES "school"."sch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school"."sch_space" ADD CONSTRAINT "sch_space_sch_bldng_id_sch_bldng_id_fk" FOREIGN KEY ("sch_bldng_id") REFERENCES "school"."sch_bldng"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school"."sch_term" ADD CONSTRAINT "sch_term_sch_sem_id_sch_sem_id_fk" FOREIGN KEY ("sch_sem_id") REFERENCES "school"."sch_sem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school"."sch_yl" ADD CONSTRAINT "sch_yl_sch_id_sch_id_fk" FOREIGN KEY ("sch_id") REFERENCES "school"."sch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school"."sch_yl" ADD CONSTRAINT "sch_yl_grade_scale_id_grade_scale_id_fk" FOREIGN KEY ("grade_scale_id") REFERENCES "school"."grade_scale"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."fet_sub_off_cls_allo" ADD CONSTRAINT "fet_sub_off_cls_allo_fet_sub_off_cls_id_fet_sub_off_cls_id_fk" FOREIGN KEY ("fet_sub_off_cls_id") REFERENCES "timetable"."fet_sub_off_cls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."fet_sub_off_cls_allo" ADD CONSTRAINT "fet_sub_off_cls_allo_sch_space_id_sch_space_id_fk" FOREIGN KEY ("sch_space_id") REFERENCES "school"."sch_space"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."fet_sub_off_cls_allo" ADD CONSTRAINT "fet_sub_off_cls_allo_dayId_tt_day_id_fk" FOREIGN KEY ("dayId") REFERENCES "timetable"."tt_day"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."fet_sub_off_cls_allo" ADD CONSTRAINT "fet_sub_off_cls_allo_start_period_id_tt_period_id_fk" FOREIGN KEY ("start_period_id") REFERENCES "timetable"."tt_period"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."fet_sub_off_cls_allo" ADD CONSTRAINT "fet_sub_off_cls_allo_end_period_id_tt_period_id_fk" FOREIGN KEY ("end_period_id") REFERENCES "timetable"."tt_period"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."fet_sub_off_cls" ADD CONSTRAINT "fet_sub_off_cls_tt_draft_id_tt_draft_id_fk" FOREIGN KEY ("tt_draft_id") REFERENCES "timetable"."tt_draft"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."fet_sub_off_cls" ADD CONSTRAINT "fet_sub_off_cls_sub_off_id_sub_off_id_fk" FOREIGN KEY ("sub_off_id") REFERENCES "subject"."sub_off"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."fet_sub_off_cls_user" ADD CONSTRAINT "fet_sub_off_cls_user_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."fet_sub_off_cls_user" ADD CONSTRAINT "fet_sub_off_cls_user_fet_sub_off_class_id_fet_sub_off_cls_id_fk" FOREIGN KEY ("fet_sub_off_class_id") REFERENCES "timetable"."fet_sub_off_cls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt" ADD CONSTRAINT "tt_sch_id_sch_id_fk" FOREIGN KEY ("sch_id") REFERENCES "school"."sch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt" ADD CONSTRAINT "tt_sch_sem_id_sch_sem_id_fk" FOREIGN KEY ("sch_sem_id") REFERENCES "school"."sch_sem"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_activity" ADD CONSTRAINT "tt_activity_tt_draft_id_tt_draft_id_fk" FOREIGN KEY ("tt_draft_id") REFERENCES "timetable"."tt_draft"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_activity" ADD CONSTRAINT "tt_activity_sub_off_id_sub_off_id_fk" FOREIGN KEY ("sub_off_id") REFERENCES "subject"."sub_off"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_activity_assign_grp" ADD CONSTRAINT "tt_activity_assign_grp_tt_activity_id_tt_activity_id_fk" FOREIGN KEY ("tt_activity_id") REFERENCES "timetable"."tt_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_activity_assign_grp" ADD CONSTRAINT "tt_activity_assign_grp_tt_group_id_tt_group_id_fk" FOREIGN KEY ("tt_group_id") REFERENCES "timetable"."tt_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_activity_assign_stu" ADD CONSTRAINT "tt_activity_assign_stu_tt_activity_id_tt_activity_id_fk" FOREIGN KEY ("tt_activity_id") REFERENCES "timetable"."tt_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_activity_assign_stu" ADD CONSTRAINT "tt_activity_assign_stu_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_activity_assign_yr" ADD CONSTRAINT "tt_activity_assign_yr_tt_activity_id_tt_activity_id_fk" FOREIGN KEY ("tt_activity_id") REFERENCES "timetable"."tt_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_activity_assign_yr" ADD CONSTRAINT "tt_activity_assign_yr_yearLevelId_sch_yl_id_fk" FOREIGN KEY ("yearLevelId") REFERENCES "school"."sch_yl"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_activity_preferred_space" ADD CONSTRAINT "tt_activity_preferred_space_tt_activity_id_tt_activity_id_fk" FOREIGN KEY ("tt_activity_id") REFERENCES "timetable"."tt_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_activity_preferred_space" ADD CONSTRAINT "tt_activity_preferred_space_sch_space_id_sch_space_id_fk" FOREIGN KEY ("sch_space_id") REFERENCES "school"."sch_space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_activity_teacher_pref" ADD CONSTRAINT "tt_activity_teacher_pref_tt_activity_id_tt_activity_id_fk" FOREIGN KEY ("tt_activity_id") REFERENCES "timetable"."tt_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_activity_teacher_pref" ADD CONSTRAINT "tt_activity_teacher_pref_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_day" ADD CONSTRAINT "tt_day_tt_draft_id_tt_draft_id_fk" FOREIGN KEY ("tt_draft_id") REFERENCES "timetable"."tt_draft"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_draft" ADD CONSTRAINT "tt_draft_tt_id_tt_id_fk" FOREIGN KEY ("tt_id") REFERENCES "timetable"."tt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_draft_con" ADD CONSTRAINT "tt_draft_con_tt_draft_id_tt_draft_id_fk" FOREIGN KEY ("tt_draft_id") REFERENCES "timetable"."tt_draft"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_draft_con" ADD CONSTRAINT "tt_draft_con_con_id_con_id_fk" FOREIGN KEY ("con_id") REFERENCES "timetable"."con"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_group" ADD CONSTRAINT "tt_group_yearLevel_sch_yl_id_fk" FOREIGN KEY ("yearLevel") REFERENCES "school"."sch_yl"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_group" ADD CONSTRAINT "tt_group_tt_draft_id_tt_draft_id_fk" FOREIGN KEY ("tt_draft_id") REFERENCES "timetable"."tt_draft"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_group_member" ADD CONSTRAINT "tt_group_member_tt_group_id_tt_group_id_fk" FOREIGN KEY ("tt_group_id") REFERENCES "timetable"."tt_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_group_member" ADD CONSTRAINT "tt_group_member_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_period" ADD CONSTRAINT "tt_period_tt_draft_id_tt_draft_id_fk" FOREIGN KEY ("tt_draft_id") REFERENCES "timetable"."tt_draft"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_queue" ADD CONSTRAINT "tt_queue_tt_id_tt_id_fk" FOREIGN KEY ("tt_id") REFERENCES "timetable"."tt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_queue" ADD CONSTRAINT "tt_queue_tt_draft_id_tt_draft_id_fk" FOREIGN KEY ("tt_draft_id") REFERENCES "timetable"."tt_draft"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable"."tt_queue" ADD CONSTRAINT "tt_queue_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."att_behaviour" ADD CONSTRAINT "att_behaviour_att_id_sub_off_cls_allo_att_id_fk" FOREIGN KEY ("att_id") REFERENCES "subject"."sub_off_cls_allo_att"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."att_behaviour" ADD CONSTRAINT "att_behaviour_behaviour_id_sch_bvr_id_fk" FOREIGN KEY ("behaviour_id") REFERENCES "school"."sch_bvr"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub" ADD CONSTRAINT "sub_sch_id_sch_id_fk" FOREIGN KEY ("sch_id") REFERENCES "school"."sch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub" ADD CONSTRAINT "sub_sub_grp_id_sub_grp_id_fk" FOREIGN KEY ("sub_grp_id") REFERENCES "subject"."sub_grp"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub" ADD CONSTRAINT "sub_sch_yl_id_sch_yl_id_fk" FOREIGN KEY ("sch_yl_id") REFERENCES "school"."sch_yl"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_off_cls_allo" ADD CONSTRAINT "sub_off_cls_allo_sub_off_cls_id_sub_off_cls_id_fk" FOREIGN KEY ("sub_off_cls_id") REFERENCES "subject"."sub_off_cls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_off_cls_allo" ADD CONSTRAINT "sub_off_cls_allo_sch_spa_id_sch_space_id_fk" FOREIGN KEY ("sch_spa_id") REFERENCES "school"."sch_space"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_off_cls_allo_att" ADD CONSTRAINT "sub_off_cls_allo_att_sub_class_allo_id_sub_off_cls_allo_id_fk" FOREIGN KEY ("sub_class_allo_id") REFERENCES "subject"."sub_off_cls_allo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_off_cls_allo_att" ADD CONSTRAINT "sub_off_cls_allo_att_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_off_cls_allo_att_comp" ADD CONSTRAINT "sub_off_cls_allo_att_comp_att_id_sub_off_cls_allo_att_id_fk" FOREIGN KEY ("att_id") REFERENCES "subject"."sub_off_cls_allo_att"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_grp" ADD CONSTRAINT "sub_grp_sch_id_sch_id_fk" FOREIGN KEY ("sch_id") REFERENCES "school"."sch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_off" ADD CONSTRAINT "sub_off_sub_id_sub_id_fk" FOREIGN KEY ("sub_id") REFERENCES "subject"."sub"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_off" ADD CONSTRAINT "sub_off_sch_cmps_id_sch_cmps_id_fk" FOREIGN KEY ("sch_cmps_id") REFERENCES "school"."sch_cmps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_off" ADD CONSTRAINT "sub_off_grade_scale_id_grade_scale_id_fk" FOREIGN KEY ("grade_scale_id") REFERENCES "school"."grade_scale"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_off_cls" ADD CONSTRAINT "sub_off_cls_tt_draft_id_tt_draft_id_fk" FOREIGN KEY ("tt_draft_id") REFERENCES "timetable"."tt_draft"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_off_cls" ADD CONSTRAINT "sub_off_cls_sub_off_id_sub_off_id_fk" FOREIGN KEY ("sub_off_id") REFERENCES "subject"."sub_off"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_off_cls_res" ADD CONSTRAINT "sub_off_cls_res_sub_off_cls_id_sub_off_cls_id_fk" FOREIGN KEY ("sub_off_cls_id") REFERENCES "subject"."sub_off_cls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_off_cls_res" ADD CONSTRAINT "sub_off_cls_res_res_id_res_id_fk" FOREIGN KEY ("res_id") REFERENCES "resource"."res"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_off_cls_res" ADD CONSTRAINT "sub_off_cls_res_crclm_item_id_crclm_itm_id_fk" FOREIGN KEY ("crclm_item_id") REFERENCES "curriculum"."crclm_itm"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_off_cls_res" ADD CONSTRAINT "sub_off_cls_res_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_sel_constraint" ADD CONSTRAINT "sub_sel_constraint_schoolId_sch_id_fk" FOREIGN KEY ("schoolId") REFERENCES "school"."sch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_sel_constraint" ADD CONSTRAINT "sub_sel_constraint_yearLevel_sch_yl_id_fk" FOREIGN KEY ("yearLevel") REFERENCES "school"."sch_yl"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."constraint_subject" ADD CONSTRAINT "constraint_subject_constraint_id_sub_sel_constraint_id_fk" FOREIGN KEY ("constraint_id") REFERENCES "subject"."sub_sel_constraint"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."constraint_subject" ADD CONSTRAINT "constraint_subject_sub_id_sub_id_fk" FOREIGN KEY ("sub_id") REFERENCES "subject"."sub"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_thread" ADD CONSTRAINT "sub_thread_sub_off_id_sub_off_id_fk" FOREIGN KEY ("sub_off_id") REFERENCES "subject"."sub_off"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_thread" ADD CONSTRAINT "sub_thread_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_thread_like" ADD CONSTRAINT "sub_thread_like_sub_thread_id_sub_thread_id_fk" FOREIGN KEY ("sub_thread_id") REFERENCES "subject"."sub_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_thread_like" ADD CONSTRAINT "sub_thread_like_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_thread_resp" ADD CONSTRAINT "sub_thread_resp_sub_thread_id_sub_thread_id_fk" FOREIGN KEY ("sub_thread_id") REFERENCES "subject"."sub_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_thread_resp" ADD CONSTRAINT "sub_thread_resp_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_thread_resp" ADD CONSTRAINT "sub_thread_resp_parent_id_sub_thread_resp_id_fk" FOREIGN KEY ("parent_id") REFERENCES "subject"."sub_thread_resp"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_thread_resp_like" ADD CONSTRAINT "sub_thread_resp_like_sub_thread_resp_id_sub_thread_resp_id_fk" FOREIGN KEY ("sub_thread_resp_id") REFERENCES "subject"."sub_thread_resp"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject"."sub_thread_resp_like" ADD CONSTRAINT "sub_thread_resp_like_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user"."session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user"."user" ADD CONSTRAINT "user_schoolId_sch_id_fk" FOREIGN KEY ("schoolId") REFERENCES "school"."sch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user"."user" ADD CONSTRAINT "user_sch_yl_id_sch_yl_id_fk" FOREIGN KEY ("sch_yl_id") REFERENCES "school"."sch_yl"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user"."user_cmps" ADD CONSTRAINT "user_cmps_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user"."user_cmps" ADD CONSTRAINT "user_cmps_sch_cmps_id_sch_cmps_id_fk" FOREIGN KEY ("sch_cmps_id") REFERENCES "school"."sch_cmps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user"."user_relationship" ADD CONSTRAINT "user_relationship_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user"."user_relationship" ADD CONSTRAINT "user_relationship_related_user_id_user_id_fk" FOREIGN KEY ("related_user_id") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user"."user_specialisation" ADD CONSTRAINT "user_specialisation_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user"."user_specialisation" ADD CONSTRAINT "user_specialisation_sub_id_sub_id_fk" FOREIGN KEY ("sub_id") REFERENCES "subject"."sub"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user"."user_sub_off" ADD CONSTRAINT "user_sub_off_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user"."user_sub_off" ADD CONSTRAINT "user_sub_off_sub_off_id_sub_off_id_fk" FOREIGN KEY ("sub_off_id") REFERENCES "subject"."sub_off"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user"."sub_off_cls_user" ADD CONSTRAINT "sub_off_cls_user_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user"."sub_off_cls_user" ADD CONSTRAINT "sub_off_cls_user_sub_off_class_id_sub_off_cls_id_fk" FOREIGN KEY ("sub_off_class_id") REFERENCES "subject"."sub_off_cls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource"."res" ADD CONSTRAINT "res_uploadedBy_user_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news"."news" ADD CONSTRAINT "news_schoolId_sch_id_fk" FOREIGN KEY ("schoolId") REFERENCES "school"."sch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news"."news" ADD CONSTRAINT "news_sch_cmps_id_sch_cmps_id_fk" FOREIGN KEY ("sch_cmps_id") REFERENCES "school"."sch_cmps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news"."news" ADD CONSTRAINT "news_categoryId_news_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "news"."news_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news"."news" ADD CONSTRAINT "news_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news"."news_category" ADD CONSTRAINT "news_category_schoolId_sch_id_fk" FOREIGN KEY ("schoolId") REFERENCES "school"."sch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news"."news_resource" ADD CONSTRAINT "news_resource_newsId_news_id_fk" FOREIGN KEY ("newsId") REFERENCES "news"."news"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news"."news_resource" ADD CONSTRAINT "news_resource_resourceId_res_id_fk" FOREIGN KEY ("resourceId") REFERENCES "resource"."res"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news"."news_resource" ADD CONSTRAINT "news_resource_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "user"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crclm_itm_sub_off_id_index" ON "curriculum"."crclm_itm" USING btree ("sub_off_id");--> statement-breakpoint
CREATE INDEX "crclm_itm_res_crclm_itm_id_index" ON "curriculum"."crclm_itm_res" USING btree ("crclm_itm_id");--> statement-breakpoint
CREATE INDEX "crclm_itm_res_res_id_index" ON "curriculum"."crclm_itm_res" USING btree ("res_id");--> statement-breakpoint
CREATE INDEX "crclm_itm_tp_crclm_itm_id_index" ON "curriculum"."crclm_itm_tp" USING btree ("crclm_itm_id");--> statement-breakpoint
CREATE INDEX "crclm_itm_tp_taskId_index" ON "curriculum"."crclm_itm_tp" USING btree ("taskId");--> statement-breakpoint
CREATE INDEX "crclm_itm_tp_rubricId_index" ON "curriculum"."crclm_itm_tp" USING btree ("rubricId");--> statement-breakpoint
CREATE INDEX "crclm_itm_tp_res_crclm_itm_tp_id_index" ON "curriculum"."crclm_itm_tp_res" USING btree ("crclm_itm_tp_id");--> statement-breakpoint
CREATE INDEX "crclm_itm_tp_res_res_id_index" ON "curriculum"."crclm_itm_tp_res" USING btree ("res_id");--> statement-breakpoint
CREATE INDEX "evt_sch_id_index" ON "event"."evt" USING btree ("sch_id");--> statement-breakpoint
CREATE INDEX "evt_sch_cmps_id_index" ON "event"."evt" USING btree ("sch_cmps_id");--> statement-breakpoint
CREATE INDEX "evt_sub_off_id_index" ON "event"."evt" USING btree ("sub_off_id");--> statement-breakpoint
CREATE INDEX "evt_sub_off_cls_id_index" ON "event"."evt" USING btree ("sub_off_cls_id");--> statement-breakpoint
CREATE INDEX "evt_rsvp_userId_index" ON "event"."evt_rsvp" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "grade_scale_level_grade_scale_id_index" ON "school"."grade_scale_level" USING btree ("grade_scale_id");--> statement-breakpoint
CREATE INDEX "sch_bvr_sch_id_index" ON "school"."sch_bvr" USING btree ("sch_id");--> statement-breakpoint
CREATE INDEX "sch_bvr_level_id_index" ON "school"."sch_bvr" USING btree ("level_id");--> statement-breakpoint
CREATE INDEX "sch_bvr_lvl_sch_id_index" ON "school"."sch_bvr_lvl" USING btree ("sch_id");--> statement-breakpoint
CREATE INDEX "sch_bldng_sch_cmps_id_index" ON "school"."sch_bldng" USING btree ("sch_cmps_id");--> statement-breakpoint
CREATE INDEX "sch_cmps_sch_id_index" ON "school"."sch_cmps" USING btree ("sch_id");--> statement-breakpoint
CREATE INDEX "sch_sem_sch_id_index" ON "school"."sch_sem" USING btree ("sch_id");--> statement-breakpoint
CREATE INDEX "sch_space_sch_bldng_id_index" ON "school"."sch_space" USING btree ("sch_bldng_id");--> statement-breakpoint
CREATE INDEX "sch_term_sch_sem_id_index" ON "school"."sch_term" USING btree ("sch_sem_id");--> statement-breakpoint
CREATE INDEX "sch_yl_sch_id_index" ON "school"."sch_yl" USING btree ("sch_id");--> statement-breakpoint
CREATE INDEX "sch_yl_grade_scale_id_index" ON "school"."sch_yl" USING btree ("grade_scale_id");--> statement-breakpoint
CREATE INDEX "fet_sub_off_cls_allo_fet_sub_off_cls_id_index" ON "timetable"."fet_sub_off_cls_allo" USING btree ("fet_sub_off_cls_id");--> statement-breakpoint
CREATE INDEX "fet_sub_off_cls_allo_sch_space_id_index" ON "timetable"."fet_sub_off_cls_allo" USING btree ("sch_space_id");--> statement-breakpoint
CREATE INDEX "tt_sch_id_index" ON "timetable"."tt" USING btree ("sch_id");--> statement-breakpoint
CREATE INDEX "tt_sch_sem_id_index" ON "timetable"."tt" USING btree ("sch_sem_id");--> statement-breakpoint
CREATE INDEX "tt_activity_tt_draft_id_index" ON "timetable"."tt_activity" USING btree ("tt_draft_id");--> statement-breakpoint
CREATE INDEX "tt_activity_sub_off_id_index" ON "timetable"."tt_activity" USING btree ("sub_off_id");--> statement-breakpoint
CREATE INDEX "tt_day_tt_draft_id_index" ON "timetable"."tt_day" USING btree ("tt_draft_id");--> statement-breakpoint
CREATE INDEX "tt_draft_tt_id_index" ON "timetable"."tt_draft" USING btree ("tt_id");--> statement-breakpoint
CREATE INDEX "tt_group_tt_draft_id_index" ON "timetable"."tt_group" USING btree ("tt_draft_id");--> statement-breakpoint
CREATE INDEX "tt_period_tt_draft_id_index" ON "timetable"."tt_period" USING btree ("tt_draft_id");--> statement-breakpoint
CREATE INDEX "tt_queue_tt_id_index" ON "timetable"."tt_queue" USING btree ("tt_id");--> statement-breakpoint
CREATE INDEX "tt_queue_tt_draft_id_index" ON "timetable"."tt_queue" USING btree ("tt_draft_id");--> statement-breakpoint
CREATE INDEX "tt_queue_userId_index" ON "timetable"."tt_queue" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "att_behaviour_att_id_index" ON "subject"."att_behaviour" USING btree ("att_id");--> statement-breakpoint
CREATE INDEX "att_behaviour_behaviour_id_index" ON "subject"."att_behaviour" USING btree ("behaviour_id");--> statement-breakpoint
CREATE INDEX "sub_sch_id_index" ON "subject"."sub" USING btree ("sch_id");--> statement-breakpoint
CREATE INDEX "sub_sub_grp_id_index" ON "subject"."sub" USING btree ("sub_grp_id");--> statement-breakpoint
CREATE INDEX "sub_sch_yl_id_index" ON "subject"."sub" USING btree ("sch_yl_id");--> statement-breakpoint
CREATE INDEX "sub_off_cls_allo_sub_off_cls_id_index" ON "subject"."sub_off_cls_allo" USING btree ("sub_off_cls_id");--> statement-breakpoint
CREATE INDEX "sub_off_cls_allo_sch_spa_id_index" ON "subject"."sub_off_cls_allo" USING btree ("sch_spa_id");--> statement-breakpoint
CREATE INDEX "sub_off_cls_allo_att_sub_class_allo_id_index" ON "subject"."sub_off_cls_allo_att" USING btree ("sub_class_allo_id");--> statement-breakpoint
CREATE INDEX "sub_off_cls_allo_att_userId_index" ON "subject"."sub_off_cls_allo_att" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "sub_off_cls_allo_att_comp_att_id_index" ON "subject"."sub_off_cls_allo_att_comp" USING btree ("att_id");--> statement-breakpoint
CREATE INDEX "sub_grp_sch_id_index" ON "subject"."sub_grp" USING btree ("sch_id");--> statement-breakpoint
CREATE INDEX "sub_off_sub_id_index" ON "subject"."sub_off" USING btree ("sub_id");--> statement-breakpoint
CREATE INDEX "sub_off_sch_cmps_id_index" ON "subject"."sub_off" USING btree ("sch_cmps_id");--> statement-breakpoint
CREATE INDEX "sub_off_grade_scale_id_index" ON "subject"."sub_off" USING btree ("grade_scale_id");--> statement-breakpoint
CREATE INDEX "sub_off_cls_tt_draft_id_index" ON "subject"."sub_off_cls" USING btree ("tt_draft_id");--> statement-breakpoint
CREATE INDEX "sub_off_cls_sub_off_id_index" ON "subject"."sub_off_cls" USING btree ("sub_off_id");--> statement-breakpoint
CREATE INDEX "sub_off_cls_res_sub_off_cls_id_index" ON "subject"."sub_off_cls_res" USING btree ("sub_off_cls_id");--> statement-breakpoint
CREATE INDEX "sub_off_cls_res_res_id_index" ON "subject"."sub_off_cls_res" USING btree ("res_id");--> statement-breakpoint
CREATE INDEX "sub_off_cls_res_crclm_item_id_index" ON "subject"."sub_off_cls_res" USING btree ("crclm_item_id");--> statement-breakpoint
CREATE INDEX "sub_off_cls_res_author_id_index" ON "subject"."sub_off_cls_res" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "sub_sel_constraint_schoolId_index" ON "subject"."sub_sel_constraint" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "sub_sel_constraint_yearLevel_index" ON "subject"."sub_sel_constraint" USING btree ("yearLevel");--> statement-breakpoint
CREATE INDEX "constraint_subject_constraint_id_index" ON "subject"."constraint_subject" USING btree ("constraint_id");--> statement-breakpoint
CREATE INDEX "constraint_subject_sub_id_index" ON "subject"."constraint_subject" USING btree ("sub_id");--> statement-breakpoint
CREATE INDEX "sub_thread_sub_off_id_index" ON "subject"."sub_thread" USING btree ("sub_off_id");--> statement-breakpoint
CREATE INDEX "sub_thread_userId_index" ON "subject"."sub_thread" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "sub_thread_like_sub_thread_id_index" ON "subject"."sub_thread_like" USING btree ("sub_thread_id");--> statement-breakpoint
CREATE INDEX "sub_thread_like_userId_index" ON "subject"."sub_thread_like" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "sub_thread_resp_sub_thread_id_index" ON "subject"."sub_thread_resp" USING btree ("sub_thread_id");--> statement-breakpoint
CREATE INDEX "sub_thread_resp_userId_index" ON "subject"."sub_thread_resp" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "sub_thread_resp_parent_id_index" ON "subject"."sub_thread_resp" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "sub_thread_resp_like_sub_thread_resp_id_index" ON "subject"."sub_thread_resp_like" USING btree ("sub_thread_resp_id");--> statement-breakpoint
CREATE INDEX "sub_thread_resp_like_userId_index" ON "subject"."sub_thread_resp_like" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_index" ON "user"."user" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "user_googleId_index" ON "user"."user" USING btree ("googleId");--> statement-breakpoint
CREATE UNIQUE INDEX "user_microsoftId_index" ON "user"."user" USING btree ("microsoftId");--> statement-breakpoint
CREATE INDEX "res_uploadedBy_index" ON "resource"."res" USING btree ("uploadedBy");--> statement-breakpoint
CREATE INDEX "news_schoolId_index" ON "news"."news" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "news_sch_cmps_id_index" ON "news"."news" USING btree ("sch_cmps_id");--> statement-breakpoint
CREATE INDEX "news_categoryId_index" ON "news"."news" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "news_authorId_index" ON "news"."news" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "news_category_schoolId_index" ON "news"."news_category" USING btree ("schoolId");--> statement-breakpoint
CREATE INDEX "news_resource_newsId_index" ON "news"."news_resource" USING btree ("newsId");--> statement-breakpoint
CREATE INDEX "news_resource_resourceId_index" ON "news"."news_resource" USING btree ("resourceId");--> statement-breakpoint
CREATE INDEX "news_resource_authorId_index" ON "news"."news_resource" USING btree ("authorId");