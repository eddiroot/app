# Undo/Redo History System

This document describes the history management system that enables undo/redo functionality in the whiteboard.

## Overview

The history system uses the **Command Pattern** to track all canvas modifications. Each action is recorded as a command that can be undone (reversed) and redone (reapplied).

## Architecture

### CanvasHistory Class

Central class managing the undo/redo stacks.

```typescript
class CanvasHistory {
	private undoStack: Command[] = [];
	private redoStack: Command[] = [];
	private maxSize: number = 50;
}
```

### Command Structure

```typescript
interface Command {
	type: 'add' | 'modify' | 'delete' | 'batch-delete' | 'layer';
	objectId: string;
	userId: string;
	timestamp: number;
	objectData: Record<string, unknown>;

	// For modify commands
	beforeState?: Record<string, unknown>;
	afterState?: Record<string, unknown>;

	// For batch-delete commands
	batchObjects?: Array<{ id: string; data: Record<string, unknown> }>;

	// For layer commands
	previousIndex?: number;
	newIndex?: number;
}
```

---

## Command Types

### Add Command

Records when an object is created.

```typescript
{
  type: 'add',
  objectId: 'uuid-123',
  userId: 'user-456',
  timestamp: Date.now(),
  objectData: { /* serialized object */ }
}
```

**Undo:** Delete the object
**Redo:** Re-add the object

### Modify Command

Records when an object is changed (moved, resized, rotated, styled).

```typescript
{
  type: 'modify',
  objectId: 'uuid-123',
  userId: 'user-456',
  timestamp: Date.now(),
  objectData: { id: 'uuid-123' },
  beforeState: { left: 100, top: 100, ... },
  afterState: { left: 200, top: 150, ... }
}
```

**Undo:** Apply `beforeState`
**Redo:** Apply `afterState`

### Delete Command

Records when an object is deleted.

```typescript
{
  type: 'delete',
  objectId: 'uuid-123',
  userId: 'user-456',
  timestamp: Date.now(),
  objectData: { /* full serialized object */ }
}
```

**Undo:** Re-add the object
**Redo:** Delete the object again

### Batch-Delete Command

Records when multiple objects are deleted at once (clear canvas, multi-select delete).

```typescript
{
  type: 'batch-delete',
  objectId: 'batch-timestamp',
  userId: 'user-456',
  timestamp: Date.now(),
  objectData: {},
  batchObjects: [
    { id: 'uuid-1', data: { /* object 1 */ } },
    { id: 'uuid-2', data: { /* object 2 */ } },
    // ...
  ]
}
```

**Undo:** Re-add all objects
**Redo:** Delete all objects again

### Layer Command

Records when an object's z-index changes.

```typescript
{
  type: 'layer',
  objectId: 'uuid-123',
  userId: 'user-456',
  timestamp: Date.now(),
  objectData: { id: 'uuid-123' },
  previousIndex: 2,
  newIndex: 5
}
```

**Undo:** Move to `previousIndex`
**Redo:** Move to `newIndex`

---

## CanvasHistory API

### Recording Methods

```typescript
// Record object creation
recordAdd(objectId: string, objectData: Record<string, unknown>, userId: string): void

// Record object modification (call before and after)
recordModifyStart(objectId: string, beforeState: Record<string, unknown>): void
recordModifyEnd(objectId: string, afterState: Record<string, unknown>, userId: string): void

// Record object deletion
recordDelete(objectId: string, objectData: Record<string, unknown>, userId: string): void

// Record batch deletion
recordBatchDelete(
  objects: Array<{ id: string; data: Record<string, unknown> }>,
  userId: string
): void

// Record layer change
recordLayer(
  objectId: string,
  previousIndex: number,
  newIndex: number,
  userId: string
): void
```

### Navigation Methods

```typescript
// Check if undo/redo is available
canUndo(): boolean
canRedo(): boolean

// Get commands for execution
popUndo(): Command | undefined
popRedo(): Command | undefined

// Move command between stacks
pushToRedo(command: Command): void
pushToUndo(command: Command): void
```

### State Methods

```typescript
// Clear all history
clear(): void

// Get current stack sizes
getUndoCount(): number
getRedoCount(): number
```

---

## Apply Functions

### applyUndo

Executes an undo operation on the canvas.

```typescript
async function applyUndo(
	command: Command,
	canvas: fabric.Canvas,
	sendCanvasUpdate: (data: Record<string, unknown>) => void,
	controlPointManager?: ControlPointManager,
): Promise<void>;
```

### applyRedo

Executes a redo operation on the canvas.

