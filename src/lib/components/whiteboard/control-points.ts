import * as fabric from 'fabric';

/**
 * Interface for a control point visual element
 */
export interface ControlPoint {
	id: string;
	circle: fabric.Circle;
	objectId: string;
	pointIndex: number;
}

/**
 * Abstract base class for control point handlers
 * Each object type (line, rectangle, etc.) will extend this
 */
export abstract class ControlPointHandler {
	protected canvas: fabric.Canvas;
	protected controlPoints: ControlPoint[] = [];

	constructor(canvas: fabric.Canvas) {
		this.canvas = canvas;
	}

	/**
	 * Add control points for an object
	 */
	abstract addControlPoints(objectId: string, obj: fabric.Object, visible?: boolean): void;

	/**
	 * Remove control points for an object
	 */
	removeControlPoints(objectId: string): void {
		const pointsToRemove = this.controlPoints.filter((cp) => cp.objectId === objectId);
		pointsToRemove.forEach((cp) => {
			this.canvas.remove(cp.circle);
		});
		this.controlPoints = this.controlPoints.filter((cp) => cp.objectId !== objectId);
		this.canvas.renderAll();
	}

	/**
	 * Hide control points for an object
	 */
	hideControlPoints(objectId: string): void {
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId);
		points.forEach((cp) => {
			cp.circle.set({ visible: false });
		});
		this.canvas.renderAll();
	}

	/**
	 * Show control points for an object
	 */
	showControlPoints(objectId: string): void {
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId);
		points.forEach((cp) => {
			cp.circle.set({ visible: true });
		});
		this.canvas.renderAll();
	}

	/**
	 * Hide all control points
	 */
	hideAllControlPoints(): void {
		this.controlPoints.forEach((cp) => {
			cp.circle.set({ visible: false });
		});
		this.canvas.renderAll();
	}

	/**
	 * Update control point positions when object is moved/transformed
	 */
	abstract updateControlPoints(objectId: string, obj: fabric.Object): void;

	/**
	 * Update the object when a control point is dragged
	 */
	abstract updateObjectFromControlPoint(controlPointId: string, newX: number, newY: number): void;

	/**
	 * Get all control points for a specific object
	 */
	getControlPointsForObject(objectId: string): ControlPoint[] {
		return this.controlPoints.filter((cp) => cp.objectId === objectId);
	}

	/**
	 * Get all control points
	 */
	getAllControlPoints(): ControlPoint[] {
		return this.controlPoints;
	}

	/**
	 * Check if a circle is a control point
	 */
	isControlPoint(obj: fabric.Object): boolean {
		return (obj as any).isControlPoint === true;
	}

	/**
	 * Bring all control points to the front of the canvas
	 */
	bringControlPointsToFront(): void {
		this.controlPoints.forEach((cp) => {
			this.canvas.bringObjectToFront(cp.circle);
		});
	}

	/**
	 * Create a visual control point circle
	 */
	protected createControlPointCircle(
		x: number,
		y: number,
		controlPointId: string,
		objectId: string,
		pointIndex: number
	): fabric.Circle {
		const circle = new fabric.Circle({
			radius: 6,
			fill: 'oklch(0.6171 0.1375 39.0427)',
			stroke: 'oklch(0.5171 0.1375 39.0427)',
			strokeWidth: 2,
			left: x,
			top: y,
			originX: 'center',
			originY: 'center',
			selectable: true,
			hasControls: false,
			hasBorders: false,
			hoverCursor: 'move',
			evented: true,
			excludeFromExport: true // Exclude from canvas serialization
		});

		// Add custom properties to identify this as a control point
		(circle as any).id = controlPointId;
		(circle as any).isControlPoint = true;
		(circle as any).linkedObjectId = objectId;
		(circle as any).pointIndex = pointIndex;

		return circle;
	}
}

/**
 * Control point handler for polylines (lines and arrows)
 */
