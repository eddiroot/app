<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { RichTextarea } from '$lib/components/ui/textarea/index.js';
	import { subjectThreadResponseTypeEnum } from '$lib/enums.js';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { formSchema, type FormSchema } from './schema.js';
	import { getResponseTypeDescription } from './utils.js';

	let {
		data,
		threadType,
		parentResponseId = undefined,
		parentAuthor = undefined,
		isReply = false,
		onSuccess = undefined,
		onCancel = undefined
	}: {
		data: { form: SuperValidated<Infer<FormSchema>> };
		threadType: string;
		parentResponseId?: number;
		parentAuthor?: string;
		isReply?: boolean;
		onSuccess?: () => void;
		onCancel?: () => void;
	} = $props();

	const form = superForm(data.form, {
		id: isReply ? `reply-form-${parentResponseId}` : 'main-response-form',
		validators: zod4(formSchema),
		resetForm: true,
		onUpdated: ({ form }) => {
			if (form.valid) {
				resetEditor = true;
				if (isReply && onSuccess) {
					onSuccess();
				}
			}
		}
	});

	const { form: formData, enhance } = form;
	
	let resetEditor = $state(false);

</script>

<div class={isReply ? 'mt-4 border-l-2 border-gray-200 pl-4' : 'mt-6 border-t pt-6'}>
	<div class="mb-4">
		<h3 class="text-lg font-semibold">
			{isReply ? `Reply to ${parentAuthor || 'comment'}` : 'Add a Response'}
		</h3>
		<p class="text-muted-foreground text-sm">
			{isReply
				? 'Respond to this comment or answer'
				: threadType === 'question' || threadType === 'qanda'
					? 'Help answer this question or add a comment'
					: 'Share your thoughts on this discussion'}
		</p>
	</div>
	<form method="POST" action="?/addResponse" class="space-y-4" use:enhance>
		<input type="hidden" name="parentResponseId" value={parentResponseId || ''} />
		<input type="hidden" name="type" value={$formData.type} />

		{#if (threadType === 'question' || threadType === 'qanda') && !isReply}
			<Form.Field {form} name="type">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Response Type</Form.Label>
						<Select.Root
							type="single"
							value={$formData.type}
							onValueChange={(value: string | undefined) => {
								if (
									value &&
									(value == subjectThreadResponseTypeEnum.answer ||
										value == subjectThreadResponseTypeEnum.comment)
								) {
									$formData.type = value;
								}
							}}
						>
							<Select.Trigger {...props}>
								<div class="flex items-center gap-2">
									{#if $formData.type === 'answer'}
										<CheckCircle class="text-primary h-4 w-4" />
										Answer
									{:else}
										<MessageSquare class="text-primary h-4 w-4" />
										Comment
									{/if}
								</div>
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="answer" label="Answer">
									<div class="flex items-center gap-2">
										<CheckCircle class="text-primary h-4 w-4" />
										<div class="flex flex-col">
											<span class="font-medium">Answer</span>
											<span class="text-muted-foreground text-xs">Provide a solution</span>
										</div>
									</div>
								</Select.Item>
								<Select.Item value="comment" label="Comment">
									<div class="flex items-center gap-2">
										<MessageSquare class="text-primary h-4 w-4" />
										<div class="flex flex-col">
											<span class="font-medium">Comment</span>
											<span class="text-muted-foreground text-xs">Ask or discuss</span>
										</div>
									</div>
								</Select.Item>
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.Description>{getResponseTypeDescription($formData.type)}</Form.Description>
				<Form.FieldErrors />
			</Form.Field>
		{/if}

		<Form.Field {form} name="content">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>
						{$formData.type === 'answer' ? 'Your Answer' : 'Your Comment'}
					</Form.Label>
					<RichTextarea
						{...props}
						bind:value={$formData.content}
						bind:reset={resetEditor}
						placeholder={`Write your ${$formData.type} here...`}
						class="min-h-24"
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<div class="flex justify-end gap-2">
			{#if isReply && onCancel}
				<Button type="button" variant="outline" onclick={onCancel}>Cancel</Button>
			{/if}
			<Button type="submit" class="flex items-center gap-2">
				{#if isReply}
					<MessageSquare />
					Post Reply
				{:else if $formData.type === 'answer'}
					<CheckCircle />
					Post Answer
				{:else}
					<MessageSquare />
					Post Comment
				{/if}
			</Button>
		</div>
	</form>
</div>
