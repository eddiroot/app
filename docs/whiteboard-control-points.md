# Whiteboard Control Points Implementation Guide

## Overview

Control points are custom interactive handles that allow users to reshape objects on the whiteboard. They are client-side only (not synced across users) and appear when an object is selected.

## Architecture

### Core Files

1. **`src/lib/components/whiteboard/control-points.ts`**
   - Contains the control point system
   - `ControlPointHandler` - Abstract base class for object-specific handlers
   - `LineControlPoints` - Implementation for polylines
   - `ControlPointManager` - Central manager that coordinates all handlers

2. **`src/lib/components/whiteboard/canvas-events.ts`**
   - Event handlers that integrate control points with canvas interactions
   - Selection handlers, movement handlers, etc.

3. **`src/lib/components/whiteboard/websocket.ts`**
   - Handles loading and syncing objects across users
   - Ensures control points are NOT created automatically from remote updates

4. **`src/routes/.../whiteboard/[whiteboardId]/+page.svelte`**
   - Main whiteboard component
   - Handles option changes for selected objects

## Key Principles

### 1. Client-Side Only

- Control points are NEVER synced across users
- They only exist on the local canvas
- Each user sees their own control points when they select an object

### 2. On-Demand Creation

- Control points are created only when a user selects an object
- They are NOT created automatically when loading from database
- They are NOT created when receiving updates from other users

### 3. Visibility Management

- Only visible for the selected object
- Hidden when selection changes to another object
- Hidden when deselecting

### 4. Non-Selectable Nature

- Control points must be selectable (`selectable: true`) to allow dragging
- BUT selection handlers must ignore them to prevent menu changes
- Control points should not trigger fabric.js selection borders/controls

## Implementation Checklist for New Object Types

### Step 1: Create a Handler Class

Extend `ControlPointHandler` in `control-points.ts`:

```typescript
export class RectangleControlPoints extends ControlPointHandler {
	addControlPoints(objectId: string, obj: fabric.Object, visible: boolean = true): void {
		// Create control point circles at key positions
		// For rectangles: 4 corners + 4 midpoints = 8 control points
	}

	updateControlPoints(objectId: string, obj: fabric.Object): void {
		// Update control point positions when object moves/transforms
	}

	updateObjectFromControlPoint(controlPointId: string, newX: number, newY: number): void {
		// Update the object's geometry when a control point is dragged
		// This is the most complex part - requires understanding object's coordinate system
	}
}
```

### Step 2: Register Handler in ControlPointManager

In `ControlPointManager` constructor:

```typescript
constructor(canvas: fabric.Canvas, sendCanvasUpdate?: (data: Record<string, unknown>) => void) {
  this.canvas = canvas;
  this.sendCanvasUpdate = sendCanvasUpdate;

  // Initialize handlers for different object types
  this.lineHandler = new LineControlPoints(canvas);
  this.handlers.set('polyline', this.lineHandler);

  // Add new handler
  this.rectangleHandler = new RectangleControlPoints(canvas);
  this.handlers.set('rect', this.rectangleHandler);
}
```

### Step 3: Disable Fabric.js Controls

In `websocket.ts`, ensure `hasControls` and `hasBorders` are disabled:

```typescript
// In handleLoadMessage:
if (fabricObj.type === 'rect') {
	fabricObj.hasBorders = false;
}

// In handleAddMessage:
if (obj.type === 'rect') {
	obj.set({
		hasControls: false,
		hasBorders: false
	});
}
```

### Step 4: Update Selection Handlers

In `canvas-events.ts`, add the object type to selection handlers:

```typescript
// In createSelectionCreatedHandler and createSelectionUpdatedHandler:
if (obj.type === 'polyline' || obj.type === 'rect') {
	// Add new type here
	const objId = obj.id;
	const existingPoints = ctx.controlPointManager
		.getLineHandler() // Or getRectHandler()
		.getControlPointsForObject(objId);
	if (existingPoints.length === 0) {
		ctx.controlPointManager.addControlPoints(objId, obj, true);
	} else {
		ctx.controlPointManager.showControlPoints(objId);
	}
}
```

### Step 5: Update Options Handler

In `+page.svelte`, update the appropriate options handler:

```typescript
const handleShapeOptionsChange = (options: any) => {
	currentShapeOptions = { ...options };
	if (!canvas) return;
	let activeObject = canvas.getActiveObject();

	// If a control point is selected, find its linked object
	if (activeObject && controlPointManager?.isControlPoint(activeObject)) {
		const linkedObjectId = (activeObject as any).linkedObjectId;
		if (linkedObjectId) {
			const linkedObj = canvas.getObjects().find((o: any) => o.id === linkedObjectId);
			if (linkedObj) {
				activeObject = linkedObj;
			}
		}
	}

	// Apply options to the object...
};
```

## Critical Implementation Details

### Control Point Circle Properties

