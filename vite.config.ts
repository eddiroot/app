import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [
		devtoolsJson(),
		tailwindcss(),
		sveltekit(),
		{
			name: 'vite-plugin-socketio',
			configureServer(server) {
				if (!server.httpServer) {
					return;
				}

				// Wait for server to be fully ready
				server.httpServer.once('listening', async () => {
					try {
						// Use Vite's ssrLoadModule to properly load the TypeScript module
						const websocketModule = await server.ssrLoadModule(
							'/src/lib/server/websocket.ts',
						);
						const { setupWebSocketServer } = websocketModule;
						const io = setupWebSocketServer(server.httpServer!);
						console.log('✓ Socket.IO server initialized for whiteboard');

						server.httpServer!.once('close', () => {
							io.close();
							console.log('Socket.IO server closed');
						});
					} catch (error) {
						console.error('Failed to initialize Socket.IO:', error);
					}
				});
			},
		},
	],
});
