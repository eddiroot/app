import * as fabric from 'fabric';

/**
 * Configure control appearance and behavior for all objects
 */
export const CONTROL_STYLES = {
	cornerSize: 12,
	cornerColor: 'oklch(0.6171 0.1375 39.0427)',
	cornerStrokeColor: '#ffffff',
	cornerStyle: 'circle' as const,
	transparentCorners: false,
	borderColor: 'oklch(0.6171 0.1375 39.0427)',
	borderScaleFactor: 2,
	padding: 0
};

/**
 * Apply control styles to an object
 */
export function applyControlStyles(obj: fabric.Object): void {
	obj.set({
		cornerSize: CONTROL_STYLES.cornerSize,
		cornerColor: CONTROL_STYLES.cornerColor,
		cornerStrokeColor: CONTROL_STYLES.cornerStrokeColor,
		cornerStyle: CONTROL_STYLES.cornerStyle,
		transparentCorners: CONTROL_STYLES.transparentCorners,
		borderColor: CONTROL_STYLES.borderColor,
		borderScaleFactor: CONTROL_STYLES.borderScaleFactor,
		padding: CONTROL_STYLES.padding
	});
}

/**
 * Configure controls for line objects
 * Lines have two endpoint controls that can be freely moved to resize and rotate
 */
export function configureLineControls(line: fabric.Polyline): void {
	applyControlStyles(line);

	// Only show the two endpoint controls
	line.setControlsVisibility({
		mt: false,
		mb: false,
		ml: false,
		mr: false,
		tl: true, // start point
		tr: false,
		bl: false,
		br: true, // end point
		mtr: false // no rotation control point
	});

	// Hide the border box, show only endpoint controls
	line.set({
		hasBorders: false,
		hasRotatingPoint: false,
		lockScalingX: false,
		lockScalingY: false,
		lockRotation: false,
		lockMovementX: false,
		lockMovementY: false
	});

	// Customize the controls to act as moveable endpoints
	// For Polyline, we update the points array
	const createLineEndpointAction = (isStart: boolean) => {
		// actionHandler signature: (eventData, transform, x, y)
		return (_eventData: unknown, transform: unknown, x: number, y: number) => {
			const t = transform as unknown as { target: fabric.Polyline };
			const target = t.target as fabric.Polyline;

			// Prevent other endpoint from taking over while dragging this one
			const side = isStart ? 'start' : 'end';
			const targetWithFlag = target as unknown as { __draggingEndpoint?: string };
			const currentDragging = targetWithFlag.__draggingEndpoint;
			if (currentDragging && currentDragging !== side) return false;
			// Mark this endpoint as being dragged
			if (!currentDragging) targetWithFlag.__draggingEndpoint = side;

			// Use the x, y parameters provided by Fabric - they're already in the object's coordinate space
			const local = new fabric.Point(x, y);

			const newPoints = [...target.points];
			if (isStart) {
				newPoints[0] = { x: local.x, y: local.y };
			} else {
				newPoints[1] = { x: local.x, y: local.y };
			}
			target.set({ points: newPoints });

			target.setCoords();
			target.canvas?.requestRenderAll();
			return true;
		};
	};

	if (line.controls) {
		// Top-left control (start point of line)
		line.controls.tl = new fabric.Control({
			x: -0.5,
			y: -0.5,
			actionHandler: createLineEndpointAction(true),
			cursorStyle: 'pointer',
			actionName: 'modifyLineStart',
			mouseUpHandler: (_eventData: unknown, transform: unknown) => {
				const t = transform as unknown as { target: fabric.Line };
				if (t?.target) {
					const obj = t.target as unknown as { __draggingEndpoint?: string };
					obj.__draggingEndpoint = undefined;
				}
				return true;
			}
		});

		// Bottom-right control (end point of line)
		line.controls.br = new fabric.Control({
			x: 0.5,
			y: 0.5,
			actionHandler: createLineEndpointAction(false),
			cursorStyle: 'pointer',
			actionName: 'modifyLineEnd',
			mouseUpHandler: (_eventData: unknown, transform: unknown) => {
				const t = transform as unknown as { target: fabric.Line };
				if (t?.target) {
					const obj = t.target as unknown as { __draggingEndpoint?: string };
					obj.__draggingEndpoint = undefined;
				}
				return true;
			}
		});
	}

	// Initialise control positions to match actual line endpoints
	recalculateLineControlPositions(line);
}

/**
 * Recalculate line control positions based on current endpoint coordinates
 * Call this after line creation or when endpoints change
 */
export function recalculateLineControlPositions(line: fabric.Polyline): void {
	try {
		const x1 = line.points[0].x as number;
		const y1 = line.points[0].y as number;
		const x2 = line.points[1].x as number;
		const y2 = line.points[1].y as number;

		const width = Math.abs(x2 - x1) || 1;
		const height = Math.abs(y2 - y1) || 1;
		const centerX = (x1 + x2) / 2;
		const centerY = (y1 + y2) / 2;

		if (line.controls && line.controls.tl) {
			line.controls.tl.x = (x1 - centerX) / width;
			line.controls.tl.y = (y1 - centerY) / height;
		}
		if (line.controls && line.controls.br) {
			line.controls.br.x = (x2 - centerX) / width;
			line.controls.br.y = (y2 - centerY) / height;
		}
	} catch {
		// ignore
	}
}