export class LineControlPoints extends ControlPointHandler {
	addControlPoints(objectId: string, obj: fabric.Object, visible: boolean = true): void {
		const line = obj as fabric.Polyline;
		const points = line.points;
		if (!points || points.length < 2) return;

		// Get the line's transformation matrix to calculate absolute positions
		const matrix = line.calcTransformMatrix();

		// Create control points at start and end of line
		[0, points.length - 1].forEach((pointIndex) => {
			const point = points[pointIndex];
			// Transform the point to absolute coordinates
			const absolutePoint = fabric.util.transformPoint(
				new fabric.Point(point.x - line.pathOffset.x, point.y - line.pathOffset.y),
				matrix
			);

			const controlPointId = `${objectId}-cp-${pointIndex}`;
			const circle = this.createControlPointCircle(
				absolutePoint.x,
				absolutePoint.y,
				controlPointId,
				objectId,
				pointIndex
			);

			// Set initial visibility
			circle.set({ visible });

			this.canvas.add(circle);

			// Store the control point reference
			this.controlPoints.push({
				id: controlPointId,
				circle,
				objectId,
				pointIndex
			});
		});

		// Ensure all control points are on top
		this.bringControlPointsToFront();
		this.canvas.renderAll();
	}

	updateControlPoints(objectId: string, obj: fabric.Object): void {
		const line = obj as fabric.Polyline;
		const controlPoints = this.getControlPointsForObject(objectId);
		if (controlPoints.length === 0) return;

		const points = line.points;
		if (!points || points.length < 2) return;

		// Get the line's transformation matrix to calculate absolute positions
		const matrix = line.calcTransformMatrix();

		// Update each control point position
		controlPoints.forEach((cp) => {
			const point = points[cp.pointIndex];
			const absolutePoint = fabric.util.transformPoint(
				new fabric.Point(point.x - line.pathOffset.x, point.y - line.pathOffset.y),
				matrix
			);
			cp.circle.set({
				left: absolutePoint.x,
				top: absolutePoint.y
			});
			cp.circle.setCoords();
		});

		this.canvas.renderAll();
	}

	updateObjectFromControlPoint(controlPointId: string, newX: number, newY: number): void {
		// Find the control point
		const controlPoint = this.controlPoints.find((cp) => cp.id === controlPointId);
		if (!controlPoint) return;

		// Update the control point circle position immediately
		controlPoint.circle.set({
			left: newX,
			top: newY
		});
		controlPoint.circle.setCoords();

		// Find the line on the canvas
		const line = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'polyline') as
			| fabric.Polyline
			| undefined;
		if (!line || !line.points) return;

		// Get the line's current transformation matrix
		const matrix = line.calcTransformMatrix();

		// Convert all current points to absolute coordinates
		const absolutePoints = line.points.map((point) => {
			return fabric.util.transformPoint(
				new fabric.Point(point.x - line.pathOffset.x, point.y - line.pathOffset.y),
				matrix
			);
		});

		// Update the dragged point to the new position
		absolutePoints[controlPoint.pointIndex] = new fabric.Point(newX, newY);

		// Store line properties before removal
		const lineId = (line as any).id;
		const lineProps = {
			stroke: line.stroke,
			strokeWidth: line.strokeWidth,
			strokeDashArray: line.strokeDashArray,
			opacity: line.opacity
		};

		// Remove old line
		this.canvas.remove(line);

		// Create new line with absolute points (no transformations)
		const newLine = new fabric.Polyline(absolutePoints, {
			id: lineId,
			stroke: lineProps.stroke,
			strokeWidth: lineProps.strokeWidth,
			strokeDashArray: lineProps.strokeDashArray,
			opacity: lineProps.opacity,
			selectable: true,
			hasControls: false,
			hasBorders: false,
			strokeUniform: true
		});

		this.canvas.add(newLine);

		// Bring control points to front
		this.bringControlPointsToFront();

		// Update other control point positions
		const otherControlPoints = this.controlPoints.filter(
			(cp) => cp.objectId === controlPoint.objectId && cp.id !== controlPointId
		);

		const newMatrix = newLine.calcTransformMatrix();
		otherControlPoints.forEach((cp) => {
			const point = absolutePoints[cp.pointIndex];
			cp.circle.set({
				left: point.x,
				top: point.y
			});
			cp.circle.setCoords();
		});

		this.canvas.renderAll();
	}

	/**
	 * Get the updated line object after a control point was moved
	 * Returns the new line object so it can be sent to other users
	 */
	getUpdatedLine(controlPointId: string): fabric.Polyline | null {
		const controlPoint = this.controlPoints.find((cp) => cp.id === controlPointId);
		if (!controlPoint) return null;

		const line = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'polyline') as
			| fabric.Polyline
			| undefined;

		return line || null;
	}
}

/**
 * Central manager for all control points on the canvas
 */
