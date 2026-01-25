import * as fabric from 'fabric'

/**
 * Interface for a control point visual element
 */
export interface ControlPoint {
	id: string
	circle: fabric.Circle
	objectId: string
	pointIndex: number
}

/**
 * Abstract base class for control point handlers
 * Each object type (line, rectangle, etc.) will extend this
 */
export abstract class ControlPointHandler {
	protected canvas: fabric.Canvas
	protected controlPoints: ControlPoint[] = []

	constructor(canvas: fabric.Canvas) {
		this.canvas = canvas
	}

	/**
	 * Update the visual size of control points based on zoom level
	 */
	updateControlPointSizes(): void {
		const zoom = this.canvas.getZoom()
		const scale = 1 / zoom // Inverse scale to maintain constant visual size

		this.controlPoints.forEach((cp) => {
			cp.circle.set({
				radius: 6 * scale,
				strokeWidth: 2 * scale
			})
			cp.circle.setCoords()
		})
	}

	/**
	 * Add control points for an object
	 */
	abstract addControlPoints(objectId: string, obj: fabric.Object, visible?: boolean): void

	/**
	 * Remove control points for an object
	 */
	removeControlPoints(objectId: string): void {
		const pointsToRemove = this.controlPoints.filter((cp) => cp.objectId === objectId)
		pointsToRemove.forEach((cp) => {
			this.canvas.remove(cp.circle)
		})
		this.controlPoints = this.controlPoints.filter((cp) => cp.objectId !== objectId)
		this.canvas.renderAll()
	}

	/**
	 * Hide control points for an object
	 */
	hideControlPoints(objectId: string): void {
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId)
		points.forEach((cp) => {
			cp.circle.set({ visible: false })
		})
		this.canvas.renderAll()
	}

	/**
	 * Show control points for an object
	 */
	showControlPoints(objectId: string): void {
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId)
		points.forEach((cp) => {
			cp.circle.set({ visible: true })
		})
		this.canvas.renderAll()
	}

	/**
	 * Hide all control points
	 */
	hideAllControlPoints(): void {
		this.controlPoints.forEach((cp) => {
			cp.circle.set({ visible: false })
		})
		this.canvas.renderAll()
	}

	/**
	 * Update control point positions when object is moved/transformed
	 */
	abstract updateControlPoints(objectId: string, obj: fabric.Object): void

	/**
	 * Update the object when a control point is dragged
	 */
	abstract updateObjectFromControlPoint(controlPointId: string, newX: number, newY: number): void

	/**
	 * Get all control points for a specific object
	 */
	getControlPointsForObject(objectId: string): ControlPoint[] {
		return this.controlPoints.filter((cp) => cp.objectId === objectId)
	}

	/**
	 * Get all control points
	 */
	getAllControlPoints(): ControlPoint[] {
		return this.controlPoints
	}

	/**
	 * Check if a circle is a control point
	 */
	isControlPoint(obj: fabric.Object): boolean {
		return (obj as any).isControlPoint === true
	}

	/**
	 * Bring all control points to the front of the canvas
	 */
	bringControlPointsToFront(): void {
		this.controlPoints.forEach((cp) => {
			this.canvas.bringObjectToFront(cp.circle)
		})
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
		// Get current zoom to size control points correctly from the start
		const zoom = this.canvas.getZoom()
		const scale = 1 / zoom

		const circle = new fabric.Circle({
			radius: 6 * scale,
			fill: 'oklch(0.6171 0.1375 39.0427)',
			stroke: 'oklch(0.5171 0.1375 39.0427)',
			strokeWidth: 2 * scale,
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
		})

		// Add custom properties to identify this as a control point
		;(circle as any).id = controlPointId
		;(circle as any).isControlPoint = true
		;(circle as any).linkedObjectId = objectId
		;(circle as any).pointIndex = pointIndex

		return circle
	}
}

/**
 * Control point handler for polylines (lines and arrows)
 */
export class LineControlPoints extends ControlPointHandler {
	addControlPoints(objectId: string, obj: fabric.Object, visible: boolean = true): void {
		const line = obj as fabric.Polyline
		const points = line.points
		if (!points || points.length < 2) return

		// Get the line's transformation matrix to calculate absolute positions
		const matrix = line.calcTransformMatrix()

		// Create control points at start and end of line
		;[0, points.length - 1].forEach((pointIndex) => {
			const point = points[pointIndex]
			// Transform the point to absolute coordinates
			const absolutePoint = fabric.util.transformPoint(
				new fabric.Point(point.x - line.pathOffset.x, point.y - line.pathOffset.y),
				matrix
			)

			const controlPointId = `${objectId}-cp-${pointIndex}`
			const circle = this.createControlPointCircle(
				absolutePoint.x,
				absolutePoint.y,
				controlPointId,
				objectId,
				pointIndex
			)

			// Set initial visibility
			circle.set({ visible })

			this.canvas.add(circle)

			// Store the control point reference
			this.controlPoints.push({
				id: controlPointId,
				circle,
				objectId,
				pointIndex
			})
		})

		// Ensure all control points are on top
		this.bringControlPointsToFront()
		this.canvas.renderAll()
	}

	updateControlPoints(objectId: string, obj: fabric.Object): void {
		const line = obj as fabric.Polyline
		const controlPoints = this.getControlPointsForObject(objectId)
		if (controlPoints.length === 0) return

		const points = line.points
		if (!points || points.length < 2) return

		// Get the line's transformation matrix to calculate absolute positions
		const matrix = line.calcTransformMatrix()

		// Update each control point position
		controlPoints.forEach((cp) => {
			const point = points[cp.pointIndex]
			const absolutePoint = fabric.util.transformPoint(
				new fabric.Point(point.x - line.pathOffset.x, point.y - line.pathOffset.y),
				matrix
			)
			cp.circle.set({
				left: absolutePoint.x,
				top: absolutePoint.y
			})
			cp.circle.setCoords()
		})

		this.canvas.renderAll()
	}

	updateObjectFromControlPoint(controlPointId: string, newX: number, newY: number): void {
		// Find the control point
		const controlPoint = this.controlPoints.find((cp) => cp.id === controlPointId)
		if (!controlPoint) return

		// Update the control point circle position immediately
		controlPoint.circle.set({
			left: newX,
			top: newY
		})
		controlPoint.circle.setCoords()

		// Find the line on the canvas
		const line = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'polyline') as
			| fabric.Polyline
			| undefined
		if (!line || !line.points) return

		// Get the line's current transformation matrix
		const matrix = line.calcTransformMatrix()

		// Convert all current points to absolute coordinates
		const absolutePoints = line.points.map((point) => {
			return fabric.util.transformPoint(
				new fabric.Point(point.x - line.pathOffset.x, point.y - line.pathOffset.y),
				matrix
			)
		})

		// Update the dragged point to the new position
		absolutePoints[controlPoint.pointIndex] = new fabric.Point(newX, newY)

		// Store line properties before removal
		const lineId = (line as any).id
		const lineProps = {
			stroke: line.stroke,
			strokeWidth: line.strokeWidth,
			strokeDashArray: line.strokeDashArray,
			opacity: line.opacity
		}

		// Remove old line
		this.canvas.remove(line)

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
		})

		this.canvas.add(newLine)

		// Bring control points to front
		this.bringControlPointsToFront()

		// Update other control point positions
		const otherControlPoints = this.controlPoints.filter(
			(cp) => cp.objectId === controlPoint.objectId && cp.id !== controlPointId
		)

		const newMatrix = newLine.calcTransformMatrix()
		otherControlPoints.forEach((cp) => {
			const point = absolutePoints[cp.pointIndex]
			cp.circle.set({
				left: point.x,
				top: point.y
			})
			cp.circle.setCoords()
		})

		this.canvas.renderAll()
	}

	/**
	 * Get the updated line object after a control point was moved
	 * Returns the new line object so it can be sent to other users
	 */
	getUpdatedLine(controlPointId: string): fabric.Polyline | null {
		const controlPoint = this.controlPoints.find((cp) => cp.id === controlPointId)
		if (!controlPoint) return null

		const line = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'polyline') as
			| fabric.Polyline
			| undefined

		return line || null
	}
}

/**
 * Abstract base class for bounding box control points
 * Provides standard 4 corners + 4 edges + 1 rotation + border lines
 */
export abstract class BoundingBoxControlPoints extends ControlPointHandler {
	protected edgeLines: Map<string, fabric.Line> = new Map()

	/**
	 * Get the zoom-adjusted distance for the rotation handle
	 */
	protected getRotationHandleDistance(): number {
		const zoom = this.canvas.getZoom()
		return 20 / zoom // Scale inversely with zoom to maintain constant visual distance
	}

	/**
	 * Override to also bring edge lines to front
	 */
	bringControlPointsToFront(): void {
		// First bring edge lines to front
		this.edgeLines.forEach((line) => {
			this.canvas.bringObjectToFront(line)
		})
		// Then bring control point circles to front (so they're on top of the lines)
		this.controlPoints.forEach((cp) => {
			this.canvas.bringObjectToFront(cp.circle)
		})
	}

	/**
	 * Override to also update edge line sizes and rotation handle position
	 */
	updateControlPointSizes(): void {
		const zoom = this.canvas.getZoom()
		const scale = 1 / zoom

		// Update control point circles
		this.controlPoints.forEach((cp) => {
			cp.circle.set({
				radius: 6 * scale,
				strokeWidth: 2 * scale
			})
			cp.circle.setCoords()
		})

		// Update edge lines
		this.edgeLines.forEach((line) => {
			line.set({
				strokeWidth: 1.5 * scale
			})
			line.setCoords()
		})

		// Update rotation handle positions (index 12) for all objects with rotation handles
		const objectsWithRotation = new Set<string>()
		this.controlPoints.forEach((cp) => {
			if (cp.pointIndex === 12) {
				objectsWithRotation.add(cp.objectId)
			}
		})

		objectsWithRotation.forEach((objectId) => {
			// Find the object
			const obj = this.canvas.getObjects().find((o: any) => o.id === objectId)
			if (obj) {
				// Update just the rotation handle position
				const rotationCp = this.controlPoints.find(
					(cp) => cp.objectId === objectId && cp.pointIndex === 12
				)
				const topMidpointCp = this.controlPoints.find(
					(cp) => cp.objectId === objectId && cp.pointIndex === 8
				)

				if (rotationCp && topMidpointCp) {
					const center = obj.getCenterPoint()
					const topMidpoint = topMidpointCp.circle.getCenterPoint()
					const vectorX = topMidpoint.x - center.x
					const vectorY = topMidpoint.y - center.y
					const vectorLength = Math.sqrt(vectorX * vectorX + vectorY * vectorY)
					const normalizedX = vectorX / vectorLength
					const normalizedY = vectorY / vectorLength
					const rotationDistance = this.getRotationHandleDistance()

					rotationCp.circle.set({
						left: center.x + normalizedX * (vectorLength + rotationDistance),
						top: center.y + normalizedY * (vectorLength + rotationDistance)
					})
					rotationCp.circle.setCoords()
				}
			}
		})
	}
}

/**
 * Control point handler for rectangles
 */
export class RectangleControlPoints extends BoundingBoxControlPoints {
	addControlPoints(objectId: string, obj: fabric.Object, visible: boolean = true): void {
		const rect = obj as fabric.Rect
		const left = rect.left || 0
		const top = rect.top || 0
		const width = rect.width || 0
		const height = rect.height || 0

		// Get transformation matrix for handling rotations/scaling
		const matrix = rect.calcTransformMatrix()

		// Define the 4 corners in local coordinates
		// Rectangles use different origins - check originX/originY
		const originX = rect.originX || 'left'
		const originY = rect.originY || 'top'

		let corners
		if (originX === 'center' && originY === 'center') {
			// Center origin
			corners = [
				{ x: -width / 2, y: -height / 2 }, // Top-left
				{ x: width / 2, y: -height / 2 }, // Top-right
				{ x: width / 2, y: height / 2 }, // Bottom-right
				{ x: -width / 2, y: height / 2 } // Bottom-left
			]
		} else {
			// Top-left origin (default)
			corners = [
				{ x: 0, y: 0 }, // Top-left
				{ x: width, y: 0 }, // Top-right
				{ x: width, y: height }, // Bottom-right
				{ x: 0, y: height } // Bottom-left
			]
		}

		// Transform corners to absolute coordinates
		const absoluteCorners = corners.map((corner) =>
			fabric.util.transformPoint(new fabric.Point(corner.x, corner.y), matrix)
		)

		// Create control points at corners (selectable to allow dragging)
		absoluteCorners.forEach((corner, index) => {
			const controlPointId = `${objectId}-cp-${index}`
			const circle = this.createControlPointCircle(
				corner.x,
				corner.y,
				controlPointId,
				objectId,
				index,
				true // Must be selectable for dragging
			)
			circle.set({ visible })
			this.canvas.add(circle)
			this.controlPoints.push({
				id: controlPointId,
				circle,
				objectId,
				pointIndex: index
			})
		})

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
		]

		// Add edge midpoint control points (indices 8-11, selectable for dragging)
		edgeMidpoints.forEach((midpoint, index) => {
			const pointIndex = 8 + index // 8, 9, 10, 11 for top, right, bottom, left
			const controlPointId = `${objectId}-cp-${pointIndex}`
			const circle = this.createControlPointCircle(
				midpoint.x,
				midpoint.y,
				controlPointId,
				objectId,
				pointIndex,
				true // Must be selectable for dragging
			)
			circle.set({
				visible,
				hoverCursor: midpoint.cursor
			})
			// Mark this as an edge midpoint
			;(circle as any).isEdgeMidpoint = true
			;(circle as any).edgeIndex = midpoint.edgeIndex

			this.canvas.add(circle)
			this.controlPoints.push({
				id: controlPointId,
				circle,
				objectId,
				pointIndex
			})
		})

		// Create rotation handle (index 12) - floating, 30px above the top edge in rotated space
		const topMidpoint = edgeMidpoints[0] // Top edge midpoint
		const center = rect.getCenterPoint()
		const vectorX = topMidpoint.x - center.x
		const vectorY = topMidpoint.y - center.y
		const vectorLength = Math.sqrt(vectorX * vectorX + vectorY * vectorY)
		const normalizedX = vectorX / vectorLength
		const normalizedY = vectorY / vectorLength
		const rotationDistance = this.getRotationHandleDistance()
		const rotationX = center.x + normalizedX * (vectorLength + rotationDistance)
		const rotationY = center.y + normalizedY * (vectorLength + rotationDistance)
		const rotationControlPointId = `${objectId}-cp-12`
		const rotationCircle = this.createControlPointCircle(
			rotationX,
			rotationY,
			rotationControlPointId,
			objectId,
			12,
			true
		)
		rotationCircle.set({ visible, hoverCursor: 'crosshair' })
		this.canvas.add(rotationCircle)
		this.controlPoints.push({
			id: rotationControlPointId,
			circle: rotationCircle,
			objectId,
			pointIndex: 12
		})

