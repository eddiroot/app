export type WhiteboardTool =
	| 'select'
	| 'pan'
	| 'draw'
	| 'line'
	| 'arrow'
	| 'shapes'
	| 'text'
	| 'image'
	| 'eraser';

export type ShapeType = 'rectangle' | 'circle' | 'triangle';

export type BrushType = 'pencil' | 'circle' | 'spray';

export interface TextOptions {
	fontSize: number;
	fontFamily: string;
	fontWeight: string;
	colour: string;
	textAlign: string;
	opacity: number;
}

export interface ShapeOptions {
	strokeWidth: number;
	strokeColour: string;
	fillColour: string;
	strokeDashArray: number[];
	opacity: number;
}

export interface DrawOptions {
	brushSize: number;
	brushColour: string;
	brushType: BrushType;
	opacity: number;
}

export interface LineArrowOptions {
	strokeWidth: number;
	strokeColour: string;
	strokeDashArray: number[];
	opacity: number;
}

export interface Point {
	x: number;
	y: number;
}

export interface CanvasUpdateData {
	type: 'add' | 'modify' | 'delete' | 'clear' | 'load' | 'update' | 'remove';
	whiteboardId?: number;
	object?: Record<string, unknown>;
	objects?: Record<string, unknown>[];
	live?: boolean;
}
