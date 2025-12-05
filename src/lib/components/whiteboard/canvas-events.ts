import * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { ZOOM_LIMITS } from './constants';
import {
	configurePathControls,
	recalculateArrowControlPositions,
	recalculateLineControlPositions
} from './object-controls';
import * as Shapes from './shapes';
import type {
	DrawOptions,
	LineArrowOptions,
	ShapeOptions,
	TextOptions,
	WhiteboardTool
} from './types';

/**
 * Context object containing all state and callbacks needed by event handlers
 */
export interface CanvasEventContext {
	// State refs (getters/setters for reactive state)
	getSelectedTool: () => WhiteboardTool;
	setSelectedTool: (tool: WhiteboardTool) => void;
	getShowFloatingMenu: () => boolean;
	setShowFloatingMenu: (value: boolean) => void;
	getIsMovingImage: () => boolean;
	setIsMovingImage: (value: boolean) => void;
	getIsPanMode: () => boolean;
	setIsPanMode: (value: boolean) => void;
	getPanStartPos: () => { x: number; y: number };
	setPanStartPos: (pos: { x: number; y: number }) => void;
	getCurrentZoom: () => number;
	setCurrentZoom: (zoom: number) => void;
	getIsDrawingLine: () => boolean;
	setIsDrawingLine: (value: boolean) => void;
	getIsDrawingArrow: () => boolean;
	setIsDrawingArrow: (value: boolean) => void;
	getIsDrawingShape: () => boolean;
	setIsDrawingShape: (value: boolean) => void;
	getIsDrawingText: () => boolean;
	setIsDrawingText: (value: boolean) => void;
	getCurrentShapeType: () => string;
	setCurrentShapeType: (type: string) => void;
	getIsErasing: () => boolean;
	setIsErasing: (value: boolean) => void;
	getStartPoint: () => { x: number; y: number };
	setStartPoint: (point: { x: number; y: number }) => void;
	getTempLine: () => fabric.Polyline | fabric.Group | null;
	setTempLine: (line: fabric.Polyline | fabric.Group | null) => void;
	getTempShape: () => fabric.Object | null;
	setTempShape: (shape: fabric.Object | null) => void;
	getTempText: () => fabric.Textbox | null;
	setTempText: (text: fabric.Textbox | null) => void;
	getEraserTrail: () => fabric.Object[];
	setEraserTrail: (trail: fabric.Object[]) => void;
	getLastEraserPoint: () => { x: number; y: number } | null;
	setLastEraserPoint: (point: { x: number; y: number } | null) => void;
	getHoveredObjectsForDeletion: () => fabric.Object[];
	setHoveredObjectsForDeletion: (objects: fabric.Object[]) => void;
	getOriginalOpacities: () => Map<fabric.Object, number>;
	setOriginalOpacities: (map: Map<fabric.Object, number>) => void;

	// Options getters
	getCurrentTextOptions: () => TextOptions;
	getCurrentShapeOptions: () => ShapeOptions;
	getCurrentDrawOptions: () => DrawOptions;
	getCurrentLineArrowOptions: () => LineArrowOptions;

	// Callbacks
	sendCanvasUpdate: (data: Record<string, unknown>) => void;
	sendImageUpdate: (
		objectId: string,
		objectData: Record<string, unknown>,
		immediate: boolean
	) => void;
	clearEraserState: () => void;
	floatingMenuRef?: {
		updateTextOptions?: (options: Partial<TextOptions>) => void;
		updateShapeOptions?: (options: Partial<ShapeOptions>) => void;
		updateLineArrowOptions?: (options: Partial<LineArrowOptions>) => void;
		updateDrawOptions?: (options: Partial<DrawOptions>) => void;
		closeExpandedColors?: () => void;
		setActiveMenuPanel?: (panel: WhiteboardTool) => void;
	};
}

/**
 * Creates object:moving event handler
 */
export const createObjectMovingHandler = (ctx: CanvasEventContext) => {
	return ({ target }: { target: fabric.Object }) => {
		const objData = target.type === 'textbox' ? target.toObject(['text']) : target.toObject();
		// @ts-expect-error - custom id property
		objData.id = target.id;

		// Only throttle image movements, send immediate updates for other objects
		if (target.type === 'image') {
			ctx.setIsMovingImage(true);
			// @ts-expect-error - custom id property
			ctx.sendImageUpdate(target.id, objData, false);
		} else {
			// Immediate updates for non-image objects
			ctx.sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		}
	};
};

/**
 * Creates object:scaling event handler
 */
