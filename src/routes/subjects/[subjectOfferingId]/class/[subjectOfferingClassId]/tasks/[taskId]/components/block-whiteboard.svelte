<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { ViewMode, type WhiteboardBlockProps } from '$lib/schema/task';
	import PresentationIcon from '@lucide/svelte/icons/presentation';
	import { io, type Socket } from 'socket.io-client';
	import { onDestroy, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let {
		blockId,
		config,
		onConfigUpdate,
		viewMode,
		whiteboardMap,
		whiteboardLockStates,
		isTeacher,
	}: WhiteboardBlockProps & {
		whiteboardMap?: Record<number, number>;
		whiteboardLockStates?: Record<number, boolean>;
		isTeacher?: boolean;
	} = $props();

	const { taskId, subjectOfferingId, subjectOfferingClassId } = $derived(
		page.params,
	);

	const whiteboardId = $derived(whiteboardMap?.[blockId] ?? null);
	let isLocked = $state(false);
	let isTogglingLock = $state(false);
	let socket: Socket | null = $state(null);

	// Update isLocked when whiteboardId or lockStates change
	$effect(() => {
		if (whiteboardId && whiteboardLockStates) {
			isLocked = whiteboardLockStates[whiteboardId] ?? false;
		}
	});

	// Setup Socket.IO connection for broadcasting lock changes
	onMount(() => {
		if (!browser || !whiteboardId) return;

		// Connect to Socket.IO server
		socket = io({ path: '/socket.io/', transports: ['websocket', 'polling'] });

		socket.on('connect', () => {
			// Initialize with whiteboardId
			socket?.emit('init', { whiteboardId });
		});

		socket.on('connect_error', (error) => {
			console.error('Socket.IO connection error:', error);
		});
	});

	onDestroy(() => {
		if (socket) {
			socket.disconnect();
		}
	});

	const openWhiteboard = () => {
		if (!whiteboardId) {
			console.error('No whiteboard ID available');
			return;
		}

		const url = `/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${taskId}/whiteboard/${whiteboardId}`;
		goto(url);
	};

	const toggleLock = async () => {
		if (!whiteboardId || isTogglingLock) return;

		isTogglingLock = true;

		try {
			const formData = new FormData();
			formData.append('whiteboardId', whiteboardId.toString());

			const response = await fetch(
				`/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${taskId}?/toggleWhiteboardLock`,
				{ method: 'POST', body: formData },
			);

			const result = await response.json();

			if (result.type === 'success' && result.data) {
				let actionData =
					typeof result.data === 'string'
						? JSON.parse(result.data)
						: result.data;

				// Handle devalue format
				if (Array.isArray(actionData)) {
					const reconstructed = {
						type: actionData[1],
						data: { isLocked: actionData[3] },
					};
					actionData = reconstructed;
				}

				if (
					actionData.type === 'success' &&
					actionData.data?.isLocked !== undefined
				) {
					const newLockState = actionData.data.isLocked;

					// Update local state immediately for reactivity
					isLocked = newLockState;

					// Also update the shared state
					if (whiteboardLockStates) {
						whiteboardLockStates[whiteboardId] = newLockState;
					}

					// Broadcast lock state change via Socket.IO to all connected clients
					if (socket && socket.connected) {
						const lockMessage = newLockState ? 'lock' : 'unlock';
						socket.emit(lockMessage, {
							isLocked: newLockState,
							whiteboardId: whiteboardId,
						});
					}

					// Show toast notification
					if (newLockState) {
						toast.success('Whiteboard locked', {
							description: 'Students can now only view and pan the whiteboard',
						});
					} else {
						toast.success('Whiteboard unlocked', {
							description: 'Students can now edit the whiteboard',
						});
					}
				}
			}
		} catch (err) {
			console.error('Lock toggle failed:', err);
			toast.error('Failed to toggle lock', { description: 'Please try again' });
		} finally {
			isTogglingLock = false;
		}
	};
</script>

<div class="flex w-full flex-col gap-4">
	{#if viewMode === ViewMode.CONFIGURE}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<PresentationIcon />
					Configure Whiteboard
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-2">
					<Label for="whiteboard-title">Whiteboard Title (Optional)</Label>
					<Input
						id="whiteboard-title"
						value={config.title}
						oninput={(e) => {
							const value = (e.target as HTMLInputElement)?.value;
							if (value !== undefined) {
								const newConfig = { ...config, title: value };
								onConfigUpdate(newConfig);
							}
						}}
						placeholder="Enter a title here"
					/>
				</div>
				<p class="text-muted-foreground text-sm">
					Each whiteboard block has its own unique whiteboard. Access it through
					preview mode.
				</p>
			</Card.Content>
		</Card.Root>
	{:else if whiteboardId}
		<div class="rounded-lg border p-6">
			<div class="text-center">
				<PresentationIcon
					class="text-muted-foreground mx-auto mb-3 h-12 w-12"
				/>
				<h3 class="mb-2 text-lg font-semibold break-words">
					{config.title || 'Interactive Whiteboard'}
				</h3>
			</div>
			<div class="mt-6 flex items-center gap-2">
				<Button class="flex-1" onclick={openWhiteboard}>Open Whiteboard</Button>
				{#if isTeacher}
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								variant="ghost"
								size="icon"
								onclick={toggleLock}
								disabled={isTogglingLock}
							>
								{#if isLocked}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
										<path d="M7 11V7a5 5 0 0 1 10 0v4" />
									</svg>
								{:else}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
										<path d="M7 11V7a5 5 0 0 1 9.9-1" />
									</svg>
								{/if}
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							{isLocked ? 'Unlock Whiteboard' : 'Lock Whiteboard'}
						</Tooltip.Content>
					</Tooltip.Root>
				{/if}
			</div>
		</div>
	{:else}
		<div class="rounded-lg border p-6 text-center">
			<PresentationIcon class="text-muted-foreground mx-auto mb-3 h-12 w-12" />
			<p class="text-muted-foreground">
				Whiteboard not found. Please try refreshing the page.
			</p>
		</div>
	{/if}
</div>
