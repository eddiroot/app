# Tools & Interactions Guide

This document describes each tool available in the whiteboard toolbar and how they interact with the canvas.

## Tool Overview

| Tool      | Icon          | Keyboard | Description                         |
| --------- | ------------- | -------- | ----------------------------------- |
| Select    | Mouse pointer | `V`      | Select, move, and transform objects |
| Pan       | Hand          | `H`      | Pan/scroll the canvas               |
| Draw      | Pen           | `P`      | Freehand drawing with brush         |
| Line      | Line          | `L`      | Draw straight lines                 |
| Rectangle | Square        | -        | Draw rectangles                     |
| Circle    | Circle        | -        | Draw circles/ellipses               |
| Triangle  | Triangle      | -        | Draw triangles                      |
| Text      | T             | `T`      | Add text boxes                      |
| Image     | Image         | -        | Upload images                       |
| Eraser    | Eraser        | `E`      | Delete objects by dragging          |

---

## Select Tool

**Purpose**: Select, move, resize, and rotate objects on the canvas.

### Behavior

- **Single click** on object: Select it and show control points
- **Click and drag**: Move the selected object
- **Click on empty space**: Deselect current selection
- **Drag selection box**: Select multiple objects
- **Shift+click**: Add to selection

### Control Points

When an object is selected, custom control points appear:

- **Corner handles (0-3)**: Resize from corners
- **Edge handles (8-11)**: Resize from edges
- **Rotation handle (12)**: Rotate the object (floating above top edge)

### State Changes

```typescript
canvas.isDrawingMode = false;
canvas.selection = true;
canvas.defaultCursor = 'default';
canvas.hoverCursor = 'move';
```

---

## Pan Tool

**Purpose**: Navigate around the canvas by dragging.

### Behavior

- **Click and drag**: Pan the canvas viewport
- Cursor changes to "grab" (open hand) and "grabbing" (closed hand) when dragging
- All objects become non-selectable during pan mode

### Implementation

Uses viewport transform manipulation:

```typescript
const vpt = canvas.viewportTransform;
vpt[4] += e.clientX - lastPosX; // Translate X
vpt[5] += e.clientY - lastPosY; // Translate Y
```

### State Changes

```typescript
canvas.isDrawingMode = false;
canvas.selection = false;
canvas.defaultCursor = 'grab';
canvas.hoverCursor = 'grab';
```

---

## Draw Tool

**Purpose**: Freehand drawing with configurable brush.

### Behavior

- **Click and drag**: Draw on canvas
- Creates `fabric.Path` objects when drawing completes
- Brush type, size, and color are configurable

### Brush Types

| Type   | Class         | Description             |
| ------ | ------------- | ----------------------- |
| Pencil | `PencilBrush` | Smooth continuous line  |
| Circle | `CircleBrush` | Dotted circular pattern |
| Spray  | `SprayBrush`  | Spray paint effect      |

### Configuration (Floating Menu)

- **Brush Type**: pencil, circle, spray
- **Brush Size**: Width in pixels
- **Color**: Hex color picker
- **Opacity**: 0-100%

### State Changes

```typescript
canvas.isDrawingMode = true;
canvas.selection = false;
canvas.defaultCursor = 'crosshair';
```

---

## Line Tool

**Purpose**: Draw straight lines/polylines.

### Behavior

- **Click**: Set start point
- **Drag**: Preview line
- **Release**: Create line object

### Line Properties

- Creates `fabric.Polyline` with 2 points
- Control points appear at both endpoints for adjustment
- Supports stroke width, color, dash pattern, and opacity

### Configuration (Floating Menu)

- **Stroke Width**: Line thickness
- **Stroke Color**: Line color
- **Dash Pattern**: Solid or dashed
- **Opacity**: 0-100%

### State Changes

```typescript
canvas.isDrawingMode = false;
canvas.selection = false;
canvas.defaultCursor = 'crosshair';
canvas.hoverCursor = 'crosshair';
```

---

## Shape Tools (Rectangle, Circle, Triangle)

**Purpose**: Draw geometric shapes.

### Behavior

- **Click**: Set starting corner
- **Drag**: Preview shape size
- **Release**: Create shape object

### Shape Types

