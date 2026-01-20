import * as fabric from 'fabric'
import { v4 as uuidv4 } from 'uuid'
import { ZOOM_LIMITS } from './constants'
import type { ControlPointManager } from './control-points'
import * as Shapes from './shapes'
import type { DrawOptions, LineOptions, ShapeOptions, TextOptions, WhiteboardTool } from './types'

/**
 * Context object containing all state and callbacks needed by event handlers
 */
export interface CanvasEventContext {
	// State refs (getters/setters for reactive state)
	getSelectedTool: () => WhiteboardTool
	setSelectedTool: (tool: WhiteboardTool) => void
	getShowFloatingMenu: () => boolean
	setShowFloatingMenu: (value: boolean) => void
	getIsMovingImage: () => boolean
	setIsMovingImage: (value: boolean) => void
	getIsPanMode: () => boolean
	setIsPanMode: (value: boolean) => void
	getPanStartPos: () => { x: number; y: number }
	setPanStartPos: (pos: { x: number; y: number }) => void
	getCurrentZoom: () => number
	setCurrentZoom: (zoom: number) => void
	getIsDrawingLine: () => boolean
	setIsDrawingLine: (value: boolean) => void
	getIsDrawingShape: () => boolean
	setIsDrawingShape: (value: boolean) => void
	getIsDrawingText: () => boolean
	setIsDrawingText: (value: boolean) => void
	// Flag to prevent history recording during drawing (optional for backward compatibility)
	setIsDrawingObject?: (value: boolean) => void
	getCurrentShapeType: () => string
	setCurrentShapeType: (type: string) => void
	getIsErasing: () => boolean
	setIsErasing: (value: boolean) => void
	getStartPoint: () => { x: number; y: number }
	setStartPoint: (point: { x: number; y: number }) => void
	getTempLine: () => fabric.Polyline | fabric.Group | null
	setTempLine: (line: fabric.Polyline | fabric.Group | null) => void
	getTempShape: () => fabric.Object | null
	setTempShape: (shape: fabric.Object | null) => void
	getTempText: () => fabric.Textbox | null
	setTempText: (text: fabric.Textbox | null) => void
	getEraserTrail: () => fabric.Object[]
	setEraserTrail: (trail: fabric.Object[]) => void
	getLastEraserPoint: () => { x: number; y: number } | null
	setLastEraserPoint: (point: { x: number; y: number } | null) => void
	getHoveredObjectsForDeletion: () => fabric.Object[]
	setHoveredObjectsForDeletion: (objects: fabric.Object[]) => void
	getOriginalOpacities: () => Map<fabric.Object, number>
	setOriginalOpacities: (map: Map<fabric.Object, number>) => void

	// Options getters
	getCurrentTextOptions: () => TextOptions
	getCurrentShapeOptions: () => ShapeOptions
	getCurrentDrawOptions: () => DrawOptions
	getCurrentLineOptions: () => LineOptions

	// Callbacks
	sendCanvasUpdate: (data: Record<string, unknown>) => void
	sendImageUpdate: (
		objectId: string,
		objectData: Record<string, unknown>,
		immediate: boolean
	) => void
	clearEraserState: () => void
	// Callback for batch eraser deletions (for history recording)
	onEraserComplete?: (deletedObjects: Array<{ id: string; data: Record<string, unknown> }>) => void
	floatingMenuRef?: {
		updateTextOptions?: (options: Partial<TextOptions>) => void
		updateShapeOptions?: (options: Partial<ShapeOptions>) => void
		updateLineOptions?: (options: Partial<LineOptions>) => void
		updateDrawOptions?: (options: Partial<DrawOptions>) => void
		closeExpandedColors?: () => void
		setActiveMenuPanel?: (panel: WhiteboardTool) => void
	}

	// Control point manager
	controlPointManager?: ControlPointManager
}

/**
 * Creates object:moving event handler
 */
// Throttle mechanism for live movement updates
let moveThrottleTimeout: ReturnType<typeof setTimeout> | null = null
let pendingMoveUpdates = new Map<string, any>()

export const createObjectMovingHandler = (ctx: CanvasEventContext) => {
	return ({ target }: { target: fabric.Object }) => {
		// Handle control point movement - don't sync the control point itself
		if (ctx.controlPointManager?.isControlPoint(target)) {
			// This is a control point circle, update the associated line/shape
			const center = target.getCenterPoint()
			// @ts-expect-error - custom id property
			ctx.controlPointManager.updateObjectFromControlPoint(target.id, center.x, center.y, true) // true = isLive
			return // Don't proceed to sync - control points are client-side only
		}

		// If moving objects with control points, update them and keep them visible
		if (
			(target.type === 'polyline' ||
				target.type === 'rect' ||
				target.type === 'ellipse' ||
				target.type === 'triangle' ||
				target.type === 'textbox' ||
				target.type === 'image' ||
				target.type === 'path') &&
			ctx.controlPointManager
		) {
			// @ts-expect-error - custom id property
			const objId = target.id
			ctx.controlPointManager.updateControlPoints(objId, target)
			// Ensure control points stay visible during drag
			ctx.controlPointManager.showControlPoints(objId)
		}

		// @ts-expect-error - custom id property
		const objectId = target.id

		// Use unified throttle for all objects including images
		const objData = target.type === 'textbox' ? target.toObject(['text']) : target.toObject()
		objData.id = objectId

		// For images, mark that we're moving one
		if (target.type === 'image') {
			ctx.setIsMovingImage(true)
		}

		// Remove type property to avoid fabric.js warning (except for images which need it)
		if (target.type !== 'image') {
			delete objData.type
		}

		// Store the latest state for this object
		pendingMoveUpdates.set(objectId, objData)

		// Throttle live updates - send every 16ms (60 updates per second)
		if (moveThrottleTimeout === null) {
			moveThrottleTimeout = setTimeout(() => {
				// Send all pending updates
				pendingMoveUpdates.forEach((data, id) => {
					ctx.sendCanvasUpdate({
						type: 'modify',
						object: data,
						live: true
					})
				})
				pendingMoveUpdates.clear()
				moveThrottleTimeout = null
			}, 16)
		}
	}
}

