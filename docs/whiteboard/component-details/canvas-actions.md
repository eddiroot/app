# Canvas Actions Reference

This document describes the action functions that perform operations on the whiteboard canvas.

## Overview

Canvas actions are stateless functions that perform specific operations on the canvas. They receive a `CanvasActionContext` containing the canvas instance and callbacks.

## Action Context

```typescript
interface CanvasActionContext {
	canvas: fabric.Canvas;
	sendCanvasUpdate: (data: Record<string, unknown>) => void;
	onImageAdded?: (img: fabric.FabricImage) => void;
	socket?: any;
	controlPointManager?: ControlPointManager;
	onClearComplete?: (
		deletedObjects: Array<{ id: string; data: Record<string, unknown> }>,
	) => void;
	setClearingCanvas?: (value: boolean) => void;
	onLayerChange?: (
		objectId: string,
		previousIndex: number,
		newIndex: number,
	) => void;
}
```

---

## Image Actions

### `handleImageUpload(file, ctx)`

Handles uploading and adding an image to the canvas.

```typescript
async function handleImageUpload(
	file: File,
	ctx: CanvasActionContext,
): Promise<fabric.FabricImage | null>;
```

**Process:**

1. Read file as data URL using FileReader
2. Create Fabric.js Image from data URL
3. Assign unique ID
4. Scale to fit reasonable size (max 800px)
5. Center on canvas viewport
6. Add to canvas with center origin
7. Send to server
8. Call `onImageAdded` callback

**Example:**

```typescript
const file = event.target.files[0];
const image = await handleImageUpload(file, ctx);
if (image) {
	canvas.setActiveObject(image);
}
```

---

## Clear Actions

### `clearCanvas(ctx)`

Clears all objects from the canvas.

```typescript
function clearCanvas(ctx: CanvasActionContext): void;
```

**Process:**

1. Collect all deletable objects (excluding control points)
2. Store object data for history
3. Remove all control points
4. Remove all objects
5. Send batch delete to server
6. Call `onClearComplete` with deleted objects

**Note:** The `setClearingCanvas` callback prevents history recording during clear, since clear is recorded as a single batch operation.

---

## Delete Actions

### `deleteSelectedObjects(ctx)`

Deletes all currently selected objects.

```typescript
function deleteSelectedObjects(
	ctx: CanvasActionContext,
): Array<{ id: string; data: Record<string, unknown> }>;
```

**Returns:** Array of deleted object info for history recording.

**Process:**

1. Get active objects from selection
2. For each object (excluding control points):
   - Remove associated control points
   - Collect object data for history
   - Remove from canvas
3. Discard active selection
4. Send batch delete to server
5. Return deleted objects array

---

## Zoom Actions

### `zoomIn(ctx)`

Increases zoom level by the configured step.

```typescript
function zoomIn(ctx: CanvasActionContext): number;
```

**Returns:** New zoom level.

**Implementation:**

```typescript
const currentZoom = canvas.getZoom();
const newZoom = Math.min(currentZoom * ZOOM_LIMITS.step, ZOOM_LIMITS.max);
canvas.zoomToPoint(canvas.getCenterPoint(), newZoom);
return newZoom;
```

### `zoomOut(ctx)`

Decreases zoom level by the configured step.

```typescript
function zoomOut(ctx: CanvasActionContext): number;
```

**Returns:** New zoom level.

### `resetZoom(ctx)`

Resets zoom to 100% (1.0).

```typescript
function resetZoom(ctx: CanvasActionContext): number;
```

**Returns:** 1.0

### `recenterView(ctx)`

Resets viewport to origin (0,0) with current zoom maintained.

```typescript
function recenterView(ctx: CanvasActionContext): void;
```

**Implementation:**

```typescript
const vpt = canvas.viewportTransform;
vpt[4] = 0; // Reset X translation
vpt[5] = 0; // Reset Y translation
canvas.setViewportTransform(vpt);
```

---

## Layer Actions

Layer actions change the z-index (stacking order) of objects.

### `bringToFront(ctx)`

Moves selected object to the top of the stack.

```typescript
function bringToFront(ctx: CanvasActionContext): void;
```

**Server sync:** Sends `layer` message with `action: 'bringToFront'`.

### `sendToBack(ctx)`

Moves selected object to the bottom of the stack.

```typescript
function sendToBack(ctx: CanvasActionContext): void;
```

**Server sync:** Sends `layer` message with `action: 'sendToBack'`.

### `moveForward(ctx)`

Moves selected object one step up in the stack.

```typescript
function moveForward(ctx: CanvasActionContext): void;
```

**Server sync:** Sends `layer` message with `action: 'moveForward'`.

### `moveBackward(ctx)`

Moves selected object one step down in the stack.

```typescript
function moveBackward(ctx: CanvasActionContext): void;
```

**Server sync:** Sends `layer` message with `action: 'moveBackward'`.

### Layer Action Flow

```typescript
function bringToFront(ctx: CanvasActionContext): void {
	const activeObject = ctx.canvas.getActiveObject();
	if (!activeObject || ctx.controlPointManager?.isControlPoint(activeObject))
		return;

	const previousIndex = ctx.canvas.getObjects().indexOf(activeObject);
	ctx.canvas.bringObjectToFront(activeObject);
	const newIndex = ctx.canvas.getObjects().indexOf(activeObject);

	// Ensure control points stay on top
	ctx.controlPointManager?.bringAllControlPointsToFront();

	// Notify for history recording
	ctx.onLayerChange?.(activeObject.id, previousIndex, newIndex);

	// Sync with server
	ctx.sendCanvasUpdate({
		type: 'layer',
		object: { id: activeObject.id },
		action: 'bringToFront',
	});
}
```

---

## Opacity Actions

### `applyOpacity(object, opacity, ctx)`

Applies opacity to an object and syncs with server.

```typescript
function applyOpacity(
	object: fabric.Object,
	opacity: number,
	ctx: CanvasActionContext,
): void;
```

**Parameters:**

- `object`: The target object
- `opacity`: Value from 0 to 1
- `ctx`: Action context

**Implementation:**

```typescript
function applyOpacity(object, opacity, ctx) {
	object.set({ opacity });
	object.setCoords();
	ctx.canvas.renderAll();

	const objData = object.toObject();
	objData.id = object.id;
	ctx.sendCanvasUpdate({ type: 'modify', object: objData });
}
```

---

## Utility Functions

### `hexToRgba(hex, alpha)`

Converts hex color to rgba string.

```typescript
function hexToRgba(hex: string, alpha: number): string;
```

**Example:**

```typescript
hexToRgba('#ff0000', 0.5); // 'rgba(255, 0, 0, 0.5)'
```

### `calculateDistance(x1, y1, x2, y2)`

Calculates Euclidean distance between two points.

```typescript
function calculateDistance(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): number;
```

---

## Action Usage Example

```typescript
// In the page component
const actionContext: CanvasActionContext = {
	canvas,
	sendCanvasUpdate: (data) => socket.emit(data.type, { ...data, whiteboardId }),
	controlPointManager,
	onLayerChange: (objectId, prevIndex, newIndex) => {
		history.recordLayer(objectId, prevIndex, newIndex, userId);
	},
	onClearComplete: (deletedObjects) => {
		history.recordBatchDelete(deletedObjects, userId);
	},
};

// Use actions
zoomIn(actionContext);
deleteSelectedObjects(actionContext);
bringToFront(actionContext);
```

---

## Source Files

- **Canvas Actions**: `src/lib/components/whiteboard/canvas-actions.ts`
- **Utilities**: `src/lib/components/whiteboard/utils.ts`
