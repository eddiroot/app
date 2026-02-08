import * as fabric from 'fabric'
import { v4 as uuidv4 } from 'uuid'
import type { ControlPointManager } from './control-points'

/**
 * Clipboard state for copy/paste operations
 */
let clipboard: Array<Record<string, unknown>> = []

/**
 * Context for keyboard shortcut handlers
 */
export interface KeyboardShortcutContext {
	canvas: fabric.Canvas
	sendCanvasUpdate: (data: Record<string, unknown>) => void
	controlPointManager?: ControlPointManager
	history?: {
		recordAdd: (
			objectId: string,
			objectData: Record<string, unknown>,
			userId: string,
		) => void
		recordDelete: (
			objectId: string,
			objectData: Record<string, unknown>,
			userId: string,
		) => void
		canUndo: () => boolean
		canRedo: () => boolean
	}
	userId?: string
	updateHistoryState?: () => void
	mousePosition?: { x: number; y: number } // Current mouse position for paste
}

/**
 * Copies the currently selected object(s) to the internal clipboard
 */
export function copySelected(ctx: KeyboardShortcutContext): boolean {
	const activeObjects = ctx.canvas.getActiveObjects()
	if (activeObjects.length === 0) return false

	clipboard = []

	activeObjects.forEach((obj) => {
		// Skip control points
		if (ctx.controlPointManager?.isControlPoint(obj)) return

		const objData =
			obj.type === 'textbox' ? obj.toObject(['text']) : obj.toObject()
		// @ts-expect-error - Custom id property
		objData.id = obj.id
		clipboard.push(objData)
	})

	return clipboard.length > 0
}

/**
 * Pastes objects from the internal clipboard onto the canvas
 * Objects are centered under the mouse cursor position
 */
export async function pasteFromClipboard(
	ctx: KeyboardShortcutContext,
): Promise<boolean> {
	if (clipboard.length === 0) return false

	const pastedObjects: fabric.Object[] = []
	const { util } = await import('fabric')

	// Deselect current selection
	ctx.canvas.discardActiveObject()

	// Calculate the bounding box center of all clipboard objects
	let minX = Infinity,
		minY = Infinity,
		maxX = -Infinity,
		maxY = -Infinity
	clipboard.forEach((objData) => {
		const left = typeof objData.left === 'number' ? objData.left : 0
		const top = typeof objData.top === 'number' ? objData.top : 0
		const width = typeof objData.width === 'number' ? objData.width : 0
		const height = typeof objData.height === 'number' ? objData.height : 0
		const scaleX = typeof objData.scaleX === 'number' ? objData.scaleX : 1
		const scaleY = typeof objData.scaleY === 'number' ? objData.scaleY : 1
		minX = Math.min(minX, left)
		minY = Math.min(minY, top)
		maxX = Math.max(maxX, left + width * scaleX)
		maxY = Math.max(maxY, top + height * scaleY)
	})

	const clipboardCenterX = (minX + maxX) / 2
	const clipboardCenterY = (minY + maxY) / 2

	// Determine target position - use mouse position if available, otherwise center of canvas
	let targetX: number, targetY: number
	if (ctx.mousePosition) {
		// Convert mouse position to canvas coordinates (accounting for zoom and pan)
		const pointer = ctx.canvas.getPointer({
			clientX: ctx.mousePosition.x,
			clientY: ctx.mousePosition.y,
		} as MouseEvent)
		targetX = pointer.x
		targetY = pointer.y
	} else {
		// Fall back to center of canvas viewport
		const vpt = ctx.canvas.viewportTransform || [1, 0, 0, 1, 0, 0]
		const zoom = ctx.canvas.getZoom()
		targetX = (ctx.canvas.width! / 2 - vpt[4]) / zoom
		targetY = (ctx.canvas.height! / 2 - vpt[5]) / zoom
	}

	// Calculate offset to move objects so their center is at target position
	const offsetX = targetX - clipboardCenterX
	const offsetY = targetY - clipboardCenterY

	for (const objData of clipboard) {
		// Clone the object data and assign a new ID
		const newObjData = { ...objData }
		const newId = uuidv4()
		newObjData.id = newId

		// Apply offset to position objects centered on target
		if (typeof newObjData.left === 'number') newObjData.left += offsetX
		if (typeof newObjData.top === 'number') newObjData.top += offsetY

		// Recreate the object
		const objects = await util.enlivenObjects([newObjData])
		if (objects && objects.length > 0) {
			const obj = objects[0] as fabric.Object
			// @ts-expect-error - Custom id property
			obj.id = newId

			// Disable default fabric.js controls and borders - we use custom control points
			obj.set({ hasControls: false, hasBorders: false })

			// Ensure images use center origin
			if (obj.type === 'image') {
				obj.set({ originX: 'center', originY: 'center' })
			}

			ctx.canvas.add(obj)
			pastedObjects.push(obj)

			// Send update to other users
			const sendData =
				obj.type === 'textbox' ? obj.toObject(['text']) : obj.toObject()
			// @ts-expect-error - Custom id property
			sendData.id = obj.id
			ctx.sendCanvasUpdate({ type: 'add', object: sendData })

			// Record history for the paste operation
			if (ctx.history && ctx.userId) {
				ctx.history.recordAdd(newId, sendData, ctx.userId)
			}
		}
	}

	// Select all pasted objects
	if (pastedObjects.length > 0) {
		if (pastedObjects.length === 1) {
			ctx.canvas.setActiveObject(pastedObjects[0])
		} else {
			const selection = new fabric.ActiveSelection(pastedObjects, {
				canvas: ctx.canvas,
			})
			ctx.canvas.setActiveObject(selection)
		}
		ctx.canvas.renderAll()
	}

	ctx.updateHistoryState?.()
	return true
}