export class ControlPointManager {
	private canvas: fabric.Canvas;
	private handlers: Map<string, ControlPointHandler> = new Map();
	private lineHandler: LineControlPoints;
	private sendCanvasUpdate?: (data: Record<string, unknown>) => void;

	constructor(canvas: fabric.Canvas, sendCanvasUpdate?: (data: Record<string, unknown>) => void) {
		this.canvas = canvas;
		this.sendCanvasUpdate = sendCanvasUpdate;

		// Initialize handlers for different object types
		this.lineHandler = new LineControlPoints(canvas);
		this.handlers.set('polyline', this.lineHandler);
	}

	/**
	 * Add control points for an object based on its type
	 */
	addControlPoints(objectId: string, obj: fabric.Object, visible: boolean = true): void {
		const handler = this.handlers.get(obj.type || '');
		if (handler) {
			handler.addControlPoints(objectId, obj, visible);
		}
	}

	/**
	 * Remove control points for an object
	 */
	removeControlPoints(objectId: string): void {
		// Try all handlers since we don't know which one has the control points
		this.handlers.forEach((handler) => {
			handler.removeControlPoints(objectId);
		});
	}

	/**
	 * Hide control points for an object
	 */
	hideControlPoints(objectId: string): void {
		this.handlers.forEach((handler) => {
			handler.hideControlPoints(objectId);
		});
	}

	/**
	 * Show control points for an object
	 */
	showControlPoints(objectId: string): void {
		this.handlers.forEach((handler) => {
			handler.showControlPoints(objectId);
		});
	}

	/**
	 * Hide all control points across all handlers
	 */
	hideAllControlPoints(): void {
		this.handlers.forEach((handler) => {
			handler.hideAllControlPoints();
		});
	}

	/**
	 * Update control point positions when an object is moved/transformed
	 */
	updateControlPoints(objectId: string, obj: fabric.Object): void {
		const handler = this.handlers.get(obj.type || '');
		if (handler) {
			handler.updateControlPoints(objectId, obj);
		}
	}

	/**
	 * Update the object when a control point is dragged
	 */
	updateObjectFromControlPoint(controlPointId: string, newX: number, newY: number): void {
		// Find which handler has this control point
		for (const handler of this.handlers.values()) {
			const allPoints = handler.getAllControlPoints();
			if (allPoints.some((cp) => cp.id === controlPointId)) {
				handler.updateObjectFromControlPoint(controlPointId, newX, newY);

				// Send canvas update after modifying the object
				if (this.sendCanvasUpdate) {
					// Find the modified object and send its update
					const controlPoint = allPoints.find((cp) => cp.id === controlPointId);
					if (controlPoint) {
						const modifiedObj = this.canvas
							.getObjects()
							.find((obj: any) => obj.id === controlPoint.objectId) as fabric.Polyline | undefined;
						if (modifiedObj && modifiedObj.type === 'polyline') {
							// Create a clean serialization with just the essential data
							// This avoids transformation issues when reconstructing on remote clients
							const objData = {
								id: (modifiedObj as any).id,
								type: 'polyline',
								points: modifiedObj.points,
								stroke: modifiedObj.stroke,
								strokeWidth: modifiedObj.strokeWidth,
								strokeDashArray: modifiedObj.strokeDashArray,
								opacity: modifiedObj.opacity,
								selectable: true,
								hasControls: false,
								hasBorders: false,
								isControlPointUpdate: true // Mark this as a control point update
							};
							this.sendCanvasUpdate({
								type: 'modify',
								object: objData
							});
						}
					}
				}
				return;
			}
		}
	}

	/**
	 * Check if a given object is a control point
	 */
	isControlPoint(obj: fabric.Object): boolean {
		return (obj as any).isControlPoint === true;
	}

	/**
	 * Get the line handler (for backward compatibility and special operations)
	 */
	getLineHandler(): LineControlPoints {
		return this.lineHandler;
	}

	/**
	 * Bring all control points to the front
	 */
	bringAllControlPointsToFront(): void {
		this.handlers.forEach((handler) => {
			handler.bringControlPointsToFront();
		});
	}

	/**
	 * Get all control points across all handlers
	 */
	getAllControlPoints(): ControlPoint[] {
		const allPoints: ControlPoint[] = [];
		this.handlers.forEach((handler) => {
			allPoints.push(...handler.getAllControlPoints());
		});
		return allPoints;
	}
}
