# Canvas Event System

This document describes the event handling system that processes user interactions on the whiteboard canvas.

## Overview

The canvas event system translates user mouse/touch interactions into canvas operations. All event handlers receive a `CanvasEventContext` object containing the current state and callbacks needed to process the event.

## Event Handler Functions

### `setupCanvasEventHandlers(canvas, ctx)`

Main setup function that attaches all event listeners to the Fabric.js canvas.

```typescript
function setupCanvasEventHandlers(
	canvas: fabric.Canvas,
	ctx: CanvasEventContext,
): void;
```

### Events Handled

| Event               | Fabric Event          | Handler                   |
| ------------------- | --------------------- | ------------------------- |
| Mouse Down          | `mouse:down`          | `handleMouseDown`         |
| Mouse Move          | `mouse:move`          | `handleMouseMove`         |
| Mouse Up            | `mouse:up`            | `handleMouseUp`           |
| Object Moving       | `object:moving`       | `handleObjectMoving`      |
| Object Scaling      | `object:scaling`      | `handleObjectScaling`     |
| Object Rotating     | `object:rotating`     | `handleObjectRotating`    |
| Object Modified     | `object:modified`     | `handleObjectModified`    |
| Selection Created   | `selection:created`   | `handleSelectionCreated`  |
| Selection Updated   | `selection:updated`   | `handleSelectionUpdated`  |
| Selection Cleared   | `selection:cleared`   | `handleSelectionCleared`  |
| Text Changed        | `text:changed`        | `handleTextChanged`       |
| Text Editing Exited | `text:editing:exited` | `handleTextEditingExited` |
| Path Created        | `path:created`        | `handlePathCreated`       |

---

## Mouse Events

### `handleMouseDown`

Triggered when user presses mouse button on canvas.

**Tool-specific behaviors:**

| Tool   | Action                                 |
| ------ | -------------------------------------- |
| Pan    | Start panning, record initial position |
| Line   | Start line drawing, create start point |
| Shapes | Start shape drawing, create temp shape |
| Text   | Start text creation at click point     |
| Eraser | Begin eraser trail                     |
| Select | Start selection (handled by Fabric.js) |
| Crop   | Handle crop handle click               |

**Control Point Detection:**

```typescript
// Check if clicking on a control point
if (controlPointManager?.isControlPoint(target)) {
	// Start dragging the control point
	setIsDraggingControlPoint(true);
	setDraggedControlPointId(target.id);
}
```

### `handleMouseMove`

Triggered during mouse movement.

**Tool-specific behaviors:**

| Tool   | Action                                               |
| ------ | ---------------------------------------------------- |
| Pan    | Update viewport transform                            |
| Line   | Update line preview                                  |
| Shapes | Resize temp shape preview                            |
| Text   | Update text box size                                 |
| Eraser | Check for objects under cursor, add to deletion list |
| Crop   | Move crop handles                                    |

**Throttling:**
Image and live updates are throttled to prevent overwhelming the network:

```typescript
const now = Date.now();
if (now - lastImageUpdateTime > IMAGE_THROTTLE_MS) {
	sendImageUpdate(objectData);
	lastImageUpdateTime = now;
}
```

### `handleMouseUp`

Triggered when user releases mouse button.

**Tool-specific behaviors:**

| Tool   | Action                             |
| ------ | ---------------------------------- |
| Pan    | End panning                        |
| Line   | Finalize line, send to server      |
| Shapes | Finalize shape, send to server     |
| Text   | Finalize text box, enter edit mode |
| Eraser | Delete all hovered objects         |
| Crop   | Complete crop handle drag          |

---

## Object Events

### `handleObjectMoving`

Triggered continuously while dragging an object.

**Responsibilities:**

1. Update control point positions to follow object
2. Send "live" updates (not persisted) for real-time sync
3. Track movement for undo/redo

```typescript
function handleObjectMoving(e: fabric.TEvent, ctx: CanvasEventContext) {
	const obj = e.target;
	const objectId = obj.id;

	// Update control points
	ctx.controlPointManager?.updateControlPoints(objectId, obj);

	// Send live update
	ctx.sendCanvasUpdate({
		type: 'modify',
		object: { id: objectId, left: obj.left, top: obj.top },
		live: true, // Not persisted to DB
	});
}
```

### `handleObjectScaling`

Triggered during resize operations.

**Behaviors:**

- Updates control point positions
- Sends live updates with new scale values
- For images: maintains aspect ratio from corners

### `handleObjectRotating`

Triggered during rotation.

**Behaviors:**

- Updates control point positions
- Rotation handle updates position relative to object center

### `handleObjectModified`

Triggered when object manipulation completes (mouse up after moving/scaling/rotating).

**Responsibilities:**

1. Record history for undo/redo
2. Send final update to server (persisted)
3. Sync UI state (floating menu, etc.)

