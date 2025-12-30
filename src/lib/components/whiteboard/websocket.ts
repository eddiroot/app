import * as fabric from 'fabric'
import type { ControlPointManager } from './control-points'
import type { LayerAction } from './types'

/**
 * WebSocket message types
 */
interface WebSocketMessage {
	whiteboardId: number
	type: 'init' | 'load' | 'add' | 'modify' | 'update' | 'delete' | 'remove' | 'clear' | 'layer'
	whiteboard?: {
		objects: SerializedObject[]
	}
	object?: SerializedObject
	objects?: SerializedObject[]
	live?: boolean
	action?: LayerAction
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
}

/**
 * Creates a WebSocket connection and sets up message handlers for whiteboard synchronization
 */
export function setupWebSocket(
	url: string,
	canvas: fabric.Canvas,
	whiteboardId: number,
	options?: WebSocketOptions
): WebSocket {
	const socket = new WebSocket(url)

	socket.addEventListener('open', () => {
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(
				JSON.stringify({
					type: 'init',
					whiteboardId
				})
			)
		}
	})

	socket.addEventListener('message', async (event) => {
		try {
			const messageData = JSON.parse(event.data) as WebSocketMessage
			if (messageData.whiteboardId !== whiteboardId) return

			if (messageData.type === 'load') {
				options?.onLoadStart?.()
				await handleLoadMessage(
					canvas,
					messageData,
					options?.onLoadEnd,
					options?.controlPointManager
				)
			} else if (messageData.type === 'add') {
				// Prevent history recording for remote actions
				options?.onRemoteActionStart?.()
				await handleAddMessage(canvas, messageData, options?.controlPointManager)
				options?.onRemoteActionEnd?.()
			} else if (messageData.type === 'modify' || messageData.type === 'update') {
				// Prevent history recording for remote actions
				options?.onRemoteActionStart?.()
				handleModifyMessage(canvas, messageData, options?.controlPointManager)
				options?.onRemoteActionEnd?.()
			} else if (messageData.type === 'delete' || messageData.type === 'remove') {
				// Prevent history recording for remote actions
				options?.onRemoteActionStart?.()
				handleDeleteMessage(canvas, messageData, options?.controlPointManager)
				options?.onRemoteActionEnd?.()
			} else if (messageData.type === 'layer') {
				handleLayerMessage(canvas, messageData)
			} else if (messageData.type === 'clear') {
				options?.onRemoteActionStart?.()
				canvas.clear()
				options?.onRemoteActionEnd?.()
			}
		} catch (e) {
			console.error('Error parsing JSON:', e)
		}
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
	controlPointManager?: ControlPointManager
): Promise<void> {
	if (messageData.whiteboard && messageData.whiteboard.objects.length > 0) {
		const objects = await fabric.util.enlivenObjects(messageData.whiteboard.objects)
		canvas.clear()

		const fabricObjects: fabric.FabricObject[] = []
		objects.forEach((obj: unknown) => {
			const fabricObj = obj as fabric.FabricObject & {
				id: string
				hasControls: boolean
				hasBorders: boolean
			}
			fabricObj.hasControls = false // Disable controls on load
			// For polylines, rectangles, ellipses, and triangles, also disable borders since we use custom control points
			if (
				fabricObj.type === 'polyline' ||
				fabricObj.type === 'rect' ||
				fabricObj.type === 'ellipse' ||
				fabricObj.type === 'triangle'
			) {
				fabricObj.hasBorders = false
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
	controlPointManager?: ControlPointManager
): Promise<void> {
	if (messageData.object) {
		const objects = await fabric.util.enlivenObjects([messageData.object])
		const obj = objects[0] as fabric.FabricObject & { id?: string }
		obj.id = messageData.object.id
		// For polylines, disable fabric.js controls since we use custom control points
		if (obj.type === 'polyline') {
			obj.set({
				hasControls: false,
				hasBorders: false
			})
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
	controlPointManager?: ControlPointManager
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

		// Skip live updates for textboxes - only apply final updates
		const isLiveUpdate = messageData.live || false
		if (isLiveUpdate && messageData.object.type === 'textbox') {
			return
		}

		// For live image updates, only update the essential properties to reduce lag
		if (isLiveUpdate && messageData.object.type === 'image') {
			// Only update positioning and transformation properties for live image updates
			obj.set({
				left: messageData.object.left,
				top: messageData.object.top,
				scaleX: messageData.object.scaleX,
				scaleY: messageData.object.scaleY,
				angle: messageData.object.angle,
				opacity: messageData.object.opacity
			})
		} else {
			// For textboxes, handle text property specially
			if (obj.type === 'textbox' && 'text' in messageData.object) {
				const textbox = obj as fabric.Textbox

				// Use set() method with text property explicitly
				textbox.set({
					text: messageData.object.text as string
				})

				// Then update other properties (excluding text and type to avoid duplication)
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { text: _text, type: _type, ...otherProps } = messageData.object
				if (Object.keys(otherProps).length > 0) {
					textbox.set(otherProps as Partial<fabric.FabricObjectProps>)
				}

				// Force complete re-initialization of the textbox
				textbox.initDimensions()
				textbox.setCoords()

				// Mark as dirty to force re-render
				textbox.dirty = true
			} else {
				// Full update for all other objects
				obj.set(messageData.object as Partial<fabric.FabricObjectProps>)
			}
		}

		// Recalculate coordinates after update
		obj.setCoords()

		// For polylines with control point updates, completely replace the object
		// Only do this if specifically marked as a control point update
		if (obj.type === 'polyline' && controlPointManager && messageData.object.isControlPointUpdate) {
			// @ts-expect-error - Custom id property
			const objId = obj.id
			// DON'T create control points - they should only exist if user selected the line
			// Remove old control points only if they exist
			const existingPoints = controlPointManager.getLineHandler().getControlPointsForObject(objId)
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
				hasBorders: false
			})
			canvas.add(newLine)
			// DON'T recreate control points - user must select the line to see them
			canvas.renderAll()
			return // Skip the normal update path
		}

		// For polylines being moved normally, ONLY update control points if they already exist
		if (obj.type === 'polyline' && controlPointManager) {
			// @ts-expect-error - Custom id property
			const objId = obj.id
			const existingPoints = controlPointManager.getLineHandler().getControlPointsForObject(objId)
			// Only update if control points already exist (user has selected this line)
			if (existingPoints.length > 0) {
				controlPointManager.updateControlPoints(objId, obj)
			}
		}

		// Force immediate render
		canvas.requestRenderAll()
	}
}

/**
 * Handles 'delete' or 'remove' message - removes objects from the canvas
 */
function handleDeleteMessage(
	canvas: fabric.Canvas,
	messageData: WebSocketMessage,
	controlPointManager?: ControlPointManager
): void {
	const objects = canvas.getObjects()
	const objectsToRemove = messageData.objects || (messageData.object ? [messageData.object] : [])
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
function handleLayerMessage(canvas: fabric.Canvas, messageData: WebSocketMessage): void {
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
 * Closes the WebSocket connection safely
 */
export function closeWebSocket(socket: WebSocket | undefined): void {
	if (socket) {
		socket.close()
	}
}
