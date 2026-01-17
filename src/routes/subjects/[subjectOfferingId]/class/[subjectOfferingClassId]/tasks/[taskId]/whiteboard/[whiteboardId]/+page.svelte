<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Alert from '$lib/components/ui/alert';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import type { CanvasEventContext } from '$lib/components/whiteboard/canvas-events';
	import {
		DEFAULT_DRAW_OPTIONS,
		DEFAULT_LINE_OPTIONS,
		DEFAULT_SHAPE_OPTIONS,
		DEFAULT_TEXT_OPTIONS,
		IMAGE_THROTTLE_MS,
		ZOOM_LIMITS
	} from '$lib/components/whiteboard/constants';
	import type { ToolState } from '$lib/components/whiteboard/tools';
	import type {
		DrawOptions,
		LineOptions,
		ShapeOptions,
		TextOptions,
		WhiteboardTool
	} from '$lib/components/whiteboard/types';
	import { hexToRgba } from '$lib/components/whiteboard/utils';
	import WhiteboardZoomControls from '$lib/components/whiteboard/whiteboard-controls.svelte';
	import WhiteboardFloatingMenu from '$lib/components/whiteboard/whiteboard-floating-menu.svelte';
	import WhiteboardToolbar from '$lib/components/whiteboard/whiteboard-toolbar.svelte';
	import { userTypeEnum } from '$lib/enums';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { onDestroy, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	// Dynamic imports for browser-only modules
	let fabric: typeof import('fabric');
	let CanvasActions: typeof import('$lib/components/whiteboard/canvas-actions');
	let CanvasEvents: typeof import('$lib/components/whiteboard/canvas-events');
	let CanvasHistory: typeof import('$lib/components/whiteboard/canvas-history').CanvasHistory;
	let applyRedo: typeof import('$lib/components/whiteboard/canvas-history').applyRedo;
	let applyUndo: typeof import('$lib/components/whiteboard/canvas-history').applyUndo;
	let Tools: typeof import('$lib/components/whiteboard/tools');
	let WebSocketHandler: typeof import('$lib/components/whiteboard/websocket-socketio');
	let ControlPointManager: typeof import('$lib/components/whiteboard/control-points').ControlPointManager;

	let { data } = $props();

	let isLocked = $state(data.whiteboard.isLocked);
	const isTeacher = $derived(data.user?.type === userTypeEnum.teacher);

	let socket = $state() as any; // Will be Socket.IO Socket once loaded
	let canvas: any; // Will be fabric.Canvas once loaded
	let selectedTool = $state<WhiteboardTool>('select');
	let whiteboardCanvas = $state<HTMLCanvasElement>();
	let isPanMode = false;
	let panStartPos = { x: 0, y: 0 };
	let currentZoom = $state(1);
	let showFloatingMenu = $state(false);
	let imageInput = $state<HTMLInputElement>();
	let isDrawingLine = $state(false);
	let isDrawingShape = $state(false);
	let isDrawingText = $state(false);
	let currentShapeType = $state<string>('');
	let isErasing = $state(false);
	let eraserTrail = $state<any[]>([]);
	let lastEraserPoint = $state<{ x: number; y: number } | null>(null);
	let hoveredObjectsForDeletion = $state<any[]>([]);
	let originalOpacities = $state<Map<any, number>>(new Map());
	let startPoint = $state({ x: 0, y: 0 });
	let tempLine: any = null;
	let tempShape: any = null;
	let tempText: any = null;
	let floatingMenuRef: WhiteboardFloatingMenu;

	// Control point manager instance
	let controlPointManager: any; // Will be ControlPointManager once loaded

	// History management for undo/redo
	let history: any; // Will be CanvasHistory instance once loaded
	let canUndo = $state(false);
	let canRedo = $state(false);
	let isApplyingHistory = false; // Flag to prevent recording history during undo/redo
	let isLoadingFromServer = false; // Flag to prevent recording history during initial load or remote updates
	let isDrawingObject = false; // Flag to prevent recording temporary objects during drawing
	let isControlPointModifying = false; // Flag to prevent history recording during control point modifications

	// Current tool options - updated when menu changes
	let currentTextOptions = $state<TextOptions>({ ...DEFAULT_TEXT_OPTIONS });
	let currentShapeOptions = $state<ShapeOptions>({ ...DEFAULT_SHAPE_OPTIONS });
	let currentDrawOptions = $state<DrawOptions>({ ...DEFAULT_DRAW_OPTIONS });
	let currentLineOptions = $state<LineOptions>({ ...DEFAULT_LINE_OPTIONS });

	const { whiteboardId, taskId, subjectOfferingId, subjectOfferingClassId } = $derived(page.params);
	const whiteboardIdNum = $derived(parseInt(whiteboardId ?? '0'));

	// Throttling mechanism for image updates only
	let imageUpdateQueue = new Map<string, any>();
	let imageThrottleTimeout: ReturnType<typeof setTimeout> | null = null;
	let isMovingImage = false;

	const sendCanvasUpdate = (data: any) => {
		if (socket && socket.connected) {
			const { type, ...rest } = data;
			socket.emit(type, { ...rest, whiteboardId: whiteboardIdNum });
		}
	};

	// Throttled update function specifically for image movements
	const sendImageUpdate = (objectId: string, objectData: any, immediate = false) => {
		// Store the latest state for this image
		imageUpdateQueue.set(objectId, objectData);

		if (immediate) {
			// Send immediately for final positions (persist to database)
			sendCanvasUpdate({
				type: 'modify',
				object: objectData,
				live: false
			});
			imageUpdateQueue.delete(objectId);
			return;
		}

		// Throttle live image updates to reduce network traffic
		if (imageThrottleTimeout !== null) {
			clearTimeout(imageThrottleTimeout);
		}

		imageThrottleTimeout = setTimeout(() => {
			// Send all queued image updates as live updates (no database persistence)
			imageUpdateQueue.forEach((objData, objId) => {
				// For live image updates, send only essential positioning data
				const updateData = {
					id: objData.id,
					type: objData.type,
					left: objData.left,
					top: objData.top,
					scaleX: objData.scaleX,
					scaleY: objData.scaleY,
					angle: objData.angle,
					opacity: objData.opacity
				};

				sendCanvasUpdate({
					type: 'modify',
					object: updateData,
					live: true
				});
			});
			imageUpdateQueue.clear();
			imageThrottleTimeout = null;
		}, IMAGE_THROTTLE_MS);
	};

	// Helper to get mutable tool state
	const getToolState = (): ToolState => ({
		selectedTool,
		showFloatingMenu,
		isDrawingShape,
		isDrawingText,
		currentShapeType,
		eraserTrail,
		lastEraserPoint,
		hoveredObjectsForDeletion,
		originalOpacities,
		tempShape,
		tempText
	});

	// Helper to apply tool state updates
	const applyToolState = (state: ToolState) => {
		selectedTool = state.selectedTool;
		showFloatingMenu = state.showFloatingMenu;
		isDrawingShape = state.isDrawingShape;
		isDrawingText = state.isDrawingText;
		currentShapeType = state.currentShapeType;
		eraserTrail = state.eraserTrail;
		lastEraserPoint = state.lastEraserPoint;
		hoveredObjectsForDeletion = state.hoveredObjectsForDeletion;
		originalOpacities = state.originalOpacities;
		tempShape = state.tempShape;
		tempText = state.tempText;
	};

	const clearEraserState = () => {
		const state = getToolState();
		Tools.clearEraserState(canvas, state);
		applyToolState(state);
	};

	const clearShapeDrawingState = () => {
		const state = getToolState();
		Tools.clearShapeDrawingState(canvas, state);
		applyToolState(state);
	};

	const clearTextDrawingState = () => {
		const state = getToolState();
		Tools.clearTextDrawingState(canvas, state);
		applyToolState(state);
	};

	const setSelectTool = () => {
		const state = getToolState();
		Tools.setSelectTool(
			canvas,
			state,
			clearEraserState,
			clearShapeDrawingState,
			clearTextDrawingState
		);
		applyToolState(state);
	};

	const setPanTool = () => {
		const state = getToolState();
		Tools.setPanTool(
			canvas,
			state,
			clearEraserState,
			clearShapeDrawingState,
			clearTextDrawingState
		);
		applyToolState(state);
	};

	const setDrawTool = () => {
		const state = getToolState();
		Tools.setDrawTool(
			canvas,
			state,
			clearEraserState,
			clearShapeDrawingState,
			clearTextDrawingState
		);
		applyToolState(state);
	};

	const setEraserTool = () => {
		const state = getToolState();
		Tools.setEraserTool(
			canvas,
			state,
			clearShapeDrawingState,
			clearTextDrawingState,
			clearEraserState
		);
		applyToolState(state);
	};

	const setLineTool = () => {
		const state = getToolState();
		Tools.setLineTool(
			canvas,
			state,
			clearEraserState,
			clearShapeDrawingState,
			clearTextDrawingState
		);
		applyToolState(state);
	};

	const addShape = (shapeType: string) => {
		const state = getToolState();
		Tools.addShape(canvas, shapeType, state, clearEraserState);
		applyToolState(state);
	};

	const addText = () => {
		const state = getToolState();
		Tools.addText(canvas, state, clearEraserState, clearShapeDrawingState);
		applyToolState(state);
	};

	const addImage = () => {
		const state = getToolState();
		Tools.setImageTool(
			canvas,
			state,
			clearEraserState,
			clearShapeDrawingState,
			clearTextDrawingState
		);
		applyToolState(state);
		// Trigger the file input
		Tools.addImage(imageInput);
	};

	const handleImageUpload = (event: Event) => {
		if (!canvas) return;
		CanvasActions.handleImageUpload(event, {
			canvas,
			sendCanvasUpdate,
			onImageAdded: (img) => {
				// Auto-switch to selection tool and show image options menu
				// Use setTimeout to ensure state updates happen after the object is properly selected
				setTimeout(() => {
					selectedTool = 'select';
					canvas.isDrawingMode = false;
					canvas.selection = true;
					showFloatingMenu = true;

					// Show image options in floating menu
					floatingMenuRef?.setActiveMenuPanel?.('image');
					floatingMenuRef?.updateShapeOptions?.({
						strokeWidth: 0,
						strokeColour: '#1E1E1E',
						fillColour: 'transparent',
						strokeDashArray: [],
						opacity: img.opacity || 1
					});
				}, 0);
			}
		});
	};

	const clearCanvas = () => {
		if (!canvas) return;
		CanvasActions.clearCanvas({ canvas, sendCanvasUpdate });
	};

	const deleteSelected = () => {
		if (!canvas) return;
		CanvasActions.deleteSelected({ canvas, sendCanvasUpdate });
	};

	const zoomIn = () => {
		if (!canvas) return;
		CanvasActions.zoomIn({ canvas, sendCanvasUpdate }, ZOOM_LIMITS, (zoom) => {
			currentZoom = zoom;
		});
	};

	const zoomOut = () => {
		if (!canvas) return;
		CanvasActions.zoomOut({ canvas, sendCanvasUpdate }, ZOOM_LIMITS, (zoom) => {
			currentZoom = zoom;
		});
	};

	const resetZoom = () => {
		if (!canvas) return;
		CanvasActions.resetZoom({ canvas, sendCanvasUpdate }, (zoom) => {
			currentZoom = zoom;
		});
	};

	const recenterView = () => {
		if (!canvas) return;
		CanvasActions.recenterView({ canvas, sendCanvasUpdate }, (zoom) => {
			currentZoom = zoom;
		});
	};

	const goBack = () => {
		goto(`/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${taskId}`);
	};

	// Apply lock state to canvas
	const applyCanvasLockState = (locked: boolean) => {
		if (!canvas) return;

		if (locked && !isTeacher) {
			// Student in locked mode - view only (pan only)
			canvas.isDrawingMode = false;
			canvas.selection = false;
			canvas.forEachObject((obj: any) => {
				obj.selectable = false;
				obj.evented = false;
			});
			canvas.discardActiveObject();
			canvas.renderAll();
			// Force pan tool for students when locked
			setPanTool();
		} else {
			// Teacher or unlocked - allow editing
			canvas.isDrawingMode = false;
			canvas.selection = true;
			canvas.forEachObject((obj: any) => {
				obj.selectable = true;
				obj.evented = true;
			});
			canvas.renderAll();
		}
	};

	// Handle floating menu option changes
	const handleTextOptionsChange = (options: any) => {
		// Update current options for new objects
		currentTextOptions = { ...options };

		if (!canvas || !history) return;
		const activeObject = canvas.getActiveObject();
		if (activeObject && activeObject.type === 'textbox' && data.user?.id) {
			// Store previous state for history
			const previousData = activeObject.toObject();
			previousData.id = (activeObject as any).id;

			activeObject.set({
				fontSize: options.fontSize,
				fontFamily: options.fontFamily,
				fontWeight: options.fontWeight,
				fill: options.colour,
				textAlign: options.textAlign,
				opacity: options.opacity
			});
			canvas.renderAll();
			const objData = activeObject.toObject();
			(objData as any).id = (activeObject as any).id;

			// Record history for option change (only if not loading)
			if (!isLoadingFromServer && !isApplyingHistory) {
				history.recordModify((activeObject as any).id, previousData, objData, data.user.id);
				canUndo = history.canUndo();
				canRedo = history.canRedo();
			}

			sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		}
	};
	const handleShapeOptionsChange = (options: any) => {
		// Update current options for new objects
		currentShapeOptions = { ...options };

		if (!canvas || !history) return;
		let activeObject = canvas.getActiveObject();

		// If a control point is selected, find its linked object
		if (activeObject && controlPointManager?.isControlPoint(activeObject)) {
			const linkedObjectId = (activeObject as any).linkedObjectId;
			if (linkedObjectId) {
				const linkedObj = canvas.getObjects().find((o: any) => o.id === linkedObjectId);
				if (linkedObj) {
					activeObject = linkedObj;
				}
			}
		}

		if (
			activeObject &&
			(activeObject.type === 'rect' ||
				activeObject.type === 'ellipse' ||
				activeObject.type === 'triangle' ||
				activeObject.type === 'image') &&
			data.user?.id
		) {
			// Store previous state for history
			const previousData = activeObject.toObject();
			previousData.id = (activeObject as any).id;

			// For images, only apply opacity (other properties don't make sense for images)
			if (activeObject.type === 'image') {
				activeObject.set({
					opacity: options.opacity
				});
			} else {
				// Get the center point before changing stroke width
				const centerBefore = activeObject.getCenterPoint();

				// Apply the new properties
				activeObject.set({
					strokeWidth: options.strokeWidth,
					stroke: options.strokeColour,
					fill: options.fillColour === 'transparent' ? 'transparent' : options.fillColour,
					strokeDashArray: options.strokeDashArray,
					opacity: options.opacity,
					strokeUniform: true // This makes stroke not scale with object
				});

				// Get the center point after changing stroke width
				const centerAfter = activeObject.getCenterPoint();

				// Adjust position to maintain the same visual center
				if (
					Math.abs(centerBefore.x - centerAfter.x) > 0.01 ||
					Math.abs(centerBefore.y - centerAfter.y) > 0.01
				) {
					activeObject.set({
						left: activeObject.left! + (centerBefore.x - centerAfter.x),
						top: activeObject.top! + (centerBefore.y - centerAfter.y)
					});
					activeObject.setCoords();
				}
			}
			canvas.renderAll();
			const objData = activeObject.toObject();
			objData.id = activeObject.id;

			// Record history for option change (only if not loading)
			if (!isLoadingFromServer && !isApplyingHistory) {
				history.recordModify((activeObject as any).id, previousData, objData, data.user.id);
				canUndo = history.canUndo();
				canRedo = history.canRedo();
			}

			sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		}
	};

	const handleDrawOptionsChange = (options: any) => {
		// Update current options for new objects
		currentDrawOptions = { ...options };

		if (!canvas || !history) return;

		// First, check if there's an active path object selected and update it
		const activeObject = canvas.getActiveObject();
		if (activeObject && activeObject.type === 'path' && data.user?.id) {
			// Store previous state for history
			const previousData = activeObject.toObject();
			previousData.id = (activeObject as any).id;

			activeObject.set({
				strokeWidth: options.brushSize,
				stroke: options.brushColour,
				opacity: options.opacity
			});
			canvas.renderAll();
			const objData = activeObject.toObject();
			objData.id = activeObject.id;

			// Record history for option change (only if not loading)
			if (!isLoadingFromServer && !isApplyingHistory) {
				history.recordModify((activeObject as any).id, previousData, objData, data.user.id);
				canUndo = history.canUndo();
				canRedo = history.canRedo();
			}

			sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		}

		// Also update the brush for future drawing
		if (canvas.freeDrawingBrush) {
			canvas.freeDrawingBrush.width = options.brushSize;

			// Apply opacity to the colour by converting to rgba format
			const colour = options.brushColour;
			const opacity = options.opacity;

			canvas.freeDrawingBrush.color = hexToRgba(colour, opacity);

			// Update brush type if needed
			if (options.brushType === 'circle') {
				canvas.freeDrawingBrush = new fabric.CircleBrush(canvas);
			} else if (options.brushType === 'spray') {
				canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
			} else {
				canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
			}
			canvas.freeDrawingBrush.width = options.brushSize;
			canvas.freeDrawingBrush.color = hexToRgba(colour, opacity);
		}
	};

	const handleLineOptionsChange = (options: any) => {
		// Update current options for new objects
		currentLineOptions = { ...options };

		if (!canvas || !history) return;
		let activeObject = canvas.getActiveObject();

		// If a control point is selected, find its linked line
		if (activeObject && controlPointManager?.isControlPoint(activeObject)) {
			const linkedObjectId = (activeObject as any).linkedObjectId;
			if (linkedObjectId) {
				const linkedObj = canvas.getObjects().find((o: any) => o.id === linkedObjectId);
				if (linkedObj) {
					activeObject = linkedObj;
				}
			}
		}

		if (
			activeObject &&
			(activeObject.type === 'polyline' ||
				activeObject.type === 'line' ||
				activeObject.type === 'group') &&
			data.user?.id
		) {
			// Store previous state for history
			const previousData = activeObject.toObject();
			previousData.id = (activeObject as any).id;

			if (activeObject.type === 'polyline' || activeObject.type === 'line') {
				// Get the center point before changing stroke width
				const centerBefore = activeObject.getCenterPoint();

				// Apply the new properties with strokeUniform
				activeObject.set({
					strokeWidth: options.strokeWidth,
					stroke: options.strokeColour,
					strokeDashArray: options.strokeDashArray,
					opacity: options.opacity,
					strokeUniform: true // This makes stroke not scale with object
				});

				// Get the center point after changing stroke width
				const centerAfter = activeObject.getCenterPoint();

				// Adjust position to maintain the same visual center
				if (
					Math.abs(centerBefore.x - centerAfter.x) > 0.01 ||
					Math.abs(centerBefore.y - centerAfter.y) > 0.01
				) {
					activeObject.set({
						left: activeObject.left! + (centerBefore.x - centerAfter.x),
						top: activeObject.top! + (centerBefore.y - centerAfter.y)
					});
					activeObject.setCoords();
				}

				// Update control points if they exist
				if (controlPointManager) {
					controlPointManager.updateControlPoints(activeObject.id, activeObject);
				}
			} else if (activeObject.type === 'group') {
				// Handle arrow group - update all objects in the group
				(activeObject as any).forEachObject((obj: any) => {
					if (obj.type === 'polyline' || obj.type === 'line') {
						obj.set({
							strokeWidth: options.strokeWidth,
							stroke: options.strokeColour,
							strokeDashArray: options.strokeDashArray,
							opacity: options.opacity,
							strokeUniform: true
						});
					}
				});
			}
			canvas.renderAll();
			const objData = activeObject.toObject();
			objData.id = activeObject.id;

			// Record history for option change (only if not loading)
			if (!isLoadingFromServer && !isApplyingHistory) {
				history.recordModify((activeObject as any).id, previousData, objData, data.user.id);
				canUndo = history.canUndo();
				canRedo = history.canRedo();
			}

			sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		}
	};

	// Layering handlers
	const handleBringToFront = () => {
		if (!canvas) return;
		CanvasActions.bringToFront({ canvas, sendCanvasUpdate });
	};

	const handleSendToBack = () => {
		if (!canvas) return;
		CanvasActions.sendToBack({ canvas, sendCanvasUpdate });
	};

	const handleMoveForward = () => {
		if (!canvas) return;
		CanvasActions.moveForward({ canvas, sendCanvasUpdate });
	};

	const handleMoveBackward = () => {
		if (!canvas) return;
		CanvasActions.moveBackward({ canvas, sendCanvasUpdate });
	};

	// Undo/Redo handlers
	const handleUndo = async () => {
		if (!canvas || !history || !history.canUndo()) return;

		isApplyingHistory = true;
		const action = history.undo();
		if (action) {
			await applyUndo(canvas, action, sendCanvasUpdate);
		}

		// Update button states
		canUndo = history.canUndo();
		canRedo = history.canRedo();
		isApplyingHistory = false;
	};

	const handleRedo = async () => {
		if (!canvas || !history || !history.canRedo()) return;

		isApplyingHistory = true;
		const action = history.redo();
		if (action) {
			await applyRedo(canvas, action, sendCanvasUpdate);
		}

		// Update button states
		canUndo = history.canUndo();
		canRedo = history.canRedo();
		isApplyingHistory = false;
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (!canvas) return;

		// Escape key switches to select mode
		if (event.key === 'Escape') {
			const activeObject = canvas.getActiveObject();
			// Don't switch to select if editing text
			if (!activeObject || !activeObject.isType('textbox') || !activeObject.isEditing) {
				event.preventDefault();
				setSelectTool();
			}
		}

		if (event.key === 'Backspace' || event.key === 'Delete') {
			const activeObject = canvas.getActiveObject();
			if (activeObject && (!activeObject.isType('textbox') || !activeObject.isEditing)) {
				event.preventDefault();
				deleteSelected();
			}
		}
	};

	onMount(() => {
		if (!whiteboardCanvas) return;

		let resizeCanvas: (() => void) | undefined;

		// Async initialization
		(async () => {
			// Dynamically import browser-only modules
			fabric = await import('fabric');
			CanvasActions = await import('$lib/components/whiteboard/canvas-actions');
			CanvasEvents = await import('$lib/components/whiteboard/canvas-events');
			const HistoryModule = await import('$lib/components/whiteboard/canvas-history');
			CanvasHistory = HistoryModule.CanvasHistory;
			applyRedo = HistoryModule.applyRedo;
			applyUndo = HistoryModule.applyUndo;
			Tools = await import('$lib/components/whiteboard/tools');
			WebSocketHandler = await import('$lib/components/whiteboard/websocket-socketio');
			const ControlPointsModule = await import('$lib/components/whiteboard/control-points');
			ControlPointManager = ControlPointsModule.ControlPointManager;

			// Initialize history
			history = new CanvasHistory();
			// Set the current user ID for filtering history operations
			if (data.user?.id) {
				history.setCurrentUserId(data.user.id);
			}
			// Update initial button states
			canUndo = history.canUndo();
			canRedo = history.canRedo();
			console.log('History initialized for user:', data.user?.id);

			document.body.style.overflow = 'hidden';

			canvas = new fabric.Canvas(whiteboardCanvas, {
				preserveObjectStacking: true,
				perPixelTargetFind: true,
				targetFindTolerance: 5
			});

			resizeCanvas = () => {
				if (!whiteboardCanvas || !canvas) return;
				const whiteContainer = whiteboardCanvas.closest('.rounded-lg.border-2.bg-white');
				if (whiteContainer) {
					const rect = whiteContainer.getBoundingClientRect();
					const width = rect.width - 4;
					const height = rect.height - 4;

					whiteboardCanvas.width = width;
					whiteboardCanvas.height = height;

					canvas.setDimensions({
						width: width,
						height: height
					});
					canvas.renderAll();
				}
			};

			resizeCanvas();
			window.addEventListener('resize', resizeCanvas);

			canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
			canvas.freeDrawingBrush.width = 2;
			canvas.freeDrawingBrush.color = '#000000';

			setSelectTool();

			// Initialize control point manager
			controlPointManager = new ControlPointManager(canvas, sendCanvasUpdate);

			// Setup WebSocket connection for real-time collaboration
			socket = WebSocketHandler.setupWebSocket(
				'', // Empty URL - Socket.IO will connect to the same origin
				canvas,
				whiteboardIdNum,
				{
					controlPointManager,
					onLoadStart: () => {
						// Set flag to prevent history recording during load
						isLoadingFromServer = true;
						console.log('Loading objects from server - history recording disabled');
					},
					onLoadEnd: (objects) => {
						// Reset flag after load completes
						isLoadingFromServer = false;
						console.log('Finished loading', objects.length, 'objects - history recording enabled');
					},
					onRemoteActionStart: () => {
						// Set flag to prevent history recording during remote actions from other users
						isLoadingFromServer = true;
					},
					onRemoteActionEnd: () => {
						// Reset flag after remote action completes
						isLoadingFromServer = false;
					}
				}
			);

			// Add lock/unlock message handlers for Socket.IO
			socket.on('lock', (data: any) => {
				if (data.whiteboardId === whiteboardIdNum) {
					isLocked = data.isLocked;
					applyCanvasLockState(isLocked);
				}
			});

			socket.on('unlock', (data: any) => {
				if (data.whiteboardId === whiteboardIdNum) {
					isLocked = data.isLocked;
					applyCanvasLockState(isLocked);
				}
			});

			// Apply initial lock state
			applyCanvasLockState(isLocked);

			// Setup all canvas event handlers using the extracted module
			const canvasEventContext: CanvasEventContext = {
				// State getters
				getSelectedTool: () => selectedTool,
				getShowFloatingMenu: () => showFloatingMenu,
				getIsPanMode: () => isPanMode,
				getIsDrawingText: () => isDrawingText,
				getIsDrawingShape: () => isDrawingShape,
				getIsDrawingLine: () => isDrawingLine,
				getIsErasing: () => isErasing,
				getIsMovingImage: () => isMovingImage,
				getTempText: () => tempText,
				getTempShape: () => tempShape,
				getTempLine: () => tempLine,
				getStartPoint: () => startPoint,
				getPanStartPos: () => panStartPos,
				getLastEraserPoint: () => lastEraserPoint,
				getHoveredObjectsForDeletion: () => hoveredObjectsForDeletion,
				getEraserTrail: () => eraserTrail,
				getOriginalOpacities: () => originalOpacities,
				getCurrentShapeType: () => currentShapeType,
				getCurrentZoom: () => currentZoom,

				// State setters
				setSelectedTool: (value) => {
					selectedTool = value;
				},
				setShowFloatingMenu: (value) => {
					showFloatingMenu = value;
				},
				setIsPanMode: (value) => {
					isPanMode = value;
				},
				setIsDrawingText: (value) => {
					isDrawingText = value;
				},
				setIsDrawingShape: (value) => {
					isDrawingShape = value;
				},
				setIsDrawingLine: (value) => {
					isDrawingLine = value;
				},
				setIsErasing: (value) => {
					isErasing = value;
				},
				setIsMovingImage: (value) => {
					isMovingImage = value;
				},
				setTempText: (value) => {
					tempText = value;
				},
				setTempShape: (value) => {
					tempShape = value;
				},
				setTempLine: (value) => {
					tempLine = value;
				},
				setStartPoint: (value) => {
					startPoint = value;
				},
				setPanStartPos: (value) => {
					panStartPos = value;
				},
				setLastEraserPoint: (value) => {
					lastEraserPoint = value;
				},
				setHoveredObjectsForDeletion: (value) => {
					hoveredObjectsForDeletion = value;
				},
				setEraserTrail: (value) => {
					eraserTrail = value;
				},
				setOriginalOpacities: (value) => {
					originalOpacities = value;
				},
				setCurrentShapeType: (value) => {
					currentShapeType = value;
				},
				setCurrentZoom: (value) => {
					currentZoom = value;
				},
				setIsDrawingObject: (value) => {
					isDrawingObject = value;
				},

				// Options getters
				getCurrentTextOptions: () => currentTextOptions,
				getCurrentShapeOptions: () => currentShapeOptions,
				getCurrentDrawOptions: () => currentDrawOptions,
				getCurrentLineOptions: () => currentLineOptions,

				// Callbacks
				sendCanvasUpdate,
				sendImageUpdate,
				clearEraserState,

				// Refs
				floatingMenuRef: floatingMenuRef || undefined,

				// Control point manager
				controlPointManager
			};

			CanvasEvents.setupCanvasEvents(canvas, canvasEventContext);

			// Setup history tracking
			// Track object additions
			canvas.on('object:added', (e: any) => {
				// Skip if applying history, loading from server, actively drawing, control point modifying, or missing data
				if (
					isApplyingHistory ||
					isLoadingFromServer ||
					isDrawingObject ||
					isControlPointModifying ||
					!e.target ||
					!history
				)
					return;

				// Skip control points entirely - they are client-side only
				if (controlPointManager.isControlPoint(e.target)) {
					return;
				}

				// Skip temporary objects that are being drawn (they have selectable: false until finalized)
				// Only record when selectable is true, meaning the object has been finalized
				if (e.target.selectable === false) {
					return;
				}

				const objectId = e.target.id;
				if (!objectId) return;

				// Bring control points to front when any non-control-point object is added
				controlPointManager.bringAllControlPointsToFront();

				if (data.user?.id) {
					const objectData = e.target.toObject();
					objectData.id = objectId;
					history.recordAdd(objectId, objectData, data.user.id);
					canUndo = history.canUndo();
					canRedo = history.canRedo();
				}
			});

			// Track object modifications (store previous state before modification)
			const objectStates = new Map<string, Record<string, unknown>>();
			canvas.on('object:modified', (e: any) => {
				if (isApplyingHistory || isLoadingFromServer || !e.target || !history) return;
				const objectId = e.target.id;
				if (objectId && data.user?.id) {
					const previousData = objectStates.get(objectId);
					const newData = e.target.toObject();
					newData.id = objectId;

					if (previousData) {
						history.recordModify(objectId, previousData, newData, data.user.id);
						objectStates.delete(objectId);
					}
					canUndo = history.canUndo();
					canRedo = history.canRedo();
				}
			});

			// Store state before modification starts
			canvas.on('object:moving', (e: any) => {
				if (isApplyingHistory || !e.target) return;
				// If this is a control point being moved, set the flag to prevent history recording
				// for the object that will be modified by the control point
				if (controlPointManager.isControlPoint(e.target)) {
					isControlPointModifying = true;
					// Capture the linked object's state before modification
					const linkedObjectId = (e.target as any).linkedObjectId;
					if (linkedObjectId && !objectStates.has(linkedObjectId)) {
						const linkedObj = canvas.getObjects().find((o: any) => o.id === linkedObjectId);
						if (linkedObj) {
							const state = linkedObj.toObject();
							state.id = linkedObjectId;
							objectStates.set(linkedObjectId, state);
						}
					}
					return;
				}
				const objectId = e.target.id;
				if (objectId && !objectStates.has(objectId)) {
					const state = e.target.toObject();
					state.id = objectId;
					objectStates.set(objectId, state);
				}
			});

			canvas.on('object:scaling', (e: any) => {
				if (isApplyingHistory || !e.target) return;
				// Skip control points - they are client-side only
				if (controlPointManager.isControlPoint(e.target)) return;
				const objectId = e.target.id;
				if (objectId && !objectStates.has(objectId)) {
					const state = e.target.toObject();
					state.id = objectId;
					objectStates.set(objectId, state);
				}
			});

			canvas.on('object:rotating', (e: any) => {
				if (isApplyingHistory || !e.target) return;
				// Skip control points - they are client-side only
				if (controlPointManager.isControlPoint(e.target)) return;
				const objectId = e.target.id;
				if (objectId && !objectStates.has(objectId)) {
					const state = e.target.toObject();
					state.id = objectId;
					objectStates.set(objectId, state);
				}
			});

			// Track when control point modifications complete (on mouse up)
			canvas.on('mouse:up', (e: any) => {
				// If we were modifying via control points, reset the flag
				// and record the modification for the linked object
				if (isControlPointModifying && history && data.user?.id) {
					isControlPointModifying = false;

					// Check if the target is a control point and record the linked object's modification
					if (e.target && controlPointManager.isControlPoint(e.target)) {
						const linkedObjectId = (e.target as any).linkedObjectId;
						if (linkedObjectId) {
							const previousData = objectStates.get(linkedObjectId);
							const linkedObj = canvas.getObjects().find((o: any) => o.id === linkedObjectId);
							if (linkedObj && previousData) {
								const newData = linkedObj.toObject();
								newData.id = linkedObjectId;
								history.recordModify(linkedObjectId, previousData, newData, data.user.id);
								objectStates.delete(linkedObjectId);
								canUndo = history.canUndo();
								canRedo = history.canRedo();
							}
						}
					}
				}
			});

			// Track object removals
			canvas.on('object:removed', (e: any) => {
				// Skip if applying history, loading from server, actively drawing, control point modifying, or missing data
				if (
					isApplyingHistory ||
					isLoadingFromServer ||
					isDrawingObject ||
					isControlPointModifying ||
					!e.target ||
					!history
				)
					return;
				// Skip control points - they are client-side only
				if (controlPointManager.isControlPoint(e.target)) return;
				// Skip temporary objects (selectable: false) - these are being removed during drawing
				if (e.target.selectable === false) return;
				const objectId = e.target.id;
				if (objectId && data.user?.id) {
					const objectData = e.target.toObject();
					objectData.id = objectId;
					history.recordDelete(objectId, objectData, data.user.id);
					canUndo = history.canUndo();
					canRedo = history.canRedo();
				}
			});

			window.addEventListener('keydown', handleKeyDown);

			// Add pinch-to-zoom for touch devices
			let initialPinchDistance = 0;
			let initialZoom = 1;

			whiteboardCanvas.addEventListener('touchstart', (e) => {
				if (e.touches.length === 2) {
					// Two finger touch - setup for pinch zoom
					const touch1 = e.touches[0];
					const touch2 = e.touches[1];

					const dx = touch1.clientX - touch2.clientX;
					const dy = touch1.clientY - touch2.clientY;
					initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
					initialZoom = canvas.getZoom();

					e.preventDefault();
				}
			});

			whiteboardCanvas.addEventListener('touchmove', (e) => {
				if (e.touches.length === 2 && initialPinchDistance > 0) {
					// Two finger move - pinch to zoom
					const touch1 = e.touches[0];
					const touch2 = e.touches[1];

					const dx = touch1.clientX - touch2.clientX;
					const dy = touch1.clientY - touch2.clientY;
					const currentDistance = Math.sqrt(dx * dx + dy * dy);

					const scale = currentDistance / initialPinchDistance;
					const newZoom = initialZoom * scale;
					const constrainedZoom = Math.max(0.1, Math.min(10, newZoom));

					// Zoom at center of pinch gesture
					const centerX = (touch1.clientX + touch2.clientX) / 2;
					const centerY = (touch1.clientY + touch2.clientY) / 2;

					if (whiteboardCanvas) {
						const rect = whiteboardCanvas.getBoundingClientRect();
						const point = new fabric.Point(centerX - rect.left, centerY - rect.top);
						canvas.zoomToPoint(point, constrainedZoom);
						currentZoom = constrainedZoom; // Update zoom state
					}

					e.preventDefault();
				}
			});

			whiteboardCanvas.addEventListener('touchend', (e) => {
				if (e.touches.length < 2) {
					initialPinchDistance = 0;
				}
			});
		})(); // Close async IIFE

		// Cleanup function
		return () => {
			if (resizeCanvas) {
				window.removeEventListener('resize', resizeCanvas);
			}
		};
	});

	onDestroy(() => {
		if (!browser) return;

		// Restore body scrolling when leaving whiteboard
		if (document?.body) {
			document.body.style.overflow = '';
		}

		// Clear any pending image throttle timeouts
		if (imageThrottleTimeout !== null) {
			clearTimeout(imageThrottleTimeout);
		}

		if (WebSocketHandler && socket) {
			WebSocketHandler.closeWebSocket(socket);
		}
		if (canvas) {
			canvas.dispose();
		}
	});
</script>

<Tooltip.Provider delayDuration={300}>
	<div class="bg-background flex h-full w-full flex-col">
		<!-- Header with back button and title -->
		<header
			class="bg-background/95 supports-backdrop-filter:bg-background/60 border-b backdrop-blur"
		>
			<div class="flex h-14 items-center px-4">
				<Button variant="ghost" size="sm" onclick={goBack} class="mr-4">
					<ArrowLeftIcon class="mr-2 h-4 w-4" />
					Back to Task
				</Button>

				<div class="flex-1">
					<h1 class="text-lg font-semibold">
						{data.whiteboard.title || 'Interactive Whiteboard'}
					</h1>
					<p class="text-muted-foreground text-sm">
						{data.task.title}
					</p>
				</div>

				{#if isTeacher}
					<form
						method="POST"
						action="?/toggleLock"
						onsubmit={async (e) => {
							e.preventDefault();
							const formData = new FormData(e.currentTarget);
							try {
								const res = await fetch(e.currentTarget.action, {
									method: 'POST',
									body: formData
								});
								const result = await res.json();

								// Handle SvelteKit's devalue serialization format
								if (result.type === 'success' && result.data) {
									let actionData =
										typeof result.data === 'string' ? JSON.parse(result.data) : result.data;

									// If actionData is an array (devalue format), reconstruct the object
									if (Array.isArray(actionData)) {
										// devalue format: [schema, values...]
										// Index 0: schema object, Index 1: "success", Index 2: {isLocked: ref}, Index 3: actual boolean
										const reconstructed = {
											type: actionData[1], // "success"
											data: {
												isLocked: actionData[3] // the actual boolean value
											}
										};
										actionData = reconstructed;
									}

									if (actionData.type === 'success' && actionData.data?.isLocked !== undefined) {
										const newLockState = actionData.data.isLocked;
										isLocked = newLockState;
										applyCanvasLockState(newLockState);

										// Show toast notification
										if (toast) {
											if (newLockState) {
												toast.success('Whiteboard locked', {
													description: 'Students can now only view and pan the whiteboard'
												});
											} else {
												toast.success('Whiteboard unlocked', {
													description: 'Students can now edit the whiteboard'
												});
											}
										}

										if (socket && socket.connected) {
											const lockMessage = newLockState ? 'lock' : 'unlock';
											socket.emit(lockMessage, {
												isLocked: newLockState,
												whiteboardId: whiteboardIdNum
											});
										}
									}
								}
							} catch (err) {
								console.error('Lock toggle failed:', err);
							}
						}}
					>
						<Button type="submit" variant="ghost" size="icon">
							{#if isLocked}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path
										d="M7 11V7a5 5 0 0 1 10 0v4"
									/></svg
								>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path
										d="M7 11V7a5 5 0 0 1 9.9-1"
									/></svg
								>
							{/if}
						</Button>
					</form>
				{/if}
			</div>
		</header>

		<!-- Whiteboard Canvas -->
		<main class="relative flex flex-1 items-center justify-center overflow-hidden p-4">
			{#if isLocked && !isTeacher}
				<div class="absolute top-8 left-1/2 z-50 w-auto max-w-2xl -translate-x-1/2">
					<Alert.Root variant="default" class="border-border/50 bg-background/20 backdrop-blur-sm">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="h-4 w-4"
						>
							<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
							<path d="M7 11V7a5 5 0 0 1 10 0v4" />
						</svg>
						<Alert.Title>View Only Mode</Alert.Title>
						<Alert.Description>
							This whiteboard is locked by your teacher. You can pan and zoom to view content.
						</Alert.Description>
					</Alert.Root>
				</div>
			{/if}

			<!-- Floating Toolbar - Hidden for students when locked -->
			{#if !(isLocked && !isTeacher)}
				<WhiteboardToolbar
					{selectedTool}
					onSelectTool={setSelectTool}
					onPanTool={setPanTool}
					onDrawTool={setDrawTool}
					onLineTool={setLineTool}
					onAddShape={addShape}
					onAddText={addText}
					onAddImage={addImage}
					onEraserTool={setEraserTool}
					onClearCanvas={clearCanvas}
				/>
			{/if}

			<div class="flex h-full w-full rounded-lg border-2 bg-white shadow-lg dark:bg-neutral-700">
				<canvas bind:this={whiteboardCanvas} class="h-full w-full"></canvas>
			</div>

			<!-- Hidden file input for image uploads -->
			<input
				bind:this={imageInput}
				type="file"
				accept="image/*"
				onchange={handleImageUpload}
				class="hidden"
			/>

			<!-- Floating Menu -->
			<WhiteboardFloatingMenu
				bind:this={floatingMenuRef}
				{selectedTool}
				visible={showFloatingMenu}
				onTextOptionsChange={handleTextOptionsChange}
				onShapeOptionsChange={handleShapeOptionsChange}
				onDrawOptionsChange={handleDrawOptionsChange}
				onLineOptionsChange={handleLineOptionsChange}
				onBringToFront={handleBringToFront}
				onSendToBack={handleSendToBack}
				onMoveForward={handleMoveForward}
				onMoveBackward={handleMoveBackward}
			/>

			<!-- Zoom Controls - Disable undo/redo for locked students -->
			<WhiteboardZoomControls
				{currentZoom}
				onZoomIn={zoomIn}
				onZoomOut={zoomOut}
				onResetZoom={resetZoom}
				onRecenterView={recenterView}
				onUndo={isLocked && !isTeacher ? () => {} : handleUndo}
				onRedo={isLocked && !isTeacher ? () => {} : handleRedo}
				canUndo={isLocked && !isTeacher ? false : canUndo}
				canRedo={isLocked && !isTeacher ? false : canRedo}
			/>
		</main>
	</div>
</Tooltip.Provider>