		this.bringControlPointsToFront()
		this.canvas.renderAll()
	}

	removeControlPoints(objectId: string): void {
		// Remove corner control points
		const pointsToRemove = this.controlPoints.filter((cp) => cp.objectId === objectId)
		pointsToRemove.forEach((cp) => {
			this.canvas.remove(cp.circle)
		})
		this.controlPoints = this.controlPoints.filter((cp) => cp.objectId !== objectId)

		// Remove edge lines
		const edgeLinesToRemove: string[] = []
		this.edgeLines.forEach((line, id) => {
			if ((line as any).linkedObjectId === objectId) {
				this.canvas.remove(line)
				edgeLinesToRemove.push(id)
			}
		})
		edgeLinesToRemove.forEach((id) => this.edgeLines.delete(id))

		this.canvas.renderAll()
	}

	hideControlPoints(objectId: string): void {
		// Hide corner points
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId)
		points.forEach((cp) => {
			cp.circle.set({ visible: false })
		})

		// Hide edge lines
		this.edgeLines.forEach((line) => {
			if ((line as any).linkedObjectId === objectId) {
				line.set({ visible: false })
			}
		})

		this.canvas.renderAll()
	}

	showControlPoints(objectId: string): void {
		// Show corner points
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId)
		points.forEach((cp) => {
			cp.circle.set({ visible: true })
		})

		// Show edge lines
		this.edgeLines.forEach((line) => {
			if ((line as any).linkedObjectId === objectId) {
				line.set({ visible: true })
			}
		})

		this.canvas.renderAll()
	}

	updateControlPoints(objectId: string, obj: fabric.Object): void {
		const rect = obj as fabric.Rect
		const controlPoints = this.getControlPointsForObject(objectId)
		if (controlPoints.length === 0) return

		const left = rect.left || 0
		const top = rect.top || 0
		const width = rect.width || 0
		const height = rect.height || 0

		// Get transformation matrix
		const matrix = rect.calcTransformMatrix()

		// Define corners in local coordinates - check origin
		const originX = rect.originX || 'left'
		const originY = rect.originY || 'top'

		let corners
		if (originX === 'center' && originY === 'center') {
			// Center origin
			corners = [
				{ x: -width / 2, y: -height / 2 }, // Top-left
				{ x: width / 2, y: -height / 2 }, // Top-right
				{ x: width / 2, y: height / 2 }, // Bottom-right
				{ x: -width / 2, y: height / 2 } // Bottom-left
			]
		} else {
			// Top-left origin (default)
			corners = [
				{ x: 0, y: 0 }, // Top-left
				{ x: width, y: 0 }, // Top-right
				{ x: width, y: height }, // Bottom-right
				{ x: 0, y: height } // Bottom-left
			]
		}

		// Transform to absolute coordinates
		const absoluteCorners = corners.map((corner) =>
			fabric.util.transformPoint(new fabric.Point(corner.x, corner.y), matrix)
		)

		// Update corner control points (indices 0-3)
		controlPoints.forEach((cp) => {
			if (cp.pointIndex >= 0 && cp.pointIndex <= 3) {
				const corner = absoluteCorners[cp.pointIndex]
				cp.circle.set({
					left: corner.x,
					top: corner.y
				})
				cp.circle.setCoords()
			}
		})

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
		]

		edgeMidpoints.forEach((midpoint) => {
			const cp = controlPoints.find((cp) => cp.pointIndex === midpoint.pointIndex)
			if (cp) {
				cp.circle.set({
					left: midpoint.x,
					top: midpoint.y
				})
				cp.circle.setCoords()
			}
		})

		// Update rotation handle (index 12) - maintain 30px distance from top edge
		const topMidpoint = edgeMidpoints[0]
		const rotationCp = controlPoints.find((cp) => cp.pointIndex === 12)
		if (rotationCp) {
			// Calculate the vector from center to top midpoint (perpendicular to top edge in rotated space)
			const center = rect.getCenterPoint()
			const vectorX = topMidpoint.x - center.x
			const vectorY = topMidpoint.y - center.y
			const vectorLength = Math.sqrt(vectorX * vectorX + vectorY * vectorY)

			// Normalize and extend by zoom-adjusted distance
			const normalizedX = vectorX / vectorLength
			const normalizedY = vectorY / vectorLength
			const rotationDistance = this.getRotationHandleDistance()
			const rotationX = center.x + normalizedX * (vectorLength + rotationDistance)
			const rotationY = center.y + normalizedY * (vectorLength + rotationDistance)

			rotationCp.circle.set({
				left: rotationX,
				top: rotationY
			})
			rotationCp.circle.setCoords()
		}

		// Update edge lines - use index 0-3, not 4-7
		const edges = [
			{ start: 0, end: 1 }, // Top
			{ start: 1, end: 2 }, // Right
			{ start: 2, end: 3 }, // Bottom
			{ start: 3, end: 0 } // Left
		]

		edges.forEach(({ start, end }, index) => {
			const edgeId = `${objectId}-edge-${index}`
			const edgeLine = this.edgeLines.get(edgeId)
			if (edgeLine) {
				const startCorner = absoluteCorners[start]
				const endCorner = absoluteCorners[end]
				edgeLine.set({
					x1: startCorner.x,
					y1: startCorner.y,
					x2: endCorner.x,
					y2: endCorner.y
				})
				edgeLine.setCoords()
			}
		})

		this.canvas.renderAll()
	}

	updateObjectFromControlPoint(controlPointId: string, newX: number, newY: number): void {
		// Check if this is a control point (corner or edge midpoint)
		const controlPoint = this.controlPoints.find((cp) => cp.id === controlPointId)

		if (controlPoint) {
			// Check if it's a corner control point (0-3) or edge midpoint (8-11) or rotation (12)
			if (controlPoint.pointIndex >= 0 && controlPoint.pointIndex <= 3) {
				// This is a corner control point
				this.updateFromCorner(controlPoint, newX, newY)
				return
			} else if (controlPoint.pointIndex >= 8 && controlPoint.pointIndex <= 11) {
				// This is an edge midpoint control point
				const edgeIndex = (controlPoint.circle as any).edgeIndex
				this.updateFromEdgeMidpoint(controlPoint, edgeIndex, newX, newY)
				return
			} else if (controlPoint.pointIndex === 12) {
				// Rotation handle
				this.updateFromRotation(controlPoint, newX, newY)
				return
			}
		}

		// Check if this is an edge line
		const edgeLine = this.edgeLines.get(controlPointId)
		if (edgeLine) {
			const linkedObjectId = (edgeLine as any).linkedObjectId
			const edgeIndex = (edgeLine as any).edgeIndex
			this.updateFromEdge(linkedObjectId, edgeIndex, newX, newY)
		}
	}

	private updateFromRotation(controlPoint: ControlPoint, newX: number, newY: number): void {
		const rect = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'rect') as
			| fabric.Rect
			| undefined
		if (!rect) return

		const center = rect.getCenterPoint()

		// Calculate angle from center to rotation handle
		const dx = newX - center.x
		const dy = newY - center.y
		const angleRad = Math.atan2(dy, dx)
		const angleDeg = (angleRad * 180) / Math.PI + 90 // Add 90 to align with top

		// Update rectangle rotation
		rect.set({ angle: angleDeg })
		rect.setCoords()

		// Update control points
		this.updateControlPoints(controlPoint.objectId, rect)
		this.canvas.renderAll()
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
		})
		controlPoint.circle.setCoords()

		// Call updateFromEdge with the object ID and edge index
		this.updateFromEdge(controlPoint.objectId, edgeIndex, newX, newY)
	}

	private updateFromCorner(controlPoint: ControlPoint, newX: number, newY: number): void {
		// Update the control point position immediately
		controlPoint.circle.set({
			left: newX,
			top: newY
		})
		controlPoint.circle.setCoords()

		// Find the rectangle
		const rect = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'rect') as
			| fabric.Rect
			| undefined
		if (!rect) return

		const width = rect.width || 0
		const height = rect.height || 0
		const angle = rect.angle || 0
		const angleRad = (angle * Math.PI) / 180

		// Calculate the four corners in absolute coordinates
		const matrix = rect.calcTransformMatrix()
		const corners: fabric.Point[] = [
			new fabric.Point(-width / 2, -height / 2), // Top-left (0)
			new fabric.Point(width / 2, -height / 2), // Top-right (1)
			new fabric.Point(width / 2, height / 2), // Bottom-right (2)
			new fabric.Point(-width / 2, height / 2) // Bottom-left (3)
		].map((corner) => fabric.util.transformPoint(corner, matrix))

		// Determine which corner is the opposite/anchor corner
		const oppositeCornerIndex = (controlPoint.pointIndex + 2) % 4
		const anchorCorner = corners[oppositeCornerIndex]

		// Store the anchor corner's CURRENT position (we'll keep it fixed)
		const anchorCornerCP = this.getControlPointsForObject(controlPoint.objectId).find(
			(cp) => cp.pointIndex === oppositeCornerIndex
		)
		const anchorPosition = anchorCornerCP ? anchorCornerCP.circle.getCenterPoint() : anchorCorner

		// The new dragged position
		const draggedCorner = new fabric.Point(newX, newY)

		// Vector from anchor to dragged corner
		const vectorX = draggedCorner.x - anchorPosition.x
		const vectorY = draggedCorner.y - anchorPosition.y

		// Project this vector onto the rotated width and height axes
		// Width axis (rotated horizontal)
		const widthAxisX = Math.cos(angleRad)
		const widthAxisY = Math.sin(angleRad)
		const widthProjection = vectorX * widthAxisX + vectorY * widthAxisY

		// Height axis (rotated vertical)
		const heightAxisX = -Math.sin(angleRad)
		const heightAxisY = Math.cos(angleRad)
		const heightProjection = vectorX * heightAxisX + vectorY * heightAxisY

		// New dimensions (absolute values, minimum 10px)
		const newWidth = Math.max(10, Math.abs(widthProjection))
		const newHeight = Math.max(10, Math.abs(heightProjection))

		// New center is halfway between anchor and dragged corner
		const newCenterX =
			anchorPosition.x + (widthProjection * widthAxisX) / 2 + (heightProjection * heightAxisX) / 2
		const newCenterY =
			anchorPosition.y + (widthProjection * widthAxisY) / 2 + (heightProjection * heightAxisY) / 2

		// Store rectangle properties INCLUDING ANGLE
		const rectId = (rect as any).id
		const rectProps = {
			fill: rect.fill,
			stroke: rect.stroke,
			strokeWidth: rect.strokeWidth,
			strokeDashArray: rect.strokeDashArray,
			opacity: rect.opacity,
			angle: angle
		}

		// Remove old rectangle
		this.canvas.remove(rect)

		// Create new rectangle
		const newRect = new fabric.Rect({
			id: rectId,
			left: newCenterX,
			top: newCenterY,
			width: newWidth,
			height: newHeight,
			angle: rectProps.angle,
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
		})

		this.canvas.add(newRect)
		this.bringControlPointsToFront()

		// Update ALL control points to match new rectangle
		this.updateControlPoints(controlPoint.objectId, newRect)

		this.canvas.renderAll()
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
		]

		edges.forEach(({ start, end, edgeIndex }) => {
			const edgeId = `${objectId}-edge-${edgeIndex}`
			const edgeLine = this.edgeLines.get(edgeId)
			if (edgeLine) {
				const startCorner = cornerPositions[start]
				const endCorner = cornerPositions[end]
				edgeLine.set({
					x1: startCorner.x,
					y1: startCorner.y,
					x2: endCorner.x,
					y2: endCorner.y
				})
				edgeLine.setCoords()
			}
		})
	}

	private updateFromEdge(objectId: string, edgeIndex: number, newX: number, newY: number): void {
		// Find the rectangle
		const rect = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === objectId && obj.type === 'rect') as fabric.Rect | undefined
		if (!rect) return

		const width = rect.width || 0
		const height = rect.height || 0
		const angle = rect.angle || 0
		const center = rect.getCenterPoint()

		// Convert angle to radians
		const angleRad = (angle * Math.PI) / 180

		const newPoint = new fabric.Point(newX, newY)

		// Determine which dimension to change and how to move the center
		let newWidth = width
		let newHeight = height
		let newCenterX = center.x
		let newCenterY = center.y

		switch (edgeIndex) {
			case 4: // Top edge
			case 6: {
				// Bottom edge
				// Direction perpendicular to the edge (pointing inward/outward)
				const perpX = -Math.sin(angleRad)
				const perpY = Math.cos(angleRad)
				// For top edge (4), perpendicular points up (negative in local coords)
				// For bottom edge (6), perpendicular points down (positive in local coords)
				const edgeSign = edgeIndex === 4 ? -1 : 1
				// Calculate where the opposite edge currently is
				const oppositeEdgeOffset = (height / 2) * -edgeSign
				const oppositeEdgeX = center.x + perpX * oppositeEdgeOffset
				const oppositeEdgeY = center.y + perpY * oppositeEdgeOffset
				// Distance from new mouse position to opposite edge (in perpendicular direction)
				const distanceFromOpposite =
					(newPoint.x - oppositeEdgeX) * perpX + (newPoint.y - oppositeEdgeY) * perpY
				// New height is this distance (with correct sign)
				newHeight = Math.max(10, Math.abs(distanceFromOpposite))
				// New center is halfway between mouse and opposite edge
				newCenterX = oppositeEdgeX + (perpX * distanceFromOpposite) / 2
				newCenterY = oppositeEdgeY + (perpY * distanceFromOpposite) / 2
				break
			}
			case 5: // Right edge
			case 7: {
				// Left edge
				// Direction perpendicular to the edge (pointing inward/outward)
				const perpX = Math.cos(angleRad)
				const perpY = Math.sin(angleRad)
				// For left edge (7), perpendicular points left (negative in local coords)
				// For right edge (5), perpendicular points right (positive in local coords)
				const edgeSign = edgeIndex === 7 ? -1 : 1
				// Calculate where the opposite edge currently is
				const oppositeEdgeOffset = (width / 2) * -edgeSign
				const oppositeEdgeX = center.x + perpX * oppositeEdgeOffset
				const oppositeEdgeY = center.y + perpY * oppositeEdgeOffset
				// Distance from new mouse position to opposite edge (in perpendicular direction)
				const distanceFromOpposite =
					(newPoint.x - oppositeEdgeX) * perpX + (newPoint.y - oppositeEdgeY) * perpY
				// New width is this distance (with correct sign)
				newWidth = Math.max(10, Math.abs(distanceFromOpposite))
				// New center is halfway between mouse and opposite edge
				newCenterX = oppositeEdgeX + (perpX * distanceFromOpposite) / 2
				newCenterY = oppositeEdgeY + (perpY * distanceFromOpposite) / 2
				break
			}
		}

		// Store rectangle properties INCLUDING ANGLE
		const rectId = (rect as any).id
		const rectProps = {
			fill: rect.fill,
			stroke: rect.stroke,
			strokeWidth: rect.strokeWidth,
			strokeDashArray: rect.strokeDashArray,
			opacity: rect.opacity,
			angle: angle
		}

		// Remove old rectangle
		this.canvas.remove(rect)

		// Create new rectangle with updated center and dimensions
		const newRect = new fabric.Rect({
			id: rectId,
			left: newCenterX,
			top: newCenterY,
			width: newWidth,
			height: newHeight,
			angle: rectProps.angle,
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
		})

		this.canvas.add(newRect)
		this.bringControlPointsToFront()

		// Update all control points
		this.updateControlPoints(objectId, newRect)
		this.canvas.renderAll()
	}
}

/**
 * Control point handler for ellipses
 */
export class EllipseControlPoints extends BoundingBoxControlPoints {
	addControlPoints(objectId: string, obj: fabric.Object, visible: boolean = true): void {
		const ellipse = obj as fabric.Ellipse
		const rx = ellipse.rx || 0
		const ry = ellipse.ry || 0
		const strokeWidth = ellipse.strokeWidth || 0

		// Add padding to account for stroke width - half extends outside
		const padding = strokeWidth / 2

		// Get transformation matrix for handling rotations/scaling
		const matrix = ellipse.calcTransformMatrix()

		// Define the 4 corners of the bounding rectangle in local coordinates with padding
		const corners = [
			{ x: -(rx + padding), y: -(ry + padding) }, // Top-left
			{ x: rx + padding, y: -(ry + padding) }, // Top-right
			{ x: rx + padding, y: ry + padding }, // Bottom-right
			{ x: -(rx + padding), y: ry + padding } // Bottom-left
		]

		// Transform corners to absolute coordinates
		const absoluteCorners = corners.map((corner) =>
			fabric.util.transformPoint(new fabric.Point(corner.x, corner.y), matrix)
		)

		// Create control points at corners (indices 0-3)
		absoluteCorners.forEach((corner, index) => {
			const controlPointId = `${objectId}-cp-${index}`
			const circle = this.createControlPointCircle(
				corner.x,
				corner.y,
				controlPointId,
				objectId,
				index,
				true
			)
			circle.set({ visible })
			this.canvas.add(circle)
			this.controlPoints.push({
				id: controlPointId,
				circle,
				objectId,
				pointIndex: index
			})
		})

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
		]

		edgeMidpoints.forEach((midpoint) => {
			const controlPointId = `${objectId}-cp-${midpoint.pointIndex}`
			const circle = this.createControlPointCircle(
				midpoint.x,
				midpoint.y,
				controlPointId,
				objectId,
				midpoint.pointIndex,
				true
			)
			circle.set({ visible })
			this.canvas.add(circle)
			this.controlPoints.push({
				id: controlPointId,
				circle,
				objectId,
				pointIndex: midpoint.pointIndex
			})
		})

		// Create rotation handle (index 12) - floating, zoom-adjusted distance above the top edge in rotated space
		const topMidpoint = edgeMidpoints[0] // Top edge midpoint
		const center = ellipse.getCenterPoint()
		const vectorX = topMidpoint.x - center.x
		const vectorY = topMidpoint.y - center.y
		const vectorLength = Math.sqrt(vectorX * vectorX + vectorY * vectorY)
		const normalizedX = vectorX / vectorLength
		const normalizedY = vectorY / vectorLength
		const rotationDistance = this.getRotationHandleDistance()
		const rotationX = center.x + normalizedX * (vectorLength + rotationDistance)
		const rotationY = center.y + normalizedY * (vectorLength + rotationDistance)
		const rotationControlPointId = `${objectId}-cp-12`
		const rotationCircle = this.createControlPointCircle(
			rotationX,
			rotationY,
			rotationControlPointId,
			objectId,
			12,
			true
		)
		rotationCircle.set({ visible, hoverCursor: 'crosshair' })
		this.canvas.add(rotationCircle)
		this.controlPoints.push({
			id: rotationControlPointId,
			circle: rotationCircle,
			objectId,
			pointIndex: 12
		})
		// No connector line - rotation handle is floating

		// Create light solid border lines (4 edges)
		// Get current zoom to size edge lines correctly from the start
		const zoom = this.canvas.getZoom()
		const scale = 1 / zoom

		const edges = [
			{ start: 0, end: 1 }, // Top
			{ start: 1, end: 2 }, // Right
			{ start: 2, end: 3 }, // Bottom
			{ start: 3, end: 0 } // Left
		]