/**
 * Creates object:scaling event handler
 */
export const createObjectScalingHandler = (ctx: CanvasEventContext) => {
	return ({ target }: { target: fabric.Object }) => {
		const objData = target.type === 'textbox' ? target.toObject(['text']) : target.toObject()
		// @ts-expect-error - custom id property
		const objectId = target.id
		objData.id = objectId

		// Send live updates during scaling (won't persist, improves performance)
		if (target.type === 'image') {
			ctx.setIsMovingImage(true)
			ctx.sendImageUpdate(objectId, objData, false)
		} else {
			// Remove type property to avoid fabric.js warning
			delete objData.type
			// Store the latest state
			pendingMoveUpdates.set(objectId, objData)
			// Throttle updates - 16ms for 60 FPS
			if (moveThrottleTimeout === null) {
				moveThrottleTimeout = setTimeout(() => {
					pendingMoveUpdates.forEach((data, id) => {
						ctx.sendCanvasUpdate({
							type: 'modify',
							object: data,
							live: true
						})
					})
					pendingMoveUpdates.clear()
					moveThrottleTimeout = null
				}, 16)
			}
		}
	}
}

/**
 * Creates object:rotating event handler
 */
export const createObjectRotatingHandler = (ctx: CanvasEventContext) => {
	return ({ target }: { target: fabric.Object }) => {
		// Skip if this is being rotated by control points
		// Control points handle their own websocket updates
		if (ctx.controlPointManager) {
			// @ts-expect-error - custom id property
			const objId = target.id
			const controlPoints = ctx.controlPointManager.getAllControlPoints()
			const hasControlPoints = controlPoints.some((cp) => cp.objectId === objId)
			if (hasControlPoints) {
				// This object has control points, so rotation is handled by control point manager
				// Don't send duplicate updates
				return
			}
		}

		const objData = target.type === 'textbox' ? target.toObject(['text']) : target.toObject()
		// @ts-expect-error - custom id property
		const objectId = target.id
		objData.id = objectId

		// Send live updates during rotation (won't persist, improves performance)
		if (target.type === 'image') {
			ctx.setIsMovingImage(true)
			ctx.sendImageUpdate(objectId, objData, false)
		} else {
			// Remove type property to avoid fabric.js warning
			delete objData.type
			// Store the latest state
			pendingMoveUpdates.set(objectId, objData)
			// Throttle updates - 16ms for 60 FPS
			if (moveThrottleTimeout === null) {
				moveThrottleTimeout = setTimeout(() => {
					pendingMoveUpdates.forEach((data, id) => {
						ctx.sendCanvasUpdate({
							type: 'modify',
							object: data,
							live: true
						})
					})
					pendingMoveUpdates.clear()
					moveThrottleTimeout = null
				}, 16)
			}
		}
	}
}

/**
 * Creates object:modified event handler
 */
export const createObjectModifiedHandler = (ctx: CanvasEventContext) => {
	return ({ target }: { target: fabric.Object }) => {
		// Handle control point final update (when drag ends)
		if (ctx.controlPointManager?.isControlPoint(target)) {
			// Send final update with isLive=false to persist to database
			const center = target.getCenterPoint()
			// @ts-expect-error - custom id property
			ctx.controlPointManager.updateObjectFromControlPoint(target.id, center.x, center.y, false) // false = not live, persist to DB
			return
		}

		// This handles final modifications - always send immediately for persistence
		if (target.type === 'image') {
			const objData = target.toObject()
			// @ts-expect-error - custom id property
			objData.id = target.id
			// @ts-expect-error - custom id property
			ctx.sendImageUpdate(target.id, objData, true)
			ctx.setIsMovingImage(false)
		} else if (target.type === 'polyline') {
			// For polylines, send standard fabric.js data
			const objData = target.toObject()
			// @ts-expect-error - custom id property
			objData.id = target.id
			ctx.sendCanvasUpdate({
				type: 'modify',
				object: objData
			})
		} else {
			// For textbox objects, include the 'text' property
			const objData = target.type === 'textbox' ? target.toObject(['text']) : target.toObject()
			// @ts-expect-error - custom id property
			objData.id = target.id
			// Immediate updates for non-image objects
			ctx.sendCanvasUpdate({
				type: 'modify',
				object: objData
			})
		}
	}
}

/**
 * Creates mouse:up event handler
 */
