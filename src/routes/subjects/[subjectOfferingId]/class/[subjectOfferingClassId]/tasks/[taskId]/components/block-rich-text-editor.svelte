<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ViewMode, type RichTextBlockProps } from '$lib/schema/task';
	import BoldIcon from '@lucide/svelte/icons/bold';
	import CodeIcon from '@lucide/svelte/icons/code';
	import ItalicIcon from '@lucide/svelte/icons/italic';
	import ListIcon from '@lucide/svelte/icons/list';
	import ListOrderedIcon from '@lucide/svelte/icons/list-ordered';
	import QuoteIcon from '@lucide/svelte/icons/quote';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import { onDestroy, onMount } from 'svelte';

	let { config, onConfigUpdate, viewMode }: RichTextBlockProps = $props();

	let element = $state<HTMLDivElement>();
	let editor = $state.raw<Editor>();

	// Doesn't affect the UI therefore not reactive
	let debounceTimer: ReturnType<typeof setTimeout>;

	onMount(() => {
		editor = new Editor({
			element,
			extensions: [StarterKit],
			content: config.html,
			editable: viewMode === ViewMode.CONFIGURE,
			onUpdate: ({ editor }) => {
				clearTimeout(debounceTimer);

				debounceTimer = setTimeout(() => {
					const newHtml = editor.getHTML();
					if (newHtml !== config.html) {
						onConfigUpdate({ html: newHtml });
					}
				}, 750);
			},
			editorProps: {
				attributes: {
					class:
						'p-6 prose dark:prose-invert focus:outline-none min-h-32 max-w-none break-words text-primary-foreground',
				},
			},
		});
	});

	onDestroy(() => {
		clearTimeout(debounceTimer);
		if (editor) {
			editor.destroy();
		}
	});

	// DO NOT REMOVE: This is necessary to ensure that the editor is editable when the viewMode changes
	$effect(() => {
		if (editor) {
			const shouldBeEditable = viewMode === ViewMode.CONFIGURE;
			if (editor.isEditable !== shouldBeEditable) {
				editor.setEditable(shouldBeEditable);
			}
		}
	});
</script>

<div class="w-full rounded-md border">
	{#if editor && viewMode == ViewMode.CONFIGURE}
		<div class="flex items-center gap-x-1 border-b px-6 py-4">
			<Button
				onclick={() => editor?.chain().focus().toggleBold().run()}
				variant={editor.isActive('bold') ? 'default' : 'ghost'}
			>
				<BoldIcon />
			</Button>
			<Button
				onclick={() => editor?.chain().focus().toggleItalic().run()}
				variant={editor.isActive('italic') ? 'default' : 'ghost'}
			>
				<ItalicIcon />
			</Button>
			<Button
				onclick={() => editor?.chain().focus().toggleCodeBlock().run()}
				variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
			>
				<CodeIcon />
			</Button>
			<Button
				onclick={() => editor?.chain().focus().toggleBlockquote().run()}
				variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
			>
				<QuoteIcon />
			</Button>
			<Button
				onclick={() => editor?.chain().focus().toggleBulletList().run()}
				variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
			>
				<ListIcon />
			</Button>
			<Button
				onclick={() => editor?.chain().focus().toggleOrderedList().run()}
				variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
			>
				<ListOrderedIcon />
			</Button>
		</div>
	{/if}

	<div bind:this={element}></div>
</div>