		edges.forEach(({ start, end }, index) => {
			const edgeId = `${objectId}-edge-${index}`
			const startCorner = absoluteCorners[start]
			const endCorner = absoluteCorners[end]
			const edgeLine = new fabric.Line([startCorner.x, startCorner.y, endCorner.x, endCorner.y], {
				stroke: 'oklch(0.8 0.05 39.0427)', // Light orange, reduced saturation
				strokeWidth: 1.5 * scale,
				selectable: false,
				evented: false,
				excludeFromExport: true,
				visible
			})
			;(edgeLine as any).id = edgeId
			;(edgeLine as any).linkedObjectId = objectId
			this.canvas.add(edgeLine)
			this.edgeLines.set(edgeId, edgeLine)
		})

		this.bringControlPointsToFront()
		this.canvas.renderAll()
	}

	removeControlPoints(objectId: string): void {
		// Remove control points
		const pointsToRemove = this.controlPoints.filter((cp) => cp.objectId === objectId)
		pointsToRemove.forEach((cp) => {
			this.canvas.remove(cp.circle)
		})
		this.controlPoints = this.controlPoints.filter((cp) => cp.objectId !== objectId)

		// Remove edge lines
		const edgeLinesToRemove: string[] = []
		this.edgeLines.forEach((line, id) => {
			if ((line as any).linkedObjectId === objectId) {
				this.canvas.remove(line)
				edgeLinesToRemove.push(id)
			}
		})
		edgeLinesToRemove.forEach((id) => this.edgeLines.delete(id))

		this.canvas.renderAll()
	}

	hideControlPoints(objectId: string): void {
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId)
		points.forEach((cp) => {
			cp.circle.set({ visible: false })
		})

		this.edgeLines.forEach((line) => {
			if ((line as any).linkedObjectId === objectId) {
				line.set({ visible: false })
			}
		})

		this.canvas.renderAll()
	}

	hideAllControlPoints(): void {
		// Hide all control point circles
		this.controlPoints.forEach((cp) => {
			cp.circle.set({ visible: false })
		})

		// Hide all edge lines
		this.edgeLines.forEach((line) => {
			line.set({ visible: false })
		})

		this.canvas.renderAll()
	}

	showControlPoints(objectId: string): void {
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId)
		points.forEach((cp) => {
			cp.circle.set({ visible: true })
		})

		this.edgeLines.forEach((line) => {
			if ((line as any).linkedObjectId === objectId) {
				line.set({ visible: true })
			}
		})

		this.canvas.renderAll()
	}

	updateControlPoints(objectId: string, obj: fabric.Object): void {
		const ellipse = obj as fabric.Ellipse
		const controlPoints = this.getControlPointsForObject(objectId)
		if (controlPoints.length === 0) return

		const rx = ellipse.rx || 0
		const ry = ellipse.ry || 0
		const strokeWidth = ellipse.strokeWidth || 0

		// Add padding to account for stroke width
		const padding = strokeWidth / 2

		// Get transformation matrix
		const matrix = ellipse.calcTransformMatrix()

		// Define corners in local coordinates with padding
		const corners = [
			{ x: -(rx + padding), y: -(ry + padding) }, // Top-left
			{ x: rx + padding, y: -(ry + padding) }, // Top-right
			{ x: rx + padding, y: ry + padding }, // Bottom-right
			{ x: -(rx + padding), y: ry + padding } // Bottom-left
		]

		// Transform to absolute coordinates
		const absoluteCorners = corners.map((corner) =>
			fabric.util.transformPoint(new fabric.Point(corner.x, corner.y), matrix)
		)

		// Update corner control points (indices 0-3)
		controlPoints.forEach((cp) => {
			if (cp.pointIndex >= 0 && cp.pointIndex <= 3) {
				const corner = absoluteCorners[cp.pointIndex]
				cp.circle.set({
					left: corner.x,
					top: corner.y
				})
				cp.circle.setCoords()
			}
		})

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
		]

		edgeMidpoints.forEach((midpoint) => {
			const cp = controlPoints.find((cp) => cp.pointIndex === midpoint.pointIndex)
			if (cp) {
				cp.circle.set({
					left: midpoint.x,
					top: midpoint.y
				})
				cp.circle.setCoords()
			}
		})

		// Update rotation handle (index 12) - maintain 30px distance from top edge
		const topMidpoint = edgeMidpoints[0]
		const rotationCp = controlPoints.find((cp) => cp.pointIndex === 12)
		if (rotationCp) {
			// Calculate the vector from center to top midpoint
			const center = ellipse.getCenterPoint()
			const vectorX = topMidpoint.x - center.x
			const vectorY = topMidpoint.y - center.y
			const vectorLength = Math.sqrt(vectorX * vectorX + vectorY * vectorY)

			// Normalize and extend by zoom-adjusted distance
			const normalizedX = vectorX / vectorLength
			const normalizedY = vectorY / vectorLength
			const rotationDistance = this.getRotationHandleDistance()
			const rotationX = center.x + normalizedX * (vectorLength + rotationDistance)
			const rotationY = center.y + normalizedY * (vectorLength + rotationDistance)

			rotationCp.circle.set({
				left: rotationX,
				top: rotationY
			})
			rotationCp.circle.setCoords()
		}

		// Update edge lines
		const edges = [
			{ start: 0, end: 1 }, // Top
			{ start: 1, end: 2 }, // Right
			{ start: 2, end: 3 }, // Bottom
			{ start: 3, end: 0 } // Left
		]

		edges.forEach(({ start, end }, index) => {
			const edgeId = `${objectId}-edge-${index}`
			const edgeLine = this.edgeLines.get(edgeId)
			if (edgeLine) {
				const startCorner = absoluteCorners[start]
				const endCorner = absoluteCorners[end]
				edgeLine.set({
					x1: startCorner.x,
					y1: startCorner.y,
					x2: endCorner.x,
					y2: endCorner.y
				})
				edgeLine.setCoords()
			}
		})

		this.canvas.renderAll()
	}

	updateObjectFromControlPoint(controlPointId: string, newX: number, newY: number): void {
		const controlPoint = this.controlPoints.find((cp) => cp.id === controlPointId)
		if (!controlPoint) return

		// Update the control point position immediately
		controlPoint.circle.set({
			left: newX,
			top: newY
		})
		controlPoint.circle.setCoords()

		// Handle different control point types
		if (controlPoint.pointIndex >= 0 && controlPoint.pointIndex <= 3) {
			// Corner control point - diagonal scaling
			this.updateFromCorner(controlPoint, newX, newY)
		} else if (controlPoint.pointIndex >= 8 && controlPoint.pointIndex <= 11) {
			// Edge midpoint - stretch
			this.updateFromEdge(controlPoint, newX, newY)
		} else if (controlPoint.pointIndex === 12) {
			// Rotation handle
			this.updateFromRotation(controlPoint, newX, newY)
		}
	}

	private updateFromCorner(controlPoint: ControlPoint, newX: number, newY: number): void {
		const ellipse = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'ellipse') as
			| fabric.Ellipse
			| undefined
		if (!ellipse) return

		const rx = ellipse.rx || 0
		const ry = ellipse.ry || 0
		const angle = ellipse.angle || 0
		const angleRad = (angle * Math.PI) / 180

		// Calculate the four corners in absolute coordinates
		const matrix = ellipse.calcTransformMatrix()
		const corners: fabric.Point[] = [
			new fabric.Point(-rx, -ry), // Top-left (0)
			new fabric.Point(rx, -ry), // Top-right (1)
			new fabric.Point(rx, ry), // Bottom-right (2)
			new fabric.Point(-rx, ry) // Bottom-left (3)
		].map((corner) => fabric.util.transformPoint(corner, matrix))

		// Determine which corner is the opposite/anchor corner
		const oppositeCornerIndex = (controlPoint.pointIndex + 2) % 4
		const anchorCorner = corners[oppositeCornerIndex]

		// Get the anchor corner control point's actual position
		const anchorCornerCP = this.getControlPointsForObject(controlPoint.objectId).find(
			(cp) => cp.pointIndex === oppositeCornerIndex
		)
		const anchorPosition = anchorCornerCP ? anchorCornerCP.circle.getCenterPoint() : anchorCorner

		// The new dragged position
		const draggedCorner = new fabric.Point(newX, newY)

		// Vector from anchor to dragged corner
		const vectorX = draggedCorner.x - anchorPosition.x
		const vectorY = draggedCorner.y - anchorPosition.y

		// Project this vector onto the rotated width and height axes
		// Width axis (rotated horizontal)
		const widthAxisX = Math.cos(angleRad)
		const widthAxisY = Math.sin(angleRad)
		const widthProjection = vectorX * widthAxisX + vectorY * widthAxisY

		// Height axis (rotated vertical)
		const heightAxisX = -Math.sin(angleRad)
		const heightAxisY = Math.cos(angleRad)
		const heightProjection = vectorX * heightAxisX + vectorY * heightAxisY

		// New dimensions (absolute values, minimum 10px)
		const newRx = Math.max(10, Math.abs(widthProjection) / 2)
		const newRy = Math.max(10, Math.abs(heightProjection) / 2)

		// New center is halfway between anchor and dragged corner
		const newCenterX =
			anchorPosition.x + (widthProjection * widthAxisX) / 2 + (heightProjection * heightAxisX) / 2
		const newCenterY =
			anchorPosition.y + (widthProjection * widthAxisY) / 2 + (heightProjection * heightAxisY) / 2

		// Store ellipse properties
		const ellipseId = (ellipse as any).id
		const ellipseProps = {
			fill: ellipse.fill,
			stroke: ellipse.stroke,
			strokeWidth: ellipse.strokeWidth,
			strokeDashArray: ellipse.strokeDashArray,
			opacity: ellipse.opacity,
			angle: angle
		}

		// Remove old ellipse
		this.canvas.remove(ellipse)

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
			angle: ellipseProps.angle,
			selectable: true,
			hasControls: false,
			hasBorders: false,
			strokeUniform: true,
			originX: 'center',
			originY: 'center'
		})

		this.canvas.add(newEllipse)
		this.bringControlPointsToFront()
		this.updateControlPoints(controlPoint.objectId, newEllipse)

		this.canvas.renderAll()
	}

	private updateFromEdge(controlPoint: ControlPoint, newX: number, newY: number): void {
		const ellipse = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'ellipse') as
			| fabric.Ellipse
			| undefined
		if (!ellipse) return

		const rx = ellipse.rx || 0
		const ry = ellipse.ry || 0
		const angle = ellipse.angle || 0
		const center = ellipse.getCenterPoint()

		// Convert angle to radians
		const angleRad = (angle * Math.PI) / 180

		const newPoint = new fabric.Point(newX, newY)

		// Determine which dimension to change and how to move the center
		let newRx = rx
		let newRy = ry
		let newCenterX = center.x
		let newCenterY = center.y

		switch (controlPoint.pointIndex) {
			case 8: // Top edge
			case 10: {
				// Bottom edge
				// Direction perpendicular to the edge (pointing inward/outward)
				const perpX = -Math.sin(angleRad)
				const perpY = Math.cos(angleRad)
				// For top edge (8), perpendicular points up (negative in local coords)
				// For bottom edge (10), perpendicular points down (positive in local coords)
				const edgeSign = controlPoint.pointIndex === 8 ? -1 : 1
				// Calculate where the opposite edge currently is
				const oppositeEdgeOffset = ry * -edgeSign
				const oppositeEdgeX = center.x + perpX * oppositeEdgeOffset
				const oppositeEdgeY = center.y + perpY * oppositeEdgeOffset
				// Distance from new mouse position to opposite edge (in perpendicular direction)
				const distanceFromOpposite =
					(newPoint.x - oppositeEdgeX) * perpX + (newPoint.y - oppositeEdgeY) * perpY
				// New ry is half this distance
				newRy = Math.max(10, Math.abs(distanceFromOpposite) / 2)
				// New center is halfway between mouse and opposite edge
				newCenterX = oppositeEdgeX + (perpX * distanceFromOpposite) / 2
				newCenterY = oppositeEdgeY + (perpY * distanceFromOpposite) / 2
				break
			}
			case 9: // Right edge
			case 11: {
				// Left edge
				// Direction perpendicular to the edge (pointing inward/outward)
				const perpX = Math.cos(angleRad)
				const perpY = Math.sin(angleRad)
				// For left edge (11), perpendicular points left (negative in local coords)
				// For right edge (9), perpendicular points right (positive in local coords)
				const edgeSign = controlPoint.pointIndex === 11 ? -1 : 1
				// Calculate where the opposite edge currently is
				const oppositeEdgeOffset = rx * -edgeSign
				const oppositeEdgeX = center.x + perpX * oppositeEdgeOffset
				const oppositeEdgeY = center.y + perpY * oppositeEdgeOffset
				// Distance from new mouse position to opposite edge (in perpendicular direction)
				const distanceFromOpposite =
					(newPoint.x - oppositeEdgeX) * perpX + (newPoint.y - oppositeEdgeY) * perpY
				// New rx is half this distance
				newRx = Math.max(10, Math.abs(distanceFromOpposite) / 2)
				// New center is halfway between mouse and opposite edge
				newCenterX = oppositeEdgeX + (perpX * distanceFromOpposite) / 2
				newCenterY = oppositeEdgeY + (perpY * distanceFromOpposite) / 2
				break
			}
		}

		// Store ellipse properties
		const ellipseId = (ellipse as any).id
		const ellipseProps = {
			fill: ellipse.fill,
			stroke: ellipse.stroke,
			strokeWidth: ellipse.strokeWidth,
			strokeDashArray: ellipse.strokeDashArray,
			opacity: ellipse.opacity,
			angle: angle
		}

		// Remove old ellipse
		this.canvas.remove(ellipse)

		// Create new ellipse with updated center and dimensions
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
			angle: ellipseProps.angle,
			selectable: true,
			hasControls: false,
			hasBorders: false,
			strokeUniform: true,
			originX: 'center',
			originY: 'center'
		})

		this.canvas.add(newEllipse)
		this.bringControlPointsToFront()
		this.updateControlPoints(controlPoint.objectId, newEllipse)
		this.canvas.renderAll()
	}

	private updateFromRotation(controlPoint: ControlPoint, newX: number, newY: number): void {
		const ellipse = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'ellipse') as
			| fabric.Ellipse
			| undefined
		if (!ellipse) return

		const center = ellipse.getCenterPoint()

		// Calculate angle from center to rotation handle
		const dx = newX - center.x
		const dy = newY - center.y
		const angleRad = Math.atan2(dy, dx)
		const angleDeg = (angleRad * 180) / Math.PI + 90 // Add 90 to align with top

		// Update ellipse rotation
		ellipse.set({ angle: angleDeg })
		ellipse.setCoords()

		// Update control points
		this.updateControlPoints(controlPoint.objectId, ellipse)
		this.canvas.renderAll()
	}
}

/**
 * Control point handler for triangles
 */
export class TriangleControlPoints extends BoundingBoxControlPoints {
	addControlPoints(objectId: string, obj: fabric.Object, visible: boolean = true): void {
		const triangle = obj as fabric.Triangle
		const width = triangle.width || 0
		const height = triangle.height || 0
		const strokeWidth = triangle.strokeWidth || 0

		// Add padding to account for stroke width
		const padding = strokeWidth / 2

		// Get transformation matrix for handling rotations/scaling
		const matrix = triangle.calcTransformMatrix()

		// Define the 4 corners of the bounding rectangle in local coordinates with padding
		const corners = [
			{ x: -(width / 2 + padding), y: -(height / 2 + padding) }, // Top-left
			{ x: width / 2 + padding, y: -(height / 2 + padding) }, // Top-right
			{ x: width / 2 + padding, y: height / 2 + padding }, // Bottom-right
			{ x: -(width / 2 + padding), y: height / 2 + padding } // Bottom-left
		]

		// Transform corners to absolute coordinates
		const absoluteCorners = corners.map((corner) =>
			fabric.util.transformPoint(new fabric.Point(corner.x, corner.y), matrix)
		)

		// Create control points at corners (indices 0-3)
		absoluteCorners.forEach((corner, index) => {
			const controlPointId = `${objectId}-cp-${index}`
			const circle = this.createControlPointCircle(
				corner.x,
				corner.y,
				controlPointId,
				objectId,
				index,
				true
			)
			circle.set({ visible })
			this.canvas.add(circle)
			this.controlPoints.push({
				id: controlPointId,
				circle,
				objectId,
				pointIndex: index
			})
		})

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
		]

		edgeMidpoints.forEach((midpoint) => {
			const controlPointId = `${objectId}-cp-${midpoint.pointIndex}`
			const circle = this.createControlPointCircle(
				midpoint.x,
				midpoint.y,
				controlPointId,
				objectId,
				midpoint.pointIndex,
				true
			)
			circle.set({ visible })
			this.canvas.add(circle)
			this.controlPoints.push({
				id: controlPointId,
				circle,
				objectId,
				pointIndex: midpoint.pointIndex
			})
		})