export const createObjectScalingHandler = (ctx: CanvasEventContext) => {
	return ({ target }: { target: fabric.Object }) => {
		const objData = target.type === 'textbox' ? target.toObject(['text']) : target.toObject();
		// @ts-expect-error - custom id property
		objData.id = target.id;

		// Only throttle image scaling, send immediate updates for other objects
		if (target.type === 'image') {
			ctx.setIsMovingImage(true);
			// @ts-expect-error - custom id property
			ctx.sendImageUpdate(target.id, objData, false);
		} else {
			// Immediate updates for non-image objects
			ctx.sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		}
	};
};

/**
 * Creates object:rotating event handler
 */
export const createObjectRotatingHandler = (ctx: CanvasEventContext) => {
	return ({ target }: { target: fabric.Object }) => {
		const objData = target.type === 'textbox' ? target.toObject(['text']) : target.toObject();
		// @ts-expect-error - custom id property
		objData.id = target.id;

		// Only throttle image rotation, send immediate updates for other objects
		if (target.type === 'image') {
			ctx.setIsMovingImage(true);
			// @ts-expect-error - custom id property
			ctx.sendImageUpdate(target.id, objData, false);
		} else {
			// Immediate updates for non-image objects
			ctx.sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		}
	};
};

/**
 * Creates object:modified event handler
 */
export const createObjectModifiedHandler = (ctx: CanvasEventContext) => {
	return ({ target }: { target: fabric.Object }) => {
		// This handles final modifications - always send immediately for persistence
		// For textbox objects, include the 'text' property
		const objData = target.type === 'textbox' ? target.toObject(['text']) : target.toObject();
		// @ts-expect-error - custom id property
		objData.id = target.id;

		if (target.type === 'image') {
			// @ts-expect-error - custom id property
			ctx.sendImageUpdate(target.id, objData, true);
			ctx.setIsMovingImage(false);
		} else {
			// Immediate updates for non-image objects
			ctx.sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		}
	};
};

/**
 * Creates mouse:up event handler
 */
