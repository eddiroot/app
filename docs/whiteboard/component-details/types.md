# Types & Interfaces Reference

This document describes all TypeScript types and interfaces used in the whiteboard feature.

## Tool Types

### `WhiteboardTool`

The available tools in the whiteboard toolbar.

```typescript
type WhiteboardTool =
	| 'select' // Selection and movement tool
	| 'pan' // Canvas panning tool
	| 'draw' // Freehand drawing tool
	| 'line' // Line/polyline drawing tool
	| 'arrow' // Arrow drawing tool (variant of line)
	| 'shapes' // Shape creation tool (rectangle, circle, triangle)
	| 'text' // Text creation tool
	| 'image' // Image upload tool
	| 'eraser' // Object eraser tool
	| 'crop'; // Image cropping tool
```

### `ShapeType`

Available geometric shapes.

```typescript
type ShapeType = 'rectangle' | 'circle' | 'triangle';
```

### `BrushType`

Available brush types for freehand drawing.

```typescript
type BrushType = 'pencil' | 'circle' | 'spray';
```

---

## Option Interfaces

### `TextOptions`

Configuration for text objects.

```typescript
interface TextOptions {
	fontSize: number; // Font size in pixels (default: 16)
	fontFamily: string; // Font family name (default: 'Arial')
	fontWeight: string; // Font weight (default: 'normal')
	colour: string; // Text color as hex (default: '#4A5568')
	textAlign: string; // Alignment: 'left' | 'center' | 'right'
	opacity: number; // Opacity from 0 to 1 (default: 1)
}
```

### `ShapeOptions`

Configuration for shape objects (rectangles, circles, triangles).

```typescript
interface ShapeOptions {
	strokeWidth: number; // Border width in pixels (default: 2)
	strokeColour: string; // Border color as hex (default: '#4A5568')
	fillColour: string; // Fill color as hex (default: 'transparent')
	strokeDashArray: number[]; // Dash pattern, e.g., [5, 5] for dashed
	opacity: number; // Opacity from 0 to 1 (default: 1)
}
```

### `DrawOptions`

Configuration for freehand drawing.

```typescript
interface DrawOptions {
	brushSize: number; // Brush width in pixels (default: 6)
	brushColour: string; // Brush color as hex (default: '#4A5568')
	brushType: BrushType; // Type of brush (default: 'pencil')
	opacity: number; // Opacity from 0 to 1 (default: 1)
}
```

### `LineOptions`

Configuration for line objects.

```typescript
interface LineOptions {
	strokeWidth: number; // Line width in pixels (default: 2)
	strokeColour: string; // Line color as hex (default: '#4A5568')
	strokeDashArray: number[]; // Dash pattern, e.g., [5, 5] for dashed
	opacity: number; // Opacity from 0 to 1 (default: 1)
}
```

---

## Data Types

### `Point`

A 2D coordinate point.

```typescript
interface Point {
	x: number;
	y: number;
}
```

### `LayerAction`

Available layer ordering operations.

```typescript
type LayerAction =
	| 'sendToBack'
	| 'moveBackward'
	| 'bringToFront'
	| 'moveForward';
```

### `CanvasUpdateData`

Data structure for WebSocket canvas updates.

```typescript
interface CanvasUpdateData {
	type:
		| 'add'
		| 'modify'
		| 'delete'
		| 'clear'
		| 'load'
		| 'update'
		| 'remove'
		| 'layer';
	whiteboardId?: number;
	object?: Record<string, unknown>; // Single object data
	objects?: Record<string, unknown>[]; // Multiple objects data
	live?: boolean; // True for non-persisted updates
	action?: LayerAction; // For layer operations
}
```

### `HistoryAction` / `Command`

Represents an undoable/redoable action.

```typescript
interface Command {
	type: 'add' | 'modify' | 'delete' | 'batch-delete' | 'layer';
	objectId: string;
	userId: string;
	timestamp: number;
	objectData: Record<string, unknown>;
	beforeState?: Record<string, unknown>; // For modify: previous state
	afterState?: Record<string, unknown>; // For modify: new state
	batchObjects?: Array<{ id: string; data: Record<string, unknown> }>; // For batch-delete
	previousIndex?: number; // For layer: previous z-index
	newIndex?: number; // For layer: new z-index
}
```

### `CropState`

State tracking for image cropping operations.

```typescript
interface CropState {
	isActive: boolean;
	imageId: string | null;
	originalBounds: {
		left: number;
		top: number;
		width: number;
		height: number;
		scaleX: number;
		scaleY: number;
	} | null;
	cropBounds: {
		left: number;
		top: number;
		width: number;
		height: number;
	} | null;
}
```

---

## Constants

### Default Options

```typescript
const DEFAULT_TEXT_OPTIONS: TextOptions = {
	fontSize: 16,
	fontFamily: 'Arial',
	fontWeight: 'normal',
	colour: '#4A5568',
	textAlign: 'left',
	opacity: 1,
};

const DEFAULT_SHAPE_OPTIONS: ShapeOptions = {
	strokeWidth: 2,
	strokeColour: '#4A5568',
	fillColour: 'transparent',
	strokeDashArray: [],
	opacity: 1,
};

const DEFAULT_DRAW_OPTIONS: DrawOptions = {
	brushSize: 6,
	brushColour: '#4A5568',
	brushType: 'pencil',
	opacity: 1,
};

const DEFAULT_LINE_OPTIONS: LineOptions = {
	strokeWidth: 2,
	strokeColour: '#4A5568',
	strokeDashArray: [],
	opacity: 1,
};
```

### Zoom Configuration

```typescript
const ZOOM_LIMITS = {
	min: 0.1, // Minimum zoom level (10%)
	max: 10, // Maximum zoom level (1000%)
	step: 1.2, // Zoom step multiplier
} as const;
```

### Other Constants

```typescript
const IMAGE_THROTTLE_MS = 100; // Throttle interval for image updates
const MIN_TEXT_WIDTH = 50; // Minimum textbox width in pixels
```

---

## Context Interfaces

### `CanvasEventContext`

Context object passed to canvas event handlers. Contains getters/setters for reactive state and callbacks.

Key properties:

- Tool state getters/setters (selectedTool, isPanMode, isDrawing\*, etc.)
- Current options getters (text, shape, draw, line options)
- Callbacks (sendCanvasUpdate, sendImageUpdate, clearEraserState)
- Control point manager reference
- Floating menu reference for syncing UI state

### `CanvasActionContext`

Context object for canvas actions.

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

### `KeyboardShortcutContext`

Context object for keyboard shortcut handlers.

```typescript
interface KeyboardShortcutContext {
	canvas: fabric.Canvas;
	sendCanvasUpdate: (data: Record<string, unknown>) => void;
	controlPointManager?: ControlPointManager;
	history?: {
		recordAdd: (
			objectId: string,
			objectData: Record<string, unknown>,
			userId: string,
		) => void;
		recordDelete: (
			objectId: string,
			objectData: Record<string, unknown>,
			userId: string,
		) => void;
		canUndo: () => boolean;
		canRedo: () => boolean;
	};
	userId?: string;
	updateHistoryState?: () => void;
	mousePosition?: { x: number; y: number };
}
```

---

## Source Files

- **Types**: `src/lib/components/whiteboard/types.ts`
- **Constants**: `src/lib/components/whiteboard/constants.ts`