		// Create rotation handle (index 12) - floating, zoom-adjusted distance above the top edge in rotated space
		const topMidpoint = edgeMidpoints[0] // Top edge midpoint
		const center = triangle.getCenterPoint()
		const vectorX = topMidpoint.x - center.x
		const vectorY = topMidpoint.y - center.y
		const vectorLength = Math.sqrt(vectorX * vectorX + vectorY * vectorY)
		const normalizedX = vectorX / vectorLength
		const normalizedY = vectorY / vectorLength
		const rotationDistance = this.getRotationHandleDistance()
		const rotationX = center.x + normalizedX * (vectorLength + rotationDistance)
		const rotationY = center.y + normalizedY * (vectorLength + rotationDistance)
		const rotationControlPointId = `${objectId}-cp-12`
		const rotationCircle = this.createControlPointCircle(
			rotationX,
			rotationY,
			rotationControlPointId,
			objectId,
			12,
			true
		)
		rotationCircle.set({ visible, hoverCursor: 'crosshair' })
		this.canvas.add(rotationCircle)
		this.controlPoints.push({
			id: rotationControlPointId,
			circle: rotationCircle,
			objectId,
			pointIndex: 12
		})

		// Create light solid border lines (4 edges)
		// Get current zoom to size edge lines correctly from the start
		const zoom = this.canvas.getZoom()
		const scale = 1 / zoom

		const edges = [
			{ start: 0, end: 1 }, // Top
			{ start: 1, end: 2 }, // Right
			{ start: 2, end: 3 }, // Bottom
			{ start: 3, end: 0 } // Left
		]

		edges.forEach(({ start, end }, index) => {
			const edgeId = `${objectId}-edge-${index}`
			const startCorner = absoluteCorners[start]
			const endCorner = absoluteCorners[end]
			const edgeLine = new fabric.Line([startCorner.x, startCorner.y, endCorner.x, endCorner.y], {
				stroke: 'oklch(0.8 0.05 39.0427)', // Light orange, reduced saturation
				strokeWidth: 1.5 * scale,
				selectable: false,
				evented: false,
				excludeFromExport: true,
				visible
			})
			;(edgeLine as any).id = edgeId
			;(edgeLine as any).linkedObjectId = objectId
			this.canvas.add(edgeLine)
			this.edgeLines.set(edgeId, edgeLine)
		})

		this.bringControlPointsToFront()
		this.canvas.renderAll()
	}

	removeControlPoints(objectId: string): void {
		// Remove control points
		const pointsToRemove = this.controlPoints.filter((cp) => cp.objectId === objectId)
		pointsToRemove.forEach((cp) => {
			this.canvas.remove(cp.circle)
		})
		this.controlPoints = this.controlPoints.filter((cp) => cp.objectId !== objectId)

		// Remove edge lines
		const edgeLinesToRemove: string[] = []
		this.edgeLines.forEach((line, id) => {
			if ((line as any).linkedObjectId === objectId) {
				this.canvas.remove(line)
				edgeLinesToRemove.push(id)
			}
		})
		edgeLinesToRemove.forEach((id) => this.edgeLines.delete(id))

		this.canvas.renderAll()
	}

	hideControlPoints(objectId: string): void {
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId)
		points.forEach((cp) => {
			cp.circle.set({ visible: false })
		})

		this.edgeLines.forEach((line) => {
			if ((line as any).linkedObjectId === objectId) {
				line.set({ visible: false })
			}
		})

		this.canvas.renderAll()
	}

	hideAllControlPoints(): void {
		// Hide all control point circles
		this.controlPoints.forEach((cp) => {
			cp.circle.set({ visible: false })
		})

		// Hide all edge lines
		this.edgeLines.forEach((line) => {
			line.set({ visible: false })
		})

		this.canvas.renderAll()
	}

	showControlPoints(objectId: string): void {
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId)
		points.forEach((cp) => {
			cp.circle.set({ visible: true })
		})

		this.edgeLines.forEach((line) => {
			if ((line as any).linkedObjectId === objectId) {
				line.set({ visible: true })
			}
		})

		this.canvas.renderAll()
	}

	updateControlPoints(objectId: string, obj: fabric.Object): void {
		const triangle = obj as fabric.Triangle
		const controlPoints = this.getControlPointsForObject(objectId)
		if (controlPoints.length === 0) return

		const width = triangle.width || 0
		const height = triangle.height || 0
		const strokeWidth = triangle.strokeWidth || 0

		// Add padding to account for stroke width
		const padding = strokeWidth / 2

		// Get transformation matrix
		const matrix = triangle.calcTransformMatrix()

		// Define corners in local coordinates with padding
		const corners = [
			{ x: -(width / 2 + padding), y: -(height / 2 + padding) }, // Top-left
			{ x: width / 2 + padding, y: -(height / 2 + padding) }, // Top-right
			{ x: width / 2 + padding, y: height / 2 + padding }, // Bottom-right
			{ x: -(width / 2 + padding), y: height / 2 + padding } // Bottom-left
		]

		// Transform to absolute coordinates
		const absoluteCorners = corners.map((corner) =>
			fabric.util.transformPoint(new fabric.Point(corner.x, corner.y), matrix)
		)

		// Update corner control points (indices 0-3)
		controlPoints.forEach((cp) => {
			if (cp.pointIndex >= 0 && cp.pointIndex <= 3) {
				const corner = absoluteCorners[cp.pointIndex]
				cp.circle.set({
					left: corner.x,
					top: corner.y
				})
				cp.circle.setCoords()
			}
		})

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
		]

		edgeMidpoints.forEach((midpoint) => {
			const cp = controlPoints.find((cp) => cp.pointIndex === midpoint.pointIndex)
			if (cp) {
				cp.circle.set({
					left: midpoint.x,
					top: midpoint.y
				})
				cp.circle.setCoords()
			}
		})

		// Update rotation handle (index 12) - maintain 30px distance from top edge
		const topMidpoint = edgeMidpoints[0]
		const rotationCp = controlPoints.find((cp) => cp.pointIndex === 12)
		if (rotationCp) {
			// Calculate the vector from center to top midpoint
			const center = triangle.getCenterPoint()
			const vectorX = topMidpoint.x - center.x
			const vectorY = topMidpoint.y - center.y
			const vectorLength = Math.sqrt(vectorX * vectorX + vectorY * vectorY)

			// Normalize and extend by 30px
			const normalizedX = vectorX / vectorLength
			const normalizedY = vectorY / vectorLength
			const rotationX = center.x + normalizedX * (vectorLength + 30)
			const rotationY = center.y + normalizedY * (vectorLength + 30)

			rotationCp.circle.set({
				left: rotationX,
				top: rotationY
			})
			rotationCp.circle.setCoords()
		}

		// Update edge lines
		const edges = [
			{ start: 0, end: 1 }, // Top
			{ start: 1, end: 2 }, // Right
			{ start: 2, end: 3 }, // Bottom
			{ start: 3, end: 0 } // Left
		]

		edges.forEach(({ start, end }, index) => {
			const edgeId = `${objectId}-edge-${index}`
			const edgeLine = this.edgeLines.get(edgeId)
			if (edgeLine) {
				const startCorner = absoluteCorners[start]
				const endCorner = absoluteCorners[end]
				edgeLine.set({
					x1: startCorner.x,
					y1: startCorner.y,
					x2: endCorner.x,
					y2: endCorner.y
				})
				edgeLine.setCoords()
			}
		})

		this.canvas.renderAll()
	}

	updateObjectFromControlPoint(controlPointId: string, newX: number, newY: number): void {
		const controlPoint = this.controlPoints.find((cp) => cp.id === controlPointId)
		if (!controlPoint) return

		// Update the control point position immediately
		controlPoint.circle.set({
			left: newX,
			top: newY
		})
		controlPoint.circle.setCoords()

		// Handle different control point types
		if (controlPoint.pointIndex >= 0 && controlPoint.pointIndex <= 3) {
			// Corner control point - diagonal scaling
			this.updateFromCorner(controlPoint, newX, newY)
		} else if (controlPoint.pointIndex >= 8 && controlPoint.pointIndex <= 11) {
			// Edge midpoint - stretch
			this.updateFromEdge(controlPoint, newX, newY)
		} else if (controlPoint.pointIndex === 12) {
			// Rotation handle
			this.updateFromRotation(controlPoint, newX, newY)
		}
	}

	private updateFromCorner(controlPoint: ControlPoint, newX: number, newY: number): void {
		const triangle = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'triangle') as
			| fabric.Triangle
			| undefined
		if (!triangle) return

		const width = triangle.width || 0
		const height = triangle.height || 0
		const angle = triangle.angle || 0
		const angleRad = (angle * Math.PI) / 180

		// Calculate the four corners in absolute coordinates
		const matrix = triangle.calcTransformMatrix()
		const corners: fabric.Point[] = [
			new fabric.Point(-width / 2, -height / 2), // Top-left (0)
			new fabric.Point(width / 2, -height / 2), // Top-right (1)
			new fabric.Point(width / 2, height / 2), // Bottom-right (2)
			new fabric.Point(-width / 2, height / 2) // Bottom-left (3)
		].map((corner) => fabric.util.transformPoint(corner, matrix))

		// Determine which corner is the opposite/anchor corner
		const oppositeCornerIndex = (controlPoint.pointIndex + 2) % 4
		const anchorCorner = corners[oppositeCornerIndex]

		// Get the anchor corner control point's actual position
		const anchorCornerCP = this.getControlPointsForObject(controlPoint.objectId).find(
			(cp) => cp.pointIndex === oppositeCornerIndex
		)
		const anchorPosition = anchorCornerCP ? anchorCornerCP.circle.getCenterPoint() : anchorCorner

		// The new dragged position
		const draggedCorner = new fabric.Point(newX, newY)

		// Vector from anchor to dragged corner
		const vectorX = draggedCorner.x - anchorPosition.x
		const vectorY = draggedCorner.y - anchorPosition.y

		// Project this vector onto the rotated width and height axes
		const widthAxisX = Math.cos(angleRad)
		const widthAxisY = Math.sin(angleRad)
		const widthProjection = vectorX * widthAxisX + vectorY * widthAxisY

		const heightAxisX = -Math.sin(angleRad)
		const heightAxisY = Math.cos(angleRad)
		const heightProjection = vectorX * heightAxisX + vectorY * heightAxisY

		// New dimensions
		const newWidth = Math.max(10, Math.abs(widthProjection))
		const newHeight = Math.max(10, Math.abs(heightProjection))

		// New center is halfway between anchor and dragged corner
		const newCenterX =
			anchorPosition.x + (widthProjection * widthAxisX) / 2 + (heightProjection * heightAxisX) / 2
		const newCenterY =
			anchorPosition.y + (widthProjection * widthAxisY) / 2 + (heightProjection * heightAxisY) / 2

		// Store triangle properties
		const triangleId = (triangle as any).id
		const triangleProps = {
			fill: triangle.fill,
			stroke: triangle.stroke,
			strokeWidth: triangle.strokeWidth,
			strokeDashArray: triangle.strokeDashArray,
			opacity: triangle.opacity,
			angle: angle
		}

		// Remove old triangle
		this.canvas.remove(triangle)

		// Create new triangle
		const newTriangle = new fabric.Triangle({
			id: triangleId,
			left: newCenterX,
			top: newCenterY,
			width: newWidth,
			height: newHeight,
			fill: triangleProps.fill,
			stroke: triangleProps.stroke,
			strokeWidth: triangleProps.strokeWidth,
			strokeDashArray: triangleProps.strokeDashArray,
			opacity: triangleProps.opacity,
			angle: triangleProps.angle,
			selectable: true,
			hasControls: false,
			hasBorders: false,
			strokeUniform: true,
			originX: 'center',
			originY: 'center'
		})

		this.canvas.add(newTriangle)
		this.bringControlPointsToFront()
		this.updateControlPoints(controlPoint.objectId, newTriangle)

		this.canvas.renderAll()
	}

	private updateFromEdge(controlPoint: ControlPoint, newX: number, newY: number): void {
		const triangle = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'triangle') as
			| fabric.Triangle
			| undefined
		if (!triangle) return

		const width = triangle.width || 0
		const height = triangle.height || 0
		const angle = triangle.angle || 0
		const center = triangle.getCenterPoint()

		// Convert angle to radians
		const angleRad = (angle * Math.PI) / 180

		const newPoint = new fabric.Point(newX, newY)

		// Determine which dimension to change and how to move the center
		let newWidth = width
		let newHeight = height
		let newCenterX = center.x
		let newCenterY = center.y

		switch (controlPoint.pointIndex) {
			case 8: // Top edge
			case 10: {
				// Bottom edge
				// Direction perpendicular to the edge
				const perpX = -Math.sin(angleRad)
				const perpY = Math.cos(angleRad)
				const edgeSign = controlPoint.pointIndex === 8 ? -1 : 1
				// Calculate where the opposite edge currently is
				const oppositeEdgeOffset = (height / 2) * -edgeSign
				const oppositeEdgeX = center.x + perpX * oppositeEdgeOffset
				const oppositeEdgeY = center.y + perpY * oppositeEdgeOffset
				// Distance from new mouse position to opposite edge
				const distanceFromOpposite =
					(newPoint.x - oppositeEdgeX) * perpX + (newPoint.y - oppositeEdgeY) * perpY
				// New height
				newHeight = Math.max(10, Math.abs(distanceFromOpposite))
				// New center is halfway between mouse and opposite edge
				newCenterX = oppositeEdgeX + (perpX * distanceFromOpposite) / 2
				newCenterY = oppositeEdgeY + (perpY * distanceFromOpposite) / 2
				break
			}
			case 9: // Right edge
			case 11: {
				// Left edge
				// Direction perpendicular to the edge
				const perpX = Math.cos(angleRad)
				const perpY = Math.sin(angleRad)
				const edgeSign = controlPoint.pointIndex === 11 ? -1 : 1
				// Calculate where the opposite edge currently is
				const oppositeEdgeOffset = (width / 2) * -edgeSign
				const oppositeEdgeX = center.x + perpX * oppositeEdgeOffset
				const oppositeEdgeY = center.y + perpY * oppositeEdgeOffset
				// Distance from new mouse position to opposite edge
				const distanceFromOpposite =
					(newPoint.x - oppositeEdgeX) * perpX + (newPoint.y - oppositeEdgeY) * perpY
				// New width
				newWidth = Math.max(10, Math.abs(distanceFromOpposite))
				// New center is halfway between mouse and opposite edge
				newCenterX = oppositeEdgeX + (perpX * distanceFromOpposite) / 2
				newCenterY = oppositeEdgeY + (perpY * distanceFromOpposite) / 2
				break
			}
		}

		// Store triangle properties
		const triangleId = (triangle as any).id
		const triangleProps = {
			fill: triangle.fill,
			stroke: triangle.stroke,
			strokeWidth: triangle.strokeWidth,
			strokeDashArray: triangle.strokeDashArray,
			opacity: triangle.opacity,
			angle: angle
		}

		// Remove old triangle
		this.canvas.remove(triangle)

		// Create new triangle with updated center and dimensions
		const newTriangle = new fabric.Triangle({
			id: triangleId,
			left: newCenterX,
			top: newCenterY,
			width: newWidth,
			height: newHeight,
			fill: triangleProps.fill,
			stroke: triangleProps.stroke,
			strokeWidth: triangleProps.strokeWidth,
			strokeDashArray: triangleProps.strokeDashArray,
			opacity: triangleProps.opacity,
			angle: triangleProps.angle,
			selectable: true,
			hasControls: false,
			hasBorders: false,
			strokeUniform: true,
			originX: 'center',
			originY: 'center'
		})

		this.canvas.add(newTriangle)
		this.bringControlPointsToFront()
		this.updateControlPoints(controlPoint.objectId, newTriangle)
		this.canvas.renderAll()
	}

	private updateFromRotation(controlPoint: ControlPoint, newX: number, newY: number): void {
		const triangle = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'triangle') as
			| fabric.Triangle
			| undefined
		if (!triangle) return

		const center = triangle.getCenterPoint()

		// Calculate angle from center to rotation handle
		const dx = newX - center.x
		const dy = newY - center.y
		const angleRad = Math.atan2(dy, dx)
		const angleDeg = (angleRad * 180) / Math.PI + 90 // Add 90 to align with top

		// Update triangle rotation
		triangle.set({ angle: angleDeg })
		triangle.setCoords()

		// Update control points
		this.updateControlPoints(controlPoint.objectId, triangle)
		this.canvas.renderAll()
	}
}

/**
 * Control point handler for textboxes
 */