/**
 * Cuts the currently selected object(s) (copy + delete)
 */
export async function cutSelected(
	ctx: KeyboardShortcutContext,
): Promise<boolean> {
	const copied = copySelected(ctx)
	if (!copied) return false

	const activeObjects = ctx.canvas.getActiveObjects()
	if (activeObjects.length === 0) return false

	// Delete the selected objects
	const objectsData: Array<{ id: string }> = []
	activeObjects.forEach((obj) => {
		// Skip control points
		if (ctx.controlPointManager?.isControlPoint(obj)) return

		// @ts-expect-error - Custom id property
		const objectId = obj.id
		if (objectId) {
			// Remove control points if applicable
			ctx.controlPointManager?.removeControlPoints(objectId)

			// Record deletion in history
			if (ctx.history && ctx.userId) {
				const objData =
					obj.type === 'textbox' ? obj.toObject(['text']) : obj.toObject()
				objData.id = objectId
				ctx.history.recordDelete(objectId, objData, ctx.userId)
			}

			objectsData.push({ id: objectId })
			ctx.canvas.remove(obj)
		}
	})

	ctx.canvas.discardActiveObject()
	ctx.canvas.renderAll()

	if (objectsData.length > 0) {
		ctx.sendCanvasUpdate({ type: 'delete', objects: objectsData })
	}

	ctx.updateHistoryState?.()
	return true
}

/**
 * Duplicates the currently selected object(s) in place with offset
 */
export async function duplicateSelected(
	ctx: KeyboardShortcutContext,
): Promise<boolean> {
	const copied = copySelected(ctx)
	if (!copied) return false

	return await pasteFromClipboard(ctx)
}

/**
 * Selects all objects on the canvas (excluding control points)
 * Shows control points for the selected objects
 */
export function selectAll(ctx: KeyboardShortcutContext): boolean {
	const objects = ctx.canvas.getObjects().filter((obj) => {
		// Skip control points
		if (ctx.controlPointManager?.isControlPoint(obj)) return false
		// Skip objects that aren't selectable
		if (!obj.selectable) return false
		// Skip edge lines (marked with excludeFromExport)
		if ((obj as unknown as { excludeFromExport?: boolean }).excludeFromExport)
			return false
		return true
	})

	if (objects.length === 0) return false

	// First, remove any existing control points
	if (ctx.controlPointManager) {
		const allControlPoints = ctx.controlPointManager.getAllControlPoints()
		const objectIds = new Set(allControlPoints.map((cp) => cp.objectId))
		objectIds.forEach((objectId) => {
			ctx.controlPointManager?.removeControlPoints(objectId)
		})
	}

	ctx.canvas.discardActiveObject()

	if (objects.length === 1) {
		const obj = objects[0]
		ctx.canvas.setActiveObject(obj)
		// Add control points for the single selected object
		if (ctx.controlPointManager) {
			// @ts-expect-error - Custom id property
			const objId = obj.id
			if (objId) {
				ctx.controlPointManager.addControlPoints(objId, obj, true)
			}
		}
	} else {
		// For multiple objects, create an ActiveSelection
		const selection = new fabric.ActiveSelection(objects, {
			canvas: ctx.canvas,
		})
		ctx.canvas.setActiveObject(selection)
		// Add control points for each object in the selection
		if (ctx.controlPointManager) {
			objects.forEach((obj) => {
				// @ts-expect-error - Custom id property
				const objId = obj.id
				if (objId) {
					ctx.controlPointManager?.addControlPoints(objId, obj, true)
				}
			})
		}
	}

	ctx.canvas.renderAll()
	return true
}

/**
 * Checks if the current clipboard has content
 */
export function hasClipboardContent(): boolean {
	return clipboard.length > 0
}

/**
 * Clears the clipboard
 */
export function clearClipboard(): void {
	clipboard = []
}
