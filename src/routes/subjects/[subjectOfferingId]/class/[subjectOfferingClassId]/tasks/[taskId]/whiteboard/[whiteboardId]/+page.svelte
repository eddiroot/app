<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import type { CanvasEventContext } from '$lib/components/whiteboard/canvas-events';
	import {
		DEFAULT_DRAW_OPTIONS,
		DEFAULT_LINE_ARROW_OPTIONS,
		DEFAULT_SHAPE_OPTIONS,
		DEFAULT_TEXT_OPTIONS,
		IMAGE_THROTTLE_MS,
		ZOOM_LIMITS
	} from '$lib/components/whiteboard/constants';
	import type { ToolState } from '$lib/components/whiteboard/tools';
	import type {
		DrawOptions,
		LineArrowOptions,
		ShapeOptions,
		TextOptions,
		WhiteboardTool
	} from '$lib/components/whiteboard/types';
	import { hexToRgba } from '$lib/components/whiteboard/utils';
	import WhiteboardZoomControls from '$lib/components/whiteboard/whiteboard-controls.svelte';
	import WhiteboardFloatingMenu from '$lib/components/whiteboard/whiteboard-floating-menu.svelte';
	import WhiteboardToolbar from '$lib/components/whiteboard/whiteboard-toolbar.svelte';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { onDestroy, onMount } from 'svelte';

	// Dynamic imports for browser-only modules
	let fabric: typeof import('fabric');
	let CanvasActions: typeof import('$lib/components/whiteboard/canvas-actions');
	let CanvasEvents: typeof import('$lib/components/whiteboard/canvas-events');
	let CanvasHistory: typeof import('$lib/components/whiteboard/canvas-history').CanvasHistory;
	let applyRedo: typeof import('$lib/components/whiteboard/canvas-history').applyRedo;
	let applyUndo: typeof import('$lib/components/whiteboard/canvas-history').applyUndo;
	let Tools: typeof import('$lib/components/whiteboard/tools');
	let WebSocketHandler: typeof import('$lib/components/whiteboard/websocket');

	let { data } = $props();

	let socket = $state() as WebSocket;
	let canvas: any; // Will be fabric.Canvas once loaded
	let selectedTool = $state<WhiteboardTool>('select');
	let whiteboardCanvas = $state<HTMLCanvasElement>();
	let isPanMode = false;
	let panStartPos = { x: 0, y: 0 };
	let currentZoom = $state(1);
	let showFloatingMenu = $state(false);
	let imageInput = $state<HTMLInputElement>();
	let isDrawingLine = $state(false);
	let isDrawingArrow = $state(false);
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

	// History management for undo/redo
	let history: any; // Will be CanvasHistory instance once loaded
	let canUndo = $state(false);
	let canRedo = $state(false);
	let isApplyingHistory = false; // Flag to prevent recording history during undo/redo

	// Current tool options - updated when menu changes
	let currentTextOptions = $state<TextOptions>({ ...DEFAULT_TEXT_OPTIONS });
	let currentShapeOptions = $state<ShapeOptions>({ ...DEFAULT_SHAPE_OPTIONS });
	let currentDrawOptions = $state<DrawOptions>({ ...DEFAULT_DRAW_OPTIONS });
	let currentLineArrowOptions = $state<LineArrowOptions>({ ...DEFAULT_LINE_ARROW_OPTIONS });

	const { whiteboardId, taskId, subjectOfferingId, subjectOfferingClassId } = $derived(page.params);
	const whiteboardIdNum = $derived(parseInt(whiteboardId ?? '0'));

	// Throttling mechanism for image updates only
	let imageUpdateQueue = new Map<string, any>();
	let imageThrottleTimeout: ReturnType<typeof setTimeout> | null = null;
	let isMovingImage = false;

	const sendCanvasUpdate = (data: Object) => {
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ ...data, whiteboardId: whiteboardIdNum }));
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

	const setArrowTool = () => {
		const state = getToolState();
		Tools.setArrowTool(
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

	// Handle floating menu option changes
	const handleTextOptionsChange = (options: any) => {
		// Update current options for new objects
		currentTextOptions = { ...options };

		if (!canvas) return;
		const activeObject = canvas.getActiveObject();
		if (activeObject && activeObject.type === 'textbox') {
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
			sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		}
	};
	const handleShapeOptionsChange = (options: any) => {
		// Update current options for new objects
		currentShapeOptions = { ...options };

		if (!canvas) return;
		const activeObject = canvas.getActiveObject();
		if (
			activeObject &&
			(activeObject.type === 'rect' ||
				activeObject.type === 'circle' ||
				activeObject.type === 'triangle' ||
				activeObject.type === 'image')
		) {
			// For images, only apply opacity (other properties don't make sense for images)
			if (activeObject.type === 'image') {
				activeObject.set({
					opacity: options.opacity
				});
			} else {
				activeObject.set({
					strokeWidth: options.strokeWidth,
					stroke: options.strokeColour,
					fill: options.fillColour === 'transparent' ? 'transparent' : options.fillColour,
					strokeDashArray: options.strokeDashArray,
					opacity: options.opacity
				});
			}
			canvas.renderAll();
			const objData = activeObject.toObject();
			objData.id = activeObject.id;
			sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		}
	};

	const handleDrawOptionsChange = (options: any) => {
		// Update current options for new objects
		currentDrawOptions = { ...options };

		if (!canvas) return;

		// First, check if there's an active path object selected and update it
		const activeObject = canvas.getActiveObject();
		if (activeObject && activeObject.type === 'path') {
			activeObject.set({
				strokeWidth: options.brushSize,
				stroke: options.brushColour,
				opacity: options.opacity
			});
			canvas.renderAll();
			const objData = activeObject.toObject();
			objData.id = activeObject.id;
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

	const handleLineArrowOptionsChange = (options: any) => {
		// Update current options for new objects
		currentLineArrowOptions = { ...options };

		if (!canvas) return;
		const activeObject = canvas.getActiveObject();
		if (activeObject && (activeObject.type === 'line' || activeObject.type === 'group')) {
			if (activeObject.type === 'line') {
				activeObject.set({
					strokeWidth: options.strokeWidth,
					stroke: options.strokeColour,
					strokeDashArray: options.strokeDashArray,
					opacity: options.opacity
				});
			} else if (activeObject.type === 'group') {
				// Handle arrow group - update all objects in the group
				(activeObject as any).forEachObject((obj: any) => {
					if (obj.type === 'line') {
						obj.set({
							strokeWidth: options.strokeWidth,
							stroke: options.strokeColour,
							strokeDashArray: options.strokeDashArray,
							opacity: options.opacity
						});
					}
				});
			}
			canvas.renderAll();
			const objData = activeObject.toObject();
			objData.id = activeObject.id;
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
		if (!canvas || !history.canUndo()) return;

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
		if (!canvas || !history.canRedo()) return;

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
			WebSocketHandler = await import('$lib/components/whiteboard/websocket');

			// Initialize history
			history = new CanvasHistory();

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

			// Setup WebSocket connection for real-time collaboration
			socket = WebSocketHandler.setupWebSocket(
				`/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${taskId}/whiteboard/ws`,
				canvas,
				whiteboardIdNum
			);

			// Setup all canvas event handlers using the extracted module
			const canvasEventContext: CanvasEventContext = {
				// State getters
				getSelectedTool: () => selectedTool,
				getShowFloatingMenu: () => showFloatingMenu,
				getIsPanMode: () => isPanMode,
				getIsDrawingText: () => isDrawingText,
				getIsDrawingShape: () => isDrawingShape,
				getIsDrawingLine: () => isDrawingLine,
				getIsDrawingArrow: () => isDrawingArrow,
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
				setIsDrawingArrow: (value) => {
					isDrawingArrow = value;
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

				// Options getters
				getCurrentTextOptions: () => currentTextOptions,
				getCurrentShapeOptions: () => currentShapeOptions,
				getCurrentDrawOptions: () => currentDrawOptions,
				getCurrentLineArrowOptions: () => currentLineArrowOptions,

				// Callbacks
				sendCanvasUpdate,
				sendImageUpdate,
				clearEraserState,

				// Refs
				floatingMenuRef: floatingMenuRef || undefined
			};

			CanvasEvents.setupCanvasEvents(canvas, canvasEventContext);

			// Setup history tracking
			// Track object additions
			canvas.on('object:added', (e: any) => {
				if (isApplyingHistory || !e.target) return;
				const objectId = e.target.id;
				if (objectId) {
					const objectData = e.target.toObject();
					objectData.id = objectId;
					history.recordAdd(objectId, objectData);
					canUndo = history.canUndo();
					canRedo = history.canRedo();
				}
			});

			// Track object modifications (store previous state before modification)
			const objectStates = new Map<string, Record<string, unknown>>();
			canvas.on('object:modified', (e: any) => {
				if (isApplyingHistory || !e.target) return;
				const objectId = e.target.id;
				if (objectId) {
					const previousData = objectStates.get(objectId);
					const newData = e.target.toObject();
					newData.id = objectId;

					if (previousData) {
						history.recordModify(objectId, previousData, newData);
						objectStates.delete(objectId);
					}
					canUndo = history.canUndo();
					canRedo = history.canRedo();
				}
			});

			// Store state before modification starts
			canvas.on('object:moving', (e: any) => {
				if (isApplyingHistory || !e.target) return;
				const objectId = e.target.id;
				if (objectId && !objectStates.has(objectId)) {
					const state = e.target.toObject();
					state.id = objectId;
					objectStates.set(objectId, state);
				}
			});

			canvas.on('object:scaling', (e: any) => {
				if (isApplyingHistory || !e.target) return;
				const objectId = e.target.id;
				if (objectId && !objectStates.has(objectId)) {
					const state = e.target.toObject();
					state.id = objectId;
					objectStates.set(objectId, state);
				}
			});

			canvas.on('object:rotating', (e: any) => {
				if (isApplyingHistory || !e.target) return;
				const objectId = e.target.id;
				if (objectId && !objectStates.has(objectId)) {
					const state = e.target.toObject();
					state.id = objectId;
					objectStates.set(objectId, state);
				}
			});

			// Track object removals
			canvas.on('object:removed', (e: any) => {
				if (isApplyingHistory || !e.target) return;
				const objectId = e.target.id;
				if (objectId) {
					const objectData = e.target.toObject();
					objectData.id = objectId;
					history.recordDelete(objectId, objectData);
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
			</div>
		</header>

		<!-- Whiteboard Canvas -->
		<main class="relative flex flex-1 items-center justify-center overflow-hidden p-4">
			<!-- Floating Toolbar -->
			<WhiteboardToolbar
				{selectedTool}
				onSelectTool={setSelectTool}
				onPanTool={setPanTool}
				onDrawTool={setDrawTool}
				onLineTool={setLineTool}
				onArrowTool={setArrowTool}
				onAddShape={addShape}
				onAddText={addText}
				onAddImage={addImage}
				onEraserTool={setEraserTool}
				onClearCanvas={clearCanvas}
			/>

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
				onLineArrowOptionsChange={handleLineArrowOptionsChange}
				onBringToFront={handleBringToFront}
				onSendToBack={handleSendToBack}
				onMoveForward={handleMoveForward}
				onMoveBackward={handleMoveBackward}
			/>
			<!-- Zoom Controls -->
			<WhiteboardZoomControls
				{currentZoom}
				onZoomIn={zoomIn}
				onZoomOut={zoomOut}
				onResetZoom={resetZoom}
				onRecenterView={recenterView}
				onUndo={handleUndo}
				onRedo={handleRedo}
				{canUndo}
				{canRedo}
			/>
		</main>
	</div>
</Tooltip.Provider>
