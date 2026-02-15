import * as fabric from 'fabric'
import { io, type Socket } from 'socket.io-client'
import type { ControlPointManager } from './control-points'
import type { LayerAction } from './types'

/**
 * WebSocket message types
 */
interface WebSocketMessage {
	whiteboardId: number
	type?:
		| 'init'
		| 'load'
		| 'add'
		| 'modify'
		| 'update'
		| 'delete'
		| 'remove'
		| 'clear'
		| 'layer'
		| 'lock'
		| 'unlock'
	whiteboard?: { objects: SerializedObject[] }
	object?: SerializedObject
	objects?: SerializedObject[]
	live?: boolean
	action?: LayerAction
	isLocked?: boolean
}

/**
 * Serialized object data from WebSocket
 */
interface SerializedObject {
	id?: string
	type?: string
	left?: number
	top?: number
	scaleX?: number
	scaleY?: number
	angle?: number
	opacity?: number
	[key: string]: unknown
}

/**
 * WebSocket setup options
 */
interface WebSocketOptions {
	onLoadStart?: () => void
	onLoadEnd?: (objects: fabric.FabricObject[]) => void
	onRemoteActionStart?: () => void
	onRemoteActionEnd?: () => void
	controlPointManager?: ControlPointManager
	markRemoteModification?: (objectId: string) => void
}

// Track recently created object IDs to prevent echo
const recentlyCreatedObjects = new Set<string>()
const ECHO_PREVENTION_TIMEOUT = 1000 // 1 second

/**
 * Mark an object as recently created locally to prevent echo
 */
function markAsRecentlyCreated(objectId: string) {
	recentlyCreatedObjects.add(objectId)
	setTimeout(() => {
		recentlyCreatedObjects.delete(objectId)
	}, ECHO_PREVENTION_TIMEOUT)
}

/**
 * Creates a Socket.IO connection and sets up message handlers for whiteboard synchronization
 */
export function setupWebSocket(
	url: string,
	canvas: fabric.Canvas,
	whiteboardId: number,
	options?: WebSocketOptions,
): Socket {
	// Connect to Socket.IO server
	const socket = io({
		path: '/socket.io/',
		transports: ['websocket', 'polling'],
	})

	// Expose the markAsRecentlyCreated function on the socket for external use
	;(socket as any).markAsRecentlyCreated = markAsRecentlyCreated

	socket.on('connect', () => {
		// Initialize with whiteboardId
		socket.emit('init', { whiteboardId })
	})

	socket.on('connect_error', (error) => {
		console.error('Socket.IO connection error:', error)
	})

	socket.on('load', async (data: WebSocketMessage) => {
		if (data.whiteboardId !== whiteboardId) return

		options?.onLoadStart?.()
		await handleLoadMessage(
			canvas,
			data,
			options?.onLoadEnd,
			options?.controlPointManager,
		)
	})

	socket.on('add', async (data: WebSocketMessage) => {
		if (data.whiteboardId !== whiteboardId) return

		options?.onRemoteActionStart?.()
		await handleAddMessage(canvas, data, options?.controlPointManager)
		options?.onRemoteActionEnd?.()
	})

	socket.on('modify', (data: WebSocketMessage) => {
		if (data.whiteboardId !== whiteboardId) return

		options?.onRemoteActionStart?.()
		handleModifyMessage(canvas, data, options?.controlPointManager)
		options?.onRemoteActionEnd?.()
	})

	socket.on('delete', (data: WebSocketMessage) => {
		if (data.whiteboardId !== whiteboardId) return

		options?.onRemoteActionStart?.()
		handleDeleteMessage(canvas, data, options?.controlPointManager)
		options?.onRemoteActionEnd?.()
	})

	socket.on('clear', (data: WebSocketMessage) => {
		if (data.whiteboardId !== whiteboardId) return

		options?.onRemoteActionStart?.()
		canvas.clear()
		options?.onRemoteActionEnd?.()
	})

	socket.on('layer', (data: WebSocketMessage) => {
		if (data.whiteboardId !== whiteboardId) return

		handleLayerMessage(canvas, data)
	})

	socket.on('lock', (data: WebSocketMessage) => {
		if (data.whiteboardId !== whiteboardId) return
		// Lock events are handled by the page component
	})

	socket.on('unlock', (data: WebSocketMessage) => {
		if (data.whiteboardId !== whiteboardId) return
		// Unlock events are handled by the page component
	})

	socket.on('error', (data: { message: string }) => {
		console.error('Socket.IO server error:', data.message)
	})

	socket.on('disconnect', () => {
		// Connection closed
	})

	return socket
}

/**
 * Handles 'load' message - loads all objects into the canvas
 */
