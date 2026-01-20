import type { Canvas, FabricObject } from 'fabric'
import type { ControlPointManager } from './control-points'

/**
 * Command interface for the Command Pattern
 * Each command represents an undoable/redoable action
 */
export interface Command {
	type: 'add' | 'modify' | 'delete' | 'batch-delete' | 'layer'
	objectId: string
	userId: string
	timestamp: number
	// For add: the object data to add
	// For delete: the object data that was deleted (needed to restore)
	objectData: Record<string, unknown>
	// For modify: the state before the modification (needed to undo)
	beforeState?: Record<string, unknown>
	// For modify: the state after the modification (needed to redo)
	afterState?: Record<string, unknown>
	// For batch-delete: array of objects that were deleted together
	batchObjects?: Array<{ id: string; data: Record<string, unknown> }>
	// For layer: the previous and new z-index
	previousIndex?: number
	newIndex?: number
}

/**
 * History manager using Command Pattern for tracking user actions on the canvas
 * Supports undo/redo operations for collaborative whiteboards
 * Each user maintains their own undo/redo history
 */
export class CanvasHistory {
	private undoStack: Command[] = []
	private redoStack: Command[] = []
	private maxHistorySize = 50
	private currentUserId: string = ''

	/**
	 * Set the current user ID for filtering history operations
	 */
	setCurrentUserId(userId: string) {
		this.currentUserId = userId
	}

	/**
	 * Get the current user ID
	 */
	getCurrentUserId(): string {
		return this.currentUserId
	}

	/**
	 * Push a command to the undo stack
	 */
	private pushCommand(command: Command) {
		this.undoStack.push(command)

		// Clear redo stack when a new action is performed by this user
		if (command.userId === this.currentUserId) {
			this.redoStack = this.redoStack.filter((c) => c.userId !== this.currentUserId)
		}

		// Limit stack size
		if (this.undoStack.length > this.maxHistorySize) {
			this.undoStack.shift()
		}
	}

	/**
	 * Record an add command (object was created)
	 */
	recordAdd(objectId: string, objectData: Record<string, unknown>, userId: string) {
		this.pushCommand({
			type: 'add',
			objectId,
			objectData,
			timestamp: Date.now(),
			userId
		})
	}

	/**
	 * Record a modify command (object was changed)
	 */
	recordModify(
		objectId: string,
		beforeState: Record<string, unknown>,
		afterState: Record<string, unknown>,
		userId: string
	) {
		this.pushCommand({
			type: 'modify',
			objectId,
			objectData: afterState, // Store current state as objectData for consistency
			beforeState,
			afterState,
			timestamp: Date.now(),
			userId
		})
	}

	/**
	 * Record a delete command (object was removed)
	 */
	recordDelete(objectId: string, objectData: Record<string, unknown>, userId: string) {
		this.pushCommand({
			type: 'delete',
			objectId,
			objectData,
			timestamp: Date.now(),
			userId
		})
	}

	/**
	 * Record a batch delete command (multiple objects were removed together, e.g., eraser or clear all)
	 */
	recordBatchDelete(objects: Array<{ id: string; data: Record<string, unknown> }>, userId: string) {
		if (objects.length === 0) return
		this.pushCommand({
			type: 'batch-delete',
			objectId: 'batch-' + Date.now(), // Unique ID for the batch
			objectData: {}, // Not used for batch
			batchObjects: objects,
			timestamp: Date.now(),
			userId
		})
	}

	/**
	 * Record a layer change command (object z-index was changed)
	 */
	recordLayer(objectId: string, previousIndex: number, newIndex: number, userId: string) {
		this.pushCommand({
			type: 'layer',
			objectId,
			objectData: {}, // Not used for layer
			previousIndex,
			newIndex,
			timestamp: Date.now(),
			userId
		})
	}

	/**
	 * Undo the last action by the current user
	 * Returns the command that was undone, or null if no command to undo
	 */
	undo(): Command | null {
		// Find the last command by the current user
		const userCommands = this.undoStack
			.map((command, index) => ({ command, index }))
			.filter(({ command }) => command.userId === this.currentUserId)

		if (userCommands.length === 0) return null

		const { command, index } = userCommands[userCommands.length - 1]

		// Remove from undo stack
		this.undoStack.splice(index, 1)

		// Move to redo stack
		this.redoStack.push(command)

		return command
	}

