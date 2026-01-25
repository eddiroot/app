import * as fabric from 'fabric'
import { v4 as uuidv4 } from 'uuid'
import { MIN_TEXT_WIDTH } from './constants'
import type { LineOptions, ShapeOptions, TextOptions } from './types'

/**
 * Create a line object with the given options
 */
export const createLine = (
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	options: LineOptions
) => {
	const line = new fabric.Polyline(
		[
			{ x: x1, y: y1 },
			{ x: x2, y: y2 }
		],
		{
			id: uuidv4(),
			stroke: options.strokeColour,
			strokeWidth: options.strokeWidth,
			strokeDashArray: options.strokeDashArray,
			opacity: options.opacity,
			selectable: false, // Start as non-selectable during drawing, set to true when finalized
			hasControls: false,
			hasBorders: false,
			strokeUniform: true
		}
	)

	return line
}

/**
 * Create a shape (circle, rectangle, or triangle) from two points
 */
export const createShapeFromPoints = (
	shapeType: string,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	options: ShapeOptions
) => {
	// Calculate dimensions from the two points
	const left = Math.min(x1, x2)
	const top = Math.min(y1, y2)
	const width = Math.abs(x2 - x1)
	const height = Math.abs(y2 - y1)

	switch (shapeType) {
		case 'circle': {
			// Create ellipse from corner to corner (like rectangle)
			const ellipse = new fabric.Ellipse({
				id: uuidv4(),
				rx: width / 2,
				ry: height / 2,
				fill: options.fillColour,
				stroke: options.strokeColour,
				strokeWidth: options.strokeWidth,
				strokeDashArray: options.strokeDashArray,
				opacity: options.opacity,
				left: left + width / 2,
				top: top + height / 2,
				originX: 'center',
				originY: 'center',
				selectable: false, // Start as non-selectable during drawing, set to true when finalized
				hasControls: false,
				hasBorders: false,
				strokeUniform: true
			})
			return ellipse
		}
		case 'rectangle': {
			const rect = new fabric.Rect({
				id: uuidv4(),
				width: width,
				height: height,
				fill: options.fillColour,
				stroke: options.strokeColour,
				strokeWidth: options.strokeWidth,
				strokeDashArray: options.strokeDashArray,
				opacity: options.opacity,
				left: left + width / 2,
				top: top + height / 2,
				originX: 'center',
				originY: 'center',
				selectable: false, // Start as non-selectable during drawing, set to true when finalized
				hasControls: false,
				hasBorders: false,
				strokeUniform: true
			})
			return rect
		}
		case 'triangle': {
			const triangle = new fabric.Triangle({
				id: uuidv4(),
				width: width,
				height: height,
				fill: options.fillColour,
				stroke: options.strokeColour,
				strokeWidth: options.strokeWidth,
				strokeDashArray: options.strokeDashArray,
				opacity: options.opacity,
				left: left + width / 2,
				top: top + height / 2,
				originX: 'center',
				originY: 'center',
				selectable: false, // Start as non-selectable during drawing, set to true when finalized
				hasControls: false,
				hasBorders: false,
				strokeUniform: true
			})
			return triangle
		}
		default:
			return null
	}
}

/**
 * Create a text box from two points
 */
export const createTextFromPoints = (
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	options: TextOptions
) => {
	// Calculate dimensions from the two points
	const left = Math.min(x1, x2)
	const top = Math.min(y1, y2)
	const width = Math.max(Math.abs(x2 - x1), MIN_TEXT_WIDTH)

	const text = new fabric.Textbox('Click to edit text', {
		id: uuidv4(),
		left: left,
		top: top,
		width: width,
		fontSize: options.fontSize,
		fontFamily: options.fontFamily,
		fontWeight: options.fontWeight,
		fill: options.colour,
		opacity: options.opacity,
		// Text wrapping settings
		splitByGrapheme: false, // Split by words (spaces) first, only break long words if needed
		// Fixed height behavior - let text wrap and expand vertically naturally
		// but constrain width
		textAlign: options.textAlign,
		selectable: false, // Start as non-selectable during creation, set to true when finalized
		hasControls: false,
		hasBorders: false,
		// Use top-left origin (default for textboxes)
		originX: 'left',
		originY: 'top'
	})

	return text
}
