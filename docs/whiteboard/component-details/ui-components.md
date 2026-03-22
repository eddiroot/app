# UI Components

This document describes the Svelte components that provide the whiteboard's user interface.

## Component Overview

| Component                             | Purpose                           |
| ------------------------------------- | --------------------------------- |
| `whiteboard-toolbar.svelte`           | Main toolbar with tool selection  |
| `whiteboard-floating-menu.svelte`     | Context-sensitive property editor |
| `whiteboard-controls.svelte`          | Zoom and undo/redo controls       |
| `whiteboard-layering-controls.svelte` | Object z-index controls           |

---

## Toolbar Component

**File:** `whiteboard-toolbar.svelte`

The main toolbar provides tool selection and access to primary actions.

### Props

```typescript
interface Props {
	selectedTool: WhiteboardTool;
	onToolChange: (tool: WhiteboardTool) => void;
	onImageUpload: (file: File) => void;
	onClear: () => void;
	disabled?: boolean;
}
```

### Tool Buttons

| Tool             | Icon            | Tooltip       |
| ---------------- | --------------- | ------------- |
| Select           | `MousePointer2` | Select & Move |
| Pan              | `Hand`          | Pan Canvas    |
| Draw             | `Pen`           | Freehand Draw |
| Line             | `Minus`         | Draw Line     |
| Shapes (submenu) | `Square`        | Shapes        |
| Text             | `Type`          | Add Text      |
| Image            | `ImageIcon`     | Upload Image  |
| Eraser           | `Eraser`        | Eraser        |

### Shape Submenu

The shapes button opens a dropdown with shape options:

- Rectangle
- Circle
- Triangle

### Usage

```svelte
<WhiteboardToolbar
	{selectedTool}
	onToolChange={(tool) => (selectedTool = tool)}
	onImageUpload={handleImageUpload}
	onClear={handleClear}
/>
```

### Styling

Uses Shadcn UI components:

- `Toggle` for tool buttons
- `DropdownMenu` for shape submenu
- `Tooltip` for hover hints
- `Button` for action buttons

---

## Floating Menu Component

**File:** `whiteboard-floating-menu.svelte`

The floating menu provides context-sensitive property editing based on the selected tool or object.

### Props

```typescript
interface Props {
	visible: boolean;
	selectedTool: WhiteboardTool;
	selectedObject: fabric.Object | null;

	// Current options
	textOptions: TextOptions;
	shapeOptions: ShapeOptions;
	drawOptions: DrawOptions;
	lineOptions: LineOptions;

	// Callbacks
	onTextOptionsChange: (options: TextOptions) => void;
	onShapeOptionsChange: (options: ShapeOptions) => void;
	onDrawOptionsChange: (options: DrawOptions) => void;
	onLineOptionsChange: (options: LineOptions) => void;
	onCropStart?: () => void;
}
```

### Menu Sections by Tool

| Tool/Object     | Menu Contents                                                 |
| --------------- | ------------------------------------------------------------- |
| Draw            | Brush type, size, color, opacity                              |
| Line            | Stroke width, color, dash pattern, opacity                    |
| Shapes          | Fill color, stroke color, stroke width, dash pattern, opacity |
| Text            | Font size, family, weight, color, alignment, opacity          |
| Selected Image  | Crop button                                                   |
| Selected Object | Relevant properties for that object type                      |

### Color Picker

Uses a custom color picker with preset colors:

```svelte
<div class="color-grid">
	{#each presetColors as color}
		<button
			class="color-swatch"
			style="background-color: {color}"
			class:selected={currentColor === color}
			on:click={() => selectColor(color)}
		/>
	{/each}
</div>
<input type="color" bind:value={customColor} />
```

### Preset Colors

```typescript
const presetColors = [
	'#000000',
	'#FFFFFF',
	'#FF0000',
	'#00FF00',
	'#0000FF',
	'#FFFF00',
	'#FF00FF',
	'#00FFFF',
	'#FFA500',
	'#800080',
	'#008000',
	'#000080',
	'#808080',
	'#C0C0C0',
	'#4A5568',
];
```

### Opacity Slider

```svelte
<Slider
	value={[opacity * 100]}
	max={100}
	step={1}
	onValueChange={(v) => setOpacity(v[0] / 100)}
/>
```

### Positioning

The menu floats above the canvas, positioned to avoid obscuring the selection:

```typescript
const menuPosition = $derived.by(() => {
	if (!selectedObject) return { top: 60, left: 10 };

	// Position above the selected object
	const bounds = selectedObject.getBoundingRect();
	return { top: Math.max(10, bounds.top - 50), left: bounds.left };
});
```

---

## Controls Component

**File:** `whiteboard-controls.svelte`

Provides zoom controls and undo/redo buttons.

### Props

```typescript
interface Props {
	zoom: number;
	canUndo: boolean;
	canRedo: boolean;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onResetZoom: () => void;
	onRecenter: () => void;
	onUndo: () => void;
	onRedo: () => void;
}
```

