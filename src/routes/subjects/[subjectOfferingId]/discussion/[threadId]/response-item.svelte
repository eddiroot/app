<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { convertToFullName, formatTimestamp } from '$lib/utils';
	import Reply from '@lucide/svelte/icons/reply';
	import ResponseForm from './form.svelte';
	import Self from './response-item.svelte';

	let {
		response,
		threadType,
		data,
		depth = 0
	}: {
		response: any;
		threadType: string;
		data: any;
		depth?: number;
	} = $props();

	let showReplyForm = $state(false);
	const maxDepth = 3; // Maximum nesting depth

	const authorName = $derived(() =>
		convertToFullName(response.user.firstName, response.user.middleName, response.user.lastName)
	);

	function toggleReplyForm() {
		showReplyForm = !showReplyForm;
	}

	function closeReplyForm() {
		showReplyForm = false;
	}
</script>

<div class={depth > 0 ? 'border-muted-foreground border-l-2 pl-8' : ''}>
	<Card.Root
		class="border-l-4 {response.response.type === 'answer' && depth === 0
			? 'border-l-primary'
			: 'border-l-secondary'} shadow-sm"
	>
		<Card.Header class="pb-3">
			<div class="flex items-center gap-3">
				<Avatar.Root class="h-9 w-9">
					<Avatar.Image src={response.user.avatarUrl || ''} alt={authorName()} />
					<Avatar.Fallback class="text-xs font-medium">
						{authorName()
							.split(' ')
							.map((n) => n[0])
							.join('')
							.substring(0, 2)
							.toUpperCase()}
					</Avatar.Fallback>
				</Avatar.Root>
				<div class="flex-1 space-y-1">
					<div class="flex items-center gap-2">
						<span class="text-muted-foreground text-sm">
							by {authorName()}
						</span>
						<span class="text-muted-foreground text-xs">
							{formatTimestamp(response.response.createdAt)}
						</span>
					</div>
				</div>
			</div>
		</Card.Header>
		<Card.Content>
			<div class="prose dark:prose-invert max-w-none text-sm">
				{@html response.response.content || 'No content available'}
			</div>

			<!-- Reply button -->
			{#if depth < maxDepth}
				<div class="mt-3 border-t border-gray-100 pt-3">
					<Button
						variant="ghost"
						size="sm"
						onclick={toggleReplyForm}
						class="text-muted-foreground hover:text-foreground text-xs"
					>
						<Reply class="mr-1 h-3 w-3" />
						Reply
					</Button>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Reply form -->
	{#if showReplyForm && depth < maxDepth}
		<ResponseForm
			{data}
			{threadType}
			parentResponseId={response.response.id}
			parentAuthor={authorName()}
			isReply={true}
			onSuccess={closeReplyForm}
			onCancel={closeReplyForm}
		/>
	{/if}

	<!-- Nested replies -->
	{#if response.replies && response.replies.length > 0}
		<div class="mt-4 space-y-4">
			{#each response.replies as reply}
				<Self response={reply} {threadType} {data} depth={depth + 1} />
			{/each}
		</div>
	{/if}
</div>