export const createMouseUpHandler = (canvas: fabric.Canvas, ctx: CanvasEventContext) => {
	return () => {
		if (ctx.getIsPanMode()) {
			ctx.setIsPanMode(false);
			canvas.selection = ctx.getSelectedTool() === 'select';

			// Set cursor based on current tool
			const selectedTool = ctx.getSelectedTool();
			if (selectedTool === 'pan') {
				canvas.setCursor('grab');
			} else if (selectedTool === 'select') {
				canvas.setCursor('default');
			} else if (selectedTool === 'draw') {
				canvas.setCursor('crosshair');
			} else if (selectedTool === 'line' || selectedTool === 'arrow') {
				canvas.setCursor('crosshair');
			} else if (selectedTool === 'shapes') {
				canvas.setCursor('crosshair');
			} else if (selectedTool === 'text') {
				canvas.setCursor('crosshair');
			}
		}

		// Handle text completion
		const tempText = ctx.getTempText();
		if (ctx.getIsDrawingText() && tempText) {
			// Finalize the text
			tempText.set({ selectable: true });
			canvas.setActiveObject(tempText);

			// Enter edit mode immediately after creation
			tempText.enterEditing();
			tempText.selectAll();

			canvas.renderAll();

			// Send the completed text to other users
			const objData = tempText.toObject(['text']);
			// @ts-expect-error - custom id property
			objData.id = tempText.id;
			ctx.sendCanvasUpdate({
				type: 'add',
				object: objData
			});

			// Auto-switch to selection tool while keeping floating menu open
			ctx.setSelectedTool('select');
			canvas.isDrawingMode = false;
			canvas.selection = true;
			canvas.defaultCursor = 'default';
			canvas.hoverCursor = 'move';

			// Show text options in floating menu
			// Use setTimeout to ensure state updates happen after the object is properly selected
			setTimeout(() => {
				ctx.setShowFloatingMenu(true);
				ctx.floatingMenuRef?.setActiveMenuPanel?.('text');
				ctx.floatingMenuRef?.updateTextOptions?.({
					fontSize: tempText.fontSize,
					fontFamily: tempText.fontFamily,
					fontWeight: String(tempText.fontWeight || 'normal'),
					colour: tempText.fill as string,
					textAlign: tempText.textAlign,
					opacity: tempText.opacity || 1
				});
			}, 0);

			// Reset text drawing state
			ctx.setIsDrawingText(false);
			ctx.setTempText(null);
		}

		// Handle shape completion
		const tempShape = ctx.getTempShape();
		if (ctx.getIsDrawingShape() && tempShape) {
			// Finalize the shape
			tempShape.set({ selectable: true });
			canvas.setActiveObject(tempShape);
			canvas.renderAll();

			// Send the completed shape to other users
			const objData = tempShape.toObject();
			// @ts-expect-error - custom id property
			objData.id = tempShape.id;
			ctx.sendCanvasUpdate({
				type: 'add',
				object: objData
			});

			// Auto-switch to selection tool while keeping floating menu open
			ctx.setSelectedTool('select');
			canvas.isDrawingMode = false;
			canvas.selection = true;
			canvas.defaultCursor = 'default';
			canvas.hoverCursor = 'move';

			// Show shape options in floating menu
			// Use setTimeout to ensure state updates happen after the object is properly selected
			setTimeout(() => {
				ctx.setShowFloatingMenu(true);
				ctx.floatingMenuRef?.setActiveMenuPanel?.('shapes');
				ctx.floatingMenuRef?.updateShapeOptions?.({
					strokeWidth: (tempShape.strokeWidth as number) || 2,
					strokeColour: (tempShape.stroke as string) || '#1E1E1E',
					fillColour: (tempShape.fill as string) || 'transparent',
					strokeDashArray: (tempShape.strokeDashArray as number[]) || [],
					opacity: tempShape.opacity || 1
				});
			}, 0);

			// Reset shape drawing state
			ctx.setIsDrawingShape(false);
			ctx.setCurrentShapeType('');
			ctx.setTempShape(null);
		}

		// Handle line and arrow completion
		const tempLine = ctx.getTempLine();
		if ((ctx.getIsDrawingLine() || ctx.getIsDrawingArrow()) && tempLine) {
			const wasDrawingArrow = ctx.getIsDrawingArrow();

			// Set the object as selectable and finish the drawing
			tempLine.set({ selectable: true });

			// Recalculate control positions now that drawing is complete
			if (tempLine.type === 'polyline') {
				recalculateLineControlPositions(tempLine as fabric.Polyline);
			} else if (tempLine.type === 'group') {
				recalculateArrowControlPositions(tempLine as fabric.Group);
			}

			canvas.setActiveObject(tempLine);
			canvas.renderAll();

			// Send the completed line/arrow to other users
			// @ts-expect-error - toObject method exists on both Line and Group
			const objData = tempLine.toObject();
			// @ts-expect-error - custom id property
			objData.id = tempLine.id;
			ctx.sendCanvasUpdate({
				type: 'add',
				object: objData
			});

			// Auto-switch to selection tool while keeping floating menu open
			ctx.setSelectedTool('select');
			canvas.isDrawingMode = false;
			canvas.selection = true;
			canvas.defaultCursor = 'default';
			canvas.hoverCursor = 'move';

			// Show line/arrow options in floating menu
			// Use setTimeout to ensure state updates happen after the object is properly selected
			setTimeout(() => {
				ctx.setShowFloatingMenu(true);
				ctx.floatingMenuRef?.setActiveMenuPanel?.(wasDrawingArrow ? 'arrow' : 'line');

				// Get stroke properties - for arrow groups, get from the line part
				let strokeWidth = 2;
				let strokeColour = '#1E1E1E';
				let strokeDashArray: number[] = [];
				let opacity = 1;

				if (tempLine.type === 'polyline') {
					strokeWidth = (tempLine.strokeWidth as number) || 2;
					strokeColour = (tempLine.stroke as string) || '#1E1E1E';
					strokeDashArray = (tempLine.strokeDashArray as number[]) || [];
					opacity = tempLine.opacity || 1;
				} else if (tempLine.type === 'group') {
					// For arrow groups, get properties from the line object
					const group = tempLine as fabric.Group;
					const lineObj = group.getObjects().find((obj) => obj.type === 'polyline');
					if (lineObj) {
						strokeWidth = (lineObj.strokeWidth as number) || 2;
						strokeColour = (lineObj.stroke as string) || '#1E1E1E';
						strokeDashArray = (lineObj.strokeDashArray as number[]) || [];
						opacity = lineObj.opacity || 1;
					}
				}

				ctx.floatingMenuRef?.updateLineArrowOptions?.({
					strokeWidth,
					strokeColour,
					strokeDashArray,
					opacity
				});
			}, 0);

			// Reset drawing state
			ctx.setIsDrawingLine(false);
			ctx.setIsDrawingArrow(false);
			ctx.setTempLine(null);
		}

		// Handle eraser completion
		if (ctx.getIsErasing()) {
			ctx.setIsErasing(false);

			// Delete all objects that were marked for deletion
			ctx.getHoveredObjectsForDeletion().forEach((obj) => {
				canvas.remove(obj);
				// Send delete message to other users
				ctx.sendCanvasUpdate({
					type: 'delete',
					// @ts-expect-error - custom id property
					object: { id: obj.id }
				});
			});

			// Clear eraser state
			ctx.clearEraserState();
		}

		// If we were moving an image, ensure final position is sent
		if (ctx.getIsMovingImage()) {
			const activeObject = canvas.getActiveObject();
			if (activeObject && activeObject.type === 'image') {
				const objData = activeObject.toObject();
				// @ts-expect-error - custom id property
				objData.id = activeObject.id;
				// @ts-expect-error - custom id property
				ctx.sendImageUpdate(activeObject.id, objData, true);
			}
			ctx.setIsMovingImage(false);
		}
	};
};