export const createMouseUpHandler = (canvas: fabric.Canvas, ctx: CanvasEventContext) => {
	return () => {
		if (ctx.getIsPanMode()) {
			ctx.setIsPanMode(false)
			canvas.selection = ctx.getSelectedTool() === 'select'

			// Set cursor based on current tool
			const selectedTool = ctx.getSelectedTool()
			if (selectedTool === 'pan') {
				canvas.setCursor('grab')
			} else if (selectedTool === 'select') {
				canvas.setCursor('default')
			} else if (selectedTool === 'draw') {
				canvas.setCursor('crosshair')
			} else if (selectedTool === 'line' || selectedTool === 'arrow') {
				canvas.setCursor('crosshair')
			} else if (selectedTool === 'shapes') {
				canvas.setCursor('crosshair')
			} else if (selectedTool === 'text') {
				canvas.setCursor('crosshair')
			}
		}

		// Text creation is now handled in mouse:down (single click), no mouse:up handling needed

		// Handle shape completion
		const tempShape = ctx.getTempShape()
		if (ctx.getIsDrawingShape() && tempShape) {
			// Finalize the shape
			tempShape.set({ selectable: true })
			canvas.setActiveObject(tempShape)
			canvas.renderAll()

			// Send the completed shape to other users
			const objData = tempShape.toObject()
			// @ts-expect-error - custom id property
			objData.id = tempShape.id
			// @ts-expect-error - custom markAsRecentlyCreated property added by websocket
			if (ctx.sendCanvasUpdate.socket?.markAsRecentlyCreated) {
				// @ts-expect-error - custom markAsRecentlyCreated property
				ctx.sendCanvasUpdate.socket.markAsRecentlyCreated(tempShape.id)
			}
			ctx.sendCanvasUpdate({
				type: 'add',
				object: objData
			})

			// Re-enable history recording AFTER shape is finalized
			// The page component will detect this and record the add action
			ctx.setIsDrawingObject?.(false)

			// Dispatch a custom event to signal that the shape is finalized and should be recorded
			// @ts-expect-error - custom id property
			canvas.fire('object:finalized', { target: tempShape })

			// Auto-switch to selection tool while keeping floating menu open
			ctx.setSelectedTool('select')
			canvas.isDrawingMode = false
			canvas.selection = true
			canvas.defaultCursor = 'default'
			canvas.hoverCursor = 'move'

			// Show shape options in floating menu
			// Use setTimeout to ensure state updates happen after the object is properly selected
			setTimeout(() => {
				ctx.setShowFloatingMenu(true)
				ctx.floatingMenuRef?.setActiveMenuPanel?.('shapes')
				ctx.floatingMenuRef?.updateShapeOptions?.({
					strokeWidth: (tempShape.strokeWidth as number) || 2,
					strokeColour: (tempShape.stroke as string) || '#1E1E1E',
					fillColour: (tempShape.fill as string) || 'transparent',
					strokeDashArray: (tempShape.strokeDashArray as number[]) || [],
					opacity: tempShape.opacity || 1
				})
			}, 0)

			// Reset shape drawing state
			ctx.setIsDrawingShape(false)
			ctx.setCurrentShapeType('')
			ctx.setTempShape(null)
		}

		// Handle line completion
		const tempLine = ctx.getTempLine()
		if (ctx.getIsDrawingLine() && tempLine) {
			// Set the object as selectable and finish the drawing
			tempLine.set({ selectable: true })
			canvas.setActiveObject(tempLine)
			canvas.renderAll()

			// Send the completed line to other users
			// @ts-expect-error - toObject method exists on both Line and Group
			const objData = tempLine.toObject()
			// @ts-expect-error - custom id property
			objData.id = tempLine.id
			ctx.sendCanvasUpdate({
				type: 'add',
				object: objData
			})

			// Re-enable history recording AFTER line is finalized
			ctx.setIsDrawingObject?.(false)

			// Dispatch a custom event to signal that the line is finalized and should be recorded
			// @ts-expect-error - custom id property
			canvas.fire('object:finalized', { target: tempLine })

			// Auto-switch to selection tool while keeping floating menu open
			ctx.setSelectedTool('select')
			canvas.isDrawingMode = false
			canvas.selection = true
			canvas.defaultCursor = 'default'
			canvas.hoverCursor = 'move'

			// Show line options in floating menu
			setTimeout(() => {
				ctx.setShowFloatingMenu(true)
				ctx.floatingMenuRef?.setActiveMenuPanel?.('line')

				// Get stroke properties - for arrow groups, get from the line part
				let strokeWidth = 2
				let strokeColour = '#1E1E1E'
				let strokeDashArray: number[] = []
				let opacity = 1

				if (tempLine.type === 'polyline') {
					strokeWidth = (tempLine.strokeWidth as number) || 2
					strokeColour = (tempLine.stroke as string) || '#1E1E1E'
					strokeDashArray = (tempLine.strokeDashArray as number[]) || []
					opacity = tempLine.opacity || 1
				} else if (tempLine.type === 'group') {
					// For arrow groups, get properties from the line object
					const group = tempLine as fabric.Group
					const lineObj = group.getObjects().find((obj) => obj.type === 'polyline')
					if (lineObj) {
						strokeWidth = (lineObj.strokeWidth as number) || 2
						strokeColour = (lineObj.stroke as string) || '#1E1E1E'
						strokeDashArray = (lineObj.strokeDashArray as number[]) || []
						opacity = lineObj.opacity || 1
					}
				}

				ctx.floatingMenuRef?.updateLineOptions?.({
					strokeWidth,
					strokeColour,
					strokeDashArray,
					opacity
				})
			}, 0)

			// Add control points for the line (visible since we just created it)
			if (tempLine.type === 'polyline' && ctx.controlPointManager) {
				// @ts-expect-error - custom id property
				ctx.controlPointManager.addControlPoints(tempLine.id, tempLine, true)
			}

			// Reset drawing state
			ctx.setIsDrawingLine(false)
			ctx.setTempLine(null)
		}

		// Handle eraser completion
		if (ctx.getIsErasing()) {
			ctx.setIsErasing(false)

			const objectsToDelete = ctx.getHoveredObjectsForDeletion()
			const originalOpacities = ctx.getOriginalOpacities()

			// Collect all objects for batch history recording (with original opacity restored)
			const batchDeletedObjects: Array<{ id: string; data: Record<string, unknown> }> = []

			// First pass: collect all object data with original opacity restored
			objectsToDelete.forEach((obj) => {
				// @ts-expect-error - custom id property
				const objectId = obj.id
				// Get the original opacity before the eraser changed it
				const originalOpacity = originalOpacities.get(obj) || obj.opacity || 1

				// Store object data with original opacity restored for history
				const objData = obj.toObject()
				objData.id = objectId
				objData.opacity = originalOpacity // Restore original opacity in saved data
				batchDeletedObjects.push({ id: objectId, data: objData })
			})

			// Call the batch delete callback BEFORE removing objects
			// This marks the IDs so object:removed events are skipped
			if (batchDeletedObjects.length > 0 && ctx.onEraserComplete) {
				ctx.onEraserComplete(batchDeletedObjects)
			}

			// Second pass: now remove the objects (object:removed will skip these)
			objectsToDelete.forEach((obj) => {
				// @ts-expect-error - custom id property
				const objectId = obj.id

				// Remove control points if this is a polyline
				if (obj.type === 'polyline' && ctx.controlPointManager) {
					ctx.controlPointManager.removeControlPoints(objectId)
				}
				canvas.remove(obj)
				// Send delete message to other users
				ctx.sendCanvasUpdate({
					type: 'delete',
					object: { id: objectId }
				})
			})

			// Clear eraser state
			ctx.clearEraserState()
		}

		// If we were moving an image, ensure final position is sent
		if (ctx.getIsMovingImage()) {
			const activeObject = canvas.getActiveObject()
			if (activeObject && activeObject.type === 'image') {
				const objData = activeObject.toObject()
				// @ts-expect-error - custom id property
				objData.id = activeObject.id
				// @ts-expect-error - custom id property
				ctx.sendImageUpdate(activeObject.id, objData, true)
			}
			ctx.setIsMovingImage(false)
		}
	}
}

