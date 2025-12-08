<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { WithElementRef, WithoutChildren } from '$lib/utils.js';
	import { cn } from "$lib/utils.js";
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
	import type { HTMLTextareaAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		value = $bindable(),
		reset = $bindable(false),
		class: className,
		"data-slot": dataSlot = "textarea",
		placeholder,
		disabled = false,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> & { reset?: boolean } = $props();

	let element: HTMLDivElement;
	let editor = $state<Editor>();
	let editorState = $state(0);

	const isActive = (name: string) => {
		editorState;
		return editor?.isActive(name) ?? false;
	};

	onMount(() => {
		editor = new Editor({
			element,
			extensions: [
				StarterKit,
				Placeholder.configure({
					placeholder: placeholder || ''
				})
			],
			content: (value as string) || '',
			editable: !disabled,
			onUpdate: ({ editor }) => {
							value = editor.isEmpty ? '' : editor.getHTML();
			},
			onTransaction: () => {
				editorState = (editorState + 1) % 1000;
			},
			editorProps: {
				attributes: {
					class: 'p-3 prose dark:prose-invert focus:outline-none min-h-16 max-w-none break-words text-base md:text-sm'
				}
			}
		});
	});

	onDestroy(() => {
		editor?.destroy();
	});

	$effect(() => {
		if (editor) {
			editor.setEditable(!disabled);
		}
	});

	$effect(() => {
		if (reset && editor) {
			editor.commands.setContent('');
			reset = false;
		}
	});
</script>

<div
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		"border-input focus-within:border-ring focus-within:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 shadow-xs w-full rounded-md border bg-transparent transition-[color,box-shadow] focus-within:ring-[3px]",
		disabled && "cursor-not-allowed opacity-50",
		className
	)}
>
	{#if restProps.name}
		<input type="hidden" name={restProps.name} value={value || ''} />
	{/if}
	{#if editor && !disabled}
		<div class="flex items-center gap-x-1 border-b px-3 py-2">
			<Button
				type="button"
				onmousedown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run(); }}
				variant={isActive('bold') ? 'default' : 'ghost'}
				size="sm"
			>
				<BoldIcon class="h-4 w-4" />
			</Button>
			<Button
				type="button"
				onmousedown={(e) => { e.preventDefault(); editor?.chain().focus().toggleItalic().run(); }}
				variant={isActive('italic') ? 'default' : 'ghost'}
				size="sm"
			>
				<ItalicIcon class="h-4 w-4" />
			</Button>
			<Button
				type="button"
				onmousedown={(e) => { e.preventDefault(); editor?.chain().focus().toggleCodeBlock().run(); }}
				variant={isActive('codeBlock') ? 'default' : 'ghost'}
				size="sm"
			>
				<CodeIcon class="h-4 w-4" />
			</Button>
			<Button
				type="button"
				onmousedown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBlockquote().run(); }}
				variant={isActive('blockquote') ? 'default' : 'ghost'}
				size="sm"
			>
				<QuoteIcon class="h-4 w-4" />
			</Button>
			<Button
				type="button"
				onmousedown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run(); }}
				variant={isActive('bulletList') ? 'default' : 'ghost'}
				size="sm"
			>
				<ListIcon class="h-4 w-4" />
			</Button>
			<Button
				type="button"
				onmousedown={(e) => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run(); }}
				variant={isActive('orderedList') ? 'default' : 'ghost'}
				size="sm"
			>
				<ListOrderedIcon class="h-4 w-4" />
			</Button>
		</div>
	{/if}
	<div bind:this={element}></div>
</div>
