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

export type LayerAction = 'sendToBack' | 'moveBackward' | 'bringToFront' | 'moveForward';

export interface CanvasUpdateData {
    type: 'add' | 'modify' | 'delete' | 'clear' | 'load' | 'update' | 'remove' | 'layer';
    whiteboardId?: number;
    object?: Record<string, unknown>;
    objects?: Record<string, unknown>[];
    live?: boolean;
    action?: LayerAction;
}

export interface HistoryAction {
    type: 'add' | 'modify' | 'delete';
    objectId: string;
    objectData?: Record<string, unknown>; // Current state for modify, or object data for add
    previousData?: Record<string, unknown>; // Previous state for modify
    timestamp: number;
}