/**
 * Creates path:created event handler
 */
export const createPathCreatedHandler = (ctx: CanvasEventContext) => {
	return ({ path }: { path: fabric.Path }) => {
		// @ts-expect-error - custom id property
		path.id = uuidv4()

		// Disable default controls and borders - we use custom control points
		path.set({
			hasControls: false,
			hasBorders: false
		})

		const objData = path.toObject()
		// @ts-expect-error - custom id property
		objData.id = path.id
		ctx.sendCanvasUpdate({
			type: 'add',
			object: objData
		})
	}
}

/**
 * Creates text:changed event handler
 * Throttled to avoid sending updates on every keystroke
 */
let textChangeTimeout: ReturnType<typeof setTimeout> | null = null
export const createTextChangedHandler = (ctx: CanvasEventContext) => {
	return ({ target }: { target: fabric.Object }) => {
		// Clear any pending text update
		if (textChangeTimeout !== null) {
			clearTimeout(textChangeTimeout)
		}

		// Throttle text updates - send after 150ms of no typing for faster feedback
		textChangeTimeout = setTimeout(() => {
			const objData = target.toObject(['text'])
			// @ts-expect-error - custom id property
			objData.id = target.id
			ctx.sendCanvasUpdate({
				type: 'modify',
				object: objData,
				live: false // Not live, should persist
			})
			textChangeTimeout = null
		}, 150)

		// Also send a live update immediately (won't be persisted to DB)
		const objData = target.toObject(['text'])
		// @ts-expect-error - custom id property
		objData.id = target.id
		ctx.sendCanvasUpdate({
			type: 'modify',
			object: objData,
			live: true // Live update, won't persist to DB
		})
	}
}

/**
 * Creates text:editing:exited event handler
 * Ensures final text is sent when user finishes editing
 */
export const createTextEditingExitedHandler = (ctx: CanvasEventContext) => {
	return ({ target }: { target: fabric.Object }) => {
		// Clear any pending throttled update
		if (textChangeTimeout !== null) {
			clearTimeout(textChangeTimeout)
			textChangeTimeout = null
		}

		// Send final text state immediately when editing ends
		const objData = target.toObject(['text'])
		// @ts-expect-error - custom id property
		objData.id = target.id
		ctx.sendCanvasUpdate({
			type: 'modify',
			object: objData,
			live: false // Final update, should persist to DB
		})
	}
}

/**
 * Creates selection:created event handler
 */
export const createSelectionCreatedHandler = (ctx: CanvasEventContext) => {
	return ({ selected }: { selected: fabric.Object[] }) => {
		if (selected && selected.length === 1) {
			const obj = selected[0]

			// If a control point is selected, don't change anything - keep existing menu
			if (ctx.controlPointManager?.isControlPoint(obj)) {
				return // Don't update menu, don't hide control points
			}

			// Only hide/show control points if this is not a control point itself
			if (ctx.controlPointManager) {
				// Hide all control points first
				ctx.controlPointManager.hideAllControlPoints()

				// For supported object types, create control points if they don't exist, or show if they do
				if (
					obj.type === 'polyline' ||
					obj.type === 'rect' ||
					obj.type === 'ellipse' ||
					obj.type === 'triangle' ||
					obj.type === 'textbox' ||
					obj.type === 'image' ||
					obj.type === 'path'
				) {
					// @ts-expect-error - custom id property
					const objId = obj.id
					// Check if control points already exist for this object
					const handler = obj.type === 'polyline' ? ctx.controlPointManager.getLineHandler() : null
					const existingPoints = handler
						? handler.getControlPointsForObject(objId)
						: ctx.controlPointManager.getAllControlPoints().filter((cp) => cp.objectId === objId)
					if (existingPoints.length === 0) {
						// Create control points for this object (visible by default)
						ctx.controlPointManager.addControlPoints(objId, obj, true)
					} else {
						// Show existing control points
						ctx.controlPointManager.showControlPoints(objId)
					}
				}
			}

			// Show floating menu when an object is selected
			ctx.setShowFloatingMenu(true)

			// Set the active menu panel and sync properties based on object type
			// Do NOT change the selected tool - stay in current mode (usually 'select')
			if (obj.type === 'textbox') {
				// Show text options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('text')
				// Sync text properties to menu
				ctx.floatingMenuRef?.updateTextOptions?.({
					// @ts-expect-error - textbox properties
					fontSize: obj.fontSize || 16,
					// @ts-expect-error - textbox properties
					fontFamily: obj.fontFamily || 'Arial',
					// @ts-expect-error - textbox properties
					fontWeight: obj.fontWeight || 'normal',
					colour: obj.fill?.toString() || '#4A5568',
					// @ts-expect-error - textbox properties
					textAlign: obj.textAlign || 'left',
					opacity: obj.opacity ?? 1
				})
			} else if (
				obj.type === 'rect' ||
				obj.type === 'circle' ||
				obj.type === 'triangle' ||
				obj.type === 'ellipse'
			) {
				// Show shape options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('shapes')
				// Sync shape properties to menu
				ctx.floatingMenuRef?.updateShapeOptions?.({
					strokeWidth: obj.strokeWidth || 2,
					strokeColour: obj.stroke?.toString() || '#4A5568',
					fillColour: obj.fill?.toString() || 'transparent',
					strokeDashArray: obj.strokeDashArray || [],
					opacity: obj.opacity ?? 1
				})
			} else if (obj.type === 'polyline') {
				// Show line options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('line')
				// Sync line properties to menu
				ctx.floatingMenuRef?.updateLineOptions?.({
					strokeWidth: obj.strokeWidth || 2,
					strokeColour: obj.stroke?.toString() || '#4A5568',
					strokeDashArray: obj.strokeDashArray || [],
					opacity: obj.opacity ?? 1
				})
			} else if (obj.type === 'group') {
				// Arrows are groups - show arrow options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('arrow')
				// Sync arrow properties from the line in the group
				const groupObj = obj as fabric.Group
				const lineObj = groupObj.getObjects().find((o) => o.type === 'polyline')
				if (lineObj) {
					ctx.floatingMenuRef?.updateLineOptions?.({
						strokeWidth: lineObj.strokeWidth || 2,
						strokeColour: lineObj.stroke?.toString() || '#4A5568',
						strokeDashArray: lineObj.strokeDashArray || [],
						opacity: lineObj.opacity ?? 1
					})
				}
			} else if (obj.type === 'path') {
				// Drawn paths (freehand drawing) - show draw options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('draw')
				// Sync path properties to menu
				ctx.floatingMenuRef?.updateDrawOptions?.({
					brushSize: obj.strokeWidth || 6,
					brushColour: obj.stroke?.toString() || '#4A5568',
					opacity: obj.opacity ?? 1
				})
			} else if (obj.type === 'image') {
				// Images - show image options panel (only opacity applies)
				ctx.floatingMenuRef?.setActiveMenuPanel?.('image')
				// Sync image properties to menu (only opacity makes sense)
				ctx.floatingMenuRef?.updateShapeOptions?.({
					opacity: obj.opacity ?? 1
				})
			}
		}
	}
}

