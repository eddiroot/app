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
		pointIndex: number,
		selectable: boolean = true
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
			selectable: selectable,
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
 * Control point handler for rectangles
 */
export class RectangleControlPoints extends ControlPointHandler {
	private edgeLines: Map<string, fabric.Line> = new Map();

	addControlPoints(objectId: string, obj: fabric.Object, visible: boolean = true): void {
		const rect = obj as fabric.Rect;
		const left = rect.left || 0;
		const top = rect.top || 0;
		const width = rect.width || 0;
		const height = rect.height || 0;

		// Get transformation matrix for handling rotations/scaling
		const matrix = rect.calcTransformMatrix();

		// Define the 4 corners in local coordinates
		const corners = [
			{ x: -width / 2, y: -height / 2 }, // Top-left
			{ x: width / 2, y: -height / 2 }, // Top-right
			{ x: width / 2, y: height / 2 }, // Bottom-right
			{ x: -width / 2, y: height / 2 } // Bottom-left
		];

		// Transform corners to absolute coordinates
		const absoluteCorners = corners.map((corner) =>
			fabric.util.transformPoint(new fabric.Point(corner.x, corner.y), matrix)
		);

		// Create control points at corners (selectable to allow dragging)
		absoluteCorners.forEach((corner, index) => {
			const controlPointId = `${objectId}-cp-${index}`;
			const circle = this.createControlPointCircle(
				corner.x,
				corner.y,
				controlPointId,
				objectId,
				index,
				true // Must be selectable for dragging
			);
			circle.set({ visible });
			this.canvas.add(circle);
			this.controlPoints.push({
				id: controlPointId,
				circle,
				objectId,
				pointIndex: index
			});
		});

		// Create edge midpoint control points
		const edgeMidpoints = [
			{
				x: (absoluteCorners[0].x + absoluteCorners[1].x) / 2,
				y: (absoluteCorners[0].y + absoluteCorners[1].y) / 2,
				edgeIndex: 4, // Top edge
				cursor: 'ns-resize'
			},
			{
				x: (absoluteCorners[1].x + absoluteCorners[2].x) / 2,
				y: (absoluteCorners[1].y + absoluteCorners[2].y) / 2,
				edgeIndex: 5, // Right edge
				cursor: 'ew-resize'
			},
			{
				x: (absoluteCorners[2].x + absoluteCorners[3].x) / 2,
				y: (absoluteCorners[2].y + absoluteCorners[3].y) / 2,
				edgeIndex: 6, // Bottom edge
				cursor: 'ns-resize'
			},
			{
				x: (absoluteCorners[3].x + absoluteCorners[0].x) / 2,
				y: (absoluteCorners[3].y + absoluteCorners[0].y) / 2,
				edgeIndex: 7, // Left edge
				cursor: 'ew-resize'
			}
		];

		// Add edge midpoint control points (indices 8-11, selectable for dragging)
		edgeMidpoints.forEach((midpoint, index) => {
			const pointIndex = 8 + index; // 8, 9, 10, 11 for top, right, bottom, left
			const controlPointId = `${objectId}-cp-${pointIndex}`;
			const circle = this.createControlPointCircle(
				midpoint.x,
				midpoint.y,
				controlPointId,
				objectId,
				pointIndex,
				true // Must be selectable for dragging
			);
			circle.set({
				visible,
				hoverCursor: midpoint.cursor
			});
			// Mark this as an edge midpoint
			(circle as any).isEdgeMidpoint = true;
			(circle as any).edgeIndex = midpoint.edgeIndex;

			this.canvas.add(circle);
			this.controlPoints.push({
				id: controlPointId,
				circle,
				objectId,
				pointIndex
			});
		});

		this.bringControlPointsToFront();
		this.canvas.renderAll();
	}

	removeControlPoints(objectId: string): void {
		// Remove corner control points
		const pointsToRemove = this.controlPoints.filter((cp) => cp.objectId === objectId);
		pointsToRemove.forEach((cp) => {
			this.canvas.remove(cp.circle);
		});
		this.controlPoints = this.controlPoints.filter((cp) => cp.objectId !== objectId);

		// Remove edge lines
		const edgeLinesToRemove: string[] = [];
		this.edgeLines.forEach((line, id) => {
			if ((line as any).linkedObjectId === objectId) {
				this.canvas.remove(line);
				edgeLinesToRemove.push(id);
			}
		});
		edgeLinesToRemove.forEach((id) => this.edgeLines.delete(id));

		this.canvas.renderAll();
	}

	hideControlPoints(objectId: string): void {
		// Hide corner points
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId);
		points.forEach((cp) => {
			cp.circle.set({ visible: false });
		});

		// Hide edge lines
		this.edgeLines.forEach((line) => {
			if ((line as any).linkedObjectId === objectId) {
				line.set({ visible: false });
			}
		});