/**
 * Creates path:created event handler
 */
export const createPathCreatedHandler = (ctx: CanvasEventContext) => {
	return ({ path }: { path: fabric.Path }) => {
		// @ts-expect-error - custom id property
		path.id = uuidv4();

		// Configure path-specific controls
		configurePathControls(path);

		const objData = path.toObject();
		// @ts-expect-error - custom id property
		objData.id = path.id;
		ctx.sendCanvasUpdate({
			type: 'add',
			object: objData
		});
	};
};

/**
 * Creates text:changed event handler
 * Throttled to avoid sending updates on every keystroke
 */
let textChangeTimeout: ReturnType<typeof setTimeout> | null = null;
export const createTextChangedHandler = (ctx: CanvasEventContext) => {
	return ({ target }: { target: fabric.Object }) => {
		// Clear any pending text update
		if (textChangeTimeout !== null) {
			clearTimeout(textChangeTimeout);
		}

		// Throttle text updates - send after 500ms of no typing
		textChangeTimeout = setTimeout(() => {
			const objData = target.toObject(['text']);
			// @ts-expect-error - custom id property
			objData.id = target.id;
			ctx.sendCanvasUpdate({
				type: 'modify',
				object: objData,
				live: false // Not live, should persist
			});
			textChangeTimeout = null;
		}, 500);

		// Also send a live update immediately (won't be persisted to DB)
		const objData = target.toObject(['text']);
		// @ts-expect-error - custom id property
		objData.id = target.id;
		ctx.sendCanvasUpdate({
			type: 'modify',
			object: objData,
			live: true // Live update, won't persist to DB
		});
	};
};

/**
 * Creates text:editing:exited event handler
 * Ensures final text is sent when user finishes editing
 */
export const createTextEditingExitedHandler = (ctx: CanvasEventContext) => {
	return ({ target }: { target: fabric.Object }) => {
		// Clear any pending throttled update
		if (textChangeTimeout !== null) {
			clearTimeout(textChangeTimeout);
			textChangeTimeout = null;
		}

		// Send final text state immediately when editing ends
		const objData = target.toObject(['text']);
		// @ts-expect-error - custom id property
		objData.id = target.id;
		ctx.sendCanvasUpdate({
			type: 'modify',
			object: objData,
			live: false // Final update, should persist to DB
		});
	};
};

/**
 * Creates selection:created event handler
 */
export const createSelectionCreatedHandler = (ctx: CanvasEventContext) => {
	return ({ selected }: { selected: fabric.Object[] }) => {
		if (selected && selected.length === 1) {
			const obj = selected[0];

			// Show floating menu when an object is selected
			ctx.setShowFloatingMenu(true);

			// Set the active menu panel and sync properties based on object type
			// Do NOT change the selected tool - stay in current mode (usually 'select')
			if (obj.type === 'textbox') {
				// Show text options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('text');
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
				});
			} else if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'triangle') {
				// Show shape options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('shapes');
				// Sync shape properties to menu
				ctx.floatingMenuRef?.updateShapeOptions?.({
					strokeWidth: obj.strokeWidth || 2,
					strokeColour: obj.stroke?.toString() || '#4A5568',
					fillColour: obj.fill?.toString() || 'transparent',
					strokeDashArray: obj.strokeDashArray || [],
					opacity: obj.opacity ?? 1
				});
			} else if (obj.type === 'polyline') {
				// Show line options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('line');
				// Sync line properties to menu
				ctx.floatingMenuRef?.updateLineArrowOptions?.({
					strokeWidth: obj.strokeWidth || 2,
					strokeColour: obj.stroke?.toString() || '#4A5568',
					strokeDashArray: obj.strokeDashArray || [],
					opacity: obj.opacity ?? 1
				});
			} else if (obj.type === 'group') {
				// Arrows are groups - show arrow options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('arrow');
				// Sync arrow properties from the line in the group
				const groupObj = obj as fabric.Group;
				const lineObj = groupObj.getObjects().find((o) => o.type === 'polyline');
				if (lineObj) {
					ctx.floatingMenuRef?.updateLineArrowOptions?.({
						strokeWidth: lineObj.strokeWidth || 2,
						strokeColour: lineObj.stroke?.toString() || '#4A5568',
						strokeDashArray: lineObj.strokeDashArray || [],
						opacity: lineObj.opacity ?? 1
					});
				}
			} else if (obj.type === 'path') {
				// Drawn paths (freehand drawing) - show draw options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('draw');
				// Sync path properties to menu
				ctx.floatingMenuRef?.updateDrawOptions?.({
					brushSize: obj.strokeWidth || 6,
					brushColour: obj.stroke?.toString() || '#4A5568',
					opacity: obj.opacity ?? 1
				});
			} else if (obj.type === 'image') {
				// Images - show image options panel (only opacity applies)
				ctx.floatingMenuRef?.setActiveMenuPanel?.('image');
				// Sync image properties to menu (only opacity makes sense)
				ctx.floatingMenuRef?.updateShapeOptions?.({
					opacity: obj.opacity ?? 1
				});
			}
		}
	};
};