export class TextboxControlPoints extends BoundingBoxControlPoints {
	addControlPoints(objectId: string, obj: fabric.Object, visible: boolean = true): void {
		const textbox = obj as fabric.Textbox
		const width = textbox.width || 0
		const height = textbox.height || 0
		const left = textbox.left || 0
		const top = textbox.top || 0
		const angle = textbox.angle || 0
		const angleRad = (angle * Math.PI) / 180

		// Add padding to account for text overflow (descenders, etc.)
		const padding = 3

		// Calculate the four corners by rotating around top-left origin
		const cos = Math.cos(angleRad)
		const sin = Math.sin(angleRad)

		// Define corners in local space (before rotation) with padding
		const localCorners = [
			{ x: -padding, y: -padding }, // Top-left
			{ x: width + padding, y: -padding }, // Top-right
			{ x: width + padding, y: height + padding }, // Bottom-right
			{ x: -padding, y: height + padding } // Bottom-left
		]

		// Rotate each corner around the origin (top-left) and add the textbox position
		const corners = localCorners.map((corner) => ({
			x: left + corner.x * cos - corner.y * sin,
			y: top + corner.x * sin + corner.y * cos
		}))

		// Create control points at corners (indices 0-3)
		corners.forEach((corner, index) => {
			const controlPointId = `${objectId}-cp-${index}`
			const circle = this.createControlPointCircle(
				corner.x,
				corner.y,
				controlPointId,
				objectId,
				index,
				true
			)
			circle.set({ visible })
			this.canvas.add(circle)
			this.controlPoints.push({
				id: controlPointId,
				circle,
				objectId,
				pointIndex: index
			})
		})

		// Create edge midpoint control points (indices 8-11)
		const edgeMidpoints = [
			{
				x: (corners[0].x + corners[1].x) / 2,
				y: (corners[0].y + corners[1].y) / 2,
				pointIndex: 8 // Top edge
			},
			{
				x: (corners[1].x + corners[2].x) / 2,
				y: (corners[1].y + corners[2].y) / 2,
				pointIndex: 9 // Right edge
			},
			{
				x: (corners[2].x + corners[3].x) / 2,
				y: (corners[2].y + corners[3].y) / 2,
				pointIndex: 10 // Bottom edge
			},
			{
				x: (corners[3].x + corners[0].x) / 2,
				y: (corners[3].y + corners[0].y) / 2,
				pointIndex: 11 // Left edge
			}
		]

		edgeMidpoints.forEach((midpoint) => {
			const controlPointId = `${objectId}-cp-${midpoint.pointIndex}`
			const circle = this.createControlPointCircle(
				midpoint.x,
				midpoint.y,
				controlPointId,
				objectId,
				midpoint.pointIndex,
				true
			)
			circle.set({ visible })
			this.canvas.add(circle)
			this.controlPoints.push({
				id: controlPointId,
				circle,
				objectId,
				pointIndex: midpoint.pointIndex
			})
		})

		// Create rotation handle (index 12)
		const topMidpoint = edgeMidpoints[0]
		const rotationY = topMidpoint.y - 30
		const rotationControlPointId = `${objectId}-cp-12`
		const rotationCircle = this.createControlPointCircle(
			topMidpoint.x,
			rotationY,
			rotationControlPointId,
			objectId,
			12,
			true
		)
		rotationCircle.set({ visible, hoverCursor: 'crosshair' })
		this.canvas.add(rotationCircle)
		this.controlPoints.push({
			id: rotationControlPointId,
			circle: rotationCircle,
			objectId,
			pointIndex: 12
		})

		// Create border lines
		const zoom = this.canvas.getZoom()
		const scale = 1 / zoom

		const edges = [
			{ start: 0, end: 1 }, // Top
			{ start: 1, end: 2 }, // Right
			{ start: 2, end: 3 }, // Bottom
			{ start: 3, end: 0 } // Left
		]

		edges.forEach(({ start, end }, index) => {
			const edgeId = `${objectId}-edge-${index}`
			const startCorner = corners[start]
			const endCorner = corners[end]
			const edgeLine = new fabric.Line([startCorner.x, startCorner.y, endCorner.x, endCorner.y], {
				stroke: 'oklch(0.8 0.05 39.0427)',
				strokeWidth: 1.5 * scale,
				selectable: false,
				evented: false,
				excludeFromExport: true,
				visible
			})
			;(edgeLine as any).id = edgeId
			;(edgeLine as any).linkedObjectId = objectId
			this.canvas.add(edgeLine)
			this.edgeLines.set(edgeId, edgeLine)
		})

		this.bringControlPointsToFront()
		this.canvas.renderAll()
	}

	removeControlPoints(objectId: string): void {
		const pointsToRemove = this.controlPoints.filter((cp) => cp.objectId === objectId)
		pointsToRemove.forEach((cp) => {
			this.canvas.remove(cp.circle)
		})
		this.controlPoints = this.controlPoints.filter((cp) => cp.objectId !== objectId)

		const edgeLinesToRemove: string[] = []
		this.edgeLines.forEach((line, id) => {
			if ((line as any).linkedObjectId === objectId) {
				this.canvas.remove(line)
				edgeLinesToRemove.push(id)
			}
		})
		edgeLinesToRemove.forEach((id) => this.edgeLines.delete(id))

		this.canvas.renderAll()
	}

	hideControlPoints(objectId: string): void {
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId)
		points.forEach((cp) => {
			cp.circle.set({ visible: false })
		})

		this.edgeLines.forEach((line) => {
			if ((line as any).linkedObjectId === objectId) {
				line.set({ visible: false })
			}
		})

		this.canvas.renderAll()
	}

	showControlPoints(objectId: string): void {
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId)
		points.forEach((cp) => {
			cp.circle.set({ visible: true })
		})

		this.edgeLines.forEach((line) => {
			if ((line as any).linkedObjectId === objectId) {
				line.set({ visible: true })
			}
		})

		this.canvas.renderAll()
	}

	updateControlPoints(objectId: string, obj: fabric.Object): void {
		const textbox = obj as fabric.Textbox
		const controlPoints = this.getControlPointsForObject(objectId)
		if (controlPoints.length === 0) return

		const width = textbox.width || 0
		const height = textbox.height || 0
		const left = textbox.left || 0
		const top = textbox.top || 0
		const angle = textbox.angle || 0
		const angleRad = (angle * Math.PI) / 180

		// Add padding to account for text overflow
		const padding = 3

		// Calculate the four corners by rotating around top-left origin
		const cos = Math.cos(angleRad)
		const sin = Math.sin(angleRad)

		// Define corners in local space (before rotation) with padding
		const localCorners = [
			{ x: -padding, y: -padding }, // Top-left
			{ x: width + padding, y: -padding }, // Top-right
			{ x: width + padding, y: height + padding }, // Bottom-right
			{ x: -padding, y: height + padding } // Bottom-left
		]

		// Rotate each corner around the origin (top-left) and add the textbox position
		const corners = localCorners.map((corner) => ({
			x: left + corner.x * cos - corner.y * sin,
			y: top + corner.x * sin + corner.y * cos
		}))

		// Update corner control points
		controlPoints.forEach((cp) => {
			if (cp.pointIndex >= 0 && cp.pointIndex <= 3) {
				const corner = corners[cp.pointIndex]
				cp.circle.set({ left: corner.x, top: corner.y })
				cp.circle.setCoords()
			}
		})

		// Update edge midpoints
		const edgeMidpoints = [
			{ x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2, pointIndex: 8 },
			{ x: (corners[1].x + corners[2].x) / 2, y: (corners[1].y + corners[2].y) / 2, pointIndex: 9 },
			{
				x: (corners[2].x + corners[3].x) / 2,
				y: (corners[2].y + corners[3].y) / 2,
				pointIndex: 10
			},
			{ x: (corners[3].x + corners[0].x) / 2, y: (corners[3].y + corners[0].y) / 2, pointIndex: 11 }
		]

		edgeMidpoints.forEach((midpoint) => {
			const cp = controlPoints.find((cp) => cp.pointIndex === midpoint.pointIndex)
			if (cp) {
				cp.circle.set({ left: midpoint.x, top: midpoint.y })
				cp.circle.setCoords()
			}
		})

		// Update rotation handle
		const topMidpoint = edgeMidpoints[0]
		const rotationCp = controlPoints.find((cp) => cp.pointIndex === 12)
		if (rotationCp) {
			rotationCp.circle.set({ left: topMidpoint.x, top: topMidpoint.y - 30 })
			rotationCp.circle.setCoords()
		}

		// Update edge lines
		const edges = [
			{ start: 0, end: 1 },
			{ start: 1, end: 2 },
			{ start: 2, end: 3 },
			{ start: 3, end: 0 }
		]

		edges.forEach(({ start, end }, index) => {
			const edgeId = `${objectId}-edge-${index}`
			const edgeLine = this.edgeLines.get(edgeId)
			if (edgeLine) {
				edgeLine.set({
					x1: corners[start].x,
					y1: corners[start].y,
					x2: corners[end].x,
					y2: corners[end].y
				})
				edgeLine.setCoords()
			}
		})

		this.canvas.renderAll()
	}

	updateObjectFromControlPoint(controlPointId: string, newX: number, newY: number): void {
		const controlPoint = this.controlPoints.find((cp) => cp.id === controlPointId)
		if (!controlPoint) return

		controlPoint.circle.set({ left: newX, top: newY })
		controlPoint.circle.setCoords()

		if (controlPoint.pointIndex >= 0 && controlPoint.pointIndex <= 3) {
			this.updateFromCorner(controlPoint, newX, newY)
		} else if (controlPoint.pointIndex >= 8 && controlPoint.pointIndex <= 11) {
			this.updateFromEdge(controlPoint, newX, newY)
		} else if (controlPoint.pointIndex === 12) {
			this.updateFromRotation(controlPoint, newX, newY)
		}
	}

	private updateFromCorner(controlPoint: ControlPoint, newX: number, newY: number): void {
		const textbox = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'textbox') as
			| fabric.Textbox
			| undefined
		if (!textbox) return

		// Maintain aspect ratio like images - diagonal movement only
		const width = textbox.width || 0
		const height = textbox.height || 0
		const aspectRatio = width / height
		const oppositeIndex = (controlPoint.pointIndex + 2) % 4
		const corners = [
			{ x: textbox.left || 0, y: textbox.top || 0 },
			{ x: (textbox.left || 0) + width, y: textbox.top || 0 },
			{ x: (textbox.left || 0) + width, y: (textbox.top || 0) + height },
			{ x: textbox.left || 0, y: (textbox.top || 0) + height }
		]

		const anchorCorner = corners[oppositeIndex]
		const dx = newX - anchorCorner.x
		const dy = newY - anchorCorner.y

		// Determine which dimension constrains us (to maintain aspect ratio)
		let finalWidth, finalHeight
		const projectedWidthAbs = Math.abs(dx)
		const projectedHeightAbs = Math.abs(dy)

		if (projectedWidthAbs / aspectRatio > projectedHeightAbs) {
			// Height is the constraint
			finalHeight = projectedHeightAbs
			finalWidth = finalHeight * aspectRatio
		} else {
			// Width is the constraint
			finalWidth = projectedWidthAbs
			finalHeight = finalWidth / aspectRatio
		}

		// Ensure minimum size
		finalWidth = Math.max(50, finalWidth)
		finalHeight = Math.max(20, finalHeight)

		// Calculate scale factor for font size
		const scaleFactor = Math.sqrt((finalWidth * finalHeight) / (width * height))
		const newFontSize = Math.max(8, (textbox.fontSize || 16) * scaleFactor)

		// Determine new position based on which quadrant we're dragging from
		const newLeft = dx >= 0 ? anchorCorner.x : anchorCorner.x - finalWidth
		const newTop = dy >= 0 ? anchorCorner.y : anchorCorner.y - finalHeight

		textbox.set({
			left: newLeft,
			top: newTop,
			width: finalWidth,
			fontSize: newFontSize
		})
		textbox.initDimensions()
		textbox.setCoords()

		this.updateControlPoints(controlPoint.objectId, textbox)
		this.canvas.renderAll()
	}

	private updateFromEdge(controlPoint: ControlPoint, newX: number, newY: number): void {
		const textbox = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'textbox') as
			| fabric.Textbox
			| undefined
		if (!textbox) return

		const width = textbox.width || 0
		const height = textbox.height || 0
		const left = textbox.left || 0
		const top = textbox.top || 0

		// Left/right edges: just reflow text
		if (controlPoint.pointIndex === 9) {
			// Right edge - just change width
			textbox.set({ width: Math.max(50, newX - left) })
			textbox.initDimensions()
			textbox.setCoords()
			this.updateControlPoints(controlPoint.objectId, textbox)
			this.canvas.renderAll()
		} else if (controlPoint.pointIndex === 11) {
			// Left edge - just change width
			const newWidth = Math.max(50, left + width - newX)
			textbox.set({ left: newX, width: newWidth })
			textbox.initDimensions()
			textbox.setCoords()
			this.updateControlPoints(controlPoint.objectId, textbox)
			this.canvas.renderAll()
		} else if (controlPoint.pointIndex === 8) {
			// Top center - moves top up/down, scales width proportionally
			// Keep bottom and right edges fixed
			const aspectRatio = width / height
			const bottomEdge = top + height
			const rightEdge = left + width
			const newHeight = Math.abs(bottomEdge - newY)
			const newWidth = newHeight * aspectRatio

			const finalWidth = Math.max(50, newWidth)
			const finalHeight = Math.max(20, newHeight)

			const scaleFactor = Math.sqrt((finalWidth * finalHeight) / (width * height))
			const newFontSize = Math.max(8, (textbox.fontSize || 16) * scaleFactor)

			// Right edge stays fixed, left edge moves
			const newLeft = rightEdge - finalWidth
			const newTop = newY

			textbox.set({
				left: newLeft,
				top: newTop,
				width: finalWidth,
				fontSize: newFontSize
			})
			textbox.initDimensions()
			textbox.setCoords()
			this.updateControlPoints(controlPoint.objectId, textbox)
			this.canvas.renderAll()
		} else if (controlPoint.pointIndex === 10) {
			// Bottom center - moves bottom up/down, scales width proportionally
			// Keep top and left edges fixed
			const aspectRatio = width / height
			const topEdge = top
			const leftEdge = left
			const newHeight = Math.abs(newY - topEdge)
			const newWidth = newHeight * aspectRatio

			const finalWidth = Math.max(50, newWidth)
			const finalHeight = Math.max(20, newHeight)

			const scaleFactor = Math.sqrt((finalWidth * finalHeight) / (width * height))
			const newFontSize = Math.max(8, (textbox.fontSize || 16) * scaleFactor)

			// Top and left edges stay fixed
			textbox.set({
				left: leftEdge,
				top: topEdge,
				width: finalWidth,
				fontSize: newFontSize
			})
			textbox.initDimensions()
			textbox.setCoords()
			this.updateControlPoints(controlPoint.objectId, textbox)
			this.canvas.renderAll()
		}
	}

	private updateFromRotation(controlPoint: ControlPoint, newX: number, newY: number): void {
		const textbox = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'textbox') as
			| fabric.Textbox
			| undefined
		if (!textbox) return

		// Get the center point for rotation
		const width = textbox.width || 0
		const height = textbox.height || 0
		const left = textbox.left || 0
		const top = textbox.top || 0
		const centerX = left + width / 2
		const centerY = top + height / 2

		// Calculate angle from center to rotation handle
		const dx = newX - centerX
		const dy = newY - centerY
		const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90

		// Set angle and update coords
		textbox.set({ angle: angleDeg })
		textbox.setCoords()
		this.updateControlPoints(controlPoint.objectId, textbox)
		this.canvas.renderAll()
	}
}

/**
 * Control point handler for images
 */
export class ImageControlPoints extends BoundingBoxControlPoints {
	addControlPoints(objectId: string, obj: fabric.Object, visible: boolean = true): void {
		const image = obj as fabric.Image
		const width = image.width || 0
		const height = image.height || 0
		const scaleX = image.scaleX || 1
		const scaleY = image.scaleY || 1

		// Get transformation matrix
		const matrix = image.calcTransformMatrix()

		// Define corners in local coordinates (unscaled, relative to origin)
		// Images use center origin, so corners are at ±width/2, ±height/2
		const corners = [
			{ x: -width / 2, y: -height / 2 }, // Top-left
			{ x: width / 2, y: -height / 2 }, // Top-right
			{ x: width / 2, y: height / 2 }, // Bottom-right
			{ x: -width / 2, y: height / 2 } // Bottom-left
		]

		// Transform to absolute coordinates (this applies scale, rotation, and translation)
		const absoluteCorners = corners.map((corner) =>
			fabric.util.transformPoint(new fabric.Point(corner.x, corner.y), matrix)
		)

		// Create corner control points (indices 0-3)
		absoluteCorners.forEach((corner, index) => {
			const controlPointId = `${objectId}-cp-${index}`
			const circle = this.createControlPointCircle(
				corner.x,
				corner.y,
				controlPointId,
				objectId,
				index,
				true
			)
			circle.set({ visible })
			this.canvas.add(circle)
			this.controlPoints.push({ id: controlPointId, circle, objectId, pointIndex: index })
		})

		// Create edge midpoint control points (indices 8-11)
		const edgeMidpoints = [
			{
				x: (absoluteCorners[0].x + absoluteCorners[1].x) / 2,
				y: (absoluteCorners[0].y + absoluteCorners[1].y) / 2,
				pointIndex: 8
			},
			{
				x: (absoluteCorners[1].x + absoluteCorners[2].x) / 2,
				y: (absoluteCorners[1].y + absoluteCorners[2].y) / 2,
				pointIndex: 9
			},
			{
				x: (absoluteCorners[2].x + absoluteCorners[3].x) / 2,
				y: (absoluteCorners[2].y + absoluteCorners[3].y) / 2,
				pointIndex: 10
			},
			{
				x: (absoluteCorners[3].x + absoluteCorners[0].x) / 2,
				y: (absoluteCorners[3].y + absoluteCorners[0].y) / 2,
				pointIndex: 11
			}
		]

		edgeMidpoints.forEach((midpoint) => {
			const controlPointId = `${objectId}-cp-${midpoint.pointIndex}`
			const circle = this.createControlPointCircle(
				midpoint.x,
				midpoint.y,
				controlPointId,
				objectId,
				midpoint.pointIndex,
				true
			)
			circle.set({ visible })
			this.canvas.add(circle)
			this.controlPoints.push({
				id: controlPointId,
				circle,
				objectId,
				pointIndex: midpoint.pointIndex
			})
		})

		// Create rotation handle (index 12) - floating, zoom-adjusted distance above the top edge in rotated space
		const topMidpoint = edgeMidpoints[0]
		const center = image.getCenterPoint()
		const vectorX = topMidpoint.x - center.x
		const vectorY = topMidpoint.y - center.y
		const vectorLength = Math.sqrt(vectorX * vectorX + vectorY * vectorY)
		const normalizedX = vectorX / vectorLength
		const normalizedY = vectorY / vectorLength
		const rotationDistance = this.getRotationHandleDistance()
		const rotationX = center.x + normalizedX * (vectorLength + rotationDistance)
		const rotationY = center.y + normalizedY * (vectorLength + rotationDistance)
		const rotationControlPointId = `${objectId}-cp-12`
		const rotationCircle = this.createControlPointCircle(
			rotationX,
			rotationY,
			rotationControlPointId,
			objectId,
			12,
			true
		)
		rotationCircle.set({ visible, hoverCursor: 'crosshair' })
		this.canvas.add(rotationCircle)
		this.controlPoints.push({
			id: rotationControlPointId,
			circle: rotationCircle,
			objectId,
			pointIndex: 12
		})

		// Create border lines
		const zoom = this.canvas.getZoom()
		const scale = 1 / zoom

		const edges = [
			{ start: 0, end: 1 },
			{ start: 1, end: 2 },
			{ start: 2, end: 3 },
			{ start: 3, end: 0 }
		]

		edges.forEach(({ start, end }, index) => {
			const edgeId = `${objectId}-edge-${index}`
			const edgeLine = new fabric.Line(
				[
					absoluteCorners[start].x,
					absoluteCorners[start].y,
					absoluteCorners[end].x,
					absoluteCorners[end].y
				],
				{
					stroke: 'oklch(0.8 0.05 39.0427)',
					strokeWidth: 1.5 * scale,
					selectable: false,
					evented: false,
					excludeFromExport: true,
					visible
				}
			)
			;(edgeLine as any).id = edgeId
			;(edgeLine as any).linkedObjectId = objectId
			this.canvas.add(edgeLine)
			this.edgeLines.set(edgeId, edgeLine)
		})

		this.bringControlPointsToFront()
		this.canvas.renderAll()
	}