		this.canvas.renderAll();
	}

	showControlPoints(objectId: string): void {
		// Show corner points
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId);
		points.forEach((cp) => {
			cp.circle.set({ visible: true });
		});

		// Show edge lines
		this.edgeLines.forEach((line) => {
			if ((line as any).linkedObjectId === objectId) {
				line.set({ visible: true });
			}
		});

		this.canvas.renderAll();
	}

	updateControlPoints(objectId: string, obj: fabric.Object): void {
		const rect = obj as fabric.Rect;
		const controlPoints = this.getControlPointsForObject(objectId);
		if (controlPoints.length === 0) return;

		const left = rect.left || 0;
		const top = rect.top || 0;
		const width = rect.width || 0;
		const height = rect.height || 0;

		// Get transformation matrix
		const matrix = rect.calcTransformMatrix();

		// Define corners in local coordinates
		const corners = [
			{ x: -width / 2, y: -height / 2 }, // Top-left
			{ x: width / 2, y: -height / 2 }, // Top-right
			{ x: width / 2, y: height / 2 }, // Bottom-right
			{ x: -width / 2, y: height / 2 } // Bottom-left
		];

		// Transform to absolute coordinates
		const absoluteCorners = corners.map((corner) =>
			fabric.util.transformPoint(new fabric.Point(corner.x, corner.y), matrix)
		);

		// Update corner control points (indices 0-3)
		controlPoints.forEach((cp) => {
			if (cp.pointIndex >= 0 && cp.pointIndex <= 3) {
				const corner = absoluteCorners[cp.pointIndex];
				cp.circle.set({
					left: corner.x,
					top: corner.y
				});
				cp.circle.setCoords();
			}
		});

		// Update edge midpoint control points (indices 8-11)
		const edgeMidpoints = [
			{
				x: (absoluteCorners[0].x + absoluteCorners[1].x) / 2,
				y: (absoluteCorners[0].y + absoluteCorners[1].y) / 2,
				pointIndex: 8 // Top edge
			},
			{
				x: (absoluteCorners[1].x + absoluteCorners[2].x) / 2,
				y: (absoluteCorners[1].y + absoluteCorners[2].y) / 2,
				pointIndex: 9 // Right edge
			},
			{
				x: (absoluteCorners[2].x + absoluteCorners[3].x) / 2,
				y: (absoluteCorners[2].y + absoluteCorners[3].y) / 2,
				pointIndex: 10 // Bottom edge
			},
			{
				x: (absoluteCorners[3].x + absoluteCorners[0].x) / 2,
				y: (absoluteCorners[3].y + absoluteCorners[0].y) / 2,
				pointIndex: 11 // Left edge
			}
		];

		edgeMidpoints.forEach((midpoint) => {
			const cp = controlPoints.find((cp) => cp.pointIndex === midpoint.pointIndex);
			if (cp) {
				cp.circle.set({
					left: midpoint.x,
					top: midpoint.y
				});
				cp.circle.setCoords();
			}
		});

		// Update edge lines
		const edges = [
			{ start: 0, end: 1, edgeIndex: 4 }, // Top
			{ start: 1, end: 2, edgeIndex: 5 }, // Right
			{ start: 2, end: 3, edgeIndex: 6 }, // Bottom
			{ start: 3, end: 0, edgeIndex: 7 } // Left
		];

		edges.forEach(({ start, end, edgeIndex }) => {
			const edgeId = `${objectId}-edge-${edgeIndex}`;
			const edgeLine = this.edgeLines.get(edgeId);
			if (edgeLine) {
				const startCorner = absoluteCorners[start];
				const endCorner = absoluteCorners[end];
				edgeLine.set({
					x1: startCorner.x,
					y1: startCorner.y,
					x2: endCorner.x,
					y2: endCorner.y
				});
				edgeLine.setCoords();
			}
		});

		this.canvas.renderAll();
	}

	updateObjectFromControlPoint(controlPointId: string, newX: number, newY: number): void {
		// Check if this is a control point (corner or edge midpoint)
		const controlPoint = this.controlPoints.find((cp) => cp.id === controlPointId);

		if (controlPoint) {
			// Check if it's a corner control point (0-3) or edge midpoint (8-11)
			if (controlPoint.pointIndex >= 0 && controlPoint.pointIndex <= 3) {
				// This is a corner control point
				this.updateFromCorner(controlPoint, newX, newY);
				return;
			} else if (controlPoint.pointIndex >= 8 && controlPoint.pointIndex <= 11) {
				// This is an edge midpoint control point
				const edgeIndex = (controlPoint.circle as any).edgeIndex;
				this.updateFromEdgeMidpoint(controlPoint, edgeIndex, newX, newY);
				return;
			}
		}

		// Check if this is an edge line
		const edgeLine = this.edgeLines.get(controlPointId);
		if (edgeLine) {
			const linkedObjectId = (edgeLine as any).linkedObjectId;
			const edgeIndex = (edgeLine as any).edgeIndex;
			this.updateFromEdge(linkedObjectId, edgeIndex, newX, newY);
		}
	}

	private updateFromEdgeMidpoint(
		controlPoint: ControlPoint,
		edgeIndex: number,
		newX: number,
		newY: number
	): void {
		// Update the control point position immediately
		controlPoint.circle.set({
			left: newX,
			top: newY
		});
		controlPoint.circle.setCoords();

		// Call updateFromEdge with the object ID and edge index
		this.updateFromEdge(controlPoint.objectId, edgeIndex, newX, newY);
	}

	private updateFromCorner(controlPoint: ControlPoint, newX: number, newY: number): void {
		// Update the control point position immediately
		controlPoint.circle.set({
			left: newX,
			top: newY
		});
		controlPoint.circle.setCoords();

		// Find the rectangle
		const rect = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'rect') as
			| fabric.Rect
			| undefined;
		if (!rect) return;

		const width = rect.width || 0;
		const height = rect.height || 0;

		// Calculate the four corners in absolute coordinates
		const matrix = rect.calcTransformMatrix();
		const corners: fabric.Point[] = [
			new fabric.Point(-width / 2, -height / 2), // Top-left (0)
			new fabric.Point(width / 2, -height / 2), // Top-right (1)
			new fabric.Point(width / 2, height / 2), // Bottom-right (2)
			new fabric.Point(-width / 2, height / 2) // Bottom-left (3)
		].map((corner) => fabric.util.transformPoint(corner, matrix));

		// Determine which corner is the opposite/anchor corner
		const oppositeCornerIndex = (controlPoint.pointIndex + 2) % 4;
		const anchorCorner = corners[oppositeCornerIndex];

		// Store the anchor corner's CURRENT position (we'll keep it fixed)
		const anchorCornerCP = this.getControlPointsForObject(controlPoint.objectId).find(
			(cp) => cp.pointIndex === oppositeCornerIndex
		);
		const anchorPosition = anchorCornerCP ? anchorCornerCP.circle.getCenterPoint() : anchorCorner;

		// The new dragged position
		const draggedCorner = new fabric.Point(newX, newY);

		// Calculate new rectangle bounds
		const minX = Math.min(draggedCorner.x, anchorPosition.x);
		const maxX = Math.max(draggedCorner.x, anchorPosition.x);
		const minY = Math.min(draggedCorner.y, anchorPosition.y);
		const maxY = Math.max(draggedCorner.y, anchorPosition.y);

		const newWidth = maxX - minX;
		const newHeight = maxY - minY;
		const newLeft = minX + newWidth / 2;
		const newTop = minY + newHeight / 2;

		// Store rectangle properties
		const rectId = (rect as any).id;
		const rectProps = {
			fill: rect.fill,
			stroke: rect.stroke,
			strokeWidth: rect.strokeWidth,
			strokeDashArray: rect.strokeDashArray,
			opacity: rect.opacity
		};

		// Remove old rectangle
		this.canvas.remove(rect);

		// Create new rectangle
		const newRect = new fabric.Rect({
			id: rectId,
			left: newLeft,
			top: newTop,
			width: newWidth,
			height: newHeight,
			fill: rectProps.fill,
			stroke: rectProps.stroke,
			strokeWidth: rectProps.strokeWidth,
			strokeDashArray: rectProps.strokeDashArray,
			opacity: rectProps.opacity,
			selectable: true,
			hasControls: false,
			hasBorders: false,
			strokeUniform: true,
			originX: 'center',
			originY: 'center'
		});

		this.canvas.add(newRect);
		this.bringControlPointsToFront();

		// Update ALL control points to match new rectangle
		this.updateControlPoints(controlPoint.objectId, newRect);

		// Restore the dragged corner to mouse position
		controlPoint.circle.set({
			left: newX,
			top: newY
		});
		controlPoint.circle.setCoords();

		// Restore the anchor corner to its fixed position
		if (anchorCornerCP) {
			anchorCornerCP.circle.set({
				left: anchorPosition.x,
				top: anchorPosition.y
			});
			anchorCornerCP.circle.setCoords();
		}

		this.canvas.renderAll();
	}

	/**
	 * Update edge lines based on actual corner positions
	 */
	private updateEdgeLinesFromCorners(objectId: string, cornerPositions: fabric.Point[]): void {
		const edges = [
			{ start: 0, end: 1, edgeIndex: 4 }, // Top
			{ start: 1, end: 2, edgeIndex: 5 }, // Right
			{ start: 2, end: 3, edgeIndex: 6 }, // Bottom
			{ start: 3, end: 0, edgeIndex: 7 } // Left
		];

		edges.forEach(({ start, end, edgeIndex }) => {
			const edgeId = `${objectId}-edge-${edgeIndex}`;
			const edgeLine = this.edgeLines.get(edgeId);
			if (edgeLine) {
				const startCorner = cornerPositions[start];
				const endCorner = cornerPositions[end];
				edgeLine.set({
					x1: startCorner.x,
					y1: startCorner.y,
					x2: endCorner.x,
					y2: endCorner.y
				});
				edgeLine.setCoords();
			}
		});
	}

	private updateFromEdge(objectId: string, edgeIndex: number, newX: number, newY: number): void {
		// Find the rectangle
		const rect = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === objectId && obj.type === 'rect') as fabric.Rect | undefined;
		if (!rect) return;

		const left = rect.left || 0;
		const top = rect.top || 0;
		const width = rect.width || 0;
		const height = rect.height || 0;

		// Get transformation matrix
		const matrix = rect.calcTransformMatrix();

		// Calculate current corners
		const corners: fabric.Point[] = [
			new fabric.Point(-width / 2, -height / 2), // Top-left (0)
			new fabric.Point(width / 2, -height / 2), // Top-right (1)
			new fabric.Point(width / 2, height / 2), // Bottom-right (2)
			new fabric.Point(-width / 2, height / 2) // Bottom-left (3)
		].map((corner) => fabric.util.transformPoint(corner, matrix));

		// Edge indices: 4=top, 5=right, 6=bottom, 7=left
		// Move the two corners that define the edge
		switch (edgeIndex) {
			case 4: // Top edge - move top-left and top-right
				corners[0] = new fabric.Point(corners[0].x, newY);
				corners[1] = new fabric.Point(corners[1].x, newY);
				break;
			case 5: // Right edge - move top-right and bottom-right
				corners[1] = new fabric.Point(newX, corners[1].y);
				corners[2] = new fabric.Point(newX, corners[2].y);
				break;
			case 6: // Bottom edge - move bottom-right and bottom-left
				corners[2] = new fabric.Point(corners[2].x, newY);
				corners[3] = new fabric.Point(corners[3].x, newY);
				break;
			case 7: // Left edge - move bottom-left and top-left
				corners[3] = new fabric.Point(newX, corners[3].y);
				corners[0] = new fabric.Point(newX, corners[0].y);
				break;
		}

		// Calculate new rectangle bounds
		const minX = Math.min(corners[0].x, corners[1].x, corners[2].x, corners[3].x);
		const maxX = Math.max(corners[0].x, corners[1].x, corners[2].x, corners[3].x);
		const minY = Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y);
		const maxY = Math.max(corners[0].y, corners[1].y, corners[2].y, corners[3].y);

		let newWidth = maxX - minX;
		let newHeight = maxY - minY;

		// Ensure minimum size
		if (newWidth < 10) newWidth = 10;
		if (newHeight < 10) newHeight = 10;

		const newLeft = minX + newWidth / 2;
		const newTop = minY + newHeight / 2;

		// Store rectangle properties
		const rectId = (rect as any).id;
		const rectProps = {
			fill: rect.fill,
			stroke: rect.stroke,
			strokeWidth: rect.strokeWidth,
			strokeDashArray: rect.strokeDashArray,
			opacity: rect.opacity
		};

		// Remove old rectangle
		this.canvas.remove(rect);

		// Create new rectangle
		const newRect = new fabric.Rect({
			id: rectId,
			left: newLeft,
			top: newTop,
			width: newWidth,
			height: newHeight,
			fill: rectProps.fill,
			stroke: rectProps.stroke,
			strokeWidth: rectProps.strokeWidth,
			strokeDashArray: rectProps.strokeDashArray,
			opacity: rectProps.opacity,
			selectable: true,
			hasControls: false,
			hasBorders: false,
			strokeUniform: true,
			originX: 'center',
			originY: 'center'
		});

		this.canvas.add(newRect);
		this.bringControlPointsToFront();

		// Update all control points
		this.updateControlPoints(objectId, newRect);
		this.canvas.renderAll();
	}
}

