<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import { Check } from '@lucide/svelte';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';

	interface Option {
		value: string | number;
		label: string;
	}

	interface Props {
		options: Option[];
		value?: string | number;
		placeholder?: string;
		searchPlaceholder?: string;
		emptyText?: string;
		onselect?: (option: Option) => void;
		disabled?: boolean;
		class?: string;
	}

	let {
		options,
		value = $bindable(),
		placeholder = 'Select an option...',
		searchPlaceholder = 'Search...',
		emptyText = 'No results found.',
		onselect,
		disabled = false,
		class: className = '',
	}: Props = $props();

	let open = $state(false);
	let searchValue = $state('');

	// Find the selected option's label
	const selectedLabel = $derived(() => {
		const selected = options.find((option) => option.value === value);
		return selected?.label || placeholder;
	});

	// Filter options based on search
	const filteredOptions = $derived(() => {
		if (!searchValue) return options;
		return options.filter((option) =>
			option.label.toLowerCase().includes(searchValue.toLowerCase()),
		);
	});

	function handleSelect(selectedOption: Option) {
		value = selectedOption.value;
		onselect?.(selectedOption);
		open = false;
		searchValue = '';
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!open) {
			searchValue = '';
		}
	}
</script>

<Popover.Root bind:open onOpenChange={handleOpenChange}>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				role="combobox"
				aria-expanded={open}
				class={cn('w-full justify-between', className)}
				{disabled}
			>
				<span class="truncate">{selectedLabel()}</span>
				<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-full p-0" align="start">
		<Command.Root>
			<Command.Input placeholder={searchPlaceholder} bind:value={searchValue} />
			<Command.Empty>{emptyText}</Command.Empty>
			<Command.Group class="max-h-[200px] overflow-auto">
				{#each filteredOptions() as option (option.value)}
					<Command.Item
						value={option.label}
						onSelect={() => handleSelect(option)}
						class="cursor-pointer"
					>
						<Check
							class={cn(
								'mr-2 h-4 w-4',
								value === option.value ? 'opacity-100' : 'opacity-0',
							)}
						/>
						{option.label}
					</Command.Item>
				{/each}
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