/**
 * Creates selection:updated event handler
 */
export const createSelectionUpdatedHandler = (ctx: CanvasEventContext) => {
	return ({ selected }: { selected: fabric.Object[] }) => {
		if (selected && selected.length === 1) {
			const obj = selected[0];

			// Show floating menu when an object is selected
			ctx.setShowFloatingMenu(true);

			// Set the active menu panel and sync properties based on object type
			// Do NOT change the selected tool - stay in current mode (usually 'select')
			if (obj.type === 'textbox') {
				// Show text options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('text');
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
				});
			} else if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'triangle') {
				// Show shape options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('shapes');
				// Sync shape properties to menu
				ctx.floatingMenuRef?.updateShapeOptions?.({
					strokeWidth: obj.strokeWidth || 2,
					strokeColour: obj.stroke?.toString() || '#4A5568',
					fillColour: obj.fill?.toString() || 'transparent',
					strokeDashArray: obj.strokeDashArray || [],
					opacity: obj.opacity ?? 1
				});
			} else if (obj.type === 'polyline') {
				// Show line options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('line');
				// Sync line properties to menu
				ctx.floatingMenuRef?.updateLineArrowOptions?.({
					strokeWidth: obj.strokeWidth || 2,
					strokeColour: obj.stroke?.toString() || '#4A5568',
					strokeDashArray: obj.strokeDashArray || [],
					opacity: obj.opacity ?? 1
				});
			} else if (obj.type === 'group') {
				// Arrows are groups - show arrow options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('arrow');
				// Sync arrow properties from the line in the group
				const groupObj = obj as fabric.Group;
				const lineObj = groupObj.getObjects().find((o) => o.type === 'polyline');
				if (lineObj) {
					ctx.floatingMenuRef?.updateLineArrowOptions?.({
						strokeWidth: lineObj.strokeWidth || 2,
						strokeColour: lineObj.stroke?.toString() || '#4A5568',
						strokeDashArray: lineObj.strokeDashArray || [],
						opacity: lineObj.opacity ?? 1
					});
				}
			} else if (obj.type === 'path') {
				// Drawn paths (freehand drawing) - show draw options panel
				ctx.floatingMenuRef?.setActiveMenuPanel?.('draw');
				// Sync path properties to menu
				ctx.floatingMenuRef?.updateDrawOptions?.({
					brushSize: obj.strokeWidth || 6,
					brushColour: obj.stroke?.toString() || '#4A5568',
					opacity: obj.opacity ?? 1
				});
			} else if (obj.type === 'image') {
				// Images - show image options panel (only opacity applies)
				ctx.floatingMenuRef?.setActiveMenuPanel?.('image');
				// Sync image properties to menu (only opacity makes sense)
				ctx.floatingMenuRef?.updateShapeOptions?.({
					opacity: obj.opacity ?? 1
				});
			}
		}
	};
};

/**
 * Creates selection:cleared event handler
 */
export const createSelectionClearedHandler = (ctx: CanvasEventContext) => {
	return () => {
		// Close floating menu when clicking on empty space in select mode
		if (ctx.getSelectedTool() === 'select') {
			ctx.setShowFloatingMenu(false);
		}
	};
};

/**
 * Creates mouse:wheel event handler
 */
export const createMouseWheelHandler = (canvas: fabric.Canvas, ctx: CanvasEventContext) => {
	return (opt: fabric.TEvent<WheelEvent>) => {
		const delta = opt.e.deltaY;

		let zoom = canvas.getZoom();
		zoom *= 0.99 ** delta;
		if (zoom > ZOOM_LIMITS.max) zoom = ZOOM_LIMITS.max;
		if (zoom < ZOOM_LIMITS.min) zoom = ZOOM_LIMITS.min;

		const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
		canvas.zoomToPoint(point, zoom);
		ctx.setCurrentZoom(zoom);
		opt.e.preventDefault();
		opt.e.stopPropagation();
	};
};

