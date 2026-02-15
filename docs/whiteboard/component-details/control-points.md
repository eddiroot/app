# Control Points System

This document describes the custom control point system that provides interactive handles for reshaping objects on the whiteboard.

## Overview

Control points are draggable handles that appear when an object is selected, allowing users to resize, reshape, and rotate objects. They replace the default Fabric.js controls with a custom implementation that provides:

- Consistent visual styling across object types
- Object-specific resize behaviors
- Rotation handles
- Real-time synchronization of changes
- Zoom-aware sizing

## Key Principles

### 1. Client-Side Only

- Control points are NEVER synced across users
- Each user sees their own control points when they select an object
- Prevents visual clutter and sync conflicts

### 2. On-Demand Creation

- Created only when a user selects an object
- NOT created automatically when loading from database
- NOT created when receiving updates from other users

### 3. Visibility Management

- Only visible for the selected object(s)
- Hidden when selection changes to another object
- Removed when object is deleted

---

## Architecture

### Class Hierarchy

```
ControlPointHandler (abstract base)
├── LineControlPoints (polylines)
├── BoundingBoxControlPoints (abstract)
│   ├── RectangleControlPoints
│   ├── EllipseControlPoints
│   ├── TriangleControlPoints
│   ├── TextboxControlPoints
│   ├── ImageControlPoints
│   └── PathControlPoints
└── CropOverlay (special case for image cropping)

ControlPointManager (central coordinator)
```

### Control Point Index Convention

| Index | Position             | Purpose           |
| ----- | -------------------- | ----------------- |
| 0     | Top-left corner      | Diagonal resize   |
| 1     | Top-right corner     | Diagonal resize   |
| 2     | Bottom-right corner  | Diagonal resize   |
| 3     | Bottom-left corner   | Diagonal resize   |
| 8     | Top edge midpoint    | Vertical resize   |
| 9     | Right edge midpoint  | Horizontal resize |
| 10    | Bottom edge midpoint | Vertical resize   |
| 11    | Left edge midpoint   | Horizontal resize |
| 12    | Above top edge       | Rotation          |

---

## ControlPointManager API

### Constructor

```typescript
const manager = new ControlPointManager(
  canvas: fabric.Canvas,
  sendCanvasUpdate?: (data: Record<string, unknown>) => void
)
```

### Methods

| Method                                     | Description                          |
| ------------------------------------------ | ------------------------------------ |
| `addControlPoints(objectId, obj, visible)` | Add control points for an object     |
| `removeControlPoints(objectId)`            | Remove control points for an object  |
| `hideControlPoints(objectId)`              | Hide control points (keep in memory) |
| `showControlPoints(objectId)`              | Show hidden control points           |
| `hideAllControlPoints()`                   | Hide all control points              |
| `updateControlPoints(objectId, obj)`       | Update positions after object moves  |
| `updateObjectFromControlPoint(cpId, x, y)` | Handle control point drag            |
| `isControlPoint(obj)`                      | Check if object is a control point   |
| `getAllControlPoints()`                    | Get all control point references     |
| `bringAllControlPointsToFront()`           | Ensure control points render on top  |
| `updateAllControlPointSizes()`             | Update sizes based on zoom           |

---

## Handler Classes

### LineControlPoints

Handles polylines (straight lines).

**Control Points:**

- Point 0: Start endpoint
- Point N-1: End endpoint

**Behavior:**

- Dragging endpoints updates line geometry
- Line is recreated with new points (not transformed)

### RectangleControlPoints

Handles rectangles with full bounding box controls.

**Features:**

- Corner resize (maintains position of opposite corner)
- Edge resize (stretches single dimension)
- Rotation handle
- Works with rotated rectangles

### EllipseControlPoints

Handles ellipses/circles.

**Features:**

- Adjusts `rx` and `ry` radii
- Edge handles change single axis
- Corner handles scale proportionally
- Rotation support

### TriangleControlPoints

Handles triangles.

**Features:**

- Same as rectangle (bounding box based)
- Triangle scales within bounding box

### TextboxControlPoints

Handles text objects.

**Special Behaviors:**

- Horizontal resize reflows text
- Vertical resize scales font size proportionally
- Maintains readable text proportions
- Rotation currently disabled (buggy)

### ImageControlPoints

Handles images.

**Features:**

- Corner resize maintains aspect ratio
- Edge resize allows distortion
- Supports clipped/cropped images
- Rotation support

### PathControlPoints

Handles freehand drawings.

**Status:** Currently disabled due to bugs.

---

## CropOverlay

Special overlay for image cropping mode.

### Usage

```typescript
const cropOverlay = new CropOverlay(canvas);

// Start cropping
cropOverlay.startCrop(image, (bounds) => {
	console.log('Crop bounds changed:', bounds);
});

// Apply crop
const result = cropOverlay.applyCrop();
// result = { success: true, imageId: '...', cropData: {...} }

// Or cancel
cropOverlay.cancelCrop();
```

### Visual Elements

- Dark overlay outside crop area
- Dashed border showing crop rectangle
- 4 corner handles + 4 edge handles

---

## Implementation Guide

### Adding Control Points for a New Object Type

#### Step 1: Create Handler Class

