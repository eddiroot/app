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

	let element: HTMLDivElement;
	let editorBox = $state.raw<{ current: Editor }>();
	let isEditable = $state(viewMode == ViewMode.CONFIGURE);

	onMount(() => {
		editorBox = {
			current: new Editor({
				element,
				extensions: [StarterKit],
				content: config.html,
				editable: isEditable,
				onTransaction: () => {
					editorBox = { current: editorBox!.current };
				},
				onUpdate: ({ editor }) => {
					onConfigUpdate({
						html: editor.getHTML()
					});
				},
				editorProps: {
					attributes: {
						class: 'p-6 prose dark:prose-invert focus:outline-none min-h-32 max-w-none break-words'
					}
				}
			})
		};
	});

	onDestroy(() => {
		if (editorBox?.current) {
			editorBox.current.destroy();
		}
	});

	// DO NOT REMOVE: This is necessary to ensure that the editor is editable when the viewMode changes
	$effect(() => {
		isEditable = viewMode == ViewMode.CONFIGURE;
		if (isEditable && editorBox?.current) {
			editorBox.current.setEditable(true);
		} else if (editorBox?.current) {
			editorBox.current.setEditable(false);
		}
	});
</script>

<div class="rounded-md border">
	{#if editorBox?.current && isEditable}
		<div class="flex items-center gap-x-1 border-b px-6 py-4">
			<Button
				onclick={() => editorBox?.current.chain().focus().toggleBold().run()}
				variant={editorBox.current.isActive('bold') ? 'default' : 'ghost'}
			>
				<BoldIcon />
			</Button>
			<Button
				onclick={() => editorBox?.current.chain().focus().toggleItalic().run()}
				variant={editorBox.current.isActive('italic') ? 'default' : 'ghost'}
			>
				<ItalicIcon />
			</Button>
			<Button
				onclick={() => editorBox?.current.chain().focus().toggleCodeBlock().run()}
				variant={editorBox.current.isActive('codeBlock') ? 'default' : 'ghost'}
			>
				<CodeIcon />
			</Button>
			<Button
				onclick={() => editorBox?.current.chain().focus().toggleBlockquote().run()}
				variant={editorBox.current.isActive('blockquote') ? 'default' : 'ghost'}
			>
				<QuoteIcon />
			</Button>
			<Button
				onclick={() => editorBox?.current.chain().focus().toggleBulletList().run()}
				variant={editorBox.current.isActive('bulletList') ? 'default' : 'ghost'}
			>
				<ListIcon />
			</Button>
			<Button
				onclick={() => editorBox?.current.chain().focus().toggleOrderedList().run()}
				variant={editorBox.current.isActive('orderedList') ? 'default' : 'ghost'}
			>
				<ListOrderedIcon />
			</Button>
		</div>
	{/if}

	<div bind:this={element}></div>
</div>