	removeControlPoints(objectId: string): void {
		const pointsToRemove = this.controlPoints.filter((cp) => cp.objectId === objectId)
		pointsToRemove.forEach((cp) => this.canvas.remove(cp.circle))
		this.controlPoints = this.controlPoints.filter((cp) => cp.objectId !== objectId)

		const edgeLinesToRemove: string[] = []
		this.edgeLines.forEach((line, id) => {
			if ((line as any).linkedObjectId === objectId) {
				this.canvas.remove(line)
				edgeLinesToRemove.push(id)
			}
		})
		edgeLinesToRemove.forEach((id) => this.edgeLines.delete(id))
		this.canvas.renderAll()
	}

	hideControlPoints(objectId: string): void {
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId)
		points.forEach((cp) => cp.circle.set({ visible: false }))
		this.edgeLines.forEach((line) => {
			if ((line as any).linkedObjectId === objectId) line.set({ visible: false })
		})
		this.canvas.renderAll()
	}

	showControlPoints(objectId: string): void {
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId)
		points.forEach((cp) => cp.circle.set({ visible: true }))
		this.edgeLines.forEach((line) => {
			if ((line as any).linkedObjectId === objectId) line.set({ visible: true })
		})
		this.canvas.renderAll()
	}

	updateControlPoints(objectId: string, obj: fabric.Object): void {
		const image = obj as fabric.Image
		const controlPoints = this.getControlPointsForObject(objectId)
		if (controlPoints.length === 0) return

		const width = image.width || 0
		const height = image.height || 0
		const matrix = image.calcTransformMatrix()

		// Define corners in local coordinates (unscaled, relative to center origin)
		const corners = [
			{ x: -width / 2, y: -height / 2 },
			{ x: width / 2, y: -height / 2 },
			{ x: width / 2, y: height / 2 },
			{ x: -width / 2, y: height / 2 }
		]

		// Transform to absolute coordinates (matrix handles scale, rotation, translation)
		const absoluteCorners = corners.map((corner) =>
			fabric.util.transformPoint(new fabric.Point(corner.x, corner.y), matrix)
		)

		// Update corners
		controlPoints.forEach((cp) => {
			if (cp.pointIndex >= 0 && cp.pointIndex <= 3) {
				cp.circle.set({
					left: absoluteCorners[cp.pointIndex].x,
					top: absoluteCorners[cp.pointIndex].y
				})
				cp.circle.setCoords()
			}
		})

		// Update edge midpoints
		const edgeMidpoints = [
			{
				x: (absoluteCorners[0].x + absoluteCorners[1].x) / 2,
				y: (absoluteCorners[0].y + absoluteCorners[1].y) / 2,
				pointIndex: 8
			},
			{
				x: (absoluteCorners[1].x + absoluteCorners[2].x) / 2,
				y: (absoluteCorners[1].y + absoluteCorners[2].y) / 2,
				pointIndex: 9
			},
			{
				x: (absoluteCorners[2].x + absoluteCorners[3].x) / 2,
				y: (absoluteCorners[2].y + absoluteCorners[3].y) / 2,
				pointIndex: 10
			},
			{
				x: (absoluteCorners[3].x + absoluteCorners[0].x) / 2,
				y: (absoluteCorners[3].y + absoluteCorners[0].y) / 2,
				pointIndex: 11
			}
		]

		edgeMidpoints.forEach((midpoint) => {
			const cp = controlPoints.find((cp) => cp.pointIndex === midpoint.pointIndex)
			if (cp) {
				cp.circle.set({ left: midpoint.x, top: midpoint.y })
				cp.circle.setCoords()
			}
		})

		// Update rotation handle
		const topMidpoint = edgeMidpoints[0]
		const rotationCp = controlPoints.find((cp) => cp.pointIndex === 12)
		if (rotationCp) {
			const center = image.getCenterPoint()
			const vectorX = topMidpoint.x - center.x
			const vectorY = topMidpoint.y - center.y
			const vectorLength = Math.sqrt(vectorX * vectorX + vectorY * vectorY)
			const normalizedX = vectorX / vectorLength
			const normalizedY = vectorY / vectorLength
			rotationCp.circle.set({
				left: center.x + normalizedX * (vectorLength + 30),
				top: center.y + normalizedY * (vectorLength + 30)
			})
			rotationCp.circle.setCoords()
		}

		// Update edge lines
		const edges = [
			{ start: 0, end: 1 },
			{ start: 1, end: 2 },
			{ start: 2, end: 3 },
			{ start: 3, end: 0 }
		]

		edges.forEach(({ start, end }, index) => {
			const edgeId = `${objectId}-edge-${index}`
			const edgeLine = this.edgeLines.get(edgeId)
			if (edgeLine) {
				edgeLine.set({
					x1: absoluteCorners[start].x,
					y1: absoluteCorners[start].y,
					x2: absoluteCorners[end].x,
					y2: absoluteCorners[end].y
				})
				edgeLine.setCoords()
			}
		})

		this.canvas.renderAll()
	}

	updateObjectFromControlPoint(controlPointId: string, newX: number, newY: number): void {
		const controlPoint = this.controlPoints.find((cp) => cp.id === controlPointId)
		if (!controlPoint) return

		controlPoint.circle.set({ left: newX, top: newY })
		controlPoint.circle.setCoords()

		if (controlPoint.pointIndex >= 0 && controlPoint.pointIndex <= 3) {
			this.updateFromCorner(controlPoint, newX, newY)
		} else if (controlPoint.pointIndex >= 8 && controlPoint.pointIndex <= 11) {
			this.updateFromEdge(controlPoint, newX, newY)
		} else if (controlPoint.pointIndex === 12) {
			this.updateFromRotation(controlPoint, newX, newY)
		}
	}

	private updateFromCorner(controlPoint: ControlPoint, newX: number, newY: number): void {
		const image = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'image') as
			| fabric.Image
			| undefined
		if (!image) return

		// Maintain aspect ratio for corners
		const originalWidth = image.width || 0
		const originalHeight = image.height || 0
		const aspectRatio = originalWidth / originalHeight
		const angle = image.angle || 0
		const angleRad = (angle * Math.PI) / 180

		const oppositeIndex = (controlPoint.pointIndex + 2) % 4
		const anchorCornerCP = this.getControlPointsForObject(controlPoint.objectId).find(
			(cp) => cp.pointIndex === oppositeIndex
		)

		// Get the anchor corner position from the control point
		const anchorPosition = anchorCornerCP
			? anchorCornerCP.circle.getCenterPoint()
			: image.getCenterPoint()

		// Calculate the vector from anchor to mouse
		const dx = newX - anchorPosition.x
		const dy = newY - anchorPosition.y

		// Project this vector onto the rotated width and height axes
		// Width axis (rotated horizontal)
		const widthAxisX = Math.cos(angleRad)
		const widthAxisY = Math.sin(angleRad)
		const widthProjection = dx * widthAxisX + dy * widthAxisY

		// Height axis (rotated vertical)
		const heightAxisX = -Math.sin(angleRad)
		const heightAxisY = Math.cos(angleRad)
		const heightProjection = dx * heightAxisX + dy * heightAxisY

		// Determine which dimension constrains us (to maintain aspect ratio)
		// Use the dimension that would make the smaller scaled image
		let finalWidth, finalHeight
		const projectedWidthAbs = Math.abs(widthProjection)
		const projectedHeightAbs = Math.abs(heightProjection)

		if (projectedWidthAbs / aspectRatio > projectedHeightAbs) {
			// Height is the constraint
			finalHeight = projectedHeightAbs
			finalWidth = finalHeight * aspectRatio
		} else {
			// Width is the constraint
			finalWidth = projectedWidthAbs
			finalHeight = finalWidth / aspectRatio
		}

		// Ensure minimum size
		const minSize = 20
		finalWidth = Math.max(minSize, finalWidth)
		finalHeight = Math.max(minSize / aspectRatio, finalHeight)

		// Determine the sign of the projections to know which direction we're dragging
		const widthSign = widthProjection >= 0 ? 1 : -1
		const heightSign = heightProjection >= 0 ? 1 : -1

		// Calculate new center - move along the rotated axes
		const newCenterX =
			anchorPosition.x +
			(widthSign * finalWidth * widthAxisX) / 2 +
			(heightSign * finalHeight * heightAxisX) / 2
		const newCenterY =
			anchorPosition.y +
			(widthSign * finalWidth * widthAxisY) / 2 +
			(heightSign * finalHeight * heightAxisY) / 2

		// Calculate new scale
		const newScaleX = finalWidth / originalWidth
		const newScaleY = finalHeight / originalHeight

		image.set({
			left: newCenterX,
			top: newCenterY,
			scaleX: newScaleX,
			scaleY: newScaleY
		})
		image.setCoords()

		this.updateControlPoints(controlPoint.objectId, image)
		this.canvas.renderAll()
	}

	private updateFromEdge(controlPoint: ControlPoint, newX: number, newY: number): void {
		const image = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'image') as
			| fabric.Image
			| undefined
		if (!image) return

		const originalWidth = image.width || 0
		const originalHeight = image.height || 0
		const angle = image.angle || 0
		const center = image.getCenterPoint()
		const angleRad = (angle * Math.PI) / 180

		const newPoint = new fabric.Point(newX, newY)

		// Determine which dimension to change and how to move the center
		let newWidth = (image.width || 0) * (image.scaleX || 1)
		let newHeight = (image.height || 0) * (image.scaleY || 1)
		let newCenterX = center.x
		let newCenterY = center.y

		switch (controlPoint.pointIndex) {
			case 8: // Top edge
			case 10: {
				// Bottom edge
				// Direction perpendicular to the edge (pointing inward/outward)
				const perpX = -Math.sin(angleRad)
				const perpY = Math.cos(angleRad)
				// For top edge (8), perpendicular points up (negative in local coords)
				// For bottom edge (10), perpendicular points down (positive in local coords)
				const edgeSign = controlPoint.pointIndex === 8 ? -1 : 1
				// Calculate where the opposite edge currently is
				const oppositeEdgeOffset = (newHeight / 2) * -edgeSign
				const oppositeEdgeX = center.x + perpX * oppositeEdgeOffset
				const oppositeEdgeY = center.y + perpY * oppositeEdgeOffset
				// Distance from new mouse position to opposite edge (in perpendicular direction)
				const distanceFromOpposite =
					(newPoint.x - oppositeEdgeX) * perpX + (newPoint.y - oppositeEdgeY) * perpY
				// New height is this distance
				newHeight = Math.max(20, Math.abs(distanceFromOpposite))
				// New center is halfway between mouse and opposite edge
				newCenterX = oppositeEdgeX + (perpX * distanceFromOpposite) / 2
				newCenterY = oppositeEdgeY + (perpY * distanceFromOpposite) / 2
				break
			}
			case 9: // Right edge
			case 11: {
				// Left edge
				// Direction perpendicular to the edge (pointing inward/outward)
				const perpX = Math.cos(angleRad)
				const perpY = Math.sin(angleRad)
				// For left edge (11), perpendicular points left (negative in local coords)
				// For right edge (9), perpendicular points right (positive in local coords)
				const edgeSign = controlPoint.pointIndex === 11 ? -1 : 1
				// Calculate where the opposite edge currently is
				const oppositeEdgeOffset = (newWidth / 2) * -edgeSign
				const oppositeEdgeX = center.x + perpX * oppositeEdgeOffset
				const oppositeEdgeY = center.y + perpY * oppositeEdgeOffset
				// Distance from new mouse position to opposite edge (in perpendicular direction)
				const distanceFromOpposite =
					(newPoint.x - oppositeEdgeX) * perpX + (newPoint.y - oppositeEdgeY) * perpY
				// New width is this distance
				newWidth = Math.max(20, Math.abs(distanceFromOpposite))
				// New center is halfway between mouse and opposite edge
				newCenterX = oppositeEdgeX + (perpX * distanceFromOpposite) / 2
				newCenterY = oppositeEdgeY + (perpY * distanceFromOpposite) / 2
				break
			}
		}

		// Calculate new scale
		const newScaleX = newWidth / originalWidth
		const newScaleY = newHeight / originalHeight

		image.set({
			left: newCenterX,
			top: newCenterY,
			scaleX: newScaleX,
			scaleY: newScaleY
		})
		image.setCoords()

		this.updateControlPoints(controlPoint.objectId, image)
		this.canvas.renderAll()
	}

	private updateFromRotation(controlPoint: ControlPoint, newX: number, newY: number): void {
		const image = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'image') as
			| fabric.Image
			| undefined
		if (!image) return

		const center = image.getCenterPoint()
		const dx = newX - center.x
		const dy = newY - center.y
		const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90

		image.set({ angle: angleDeg })
		image.setCoords()
		this.updateControlPoints(controlPoint.objectId, image)
		this.canvas.renderAll()
	}
}

/**
 * Control point handler for paths (freehand drawings)
 */