```typescript
async function applyRedo(
	command: Command,
	canvas: fabric.Canvas,
	sendCanvasUpdate: (data: Record<string, unknown>) => void,
	controlPointManager?: ControlPointManager,
): Promise<void>;
```

---

## Usage Example

```typescript
// Initialize history
const history = new CanvasHistory();

// Record an add
const rectId = uuidv4();
const rectData = rect.toObject();
rectData.id = rectId;
history.recordAdd(rectId, rectData, userId);

// Record a modify (before + after)
history.recordModifyStart(rectId, { left: 100, top: 100 });
rect.set({ left: 200, top: 150 });
history.recordModifyEnd(rectId, { left: 200, top: 150 }, userId);

// Perform undo
if (history.canUndo()) {
	const command = history.popUndo();
	await applyUndo(command, canvas, sendCanvasUpdate, controlPointManager);
	history.pushToRedo(command);
	updateHistoryState();
}

// Perform redo
if (history.canRedo()) {
	const command = history.popRedo();
	await applyRedo(command, canvas, sendCanvasUpdate, controlPointManager);
	history.pushToUndo(command);
	updateHistoryState();
}
```

---

## Implementation Details

### Per-User History

History is tracked per-user. Commands include `userId` for potential future features like:

- Showing who made each change
- Filtering history by user
- Collaborative undo (undo only your changes)

### Stack Size Limit

Default limit of 50 commands prevents memory issues:

```typescript
private addToUndoStack(command: Command): void {
  this.undoStack.push(command)
  if (this.undoStack.length > this.maxSize) {
    this.undoStack.shift()  // Remove oldest
  }
  this.redoStack = []  // Clear redo on new action
}
```

### Redo Stack Clearing

When a new action is recorded, the redo stack is cleared. This prevents inconsistent states from branching history.

### Control Points Exclusion

Control points are client-side only and are NOT included in history:

- They're excluded from object serialization
- Undo/redo recreates objects without control points
- Control points are re-added on selection

---

## Integration with Canvas Events

### Recording Flow

```
User Action
    │
    ▼
Canvas Event Handler
    │
    ├─── Before: recordModifyStart() ───▶ Store beforeState
    │
    ▼
Apply Change to Canvas
    │
    ▼
Object Modified Event
    │
    └─── After: recordModifyEnd() ───▶ Store afterState
                                        Clear redo stack
```

### Example: Object Move

```typescript
// In object:moving handler - track start state
handleObjectMoving(e) {
  const obj = e.target
  if (!movingObjectBeforeState.has(obj.id)) {
    // First move event - store initial state
    movingObjectBeforeState.set(obj.id, {
      left: obj.left,
      top: obj.top
    })
  }
}

// In object:modified handler - record complete action
handleObjectModified(e) {
  const obj = e.target
  const beforeState = movingObjectBeforeState.get(obj.id)

  if (beforeState) {
    history.recordModifyStart(obj.id, beforeState)
    history.recordModifyEnd(obj.id, {
      left: obj.left,
      top: obj.top
    }, userId)

    movingObjectBeforeState.delete(obj.id)
  }
}
```

---

## UI Integration

### Updating Button States

```typescript
function updateHistoryState() {
	canUndoState = history.canUndo();
	canRedoState = history.canRedo();
}
```

### Keyboard Shortcuts

```typescript
// Ctrl+Z / Cmd+Z for undo
if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
	performUndo();
}

// Ctrl+Shift+Z / Cmd+Shift+Z for redo
if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
	performRedo();
}

// Ctrl+Y / Cmd+Y for redo (alternative)
if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
	performRedo();
}
```

---

## Special Cases

### Clear Canvas

Clear is recorded as a single batch-delete command containing all deleted objects:

```typescript
function clearCanvas(ctx) {
	const deletedObjects = [];

	ctx.canvas.getObjects().forEach((obj) => {
		if (!controlPointManager.isControlPoint(obj)) {
			deletedObjects.push({ id: obj.id, data: obj.toObject() });
		}
	});

	// Record before clearing
	ctx.onClearComplete?.(deletedObjects); // Triggers recordBatchDelete

	// Then clear
	ctx.canvas.clear();
}
```

### Paste Operations

Pasted objects are recorded as individual add commands:

```typescript
async function pasteFromClipboard(ctx) {
	for (const objData of clipboard) {
		const newId = uuidv4();
		// ... create object ...

		ctx.history?.recordAdd(newId, sendData, ctx.userId);
	}
}
```

---

## Source Files

- **History System**: `src/lib/components/whiteboard/canvas-history.ts`
