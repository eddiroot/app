<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Item from '$lib/components/ui/item';
	import { Input } from '$lib/components/ui/input';
	import { convertToFullName } from '$lib/utils';
	import InfoIcon from '@lucide/svelte/icons/info';
	import Search from '@lucide/svelte/icons/search';
	import UserIcon from '@lucide/svelte/icons/user';
	import UsersIcon from '@lucide/svelte/icons/users';

	let { data } = $props();

	let filter = $state('');
	let infoDialogOpen = $state(false);

	const filteredTeachers = $derived(() => {
		const q = filter.trim().toLowerCase();
		if (!q) return data.teachers;
		return data.teachers.filter((t) => {
			const name = convertToFullName(
				t.firstName,
				t.middleName,
				t.lastName,
			).toLowerCase();
			return name.includes(q) || t.email.toLowerCase().includes(q);
		});
	});

	function getInitials(firstName: string, lastName: string) {
		return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
	}
</script>

<div class="space-y-6 p-6">
	<!-- Page header -->
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight">Teachers</h1>
			<p class="text-muted-foreground text-sm">
				All teachers available to be assigned to activities in this timetable.
			</p>
		</div>
		<Button
			type="button"
			variant="outline"
			size="icon"
			onclick={() => (infoDialogOpen = true)}
			aria-label="About teachers"
		>
			<InfoIcon />
		</Button>
	</div>

	<!-- Summary card -->
	<div class="grid gap-4 md:grid-cols-3">
		<Card.Root>
			<Card.Header
				class="flex flex-row items-center justify-between space-y-0 pb-2"
			>
				<Card.Title class="text-sm font-medium">Total teachers</Card.Title>
				<div class="bg-primary/10 rounded-lg p-2">
					<UsersIcon class="text-primary h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.teachers.length}</div>
				<p class="text-muted-foreground text-xs">
					Available for this timetable
				</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Filter row -->
	<div class="flex items-center gap-3">
		<div class="relative max-w-sm flex-1">
			<Search
				class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
			/>
			<Input
				bind:value={filter}
				placeholder="Filter by name or email..."
				class="pl-9"
			/>
		</div>
	</div>

	<!-- Teachers list -->
	{#if data.teachers.length === 0}
		<Card.Root class="border-dashed">
			<Card.Content class="flex flex-col items-center gap-3 py-12 text-center">
				<div
					class="bg-muted flex h-14 w-14 items-center justify-center rounded-full"
				>
					<UsersIcon class="text-muted-foreground h-6 w-6" />
				</div>
				<div class="space-y-1">
					<p class="text-lg font-semibold">No teachers found</p>
					<p class="text-muted-foreground max-w-sm text-sm">
						Teachers are managed under Admin → Users. Add teachers there and
						they will appear here automatically.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if filteredTeachers().length === 0}
		<Card.Root class="border-dashed">
			<Card.Content class="flex flex-col items-center gap-2 py-10 text-center">
				<Search class="text-muted-foreground h-6 w-6 opacity-60" />
				<p class="text-sm font-medium">No teachers match your filter</p>
				<p class="text-muted-foreground text-sm">
					Try a different name or email.
				</p>
				<Button variant="outline" size="sm" onclick={() => (filter = '')}>
					Clear filter
				</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="space-y-2">
			{#each filteredTeachers() as teacher (teacher.id)}
				<Item.Root variant="outline">
					<Item.Content>
						<div class="flex items-center gap-3">
							<div
								class="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
							>
								{getInitials(teacher.firstName, teacher.lastName)}
							</div>
							<div class="min-w-0">
								<Item.Title class="truncate">
									{convertToFullName(
										teacher.firstName,
										teacher.middleName,
										teacher.lastName,
									)}
								</Item.Title>
								<Item.Description class="truncate">
									{teacher.email}
								</Item.Description>
							</div>
						</div>
					</Item.Content>
				</Item.Root>
			{/each}
		</div>
	{/if}
</div>

<!-- Info dialog -->
<Dialog.Root bind:open={infoDialogOpen}>
	<Dialog.Content class="md:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>About teachers</Dialog.Title>
			<Dialog.Description>
				How teachers are used in this timetable draft.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 text-sm">
			<div class="rounded-md border p-4">
				<p class="font-medium">Where teachers come from</p>
				<p class="text-muted-foreground mt-1">
					Teachers listed here are pulled from your school's user roster. To add
					or remove a teacher, go to <span class="text-foreground font-medium"
						>Admin → Users</span
					> and manage their account there.
				</p>
			</div>
			<div class="rounded-md border p-4">
				<p class="font-medium">Assigning teachers to activities</p>
				<p class="text-muted-foreground mt-1">
					Each activity in a class can be assigned one or more teachers. The
					timetable generator will schedule those teachers accordingly and flag
					any conflicts where the same teacher is assigned to overlapping
					activities.
				</p>
			</div>
			<div class="rounded-md border p-4">
				<p class="font-medium">
					<UserIcon class="mr-1 mb-0.5 inline-block h-3.5 w-3.5" />
					Teacher constraints
				</p>
				<p class="text-muted-foreground mt-1">
					You can add per-teacher constraints (e.g. not available on Monday
					mornings) under the <span class="text-foreground font-medium"
						>Constraints</span
					> tab.
				</p>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
