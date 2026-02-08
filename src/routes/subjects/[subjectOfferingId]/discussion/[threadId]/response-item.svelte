<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { convertToFullName, formatTimestamp } from '$lib/utils';
	import Reply from '@lucide/svelte/icons/reply';
	import User from '@lucide/svelte/icons/user';
	import ResponseForm from './form.svelte';
	import LikeButton from './like-button.svelte';
	import Self from './response-item.svelte';
	import { shouldShowResponseUserInfo } from './utils';

	let {
		response,
		threadType,
		data,
		depth = 0,
	}: {
		response: any;
		threadType: string;
		data: any;
		depth?: number;
	} = $props();

	let showReplyForm = $state(false);
	const maxDepth = 3; // Maximum nesting depth

	const isOPResponse = $derived(() => {
		return data.thread?.user?.id === response.user.id;
	});

	const showAuthorInfo = $derived(() => {
		return shouldShowResponseUserInfo(
			response.response.isAnonymous,
			data.thread?.thread?.isAnonymous || false,
			isOPResponse(),
			data.currentUser.type,
		);
	});

	const authorName = $derived(() => {
		if (!showAuthorInfo()) {
			return isOPResponse() ? 'OP (Anonymous)' : 'Anonymous';
		}
		return convertToFullName(
			response.user.firstName,
			response.user.middleName,
			response.user.lastName,
		);
	});

	function toggleReplyForm() {
		showReplyForm = !showReplyForm;
	}

	function closeReplyForm() {
		showReplyForm = false;
	}

	const responseLikeInfo = $derived(() => {
		const likeData = data.responseLikes?.find(
			(like: any) => like.responseId === response.response.id,
		);
		return likeData || { count: 0, userLiked: false };
	});
</script>

<div
	class="border-b px-4 py-3 last:border-b-0 {depth > 0
		? 'border-muted-foreground border-l-2 pl-6'
		: ''} {response.response.type === 'answer' && depth === 0
		? 'border-l-primary border-l-4 pl-4'
		: ''}"
>
	<div class="flex items-start gap-3">
		<Avatar.Root class="h-8 w-8">
			{#if showAuthorInfo()}
				<Avatar.Image src={response.user.avatarPath || ''} alt={authorName()} />
				<Avatar.Fallback class="text-xs font-medium">
					{authorName()
						.split(' ')
						.map((n) => n[0])
						.join('')
						.substring(0, 2)
						.toUpperCase()}
				</Avatar.Fallback>
			{:else}
				<Avatar.Fallback class="bg-muted text-muted-foreground">
					<User />
				</Avatar.Fallback>
			{/if}
		</Avatar.Root>
		<div class="min-w-0 flex-1">
			<div class="mb-1 flex items-center gap-2">
				<span class="text-sm font-medium">
					{authorName()}
				</span>
				<span class="text-muted-foreground text-xs">
					{formatTimestamp(response.response.createdAt)}
				</span>
				{#if response.response.type === 'answer' && depth === 0}
					<span class="text-primary text-xs font-medium">Answer</span>
				{/if}
			</div>
			<div class="prose dark:prose-invert max-w-none text-sm">
				{@html response.response.content || 'No content available'}
			</div>

			<!-- Action buttons -->
			<div class="mt-2 flex items-center gap-1">
				<LikeButton
					action="?/toggleResponseLike"
					itemId={response.response.id}
					initialLiked={responseLikeInfo().userLiked}
					initialCount={responseLikeInfo().count}
					size="sm"
				/>
				{#if depth < maxDepth}
					<Button
						variant="ghost"
						size="sm"
						onclick={toggleReplyForm}
						class="text-muted-foreground hover:text-foreground text-xs"
					>
						<Reply class="mr-1 h-3 w-3" />
						Reply
					</Button>
				{/if}
			</div>
		</div>
	</div>

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
			isOPOnAnonymousThread={data.thread?.thread?.isAnonymous || false}
			currentUserId={data.currentUser.id}
			threadAuthorId={data.thread?.user?.id}
			currentUserType={data.currentUser.type}
		/>
	{/if}

	<!-- Nested replies -->
	{#if response.replies && response.replies.length > 0}
		<div>
			{#each response.replies as reply}
				<Self response={reply} {threadType} {data} depth={depth + 1} />
			{/each}
		</div>
	{/if}
</div>