/**
 * Creates selection:updated event handler
 */
export const createSelectionUpdatedHandler = (ctx: CanvasEventContext) => {
	return ({ selected }: { selected: fabric.Object[] }) => {
		if (selected && selected.length === 1) {
			const obj = selected[0]

			// If a control point is selected, don't change anything - keep existing menu
			if (ctx.controlPointManager?.isControlPoint(obj)) {
				return // Don't update menu, don't hide control points
			}

			// Only hide/show control points if this is not a control point itself
			if (ctx.controlPointManager) {
				// Remove all control points from previously selected objects
				const allControlPoints = ctx.controlPointManager.getAllControlPoints()
				const objectIds = new Set(allControlPoints.map((cp) => cp.objectId))
				objectIds.forEach((objectId) => {
					ctx.controlPointManager?.removeControlPoints(objectId)
				})

				// For all supported object types, create control points
				if (
					obj.type === 'polyline' ||
					obj.type === 'rect' ||
					obj.type === 'ellipse' ||
					obj.type === 'triangle' ||
					obj.type === 'textbox' ||
					obj.type === 'image' ||
					obj.type === 'path'
				) {
					// @ts-expect-error - custom id property
					const objId = obj.id
					// Always create fresh control points for the newly selected object
					ctx.controlPointManager.addControlPoints(objId, obj, true)
				}
			}

			// Show floating menu when an object is selected
			ctx.setShowFloatingMenu(true)

			// Set the active menu panel and sync properties based on object type
			// Do NOT change the selected tool - stay in current mode (usually 'select')
			if (obj.type === 'textbox') {
				// Show text options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('text')
				// Sync text properties to menu
				ctx.floatingMenuRef?.updateTextOptions?.({
					// @ts-expect-error - textbox properties
					fontSize: obj.fontSize || 16,
					// @ts-expect-error - textbox properties
					fontFamily: obj.fontFamily || 'Arial',
					// @ts-expect-error - textbox properties
					fontWeight: obj.fontWeight || 'normal',
					colour: obj.fill?.toString() || '#4A5568',
					// @ts-expect-error - textbox properties
					textAlign: obj.textAlign || 'left',
					opacity: obj.opacity ?? 1
				})
			} else if (
				obj.type === 'rect' ||
				obj.type === 'circle' ||
				obj.type === 'triangle' ||
				obj.type === 'ellipse'
			) {
				// Show shape options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('shapes')
				// Sync shape properties to menu
				ctx.floatingMenuRef?.updateShapeOptions?.({
					strokeWidth: obj.strokeWidth || 2,
					strokeColour: obj.stroke?.toString() || '#4A5568',
					fillColour: obj.fill?.toString() || 'transparent',
					strokeDashArray: obj.strokeDashArray || [],
					opacity: obj.opacity ?? 1
				})
			} else if (obj.type === 'polyline') {
				// Show line options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('line')
				// Sync line properties to menu
				ctx.floatingMenuRef?.updateLineOptions?.({
					strokeWidth: obj.strokeWidth || 2,
					strokeColour: obj.stroke?.toString() || '#4A5568',
					strokeDashArray: obj.strokeDashArray || [],
					opacity: obj.opacity ?? 1
				})
			} else if (obj.type === 'group') {
				// Arrows are groups - show arrow options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('arrow')
				// Sync arrow properties from the line in the group
				const groupObj = obj as fabric.Group
				const lineObj = groupObj.getObjects().find((o) => o.type === 'polyline')
				if (lineObj) {
					ctx.floatingMenuRef?.updateLineOptions?.({
						strokeWidth: lineObj.strokeWidth || 2,
						strokeColour: lineObj.stroke?.toString() || '#4A5568',
						strokeDashArray: lineObj.strokeDashArray || [],
						opacity: lineObj.opacity ?? 1
					})
				}
			} else if (obj.type === 'path') {
				// Drawn paths (freehand drawing) - show draw options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('draw')
				// Sync path properties to menu
				ctx.floatingMenuRef?.updateDrawOptions?.({
					brushSize: obj.strokeWidth || 6,
					brushColour: obj.stroke?.toString() || '#4A5568',
					opacity: obj.opacity ?? 1
				})
			} else if (obj.type === 'image') {
				// Images - show image options panel (only opacity applies)
				ctx.floatingMenuRef?.setActiveMenuPanel?.('image')
				// Sync image properties to menu (only opacity makes sense)
				ctx.floatingMenuRef?.updateShapeOptions?.({
					opacity: obj.opacity ?? 1
				})
			}
		}
	}
}