/**
 * Configure controls for circle objects
 * Circles should maintain aspect ratio (uniform scaling only)
 */
export function configureCircleControls(circle: fabric.Circle): void {
	applyControlStyles(circle);

	// Hide middle controls, only show corners
	circle.setControlsVisibility({
		mt: false,
		mb: false,
		ml: false,
		mr: false,
		mtr: true // keep rotation
	});

	// Lock aspect ratio to keep it circular
	circle.set({
		lockScalingFlip: true
	});
}

/**
 * Configure controls for rectangle objects
 */
export function configureRectangleControls(rect: fabric.Rect): void {
	applyControlStyles(rect);

	// Show all controls for free resizing
	rect.setControlsVisibility({
		mt: true,
		mb: true,
		ml: true,
		mr: true,
		mtr: true
	});
}

/**
 * Configure controls for triangle objects
 */
export function configureTriangleControls(triangle: fabric.Triangle): void {
	applyControlStyles(triangle);

	// Show corner controls only
	triangle.setControlsVisibility({
		mt: false,
		mb: false,
		ml: false,
		mr: false,
		mtr: true
	});
}

/**
 * Configure controls for text objects
 * Text should only resize horizontally, height adjusts automatically
 */
export function configureTextControls(text: fabric.Textbox): void {
	applyControlStyles(text);

	// Only allow horizontal resizing (width adjustment)
	text.setControlsVisibility({
		mt: false,
		mb: false,
		ml: true,
		mr: true,
		tl: false,
		tr: false,
		bl: false,
		br: false,
		mtr: true // keep rotation
	});

	// Lock vertical scaling
	text.set({
		lockScalingY: true,
		lockScalingFlip: true
	});
}

/**
 * Configure controls for image objects
 */
export function configureImageControls(image: fabric.FabricImage): void {
	applyControlStyles(image);

	// Show all corner controls
	image.setControlsVisibility({
		mt: false,
		mb: false,
		ml: false,
		mr: false,
		mtr: true
	});

	// Optionally maintain aspect ratio for images
	image.set({
		lockScalingFlip: true
	});
}

/**
 * Configure controls for path (drawing) objects
 */
export function configurePathControls(path: fabric.Path): void {
	applyControlStyles(path);

	// Show all controls
	path.setControlsVisibility({
		mt: true,
		mb: true,
		ml: true,
		mr: true,
		mtr: true
	});
}

/**
 * Configure controls for arrow groups
 * Arrows should maintain their shape when resized
 */
