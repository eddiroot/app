import * as fabric from 'fabric';

/**
 * WebSocket message types
 */
interface WebSocketMessage {
	whiteboardId: number;
	type:
		| 'init'
		| 'load'
		| 'add'
		| 'modify'
		| 'update'
		| 'delete'
		| 'remove'
		| 'clear';
	whiteboard?: { objects: SerializedObject[] };
	object?: SerializedObject;
	objects?: SerializedObject[];
	live?: boolean;
}

/**
 * Serialized object data from WebSocket
 */
interface SerializedObject {
	id?: string;
	type?: string;
	left?: number;
	top?: number;
	scaleX?: number;
	scaleY?: number;
	angle?: number;
	opacity?: number;
	[key: string]: unknown;
}

/**
 * Creates a WebSocket connection and sets up message handlers for whiteboard synchronization
 */
export function setupWebSocket(
	url: string,
	canvas: fabric.Canvas,
	whiteboardId: number,
): WebSocket {
	const socket = new WebSocket(url);

	socket.addEventListener('open', () => {
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ type: 'init', whiteboardId }));
		}
	});

	socket.addEventListener('message', async (event) => {
		try {
			const messageData = JSON.parse(event.data) as WebSocketMessage;
			if (messageData.whiteboardId !== whiteboardId) return;

			if (messageData.type === 'load') {
				await handleLoadMessage(canvas, messageData);
			} else if (messageData.type === 'add') {
				await handleAddMessage(canvas, messageData);
			} else if (
				messageData.type === 'modify' ||
				messageData.type === 'update'
			) {
				handleModifyMessage(canvas, messageData);
			} else if (
				messageData.type === 'delete' ||
				messageData.type === 'remove'
			) {
				handleDeleteMessage(canvas, messageData);
			} else if (messageData.type === 'clear') {
				canvas.clear();
			}
		} catch (e) {
			console.error('Error parsing JSON:', e);
		}
	});

	return socket;
}

/**
 * Handles 'load' message - loads all objects into the canvas
 */
async function handleLoadMessage(
	canvas: fabric.Canvas,
	messageData: WebSocketMessage,
): Promise<void> {
	if (messageData.whiteboard && messageData.whiteboard.objects.length > 0) {
		const objects = await fabric.util.enlivenObjects(
			messageData.whiteboard.objects,
		);
		canvas.clear();
		// Use unknown type for flexibility with enlivened objects
		objects.forEach((obj: unknown) => {
			const fabricObj = obj as fabric.FabricObject & {
				id?: string;
				addTo?: (canvas: fabric.Canvas) => void;
			};

			// Preserve the custom id property
			if (
				messageData.whiteboard!.objects.find(
					(o: SerializedObject) =>
						o.id && o.left === fabricObj.left && o.top === fabricObj.top,
				)
			) {
				const originalObj = messageData.whiteboard!.objects.find(
					(o: SerializedObject) =>
						o.id && o.left === fabricObj.left && o.top === fabricObj.top,
				);
				fabricObj.id = originalObj!.id;
			}

			if (fabricObj && typeof fabricObj.addTo === 'function') {
				fabricObj.addTo(canvas);
			} else {
				canvas.add(fabricObj);
			}
		});
		canvas.renderAll();
	}
}

/**
 * Handles 'add' message - adds a new object to the canvas
 */
async function handleAddMessage(
	canvas: fabric.Canvas,
	messageData: WebSocketMessage,
): Promise<void> {
	if (messageData.object) {
		const objects = await fabric.util.enlivenObjects([messageData.object]);
		if (objects.length > 0) {
			const obj = objects[0];
			// Preserve the custom id property
			// @ts-expect-error - Custom id property
			obj.id = messageData.object.id;
			canvas.add(obj as fabric.FabricObject);
			canvas.renderAll();
		}
	}
}

/**
 * Handles 'modify' or 'update' message - updates an existing object
 */
function handleModifyMessage(
	canvas: fabric.Canvas,
	messageData: WebSocketMessage,
): void {
	if (!messageData.object) return;

	const objects = canvas.getObjects();
	// @ts-expect-error - Custom id property
	const obj = objects.find((o) => o.id === messageData.object!.id);
	if (obj) {
		// For live image updates, only update the essential properties to reduce lag
		const isLiveUpdate = messageData.live || false;
		if (isLiveUpdate && messageData.object.type === 'image') {
			// Only update positioning and transformation properties for live image updates
			obj.set({
				left: messageData.object.left,
				top: messageData.object.top,
				scaleX: messageData.object.scaleX,
				scaleY: messageData.object.scaleY,
				angle: messageData.object.angle,
				opacity: messageData.object.opacity,
			});
		} else {
			// Full update for final modifications or non-image objects
			obj.set(messageData.object as Partial<fabric.FabricObjectProps>);
		}
		canvas.renderAll();
	}
}

/**
 * Handles 'delete' or 'remove' message - removes objects from the canvas
 */
function handleDeleteMessage(
	canvas: fabric.Canvas,
	messageData: WebSocketMessage,
): void {
	const objects = canvas.getObjects();
	const objectsToRemove =
		messageData.objects || (messageData.object ? [messageData.object] : []);
	objectsToRemove.forEach((objData: SerializedObject) => {
		// @ts-expect-error - Custom id property
		const obj = objects.find((o) => o.id === objData.id);
		if (obj) {
			canvas.remove(obj);
		}
	});
	canvas.renderAll();
}

/**
 * Closes the WebSocket connection safely
 */
export function closeWebSocket(socket: WebSocket | undefined): void {
	if (socket) {
		socket.close();
	}
}