| Shape     | Fabric Class      | Notes                |
| --------- | ----------------- | -------------------- |
| Rectangle | `fabric.Rect`     | Uses center origin   |
| Circle    | `fabric.Ellipse`  | Ellipse with rx/ry   |
| Triangle  | `fabric.Triangle` | Equilateral triangle |

### Configuration (Floating Menu)

- **Fill Color**: Interior color
- **Stroke Color**: Border color
- **Stroke Width**: Border thickness
- **Dash Pattern**: Solid or dashed border
- **Opacity**: 0-100%

### State Changes

```typescript
canvas.isDrawingMode = false;
canvas.selection = false;
canvas.defaultCursor = 'crosshair';
canvas.hoverCursor = 'crosshair';
```

---

## Text Tool

**Purpose**: Add editable text boxes.

### Behavior

- **Click**: Set text position and create textbox
- **Double-click on existing text**: Enter edit mode
- Creates `fabric.Textbox` objects with text wrapping

### Text Features

- Auto-expanding width while typing
- Text wrapping within defined width
- Rich text not supported (single style per textbox)

### Configuration (Floating Menu)

- **Font Size**: Size in pixels
- **Font Family**: Arial, Times New Roman, etc.
- **Font Weight**: Normal, Bold
- **Color**: Text color
- **Text Align**: Left, Center, Right
- **Opacity**: 0-100%

### State Changes

```typescript
canvas.isDrawingMode = false;
canvas.selection = false;
canvas.defaultCursor = 'crosshair';
canvas.hoverCursor = 'crosshair';
```

---

## Image Tool

**Purpose**: Upload and add images to the canvas.

### Behavior

1. Click toolbar button → Opens file picker
2. Select image file
3. Image placed at canvas center
4. Select image to show crop option

### Supported Formats

- JPEG, PNG, GIF, WebP, SVG

### Image Features

- Maintains aspect ratio when resizing from corners
- Supports cropping via crop tool
- Uses center origin for positioning

### Cropping

When an image is selected:

1. Click "Crop" button in floating menu
2. Drag crop handles to define area
3. Click "Apply" to crop or "Cancel" to abort

---

## Eraser Tool

**Purpose**: Delete objects by dragging over them.

### Behavior

- **Click and drag**: Objects under cursor are highlighted and marked for deletion
- **Release**: All marked objects are deleted
- Shows visual trail while dragging

### Visual Feedback

- Eraser trail follows cursor
- Hovered objects dim (reduced opacity) to preview deletion
- Objects restored if cursor moves away before release

### Implementation

Tracks objects in `hoveredObjectsForDeletion` array with original opacities stored for restoration.

### State Changes

```typescript
canvas.isDrawingMode = false;
canvas.selection = false;
canvas.defaultCursor = 'crosshair';
```

---

## Tool State Management

### ToolState Interface

```typescript
interface ToolState {
	selectedTool: WhiteboardTool;
	showFloatingMenu: boolean;
	isDrawingShape: boolean;
	isDrawingText: boolean;
	currentShapeType: string;
	eraserTrail: fabric.Object[];
	lastEraserPoint: { x: number; y: number } | null;
	hoveredObjectsForDeletion: fabric.Object[];
	originalOpacities: Map<fabric.Object, number>;
	tempShape: fabric.Object | null;
	tempText: fabric.Textbox | null;
}
```

### Tool Switching

When switching tools, cleanup functions are called:

1. `clearEraserState()` - Remove eraser trail, restore opacities
2. `clearShapeDrawingState()` - Remove temp shape preview
3. `clearTextDrawingState()` - Remove temp text preview

---

## Floating Menu

The floating menu appears for tools that have configurable options:

| Tool   | Floating Menu Shows                      |
| ------ | ---------------------------------------- |
| Draw   | Brush options                            |
| Line   | Stroke options                           |
| Shapes | Fill + stroke options                    |
| Text   | Font options                             |
| Image  | Crop button (when image selected)        |
| Eraser | Eraser size                              |
| Select | Object properties (when object selected) |

---

## Source Files

- **Tool Functions**: `src/lib/components/whiteboard/tools.ts`
- **Toolbar UI**: `src/lib/components/whiteboard/whiteboard-toolbar.svelte`
- **Floating Menu**: `src/lib/components/whiteboard/whiteboard-floating-menu.svelte`
