import type { Canvas, FabricObject } from 'fabric'

/**
 * Command interface for the Command Pattern
 * Each command represents an undoable/redoable action
 */
export interface Command {
	type: 'add' | 'modify' | 'delete'
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
	sendCanvasUpdate: (data: Record<string, unknown>) => void
): Promise<void> {
	if (command.type === 'add') {
		// Undo an add = delete the object
		const objects = canvas.getObjects()
		// @ts-expect-error - custom id property
		const obj = objects.find((o) => o.id === command.objectId)
		if (obj) {
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
			await restoreObjectFromData(canvas, command.objectData, sendCanvasUpdate)
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
	}
}

/**
 * Apply a redo command to the canvas
 * This function directly manipulates the canvas without triggering fabric.js events
 */
export async function applyRedo(
	canvas: Canvas,
	command: Command,
	sendCanvasUpdate: (data: Record<string, unknown>) => void
): Promise<void> {
	if (command.type === 'add') {
		// Redo an add = restore the object
		if (command.objectData) {
			await restoreObjectFromData(canvas, command.objectData, sendCanvasUpdate)
		}
	} else if (command.type === 'delete') {
		// Redo a delete = delete the object again
		const objects = canvas.getObjects()
		// @ts-expect-error - custom id property
		const obj = objects.find((o) => o.id === command.objectId)
		if (obj) {
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
	}
}

/**
 * Restore an object from serialized data
 */
async function restoreObjectFromData(
	canvas: Canvas,
	objectData: Record<string, unknown>,
	sendCanvasUpdate: (data: Record<string, unknown>) => void
): Promise<void> {
	// Use Fabric's enlivenObjects to recreate the object
	const { util } = await import('fabric')
	const objects = await util.enlivenObjects([objectData])

	if (objects && objects.length > 0) {
		const obj = objects[0]
		if (obj && typeof obj === 'object' && 'id' in obj) {
			// @ts-expect-error - custom id property
			obj.id = objectData.id
			// @ts-expect-error - Type assertion needed for enliven result
			canvas.add(obj)
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