/**
 * Creates selection:cleared event handler
 */
export const createSelectionClearedHandler = (ctx: CanvasEventContext) => {
	return () => {
		// Remove all control points when selection is cleared (not just hide)
		// This ensures stale control points from deselected objects are cleaned up
		if (ctx.controlPointManager) {
			// Get all objects with control points and remove their control points
			const allControlPoints = ctx.controlPointManager.getAllControlPoints()
			const objectIds = new Set(allControlPoints.map((cp) => cp.objectId))
			objectIds.forEach((objectId) => {
				ctx.controlPointManager?.removeControlPoints(objectId)
			})
		}

		// Close floating menu when clicking on empty space in select mode
		if (ctx.getSelectedTool() === 'select') {
			ctx.setShowFloatingMenu(false)
		}
	}
}

/**
 * Creates mouse:wheel event handler
 */
export const createMouseWheelHandler = (canvas: fabric.Canvas, ctx: CanvasEventContext) => {
	return (opt: fabric.TEvent<WheelEvent>) => {
		const delta = opt.e.deltaY

		let zoom = canvas.getZoom()
		zoom *= 0.99 ** delta
		if (zoom > ZOOM_LIMITS.max) zoom = ZOOM_LIMITS.max
		if (zoom < ZOOM_LIMITS.min) zoom = ZOOM_LIMITS.min

		const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY)
		canvas.zoomToPoint(point, zoom)
		ctx.setCurrentZoom(zoom)
		opt.e.preventDefault()
		opt.e.stopPropagation()
	}
}

/**
 * Creates mouse:down event handler
 */
