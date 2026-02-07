# Keyboard Shortcuts

This document describes all keyboard shortcuts available in the whiteboard.

## Overview

Keyboard shortcuts are handled by the `setupKeyboardShortcuts` function, which attaches event listeners to the window for both `keydown` and `keyup` events.

## Shortcut Reference

### Tool Selection

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `H` | Pan/Hand tool |
| `P` | Draw/Pen tool |
| `L` | Line tool |
| `T` | Text tool |
| `E` | Eraser tool |

### Editing

| Shortcut | Action |
|----------|--------|
| `Delete` / `Backspace` | Delete selected objects |
| `Ctrl+C` / `Cmd+C` | Copy selected objects |
| `Ctrl+V` / `Cmd+V` | Paste from clipboard |
| `Ctrl+D` / `Cmd+D` | Duplicate selected objects |
| `Ctrl+A` / `Cmd+A` | Select all objects |

### History

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` | Redo |
| `Ctrl+Y` / `Cmd+Y` | Redo (alternative) |

### View

| Shortcut | Action |
|----------|--------|
| `Ctrl++` / `Cmd++` | Zoom in |
| `Ctrl+-` / `Cmd+-` | Zoom out |
| `Ctrl+0` / `Cmd+0` | Reset zoom to 100% |
| `Space` (hold) | Temporary pan mode |

---

## Implementation

### Setup Function

```typescript
function setupKeyboardShortcuts(
  canvas: fabric.Canvas,
  ctx: KeyboardShortcutContext
): () => void  // Returns cleanup function
```

### Context Interface

```typescript
interface KeyboardShortcutContext {
  canvas: fabric.Canvas
  sendCanvasUpdate: (data: Record<string, unknown>) => void
  controlPointManager?: ControlPointManager
  history?: {
    recordAdd: (...) => void
    recordDelete: (...) => void
    canUndo: () => boolean
    canRedo: () => boolean
  }
  userId?: string
  updateHistoryState?: () => void
  mousePosition?: { x: number; y: number }
  
  // Tool switching
  setSelectedTool?: (tool: WhiteboardTool) => void
  getSelectedTool?: () => WhiteboardTool
  
  // Clipboard
  clipboard?: Record<string, unknown>[]
  setClipboard?: (data: Record<string, unknown>[]) => void
  
  // Callbacks
  onUndo?: () => void
  onRedo?: () => void
}
```

---

## Tool Shortcuts

### Implementation Pattern

```typescript
function handleKeyDown(e: KeyboardEvent) {
  // Skip if typing in input/textarea
  if (isTextInputFocused()) return
  
  // Skip if modifier keys pressed (except for shortcuts)
  if (e.ctrlKey || e.metaKey || e.altKey) return
  
  switch (e.key.toLowerCase()) {
    case 'v':
      ctx.setSelectedTool?.('select')
      break
    case 'h':
      ctx.setSelectedTool?.('pan')
      break
    case 'p':
      ctx.setSelectedTool?.('draw')
      break
    case 'l':
      ctx.setSelectedTool?.('line')
      break
    case 't':
      ctx.setSelectedTool?.('text')
      break
    case 'e':
      ctx.setSelectedTool?.('eraser')
      break
  }
}
```

---

## Delete Shortcut

Deletes all selected objects.

```typescript
case 'Delete':
case 'Backspace':
  e.preventDefault()
  const deleted = deleteSelectedObjects({
    canvas,
    sendCanvasUpdate: ctx.sendCanvasUpdate,
    controlPointManager: ctx.controlPointManager
  })
  
  if (deleted.length > 0) {
    if (deleted.length === 1) {
      ctx.history?.recordDelete(deleted[0].id, deleted[0].data, ctx.userId)
    } else {
      ctx.history?.recordBatchDelete(deleted, ctx.userId)
    }
    ctx.updateHistoryState?.()
  }
  break
```

---

## Clipboard Operations

### Copy

```typescript
case 'c':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    const selection = canvas.getActiveObjects()
    const clipboardData = selection
      .filter(obj => !ctx.controlPointManager?.isControlPoint(obj))
      .map(obj => {
        const data = obj.toObject()
        data.id = obj.id
        return data
      })
    ctx.setClipboard?.(clipboardData)
  }
  break
