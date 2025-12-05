import * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { configureImageControls } from './object-controls';

/**
 * Context for canvas action handlers
 */
export interface CanvasActionContext {
    canvas: fabric.Canvas;
    sendCanvasUpdate: (data: Record<string, unknown>) => void;
    onImageAdded?: (img: fabric.FabricImage) => void;
}

/**
 * Handles image upload from file input
 */
export function handleImageUpload(
    event: Event,
    context: CanvasActionContext
): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file || !context.canvas) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
    }

    // Create a FileReader to read the image
    const reader = new FileReader();
    reader.onload = (e) => {
        const imgSrc = e.target?.result as string;

        // Create fabric image from the uploaded file
        fabric.FabricImage.fromURL(imgSrc)
            .then((img) => {
                // @ts-expect-error - Custom id property
                img.id = uuidv4();

                // Scale image to reasonable size
                const maxWidth = 300;
                const maxHeight = 300;
                const scaleX = img.width! > maxWidth ? maxWidth / img.width! : 1;
                const scaleY = img.height! > maxHeight ? maxHeight / img.height! : 1;
                const scale = Math.min(scaleX, scaleY);

                img.scale(scale);

                // Center the image
                img.set({
                    left: context.canvas.width! / 2 - (img.width! * scale) / 2,
                    top: context.canvas.height! / 2 - (img.height! * scale) / 2
                });

                // Configure image-specific controls
                configureImageControls(img);

                context.canvas.add(img);
                context.canvas.setActiveObject(img);
                context.canvas.renderAll();

                const objData = img.toObject();
                // @ts-expect-error - Custom id property
                objData.id = img.id;
                context.sendCanvasUpdate({
                    type: 'add',
                    object: objData
                });

                // Notify that image was added (for switching tool and showing menu)
                context.onImageAdded?.(img);
            })
            .catch((error) => {
                console.error('Error loading image:', error);
                alert('Error loading image. Please try a different file.');
            });
    };

    reader.readAsDataURL(file);

    // Reset the input value so the same file can be selected again
    target.value = '';
}

/**
 * Clears all objects from the canvas
 */
export function clearCanvas(context: CanvasActionContext): void {
    context.canvas.clear();
    context.sendCanvasUpdate({
        type: 'clear'
    });
}

/**
 * Deletes the currently selected object(s)
 */
export function deleteSelected(context: CanvasActionContext): void {
    const activeObjects = context.canvas.getActiveObjects();
    if (activeObjects.length) {
        activeObjects.forEach((obj) => context.canvas.remove(obj));
        context.canvas.discardActiveObject();
        context.canvas.renderAll();
        const objectsData = activeObjects.map((obj) => {
            const objData = obj.toObject();
            // @ts-expect-error - Custom id property
            objData.id = obj.id;
            return objData;
        });
        context.sendCanvasUpdate({
            type: 'delete',
            objects: objectsData
        });
    }
}

/**
 * Zoom limits for canvas
 */
export interface ZoomLimits {
    min: number;
    max: number;
    step: number;
}

/**
 * Zooms in on the canvas
 */
export function zoomIn(
    context: CanvasActionContext,
    zoomLimits: ZoomLimits,
    setCurrentZoom: (zoom: number) => void
): void {
    const newZoom = Math.min(context.canvas.getZoom() * zoomLimits.step, zoomLimits.max);
    const center = new fabric.Point(context.canvas.width! / 2, context.canvas.height! / 2);
    context.canvas.zoomToPoint(center, newZoom);
    setCurrentZoom(newZoom);
}

/**
 * Zooms out on the canvas
 */
export function zoomOut(
    context: CanvasActionContext,
    zoomLimits: ZoomLimits,
    setCurrentZoom: (zoom: number) => void
): void {
    const newZoom = Math.max(context.canvas.getZoom() / zoomLimits.step, zoomLimits.min);
    const center = new fabric.Point(context.canvas.width! / 2, context.canvas.height! / 2);
    context.canvas.zoomToPoint(center, newZoom);
    setCurrentZoom(newZoom);
}

/**
 * Resets zoom to 1:1 while maintaining the current view position
 */
export function resetZoom(
    context: CanvasActionContext,
    setCurrentZoom: (zoom: number) => void
): void {
    // Use the same center point as zoomIn/zoomOut for consistent behavior
    const center = new fabric.Point(context.canvas.width! / 2, context.canvas.height! / 2);
    context.canvas.zoomToPoint(center, 1);
    setCurrentZoom(1);
    context.canvas.renderAll();
}

/**
 * Recenters the view to the default position
 */
export function recenterView(
    context: CanvasActionContext,
    setCurrentZoom: (zoom: number) => void
): void {
    // Reset the viewport transform to center the view
    context.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    // Update the zoom state to match the reset zoom level
    setCurrentZoom(1);
    context.canvas.renderAll();
}

/**
 * Layering actions for canvas objects
 */

/**
 * Brings the selected object to the front (top layer)
 */
export function bringToFront(context: CanvasActionContext): void {
    const activeObject = context.canvas.getActiveObject();
    if (!activeObject) return;

    context.canvas.bringObjectToFront(activeObject);
    context.canvas.renderAll();

    const objData = activeObject.toObject();
    // @ts-expect-error - Custom id property
    objData.id = activeObject.id;
    context.sendCanvasUpdate({
        type: 'layer',
        action: 'bringToFront',
        object: objData
    });
}

/**
 * Sends the selected object to the back (bottom layer)
 */
export function sendToBack(context: CanvasActionContext): void {
    const activeObject = context.canvas.getActiveObject();
    if (!activeObject) return;

    context.canvas.sendObjectToBack(activeObject);
    context.canvas.renderAll();

    const objData = activeObject.toObject();
    // @ts-expect-error - Custom id property
    objData.id = activeObject.id;
    context.sendCanvasUpdate({
        type: 'layer',
        action: 'sendToBack',
        object: objData
    });
}

/**
 * Moves the selected object forward one layer
 */
export function moveForward(context: CanvasActionContext): void {
    const activeObject = context.canvas.getActiveObject();
    if (!activeObject) return;

    context.canvas.bringObjectForward(activeObject);
    context.canvas.renderAll();

    const objData = activeObject.toObject();
    // @ts-expect-error - Custom id property
    objData.id = activeObject.id;
    context.sendCanvasUpdate({
        type: 'layer',
        action: 'moveForward',
        object: objData
    });
}

/**
 * Moves the selected object backward one layer
 */
export function moveBackward(context: CanvasActionContext): void {
    const activeObject = context.canvas.getActiveObject();
    if (!activeObject) return;

    context.canvas.sendObjectBackwards(activeObject);
    context.canvas.renderAll();

    const objData = activeObject.toObject();
    // @ts-expect-error - Custom id property
    objData.id = activeObject.id;
    context.sendCanvasUpdate({
        type: 'layer',
        action: 'moveBackward',
        object: objData
    });
}