async function handleLoadMessage(
	canvas: fabric.Canvas,
	messageData: WebSocketMessage,
	onLoadEnd?: (objects: fabric.FabricObject[]) => void,
	controlPointManager?: ControlPointManager,
): Promise<void> {
	if (messageData.whiteboard && messageData.whiteboard.objects.length > 0) {
		const objects = await fabric.util.enlivenObjects(
			messageData.whiteboard.objects,
		)
		canvas.clear()

		const fabricObjects: fabric.FabricObject[] = []
		objects.forEach((obj: unknown) => {
			const fabricObj = obj as fabric.FabricObject & {
				id: string
				hasControls: boolean
				hasBorders: boolean
			}
			// Disable fabric.js default controls and borders for all objects
			// Custom control points will be shown on selection
			fabricObj.hasControls = false
			fabricObj.hasBorders = false
			// Ensure images use center origin
			if (fabricObj.type === 'image') {
				fabricObj.set({ originX: 'center', originY: 'center' })
			}
			canvas.add(fabricObj)
			fabricObjects.push(fabricObj)
			// DO NOT create control points automatically - they'll be created on user selection
		})

		canvas.renderAll()

		// Call the onLoadEnd callback if provided
		if (onLoadEnd) {
			onLoadEnd(fabricObjects)
		}
	}
}

/**
 * Handles 'add' message - adds a new object to the canvas
 */
async function handleAddMessage(
	canvas: fabric.Canvas,
	messageData: WebSocketMessage,
	controlPointManager?: ControlPointManager,
): Promise<void> {
	if (messageData.object) {
		// Check if this is an echo of an object we just created
		if (recentlyCreatedObjects.has(messageData.object.id!)) {
			return
		}

		const objects = await fabric.util.enlivenObjects([messageData.object])
		const obj = objects[0] as fabric.FabricObject & { id?: string }
		obj.id = messageData.object.id
		// Disable fabric.js default controls and borders for all objects
		// Custom control points will be shown on selection
		obj.set({ hasControls: false, hasBorders: false })
		// Ensure images use center origin
		if (obj.type === 'image') {
			obj.set({ originX: 'center', originY: 'center' })
		}
		canvas.add(obj)
		// DO NOT create control points automatically - they'll be created on user selection

		canvas.renderAll()
	}
}

/**
 * Handles 'modify' or 'update' message - updates an existing object
 */
