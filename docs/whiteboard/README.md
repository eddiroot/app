# Whiteboard Feature Documentation

## Overview

The whiteboard is a real-time collaborative canvas that allows users to draw, add shapes, text, images, and collaborate with others in real-time. It's built on top of [Fabric.js](http://fabricjs.com/) for canvas manipulation and uses Socket.IO for real-time synchronization between users.

## Key Features

- **Drawing Tools**: Freehand drawing with customizable brush types and colors
- **Shape Tools**: Rectangle, circle, triangle with fill and stroke options
- **Line Tool**: Create polylines with adjustable endpoints via control points
- **Text Tool**: Add and edit text with font customization
- **Image Upload**: Add images with crop functionality
- **Eraser Tool**: Remove objects by dragging over them
- **Real-time Collaboration**: Changes sync instantly across all connected users
- **Undo/Redo**: Per-user history tracking with full undo/redo support
- **Zoom & Pan**: Navigate the canvas with zoom controls and pan mode
- **Layering**: Control object z-order (bring to front, send to back, etc.)
- **Custom Control Points**: Interactive handles for reshaping objects

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Main Page Component                       │
│    (+page.svelte - orchestrates all whiteboard functionality)   │
└─────────────────────────────────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │  Canvas Logic   │    │   Real-time     │
│                 │    │                 │    │   Sync          │
│ - Toolbar       │    │ - Events        │    │                 │
│ - Controls      │    │ - Actions       │    │ - WebSocket     │
│ - Floating Menu │    │ - History       │    │ - Socket.IO     │
│ - Layering      │    │ - Control Points│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## File Structure

```
src/lib/components/whiteboard/
├── types.ts                 # TypeScript types and interfaces
├── constants.ts             # Default values and configuration
├── utils.ts                 # Utility functions
├── shapes.ts                # Shape factory functions
├── tools.ts                 # Tool state management
├── canvas-events.ts         # Canvas event handlers
├── canvas-actions.ts        # Canvas action functions
├── canvas-history.ts        # Undo/redo history system
├── control-points.ts        # Custom control point system
├── keyboard-shortcuts.ts    # Keyboard shortcut handlers
├── websocket-socketio.ts    # Real-time synchronization
├── whiteboard-toolbar.svelte        # Main toolbar component
├── whiteboard-controls.svelte       # Zoom and undo/redo controls
├── whiteboard-floating-menu.svelte  # Property editor panel
└── whiteboard-layering-controls.svelte  # Layer ordering controls
```

## Technology Stack

| Technology     | Purpose                                   |
| -------------- | ----------------------------------------- |
| **Fabric.js**  | Canvas manipulation and object management |
| **Socket.IO**  | Real-time WebSocket communication         |
| **Svelte 5**   | UI components with reactive state         |
| **TypeScript** | Type-safe code                            |
| **UUID**       | Unique object identification              |

## Quick Start for Developers

### Understanding the Data Flow

1. **User Interaction** → Canvas events (`canvas-events.ts`)
2. **Canvas Modification** → Actions (`canvas-actions.ts`)
3. **State Update** → History recording (`canvas-history.ts`)
4. **Sync** → WebSocket broadcast (`websocket-socketio.ts`)
5. **Remote Clients** → Canvas updated on other users' screens

### Key Concepts

- **Object IDs**: Every canvas object has a unique `id` property for identification
- **Control Points**: Custom draggable handles that replace Fabric.js default controls
- **Live Updates**: Movement updates are throttled and marked as "live" (not persisted until mouse up)
- **Echo Prevention**: Recently created objects are tracked to prevent duplicate additions

## Documentation Index

| Document                                      | Description                                  |
| --------------------------------------------- | -------------------------------------------- |
| [Types & Interfaces](./types.md)              | TypeScript types, interfaces, and constants  |
| [Tools & Interactions](./tools.md)            | Toolbar tools and user interactions          |
| [Canvas Events](./canvas-events.md)           | Event handling system                        |
| [Canvas Actions](./canvas-actions.md)         | Action functions (zoom, delete, clear, etc.) |
| [Control Points](./control-points.md)         | Custom control point system                  |
| [History System](./history.md)                | Undo/redo implementation                     |
| [Keyboard Shortcuts](./keyboard-shortcuts.md) | Keyboard commands                            |
| [WebSocket Sync](./websocket.md)              | Real-time collaboration                      |
| [Shapes](./shapes.md)                         | Shape factory functions                      |
| [UI Components](./ui-components.md)           | Svelte component documentation               |
| [Integration](./integration.md)               | Task block integration and database schema   |

## Related Files Outside Component Directory

- **Page Component**: `src/routes/subjects/[subjectOfferingId]/class/[subjectOfferingClassId]/tasks/[taskId]/whiteboard/[whiteboardId]/+page.svelte`
- **Database Schema**: `src/lib/server/db/schema/task.ts` (whiteboard table)
- **Service Layer**: `src/lib/server/db/service/task.ts` (whiteboard CRUD operations)