export function configureArrowControls(group: fabric.Group): void {
	applyControlStyles(group);

	// Only allow endpoints to move, similar to lines
	group.setControlsVisibility({
		mt: false,
		mb: false,
		ml: false,
		mr: false,
		tl: true, // start point
		tr: false,
		bl: false,
		br: true, // end point
		mtr: false // no rotation
	});

	// Lock scaling and rotation
	group.set({
		lockScalingX: true,
		lockScalingY: true,
		lockRotation: true,
		hasRotatingPoint: false
	});

	// Action handler to move arrow endpoints (group contains [line, head1, head2] as Polylines)
	const createArrowEndpointAction = (isStart: boolean) => {
		// actionHandler signature: (eventData, transform, x, y)
		return (_eventData: unknown, transform: unknown, x: number, y: number) => {
			const t = transform as unknown as { target: fabric.Group };
			const target = t.target as fabric.Group;

			// Prevent other endpoint from taking over while dragging this one
			const side = isStart ? 'start' : 'end';
			const targetWithFlag = target as unknown as { __draggingEndpoint?: string };
			const currentDragging = targetWithFlag.__draggingEndpoint;
			if (currentDragging && currentDragging !== side) return false;
			if (!currentDragging) targetWithFlag.__draggingEndpoint = side;

			// Use the x, y parameters provided by Fabric - they're already in the object's coordinate space
			const local = new fabric.Point(x, y);

			// Expect children order: [line, arrowHead1, arrowHead2]
			const objs = target.getObjects();
			const line = objs[0] as fabric.Polyline | undefined;
			const head1 = objs[1] as fabric.Polyline | undefined;
			const head2 = objs[2] as fabric.Polyline | undefined;
			if (!line || !line.points || line.points.length < 2) return false;

			// Update the line's points array
			const newLinePoints = [...line.points];
			if (isStart) {
				newLinePoints[0] = { x: local.x, y: local.y };
			} else {
				newLinePoints[1] = { x: local.x, y: local.y };
			}
			line.set({ points: newLinePoints });

			// Recompute arrowheads based on the updated line coordinates
			const x1 = newLinePoints[0].x;
			const y1 = newLinePoints[0].y;
			const x2 = newLinePoints[1].x;
			const y2 = newLinePoints[1].y;
			const angle = Math.atan2(y2 - y1, x2 - x1);
			const arrowLength = 15;
			const arrowAngle = Math.PI / 6;
			const p1 = {
				x: x2 - arrowLength * Math.cos(angle - arrowAngle),
				y: y2 - arrowLength * Math.sin(angle - arrowAngle)
			};
			const p2 = {
				x: x2 - arrowLength * Math.cos(angle + arrowAngle),
				y: y2 - arrowLength * Math.sin(angle + arrowAngle)
			};

			if (head1) {
				head1.set({
					points: [
						{ x: x2, y: y2 },
						{ x: p1.x, y: p1.y }
					]
				});
			}
			if (head2) {
				head2.set({
					points: [
						{ x: x2, y: y2 },
						{ x: p2.x, y: p2.y }
					]
				});
			}

			// Update control positions for the group so controls follow endpoints
			try {
				const width = Math.abs(x2 - x1) || 1;
				const height = Math.abs(y2 - y1) || 1;
				const centerX = (x1 + x2) / 2;
				const centerY = (y1 + y2) / 2;

				if (target.controls && target.controls.tl) {
					target.controls.tl.x = (x1 - centerX) / width;
					target.controls.tl.y = (y1 - centerY) / height;
				}
				if (target.controls && target.controls.br) {
					target.controls.br.x = (x2 - centerX) / width;
					target.controls.br.y = (y2 - centerY) / height;
				}
			} catch {
				// ignore
			}

			target.setCoords();
			target.canvas?.requestRenderAll();
			return true;
		};
	};

	if (group.controls) {
		group.controls.tl = new fabric.Control({
			x: -0.5,
			y: -0.5,
			actionHandler: createArrowEndpointAction(true),
			cursorStyle: 'pointer',
			actionName: 'modifyArrowStart',
			mouseUpHandler: (_eventData: unknown, transform: unknown) => {
				const t = transform as unknown as { target: fabric.Group };
				if (t?.target) {
					const obj = t.target as unknown as { __draggingEndpoint?: string };
					obj.__draggingEndpoint = undefined;
				}
				return true;
			}
		});

		group.controls.br = new fabric.Control({
			x: 0.5,
			y: 0.5,
			actionHandler: createArrowEndpointAction(false),
			cursorStyle: 'pointer',
			actionName: 'modifyArrowEnd',
			mouseUpHandler: (_eventData: unknown, transform: unknown) => {
				const t = transform as unknown as { target: fabric.Group };
				if (t?.target) {
					const obj = t.target as unknown as { __draggingEndpoint?: string };
					obj.__draggingEndpoint = undefined;
				}
				return true;
			}
		});
	}

	// Initialize control positions to match actual arrow endpoints
	recalculateArrowControlPositions(group);
}

/**
 * Recalculate arrow control positions based on current endpoint coordinates
 * Call this after arrow creation or when endpoints change
 */
export function recalculateArrowControlPositions(group: fabric.Group): void {
	try {
		const objs = group.getObjects();
		const line = objs[0] as fabric.Polyline | undefined;
		if (line && line.points && line.points.length >= 2) {
			const x1 = line.points[0].x;
			const y1 = line.points[0].y;
			const x2 = line.points[1].x;
			const y2 = line.points[1].y;

			const width = Math.abs(x2 - x1) || 1;
			const height = Math.abs(y2 - y1) || 1;
			const centerX = (x1 + x2) / 2;
			const centerY = (y1 + y2) / 2;

			if (group.controls && group.controls.tl) {
				group.controls.tl.x = (x1 - centerX) / width;
				group.controls.tl.y = (y1 - centerY) / height;
			}
			if (group.controls && group.controls.br) {
				group.controls.br.x = (x2 - centerX) / width;
				group.controls.br.y = (y2 - centerY) / height;
			}
		}
	} catch {
		// ignore
	}
}

/**
 * Auto-detect object type and apply appropriate controls
 */
export function configureObjectControls(obj: fabric.Object): void {
	if (obj instanceof fabric.Polyline) {
		configureLineControls(obj);
	} else if (obj instanceof fabric.Circle) {
		configureCircleControls(obj);
	} else if (obj instanceof fabric.Rect) {
		configureRectangleControls(obj);
	} else if (obj instanceof fabric.Triangle) {
		configureTriangleControls(obj);
	} else if (obj instanceof fabric.Textbox) {
		configureTextControls(obj);
	} else if (obj instanceof fabric.FabricImage) {
		configureImageControls(obj);
	} else if (obj instanceof fabric.Path) {
		configurePathControls(obj);
	} else if (obj instanceof fabric.Group) {
		// Check if it's an arrow group by checking for line children
		const hasLines = obj.getObjects().some((child) => child instanceof fabric.Line);
		if (hasLines) {
			configureArrowControls(obj);
		} else {
			applyControlStyles(obj);
		}
	} else {
		// Default controls for unknown types
		applyControlStyles(obj);
	}
}
