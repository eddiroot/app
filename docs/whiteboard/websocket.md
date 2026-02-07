# Real-time Collaboration (WebSocket)

This document describes the real-time synchronization system that enables collaborative editing on the whiteboard.

## Overview

The whiteboard uses Socket.IO for real-time communication between clients and the server. All canvas operations are broadcast to other users in the same whiteboard room, enabling collaborative editing.

## Architecture

```
┌──────────────┐     Socket.IO      ┌──────────────┐
│   Client A   │◄──────────────────►│    Server    │
└──────────────┘                    └──────────────┘
                                           │
                                           │ Broadcast
                                           ▼
                                    ┌──────────────┐
                                    │   Client B   │
                                    └──────────────┘
```

## Message Types

### Outgoing (Client → Server)

| Event | Description |
|-------|-------------|
| `join` | Join a whiteboard room |
| `add` | Add a new object |
| `modify` | Modify an existing object |
| `delete` | Delete objects |
| `clear` | Clear all objects |
| `layer` | Change object z-index |

### Incoming (Server → Client)

| Event | Description |
|-------|-------------|
| `load` | Initial canvas state (all objects) |
| `add` | Object added by another user |
| `modify` | Object modified by another user |
| `delete` | Objects deleted by another user |
| `clear` | Canvas cleared by another user |
| `layer` | Object layer changed by another user |

---

## Socket Setup

### Initialization

```typescript
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

function initSocket(whiteboardId: number, userId: string) {
  socket = io('/whiteboard', {
    query: { whiteboardId, userId }
  })
  
  socket.on('connect', () => {
    console.log('Connected to whiteboard server')
    socket.emit('join', { whiteboardId })
  })
  
  socket.on('disconnect', () => {
    console.log('Disconnected from whiteboard server')
  })
  
  return socket
}
```

### Cleanup

```typescript
function cleanup() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
```

---

## Message Handlers

### setupSocketHandlers

Main function that attaches all incoming message handlers.

```typescript
function setupSocketHandlers(
  socket: Socket,
  canvas: fabric.Canvas,
  controlPointManager?: ControlPointManager
): void
```

### Load Handler

Receives initial canvas state when joining.

```typescript
socket.on('load', async (data: { objects: any[] }) => {
  // Track object IDs to prevent duplicates
  const existingIds = new Set(
    canvas.getObjects().map(obj => obj.id).filter(Boolean)
  )
  
  for (const objData of data.objects) {
    if (existingIds.has(objData.id)) continue
    
    const [fabricObj] = await fabric.util.enlivenObjects([objData])
    fabricObj.set({
      id: objData.id,
      hasControls: false,
      hasBorders: false
    })
    
    canvas.add(fabricObj)
  }
  
  canvas.requestRenderAll()
})
```

### Add Handler

Handles objects created by other users.

```typescript
socket.on('add', async (data: { object: any }) => {
  // Check for recent local creation (echo prevention)
  if (recentlyCreatedIds.has(data.object.id)) {
    return
  }
  
  // Check if object already exists
  const existing = canvas.getObjects().find(o => o.id === data.object.id)
  if (existing) return
  
  const [fabricObj] = await fabric.util.enlivenObjects([data.object])
  fabricObj.set({
    id: data.object.id,
    hasControls: false,
    hasBorders: false
  })
  
  canvas.add(fabricObj)
  controlPointManager?.bringAllControlPointsToFront()
  canvas.requestRenderAll()
})
```

### Modify Handler

Handles object updates from other users.

```typescript
socket.on('modify', (data: { object: any; live?: boolean }) => {
  const obj = canvas.getObjects().find(o => o.id === data.object.id)
  if (!obj) return
  
  // Skip control points
  if (controlPointManager?.isControlPoint(obj)) return
  
  // Apply changes
  obj.set(data.object)
  obj.setCoords()
  
  // Update control points if this object is selected
  if (canvas.getActiveObject()?.id === obj.id) {
    controlPointManager?.updateControlPoints(obj.id, obj)
  }
  
  canvas.requestRenderAll()
})
```

### Delete Handler

Handles object deletion by other users.

```typescript
socket.on('delete', (data: { objects: Array<{ id: string }> }) => {
  for (const { id } of data.objects) {
    const obj = canvas.getObjects().find(o => o.id === id)
    if (obj) {
      controlPointManager?.removeControlPoints(id)
      canvas.remove(obj)
    }
  }
  
  canvas.requestRenderAll()
})
```

### Clear Handler

Handles canvas clear by other users.

```typescript
socket.on('clear', () => {
  // Remove all control points first
  controlPointManager?.getAllControlPoints().forEach(cp => {
    canvas.remove(cp.circle)
  })
  
  // Clear canvas
  canvas.clear()
  canvas.requestRenderAll()
})
```

### Layer Handler

Handles z-index changes by other users.

