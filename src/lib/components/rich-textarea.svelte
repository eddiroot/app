<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { WithElementRef, WithoutChildren } from '$lib/utils';
	import { cn } from '$lib/utils';
	import BoldIcon from '@lucide/svelte/icons/bold';
	import CodeIcon from '@lucide/svelte/icons/code';
	import ItalicIcon from '@lucide/svelte/icons/italic';
	import ListIcon from '@lucide/svelte/icons/list';
	import ListOrderedIcon from '@lucide/svelte/icons/list-ordered';
	import QuoteIcon from '@lucide/svelte/icons/quote';
	import { Editor } from '@tiptap/core';
	import Placeholder from '@tiptap/extension-placeholder';
	import StarterKit from '@tiptap/starter-kit';
	import { onDestroy, onMount } from 'svelte';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		value = $bindable(),
		reset = $bindable(false),
		class: className,
		'data-slot': dataSlot = 'textarea',
		placeholder,
		disabled = false,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> & {
		reset?: boolean;
	} = $props();

	let element: HTMLDivElement;
	let editorBox = $state<{ current: Editor | undefined }>({
		current: undefined,
	});

	const isActive = (name: string) => {
		return editorBox.current?.isActive(name) ?? false;
	};

	onMount(() => {
		editorBox.current = new Editor({
			element,
			extensions: [
				StarterKit,
				Placeholder.configure({
					emptyEditorClass:
						'before:content-[attr(data-placeholder)] before:float-left before:text-muted-foreground before:h-0 before:pointer-events-none',
					placeholder: placeholder || '',
				}),
			],
			content: (value as string) || '',
			editable: !disabled,
			onUpdate: ({ editor }) => {
				value = editor.isEmpty ? '' : editor.getHTML();
			},
			onTransaction: () => {
				editorBox = { current: editorBox.current };
			},
			editorProps: {
				attributes: {
					class:
						'p-3 prose dark:prose-invert max-w-none focus:outline-none min-h-16 text-sm text-primary-foreground',
				},
			},
		});
	});

	onDestroy(() => {
		editorBox.current?.destroy();
	});

	$effect(() => {
		if (editorBox.current) {
			editorBox.current.setEditable(!disabled);
		}
	});

	$effect(() => {
		if (reset && editorBox.current) {
			editorBox.current.commands.setContent('');
			value = '';
			reset = false;
		}
	});
</script>

<div
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		'border-input focus-within:border-ring focus-within:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 w-full rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] focus-within:ring-[3px]',
		disabled && 'cursor-not-allowed opacity-50',
		className,
	)}
>
	{#if restProps.name}
		<input type="hidden" name={restProps.name} value={value || ''} />
	{/if}
	{#if editorBox.current && !disabled}
		<div class="flex items-center gap-x-1 border-b px-3 py-2">
			<Button
				type="button"
				onmousedown={(e) => {
					e.preventDefault();
					editorBox.current?.chain().focus().toggleBold().run();
				}}
				variant={isActive('bold') ? 'default' : 'ghost'}
				size="sm"
			>
				<BoldIcon class="h-4 w-4" />
			</Button>
			<Button
				type="button"
				onmousedown={(e) => {
					e.preventDefault();
					editorBox.current?.chain().focus().toggleItalic().run();
				}}
				variant={isActive('italic') ? 'default' : 'ghost'}
				size="sm"
			>
				<ItalicIcon class="h-4 w-4" />
			</Button>
			<Button
				type="button"
				onmousedown={(e) => {
					e.preventDefault();
					editorBox.current?.chain().focus().toggleCodeBlock().run();
				}}
				variant={isActive('codeBlock') ? 'default' : 'ghost'}
				size="sm"
			>
				<CodeIcon class="h-4 w-4" />
			</Button>
			<Button
				type="button"
				onmousedown={(e) => {
					e.preventDefault();
					editorBox.current?.chain().focus().toggleBlockquote().run();
				}}
				variant={isActive('blockquote') ? 'default' : 'ghost'}
				size="sm"
			>
				<QuoteIcon class="h-4 w-4" />
			</Button>
			<Button
				type="button"
				onmousedown={(e) => {
					e.preventDefault();
					editorBox.current?.chain().focus().toggleBulletList().run();
				}}
				variant={isActive('bulletList') ? 'default' : 'ghost'}
				size="sm"
			>
				<ListIcon class="h-4 w-4" />
			</Button>
			<Button
				type="button"
				onmousedown={(e) => {
					e.preventDefault();
					editorBox.current?.chain().focus().toggleOrderedList().run();
				}}
				variant={isActive('orderedList') ? 'default' : 'ghost'}
				size="sm"
			>
				<ListOrderedIcon class="h-4 w-4" />
			</Button>
		</div>
	{/if}
	<div bind:this={element}></div>
</div>