/**
 * Control point handler for ellipses
 */
export class EllipseControlPoints extends ControlPointHandler {
	protected edgeLines: Map<string, fabric.Line> = new Map();
	private rotationHandle?: ControlPoint;
	private rotationConnector?: fabric.Line;

	addControlPoints(objectId: string, obj: fabric.Object, visible: boolean = true): void {
		const ellipse = obj as fabric.Ellipse;
		const rx = ellipse.rx || 0;
		const ry = ellipse.ry || 0;

		// Get transformation matrix for handling rotations/scaling
		const matrix = ellipse.calcTransformMatrix();

		// Define the 4 corners of the bounding rectangle in local coordinates
		const corners = [
			{ x: -rx, y: -ry }, // Top-left
			{ x: rx, y: -ry }, // Top-right
			{ x: rx, y: ry }, // Bottom-right
			{ x: -rx, y: ry } // Bottom-left
		];

		// Transform corners to absolute coordinates
		const absoluteCorners = corners.map((corner) =>
			fabric.util.transformPoint(new fabric.Point(corner.x, corner.y), matrix)
		);

		// Create control points at corners (indices 0-3)
		absoluteCorners.forEach((corner, index) => {
			const controlPointId = `${objectId}-cp-${index}`;
			const circle = this.createControlPointCircle(
				corner.x,
				corner.y,
				controlPointId,
				objectId,
				index,
				true
			);
			circle.set({ visible });
			this.canvas.add(circle);
			this.controlPoints.push({
				id: controlPointId,
				circle,
				objectId,
				pointIndex: index
			});
		});

		// Create edge midpoint control points (indices 8-11)
		const edgeMidpoints = [
			{
				x: (absoluteCorners[0].x + absoluteCorners[1].x) / 2,
				y: (absoluteCorners[0].y + absoluteCorners[1].y) / 2,
				pointIndex: 8 // Top edge
			},
			{
				x: (absoluteCorners[1].x + absoluteCorners[2].x) / 2,
				y: (absoluteCorners[1].y + absoluteCorners[2].y) / 2,
				pointIndex: 9 // Right edge
			},
			{
				x: (absoluteCorners[2].x + absoluteCorners[3].x) / 2,
				y: (absoluteCorners[2].y + absoluteCorners[3].y) / 2,
				pointIndex: 10 // Bottom edge
			},
			{
				x: (absoluteCorners[3].x + absoluteCorners[0].x) / 2,
				y: (absoluteCorners[3].y + absoluteCorners[0].y) / 2,
				pointIndex: 11 // Left edge
			}
		];

		edgeMidpoints.forEach((midpoint) => {
			const controlPointId = `${objectId}-cp-${midpoint.pointIndex}`;
			const circle = this.createControlPointCircle(
				midpoint.x,
				midpoint.y,
				controlPointId,
				objectId,
				midpoint.pointIndex,
				true
			);
			circle.set({ visible });
			this.canvas.add(circle);
			this.controlPoints.push({
				id: controlPointId,
				circle,
				objectId,
				pointIndex: midpoint.pointIndex
			});
		});

		// Create rotation handle (index 12) - floating, 30px above the top edge
		const topMidpoint = edgeMidpoints[0]; // Top edge midpoint
		const rotationY = topMidpoint.y - 30;
		const rotationControlPointId = `${objectId}-cp-12`;
		const rotationCircle = this.createControlPointCircle(
			topMidpoint.x,
			rotationY,
			rotationControlPointId,
			objectId,
			12,
			true
		);
		rotationCircle.set({ visible, hoverCursor: 'crosshair' });
		this.canvas.add(rotationCircle);
		this.controlPoints.push({
			id: rotationControlPointId,
			circle: rotationCircle,
			objectId,
			pointIndex: 12
		});
		// No connector line - rotation handle is floating

		// Create light solid border lines (4 edges)
		const edges = [
			{ start: 0, end: 1 }, // Top
			{ start: 1, end: 2 }, // Right
			{ start: 2, end: 3 }, // Bottom
			{ start: 3, end: 0 } // Left
		];

		edges.forEach(({ start, end }, index) => {
			const edgeId = `${objectId}-edge-${index}`;
			const startCorner = absoluteCorners[start];
			const endCorner = absoluteCorners[end];
			const edgeLine = new fabric.Line([startCorner.x, startCorner.y, endCorner.x, endCorner.y], {
				stroke: 'oklch(0.8 0.05 39.0427)', // Light orange, reduced saturation
				strokeWidth: 1.5,
				selectable: false,
				evented: false,
				excludeFromExport: true,
				visible
			});
			(edgeLine as any).id = edgeId;
			(edgeLine as any).linkedObjectId = objectId;
			this.canvas.add(edgeLine);
			this.edgeLines.set(edgeId, edgeLine);
		});

		this.bringControlPointsToFront();
		this.canvas.renderAll();
	}

