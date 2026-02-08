<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { convertToFullName, formatTimestamp } from '$lib/utils';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import Clock from '@lucide/svelte/icons/clock';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import User from '@lucide/svelte/icons/user';
	import ResponseForm from './form.svelte';
	import LikeButton from './like-button.svelte';
	import ResponseItem from './response-item.svelte';
	import { getThreadTypeDisplay, shouldShowUserInfo } from './utils';

	let { data, form } = $props();
	const thread = $derived(() => data.thread);
	const responses = $derived(() => data.nestedResponses);

	const showAuthorInfo = $derived(() => {
		const currentThread = thread();
		if (!currentThread) return false;
		return shouldShowUserInfo(
			currentThread.thread.isAnonymous,
			data.currentUser.type,
		);
	});

	const authorFullName = $derived(() => {
		const currentThread = thread();
		if (!currentThread || !currentThread.user) return 'Unknown Author';
		if (!showAuthorInfo()) return 'Anonymous';
		return convertToFullName(
			currentThread.user.firstName,
			currentThread.user.middleName,
			currentThread.user.lastName,
		);
	});

	const answers = $derived(
		() =>
			responses()?.filter(
				(r) => r.response.type === 'answer' && !r.response.parentResponseId,
			) || [],
	);
	const comments = $derived(
		() =>
			responses()?.filter(
				(r) => r.response.type === 'comment' && !r.response.parentResponseId,
			) || [],
	);

	let isGeneratingSummary = $state(false);
	let isHidingSummary = $state(false);
</script>

{#if thread()}
	<div class="mx-auto max-w-4xl space-y-4">
		<!-- Show summary if available -->
		{#if form?.summary}
			<Card.Root>
				<Card.Header class="flex items-center justify-between">
					<Card.Title class="text-xl font-bold">Post Summary</Card.Title>
					<Button
						variant="secondary"
						onclick={() => (isHidingSummary = !isHidingSummary)}
					>
						{isHidingSummary ? 'Show Summary' : 'Hide Summary'}
					</Button>
				</Card.Header>
				{#if !isHidingSummary}
					<Card.Content class="leading-relaxed whitespace-pre-wrap">
						{form.summary}
					</Card.Content>
				{/if}
			</Card.Root>
		{/if}
		<!-- Main Thread Card -->
		<Card.Root>
			<Card.Header class="pb-4">
				<div class="flex items-start gap-4">
					<Avatar.Root class="ring-border h-12 w-12 ring-2">
						{#if showAuthorInfo()}
							<Avatar.Image
								src={thread()?.user?.avatarPath || ''}
								alt={authorFullName()}
							/>
							<Avatar.Fallback
								class="bg-primary text-primary-foreground font-semibold"
							>
								{authorFullName()
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
					<div class="flex-1 space-y-3">
						<div class="flex flex-wrap items-center gap-3">
							<Badge class="font-medium">
								{getThreadTypeDisplay(thread()!.thread.type)}
							</Badge>
							<div
								class="text-muted-foreground flex items-center gap-1 text-sm"
							>
								<Clock class="h-3 w-3" />
								{formatTimestamp(thread()!.thread.createdAt)}
							</div>
						</div>
						<div>
							<h1 class="text-2xl leading-tight font-bold">
								{thread()!.thread.title}
							</h1>
							<div
								class="text-muted-foreground mt-1 flex items-center gap-1 text-sm"
							>
								<User class="h-3 w-3" />
								by {authorFullName()}
							</div>
						</div>
					</div>
				</div>
				<Card.Action class="flex gap-2">
					<LikeButton
						action="?/toggleThreadLike"
						size="lg"
						initialLiked={data.threadLikes?.userLiked || false}
						initialCount={data.threadLikes?.count || 0}
					/>
					<form
						method="POST"
						action="?/generateSummary"
						use:enhance={() => {
							isGeneratingSummary = true;

							return async ({ update }) => {
								await update();
								isGeneratingSummary = false;
							};
						}}
					>
						<Button
							variant="outline"
							type="submit"
							size="lg"
							disabled={isGeneratingSummary || !!form?.summary}
						>
							{#if isGeneratingSummary}
								Summarising...
							{:else}
								Summarise Post
							{/if}
						</Button>
					</form>
				</Card.Action>
			</Card.Header>
			<Card.Content>
				<div class="prose dark:prose-invert max-w-none leading-relaxed">
					{@html thread()?.thread.content || 'No content available'}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Answers Section (for questions) -->
		{#if (thread()?.thread.type === 'question' || thread()?.thread.type === 'qanda') && answers().length > 0}
			<div>
				<div class="mb-3 flex items-center gap-2 px-4">
					<CheckCircle class="text-primary h-5 w-5" />
					<h2 class="text-lg font-semibold">Answers ({answers().length})</h2>
				</div>
				<div class="border-t">
					{#each answers() as response}
						<ResponseItem
							{response}
							threadType={thread()?.thread.type || 'discussion'}
							{data}
						/>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Comments Section -->
		{#if comments().length > 0}
			<div>
				<div class="mb-3 flex items-center gap-2 px-4">
					<MessageSquare class="text-primary h-5 w-5" />
					<h2 class="text-lg font-semibold">
						{responses()?.length === comments().length
							? 'Responses'
							: 'Comments'} ({comments().length})
					</h2>
				</div>
				<div class="border-t">
					{#each comments() as response}
						<ResponseItem
							{response}
							threadType={thread()!.thread.type}
							{data}
						/>
					{/each}
				</div>
			</div>
		{/if}

		<!-- No Responses Message -->
		{#if !responses() || responses()!.length === 0}
			<Card.Root class="border-dashed">
				<Card.Content
					class="flex flex-col items-center justify-center py-8 text-center"
				>
					<MessageSquare class="text-muted-foreground mb-3 h-12 w-12" />
					<p class="text-muted-foreground">No responses yet.</p>
					<p class="text-muted-foreground text-sm">
						Be the first to contribute to this discussion!
					</p>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Response Form -->
		{#if data.form}
			<ResponseForm
				data={{ form: data.form }}
				threadType={thread()!.thread.type}
				isOPOnAnonymousThread={thread()?.thread.isAnonymous || false}
				currentUserId={data.currentUser.id}
				threadAuthorId={thread()?.user.id}
				currentUserType={data.currentUser.type}
			/>
		{/if}
	</div>
{:else}
	<div class="flex h-64 items-center justify-center">
		<Card.Root class="border-dashed">
			<Card.Content
				class="flex flex-col items-center justify-center py-8 text-center"
			>
				<MessageSquare class="text-muted-foreground mb-3 h-12 w-12" />
				<p class="text-muted-foreground">Thread not found.</p>
			</Card.Content>
		</Card.Root>
	</div>
{/if}