```

### Paste

```typescript
case 'v':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    const clipboard = ctx.clipboard || []
    if (clipboard.length === 0) return
    
    const pastedObjects: fabric.Object[] = []
    
    for (const objData of clipboard) {
      const newId = uuidv4()
      
      // Offset pasted objects slightly
      const offset = 20
      objData.left = (objData.left || 0) + offset
      objData.top = (objData.top || 0) + offset
      
      const newObj = await fabric.util.enlivenObjects([objData])
      newObj[0].set({
        id: newId,
        hasControls: false,
        hasBorders: false
      })
      
      canvas.add(newObj[0])
      pastedObjects.push(newObj[0])
      
      // Send to server
      const sendData = newObj[0].toObject()
      sendData.id = newId
      ctx.sendCanvasUpdate({ type: 'add', object: sendData })
      
      // Record history
      ctx.history?.recordAdd(newId, sendData, ctx.userId)
    }
    
    // Select pasted objects
    if (pastedObjects.length === 1) {
      canvas.setActiveObject(pastedObjects[0])
    } else if (pastedObjects.length > 1) {
      const selection = new fabric.ActiveSelection(pastedObjects, { canvas })
      canvas.setActiveObject(selection)
    }
    
    ctx.updateHistoryState?.()
  }
  break
```

### Duplicate

```typescript
case 'd':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    // Copy then paste in one operation
    // Similar to copy + paste but with smaller offset
  }
  break
```

---

## Select All

```typescript
case 'a':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    
    const selectableObjects = canvas.getObjects().filter(obj => 
      !ctx.controlPointManager?.isControlPoint(obj) &&
      obj.selectable !== false
    )
    
    if (selectableObjects.length > 0) {
      canvas.discardActiveObject()
      const selection = new fabric.ActiveSelection(selectableObjects, { canvas })
      canvas.setActiveObject(selection)
      canvas.requestRenderAll()
    }
  }
  break
```

---

## Undo/Redo

```typescript
case 'z':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    if (e.shiftKey) {
      // Redo
      ctx.onRedo?.()
    } else {
      // Undo
      ctx.onUndo?.()
    }
  }
  break

case 'y':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    ctx.onRedo?.()
  }
  break
```

---

## Zoom Shortcuts

```typescript
case '+':
case '=':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    zoomIn({ canvas, sendCanvasUpdate: () => {} })
    ctx.controlPointManager?.updateAllControlPointSizes()
  }
  break

case '-':
case '_':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    zoomOut({ canvas, sendCanvasUpdate: () => {} })
    ctx.controlPointManager?.updateAllControlPointSizes()
  }
  break

case '0':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    resetZoom({ canvas, sendCanvasUpdate: () => {} })
    ctx.controlPointManager?.updateAllControlPointSizes()
  }
  break
```

---

## Space Bar Pan Mode

Holding Space temporarily switches to pan mode.

```typescript
let previousTool: WhiteboardTool | null = null

function handleKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space' && !e.repeat) {
    e.preventDefault()
    previousTool = ctx.getSelectedTool?.() || 'select'
    ctx.setSelectedTool?.('pan')
  }
}

function handleKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') {
    e.preventDefault()
    if (previousTool) {
      ctx.setSelectedTool?.(previousTool)
      previousTool = null
    }
  }
}
```

---

## Text Input Detection

Shortcuts are disabled when typing in text fields:

```typescript
function isTextInputFocused(): boolean {
  const active = document.activeElement
  if (!active) return false
  
  const tagName = active.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea') return true
  
  // Check for contenteditable
  if (active.getAttribute('contenteditable') === 'true') return true
  
  // Check if editing text in Fabric.js
  const editingText = canvas.getActiveObject()
  if (editingText && editingText.type === 'textbox' && editingText.isEditing) {
    return true
  }
  
  return false
}
```

---

## Cleanup

The setup function returns a cleanup function to remove event listeners:

```typescript
function setupKeyboardShortcuts(canvas, ctx) {
  const handleKeyDown = (e: KeyboardEvent) => { ... }
  const handleKeyUp = (e: KeyboardEvent) => { ... }
  
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  }
}

// Usage in component
onMount(() => {
  const cleanup = setupKeyboardShortcuts(canvas, ctx)
  return cleanup  // Called on unmount
})
```

---

## Source Files

- **Keyboard Shortcuts**: `src/lib/components/whiteboard/keyboard-shortcuts.ts`