function handleModifyMessage(
	canvas: fabric.Canvas,
	messageData: WebSocketMessage,
	controlPointManager?: ControlPointManager,
): void {
	if (!messageData.object) return

	const objects = canvas.getObjects()
	// @ts-expect-error - Custom id property
	const obj = objects.find((o) => o.id === messageData.object!.id)
	if (obj) {
		// Skip updating textbox if it's currently being edited by this user
		if (obj.type === 'textbox') {
			const textbox = obj as fabric.Textbox
			if (textbox.isEditing) {
				// Don't update text that's currently being edited to avoid cursor issues
				return
			}
		}

		// Check if this is a live update (not persisted to DB)
		const isLiveUpdate = messageData.live || false

		// Skip live updates for textboxes - only apply final updates
		if (isLiveUpdate && messageData.object.type === 'textbox') {
			return
		}

		// For live updates, use fast path - only update defined properties
		if (isLiveUpdate) {
			// Build update object with only defined properties to avoid setting undefined values
			const liveUpdate: Record<string, unknown> = {}
			const liveProps = [
				'left',
				'top',
				'scaleX',
				'scaleY',
				'angle',
				'opacity',
				'width',
				'height',
				'rx',
				'ry',
			] as const
			for (const prop of liveProps) {
				if (messageData.object[prop] !== undefined) {
					liveUpdate[prop] = messageData.object[prop]
				}
			}
			obj.set(liveUpdate as Partial<fabric.FabricObjectProps>)
			obj.setCoords()
			canvas.renderAll() // Immediate synchronous render
			return
		}

		// Full update path for non-live (persisted) updates
		if (obj.type === 'textbox' && 'text' in messageData.object) {
			const textbox = obj as fabric.Textbox

			// Use set() method with text property explicitly
			textbox.set({ text: messageData.object.text as string })

			// Then update other properties (excluding text, type, and id to avoid duplication/warnings)
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const {
				text: _text,
				type: _type,
				id: _id,
				...otherProps
			} = messageData.object
			if (Object.keys(otherProps).length > 0) {
				textbox.set(otherProps as Partial<fabric.FabricObjectProps>)
			}

			// Force complete re-initialization of the textbox
			textbox.initDimensions()
			textbox.setCoords()

			// Mark as dirty to force re-render
			textbox.dirty = true
		} else if (obj.type === 'image' && messageData.object.clipPath) {
			// For images with clipPath, handle clipPath separately to avoid setting plain object
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const {
				type: _type,
				id: _id,
				clipPath: serializedClipPath,
				src: _src,
				...updateProps
			} = messageData.object
			obj.set(updateProps as Partial<fabric.FabricObjectProps>)
			// Enliven the clipPath from serialized data to a proper fabric object
			if (serializedClipPath && typeof serializedClipPath === 'object') {
				fabric.util
					.enlivenObjects([serializedClipPath])
					.then((enlivenedObjects) => {
						if (enlivenedObjects.length > 0) {
							;(obj as fabric.FabricObject).clipPath =
								enlivenedObjects[0] as fabric.FabricObject
							obj.dirty = true
							obj.setCoords()
							canvas.renderAll()
						}
					})
					.catch(() => {
						// If clipPath enlivening fails, continue without it
					})
			}
		} else {
			// Full update for all other objects - exclude type and id properties
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { type: _type, id: _id, ...updateProps } = messageData.object
			obj.set(updateProps as Partial<fabric.FabricObjectProps>)
		}

		// Recalculate coordinates after update
		obj.setCoords()

		// For polylines with control point updates, completely replace the object
		// Only do this if specifically marked as a control point update
		if (
			obj.type === 'polyline' &&
			controlPointManager &&
			messageData.object.isControlPointUpdate
		) {
			// @ts-expect-error - Custom id property
			const objId = obj.id
			// DON'T create control points - they should only exist if user selected the line
			// Remove old control points only if they exist
			const existingPoints = controlPointManager
				.getLineHandler()
				.getControlPointsForObject(objId)
			if (existingPoints.length > 0) {
				controlPointManager.removeControlPoints(objId)
			}
			// Remove the old line
			canvas.remove(obj)
			// Create a new polyline with the clean data
			const newLine = new fabric.Polyline(messageData.object.points as any[], {
				id: objId,
				stroke: messageData.object.stroke as string,
				strokeWidth: messageData.object.strokeWidth as number,
				strokeDashArray: messageData.object.strokeDashArray as number[],
				opacity: messageData.object.opacity as number,
				selectable: true,
				hasControls: false,
				hasBorders: false,
			})
			canvas.add(newLine)
			// DON'T recreate control points - user must select the line to see them
			canvas.renderAll()
			return // Skip the normal update path
		}

		// For polylines and images being moved normally, ONLY update control points if they already exist
		if (
			(obj.type === 'polyline' || obj.type === 'image') &&
			controlPointManager
		) {
			// @ts-expect-error - Custom id property
			const objId = obj.id
			const existingPoints =
				obj.type === 'polyline'
					? controlPointManager
							.getLineHandler()
							.getControlPointsForObject(objId)
					: controlPointManager
							.getAllControlPoints()
							.filter((cp) => cp.objectId === objId)
			// Only update if control points already exist (user has selected this object)
			if (existingPoints.length > 0) {
				controlPointManager.updateControlPoints(objId, obj)
			}
		}

		// Immediate synchronous render
		canvas.renderAll()
	}
}

/**
 * Handles 'delete' or 'remove' message - removes objects from the canvas
 */
function handleDeleteMessage(
	canvas: fabric.Canvas,
	messageData: WebSocketMessage,
	controlPointManager?: ControlPointManager,
): void {
	const objects = canvas.getObjects()
	const objectsToRemove =
		messageData.objects || (messageData.object ? [messageData.object] : [])
	objectsToRemove.forEach((objData: SerializedObject) => {
		// @ts-expect-error - Custom id property
		const obj = objects.find((o) => o.id === objData.id)
		if (obj) {
			// Remove control points if this is a polyline
			if (obj.type === 'polyline' && controlPointManager) {
				// @ts-expect-error - Custom id property
				controlPointManager.removeControlPoints(obj.id)
			}
			canvas.remove(obj)
		}
	})
	canvas.renderAll()
}

/**
 * Handles 'layer' message - updates the z-index/layering of an object
 */
function handleLayerMessage(
	canvas: fabric.Canvas,
	messageData: WebSocketMessage,
): void {
	if (!messageData.object || !messageData.action) return

	const objects = canvas.getObjects()
	// @ts-expect-error - Custom id property
	const obj = objects.find((o) => o.id === messageData.object!.id)

	if (obj) {
		switch (messageData.action) {
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
		canvas.renderAll()
	}
}

/**
 * Closes the Socket.IO connection safely
 */
export function closeWebSocket(socket: Socket | undefined): void {
	if (socket) {
		socket.disconnect()
	}
}