	/**
	 * Redo the last undone action by the current user
	 * Returns the command that was redone, or null if no command to redo
	 */
	redo(): Command | null {
		// Find the last undone command by the current user
		const userCommands = this.redoStack
			.map((command, index) => ({ command, index }))
			.filter(({ command }) => command.userId === this.currentUserId)

		if (userCommands.length === 0) return null

		const { command, index } = userCommands[userCommands.length - 1]

		// Remove from redo stack
		this.redoStack.splice(index, 1)

		// Move back to undo stack
		this.undoStack.push(command)

		return command
	}

	/**
	 * Check if undo is available for the current user
	 */
	canUndo(): boolean {
		return this.undoStack.some((command) => command.userId === this.currentUserId)
	}

	/**
	 * Check if redo is available for the current user
	 */
	canRedo(): boolean {
		return this.redoStack.some((command) => command.userId === this.currentUserId)
	}

	/**
	 * Clear all history
	 */
	clear() {
		this.undoStack = []
		this.redoStack = []
	}

	/**
	 * Get the undo stack (for debugging)
	 */
	getUndoStack(): Command[] {
		return [...this.undoStack]
	}

	/**
	 * Get the redo stack (for debugging)
	 */
	getRedoStack(): Command[] {
		return [...this.redoStack]
	}
}

/**
 * Apply an undo command to the canvas
 * This function directly manipulates the canvas without triggering fabric.js events
 * that would cause recursive history recording
 */
export async function applyUndo(
	canvas: Canvas,
	command: Command,
	sendCanvasUpdate: (data: Record<string, unknown>) => void,
	controlPointManager?: ControlPointManager
): Promise<void> {
	if (command.type === 'add') {
		// Undo an add = delete the object
		const objects = canvas.getObjects()
		// @ts-expect-error - custom id property
		const obj = objects.find((o) => o.id === command.objectId)
		if (obj) {
			// Remove control points for this object
			controlPointManager?.removeControlPoints(command.objectId)
			canvas.remove(obj)
			canvas.renderAll()

			sendCanvasUpdate({
				type: 'delete',
				objects: [{ id: command.objectId }]
			})
		}
	} else if (command.type === 'delete') {
		// Undo a delete = restore the object
		if (command.objectData) {
			await restoreObjectFromData(canvas, command.objectData, sendCanvasUpdate, controlPointManager)
		}
	} else if (command.type === 'modify') {
		// Undo a modify = restore the before state
		if (command.beforeState) {
			const objects = canvas.getObjects()
			// @ts-expect-error - custom id property
			const obj = objects.find((o) => o.id === command.objectId)
			if (obj) {
				// Apply the before state
				obj.set(command.beforeState as Partial<FabricObject>)
				obj.setCoords()

				// Update control points if they exist
				controlPointManager?.updateControlPoints(command.objectId, obj)

				canvas.renderAll()

				// Send update to other users
				const objData = obj.toObject()
				// @ts-expect-error - custom id property
				objData.id = obj.id
				sendCanvasUpdate({
					type: 'modify',
					object: objData
				})
			}
		}
	} else if (command.type === 'batch-delete') {
		// Undo a batch delete = restore all objects
		if (command.batchObjects && command.batchObjects.length > 0) {
			for (const objInfo of command.batchObjects) {
				await restoreObjectFromData(canvas, objInfo.data, sendCanvasUpdate, controlPointManager)
			}
		}
	} else if (command.type === 'layer') {
		// Undo a layer change = move object back to previous position
		if (command.previousIndex !== undefined) {
			const objects = canvas.getObjects()
			// @ts-expect-error - custom id property
			const obj = objects.find((o) => o.id === command.objectId)
			if (obj) {
				// Move object to previous z-index using remove and insertAt
				const currentIndex = objects.indexOf(obj)
				if (currentIndex !== command.previousIndex) {
					canvas.remove(obj)
					canvas.insertAt(command.previousIndex, obj)
				}
				// Ensure control points stay on top
				controlPointManager?.bringAllControlPointsToFront()
				canvas.renderAll()

				// Send layer update to other users
				const objData = obj.toObject()
				// @ts-expect-error - custom id property
				objData.id = obj.id
				sendCanvasUpdate({
					type: 'layer',
					action: 'moveTo',
					object: objData,
					index: command.previousIndex
				})
			}
		}
	}
}

/**
 * Apply a redo command to the canvas
 * This function directly manipulates the canvas without triggering fabric.js events
 */
