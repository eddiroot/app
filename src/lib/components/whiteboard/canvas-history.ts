import type { Canvas, FabricObject } from 'fabric';
import type { HistoryAction } from './types';

/**
 * History manager for tracking user actions on the canvas
 * Supports undo/redo operations for collaborative whiteboards
 */
export class CanvasHistory {
    private undoStack: HistoryAction[] = [];
    private redoStack: HistoryAction[] = [];
    private maxHistorySize = 50; // Limit history to prevent memory issues

    /**
     * Record an action to the undo stack
     */
    recordAction(action: HistoryAction) {
        this.undoStack.push(action);

        // Clear redo stack when a new action is performed
        this.redoStack = [];

        // Limit stack size
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
    }

    /**
     * Record an add action
     */
    recordAdd(objectId: string, objectData: Record<string, unknown>) {
        this.recordAction({
            type: 'add',
            objectId,
            objectData,
            timestamp: Date.now()
        });
    }

    /**
     * Record a modify action
     */
    recordModify(
        objectId: string,
        previousData: Record<string, unknown>,
        newData: Record<string, unknown>
    ) {
        this.recordAction({
            type: 'modify',
            objectId,
            previousData,
            objectData: newData,
            timestamp: Date.now()
        });
    }

    /**
     * Record a delete action
     */
    recordDelete(objectId: string, objectData: Record<string, unknown>) {
        this.recordAction({
            type: 'delete',
            objectId,
            objectData,
            timestamp: Date.now()
        });
    }

    /**
     * Undo the last action
     * Returns the action that was undone, or null if no action to undo
     */
    undo(): HistoryAction | null {
        const action = this.undoStack.pop();
        if (!action) return null;

        // Move to redo stack
        this.redoStack.push(action);

        return action;
    }

    /**
     * Redo the last undone action
     * Returns the action that was redone, or null if no action to redo
     */
    redo(): HistoryAction | null {
        const action = this.redoStack.pop();
        if (!action) return null;

        // Move back to undo stack
        this.undoStack.push(action);

        return action;
    }

    /**
     * Check if undo is available
     */
    canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    /**
     * Check if redo is available
     */
    canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    /**
     * Clear all history
     */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Get the undo stack (for debugging)
     */
    getUndoStack(): HistoryAction[] {
        return [...this.undoStack];
    }

    /**
     * Get the redo stack (for debugging)
     */
    getRedoStack(): HistoryAction[] {
        return [...this.redoStack];
    }
}

/**
 * Apply an undo action to the canvas
 */
export async function applyUndo(
    canvas: Canvas,
    action: HistoryAction,
    sendCanvasUpdate: (data: Record<string, unknown>) => void
): Promise<void> {
    if (action.type === 'add') {
        // Undo an add = delete the object
        const objects = canvas.getObjects();
        // @ts-expect-error - custom id property
        const obj = objects.find((o) => o.id === action.objectId);
        if (obj) {
            canvas.remove(obj);
            canvas.renderAll();

            sendCanvasUpdate({
                type: 'delete',
                objects: [{ id: action.objectId }]
            });
        }
    } else if (action.type === 'delete') {
        // Undo a delete = restore the object
        if (action.objectData) {
            // Recreate the object from stored data
            await restoreObjectFromData(canvas, action.objectData, sendCanvasUpdate);
        }
    } else if (action.type === 'modify') {
        // Undo a modify = restore previous state
        if (action.previousData) {
            const objects = canvas.getObjects();
            // @ts-expect-error - custom id property
            const obj = objects.find((o) => o.id === action.objectId);
            if (obj) {
                // Update object with previous data
                obj.set(action.previousData as Partial<FabricObject>);
                canvas.renderAll();

                const objData = obj.toObject();
                // @ts-expect-error - custom id property
                objData.id = obj.id;
                sendCanvasUpdate({
                    type: 'modify',
                    object: objData
                });
            }
        }
    }
}

/**
 * Apply a redo action to the canvas
 */
export async function applyRedo(
    canvas: Canvas,
    action: HistoryAction,
    sendCanvasUpdate: (data: Record<string, unknown>) => void
): Promise<void> {
    if (action.type === 'add') {
        // Redo an add = restore the object
        if (action.objectData) {
            await restoreObjectFromData(canvas, action.objectData, sendCanvasUpdate);
        }
    } else if (action.type === 'delete') {
        // Redo a delete = delete the object again
        const objects = canvas.getObjects();
        // @ts-expect-error - custom id property
        const obj = objects.find((o) => o.id === action.objectId);
        if (obj) {
            canvas.remove(obj);
            canvas.renderAll();

            sendCanvasUpdate({
                type: 'delete',
                objects: [{ id: action.objectId }]
            });
        }
    } else if (action.type === 'modify') {
        // Redo a modify = apply the new state
        if (action.objectData) {
            const objects = canvas.getObjects();
            // @ts-expect-error - custom id property
            const obj = objects.find((o) => o.id === action.objectId);
            if (obj) {
                obj.set(action.objectData as Partial<FabricObject>);
                canvas.renderAll();

                const objData = obj.toObject();
                // @ts-expect-error - custom id property
                objData.id = obj.id;
                sendCanvasUpdate({
                    type: 'modify',
                    object: objData
                });
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
    const { util } = await import('fabric');
    const objects = await util.enlivenObjects([objectData]);

    if (objects && objects.length > 0) {
        const obj = objects[0];
        if (obj && typeof obj === 'object' && 'id' in obj) {
            // @ts-expect-error - custom id property
            obj.id = objectData.id;
            // @ts-expect-error - Type assertion needed for enliven result
            canvas.add(obj);
            canvas.renderAll();

            sendCanvasUpdate({
                type: 'add',
                object: objectData
            });
        }
    }
}