/**
 * Creates mouse:down event handler
 */
export const createMouseDownHandler = (canvas: fabric.Canvas, ctx: CanvasEventContext) => {
	return (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
		const evt = opt.e;

		// Close the expanded colors panel when user starts interacting
		ctx.floatingMenuRef?.closeExpandedColors?.();

		const selectedTool = ctx.getSelectedTool();

		if (selectedTool === 'pan') {
			ctx.setIsPanMode(true);
			canvas.selection = false;
			canvas.discardActiveObject();
			canvas.setCursor('grabbing');

			const clientX = 'clientX' in evt ? evt.clientX : evt.touches?.[0]?.clientX || 0;
			const clientY = 'clientY' in evt ? evt.clientY : evt.touches?.[0]?.clientY || 0;
			ctx.setPanStartPos({ x: clientX, y: clientY });

			opt.e.preventDefault();
			opt.e.stopPropagation();
		} else if (selectedTool === 'select') {
			if (!canvas.getActiveObject() && !canvas.findTarget(evt)) {
				ctx.setIsPanMode(true);
				canvas.selection = false;
				canvas.setCursor('grab');

				const clientX = 'clientX' in evt ? evt.clientX : evt.touches?.[0]?.clientX || 0;
				const clientY = 'clientY' in evt ? evt.clientY : evt.touches?.[0]?.clientY || 0;
				ctx.setPanStartPos({ x: clientX, y: clientY });

				opt.e.preventDefault();
			}
		} else if (selectedTool === 'shapes' && ctx.getCurrentShapeType()) {
			if (!ctx.getIsDrawingShape()) {
				// Start drawing a shape
				const pointer = canvas.getScenePoint(opt.e);
				ctx.setStartPoint({ x: pointer.x, y: pointer.y });
				ctx.setIsDrawingShape(true);

				// Create initial shape with zero size
				const tempShape = Shapes.createShapeFromPoints(
					ctx.getCurrentShapeType(),
					pointer.x,
					pointer.y,
					pointer.x,
					pointer.y,
					ctx.getCurrentShapeOptions()
				);
				if (tempShape) {
					canvas.add(tempShape);
					canvas.renderAll();
				}
				ctx.setTempShape(tempShape);

				opt.e.preventDefault();
				opt.e.stopPropagation();
			}
		} else if (selectedTool === 'text') {
			// Check if we clicked on an existing textbox to edit it
			const target = canvas.findTarget(opt.e);

			// If we're currently editing a textbox and click elsewhere, exit editing and switch to select
			const activeObject = canvas.getActiveObject();
			if (
				activeObject &&
				activeObject.type === 'textbox' &&
				(activeObject as fabric.Textbox).isEditing
			) {
				(activeObject as fabric.Textbox).exitEditing();
				canvas.discardActiveObject();
				canvas.renderAll();

				// Switch to select tool
				ctx.setSelectedTool('select');
				canvas.isDrawingMode = false;
				canvas.selection = true;
				canvas.defaultCursor = 'default';
				canvas.hoverCursor = 'move';

				opt.e.preventDefault();
				opt.e.stopPropagation();
				return;
			}

			if (target && target.type === 'textbox') {
				// Enter edit mode on the existing textbox
				canvas.setActiveObject(target);
				(target as fabric.Textbox).enterEditing();
				canvas.renderAll();

				opt.e.preventDefault();
				opt.e.stopPropagation();
			} else if (!ctx.getIsDrawingText()) {
				// Start drawing a new text box
				const pointer = canvas.getScenePoint(opt.e);
				ctx.setStartPoint({ x: pointer.x, y: pointer.y });
				ctx.setIsDrawingText(true);

				// Create initial text with minimum width
				const tempText = Shapes.createTextFromPoints(
					pointer.x,
					pointer.y,
					pointer.x + 50,
					pointer.y,
					ctx.getCurrentTextOptions()
				);
				if (tempText) {
					canvas.add(tempText);
					canvas.renderAll();
				}
				ctx.setTempText(tempText);

				opt.e.preventDefault();
				opt.e.stopPropagation();
			}
		} else if (selectedTool === 'line' || selectedTool === 'arrow') {
			// Don't start drawing if we're clicking on an existing object
			const target = canvas.findTarget(opt.e);
			if (!target && !ctx.getIsDrawingLine() && !ctx.getIsDrawingArrow()) {
				const pointer = canvas.getScenePoint(opt.e);
				const startPoint = { x: pointer.x, y: pointer.y };
				ctx.setStartPoint(startPoint);

				if (selectedTool === 'line') {
					ctx.setIsDrawingLine(true);
					const tempLine = Shapes.createLine(
						startPoint.x,
						startPoint.y,
						startPoint.x,
						startPoint.y,
						ctx.getCurrentLineArrowOptions()
					);
					ctx.setTempShape(tempLine);
					ctx.setTempLine(tempLine);
				} else {
					ctx.setIsDrawingArrow(true);
					const tempLine = Shapes.createArrow(
						startPoint.x,
						startPoint.y,
						startPoint.x,
						startPoint.y,
						ctx.getCurrentLineArrowOptions()
					);
					ctx.setTempLine(tempLine);
				}

				const tempLine = ctx.getTempLine();
				if (tempLine) {
					canvas.add(tempLine);
					canvas.renderAll();
				}

				opt.e.preventDefault();
				opt.e.stopPropagation();
			}
		} else if (selectedTool === 'eraser') {
			ctx.setIsErasing(true);
			const pointer = canvas.getScenePoint(opt.e);
			ctx.setStartPoint({ x: pointer.x, y: pointer.y });
			ctx.setLastEraserPoint({ x: pointer.x, y: pointer.y });

			// Find objects under the eraser and make them transparent
			canvas.forEachObject((obj) => {
				if (obj.containsPoint(pointer) && !ctx.getEraserTrail().includes(obj)) {
					if (!ctx.getHoveredObjectsForDeletion().includes(obj)) {
						// Store original opacity and make transparent
						const originalOpacities = ctx.getOriginalOpacities();
						originalOpacities.set(obj, obj.opacity || 1);
						ctx.setOriginalOpacities(originalOpacities);
						obj.set({ opacity: 0.3 });
						const hoveredObjects = ctx.getHoveredObjectsForDeletion();
						hoveredObjects.push(obj);
						ctx.setHoveredObjectsForDeletion(hoveredObjects);
					}
				}
			});

			canvas.renderAll();
			opt.e.preventDefault();
			opt.e.stopPropagation();
		}
	};
};