export const createMouseDownHandler = (canvas: fabric.Canvas, ctx: CanvasEventContext) => {
	return (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
		const evt = opt.e

		// Close the expanded colors panel when user starts interacting
		ctx.floatingMenuRef?.closeExpandedColors?.()

		const selectedTool = ctx.getSelectedTool()

		if (selectedTool === 'pan') {
			ctx.setIsPanMode(true)
			canvas.selection = false
			canvas.discardActiveObject()
			canvas.setCursor('grabbing')

			const clientX = 'clientX' in evt ? evt.clientX : evt.touches?.[0]?.clientX || 0
			const clientY = 'clientY' in evt ? evt.clientY : evt.touches?.[0]?.clientY || 0
			ctx.setPanStartPos({ x: clientX, y: clientY })

			opt.e.preventDefault()
			opt.e.stopPropagation()
		} else if (selectedTool === 'select') {
			if (!canvas.getActiveObject() && !canvas.findTarget(evt)) {
				ctx.setIsPanMode(true)
				canvas.selection = false
				canvas.setCursor('grab')

				const clientX = 'clientX' in evt ? evt.clientX : evt.touches?.[0]?.clientX || 0
				const clientY = 'clientY' in evt ? evt.clientY : evt.touches?.[0]?.clientY || 0
				ctx.setPanStartPos({ x: clientX, y: clientY })

				opt.e.preventDefault()
			}
		} else if (selectedTool === 'shapes' && ctx.getCurrentShapeType()) {
			if (!ctx.getIsDrawingShape()) {
				// Start drawing a shape
				const pointer = canvas.getScenePoint(opt.e)
				ctx.setStartPoint({ x: pointer.x, y: pointer.y })
				ctx.setIsDrawingShape(true)
				ctx.setIsDrawingObject?.(true) // Prevent history recording during drawing

				// Create initial shape with zero size
				const tempShape = Shapes.createShapeFromPoints(
					ctx.getCurrentShapeType(),
					pointer.x,
					pointer.y,
					pointer.x,
					pointer.y,
					ctx.getCurrentShapeOptions()
				)
				if (tempShape) {
					canvas.add(tempShape)
					canvas.renderAll()
				}
				ctx.setTempShape(tempShape)

				opt.e.preventDefault()
				opt.e.stopPropagation()
			}
		} else if (selectedTool === 'text') {
			// Check if we clicked on an existing textbox to edit it
			const target = canvas.findTarget(opt.e)

			// If we're currently editing a textbox and click elsewhere, exit editing and switch to select
			const activeObject = canvas.getActiveObject()
			if (
				activeObject &&
				activeObject.type === 'textbox' &&
				(activeObject as fabric.Textbox).isEditing
			) {
				;(activeObject as fabric.Textbox).exitEditing()
				canvas.discardActiveObject()
				canvas.renderAll()

				// Switch to select tool
				ctx.setSelectedTool('select')
				canvas.isDrawingMode = false
				canvas.selection = true
				canvas.defaultCursor = 'default'
				canvas.hoverCursor = 'move'

				opt.e.preventDefault()
				opt.e.stopPropagation()
				return
			}

			if (target && target.type === 'textbox') {
				// Enter edit mode on the existing textbox
				canvas.setActiveObject(target)
				;(target as fabric.Textbox).enterEditing()
				canvas.renderAll()

				opt.e.preventDefault()
				opt.e.stopPropagation()
			} else {
				// Create textbox instantly with fixed default size on single click
				const pointer = canvas.getScenePoint(opt.e)
				const DEFAULT_TEXTBOX_WIDTH = 200
				const DEFAULT_FONT_SIZE = 16

				// Mark that we're creating an object temporarily (will be finalized when user finishes editing)
				ctx.setIsDrawingObject?.(true)

				// Create textbox with fixed defaults - ignore current text options for size
				const textbox = new fabric.Textbox('Click to edit text', {
					id: uuidv4(),
					left: pointer.x,
					top: pointer.y,
					width: DEFAULT_TEXTBOX_WIDTH,
					fontSize: DEFAULT_FONT_SIZE,
					fontFamily: ctx.getCurrentTextOptions().fontFamily,
					fontWeight: ctx.getCurrentTextOptions().fontWeight,
					fill: ctx.getCurrentTextOptions().colour,
					opacity: ctx.getCurrentTextOptions().opacity,
					splitByGrapheme: false, // Break at word boundaries (spaces) first
					breakWords: true, // But break long words if they don't fit
					textAlign: ctx.getCurrentTextOptions().textAlign,
					hasControls: false,
					hasBorders: false,
					originX: 'left',
					originY: 'top',
					selectable: true
				})

				// Ensure dimensions are calculated correctly
				textbox.initDimensions()

				canvas.add(textbox)
				canvas.setActiveObject(textbox)

				// Add listener to update control points when textbox dimensions change
				textbox.on('changed', () => {
					textbox.initDimensions() // Recalculate height when text changes
					if (ctx.controlPointManager) {
						// @ts-expect-error - custom id property
						ctx.controlPointManager.updateControlPoints(textbox.id, textbox)
					}
					canvas.renderAll()
				})

				// Enter edit mode immediately
				textbox.enterEditing()
				textbox.selectAll()

				canvas.renderAll()

				// Send the created textbox to other users
				const objData = textbox.toObject(['text'])
				// @ts-expect-error - custom id property
				objData.id = textbox.id
				// @ts-expect-error - custom markAsRecentlyCreated property added by websocket
				if (ctx.sendCanvasUpdate.socket?.markAsRecentlyCreated) {
					// @ts-expect-error - custom markAsRecentlyCreated property
					ctx.sendCanvasUpdate.socket.markAsRecentlyCreated(textbox.id)
				}
				ctx.sendCanvasUpdate({
					type: 'add',
					object: objData
				})

				// Re-enable history recording after text is created and sent
				ctx.setIsDrawingObject?.(false)

				// Auto-switch to selection tool while keeping floating menu open
				ctx.setSelectedTool('select')
				canvas.isDrawingMode = false
				canvas.selection = true
				canvas.defaultCursor = 'default'
				canvas.hoverCursor = 'move'

				// Show text options in floating menu
				setTimeout(() => {
					ctx.setShowFloatingMenu(true)
					ctx.floatingMenuRef?.setActiveMenuPanel?.('text')
					ctx.floatingMenuRef?.updateTextOptions?.({
						fontSize: textbox.fontSize,
						fontFamily: textbox.fontFamily,
						fontWeight: String(textbox.fontWeight || 'normal'),
						colour: textbox.fill as string,
						textAlign: textbox.textAlign,
						opacity: textbox.opacity || 1
					})
				}, 0)

				opt.e.preventDefault()
				opt.e.stopPropagation()
			}
		} else if (selectedTool === 'line') {
			// Don't start drawing if we're clicking on an existing object
			const target = canvas.findTarget(opt.e)
			if (!target && !ctx.getIsDrawingLine()) {
				const pointer = canvas.getScenePoint(opt.e)
				const startPoint = { x: pointer.x, y: pointer.y }
				ctx.setStartPoint(startPoint)
				ctx.setIsDrawingLine(true)
				ctx.setIsDrawingObject?.(true) // Prevent history recording during drawing
				const tempLine = Shapes.createLine(
					startPoint.x,
					startPoint.y,
					startPoint.x,
					startPoint.y,
					ctx.getCurrentLineOptions()
				)
				ctx.setTempShape(tempLine)
				ctx.setTempLine(tempLine)

				canvas.add(tempLine)
				canvas.renderAll()

				opt.e.preventDefault()
				opt.e.stopPropagation()
			}
		} else if (selectedTool === 'eraser') {
			ctx.setIsErasing(true)
			const pointer = canvas.getScenePoint(opt.e)
			ctx.setStartPoint({ x: pointer.x, y: pointer.y })
			ctx.setLastEraserPoint({ x: pointer.x, y: pointer.y })

			// Find objects under the eraser and make them transparent
			canvas.forEachObject((obj) => {
				if (obj.containsPoint(pointer) && !ctx.getEraserTrail().includes(obj)) {
					if (!ctx.getHoveredObjectsForDeletion().includes(obj)) {
						// Store original opacity and make transparent
						const originalOpacities = ctx.getOriginalOpacities()
						originalOpacities.set(obj, obj.opacity || 1)
						ctx.setOriginalOpacities(originalOpacities)
						obj.set({ opacity: 0.3 })
						const hoveredObjects = ctx.getHoveredObjectsForDeletion()
						hoveredObjects.push(obj)
						ctx.setHoveredObjectsForDeletion(hoveredObjects)
					}
				}
			})

			canvas.renderAll()
			opt.e.preventDefault()
			opt.e.stopPropagation()
		}
	}
}

/**
 * Creates mouse:move event handler
 */
