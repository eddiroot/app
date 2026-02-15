# Task Block Integration

This document describes how the whiteboard integrates with the task system, including database schema, service layer, and routing.

## Overview

Each whiteboard is linked to a task block, creating a one-to-one relationship. This enables:

- Multiple whiteboards per task (one per whiteboard task block)
- Isolated content per whiteboard
- Automatic cleanup via cascade deletes

## Database Schema

### Whiteboard Table

**File:** `src/lib/server/db/schema/task.ts`

```typescript
export const whiteboard = pgTable('whiteboard', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	taskBlockId: integer('task_block_id')
		.notNull()
		.unique() // One whiteboard per task block
		.references(() => taskBlock.id, { onDelete: 'cascade' }),
	title: text('title'),
	...timestamps,
});
```

### Whiteboard Objects Table

```typescript
export const whiteboardObject = pgTable('whiteboard_object', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	whiteboardId: integer('whiteboard_id')
		.notNull()
		.references(() => whiteboard.id, { onDelete: 'cascade' }),
	objectId: text('object_id').notNull(), // UUID from Fabric.js
	type: text('type').notNull(), // rect, circle, path, etc.
	data: jsonb('data').notNull(), // Serialized Fabric.js object
	zIndex: integer('z_index').default(0),
	...timestamps,
});
```

### Relationships

```
Task
├── TaskBlock (type: 'whiteboard')
│   └── Whiteboard (one-to-one)
│       └── WhiteboardObjects (one-to-many)
```

---

## Service Layer

**File:** `src/lib/server/db/service/task.ts`

### Creating a Whiteboard

```typescript
export async function createWhiteboard(taskBlockId: number, title?: string) {
	const [whiteboard] = await db
		.insert(table.whiteboard)
		.values({ taskBlockId, title })
		.returning();

	return whiteboard;
}
```

### Getting Whiteboard by Task Block

```typescript
export async function getWhiteboardByTaskBlockId(taskBlockId: number) {
	const [whiteboard] = await db
		.select()
		.from(table.whiteboard)
		.where(eq(table.whiteboard.taskBlockId, taskBlockId));

	return whiteboard;
}
```

### Getting Whiteboard with Task Context

```typescript
export async function getWhiteboardWithTask(
	whiteboardId: number,
	taskId: number,
) {
	const [result] = await db
		.select({
			whiteboard: table.whiteboard,
			taskBlock: table.taskBlock,
			task: table.task,
		})
		.from(table.whiteboard)
		.innerJoin(
			table.taskBlock,
			eq(table.whiteboard.taskBlockId, table.taskBlock.id),
		)
		.innerJoin(table.task, eq(table.taskBlock.taskId, table.task.id))
		.where(
			and(eq(table.whiteboard.id, whiteboardId), eq(table.task.id, taskId)),
		);

	return result;
}
```

### Auto-Creation in Task Block

```typescript
export async function createTaskBlock(
	taskId: number,
	type: TaskBlockType,
	config?: any,
) {
	const [taskBlock] = await db
		.insert(table.taskBlock)
		.values({ taskId, type })
		.returning();

	// Auto-create whiteboard for whiteboard-type blocks
	if (type === taskBlockTypeEnum.whiteboard) {
		await createWhiteboard(taskBlock.id, config?.title);
	}

	return taskBlock;
}
```

---

## Object Persistence

### Saving Objects

```typescript
export async function saveWhiteboardObject(
	whiteboardId: number,
	objectId: string,
	type: string,
	data: Record<string, unknown>,
	zIndex?: number,
) {
	await db
		.insert(table.whiteboardObject)
		.values({ whiteboardId, objectId, type, data, zIndex: zIndex ?? 0 })
		.onConflictDoUpdate({
			target: [
				table.whiteboardObject.whiteboardId,
				table.whiteboardObject.objectId,
			],
			set: { data, zIndex, updatedAt: new Date() },
		});
}
```

### Loading Objects

```typescript
export async function getWhiteboardObjects(whiteboardId: number) {
	const objects = await db
		.select()
		.from(table.whiteboardObject)
		.where(eq(table.whiteboardObject.whiteboardId, whiteboardId))
		.orderBy(table.whiteboardObject.zIndex);

	return objects.map((obj) => obj.data);
}
```

### Deleting Objects

```typescript
export async function deleteWhiteboardObject(
	whiteboardId: number,
	objectId: string,
) {
	await db
		.delete(table.whiteboardObject)
		.where(
			and(
				eq(table.whiteboardObject.whiteboardId, whiteboardId),
				eq(table.whiteboardObject.objectId, objectId),
			),
		);
}
```

---

## Routing

### Route Structure

```
/subjects/[subjectOfferingId]/class/[subjectOfferingClassId]/tasks/[taskId]/whiteboard/[whiteboardId]/
├── +page.svelte          # Whiteboard canvas
└── +page.server.ts       # Data loading and validation
```

### Page Server

**File:** `+page.server.ts`