### Layout

```
┌─────────────────────────────────────┐
│  [Undo] [Redo]  │  [-] 100% [+] [⌂] │
└─────────────────────────────────────┘
```

### Zoom Display

```svelte
<span class="zoom-level">
	{Math.round(zoom * 100)}%
</span>
```

### Button States

```svelte
<Button variant="ghost" size="icon" disabled={!canUndo} on:click={onUndo}>
	<Undo2 class="h-4 w-4" />
</Button>
```

---

## Layering Controls Component

**File:** `whiteboard-layering-controls.svelte`

Controls for changing object z-index (stacking order).

### Props

```typescript
interface Props {
	visible: boolean;
	onBringToFront: () => void;
	onMoveForward: () => void;
	onMoveBackward: () => void;
	onSendToBack: () => void;
}
```

### Buttons

| Button         | Icon           | Action                  |
| -------------- | -------------- | ----------------------- |
| Bring to Front | `ChevronsUp`   | Move to top of stack    |
| Move Forward   | `ChevronUp`    | Move up one level       |
| Move Backward  | `ChevronDown`  | Move down one level     |
| Send to Back   | `ChevronsDown` | Move to bottom of stack |

### Visibility

Only shown when an object is selected:

```svelte
{#if visible}
	<div class="layering-controls">
		<!-- buttons -->
	</div>
{/if}
```

---

## Component Composition

### In Page Component

```svelte
<script>
	import WhiteboardToolbar from '$lib/components/whiteboard/whiteboard-toolbar.svelte';
	import WhiteboardFloatingMenu from '$lib/components/whiteboard/whiteboard-floating-menu.svelte';
	import WhiteboardControls from '$lib/components/whiteboard/whiteboard-controls.svelte';
	import WhiteboardLayeringControls from '$lib/components/whiteboard/whiteboard-layering-controls.svelte';
</script>

<div class="whiteboard-container">
	<!-- Canvas -->
	<canvas bind:this={canvasElement}></canvas>

	<!-- Toolbar (fixed left) -->
	<WhiteboardToolbar
		{selectedTool}
		onToolChange={handleToolChange}
		onImageUpload={handleImageUpload}
		onClear={handleClear}
	/>

	<!-- Floating Menu (contextual) -->
	<WhiteboardFloatingMenu
		visible={showFloatingMenu}
		{selectedTool}
		{selectedObject}
		{textOptions}
		{shapeOptions}
		{drawOptions}
		{lineOptions}
		onTextOptionsChange={handleTextOptions}
		onShapeOptionsChange={handleShapeOptions}
		onDrawOptionsChange={handleDrawOptions}
		onLineOptionsChange={handleLineOptions}
		onCropStart={handleCropStart}
	/>

	<!-- Controls (fixed bottom) -->
	<WhiteboardControls
		zoom={currentZoom}
		{canUndo}
		{canRedo}
		onZoomIn={handleZoomIn}
		onZoomOut={handleZoomOut}
		onResetZoom={handleResetZoom}
		onRecenter={handleRecenter}
		onUndo={performUndo}
		onRedo={performRedo}
	/>

	<!-- Layering Controls (when object selected) -->
	<WhiteboardLayeringControls
		visible={!!selectedObject}
		onBringToFront={handleBringToFront}
		onMoveForward={handleMoveForward}
		onMoveBackward={handleMoveBackward}
		onSendToBack={handleSendToBack}
	/>
</div>
```

---

## Styling Patterns

### Fixed Positioning

```css
.toolbar {
	position: fixed;
	left: 1rem;
	top: 50%;
	transform: translateY(-50%);
	z-index: 100;
}

.controls {
	position: fixed;
	bottom: 1rem;
	left: 50%;
	transform: translateX(-50%);
	z-index: 100;
}
```

### Glass Effect

```css
.floating-panel {
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(8px);
	border-radius: 8px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### Dark Mode Support

```css
:global(.dark) .floating-panel {
	background: rgba(30, 30, 30, 0.95);
}
```

---

## Accessibility

### Keyboard Navigation

- All buttons are keyboard accessible
- Tool shortcuts shown in tooltips
- Focus indicators on all interactive elements

### Screen Reader Support

```svelte
<Button aria-label="Zoom in" title="Zoom in (Ctrl++)">
	<Plus class="h-4 w-4" />
</Button>
```

### Focus Management

```typescript
// Return focus to canvas after tool selection
function handleToolChange(tool: WhiteboardTool) {
	selectedTool = tool;
	canvasElement?.focus();
}
```

---

## Source Files

- **Toolbar**: `src/lib/components/whiteboard/whiteboard-toolbar.svelte`
- **Floating Menu**: `src/lib/components/whiteboard/whiteboard-floating-menu.svelte`
- **Controls**: `src/lib/components/whiteboard/whiteboard-controls.svelte`
- **Layering Controls**: `src/lib/components/whiteboard/whiteboard-layering-controls.svelte`