export async function applyRedo(
	canvas: Canvas,
	command: Command,
	sendCanvasUpdate: (data: Record<string, unknown>) => void,
	controlPointManager?: ControlPointManager
): Promise<void> {
	if (command.type === 'add') {
		// Redo an add = restore the object
		if (command.objectData) {
			await restoreObjectFromData(canvas, command.objectData, sendCanvasUpdate, controlPointManager)
		}
	} else if (command.type === 'delete') {
		// Redo a delete = delete the object again
		const objects = canvas.getObjects()
		// @ts-expect-error - custom id property
		const obj = objects.find((o) => o.id === command.objectId)
		if (obj) {
			// Remove control points for this object
			controlPointManager?.removeControlPoints(command.objectId)
			canvas.remove(obj)
			canvas.renderAll()

			sendCanvasUpdate({
				type: 'delete',
				objects: [{ id: command.objectId }]
			})
		}
	} else if (command.type === 'modify') {
		// Redo a modify = apply the after state
		if (command.afterState) {
			const objects = canvas.getObjects()
			// @ts-expect-error - custom id property
			const obj = objects.find((o) => o.id === command.objectId)
			if (obj) {
				obj.set(command.afterState as Partial<FabricObject>)
				obj.setCoords()

				// Update control points if they exist
				controlPointManager?.updateControlPoints(command.objectId, obj)

				canvas.renderAll()

				// Send update to other users
				const objData = obj.toObject()
				// @ts-expect-error - custom id property
				objData.id = obj.id
				sendCanvasUpdate({
					type: 'modify',
					object: objData
				})
			}
		}
	} else if (command.type === 'batch-delete') {
		// Redo a batch delete = delete all objects again
		if (command.batchObjects && command.batchObjects.length > 0) {
			const objects = canvas.getObjects()
			const deletedIds: string[] = []
			for (const objInfo of command.batchObjects) {
				// @ts-expect-error - custom id property
				const obj = objects.find((o) => o.id === objInfo.id)
				if (obj) {
					// Remove control points for this object
					controlPointManager?.removeControlPoints(objInfo.id)
					canvas.remove(obj)
					deletedIds.push(objInfo.id)
				}
			}
			canvas.renderAll()

			if (deletedIds.length > 0) {
				sendCanvasUpdate({
					type: 'delete',
					objects: deletedIds.map((id) => ({ id }))
				})
			}
		}
	} else if (command.type === 'layer') {
		// Redo a layer change = move object to new position
		if (command.newIndex !== undefined) {
			const objects = canvas.getObjects()
			// @ts-expect-error - custom id property
			const obj = objects.find((o) => o.id === command.objectId)
			if (obj) {
				// Move object to new z-index using remove and insertAt
				const currentIndex = objects.indexOf(obj)
				if (currentIndex !== command.newIndex) {
					canvas.remove(obj)
					canvas.insertAt(command.newIndex, obj)
				}
				// Ensure control points stay on top
				controlPointManager?.bringAllControlPointsToFront()
				canvas.renderAll()

				// Send layer update to other users
				const objData = obj.toObject()
				// @ts-expect-error - custom id property
				objData.id = obj.id
				sendCanvasUpdate({
					type: 'layer',
					action: 'moveTo',
					object: objData,
					index: command.newIndex
				})
			}
		}
	}
}

/**
 * Restore an object from serialized data
 */
async function restoreObjectFromData(
	canvas: Canvas,
	objectData: Record<string, unknown>,
	sendCanvasUpdate: (data: Record<string, unknown>) => void,
	controlPointManager?: ControlPointManager
): Promise<void> {
	// Use Fabric's enlivenObjects to recreate the object
	const { util } = await import('fabric')
	const objects = await util.enlivenObjects([objectData])

	if (objects && objects.length > 0) {
		const obj = objects[0]
		if (obj && typeof obj === 'object' && 'id' in obj) {
			// @ts-expect-error - custom id property
			obj.id = objectData.id
			// Disable default fabric.js controls and borders - we use custom control points
			// @ts-expect-error - Type assertion needed for enliven result
			obj.set({
				hasControls: false,
				hasBorders: false
			})
			// Ensure images use center origin
			// @ts-expect-error - Type assertion needed for enliven result
			if (obj.type === 'image') {
				// @ts-expect-error - Type assertion needed for enliven result
				obj.set({
					originX: 'center',
					originY: 'center'
				})
			}
			// @ts-expect-error - Type assertion needed for enliven result
			canvas.add(obj)

			// If this object is selected, add control points
			const activeObject = canvas.getActiveObject()
			// @ts-expect-error - Type assertion needed
			if (activeObject && activeObject.id === objectData.id && controlPointManager) {
				// @ts-expect-error - Type assertion needed
				controlPointManager.addControlPoints(objectData.id as string, obj, true)
			}

			canvas.renderAll()

			sendCanvasUpdate({
				type: 'add',
				object: objectData
			})
		}
	}
}

// Legacy type alias for backwards compatibility
export type HistoryAction = Command