```typescript
import { getWhiteboardWithTask } from '$lib/server/db/service/task';
import { error } from '@sveltejs/kit';

export async function load({ params, locals }) {
	const whiteboardId = parseInt(params.whiteboardId);
	const taskId = parseInt(params.taskId);

	// Validate whiteboard belongs to task
	const result = await getWhiteboardWithTask(whiteboardId, taskId);

	if (!result) {
		throw error(404, 'Whiteboard not found');
	}

	return {
		whiteboard: result.whiteboard,
		taskBlock: result.taskBlock,
		task: result.task,
		user: locals.user,
	};
}
```

### Page Component

**File:** `+page.svelte`

```svelte
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Canvas } from 'fabric';

	let { data } = $props();
	const { whiteboard, task, user } = data;

	let canvas: Canvas;
	let socket: WebSocket;

	onMount(() => {
		// Initialize canvas
		canvas = new Canvas('whiteboard-canvas');

		// Initialize WebSocket
		socket = initSocket(whiteboard.id, user.id);
		setupSocketHandlers(socket, canvas);

		// Load existing objects
		socket.emit('join', { whiteboardId: whiteboard.id });
	});

	onDestroy(() => {
		socket?.disconnect();
		canvas?.dispose();
	});
</script>

<canvas id="whiteboard-canvas"></canvas>
```

---

## Task Block Rendering

When rendering a task with whiteboard blocks:

### In Task View

```svelte
{#each task.blocks as block}
	{#if block.type === 'whiteboard'}
		<WhiteboardBlockPreview
			{block}
			whiteboardUrl={`/subjects/${subjectOfferingId}/class/${classId}/tasks/${taskId}/whiteboard/${block.whiteboard.id}`}
		/>
	{/if}
{/each}
```

### WhiteboardBlockPreview Component

```svelte
<script>
	let { block, whiteboardUrl } = $props();
</script>

<div class="whiteboard-block">
	<h3>{block.whiteboard?.title ?? 'Whiteboard'}</h3>
	<a href={whiteboardUrl} class="btn"> Open Whiteboard </a>
</div>
```

---

## Multiple Whiteboards Per Task

Each whiteboard task block has its own isolated whiteboard:

```
Task "Physics Lesson"
├─ Text Block: "Introduction"
├─ Whiteboard Block #1 → Whiteboard ID 100
├─ Text Block: "Experiment 1"
├─ Whiteboard Block #2 → Whiteboard ID 101
└─ Whiteboard Block #3 → Whiteboard ID 102
```

### Benefits

1. **Isolation:** Content in each whiteboard is completely separate
2. **Scalability:** Unlimited whiteboards per task
3. **Clarity:** Clear one-to-one relationship
4. **Automatic Cleanup:** Cascade deletes handle orphaned whiteboards

---

## WebSocket Room Scoping

Each whiteboard has its own WebSocket room:

```typescript
// Server-side
socket.on('join', ({ whiteboardId }) => {
	socket.join(`whiteboard:${whiteboardId}`);
});

// Broadcast only to users in the same whiteboard
socket.to(`whiteboard:${whiteboardId}`).emit('add', data);
```

This ensures:

- Users only receive updates for the whiteboard they're viewing
- Multiple users can work on different whiteboards simultaneously
- No cross-contamination between whiteboards

---

## Migration Guide

### For Existing Whiteboards

If migrating from task-level whiteboards to task-block-level:

```sql
-- Add task_block_id column
ALTER TABLE whiteboard ADD COLUMN task_block_id INTEGER;

-- Link to existing whiteboard task blocks
UPDATE whiteboard w
SET task_block_id = (
  SELECT tb.id FROM task_block tb
  WHERE tb.task_id = w.task_id
  AND tb.type = 'whiteboard'
  LIMIT 1
);

-- Add constraints
ALTER TABLE whiteboard
  ALTER COLUMN task_block_id SET NOT NULL,
  ADD CONSTRAINT whiteboard_task_block_fk
    FOREIGN KEY (task_block_id) REFERENCES task_block(id) ON DELETE CASCADE,
  ADD CONSTRAINT whiteboard_task_block_unique UNIQUE (task_block_id);

-- Remove old task_id column
ALTER TABLE whiteboard DROP COLUMN task_id;
```

### For Task Blocks Without Whiteboards

```typescript
// Ensure all whiteboard task blocks have whiteboards
const whiteboardBlocks = await db
	.select()
	.from(table.taskBlock)
	.where(eq(table.taskBlock.type, 'whiteboard'));

for (const block of whiteboardBlocks) {
	const existing = await getWhiteboardByTaskBlockId(block.id);
	if (!existing) {
		await createWhiteboard(block.id);
	}
}
```

---

## Source Files

- **Schema**: `src/lib/server/db/schema/task.ts`
- **Service**: `src/lib/server/db/service/task.ts`
- **Route**: `src/routes/subjects/[subjectOfferingId]/class/[subjectOfferingClassId]/tasks/[taskId]/whiteboard/[whiteboardId]/`
- **WebSocket Server**: `src/lib/server/websocket.ts`