```typescript
function handleObjectModified(e: fabric.TEvent, ctx: CanvasEventContext) {
	const obj = e.target;
	const objectData = obj.toObject();
	objectData.id = obj.id;

	// Send final (persisted) update
	ctx.sendCanvasUpdate({
		type: 'modify',
		object: objectData,
		live: false, // Will be persisted
	});

	// Record history
	ctx.history?.recordModify(obj.id, beforeState, objectData, ctx.userId);
}
```

---

## Selection Events

### `handleSelectionCreated`

Triggered when one or more objects are selected.

**Responsibilities:**

1. Add control points for selected objects
2. Update floating menu with selected object properties
3. Sync selection state

```typescript
function handleSelectionCreated(e: fabric.TEvent, ctx: CanvasEventContext) {
	const selection = e.selected || [];

	selection.forEach((obj) => {
		if (!ctx.controlPointManager?.isControlPoint(obj)) {
			ctx.controlPointManager?.addControlPoints(obj.id, obj, true);
		}
	});
}
```

### `handleSelectionUpdated`

Triggered when selection changes (objects added/removed from selection).

**Behaviors:**

- Remove control points from deselected objects
- Add control points to newly selected objects

### `handleSelectionCleared`

Triggered when all objects are deselected.

**Responsibilities:**

1. Remove all control points
2. Reset floating menu
3. Clear selection-related state

---

## Text Events

### `handleTextChanged`

Triggered while editing text content.

**Behaviors:**

- Auto-resize textbox to fit content
- Send live updates for real-time sync
- Update control points

### `handleTextEditingExited`

Triggered when user exits text editing mode (click outside, press Escape).

**Responsibilities:**

1. Handle empty text (delete if empty)
2. Send final text update
3. Record history
4. Re-add control points

```typescript
function handleTextEditingExited(e: fabric.TEvent, ctx: CanvasEventContext) {
	const textbox = e.target as fabric.Textbox;

	if (!textbox.text || textbox.text.trim() === '') {
		// Delete empty textbox
		ctx.canvas.remove(textbox);
		ctx.sendCanvasUpdate({ type: 'delete', objects: [{ id: textbox.id }] });
	} else {
		// Send final update
		const textData = textbox.toObject(['text']);
		textData.id = textbox.id;
		ctx.sendCanvasUpdate({ type: 'modify', object: textData });
	}
}
```

---

## Path Events

### `handlePathCreated`

Triggered when freehand drawing completes (path created).

**Responsibilities:**

1. Assign unique ID to path
2. Apply opacity setting
3. Disable default Fabric.js controls
4. Send to server
5. Record history

```typescript
function handlePathCreated(
	e: fabric.TEvent<{ path: fabric.Path }>,
	ctx: CanvasEventContext,
) {
	const path = e.path;
	const pathId = uuidv4();

	path.set({
		id: pathId,
		hasControls: false,
		hasBorders: false,
		opacity: ctx.getDrawOptions().opacity,
	});

	const pathData = path.toObject();
	pathData.id = pathId;

	ctx.sendCanvasUpdate({ type: 'add', object: pathData });
	ctx.history?.recordAdd(pathId, pathData, ctx.userId);
}
```

---

## CanvasEventContext Interface

The context object provides access to state and callbacks:

```typescript
interface CanvasEventContext {
	// State getters
	getSelectedTool: () => WhiteboardTool;
	getIsPanning: () => boolean;
	getIsDrawingLine: () => boolean;
	getIsDrawingShape: () => boolean;
	// ... more getters

	// State setters
	setIsPanning: (value: boolean) => void;
	setIsDrawingLine: (value: boolean) => void;
	// ... more setters

	// Options getters
	getTextOptions: () => TextOptions;
	getShapeOptions: () => ShapeOptions;
	getDrawOptions: () => DrawOptions;
	getLineOptions: () => LineOptions;

	// Callbacks
	sendCanvasUpdate: (data: Record<string, unknown>) => void;
	sendImageUpdate: (data: Record<string, unknown>) => void;
	clearEraserState: () => void;

	// Managers
	controlPointManager?: ControlPointManager;
	history?: CanvasHistory;

	// User info
	userId?: string;
}
```

---

## Event Flow Diagram

```
User Interaction
      │
      ▼
┌──────────────┐
│ Mouse Event  │
└──────────────┘
      │
      ▼
┌──────────────┐     ┌──────────────┐
│ Tool Check   │────▶│ Tool Handler │
└──────────────┘     └──────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Canvas   │  │ Control  │  │ WebSocket│
        │ Update   │  │ Points   │  │ Sync     │
        └──────────┘  └──────────┘  └──────────┘
              │             │             │
              ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ History  │  │ Render   │  │ Remote   │
        │ Record   │  │ Canvas   │  │ Clients  │
        └──────────┘  └──────────┘  └──────────┘
```

---

## Source Files

- **Event Handlers**: `src/lib/components/whiteboard/canvas-events.ts`