	removeControlPoints(objectId: string): void {
		// Remove control points
		const pointsToRemove = this.controlPoints.filter((cp) => cp.objectId === objectId);
		pointsToRemove.forEach((cp) => {
			this.canvas.remove(cp.circle);
		});
		this.controlPoints = this.controlPoints.filter((cp) => cp.objectId !== objectId);

		// Remove edge lines
		const edgeLinesToRemove: string[] = [];
		this.edgeLines.forEach((line, id) => {
			if ((line as any).linkedObjectId === objectId) {
				this.canvas.remove(line);
				edgeLinesToRemove.push(id);
			}
		});
		edgeLinesToRemove.forEach((id) => this.edgeLines.delete(id));

		// Remove rotation connector
		if (this.rotationConnector && (this.rotationConnector as any).linkedObjectId === objectId) {
			this.canvas.remove(this.rotationConnector);
			this.rotationConnector = undefined;
		}

		this.canvas.renderAll();
	}

	hideControlPoints(objectId: string): void {
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId);
		points.forEach((cp) => {
			cp.circle.set({ visible: false });
		});

		this.edgeLines.forEach((line) => {
			if ((line as any).linkedObjectId === objectId) {
				line.set({ visible: false });
			}
		});

		if (this.rotationConnector && (this.rotationConnector as any).linkedObjectId === objectId) {
			this.rotationConnector.set({ visible: false });
		}

