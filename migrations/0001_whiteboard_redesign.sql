-- Whiteboard schema redesign: replace wb/wb_obj tables with whiteboard/whiteboard_object
-- The table structure changed significantly (new FKs, column renames, removed enum type).
-- NOTE: Existing whiteboard data will be dropped - the schema has been fundamentally redesigned.

-- Drop dependent FK first (wb_obj references wb)
ALTER TABLE "task"."wb_obj" DROP CONSTRAINT "wb_obj_whiteboardId_wb_id_fk";--> statement-breakpoint
-- Drop wb FK to task
ALTER TABLE "task"."wb" DROP CONSTRAINT "wb_taskId_task_id_fk";--> statement-breakpoint
-- Drop old tables
DROP TABLE "task"."wb_obj";--> statement-breakpoint
DROP TABLE "task"."wb";--> statement-breakpoint
-- Drop old enum type
DROP TYPE "task"."enum_whiteboard_object_type";--> statement-breakpoint
-- Create new whiteboard table (replaces task.wb, now references task_block instead of task)
CREATE TABLE "task"."whiteboard" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "task"."whiteboard_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"task_block_id" integer NOT NULL,
	"title" text,
	"is_locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "whiteboard_task_block_id_unique" UNIQUE("task_block_id")
);
--> statement-breakpoint
-- Create new whiteboard_object table (replaces task.wb_obj, snake_case columns, no objectType enum)
CREATE TABLE "task"."whiteboard_object" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "task"."whiteboard_object_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"whiteboard_id" integer NOT NULL,
	"object_id" text NOT NULL,
	"object_data" jsonb NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "whiteboard_object_object_id_unique" UNIQUE("object_id")
);
--> statement-breakpoint
-- Add FK: whiteboard.task_block_id -> task.task_block.id
ALTER TABLE "task"."whiteboard" ADD CONSTRAINT "whiteboard_task_block_id_task_block_id_fk" FOREIGN KEY ("task_block_id") REFERENCES "task"."task_block"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Add FK: whiteboard_object.whiteboard_id -> task.whiteboard.id
ALTER TABLE "task"."whiteboard_object" ADD CONSTRAINT "whiteboard_object_whiteboard_id_whiteboard_id_fk" FOREIGN KEY ("whiteboard_id") REFERENCES "task"."whiteboard"("id") ON DELETE cascade ON UPDATE no action;