```typescript
socket.on('layer', (data: { object: { id: string }; action: LayerAction }) => {
  const obj = canvas.getObjects().find(o => o.id === data.object.id)
  if (!obj) return
  
  switch (data.action) {
    case 'bringToFront':
      canvas.bringObjectToFront(obj)
      break
    case 'sendToBack':
      canvas.sendObjectToBack(obj)
      break
    case 'moveForward':
      canvas.bringObjectForward(obj)
      break
    case 'moveBackward':
      canvas.sendObjectBackwards(obj)
      break
  }
  
  controlPointManager?.bringAllControlPointsToFront()
  canvas.requestRenderAll()
})
```

---

## Sending Updates

### sendCanvasUpdate

Central function for emitting canvas changes.

```typescript
function sendCanvasUpdate(data: Record<string, unknown>) {
  if (!socket) return
  
  const eventType = data.type as string
  const payload = { ...data, whiteboardId }
  
  socket.emit(eventType, payload)
}
```

### Usage Examples

```typescript
// Adding an object
sendCanvasUpdate({
  type: 'add',
  object: { id: 'uuid-123', type: 'rect', left: 100, top: 100, ... }
})

// Modifying an object
sendCanvasUpdate({
  type: 'modify',
  object: { id: 'uuid-123', left: 200, top: 150 },
  live: true  // For real-time updates during drag
})

// Deleting objects
sendCanvasUpdate({
  type: 'delete',
  objects: [{ id: 'uuid-123' }, { id: 'uuid-456' }]
})

// Layer change
sendCanvasUpdate({
  type: 'layer',
  object: { id: 'uuid-123' },
  action: 'bringToFront'
})

// Clear canvas
sendCanvasUpdate({
  type: 'clear'
})
```

---

## Live Updates vs Persisted Updates

### Live Updates (`live: true`)

- Used during dragging/resizing
- NOT persisted to database
- Provides real-time visual feedback
- Throttled to prevent network spam

```typescript
// During object:moving event
sendCanvasUpdate({
  type: 'modify',
  object: { id: obj.id, left: obj.left, top: obj.top },
  live: true
})
```

### Persisted Updates (`live: false` or omitted)

- Used on mouse up / action complete
- Persisted to database
- Represents final state

```typescript
// On object:modified event
sendCanvasUpdate({
  type: 'modify',
  object: objectData,
  live: false
})
```

---

## Echo Prevention

Prevents processing your own broadcasts that echo back.

```typescript
const recentlyCreatedIds = new Set<string>()
const ECHO_TIMEOUT = 2000  // 2 seconds

function trackNewObject(id: string) {
  recentlyCreatedIds.add(id)
  setTimeout(() => {
    recentlyCreatedIds.delete(id)
  }, ECHO_TIMEOUT)
}

// When creating an object locally
const newId = uuidv4()
trackNewObject(newId)
sendCanvasUpdate({ type: 'add', object: { id: newId, ... } })

// In add handler
socket.on('add', (data) => {
  if (recentlyCreatedIds.has(data.object.id)) {
    return  // Skip echo
  }
  // Process add...
})
```

---

## Throttling

Network updates are throttled during continuous operations.

```typescript
const THROTTLE_MS = 100
let lastUpdateTime = 0

function throttledUpdate(data: Record<string, unknown>) {
  const now = Date.now()
  
  if (data.live && now - lastUpdateTime < THROTTLE_MS) {
    return  // Skip this update
  }
  
  lastUpdateTime = now
  sendCanvasUpdate(data)
}
```

---

## Connection States

### Handling Disconnection

```typescript
socket.on('disconnect', (reason) => {
  console.warn('Disconnected:', reason)
  
  if (reason === 'io server disconnect') {
    // Server disconnected, won't auto-reconnect
    socket.connect()
  }
  // Otherwise Socket.IO will auto-reconnect
})

socket.on('connect_error', (error) => {
  console.error('Connection error:', error)
})
```

### Reconnection

Socket.IO handles reconnection automatically with exponential backoff.

```typescript
socket = io('/whiteboard', {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
})
```

---

## Server-Side (Reference)

The server uses Socket.IO rooms for whiteboard isolation:

```typescript
io.of('/whiteboard').on('connection', (socket) => {
  const { whiteboardId } = socket.handshake.query
  
  socket.on('join', () => {
    socket.join(`whiteboard:${whiteboardId}`)
    // Send current state
    const objects = await getWhiteboardObjects(whiteboardId)
    socket.emit('load', { objects })
  })
  
  socket.on('add', (data) => {
    // Persist to database
    await saveObject(whiteboardId, data.object)
    // Broadcast to room (excluding sender)
    socket.to(`whiteboard:${whiteboardId}`).emit('add', data)
  })
  
  // Similar for modify, delete, clear, layer...
})
```

---

## Source Files

- **WebSocket Client**: `src/lib/components/whiteboard/websocket-socketio.ts`
- **Server WebSocket**: `src/lib/server/websocket.ts`