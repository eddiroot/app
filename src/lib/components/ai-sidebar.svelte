<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Textarea from './ui/textarea/textarea.svelte';
	import SendIcon from '@lucide/svelte/icons/send';

	interface Props {
		pathname: string;
	}

	type Tab = { id: string; label: string };

	let { pathname }: Props = $props();

	const getAvailableTabs = (): Tab[] => {
		return [
			{ id: 'chat', label: 'Chat' },
			{ id: 'practise', label: 'Practise' },
			{ id: 'assess', label: 'Assess' },
		];
	};

	let availableTabs: Tab[] = $state(getAvailableTabs());
	// let messages: { id: string; role: string; content: string; timestamp: Date }[] = $state([]);
	let message: string = $state('');

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	async function sendMessage() {
		if (!message.trim()) return;

		// handle the message here
	}
</script>

<Sidebar.Root
	collapsible="offcanvas"
	class="static! top-(--header-height) h-[calc(100svh-var(--header-height))]! w-full!"
	side="right"
	variant="inset"
>
	<Sidebar.Content>
		<Tabs.Root class="flex-1 pr-2 pb-2" value="chat">
			<Tabs.List class="bg-sidebar w-full">
				{#each availableTabs as tab (tab.id)}
					<Tabs.Trigger value={tab.id}>{tab.label}</Tabs.Trigger>
				{/each}
			</Tabs.List>
			<Tabs.Content value="chat" class="flex flex-col">
				<div class="flex-1">Messages go here</div>
				<div class="space-y-2">
					<Textarea />
					<div class="flex gap-x-2">
						<Select.Root type="single">
							<Select.Trigger class="w-full">Gemini 2.5 Pro</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Label>Models</Select.Label>
									<Select.Item value="Gemini 2.5 Pro" label="Gemini 2.5 Pro">
										Gemini 2.5 Pro
									</Select.Item>
								</Select.Group>
							</Select.Content>
						</Select.Root>
						<Button>
							<SendIcon />
							Send
						</Button>
					</div>
				</div>
			</Tabs.Content>
			<Tabs.Content value="practise">Practise content here</Tabs.Content>
			<Tabs.Content value="assess">Assess content here</Tabs.Content>
		</Tabs.Root>
	</Sidebar.Content>
</Sidebar.Root>