export class PathControlPoints extends BoundingBoxControlPoints {
	addControlPoints(objectId: string, obj: fabric.Object, visible: boolean = true): void {
		const path = obj as fabric.Path
		const bounds = path.getBoundingRect()

		// Use bounding rect corners
		const corners = [
			{ x: bounds.left, y: bounds.top },
			{ x: bounds.left + bounds.width, y: bounds.top },
			{ x: bounds.left + bounds.width, y: bounds.top + bounds.height },
			{ x: bounds.left, y: bounds.top + bounds.height }
		]

		// Create corner control points
		corners.forEach((corner, index) => {
			const controlPointId = `${objectId}-cp-${index}`
			const circle = this.createControlPointCircle(
				corner.x,
				corner.y,
				controlPointId,
				objectId,
				index,
				true
			)
			circle.set({ visible })
			this.canvas.add(circle)
			this.controlPoints.push({ id: controlPointId, circle, objectId, pointIndex: index })
		})

		// Create edge midpoints
		const edgeMidpoints = [
			{ x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2, pointIndex: 8 },
			{ x: (corners[1].x + corners[2].x) / 2, y: (corners[1].y + corners[2].y) / 2, pointIndex: 9 },
			{
				x: (corners[2].x + corners[3].x) / 2,
				y: (corners[2].y + corners[3].y) / 2,
				pointIndex: 10
			},
			{ x: (corners[3].x + corners[0].x) / 2, y: (corners[3].y + corners[0].y) / 2, pointIndex: 11 }
		]

		edgeMidpoints.forEach((midpoint) => {
			const controlPointId = `${objectId}-cp-${midpoint.pointIndex}`
			const circle = this.createControlPointCircle(
				midpoint.x,
				midpoint.y,
				controlPointId,
				objectId,
				midpoint.pointIndex,
				true
			)
			circle.set({ visible })
			this.canvas.add(circle)
			this.controlPoints.push({
				id: controlPointId,
				circle,
				objectId,
				pointIndex: midpoint.pointIndex
			})
		})

		// Create rotation handle with zoom-adjusted distance
		const topMidpoint = edgeMidpoints[0]
		const center = path.getCenterPoint()
		const vectorX = topMidpoint.x - center.x
		const vectorY = topMidpoint.y - center.y
		const vectorLength = Math.sqrt(vectorX * vectorX + vectorY * vectorY)
		const normalizedX = vectorX / vectorLength
		const normalizedY = vectorY / vectorLength
		const rotationDistance = this.getRotationHandleDistance()
		const rotationX = center.x + normalizedX * (vectorLength + rotationDistance)
		const rotationY = center.y + normalizedY * (vectorLength + rotationDistance)
		const rotationControlPointId = `${objectId}-cp-12`
		const rotationCircle = this.createControlPointCircle(
			rotationX,
			rotationY,
			rotationControlPointId,
			objectId,
			12,
			true
		)
		rotationCircle.set({ visible, hoverCursor: 'crosshair' })
		this.canvas.add(rotationCircle)
		this.controlPoints.push({
			id: rotationControlPointId,
			circle: rotationCircle,
			objectId,
			pointIndex: 12
		})

		// Create border lines
		const zoom = this.canvas.getZoom()
		const scale = 1 / zoom

		const edges = [
			{ start: 0, end: 1 },
			{ start: 1, end: 2 },
			{ start: 2, end: 3 },
			{ start: 3, end: 0 }
		]

		edges.forEach(({ start, end }, index) => {
			const edgeId = `${objectId}-edge-${index}`
			const edgeLine = new fabric.Line(
				[corners[start].x, corners[start].y, corners[end].x, corners[end].y],
				{
					stroke: 'oklch(0.8 0.05 39.0427)',
					strokeWidth: 1.5 * scale,
					selectable: false,
					evented: false,
					excludeFromExport: true,
					visible
				}
			)
			;(edgeLine as any).id = edgeId
			;(edgeLine as any).linkedObjectId = objectId
			this.canvas.add(edgeLine)
			this.edgeLines.set(edgeId, edgeLine)
		})

		this.bringControlPointsToFront()
		this.canvas.renderAll()
	}

	removeControlPoints(objectId: string): void {
		const pointsToRemove = this.controlPoints.filter((cp) => cp.objectId === objectId)
		pointsToRemove.forEach((cp) => this.canvas.remove(cp.circle))
		this.controlPoints = this.controlPoints.filter((cp) => cp.objectId !== objectId)

		const edgeLinesToRemove: string[] = []
		this.edgeLines.forEach((line, id) => {
			if ((line as any).linkedObjectId === objectId) {
				this.canvas.remove(line)
				edgeLinesToRemove.push(id)
			}
		})
		edgeLinesToRemove.forEach((id) => this.edgeLines.delete(id))
		this.canvas.renderAll()
	}

	hideControlPoints(objectId: string): void {
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId)
		points.forEach((cp) => cp.circle.set({ visible: false }))
		this.edgeLines.forEach((line) => {
			if ((line as any).linkedObjectId === objectId) line.set({ visible: false })
		})
		this.canvas.renderAll()
	}

	showControlPoints(objectId: string): void {
		const points = this.controlPoints.filter((cp) => cp.objectId === objectId)
		points.forEach((cp) => cp.circle.set({ visible: true }))
		this.edgeLines.forEach((line) => {
			if ((line as any).linkedObjectId === objectId) line.set({ visible: true })
		})
		this.canvas.renderAll()
	}

	updateControlPoints(objectId: string, obj: fabric.Object): void {
		const path = obj as fabric.Path
		const controlPoints = this.getControlPointsForObject(objectId)
		if (controlPoints.length === 0) return

		const bounds = path.getBoundingRect()
		const corners = [
			{ x: bounds.left, y: bounds.top },
			{ x: bounds.left + bounds.width, y: bounds.top },
			{ x: bounds.left + bounds.width, y: bounds.top + bounds.height },
			{ x: bounds.left, y: bounds.top + bounds.height }
		]

		// Update corners
		controlPoints.forEach((cp) => {
			if (cp.pointIndex >= 0 && cp.pointIndex <= 3) {
				cp.circle.set({ left: corners[cp.pointIndex].x, top: corners[cp.pointIndex].y })
				cp.circle.setCoords()
			}
		})

		// Update edge midpoints
		const edgeMidpoints = [
			{ x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2, pointIndex: 8 },
			{ x: (corners[1].x + corners[2].x) / 2, y: (corners[1].y + corners[2].y) / 2, pointIndex: 9 },
			{
				x: (corners[2].x + corners[3].x) / 2,
				y: (corners[2].y + corners[3].y) / 2,
				pointIndex: 10
			},
			{ x: (corners[3].x + corners[0].x) / 2, y: (corners[3].y + corners[0].y) / 2, pointIndex: 11 }
		]

		edgeMidpoints.forEach((midpoint) => {
			const cp = controlPoints.find((cp) => cp.pointIndex === midpoint.pointIndex)
			if (cp) {
				cp.circle.set({ left: midpoint.x, top: midpoint.y })
				cp.circle.setCoords()
			}
		})

		// Update rotation handle with zoom-adjusted distance
		const topMidpoint = edgeMidpoints[0]
		const rotationCp = controlPoints.find((cp) => cp.pointIndex === 12)
		if (rotationCp) {
			const center = path.getCenterPoint()
			const vectorX = topMidpoint.x - center.x
			const vectorY = topMidpoint.y - center.y
			const vectorLength = Math.sqrt(vectorX * vectorX + vectorY * vectorY)
			const normalizedX = vectorX / vectorLength
			const normalizedY = vectorY / vectorLength
			const rotationDistance = this.getRotationHandleDistance()
			rotationCp.circle.set({
				left: center.x + normalizedX * (vectorLength + rotationDistance),
				top: center.y + normalizedY * (vectorLength + rotationDistance)
			})
			rotationCp.circle.setCoords()
		}

		// Update edge lines
		const edges = [
			{ start: 0, end: 1 },
			{ start: 1, end: 2 },
			{ start: 2, end: 3 },
			{ start: 3, end: 0 }
		]

		edges.forEach(({ start, end }, index) => {
			const edgeId = `${objectId}-edge-${index}`
			const edgeLine = this.edgeLines.get(edgeId)
			if (edgeLine) {
				edgeLine.set({
					x1: corners[start].x,
					y1: corners[start].y,
					x2: corners[end].x,
					y2: corners[end].y
				})
				edgeLine.setCoords()
			}
		})

		this.canvas.renderAll()
	}

	updateObjectFromControlPoint(controlPointId: string, newX: number, newY: number): void {
		const controlPoint = this.controlPoints.find((cp) => cp.id === controlPointId)
		if (!controlPoint) return

		controlPoint.circle.set({ left: newX, top: newY })
		controlPoint.circle.setCoords()

		if (controlPoint.pointIndex >= 0 && controlPoint.pointIndex <= 3) {
			this.updateFromCorner(controlPoint, newX, newY)
		} else if (controlPoint.pointIndex >= 8 && controlPoint.pointIndex <= 11) {
			this.updateFromEdge(controlPoint, newX, newY)
		} else if (controlPoint.pointIndex === 12) {
			this.updateFromRotation(controlPoint, newX, newY)
		}
	}

	private updateFromCorner(controlPoint: ControlPoint, newX: number, newY: number): void {
		const path = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'path') as
			| fabric.Path
			| undefined
		if (!path) return

		// Scale path around opposite corner
		const bounds = path.getBoundingRect()
		const oppositeIndex = (controlPoint.pointIndex + 2) % 4
		const corners = [
			{ x: bounds.left, y: bounds.top },
			{ x: bounds.left + bounds.width, y: bounds.top },
			{ x: bounds.left + bounds.width, y: bounds.top + bounds.height },
			{ x: bounds.left, y: bounds.top + bounds.height }
		]

		const anchorCorner = corners[oppositeIndex]
		const newWidth = Math.abs(newX - anchorCorner.x)
		const newHeight = Math.abs(newY - anchorCorner.y)
		const scaleX = newWidth / bounds.width
		const scaleY = newHeight / bounds.height

		path.set({
			scaleX: (path.scaleX || 1) * scaleX,
			scaleY: (path.scaleY || 1) * scaleY,
			left: (newX + anchorCorner.x) / 2,
			top: (newY + anchorCorner.y) / 2
		})
		path.setCoords()

		this.updateControlPoints(controlPoint.objectId, path)
		this.canvas.renderAll()
	}

	private updateFromEdge(controlPoint: ControlPoint, newX: number, newY: number): void {
		const path = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'path') as
			| fabric.Path
			| undefined
		if (!path) return

		// Scale path from edge
		const bounds = path.getBoundingRect()
		const center = path.getCenterPoint()

		switch (controlPoint.pointIndex) {
			case 8: // Top
			case 10: {
				// Bottom
				const newHeight = Math.abs(newY - center.y) * 2
				const scaleY = newHeight / bounds.height
				path.set({ scaleY: (path.scaleY || 1) * scaleY })
				break
			}
			case 9: // Right
			case 11: {
				// Left
				const newWidth = Math.abs(newX - center.x) * 2
				const scaleX = newWidth / bounds.width
				path.set({ scaleX: (path.scaleX || 1) * scaleX })
				break
			}
		}

		path.setCoords()
		this.updateControlPoints(controlPoint.objectId, path)
		this.canvas.renderAll()
	}

	private updateFromRotation(controlPoint: ControlPoint, newX: number, newY: number): void {
		const path = this.canvas
			.getObjects()
			.find((obj: any) => obj.id === controlPoint.objectId && obj.type === 'path') as
			| fabric.Path
			| undefined
		if (!path) return

		const center = path.getCenterPoint()
		const dx = newX - center.x
		const dy = newY - center.y
		const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90

		path.set({ angle: angleDeg })
		path.setCoords()
		this.updateControlPoints(controlPoint.objectId, path)
		this.canvas.renderAll()
	}
}

/**
 * Crop overlay manager for image cropping
 * Creates a darkened overlay with crop handles
 */
export class CropOverlay {
	private canvas: fabric.Canvas
	private overlayGroup: fabric.Group | null = null
	private cropRect: fabric.Rect | null = null
	private handles: fabric.Circle[] = []
	private imageId: string | null = null
	private originalImage: fabric.Image | null = null
	private cropBounds: { left: number; top: number; width: number; height: number } | null = null
	private isDragging = false
	private dragStartPoint: { x: number; y: number } | null = null
	private activeHandle: number = -1 // -1 = none, 0-3 = corners, 4-7 = edges
	private onCropChange?: (bounds: {
		left: number
		top: number
		width: number
		height: number
	}) => void

	constructor(canvas: fabric.Canvas) {
		this.canvas = canvas
	}

	/**
	 * Start crop mode for an image
	 */
	startCrop(
		image: fabric.Image,
		onCropChange?: (bounds: { left: number; top: number; width: number; height: number }) => void
	): void {
		this.imageId = (image as any).id
		this.originalImage = image
		this.onCropChange = onCropChange

		// Get the image's current visible bounds
		const width = (image.width || 0) * (image.scaleX || 1)
		const height = (image.height || 0) * (image.scaleY || 1)
		const center = image.getCenterPoint()

		// Initialize crop bounds to full image
		this.cropBounds = {
			left: center.x - width / 2,
			top: center.y - height / 2,
			width: width,
			height: height
		}

		// Make image non-selectable during crop
		image.selectable = false
		image.evented = false

		this.createOverlay()
		this.canvas.renderAll()
	}

	/**
	 * Create the crop overlay and handles
	 */
	private createOverlay(): void {
		if (!this.cropBounds || !this.originalImage) return

		const zoom = this.canvas.getZoom()
		const scale = 1 / zoom

		// Create the crop rectangle (the visible area)
		this.cropRect = new fabric.Rect({
			left: this.cropBounds.left,
			top: this.cropBounds.top,
			width: this.cropBounds.width,
			height: this.cropBounds.height,
			fill: 'transparent',
			stroke: '#ffffff',
			strokeWidth: 2 * scale,
			strokeDashArray: [5 * scale, 5 * scale],
			selectable: false,
			evented: false,
			excludeFromExport: true
		})
		;(this.cropRect as any).isCropElement = true

		this.canvas.add(this.cropRect)

		// Create dark overlay outside crop area (4 rectangles)
		this.createDarkOverlay()

		// Create corner handles (0-3)
		const corners = [
			{ x: this.cropBounds.left, y: this.cropBounds.top }, // Top-left
			{ x: this.cropBounds.left + this.cropBounds.width, y: this.cropBounds.top }, // Top-right
			{
				x: this.cropBounds.left + this.cropBounds.width,
				y: this.cropBounds.top + this.cropBounds.height
			}, // Bottom-right
			{ x: this.cropBounds.left, y: this.cropBounds.top + this.cropBounds.height } // Bottom-left
		]

		corners.forEach((corner, index) => {
			const handle = new fabric.Circle({
				left: corner.x,
				top: corner.y,
				radius: 8 * scale,
				fill: '#ffffff',
				stroke: '#0066cc',
				strokeWidth: 2 * scale,
				originX: 'center',
				originY: 'center',
				selectable: true,
				hasControls: false,
				hasBorders: false,
				hoverCursor: this.getCornerCursor(index),
				excludeFromExport: true
			})
			;(handle as any).isCropHandle = true
			;(handle as any).handleIndex = index
			;(handle as any).isCropElement = true
			this.handles.push(handle)
			this.canvas.add(handle)
		})

		// Create edge midpoint handles (4-7)
		const edgeMidpoints = [
			{ x: this.cropBounds.left + this.cropBounds.width / 2, y: this.cropBounds.top }, // Top
			{
				x: this.cropBounds.left + this.cropBounds.width,
				y: this.cropBounds.top + this.cropBounds.height / 2
			}, // Right
			{
				x: this.cropBounds.left + this.cropBounds.width / 2,
				y: this.cropBounds.top + this.cropBounds.height
			}, // Bottom
			{ x: this.cropBounds.left, y: this.cropBounds.top + this.cropBounds.height / 2 } // Left
		]

		edgeMidpoints.forEach((point, index) => {
			const handle = new fabric.Circle({
				left: point.x,
				top: point.y,
				radius: 6 * scale,
				fill: '#ffffff',
				stroke: '#0066cc',
				strokeWidth: 2 * scale,
				originX: 'center',
				originY: 'center',
				selectable: true,
				hasControls: false,
				hasBorders: false,
				hoverCursor: this.getEdgeCursor(index),
				excludeFromExport: true
			})
			;(handle as any).isCropHandle = true
			;(handle as any).handleIndex = 4 + index
			;(handle as any).isCropElement = true
			this.handles.push(handle)
			this.canvas.add(handle)
		})

		// Bring all crop elements to front
		this.bringToFront()
	}

	private darkOverlays: Array<fabric.Rect | fabric.Path> = []

	/**
	 * Create dark overlay rectangles outside the crop area
	 */
	private createDarkOverlay(): void {
		if (!this.cropBounds || !this.originalImage) return

		// Remove existing overlays
		this.darkOverlays.forEach((overlay) => this.canvas.remove(overlay))
		this.darkOverlays = []

		// Get canvas dimensions
		const canvasWidth = this.canvas.getWidth()
		const canvasHeight = this.canvas.getHeight()

		// Get viewport transform to calculate visible area
		const vpt = this.canvas.viewportTransform || [1, 0, 0, 1, 0, 0]
		const zoom = this.canvas.getZoom()

		// Calculate visible area in canvas coordinates
		const visibleLeft = -vpt[4] / zoom
		const visibleTop = -vpt[5] / zoom
		const visibleWidth = canvasWidth / zoom
		const visibleHeight = canvasHeight / zoom

		// Expand visible area for safety
		const padding = 2000
		const left = visibleLeft - padding
		const top = visibleTop - padding
		const right = visibleLeft + visibleWidth + padding
		const bottom = visibleTop + visibleHeight + padding

		const cropLeft = this.cropBounds.left
		const cropTop = this.cropBounds.top
		const cropRight = this.cropBounds.left + this.cropBounds.width
		const cropBottom = this.cropBounds.top + this.cropBounds.height

		// Create a single large overlay with a hole cut out for the crop area
		// This avoids the visible horizontal/vertical lines at crop boundaries
		const overlayPath = `
M ${left} ${top}
L ${right} ${top}
L ${right} ${bottom}
L ${left} ${bottom}
Z
M ${cropLeft} ${cropTop}
L ${cropLeft} ${cropBottom}
L ${cropRight} ${cropBottom}
L ${cropRight} ${cropTop}
Z
`

		const overlay = new fabric.Path(overlayPath, {
			fill: 'rgba(0, 0, 0, 0.5)',
			selectable: false,
			evented: false,
			excludeFromExport: true,
			fillRule: 'evenodd' // This creates the hole effect
		})
		;(overlay as any).isCropElement = true

		this.darkOverlays = [overlay]
		this.canvas.add(overlay)
	}

	private getCornerCursor(index: number): string {
		const cursors = ['nw-resize', 'ne-resize', 'se-resize', 'sw-resize']
		return cursors[index] || 'pointer'
	}