```typescript
const circle = new fabric.Circle({
	radius: 6,
	fill: 'oklch(0.6171 0.1375 39.0427)',
	stroke: 'oklch(0.5171 0.1375 39.0427)',
	strokeWidth: 2,
	left: x,
	top: y,
	originX: 'center',
	originY: 'center',
	selectable: true, // MUST be true for dragging
	hasControls: false, // No fabric.js controls
	hasBorders: false, // No fabric.js borders
	hoverCursor: 'move',
	evented: true, // Receives events
	excludeFromExport: true // Don't save to canvas JSON
});

// Custom properties for identification
(circle as any).id = controlPointId;
(circle as any).isControlPoint = true;
(circle as any).linkedObjectId = objectId;
(circle as any).pointIndex = pointIndex;
```

### Preventing Control Point Sync

In `canvas-events.ts`:

```typescript
// In object:moving handler:
if (ctx.controlPointManager?.isControlPoint(target)) {
	const center = target.getCenterPoint();
	ctx.controlPointManager.updateObjectFromControlPoint(target.id, center.x, center.y);
	return; // CRITICAL: Don't proceed to sync
}

// In object:modified handler:
if (ctx.controlPointManager?.isControlPoint(target)) {
	return; // CRITICAL: Skip sync entirely
}

// In selection handlers:
if (ctx.controlPointManager?.isControlPoint(obj)) {
	return; // CRITICAL: Don't change menu
}
```

### Coordinate System Considerations

When implementing `updateObjectFromControlPoint`, you must handle:

1. **Transformation Matrix** - Objects may be rotated, scaled, or moved
2. **Origin Points** - Objects have different origin points (center, top-left, etc.)
3. **Path Offsets** - Polylines have `pathOffset` that needs accounting
4. **Absolute vs Relative** - Convert between canvas coordinates and object coordinates

Example for polylines:

```typescript
// Get transformation matrix
const matrix = line.calcTransformMatrix();

// Convert point to absolute coordinates
const absolutePoint = fabric.util.transformPoint(
	new fabric.Point(point.x - line.pathOffset.x, point.y - line.pathOffset.y),
	matrix
);
```

### Object Reconstruction Pattern

For complex transformations, sometimes you need to recreate the object:

```typescript
// Store properties
const objectId = obj.id;
const props = {
	stroke: obj.stroke,
	strokeWidth: obj.strokeWidth
	// ... other properties
};

// Remove old object
canvas.remove(obj);

// Create new object with updated geometry
const newObj = new fabric.Polyline(newPoints, {
	id: objectId,
	...props,
	hasControls: false,
	hasBorders: false
});

// Add to canvas
canvas.add(newObj);

// Bring control points to front
controlPointManager.bringAllControlPointsToFront();
```

## Common Pitfalls

### 1. Control Points Appearing on Remote Browsers

**Problem:** Control points flash briefly on other users' screens  
**Solution:** Return early in `object:moving` handler before sync

### 2. Stray Control Points Left Behind

**Problem:** Control point circle remains after dragging  
**Solution:** Update circle position immediately in `updateObjectFromControlPoint`

### 3. Menu Opens for Control Points

**Problem:** Clicking control point opens circle shape menu  
**Solution:** Return early in selection handlers when control point detected

### 4. Line Options Don't Work

**Problem:** Options don't apply when control point is selected  
**Solution:** Detect control point in options handler and find linked object

### 5. Blue Borders on Reload

**Problem:** Fabric.js selection borders appear after page reload  
**Solution:** Set `hasBorders: false` in `handleLoadMessage` for that object type

### 6. Control Points Behind Objects

**Problem:** Control points render behind newly added objects  
**Solution:** Call `bringAllControlPointsToFront()` after adding objects

## Testing Checklist

When implementing control points for a new object type:

- [ ] Control points appear when object is selected
- [ ] Control points disappear when deselecting
- [ ] Control points disappear when selecting another object
- [ ] Dragging control points reshapes the object correctly
- [ ] Control points don't appear on other users' screens
- [ ] No stray control points left behind after dragging
- [ ] Object options menu stays open when clicking control points
- [ ] Changing options works when control point is selected
- [ ] No blue borders appear after page reload
- [ ] Control points appear on top of all objects
- [ ] Undo/redo works correctly (control points aren't in history)
- [ ] Control points don't get saved to database

## Future Enhancements

Possible improvements for control points system:

1. **Different control point styles** for different object types
2. **Snap to grid** when dragging control points
3. **Constrain proportions** (hold Shift while dragging)
4. **Smart guides** showing alignment with other objects
5. **Rotation handles** as control points
6. **Add/remove points** for polylines (click to add, right-click to remove)
7. **Bezier curve handles** for curved paths
8. **Animation** when control points appear/disappear

## Architecture Benefits

This modular architecture provides:

- **Extensibility** - Easy to add control points for new object types
- **Maintainability** - Each object type's logic is isolated
- **Performance** - Control points only exist when needed
- **Consistency** - Same patterns across all object types
- **Testability** - Each handler can be tested independently