		this.canvas.renderAll();
	}

	hideAllControlPoints(): void {
		// Hide all control point circles
		this.controlPoints.forEach((cp) => {
			cp.circle.set({ visible: false });
		});

		// Hide all edge lines
		this.edgeLines.forEach((line) => {
			line.set({ visible: false });
		});

		// Hide rotation connector if it exists
		if (this.rotationConnector) {
			this.rotationConnector.set({ visible: false });
		}

		this.canvas.renderAll();
	}

	showControlPoints(objectId: string): void {
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId);
		points.forEach((cp) => {
			cp.circle.set({ visible: true });
		});

		this.edgeLines.forEach((line) => {
			if ((line as any).linkedObjectId === objectId) {
				line.set({ visible: true });
			}
		});

		if (this.rotationConnector && (this.rotationConnector as any).linkedObjectId === objectId) {
			this.rotationConnector.set({ visible: true });
		}

		this.canvas.renderAll();
	}

	updateControlPoints(objectId: string, obj: fabric.Object): void {
		const ellipse = obj as fabric.Ellipse;
		const controlPoints = this.getControlPointsForObject(objectId);
		if (controlPoints.length === 0) return;

		const rx = ellipse.rx || 0;
		const ry = ellipse.ry || 0;

		// Get transformation matrix
		const matrix = ellipse.calcTransformMatrix();

		// Define corners in local coordinates
		const corners = [
			{ x: -rx, y: -ry }, // Top-left
			{ x: rx, y: -ry }, // Top-right
			{ x: rx, y: ry }, // Bottom-right
			{ x: -rx, y: ry } // Bottom-left
		];

		// Transform to absolute coordinates
		const absoluteCorners = corners.map((corner) =>
			fabric.util.transformPoint(new fabric.Point(corner.x, corner.y), matrix)
		);

		// Update corner control points (indices 0-3)
		controlPoints.forEach((cp) => {
			if (cp.pointIndex >= 0 && cp.pointIndex <= 3) {
				const corner = absoluteCorners[cp.pointIndex];
				cp.circle.set({
					left: corner.x,
					top: corner.y
				});
				cp.circle.setCoords();
			}
		});

		// Update edge midpoint control points (indices 8-11)
		const edgeMidpoints = [
			{
				x: (absoluteCorners[0].x + absoluteCorners[1].x) / 2,
				y: (absoluteCorners[0].y + absoluteCorners[1].y) / 2,
				pointIndex: 8 // Top edge
			},
			{
				x: (absoluteCorners[1].x + absoluteCorners[2].x) / 2,
				y: (absoluteCorners[1].y + absoluteCorners[2].y) / 2,
				pointIndex: 9 // Right edge
			},
			{
				x: (absoluteCorners[2].x + absoluteCorners[3].x) / 2,
				y: (absoluteCorners[2].y + absoluteCorners[3].y) / 2,
				pointIndex: 10 // Bottom edge
			},
			{
				x: (absoluteCorners[3].x + absoluteCorners[0].x) / 2,
				y: (absoluteCorners[3].y + absoluteCorners[0].y) / 2,
				pointIndex: 11 // Left edge
			}
		];

		edgeMidpoints.forEach((midpoint) => {
			const cp = controlPoints.find((cp) => cp.pointIndex === midpoint.pointIndex);
			if (cp) {
				cp.circle.set({
					left: midpoint.x,
					top: midpoint.y
				});
				cp.circle.setCoords();
			}
		});

		// Update rotation handle (index 12) - maintain 30px distance from top edge
		const topMidpoint = edgeMidpoints[0];
		const rotationCp = controlPoints.find((cp) => cp.pointIndex === 12);
		if (rotationCp) {
			// Calculate the vector from center to top midpoint
			const center = ellipse.getCenterPoint();
			const vectorX = topMidpoint.x - center.x;
			const vectorY = topMidpoint.y - center.y;
			const vectorLength = Math.sqrt(vectorX * vectorX + vectorY * vectorY);

			// Normalize and extend by 30px
			const normalizedX = vectorX / vectorLength;
			const normalizedY = vectorY / vectorLength;
			const rotationX = center.x + normalizedX * (vectorLength + 30);
			const rotationY = center.y + normalizedY * (vectorLength + 30);

			rotationCp.circle.set({
				left: rotationX,
				top: rotationY
			});
			rotationCp.circle.setCoords();
		}

		// Update edge lines
		const edges = [
			{ start: 0, end: 1 }, // Top
			{ start: 1, end: 2 }, // Right
			{ start: 2, end: 3 }, // Bottom
			{ start: 3, end: 0 } // Left
		];

		edges.forEach(({ start, end }, index) => {
			const edgeId = `${objectId}-edge-${index}`;
			const edgeLine = this.edgeLines.get(edgeId);
			if (edgeLine) {
				const startCorner = absoluteCorners[start];
				const endCorner = absoluteCorners[end];
				edgeLine.set({
					x1: startCorner.x,
					y1: startCorner.y,
					x2: endCorner.x,
					y2: endCorner.y
				});
				edgeLine.setCoords();
			}
		});

		this.canvas.renderAll();
	}

	updateObjectFromControlPoint(controlPointId: string, newX: number, newY: number): void {
		const controlPoint = this.controlPoints.find((cp) => cp.id === controlPointId);
		if (!controlPoint) return;

		// Update the control point position immediately
		controlPoint.circle.set({
			left: newX,
			top: newY
		});
		controlPoint.circle.setCoords();

		// Handle different control point types
		if (controlPoint.pointIndex >= 0 && controlPoint.pointIndex <= 3) {
			// Corner control point - diagonal scaling
			this.updateFromCorner(controlPoint, newX, newY);
		} else if (controlPoint.pointIndex >= 8 && controlPoint.pointIndex <= 11) {
			// Edge midpoint - stretch
			this.updateFromEdge(controlPoint, newX, newY);
		} else if (controlPoint.pointIndex === 12) {
			// Rotation handle
			this.updateFromRotation(controlPoint, newX, newY);
		}
	}

	private updateFromCorner(controlPoint: ControlPoint, newX: number, newY: number): void {
		// Works exactly like rectangle - move center, keep opposite corner fixed
		const ellipse = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'ellipse') as
			| fabric.Ellipse
			| undefined;
		if (!ellipse) return;

		const rx = ellipse.rx || 0;
		const ry = ellipse.ry || 0;
		const currentAngle = ellipse.angle || 0;

		// Calculate the four corners in absolute coordinates
		const matrix = ellipse.calcTransformMatrix();
		const corners: fabric.Point[] = [
			new fabric.Point(-rx, -ry), // Top-left (0)
			new fabric.Point(rx, -ry), // Top-right (1)
			new fabric.Point(rx, ry), // Bottom-right (2)
			new fabric.Point(-rx, ry) // Bottom-left (3)
		].map((corner) => fabric.util.transformPoint(corner, matrix));

		// Determine which corner is the opposite/anchor corner
		const oppositeCornerIndex = (controlPoint.pointIndex + 2) % 4;
		const anchorCorner = corners[oppositeCornerIndex];

		// Get the anchor corner control point's actual position
		const anchorCornerCP = this.getControlPointsForObject(controlPoint.objectId).find(
			(cp) => cp.pointIndex === oppositeCornerIndex
		);
		const anchorPosition = anchorCornerCP ? anchorCornerCP.circle.getCenterPoint() : anchorCorner;

		// The new dragged position
		const draggedCorner = new fabric.Point(newX, newY);

		// Calculate new bounding box
		const minX = Math.min(draggedCorner.x, anchorPosition.x);
		const maxX = Math.max(draggedCorner.x, anchorPosition.x);
		const minY = Math.min(draggedCorner.y, anchorPosition.y);
		const maxY = Math.max(draggedCorner.y, anchorPosition.y);

		// New center and radii (without rotation)
		const newCenterX = (minX + maxX) / 2;
		const newCenterY = (minY + maxY) / 2;
		const newRx = Math.max((maxX - minX) / 2, 10);
		const newRy = Math.max((maxY - minY) / 2, 10);

		// Store ellipse properties
		const ellipseId = (ellipse as any).id;
		const ellipseProps = {
			fill: ellipse.fill,
			stroke: ellipse.stroke,
			strokeWidth: ellipse.strokeWidth,
			strokeDashArray: ellipse.strokeDashArray,
			opacity: ellipse.opacity
		};

		// Remove old ellipse
		this.canvas.remove(ellipse);

		// Create new ellipse (unrotated for now)
		const newEllipse = new fabric.Ellipse({
			id: ellipseId,
			left: newCenterX,
			top: newCenterY,
			rx: newRx,
			ry: newRy,
			fill: ellipseProps.fill,
			stroke: ellipseProps.stroke,
			strokeWidth: ellipseProps.strokeWidth,
			strokeDashArray: ellipseProps.strokeDashArray,
			opacity: ellipseProps.opacity,
			angle: currentAngle, // Maintain rotation
			selectable: true,
			hasControls: false,
			hasBorders: false,
			strokeUniform: true,
			originX: 'center',
			originY: 'center'
		});

		this.canvas.add(newEllipse);
		this.bringControlPointsToFront();
		this.updateControlPoints(controlPoint.objectId, newEllipse);

		// Restore positions
		controlPoint.circle.set({ left: newX, top: newY });
		controlPoint.circle.setCoords();
		if (anchorCornerCP) {
			anchorCornerCP.circle.set({ left: anchorPosition.x, top: anchorPosition.y });
			anchorCornerCP.circle.setCoords();
		}

		this.canvas.renderAll();
	}

	private updateFromEdge(controlPoint: ControlPoint, newX: number, newY: number): void {
		// Works exactly like rectangle - drag edge to resize
		const ellipse = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'ellipse') as
			| fabric.Ellipse
			| undefined;
		if (!ellipse) return;

		const rx = ellipse.rx || 0;
		const ry = ellipse.ry || 0;
		const currentAngle = ellipse.angle || 0;

		// Get transformation matrix
		const matrix = ellipse.calcTransformMatrix();

		// Calculate current corners
		const corners: fabric.Point[] = [
			new fabric.Point(-rx, -ry), // Top-left (0)
			new fabric.Point(rx, -ry), // Top-right (1)
			new fabric.Point(rx, ry), // Bottom-right (2)
			new fabric.Point(-rx, ry) // Bottom-left (3)
		].map((corner) => fabric.util.transformPoint(corner, matrix));

		// Edge indices: 8=top, 9=right, 10=bottom, 11=left
		// Move the two corners that define the edge
		switch (controlPoint.pointIndex) {
			case 8: // Top edge - move top-left and top-right
				corners[0] = new fabric.Point(corners[0].x, newY);
				corners[1] = new fabric.Point(corners[1].x, newY);
				break;
			case 9: // Right edge - move top-right and bottom-right
				corners[1] = new fabric.Point(newX, corners[1].y);
				corners[2] = new fabric.Point(newX, corners[2].y);
				break;
			case 10: // Bottom edge - move bottom-right and bottom-left
				corners[2] = new fabric.Point(corners[2].x, newY);
				corners[3] = new fabric.Point(corners[3].x, newY);
				break;
			case 11: // Left edge - move bottom-left and top-left
				corners[3] = new fabric.Point(newX, corners[3].y);
				corners[0] = new fabric.Point(newX, corners[0].y);
				break;
		}

		// Calculate new bounding box
		const minX = Math.min(corners[0].x, corners[1].x, corners[2].x, corners[3].x);
		const maxX = Math.max(corners[0].x, corners[1].x, corners[2].x, corners[3].x);
		const minY = Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y);
		const maxY = Math.max(corners[0].y, corners[1].y, corners[2].y, corners[3].y);

		const newCenterX = (minX + maxX) / 2;
		const newCenterY = (minY + maxY) / 2;
		const newRx = Math.max((maxX - minX) / 2, 10);
		const newRy = Math.max((maxY - minY) / 2, 10);

		// Store ellipse properties
		const ellipseId = (ellipse as any).id;
		const ellipseProps = {
			fill: ellipse.fill,
			stroke: ellipse.stroke,
			strokeWidth: ellipse.strokeWidth,
			strokeDashArray: ellipse.strokeDashArray,
			opacity: ellipse.opacity
		};

		// Remove old ellipse
		this.canvas.remove(ellipse);

		// Create new ellipse
		const newEllipse = new fabric.Ellipse({
			id: ellipseId,
			left: newCenterX,
			top: newCenterY,
			rx: newRx,
			ry: newRy,
			fill: ellipseProps.fill,
			stroke: ellipseProps.stroke,
			strokeWidth: ellipseProps.strokeWidth,
			strokeDashArray: ellipseProps.strokeDashArray,
			opacity: ellipseProps.opacity,
			angle: currentAngle, // Maintain rotation
			selectable: true,
			hasControls: false,
			hasBorders: false,
			strokeUniform: true,
			originX: 'center',
			originY: 'center'
		});

		this.canvas.add(newEllipse);
		this.bringControlPointsToFront();
		this.updateControlPoints(controlPoint.objectId, newEllipse);
		this.canvas.renderAll();
	}

	private updateFromRotation(controlPoint: ControlPoint, newX: number, newY: number): void {
		const ellipse = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'ellipse') as
			| fabric.Ellipse
			| undefined;
		if (!ellipse) return;

		const center = ellipse.getCenterPoint();

		// Calculate angle from center to rotation handle
		const dx = newX - center.x;
		const dy = newY - center.y;
		const angleRad = Math.atan2(dy, dx);
		const angleDeg = (angleRad * 180) / Math.PI + 90; // Add 90 to align with top

		// Update ellipse rotation
		ellipse.set({ angle: angleDeg });
		ellipse.setCoords();

		// Update control points
		this.updateControlPoints(controlPoint.objectId, ellipse);
		this.canvas.renderAll();
	}
}

