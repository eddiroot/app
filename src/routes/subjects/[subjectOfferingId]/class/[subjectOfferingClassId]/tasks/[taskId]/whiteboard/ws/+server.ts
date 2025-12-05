import {
	clearWhiteboard,
	deleteWhiteboardObject,
	deleteWhiteboardObjects,
	getWhiteboardObjects,
	saveWhiteboardObject,
	updateWhiteboardObject
} from '$lib/server/db/service';
import type { Socket } from './$types.js';

// Store peer subscriptions with their whiteboardId
const peerWhiteboards = new Map<object, number>();

export const socket: Socket = {
	async open(peer) {
		// For now, default to whiteboard 1 if no ID is specified
		// This will be updated when the client sends a message with whiteboardId
		const whiteboardId = 1;
		peerWhiteboards.set(peer, whiteboardId);

		try {
			const objects = await getWhiteboardObjects(whiteboardId);
			const whiteboardObjects = objects.map((obj) => ({
				id: obj.objectId,
				...(obj.objectData as Record<string, unknown>)
			}));

			peer.send(
				JSON.stringify({
					type: 'load',
					whiteboardId,
					whiteboard: { objects: whiteboardObjects }
				})
			);
		} catch (error) {
			console.error('Failed to load whiteboard from database:', error);
			peer.send(
				JSON.stringify({
					type: 'load',
					whiteboardId,
					whiteboard: { objects: [] }
				})
			);
		}
		peer.subscribe(`whiteboard-${whiteboardId}`);
	},

	async message(peer, message) {
		const parsedMessage = JSON.parse(String(message));
		const whiteboardId = parsedMessage.whiteboardId || peerWhiteboards.get(peer) || 1;

		// Update the peer's whiteboard if a new one is specified
		if (parsedMessage.whiteboardId && parsedMessage.whiteboardId !== peerWhiteboards.get(peer)) {
			// Unsubscribe from old whiteboard
			const oldWhiteboardId = peerWhiteboards.get(peer);
			if (oldWhiteboardId) {
				peer.unsubscribe(`whiteboard-${oldWhiteboardId}`);
			}

			// Subscribe to new whiteboard
			peerWhiteboards.set(peer, whiteboardId);
			peer.subscribe(`whiteboard-${whiteboardId}`);

			// Send current state of new whiteboard
			try {
				const objects = await getWhiteboardObjects(whiteboardId);
				const whiteboardObjects = objects.map((obj) => ({
					id: obj.objectId,
					...(obj.objectData as Record<string, unknown>)
				}));

				peer.send(
					JSON.stringify({
						type: 'load',
						whiteboardId,
						whiteboard: { objects: whiteboardObjects }
					})
				);
			} catch (error) {
				console.error('Failed to load whiteboard from database:', error);
			}
		}

		try {
			if (parsedMessage.type === 'init') {
				// Handle whiteboard initialization with specific ID
				const newWhiteboardId = parsedMessage.whiteboardId;
				if (newWhiteboardId && newWhiteboardId !== peerWhiteboards.get(peer)) {
					// Unsubscribe from old whiteboard
					const oldWhiteboardId = peerWhiteboards.get(peer);
					if (oldWhiteboardId) {
						peer.unsubscribe(`whiteboard-${oldWhiteboardId}`);
					}

					// Subscribe to new whiteboard
					peerWhiteboards.set(peer, newWhiteboardId);
					peer.subscribe(`whiteboard-${newWhiteboardId}`);

					// Send current state of new whiteboard
					try {
						const objects = await getWhiteboardObjects(newWhiteboardId);
						const whiteboardObjects = objects.map((obj) => ({
							id: obj.objectId,
							...(obj.objectData as Record<string, unknown>)
						}));

						peer.send(
							JSON.stringify({
								type: 'load',
								whiteboardId: newWhiteboardId,
								whiteboard: { objects: whiteboardObjects }
							})
						);
					} catch (error) {
						console.error('Failed to load whiteboard from database:', error);
					}
				}
				return;
			} else if (parsedMessage.type === 'clear') {
				await clearWhiteboard(whiteboardId);
				peer.publish(
					`whiteboard-${whiteboardId}`,
					JSON.stringify({
						type: 'clear',
						whiteboardId
					})
				);
			} else if (parsedMessage.type === 'add' || parsedMessage.type === 'create') {
				const newObject = parsedMessage.object;

				await saveWhiteboardObject({
					objectId: newObject.id,
					objectData: newObject,
					whiteboardId
				});

				peer.publish(
					`whiteboard-${whiteboardId}`,
					JSON.stringify({
						type: 'add',
						object: newObject,
						whiteboardId
					})
				);
			} else if (parsedMessage.type === 'remove' || parsedMessage.type === 'delete') {
				if (parsedMessage.objects) {
					const objectsToRemove = parsedMessage.objects;
					const objectIds = objectsToRemove.map((obj: { id: string }) => obj.id);

					await deleteWhiteboardObjects(objectIds, whiteboardId);

					peer.publish(
						`whiteboard-${whiteboardId}`,
						JSON.stringify({
							type: 'delete',
							objects: objectsToRemove,
							whiteboardId
						})
					);
				} else if (parsedMessage.object) {
					const objectToRemove = parsedMessage.object;

					await deleteWhiteboardObject(objectToRemove.id, whiteboardId);

					peer.publish(
						`whiteboard-${whiteboardId}`,
						JSON.stringify({
							type: 'delete',
							objects: [objectToRemove],
							whiteboardId
						})
					);
				}
			} else if (parsedMessage.type === 'update' || parsedMessage.type === 'modify') {
				const updatedObject = parsedMessage.object;
				const isLiveUpdate = parsedMessage.live || false; // Flag for live vs final updates

				// For live updates, skip database writes to improve performance
				if (!isLiveUpdate) {
					await updateWhiteboardObject(updatedObject.id, updatedObject, whiteboardId);
				}

				// Always broadcast the update to other connected clients
				peer.publish(
					`whiteboard-${whiteboardId}`,
					JSON.stringify({
						type: 'modify',
						object: updatedObject,
						whiteboardId
					})
				);
			} else if (parsedMessage.type === 'layer') {
				// Handle layering changes
				const layeredObject = parsedMessage.object;
				const action = parsedMessage.action;

				// Update the object in the database to reflect the new z-index
				await updateWhiteboardObject(layeredObject.id, layeredObject, whiteboardId);

				// Broadcast the layering change to other clients
				peer.publish(
					`whiteboard-${whiteboardId}`,
					JSON.stringify({
						type: 'layer',
						object: layeredObject,
						action: action,
						whiteboardId
					})
				);
			}
		} catch (error) {
			console.error('Database operation failed:', error);
			peer.send(
				JSON.stringify({
					type: 'error',
					message: 'Failed to persist changes',
					whiteboardId
				})
			);
		}
	},

	close(peer) {
		const whiteboardId = peerWhiteboards.get(peer);
		if (whiteboardId) {
			peer.unsubscribe(`whiteboard-${whiteboardId}`);
			peerWhiteboards.delete(peer);
		}
	}
};
