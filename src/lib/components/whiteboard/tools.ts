import * as fabric from 'fabric';
import type { WhiteboardTool } from './types';

/**
 * Interface for tool state that needs to be modified
 */
export interface ToolState {
	selectedTool: WhiteboardTool;
	showFloatingMenu: boolean;
	isDrawingShape: boolean;
	isDrawingText: boolean;
	currentShapeType: string;
	eraserTrail: fabric.Object[];
	lastEraserPoint: { x: number; y: number } | null;
	hoveredObjectsForDeletion: fabric.Object[];
	originalOpacities: Map<fabric.Object, number>;
	tempShape: fabric.Object | null;
	tempText: fabric.Textbox | null;
}

/**
 * Set the select tool
 */
export function setSelectTool(
	canvas: fabric.Canvas | undefined,
	state: ToolState,
	clearEraserState: () => void,
	clearShapeDrawingState: () => void,
	clearTextDrawingState: () => void,
): void {
	state.selectedTool = 'select';
	state.showFloatingMenu = false;
	clearEraserState();
	clearShapeDrawingState();
	clearTextDrawingState();
	if (!canvas) return;
	canvas.isDrawingMode = false;
	canvas.selection = true;
	canvas.defaultCursor = 'default';
	canvas.hoverCursor = 'move';
	state.selectedTool = 'select';
	state.showFloatingMenu = false;
	clearEraserState();
	clearShapeDrawingState();
	clearTextDrawingState();
	if (!canvas) return;
	canvas.isDrawingMode = false;
	canvas.selection = true;
	canvas.defaultCursor = 'default';
	canvas.hoverCursor = 'move';
}

/**
 * Set the pan tool
 */
export function setPanTool(
	canvas: fabric.Canvas | undefined,
	state: ToolState,
	clearEraserState: () => void,
	clearShapeDrawingState: () => void,
	clearTextDrawingState: () => void,
): void {
	state.selectedTool = 'pan';
	state.showFloatingMenu = false;
	clearEraserState();
	clearShapeDrawingState();
	clearTextDrawingState();
	if (!canvas) return;
	canvas.isDrawingMode = false;
	canvas.selection = false;
	canvas.discardActiveObject();
	canvas.defaultCursor = 'grab';
	canvas.hoverCursor = 'grab';
	state.selectedTool = 'pan';
	state.showFloatingMenu = false;
	clearEraserState();
	clearShapeDrawingState();
	clearTextDrawingState();
	if (!canvas) return;
	canvas.isDrawingMode = false;
	canvas.selection = false;
	canvas.discardActiveObject();
	canvas.defaultCursor = 'grab';
	canvas.hoverCursor = 'grab';
}

/**
 * Set the draw tool
 */
export function setDrawTool(
	canvas: fabric.Canvas | undefined,
	state: ToolState,
	clearEraserState: () => void,
	clearShapeDrawingState: () => void,
	clearTextDrawingState: () => void,
): void {
	state.selectedTool = 'draw';
	state.showFloatingMenu = true;
	clearEraserState();
	clearShapeDrawingState();
	clearTextDrawingState();
	if (!canvas) return;
	canvas.isDrawingMode = true;
	canvas.selection = false;
	canvas.defaultCursor = 'crosshair';
	state.selectedTool = 'draw';
	state.showFloatingMenu = true;
	clearEraserState();
	clearShapeDrawingState();
	clearTextDrawingState();
	if (!canvas) return;
	canvas.isDrawingMode = true;
	canvas.selection = false;
	canvas.defaultCursor = 'crosshair';

	canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
	canvas.freeDrawingBrush.width = 2;
	canvas.freeDrawingBrush.color = '#000000';
	canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
	canvas.freeDrawingBrush.width = 2;
	canvas.freeDrawingBrush.color = '#000000';
}

/**
 * Set the eraser tool
 */
export function setEraserTool(
	canvas: fabric.Canvas | undefined,
	state: ToolState,
	clearShapeDrawingState: () => void,
	clearTextDrawingState: () => void,
	clearEraserState: () => void,
): void {
	state.selectedTool = 'eraser';
	state.showFloatingMenu = true;
	clearShapeDrawingState();
	clearTextDrawingState();
	if (!canvas) return;
	canvas.isDrawingMode = false;
	canvas.selection = false;
	canvas.defaultCursor = 'crosshair';
	state.selectedTool = 'eraser';
	state.showFloatingMenu = true;
	clearShapeDrawingState();
	clearTextDrawingState();
	if (!canvas) return;
	canvas.isDrawingMode = false;
	canvas.selection = false;
	canvas.defaultCursor = 'crosshair';

	// Clear any existing eraser state
	clearEraserState();
	// Clear any existing eraser state
	clearEraserState();
}

/**
 * Set the line tool
 */
export function setLineTool(
	canvas: fabric.Canvas | undefined,
	state: ToolState,
	clearEraserState: () => void,
	clearShapeDrawingState: () => void,
	clearTextDrawingState: () => void,
): void {
	state.selectedTool = 'line';
	state.showFloatingMenu = true;
	clearEraserState();
	clearShapeDrawingState();
	clearTextDrawingState();
	if (!canvas) return;
	canvas.isDrawingMode = false;
	canvas.selection = false;
	canvas.defaultCursor = 'crosshair';
	canvas.hoverCursor = 'crosshair';
	state.selectedTool = 'line';
	state.showFloatingMenu = true;
	clearEraserState();
	clearShapeDrawingState();
	clearTextDrawingState();
	if (!canvas) return;
	canvas.isDrawingMode = false;
	canvas.selection = false;
	canvas.defaultCursor = 'crosshair';
	canvas.hoverCursor = 'crosshair';
}