	private getEdgeCursor(index: number): string {
		const cursors = ['n-resize', 'e-resize', 's-resize', 'w-resize']
		return cursors[index] || 'pointer'
	}

	/**
	 * Update crop bounds when a handle is dragged
	 */
	updateFromHandle(handleIndex: number, newX: number, newY: number): void {
		if (!this.cropBounds || !this.originalImage) return

		const minSize = 20
		let { left, top, width, height } = this.cropBounds

		// Get image bounds for constraining
		const imgWidth = (this.originalImage.width || 0) * (this.originalImage.scaleX || 1)
		const imgHeight = (this.originalImage.height || 0) * (this.originalImage.scaleY || 1)
		const center = this.originalImage.getCenterPoint()
		const imgLeft = center.x - imgWidth / 2
		const imgTop = center.y - imgHeight / 2
		const imgRight = imgLeft + imgWidth
		const imgBottom = imgTop + imgHeight

		// Constrain to image bounds
		newX = Math.max(imgLeft, Math.min(imgRight, newX))
		newY = Math.max(imgTop, Math.min(imgBottom, newY))

		switch (handleIndex) {
			case 0: // Top-left corner
				const newWidth0 = left + width - newX
				const newHeight0 = top + height - newY
				if (newWidth0 >= minSize && newHeight0 >= minSize) {
					width = newWidth0
					height = newHeight0
					left = newX
					top = newY
				}
				break
			case 1: // Top-right corner
				const newWidth1 = newX - left
				const newHeight1 = top + height - newY
				if (newWidth1 >= minSize && newHeight1 >= minSize) {
					width = newWidth1
					height = newHeight1
					top = newY
				}
				break
			case 2: // Bottom-right corner
				const newWidth2 = newX - left
				const newHeight2 = newY - top
				if (newWidth2 >= minSize && newHeight2 >= minSize) {
					width = newWidth2
					height = newHeight2
				}
				break
			case 3: // Bottom-left corner
				const newWidth3 = left + width - newX
				const newHeight3 = newY - top
				if (newWidth3 >= minSize && newHeight3 >= minSize) {
					width = newWidth3
					height = newHeight3
					left = newX
				}
				break
			case 4: // Top edge
				const newHeight4 = top + height - newY
				if (newHeight4 >= minSize) {
					height = newHeight4
					top = newY
				}
				break
			case 5: // Right edge
				const newWidth5 = newX - left
				if (newWidth5 >= minSize) {
					width = newWidth5
				}
				break
			case 6: // Bottom edge
				const newHeight6 = newY - top
				if (newHeight6 >= minSize) {
					height = newHeight6
				}
				break
			case 7: // Left edge
				const newWidth7 = left + width - newX
				if (newWidth7 >= minSize) {
					width = newWidth7
					left = newX
				}
				break
		}

		this.cropBounds = { left, top, width, height }
		this.updateOverlay()

		if (this.onCropChange) {
			this.onCropChange(this.cropBounds)
		}
	}

	/**
	 * Update the overlay and handles to match current crop bounds
	 */
	private updateOverlay(): void {
		if (!this.cropBounds || !this.cropRect) return

		const zoom = this.canvas.getZoom()
		const scale = 1 / zoom

		// Update crop rectangle
		this.cropRect.set({
			left: this.cropBounds.left,
			top: this.cropBounds.top,
			width: this.cropBounds.width,
			height: this.cropBounds.height,
			strokeWidth: 2 * scale,
			strokeDashArray: [5 * scale, 5 * scale]
		})
		this.cropRect.setCoords()

		// Update dark overlays
		this.createDarkOverlay()

		// Update corner handles
		const corners = [
			{ x: this.cropBounds.left, y: this.cropBounds.top },
			{ x: this.cropBounds.left + this.cropBounds.width, y: this.cropBounds.top },
			{
				x: this.cropBounds.left + this.cropBounds.width,
				y: this.cropBounds.top + this.cropBounds.height
			},
			{ x: this.cropBounds.left, y: this.cropBounds.top + this.cropBounds.height }
		]

		// Update edge midpoints
		const edgeMidpoints = [
			{ x: this.cropBounds.left + this.cropBounds.width / 2, y: this.cropBounds.top },
			{
				x: this.cropBounds.left + this.cropBounds.width,
				y: this.cropBounds.top + this.cropBounds.height / 2
			},
			{
				x: this.cropBounds.left + this.cropBounds.width / 2,
				y: this.cropBounds.top + this.cropBounds.height
			},
			{ x: this.cropBounds.left, y: this.cropBounds.top + this.cropBounds.height / 2 }
		]

		this.handles.forEach((handle, index) => {
			const point = index < 4 ? corners[index] : edgeMidpoints[index - 4]
			handle.set({
				left: point.x,
				top: point.y,
				radius: (index < 4 ? 8 : 6) * scale,
				strokeWidth: 2 * scale
			})
			handle.setCoords()
		})

		this.bringToFront()
		this.canvas.renderAll()
	}

	/**
	 * Check if an object is a crop handle
	 */
	isCropHandle(obj: fabric.Object): boolean {
		return (obj as any).isCropHandle === true
	}

	/**
	 * Check if an object is any crop element
	 */
	isCropElement(obj: fabric.Object): boolean {
		return (obj as any).isCropElement === true
	}

	/**
	 * Get the handle index for a crop handle object
	 */
	getHandleIndex(obj: fabric.Object): number {
		return (obj as any).handleIndex ?? -1
	}

	/**
	 * Bring all crop elements to front
	 */
	bringToFront(): void {
		// Bring dark overlays first
		this.darkOverlays.forEach((overlay) => {
			this.canvas.bringObjectToFront(overlay)
		})
		// Then crop rect
		if (this.cropRect) {
			this.canvas.bringObjectToFront(this.cropRect)
		}
		// Finally handles on top
		this.handles.forEach((handle) => {
			this.canvas.bringObjectToFront(handle)
		})
	}

	/**
	 * Get current crop bounds
	 */
	getCropBounds(): { left: number; top: number; width: number; height: number } | null {
		return this.cropBounds
	}

	/**
	 * Get the image being cropped
	 */
	getImage(): fabric.Image | null {
		return this.originalImage
	}

	/**
	 * Get the image ID being cropped
	 */
	getImageId(): string | null {
		return this.imageId
	}

	/**
	 * End crop mode and cleanup
	 */
	endCrop(): void {
		// Remove all crop elements
		this.handles.forEach((handle) => this.canvas.remove(handle))
		this.handles = []

		this.darkOverlays.forEach((overlay) => this.canvas.remove(overlay))
		this.darkOverlays = []

		if (this.cropRect) {
			this.canvas.remove(this.cropRect)
			this.cropRect = null
		}

		// Restore image selectability
		if (this.originalImage) {
			this.originalImage.selectable = true
			this.originalImage.evented = true
		}

		this.imageId = null
		this.originalImage = null
		this.cropBounds = null
		this.onCropChange = undefined

		this.canvas.renderAll()
	}

	/**
	 * Apply the crop to the image using clipPath
	 */
	applyCrop(): { success: boolean; imageId: string | null; cropData: any } {
		if (!this.originalImage || !this.cropBounds) {
			return { success: false, imageId: null, cropData: null }
		}

		const image = this.originalImage
		const imageId = this.imageId

		// Get image properties
		const center = image.getCenterPoint()
		const scaleX = image.scaleX || 1
		const scaleY = image.scaleY || 1
		const angle = image.angle || 0
		const imgWidth = (image.width || 0) * scaleX
		const imgHeight = (image.height || 0) * scaleY
		const imgLeft = center.x - imgWidth / 2
		const imgTop = center.y - imgHeight / 2

		// Calculate crop bounds relative to image (in unscaled image coordinates)
		const cropLeft = (this.cropBounds.left - imgLeft) / scaleX
		const cropTop = (this.cropBounds.top - imgTop) / scaleY
		const cropWidth = this.cropBounds.width / scaleX
		const cropHeight = this.cropBounds.height / scaleY

		// Create a clip path in image's local coordinates
		const clipRect = new fabric.Rect({
			left: cropLeft - (image.width || 0) / 2,
			top: cropTop - (image.height || 0) / 2,
			width: cropWidth,
			height: cropHeight,
			absolutePositioned: false
		})

		// Apply the clip path
		image.clipPath = clipRect

		// Adjust image position so the visible part is centered where it was
		const newCenterX = this.cropBounds.left + this.cropBounds.width / 2
		const newCenterY = this.cropBounds.top + this.cropBounds.height / 2
		image.set({
			left: newCenterX,
			top: newCenterY
		})
		image.setCoords()

		const cropData = {
			clipPath: {
				left: clipRect.left,
				top: clipRect.top,
				width: clipRect.width,
				height: clipRect.height
			},
			position: {
				left: newCenterX,
				top: newCenterY
			}
		}

		this.endCrop()

		return { success: true, imageId, cropData }
	}

	/**
	 * Cancel crop and restore original state
	 */
	cancelCrop(): void {
		this.endCrop()
	}

	/**
	 * Update sizes based on zoom level
	 */
	updateSizes(): void {
		if (!this.cropBounds) return
		this.updateOverlay()
	}
}

/**
 * Central manager for all control points on the canvas
 */
export class ControlPointManager {
	private canvas: fabric.Canvas
	private handlers: Map<string, ControlPointHandler> = new Map()
	private lineHandler: LineControlPoints
	private rectangleHandler: RectangleControlPoints
	private ellipseHandler: EllipseControlPoints
	private triangleHandler: TriangleControlPoints
	private sendCanvasUpdate?: (data: Record<string, unknown>) => void

	constructor(canvas: fabric.Canvas, sendCanvasUpdate?: (data: Record<string, unknown>) => void) {
		this.canvas = canvas
		this.sendCanvasUpdate = sendCanvasUpdate

		// Initialize handlers for different object types
		this.lineHandler = new LineControlPoints(canvas)
		this.handlers.set('polyline', this.lineHandler)

		this.rectangleHandler = new RectangleControlPoints(canvas)
		this.handlers.set('rect', this.rectangleHandler)

		this.ellipseHandler = new EllipseControlPoints(canvas)
		this.handlers.set('ellipse', this.ellipseHandler)

		this.triangleHandler = new TriangleControlPoints(canvas)
		this.handlers.set('triangle', this.triangleHandler)

		// Add new handlers for textbox, image, and path
		const textboxHandler = new TextboxControlPoints(canvas)
		this.handlers.set('textbox', textboxHandler)

		const imageHandler = new ImageControlPoints(canvas)
		this.handlers.set('image', imageHandler)

		const pathHandler = new PathControlPoints(canvas)
		this.handlers.set('path', pathHandler)
	}

	/**
	 * Add control points for an object based on its type
	 */
	addControlPoints(objectId: string, obj: fabric.Object, visible: boolean = true): void {
		const handler = this.handlers.get(obj.type || '')
		if (handler) {
			handler.addControlPoints(objectId, obj, visible)
		}
	}

	/**
	 * Remove control points for an object
	 */
	removeControlPoints(objectId: string): void {
		// Try all handlers since we don't know which one has the control points
		this.handlers.forEach((handler) => {
			handler.removeControlPoints(objectId)
		})
	}

	/**
	 * Hide control points for an object
	 */
	hideControlPoints(objectId: string): void {
		this.handlers.forEach((handler) => {
			handler.hideControlPoints(objectId)
		})
	}

	/**
	 * Show control points for an object
	 */
	showControlPoints(objectId: string): void {
		this.handlers.forEach((handler) => {
			handler.showControlPoints(objectId)
		})
	}

	/**
	 * Hide all control points across all handlers
	 */
	hideAllControlPoints(): void {
		this.handlers.forEach((handler) => {
			handler.hideAllControlPoints()
		})
	}

	/**
	 * Update control point positions when an object is moved/transformed
	 */
	updateControlPoints(objectId: string, obj: fabric.Object): void {
		const handler = this.handlers.get(obj.type || '')
		if (handler) {
			handler.updateControlPoints(objectId, obj)
		}
	}

	/**
	 * Update the object when a control point is dragged
	 */
	updateObjectFromControlPoint(
		controlPointId: string,
		newX: number,
		newY: number,
		isLive: boolean = true
	): void {
		// Find which handler has this control point
		for (const handler of this.handlers.values()) {
			const allPoints = handler.getAllControlPoints()
			if (allPoints.some((cp) => cp.id === controlPointId)) {
				handler.updateObjectFromControlPoint(controlPointId, newX, newY)

				// Send canvas update after modifying the object
				if (this.sendCanvasUpdate) {
					// Find the modified object and send its update
					const controlPoint = allPoints.find((cp) => cp.id === controlPointId)
					if (controlPoint) {
						const modifiedObj = this.canvas
							.getObjects()
							.find((obj: any) => obj.id === controlPoint.objectId)
						if (modifiedObj && modifiedObj.type === 'image') {
							// Send image updates (live or final)
							const image = modifiedObj as fabric.Image
							const objData = {
								id: (image as any).id,
								type: 'image',
								left: image.left,
								top: image.top,
								scaleX: image.scaleX,
								scaleY: image.scaleY,
								angle: image.angle,
								opacity: image.opacity
							}
							this.sendCanvasUpdate({
								type: 'modify',
								object: objData,
								live: isLive
							})
						} else if (modifiedObj && modifiedObj.type === 'polyline') {
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
							}
							this.sendCanvasUpdate({
								type: 'modify',
								object: objData
							})
						} else if (modifiedObj && modifiedObj.type === 'rect') {
							// Send rectangle updates
							const rect = modifiedObj as fabric.Rect
							const objData = {
								id: (rect as any).id,
								type: 'rect',
								left: rect.left,
								top: rect.top,
								width: rect.width,
								height: rect.height,
								angle: rect.angle,
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
							}
							this.sendCanvasUpdate({
								type: 'modify',
								object: objData
							})
						} else if (modifiedObj && modifiedObj.type === 'ellipse') {
							// Send ellipse updates
							const ellipse = modifiedObj as fabric.Ellipse
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
							}
							this.sendCanvasUpdate({
								type: 'modify',
								object: objData
							})
						} else if (modifiedObj && modifiedObj.type === 'triangle') {
							// Send triangle updates
							const triangle = modifiedObj as fabric.Triangle
							const objData = {
								id: (triangle as any).id,
								type: 'triangle',
								left: triangle.left,
								top: triangle.top,
								width: triangle.width,
								height: triangle.height,
								fill: triangle.fill,
								stroke: triangle.stroke,
								strokeWidth: triangle.strokeWidth,
								strokeDashArray: triangle.strokeDashArray,
								opacity: triangle.opacity,
								angle: triangle.angle,
								originX: 'center',
								originY: 'center',
								selectable: true,
								hasControls: false,
								hasBorders: false
							}
							this.sendCanvasUpdate({
								type: 'modify',
								object: objData,
								live: isLive
							})
						} else if (modifiedObj && modifiedObj.type === 'textbox') {
							// Send textbox updates
							const textbox = modifiedObj as fabric.Textbox
							const objData = {
								id: (textbox as any).id,
								type: 'textbox',
								text: textbox.text,
								left: textbox.left,
								top: textbox.top,
								width: textbox.width,
								fontSize: textbox.fontSize,
								fontFamily: textbox.fontFamily,
								fontWeight: textbox.fontWeight,
								fill: textbox.fill,
								textAlign: textbox.textAlign,
								opacity: textbox.opacity,
								angle: textbox.angle,
								selectable: true,
								hasControls: false,
								hasBorders: false
							}
							this.sendCanvasUpdate({
								type: 'modify',
								object: objData,
								live: isLive
							})
						}
					}
				}
				return
			}
		}
	}

	/**
	 * Check if a given object is a control point
	 */
	isControlPoint(obj: fabric.Object): boolean {
		return (obj as any).isControlPoint === true
	}

	/**
	 * Get the line handler (for backward compatibility and special operations)
	 */
	getLineHandler(): LineControlPoints {
		return this.lineHandler
	}

	/**
	 * Bring all control points to the front
	 */
	bringAllControlPointsToFront(): void {
		this.handlers.forEach((handler) => {
			handler.bringControlPointsToFront()
		})
	}

	/**
	 * Get all control points across all handlers
	 */
	getAllControlPoints(): ControlPoint[] {
		const allPoints: ControlPoint[] = []
		this.handlers.forEach((handler) => {
			allPoints.push(...handler.getAllControlPoints())
		})
		return allPoints
	}

	/**
	 * Update all control point and border sizes based on current zoom level
	 * Also updates positions to match the current object coordinates
	 */
	updateAllControlPointSizes(): void {
		// First, update sizes
		this.handlers.forEach((handler) => {
			handler.updateControlPointSizes()
		})

		// Then, update positions for all objects with control points
		// This ensures control points stay aligned with their objects at the new zoom level
		const processedObjects = new Set<string>()
		this.handlers.forEach((handler) => {
			const allPoints = handler.getAllControlPoints()
			allPoints.forEach((cp) => {
				if (!processedObjects.has(cp.objectId)) {
					processedObjects.add(cp.objectId)
					// Find the object and update its control points
					const obj = this.canvas.getObjects().find((o: any) => o.id === cp.objectId)
					if (obj) {
						handler.updateControlPoints(cp.objectId, obj)
					}
				}
			})
		})

		this.canvas.renderAll()
	}
}
