import type { Server as HTTPServer } from 'http';
import type { Http2SecureServer } from 'http2';
import { Server as SocketIOServer } from 'socket.io';
import { sessionCookieName, validateSessionToken } from './auth/session.js';
import {
	clearWhiteboard,
	deleteWhiteboardObject,
	deleteWhiteboardObjects,
	getWhiteboardObjects,
	saveWhiteboardObject,
	updateWhiteboardObject,
} from './db/service/task.js';

function parseCookieValue(cookieHeader: string, name: string): string | null {
	const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) : null;
}

export function setupWebSocketServer(
	httpServer: HTTPServer | Http2SecureServer,
) {
	const io = new SocketIOServer(httpServer, {
		cors: { origin: '*', methods: ['GET', 'POST'] },
		path: '/socket.io/',
	});

	io.use(async (socket, next) => {
		const cookieHeader = socket.handshake.headers.cookie ?? '';
		const token = parseCookieValue(cookieHeader, sessionCookieName);
		if (!token) {
			return next(new Error('Authentication required'));
		}
		const { user } = await validateSessionToken(token);
		if (!user) {
			return next(new Error('Invalid or expired session'));
		}
		(socket.data as { user: typeof user }).user = user;
		next();
	});

	io.on('connection', (socket) => {
		console.log('WebSocket client connected:', socket.id);

		let currentWhiteboardId: number | null = null;

		socket.on('init', async (data: { whiteboardId: number }) => {
			try {
				const { whiteboardId } = data;
				console.log(
					`Client ${socket.id} initializing whiteboard ${whiteboardId}`,
				);

				// Leave previous room if any
				if (currentWhiteboardId) {
					socket.leave(`whiteboard-${currentWhiteboardId}`);
					console.log(
						`Client ${socket.id} left whiteboard-${currentWhiteboardId}`,
					);
				}

				// Join new room
				currentWhiteboardId = whiteboardId;
				socket.join(`whiteboard-${whiteboardId}`);
				console.log(`Client ${socket.id} joined whiteboard-${whiteboardId}`);

				// Load and send current whiteboard state
				const objects = await getWhiteboardObjects(whiteboardId);
				const whiteboardObjects = objects.map((obj) => ({
					id: obj.objectId,
					...(obj.objectData as Record<string, unknown>),
				}));

				console.log(
					`Sending ${whiteboardObjects.length} objects to client ${socket.id}`,
				);
				socket.emit('load', {
					whiteboardId,
					whiteboard: { objects: whiteboardObjects },
				});
			} catch (error) {
				console.error('Error in init:', error);
				socket.emit('error', { message: 'Failed to initialize whiteboard' });
			}
		});

		socket.on('add', async (data: { whiteboardId: number; object: any }) => {
			try {
				const { whiteboardId, object: newObject } = data;
				console.log(
					`Adding object ${newObject.id} to whiteboard ${whiteboardId}`,
				);

				await saveWhiteboardObject({
					objectId: newObject.id,
					objectData: newObject,
					whiteboardId,
				});

				// Broadcast to all clients EXCEPT the sender
				socket.broadcast
					.to(`whiteboard-${whiteboardId}`)
					.emit('add', { whiteboardId, object: newObject });
				console.log(`Broadcasted add event for object ${newObject.id}`);
			} catch (error) {
				console.error('Error in add:', error);
				socket.emit('error', { message: 'Failed to add object' });
			}
		});

		socket.on(
			'modify',
			async (data: { whiteboardId: number; object: any; live?: boolean }) => {
				try {
					const { whiteboardId, object: updatedObject, live = false } = data;

					// For live updates, skip database writes to improve performance
					if (!live) {
						await updateWhiteboardObject(
							updatedObject.id,
							updatedObject,
							whiteboardId,
						);
					}

					// Broadcast to all clients EXCEPT the sender
					socket.broadcast
						.to(`whiteboard-${whiteboardId}`)
						.emit('modify', { whiteboardId, object: updatedObject, live });
				} catch (error) {
					console.error('Error in modify:', error);
					socket.emit('error', { message: 'Failed to modify object' });
				}
			},
		);

		socket.on(
			'delete',
			async (data: { whiteboardId: number; objects?: any[]; object?: any }) => {
				try {
					const {
						whiteboardId,
						objects: objectsToRemove,
						object: singleObject,
					} = data;

					if (objectsToRemove) {
						const objectIds = objectsToRemove.map(
							(obj: { id: string }) => obj.id,
						);
						await deleteWhiteboardObjects(objectIds, whiteboardId);

						// Broadcast to all clients EXCEPT the sender
						socket.broadcast
							.to(`whiteboard-${whiteboardId}`)
							.emit('delete', { whiteboardId, objects: objectsToRemove });
					} else if (singleObject) {
						await deleteWhiteboardObject(singleObject.id, whiteboardId);

						// Broadcast to all clients EXCEPT the sender
						socket.broadcast
							.to(`whiteboard-${whiteboardId}`)
							.emit('delete', { whiteboardId, objects: [singleObject] });
					}
				} catch (error) {
					console.error('Error in delete:', error);
					socket.emit('error', { message: 'Failed to delete object' });
				}
			},
		);

		socket.on('clear', async (data: { whiteboardId: number }) => {
			try {
				const { whiteboardId } = data;
				await clearWhiteboard(whiteboardId);

				// Broadcast to all clients EXCEPT the sender
				socket.broadcast
					.to(`whiteboard-${whiteboardId}`)
					.emit('clear', { whiteboardId });
			} catch (error) {
				console.error('Error in clear:', error);
				socket.emit('error', { message: 'Failed to clear whiteboard' });
			}
		});

		socket.on(
			'layer',
			async (data: { whiteboardId: number; object: any; action: string }) => {
				try {
					const { whiteboardId, object: layeredObject, action } = data;

					await updateWhiteboardObject(
						layeredObject.id,
						layeredObject,
						whiteboardId,
					);

					// Broadcast to all clients EXCEPT the sender
					socket.broadcast
						.to(`whiteboard-${whiteboardId}`)
						.emit('layer', { whiteboardId, object: layeredObject, action });
				} catch (error) {
					console.error('Error in layer:', error);
					socket.emit('error', { message: 'Failed to layer object' });
				}
			},
		);

		socket.on(
			'lock',
			async (data: { whiteboardId: number; isLocked: boolean }) => {
				try {
					const { whiteboardId, isLocked } = data;

					socket.broadcast
						.to(`whiteboard-${whiteboardId}`)
						.emit('lock', { whiteboardId, isLocked });
				} catch (error) {
					console.error('Error in lock:', error);
					socket.emit('error', { message: 'Failed to lock whiteboard' });
				}
			},
		);

		socket.on(
			'unlock',
			async (data: { whiteboardId: number; isLocked: boolean }) => {
				try {
					const { whiteboardId, isLocked } = data;

					socket.broadcast
						.to(`whiteboard-${whiteboardId}`)
						.emit('unlock', { whiteboardId, isLocked });
				} catch (error) {
					console.error('Error in unlock:', error);
					socket.emit('error', { message: 'Failed to unlock whiteboard' });
				}
			},
		);

		socket.on('disconnect', () => {
			console.log('WebSocket client disconnected:', socket.id);
			if (currentWhiteboardId) {
				console.log(
					`Client ${socket.id} left whiteboard-${currentWhiteboardId}`,
				);
			}
		});
	});

	return io;
}