export const createMouseMoveHandler = (canvas: fabric.Canvas, ctx: CanvasEventContext) => {
	return (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
		if (ctx.getIsPanMode()) {
			const e = opt.e
			const clientX = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX || 0
			const clientY = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY || 0

			const panStartPos = ctx.getPanStartPos()
			const deltaX = clientX - panStartPos.x
			const deltaY = clientY - panStartPos.y

			canvas.relativePan(new fabric.Point(deltaX, deltaY))
			ctx.setPanStartPos({ x: clientX, y: clientY })

			canvas.setCursor('grabbing')
		} else if (ctx.getIsDrawingShape() && ctx.getTempShape() && ctx.getCurrentShapeType()) {
			// Update the shape being drawn
			const pointer = canvas.getScenePoint(opt.e)
			const startPoint = ctx.getStartPoint()

			// Get the old temp shape
			const oldTempShape = ctx.getTempShape()

			// Create new shape with updated dimensions
			const tempShape = Shapes.createShapeFromPoints(
				ctx.getCurrentShapeType(),
				startPoint.x,
				startPoint.y,
				pointer.x,
				pointer.y,
				ctx.getCurrentShapeOptions()
			)

			if (tempShape && oldTempShape) {
				// Replace the old shape with the new one atomically
				const index = canvas.getObjects().indexOf(oldTempShape)
				canvas.remove(oldTempShape)
				if (index >= 0) {
					canvas.insertAt(index, tempShape)
				} else {
					canvas.add(tempShape)
				}
				ctx.setTempShape(tempShape)
				canvas.renderAll()
			} else if (tempShape) {
				// First time - just add it
				canvas.add(tempShape)
				ctx.setTempShape(tempShape)
				canvas.renderAll()
			}
		} else if (ctx.getIsDrawingLine() && ctx.getTempLine()) {
			// Update the temporary line/arrow while dragging
			const pointer = canvas.getScenePoint(opt.e)
			const startPoint = ctx.getStartPoint()

			// Remove the old temp line/arrow
			const oldTempLine = ctx.getTempLine()
			if (oldTempLine) {
				canvas.remove(oldTempLine)
			}

			const tempLine = Shapes.createLine(
				startPoint.x,
				startPoint.y,
				pointer.x,
				pointer.y,
				ctx.getCurrentLineOptions()
			)

			if (tempLine) {
				canvas.add(tempLine)
			}
			ctx.setTempLine(tempLine)

			canvas.renderAll()
		} else if (ctx.getIsErasing() && ctx.getSelectedTool() === 'eraser') {
			// Create visual eraser trail as a solid line
			const pointer = canvas.getScenePoint(opt.e)

			// Create a line segment from the last point to current point
			const lastEraserPoint = ctx.getLastEraserPoint()
			if (lastEraserPoint) {
				const trailLine = new fabric.Line(
					[lastEraserPoint.x, lastEraserPoint.y, pointer.x, pointer.y],
					{
						stroke: 'rgba(170, 170, 170, 0.4)',
						strokeWidth: 5,
						selectable: false,
						evented: false,
						excludeFromExport: true
					}
				)

				canvas.add(trailLine)
				const eraserTrail = ctx.getEraserTrail()
				eraserTrail.push(trailLine)

				// Limit trail length for performance
				if (eraserTrail.length > 15) {
					const oldTrail = eraserTrail.shift()
					if (oldTrail) canvas.remove(oldTrail)
				}
				ctx.setEraserTrail(eraserTrail)
			}

			ctx.setLastEraserPoint({ x: pointer.x, y: pointer.y })

			// Find objects under the eraser and make them transparent
			canvas.forEachObject((obj) => {
				if (obj.containsPoint(pointer) && !ctx.getEraserTrail().includes(obj)) {
					if (!ctx.getHoveredObjectsForDeletion().includes(obj)) {
						// Store original opacity and make transparent
						const originalOpacities = ctx.getOriginalOpacities()
						originalOpacities.set(obj, obj.opacity || 1)
						ctx.setOriginalOpacities(originalOpacities)
						obj.set({ opacity: 0.3 })
						const hoveredObjects = ctx.getHoveredObjectsForDeletion()
						hoveredObjects.push(obj)
						ctx.setHoveredObjectsForDeletion(hoveredObjects)
					}
				}
			})

			canvas.renderAll()
		} else if (ctx.getSelectedTool() === 'eraser' && !ctx.getIsErasing()) {
			// Show hover preview when not actively erasing
			const pointer = canvas.getScenePoint(opt.e)

			// Reset any previously hovered objects
			const hoveredObjects = ctx.getHoveredObjectsForDeletion()
			const originalOpacities = ctx.getOriginalOpacities()

			hoveredObjects.forEach((obj) => {
				const originalOpacity = originalOpacities.get(obj)
				if (originalOpacity !== undefined) {
					obj.set({ opacity: originalOpacity })
				}
			})

			ctx.setHoveredObjectsForDeletion([])
			ctx.setOriginalOpacities(new Map())

			// Find and highlight objects under cursor
			const newHoveredObjects: fabric.Object[] = []
			const newOriginalOpacities = new Map<fabric.Object, number>()

			canvas.forEachObject((obj) => {
				if (obj.containsPoint(pointer) && !ctx.getEraserTrail().includes(obj)) {
					newOriginalOpacities.set(obj, obj.opacity || 1)
					obj.set({ opacity: 0.5 })
					newHoveredObjects.push(obj)
				}
			})

			ctx.setHoveredObjectsForDeletion(newHoveredObjects)
			ctx.setOriginalOpacities(newOriginalOpacities)

			canvas.renderAll()
		}
	}
}

/**
 * Setup all canvas event handlers
 */
export const setupCanvasEvents = (canvas: fabric.Canvas, ctx: CanvasEventContext) => {
	canvas.on('object:moving', createObjectMovingHandler(ctx))
	canvas.on('object:scaling', createObjectScalingHandler(ctx))
	canvas.on('object:rotating', createObjectRotatingHandler(ctx))
	canvas.on('object:modified', createObjectModifiedHandler(ctx))
	canvas.on('mouse:up', createMouseUpHandler(canvas, ctx))
	canvas.on('path:created', createPathCreatedHandler(ctx))
	canvas.on('text:changed', createTextChangedHandler(ctx))
	canvas.on('text:editing:exited', createTextEditingExitedHandler(ctx))
	canvas.on('selection:created', createSelectionCreatedHandler(ctx))
	canvas.on('selection:updated', createSelectionUpdatedHandler(ctx))
	canvas.on('selection:cleared', createSelectionClearedHandler(ctx))
	canvas.on('mouse:wheel', createMouseWheelHandler(canvas, ctx))
	canvas.on('mouse:down', createMouseDownHandler(canvas, ctx))
	canvas.on('mouse:move', createMouseMoveHandler(canvas, ctx))
}