```typescript
export class MyShapeControlPoints extends BoundingBoxControlPoints {
	addControlPoints(
		objectId: string,
		obj: fabric.Object,
		visible: boolean = true,
	): void {
		const shape = obj as fabric.MyShape;
		const matrix = shape.calcTransformMatrix();

		// Calculate corner positions in local coordinates
		const corners = [
			{ x: -width / 2, y: -height / 2 }, // Top-left
			{ x: width / 2, y: -height / 2 }, // Top-right
			{ x: width / 2, y: height / 2 }, // Bottom-right
			{ x: -width / 2, y: height / 2 }, // Bottom-left
		];

		// Transform to absolute coordinates
		const absoluteCorners = corners.map((c) =>
			fabric.util.transformPoint(new fabric.Point(c.x, c.y), matrix),
		);

		// Create corner control points
		absoluteCorners.forEach((corner, index) => {
			const circle = this.createControlPointCircle(
				corner.x,
				corner.y,
				`${objectId}-cp-${index}`,
				objectId,
				index,
				true, // selectable
			);
			circle.set({ visible });
			this.canvas.add(circle);
			this.controlPoints.push({ id, circle, objectId, pointIndex: index });
		});

		// Create edge midpoints, rotation handle, etc.
		// ...

		this.bringControlPointsToFront();
	}

	updateControlPoints(objectId: string, obj: fabric.Object): void {
		// Recalculate positions and update circles
	}

	updateObjectFromControlPoint(cpId: string, newX: number, newY: number): void {
		// Handle the resize/rotate logic
	}
}
```

#### Step 2: Register in ControlPointManager

```typescript
constructor(canvas: fabric.Canvas) {
  // ...existing handlers...

  const myShapeHandler = new MyShapeControlPoints(canvas)
  this.handlers.set('myshape', myShapeHandler)  // fabric type name
}
```

#### Step 3: Disable Fabric.js Controls

In websocket handlers:

```typescript
obj.set({ hasControls: false, hasBorders: false });
```

---

## Control Point Circle Properties

```typescript
const circle = new fabric.Circle({
	radius: 6 * scale, // Zoom-adjusted
	fill: 'oklch(0.6171 0.1375 39.0427)', // Brand orange
	stroke: 'oklch(0.5171 0.1375 39.0427)', // Darker orange
	strokeWidth: 2 * scale, // Zoom-adjusted
	left: x,
	top: y,
	originX: 'center',
	originY: 'center',
	selectable: true, // Required for dragging
	hasControls: false, // No nested controls
	hasBorders: false, // No selection border
	hoverCursor: 'move', // Cursor style
	evented: true, // Receives events
	excludeFromExport: true, // Not saved to JSON
});

// Custom identification properties
circle.id = controlPointId;
circle.isControlPoint = true;
circle.linkedObjectId = objectId;
circle.pointIndex = pointIndex;
```

---

## Coordinate System Handling

### Transformation Matrix

Objects can be rotated, scaled, and positioned. Use the transformation matrix to convert between coordinate systems:

```typescript
// Get transformation matrix
const matrix = obj.calcTransformMatrix();

// Local to absolute
const absolutePoint = fabric.util.transformPoint(
	new fabric.Point(localX, localY),
	matrix,
);

// For polylines, account for pathOffset
const absolutePoint = fabric.util.transformPoint(
	new fabric.Point(point.x - line.pathOffset.x, point.y - line.pathOffset.y),
	matrix,
);
```

### Object Reconstruction Pattern

For complex changes, sometimes recreating the object is simpler:

```typescript
// Store properties
const id = obj.id;
const props = { stroke, strokeWidth, opacity, angle };

// Remove old
canvas.remove(obj);

// Create new with updated geometry
const newObj = new fabric.Rect({
	id,
	...newGeometry,
	...props,
	hasControls: false,
	hasBorders: false,
});

canvas.add(newObj);
controlPointManager.bringAllControlPointsToFront();
```

---

## Zoom Handling

Control points maintain constant visual size regardless of zoom:

```typescript
updateControlPointSizes(): void {
  const zoom = this.canvas.getZoom()
  const scale = 1 / zoom  // Inverse scale

  this.controlPoints.forEach((cp) => {
    cp.circle.set({
      radius: 6 * scale,
      strokeWidth: 2 * scale
    })
    cp.circle.setCoords()
  })
}
```

Call this in the zoom handler:

```typescript
canvas.on('mouse:wheel', (e) => {
	// ... zoom logic ...
	controlPointManager.updateAllControlPointSizes();
});
```

---

## Common Pitfalls

| Problem                                  | Solution                                      |
| ---------------------------------------- | --------------------------------------------- |
| Control points appear on remote browsers | Return early in `object:moving` before sync   |
| Stray control points left behind         | Update circle position immediately in handler |
| Menu opens for control points            | Check `isControlPoint` in selection handlers  |
| Options don't apply to linked object     | Find linked object via `linkedObjectId`       |
| Blue borders on reload                   | Set `hasBorders: false` in load handler       |
| Control points behind objects            | Call `bringAllControlPointsToFront()`         |

---

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
- [ ] Control points resize correctly when zooming

---

## Source Files

- **Control Points**: `src/lib/components/whiteboard/control-points.ts`
