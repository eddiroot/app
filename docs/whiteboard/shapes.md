# Shape Factory Functions

This document describes the shape creation utilities used for programmatically creating Fabric.js objects.

## Overview

The `shapes.ts` module provides factory functions for creating canvas objects with consistent default properties. These functions are used when:

- Drawing shapes interactively
- Pasting objects from clipboard
- Undoing deletions (recreating objects)
- Loading from database

## Factory Functions

### createRectangle

Creates a rectangle with configurable properties.

```typescript
function createRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  options?: Partial<ShapeOptions>
): fabric.Rect
```

**Parameters:**
- `x, y`: Top-left corner position
- `width, height`: Dimensions
- `options`: Optional style overrides

**Returns:** `fabric.Rect` instance

**Example:**
```typescript
const rect = createRectangle(100, 100, 200, 150, {
  fillColour: '#3498db',
  strokeColour: '#2980b9',
  strokeWidth: 3,
  opacity: 0.8
})
rect.id = uuidv4()
canvas.add(rect)
```

### createCircle

Creates an ellipse (or circle if equal radii).

```typescript
function createCircle(
  x: number,
  y: number,
  rx: number,
  ry: number,
  options?: Partial<ShapeOptions>
): fabric.Ellipse
```

**Parameters:**
- `x, y`: Center position
- `rx, ry`: Horizontal and vertical radii

**Example:**
```typescript
// Circle (equal radii)
const circle = createCircle(200, 200, 50, 50)

// Ellipse
const ellipse = createCircle(200, 200, 80, 40)
```

### createTriangle

Creates an equilateral triangle.

```typescript
function createTriangle(
  x: number,
  y: number,
  width: number,
  height: number,
  options?: Partial<ShapeOptions>
): fabric.Triangle
```

### createLine

Creates a polyline (2-point line).

```typescript
function createLine(
  points: Array<{ x: number; y: number }>,
  options?: Partial<LineOptions>
): fabric.Polyline
```

**Example:**
```typescript
const line = createLine(
  [{ x: 100, y: 100 }, { x: 300, y: 200 }],
  {
    strokeWidth: 3,
    strokeColour: '#e74c3c',
    strokeDashArray: [10, 5]
  }
)
```

### createTextbox

Creates an editable textbox.

```typescript
function createTextbox(
  text: string,
  x: number,
  y: number,
  options?: Partial<TextOptions>
): fabric.Textbox
```

**Example:**
```typescript
const textbox = createTextbox('Hello World', 100, 100, {
  fontSize: 24,
  fontFamily: 'Arial',
  colour: '#333',
  textAlign: 'center'
})
```

### createPath

Creates a path from SVG path data (for freehand drawings).

```typescript
function createPath(
  pathData: string,
  options?: {
    stroke?: string
    strokeWidth?: number
    fill?: string
    opacity?: number
  }
): fabric.Path
```

---

## Common Properties

All factory functions apply these base properties:

```typescript
const baseProperties = {
  originX: 'center',
  originY: 'center',
  hasControls: false,  // Custom control points used
  hasBorders: false,   // No default selection border
  lockScalingFlip: true
}
```

---

## Shape Options

### ShapeOptions Interface

```typescript
interface ShapeOptions {
  strokeWidth: number
  strokeColour: string
  fillColour: string
  strokeDashArray: number[]
  opacity: number
}
```

### Default Values

```typescript
const DEFAULT_SHAPE_OPTIONS: ShapeOptions = {
  strokeWidth: 2,
  strokeColour: '#4A5568',
  fillColour: 'transparent',
  strokeDashArray: [],
  opacity: 1
}
```

### Dash Patterns

| Pattern | Description |
|---------|-------------|
| `[]` | Solid line |
| `[5, 5]` | Even dashes |
| `[10, 5]` | Long dashes |
| `[2, 2]` | Dotted |
| `[10, 5, 2, 5]` | Dash-dot |

---

## Line Options

### LineOptions Interface

```typescript
interface LineOptions {
  strokeWidth: number
  strokeColour: string
  strokeDashArray: number[]
  opacity: number
}
```

### Polyline Structure

Lines are created as `fabric.Polyline` for future extensibility (adding points):

```typescript
const line = new fabric.Polyline(
  [
    { x: startX, y: startY },
    { x: endX, y: endY }
  ],
  {
    fill: 'transparent',
    stroke: options.strokeColour,
    strokeWidth: options.strokeWidth,
    strokeDashArray: options.strokeDashArray,
    opacity: options.opacity,
    originX: 'center',
    originY: 'center',
    hasControls: false,
    hasBorders: false
  }
)
```

---

## Text Options

### TextOptions Interface

```typescript
interface TextOptions {
  fontSize: number
  fontFamily: string
  fontWeight: string
  colour: string
  textAlign: string
  opacity: number
}
```

### Default Values

```typescript
const DEFAULT_TEXT_OPTIONS: TextOptions = {
  fontSize: 16,
  fontFamily: 'Arial',
  fontWeight: 'normal',
  colour: '#4A5568',
  textAlign: 'left',
  opacity: 1
}
```

### Available Font Families

```typescript
const FONT_FAMILIES = [
  'Arial',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Comic Sans MS'
]
```

---

## Object Serialization

### toObject with ID

When serializing objects, always include the custom `id`:

```typescript
const data = obj.toObject()
data.id = obj.id
```

### Fabric.js toObject Properties

```typescript
// Include custom properties in serialization
fabric.Object.prototype.toObject = (function (toObject) {
  return function (propertiesToInclude = []) {
    return toObject.call(this, [...propertiesToInclude, 'id'])
  }
})(fabric.Object.prototype.toObject)
```

---

## Recreating Objects

### From Serialized Data

```typescript
async function recreateObject(data: Record<string, unknown>): Promise<fabric.Object> {
  const [fabricObj] = await fabric.util.enlivenObjects([data])
  
  fabricObj.set({
    id: data.id,
    hasControls: false,
    hasBorders: false
  })
  
  return fabricObj
}
```

### Batch Recreation

```typescript
async function recreateObjects(objects: Record<string, unknown>[]): Promise<fabric.Object[]> {
  const results: fabric.Object[] = []
  
  for (const objData of objects) {
    const fabricObj = await recreateObject(objData)
    results.push(fabricObj)
  }
  
  return results
}
```

---

## Usage in Interactive Drawing

### Shape Drawing Flow

```typescript
// Mouse down - create temp shape
function onMouseDown(e) {
  const pointer = canvas.getPointer(e.e)
  tempShape = createRectangle(pointer.x, pointer.y, 0, 0, currentOptions)
  canvas.add(tempShape)
}

// Mouse move - update size
function onMouseMove(e) {
  const pointer = canvas.getPointer(e.e)
  const width = pointer.x - startX
  const height = pointer.y - startY
  
  tempShape.set({
    width: Math.abs(width),
    height: Math.abs(height),
    left: width > 0 ? startX : pointer.x,
    top: height > 0 ? startY : pointer.y
  })
  tempShape.setCoords()
  canvas.renderAll()
}

// Mouse up - finalize
function onMouseUp() {
  const shapeId = uuidv4()
  tempShape.set({ id: shapeId })
  
  const shapeData = tempShape.toObject()
  shapeData.id = shapeId
  
  sendCanvasUpdate({ type: 'add', object: shapeData })
  history.recordAdd(shapeId, shapeData, userId)
  
  tempShape = null
}
```

---

## Source Files

- **Shape Factories**: `src/lib/components/whiteboard/shapes.ts`
- **Types**: `src/lib/components/whiteboard/types.ts`
- **Constants**: `src/lib/components/whiteboard/constants.ts`