/**
 * Central manager for all control points on the canvas
 */
export class ControlPointManager {
	private canvas: fabric.Canvas;
	private handlers: Map<string, ControlPointHandler> = new Map();
	private lineHandler: LineControlPoints;
	private rectangleHandler: RectangleControlPoints;
	private ellipseHandler: EllipseControlPoints;
	private sendCanvasUpdate?: (data: Record<string, unknown>) => void;

	constructor(canvas: fabric.Canvas, sendCanvasUpdate?: (data: Record<string, unknown>) => void) {
		this.canvas = canvas;
		this.sendCanvasUpdate = sendCanvasUpdate;

		// Initialize handlers for different object types
		this.lineHandler = new LineControlPoints(canvas);
		this.handlers.set('polyline', this.lineHandler);

		this.rectangleHandler = new RectangleControlPoints(canvas);
		this.handlers.set('rect', this.rectangleHandler);

		this.ellipseHandler = new EllipseControlPoints(canvas);
		this.handlers.set('ellipse', this.ellipseHandler);
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
							.find((obj: any) => obj.id === controlPoint.objectId);
						if (modifiedObj && modifiedObj.type === 'polyline') {
							// Create a clean serialization with just the essential data
							// This avoids transformation issues when reconstructing on remote clients
							const objData = {
								id: (modifiedObj as any).id,
								type: 'polyline',
								points: (modifiedObj as fabric.Polyline).points,
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
						} else if (modifiedObj && modifiedObj.type === 'rect') {
							// Send rectangle updates
							const rect = modifiedObj as fabric.Rect;
							const objData = {
								id: (rect as any).id,
								type: 'rect',
								left: rect.left,
								top: rect.top,
								width: rect.width,
								height: rect.height,
								fill: rect.fill,
								stroke: rect.stroke,
								strokeWidth: rect.strokeWidth,
								strokeDashArray: rect.strokeDashArray,
								opacity: rect.opacity,
								originX: 'center',
								originY: 'center',
								selectable: true,
								hasControls: false,
								hasBorders: false
							};
							this.sendCanvasUpdate({
								type: 'modify',
								object: objData
							});
						} else if (modifiedObj && modifiedObj.type === 'ellipse') {
							// Send ellipse updates
							const ellipse = modifiedObj as fabric.Ellipse;
							const objData = {
								id: (ellipse as any).id,
								type: 'ellipse',
								left: ellipse.left,
								top: ellipse.top,
								rx: ellipse.rx,
								ry: ellipse.ry,
								fill: ellipse.fill,
								stroke: ellipse.stroke,
								strokeWidth: ellipse.strokeWidth,
								strokeDashArray: ellipse.strokeDashArray,
								opacity: ellipse.opacity,
								angle: ellipse.angle,
								originX: 'center',
								originY: 'center',
								selectable: true,
								hasControls: false,
								hasBorders: false
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
