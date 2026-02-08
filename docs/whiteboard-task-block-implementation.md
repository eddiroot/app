# Whiteboard Task Block Implementation

## Overview

This document describes the implementation of unique whiteboard instances per task block, allowing each whiteboard task block within a task to have its own independent whiteboard.

## Architecture Changes

### Database Schema

**File:** `src/lib/server/db/schema/task.ts`

The `whiteboard` table now links to `task_block` instead of `task`:

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

**Key Points:**

- `taskBlockId` is NOT NULL and UNIQUE (one-to-one relationship)
- Cascade delete ensures whiteboards are automatically deleted when task blocks are deleted
- Each whiteboard task block gets its own isolated whiteboard instance

### Migration

**File:** `migrations/0001_whiteboard_task_block_migration.sql`

The migration handles:

1. Adding `task_block_id` column
2. Migrating existing whiteboards to task blocks
3. Adding constraints (foreign key, unique, not null)
4. Removing old `task_id` column

**To apply:** Run this SQL migration against your database when ready.

### Service Layer Updates

**File:** `src/lib/server/db/service/task.ts`

#### New/Updated Functions:

1. **`createWhiteboard(taskBlockId, title?)`**
   - Now takes `taskBlockId` instead of `taskId`
   - Creates a whiteboard linked to a specific task block

2. **`getWhiteboardByTaskBlockId(taskBlockId)`**
   - New function to retrieve whiteboard by task block ID
   - Returns the whiteboard associated with a task block

3. **`getWhiteboardWithTask(whiteboardId, taskId)`**
   - Updated to join through task_block
   - Returns whiteboard, taskBlock, and task information
   - Validates whiteboard belongs to the specified task

4. **`createTaskBlock(...)`**
   - Auto-creates whiteboard for whiteboard-type task blocks
   - Automatically called when a new whiteboard task block is added

### WebSocket Server

**File:** `src/routes/.../whiteboard/ws/+server.ts`

**Changes:**

- Removed hardcoded `whiteboardId = 1` default
- Now requires client to send whiteboard ID in init message
- Returns error if no whiteboard ID is provided
- Maintains per-peer whiteboard subscriptions

**Client Requirements:**

- Must send `{ type: 'init', whiteboardId: <id> }` on connection
- WhiteboardId must be included in all subsequent messages

### Route Handler

**File:** `src/routes/.../whiteboard/[whiteboardId]/+page.server.ts`

Already correctly implements:

- Validates whiteboard belongs to the task
- Returns whiteboard, taskBlock, and task data
- No changes needed (already using updated `getWhiteboardWithTask`)

## Usage Flow

### Creating a Whiteboard Task Block

1. When a whiteboard task block is created via `createTaskBlock()`:

   ```typescript
   const taskBlock = await createTaskBlock(
   	taskId,
   	taskBlockTypeEnum.whiteboard,
   	{ title: 'My Whiteboard' },
   );
   ```

2. A whiteboard is automatically created:
   ```typescript
   // Inside createTaskBlock
   if (type === taskBlockTypeEnum.whiteboard) {
   	await createWhiteboard(taskBlock.id, config.title);
   }
   ```

### Opening a Whiteboard

1. Get the task block ID from your task rendering
2. Fetch the whiteboard for that task block:

   ```typescript
   const whiteboard = await getWhiteboardByTaskBlockId(taskBlock.id);
   ```

3. Navigate to the whiteboard page:

   ```
   /subjects/{subjectOfferingId}/class/{classId}/tasks/{taskId}/whiteboard/{whiteboard.id}
   ```

4. The WebSocket connection will use the whiteboard ID from the URL

### Multiple Whiteboards in One Task

Now supported! Each whiteboard task block has its own whiteboard:

```
Task "Physics Lesson"
├─ Text Block
├─ Whiteboard Block #1 → Whiteboard ID 100
├─ Text Block
├─ Whiteboard Block #2 → Whiteboard ID 101
└─ Whiteboard Block #3 → Whiteboard ID 102
```

## Frontend Integration

### Task Block Rendering

When rendering a whiteboard task block, you need to:

1. **Get the whiteboard for the task block:**

   ```typescript
   const whiteboard = await getWhiteboardByTaskBlockId(taskBlock.id);
   ```

2. **Render a link/button to open it:**

   ```svelte
   <a
   	href="/subjects/{subjectOfferingId}/class/{classId}/tasks/{taskId}/whiteboard/{whiteboard.id}"
   >
   	Open Whiteboard
   </a>
   ```

3. **Handle case where whiteboard doesn't exist yet:**
   - For newly created blocks, the whiteboard should exist (auto-created)
   - For old blocks (before migration), you may need to create them

### WebSocket Initialization

The whiteboard component should send an init message immediately after connection:

```typescript
socket.send(JSON.stringify({ type: 'init', whiteboardId: whiteboardIdNum }));
```

## Data Migration

### For Existing Whiteboards

**File:** `migrations/0001_whiteboard_task_block_migration.sql`

The migration attempts to link existing whiteboards to whiteboard task blocks:

- Finds the first whiteboard task block for each task
- Links the whiteboard to that block
- Deletes whiteboards that can't be linked

### For Existing Whiteboard Task Blocks (No Whiteboard)

Create a migration script to ensure all whiteboard task blocks have whiteboards:

```typescript
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { taskBlockTypeEnum } from '$lib/enums';
import {
	createWhiteboard,
	getWhiteboardByTaskBlockId,
} from '$lib/server/db/service/task';

// Get all whiteboard task blocks
const whiteboardBlocks = await db
	.select()
	.from(table.taskBlock)
	.where(eq(table.taskBlock.type, taskBlockTypeEnum.whiteboard));

for (const block of whiteboardBlocks) {
	const existing = await getWhiteboardByTaskBlockId(block.id);
	if (!existing) {
		console.log(`Creating whiteboard for task block ${block.id}`);
		await createWhiteboard(block.id);
	}
}
```

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Create a new whiteboard task block - verify whiteboard is auto-created
- [ ] Create multiple whiteboard blocks in one task - verify each has unique whiteboard
- [ ] Open and draw on different whiteboards - verify content is isolated
- [ ] Delete a task block - verify whiteboard is cascade deleted
- [ ] Test WebSocket connection with correct whiteboard ID
- [ ] Test WebSocket error handling (no whiteboard ID provided)
- [ ] Test collaborative editing (multiple users on same whiteboard)
- [ ] Test collaborative editing isolation (users on different whiteboards don't see each other's changes)

## Benefits

1. **Isolation:** Each whiteboard task block has completely isolated content
2. **Scalability:** Can have unlimited whiteboards per task
3. **Clarity:** Clear one-to-one relationship between task blocks and whiteboards
4. **Automatic Cleanup:** Cascade deletes handle orphaned whiteboards
5. **Type Safety:** Database enforces the relationship at the schema level

## Potential Issues & Solutions

### Issue: Old whiteboards without task blocks

**Solution:** Migration script handles this by attempting to link to existing blocks

### Issue: WebSocket clients using old code (no whiteboard ID)

**Solution:** Server returns clear error message prompting update

### Issue: Multiple clients on different whiteboards in same task

**Solution:** WebSocket rooms are scoped by whiteboard ID (`whiteboard-${id}`)

## Future Enhancements

1. **Whiteboard Templates:** Create reusable whiteboard templates
2. **Whiteboard Sharing:** Share whiteboards across task blocks
3. **Whiteboard History:** Track changes over time
4. **Whiteboard Permissions:** Per-whiteboard access control
5. **Whiteboard Export:** Export individual whiteboards to PDF/image