/**
 * Creates mouse:move event handler
 */
export const createMouseMoveHandler = (canvas: fabric.Canvas, ctx: CanvasEventContext) => {
	return (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
		if (ctx.getIsPanMode()) {
			const e = opt.e;
			const clientX = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX || 0;
			const clientY = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY || 0;

			const panStartPos = ctx.getPanStartPos();
			const deltaX = clientX - panStartPos.x;
			const deltaY = clientY - panStartPos.y;

			canvas.relativePan(new fabric.Point(deltaX, deltaY));
			ctx.setPanStartPos({ x: clientX, y: clientY });

			canvas.setCursor('grabbing');
		} else if (ctx.getIsDrawingShape() && ctx.getTempShape() && ctx.getCurrentShapeType()) {
			// Update the shape being drawn
			const pointer = canvas.getScenePoint(opt.e);

			// Remove the old temp shape
			const oldTempShape = ctx.getTempShape();
			if (oldTempShape) {
				canvas.remove(oldTempShape);
			}

			// Create new shape with updated dimensions
			const startPoint = ctx.getStartPoint();
			const tempShape = Shapes.createShapeFromPoints(
				ctx.getCurrentShapeType(),
				startPoint.x,
				startPoint.y,
				pointer.x,
				pointer.y,
				ctx.getCurrentShapeOptions()
			);
			if (tempShape) {
				canvas.add(tempShape);
				canvas.renderAll();
			}
			ctx.setTempShape(tempShape);
		} else if (ctx.getIsDrawingText() && ctx.getTempText()) {
			// Update the text box being drawn (only horizontally)
			const pointer = canvas.getScenePoint(opt.e);

			// Remove the old temp text
			const oldTempText = ctx.getTempText();
			if (oldTempText) {
				canvas.remove(oldTempText);
			}

			// Create new text with updated width (only expand horizontally)
			const startPoint = ctx.getStartPoint();
			const tempText = Shapes.createTextFromPoints(
				startPoint.x,
				startPoint.y,
				pointer.x,
				startPoint.y,
				ctx.getCurrentTextOptions()
			);
			if (tempText) {
				canvas.add(tempText);
				canvas.renderAll();
			}
			ctx.setTempText(tempText);
		} else if ((ctx.getIsDrawingLine() || ctx.getIsDrawingArrow()) && ctx.getTempLine()) {
			// Update the temporary line/arrow while dragging
			const pointer = canvas.getScenePoint(opt.e);
			const startPoint = ctx.getStartPoint();

			// Remove the old temp line/arrow
			const oldTempLine = ctx.getTempLine();
			if (oldTempLine) {
				canvas.remove(oldTempLine);
			}

			// Create new line or arrow with updated coordinates
			const tempLine = ctx.getIsDrawingLine()
				? Shapes.createLine(
						startPoint.x,
						startPoint.y,
						pointer.x,
						pointer.y,
						ctx.getCurrentLineArrowOptions()
					)
				: Shapes.createArrow(
						startPoint.x,
						startPoint.y,
						pointer.x,
						pointer.y,
						ctx.getCurrentLineArrowOptions()
					);

			if (tempLine) {
				canvas.add(tempLine);
			}
			ctx.setTempLine(tempLine);

			canvas.renderAll();
		} else if (ctx.getIsErasing() && ctx.getSelectedTool() === 'eraser') {
			// Create visual eraser trail as a solid line
			const pointer = canvas.getScenePoint(opt.e);

			// Create a line segment from the last point to current point
			const lastEraserPoint = ctx.getLastEraserPoint();
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
				);

				canvas.add(trailLine);
				const eraserTrail = ctx.getEraserTrail();
				eraserTrail.push(trailLine);

				// Limit trail length for performance
				if (eraserTrail.length > 15) {
					const oldTrail = eraserTrail.shift();
					if (oldTrail) canvas.remove(oldTrail);
				}
				ctx.setEraserTrail(eraserTrail);
			}

			ctx.setLastEraserPoint({ x: pointer.x, y: pointer.y });

			// Find objects under the eraser and make them transparent
			canvas.forEachObject((obj) => {
				if (obj.containsPoint(pointer) && !ctx.getEraserTrail().includes(obj)) {
					if (!ctx.getHoveredObjectsForDeletion().includes(obj)) {
						// Store original opacity and make transparent
						const originalOpacities = ctx.getOriginalOpacities();
						originalOpacities.set(obj, obj.opacity || 1);
						ctx.setOriginalOpacities(originalOpacities);
						obj.set({ opacity: 0.3 });
						const hoveredObjects = ctx.getHoveredObjectsForDeletion();
						hoveredObjects.push(obj);
						ctx.setHoveredObjectsForDeletion(hoveredObjects);
					}
				}
			});

			canvas.renderAll();
		} else if (ctx.getSelectedTool() === 'eraser' && !ctx.getIsErasing()) {
			// Show hover preview when not actively erasing
			const pointer = canvas.getScenePoint(opt.e);

			// Reset any previously hovered objects
			const hoveredObjects = ctx.getHoveredObjectsForDeletion();
			const originalOpacities = ctx.getOriginalOpacities();

			hoveredObjects.forEach((obj) => {
				const originalOpacity = originalOpacities.get(obj);
				if (originalOpacity !== undefined) {
					obj.set({ opacity: originalOpacity });
				}
			});

			ctx.setHoveredObjectsForDeletion([]);
			ctx.setOriginalOpacities(new Map());

			// Find and highlight objects under cursor
			const newHoveredObjects: fabric.Object[] = [];
			const newOriginalOpacities = new Map<fabric.Object, number>();

			canvas.forEachObject((obj) => {
				if (obj.containsPoint(pointer) && !ctx.getEraserTrail().includes(obj)) {
					newOriginalOpacities.set(obj, obj.opacity || 1);
					obj.set({ opacity: 0.5 });
					newHoveredObjects.push(obj);
				}
			});

			ctx.setHoveredObjectsForDeletion(newHoveredObjects);
			ctx.setOriginalOpacities(newOriginalOpacities);

			canvas.renderAll();
		}
	};
};

/**
 * Setup all canvas event handlers
 */
export const setupCanvasEvents = (canvas: fabric.Canvas, ctx: CanvasEventContext) => {
	canvas.on('object:moving', createObjectMovingHandler(ctx));
	canvas.on('object:scaling', createObjectScalingHandler(ctx));
	canvas.on('object:rotating', createObjectRotatingHandler(ctx));
	canvas.on('object:modified', createObjectModifiedHandler(ctx));
	canvas.on('mouse:up', createMouseUpHandler(canvas, ctx));
	canvas.on('path:created', createPathCreatedHandler(ctx));
	canvas.on('text:changed', createTextChangedHandler(ctx));
	canvas.on('text:editing:exited', createTextEditingExitedHandler(ctx));
	canvas.on('selection:created', createSelectionCreatedHandler(ctx));
	canvas.on('selection:updated', createSelectionUpdatedHandler(ctx));
	canvas.on('selection:cleared', createSelectionClearedHandler(ctx));
	canvas.on('mouse:wheel', createMouseWheelHandler(canvas, ctx));
	canvas.on('mouse:down', createMouseDownHandler(canvas, ctx));
	canvas.on('mouse:move', createMouseMoveHandler(canvas, ctx));
};