/**
 * Clear eraser state (trail and hovered objects)
 */
export function clearEraserState(
	canvas: fabric.Canvas | undefined,
	state: ToolState,
): void {
	// Remove eraser trail
	state.eraserTrail.forEach((trail) => canvas?.remove(trail));
	state.eraserTrail = [];
	state.lastEraserPoint = null;

	// Restore original opacities of hovered objects
	state.hoveredObjectsForDeletion.forEach((obj) => {
		const originalOpacity = state.originalOpacities.get(obj);
		if (originalOpacity !== undefined) {
			obj.set({ opacity: originalOpacity });
		}
	});
	state.hoveredObjectsForDeletion = [];
	state.originalOpacities.clear();
	// Restore original opacities of hovered objects
	state.hoveredObjectsForDeletion.forEach((obj) => {
		const originalOpacity = state.originalOpacities.get(obj);
		if (originalOpacity !== undefined) {
			obj.set({ opacity: originalOpacity });
		}
	});
	state.hoveredObjectsForDeletion = [];
	state.originalOpacities.clear();

	canvas?.renderAll();
	canvas?.renderAll();
}

/**
 * Clear shape drawing state
 */
export function clearShapeDrawingState(
	canvas: fabric.Canvas | undefined,
	state: ToolState,
): void {
	if (state.tempShape) {
		canvas?.remove(state.tempShape);
		state.tempShape = null;
	}
	state.isDrawingShape = false;
	state.currentShapeType = '';
}

/**
 * Clear text drawing state
 */
export function clearTextDrawingState(
	canvas: fabric.Canvas | undefined,
	state: ToolState,
): void {
	if (state.tempText) {
		canvas?.remove(state.tempText);
		state.tempText = null;
	}
	state.isDrawingText = false;
}

/**
 * Add shape tool (rectangle, circle, triangle)
 */
export function addShape(
	canvas: fabric.Canvas | undefined,
	shapeType: string,
	state: ToolState,
	clearEraserState: () => void,
): void {
	if (!canvas) return;
	if (!canvas) return;

	// Set up interactive shape drawing mode
	state.selectedTool = 'shapes';
	state.currentShapeType = shapeType;
	state.showFloatingMenu = true;
	clearEraserState();
	// Set up interactive shape drawing mode
	state.selectedTool = 'shapes';
	state.currentShapeType = shapeType;
	state.showFloatingMenu = true;
	clearEraserState();

	canvas.isDrawingMode = false;
	canvas.selection = false;
	canvas.defaultCursor = 'crosshair';
	canvas.hoverCursor = 'crosshair';
	canvas.isDrawingMode = false;
	canvas.selection = false;
	canvas.defaultCursor = 'crosshair';
	canvas.hoverCursor = 'crosshair';
}

/**
 * Add text tool
 */
export function addText(
	canvas: fabric.Canvas | undefined,
	state: ToolState,
	clearEraserState: () => void,
	clearShapeDrawingState: () => void,
): void {
	if (!canvas) return;
	if (!canvas) return;

	// Set up interactive text creation mode
	state.selectedTool = 'text';
	state.showFloatingMenu = true;
	clearEraserState();
	clearShapeDrawingState();
	// Set up interactive text creation mode
	state.selectedTool = 'text';
	state.showFloatingMenu = true;
	clearEraserState();
	clearShapeDrawingState();

	canvas.isDrawingMode = false;
	canvas.selection = false;
	canvas.defaultCursor = 'crosshair';
	canvas.hoverCursor = 'crosshair';
	canvas.isDrawingMode = false;
	canvas.selection = false;
	canvas.defaultCursor = 'crosshair';
	canvas.hoverCursor = 'crosshair';
}

/**
 * Set up image tool (shows menu and triggers upload)
 */
export function setImageTool(
	canvas: fabric.Canvas | undefined,
	state: ToolState,
	clearEraserState: () => void,
	clearShapeDrawingState: () => void,
	clearTextDrawingState: () => void,
): void {
	if (!canvas) return;
	if (!canvas) return;

	// Set image tool mode
	state.selectedTool = 'image';
	state.showFloatingMenu = true;
	clearEraserState();
	clearShapeDrawingState();
	clearTextDrawingState();
	// Set image tool mode
	state.selectedTool = 'image';
	state.showFloatingMenu = true;
	clearEraserState();
	clearShapeDrawingState();
	clearTextDrawingState();

	canvas.isDrawingMode = false;
	canvas.selection = false;
	canvas.defaultCursor = 'default';
	canvas.hoverCursor = 'move';
	canvas.isDrawingMode = false;
	canvas.selection = false;
	canvas.defaultCursor = 'default';
	canvas.hoverCursor = 'move';
}

/**
 * Trigger image upload
 */
export function addImage(imageInput: HTMLInputElement | undefined): void {
	if (!imageInput) return;
	imageInput.click();
	if (!imageInput) return;
	imageInput.click();
}
