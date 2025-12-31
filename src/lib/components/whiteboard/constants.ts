import type { DrawOptions, LineArrowOptions, ShapeOptions, TextOptions } from './types';

export const DEFAULT_TEXT_OPTIONS: TextOptions = {
	fontSize: 16,
	fontFamily: 'Arial',
	fontWeight: 'normal',
	colour: '#4A5568',
	textAlign: 'left',
	opacity: 1
};

export const DEFAULT_SHAPE_OPTIONS: ShapeOptions = {
	strokeWidth: 2,
	strokeColour: '#4A5568',
	fillColour: 'transparent',
	strokeDashArray: [],
	opacity: 1
};

export const DEFAULT_DRAW_OPTIONS: DrawOptions = {
	brushSize: 6,
	brushColour: '#4A5568',
	brushType: 'pencil',
	opacity: 1
};

export const DEFAULT_LINE_ARROW_OPTIONS: LineArrowOptions = {
	strokeWidth: 2,
	strokeColour: '#4A5568',
	strokeDashArray: [],
	opacity: 1
};

export const ZOOM_LIMITS = {
	min: 0.1,
	max: 10,
	step: 1.2
} as const;

export const IMAGE_THROTTLE_MS = 100;

export const ARROW_HEAD_DEFAULTS = {
	length: 15,
	angle: Math.PI / 6
} as const;

export const MIN_TEXT_WIDTH = 50;
