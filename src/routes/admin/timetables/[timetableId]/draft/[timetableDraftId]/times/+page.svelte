<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge } from '$lib/components/ui/badge';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { formatTime } from '$lib/utils';
	import CalendarRange from '@lucide/svelte/icons/calendar-range';
	import Clock from '@lucide/svelte/icons/clock';
	import InfoIcon from '@lucide/svelte/icons/info';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import RepeatIcon from '@lucide/svelte/icons/repeat';
	import TimerIcon from '@lucide/svelte/icons/timer';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { addPeriodSchema, updateCycleWeeksRepeatSchema } from './schema.js';

	let { data } = $props();

	let updateCycleWeeksRepeatFormElement: HTMLFormElement;
	let infoDialogOpen = $state(false);

	let dataAddPeriodForm = () => data.addPeriodForm;
	const addPeriodForm = superForm(dataAddPeriodForm(), {
		validators: zod4(addPeriodSchema),
		resetForm: true,
	});
	const { form: addPeriodData, enhance: addPeriodEnhance } = addPeriodForm;

	let dataUpdateCycleWeeksRepeatForm = () => data.updateCycleWeeksRepeatForm;
	const updateCycleWeeksRepeatForm = superForm(
		dataUpdateCycleWeeksRepeatForm(),
		{ validators: zod4(updateCycleWeeksRepeatSchema), resetForm: false },
	);
	const {
		form: updateCycleWeeksRepeatData,
		enhance: updateCycleWeeksRepeatEnhance,
	} = updateCycleWeeksRepeatForm;

	const PRESET_DURATIONS = [30, 45, 50, 60] as const;
	const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;

	function normaliseTimeInput(time: string): string | null {
		if (!time) return null;
		const match = /^(\d{1,2}):(\d{2})/.exec(time);
		if (!match) return null;

		const h = Number(match[1]);
		const m = Number(match[2]);
		if (Number.isNaN(h) || Number.isNaN(m) || h > 23 || m > 59) return null;

		return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
	}

	function timeToMinutes(time: string): number | null {
		const normalised = normaliseTimeInput(time);
		if (normalised === null) return null;
		const [h, m] = normalised.split(':').map(Number);
		return h * 60 + m;
	}

	function minutesToTime(minutes: number): string {
		const m = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
		const h = Math.floor(m / 60);
		const mm = m % 60;
		return `${h.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
	}

	const sortedPeriods = $derived(
		[...data.periods].sort((a, b) => a.start.localeCompare(b.start)),
	);

	const periodCount = $derived(sortedPeriods.length);
	const totalInstructionMinutes = $derived(
		sortedPeriods.reduce((sum, p) => sum + (p.duration ?? 0), 0),
	);
	const dayStart = $derived(
		sortedPeriods.length > 0 ? sortedPeriods[0].start : null,
	);
	const dayEnd = $derived(
		sortedPeriods.length > 0
			? sortedPeriods[sortedPeriods.length - 1].end
			: null,
	);
	const lastPeriodEnd = $derived(dayEnd);

	const livePreviewMinutes = $derived.by(() => {
		const start = timeToMinutes($addPeriodData.start);
		const end = timeToMinutes($addPeriodData.end);
		if (start === null || end === null) return null;
		const diff = end - start;
		return diff > 0 ? diff : null;
	});

	function applyPreset(durationMinutes: number) {
		const start = timeToMinutes($addPeriodData.start);
		if (start === null) return;
		$addPeriodData.end = minutesToTime(start + durationMinutes);
	}

	function addMinutesToStart(minutes: number) {
		const start = timeToMinutes($addPeriodData.start);
		if (start === null) return;
		$addPeriodData.start = minutesToTime(start + minutes);
	}

	function fillStartFromLastPeriod() {
		if (!lastPeriodEnd) return;
		const start = normaliseTimeInput(lastPeriodEnd);
		if (start === null) return;
		$addPeriodData.start = start;
		const startMin = timeToMinutes(start);
		if (startMin !== null && !$addPeriodData.end) {
			$addPeriodData.end = minutesToTime(startMin + 60);
		}
	}

	function gapBetween(prev: { end: string }, next: { start: string }): number {
		const e = timeToMinutes(prev.end);
		const s = timeToMinutes(next.start);
		if (e === null || s === null) return 0;
		return s - e;
	}

	function formatMinutes(mins: number): string {
		if (mins < 60) return `${mins} min`;
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		return m === 0 ? `${h}h` : `${h}h ${m}m`;
	}
</script>

<div class="space-y-6 p-6">
	<!-- Page header -->
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div class="space-y-1">
			<h1 class="text-3xl font-bold tracking-tight">Timetable Times</h1>
			<p class="text-muted-foreground text-sm">
				Define the rhythm of your school week — how many weeks repeat, and the
				periods that make up each day.
			</p>
		</div>
		<Button
			type="button"
			variant="outline"
			size="icon"
			onclick={() => (infoDialogOpen = true)}
			aria-label="About timetable times"
		>
			<InfoIcon />
		</Button>
	</div>

	<!-- Summary cards -->
	<div class="grid gap-4 md:grid-cols-3">
		<Card.Root>
			<Card.Header
				class="flex flex-row items-center justify-between space-y-0 pb-2"
			>
				<Card.Title class="text-sm font-medium">Cycle length</Card.Title>
				<div class="bg-primary/10 rounded-lg p-2">
					<RepeatIcon class="text-primary h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">
					{$updateCycleWeeksRepeatData.cycleWeeksRepeat}
					<span class="text-muted-foreground text-base font-normal">
						week{$updateCycleWeeksRepeatData.cycleWeeksRepeat === 1 ? '' : 's'}
					</span>
				</div>
				<p class="text-muted-foreground text-xs">Before the schedule repeats</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header
				class="flex flex-row items-center justify-between space-y-0 pb-2"
			>
				<Card.Title class="text-sm font-medium">Days in cycle</Card.Title>
				<div class="bg-primary/10 rounded-lg p-2">
					<CalendarRange class="text-primary h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.days.length}</div>
				<p class="text-muted-foreground text-xs">
					{$updateCycleWeeksRepeatData.cycleWeeksRepeat} × 5 weekdays
				</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header
				class="flex flex-row items-center justify-between space-y-0 pb-2"
			>
				<Card.Title class="text-sm font-medium">Periods per day</Card.Title>
				<div class="bg-primary/10 rounded-lg p-2">
					<LayersIcon class="text-primary h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{periodCount}</div>
				<p class="text-muted-foreground text-xs">
					{#if dayStart && dayEnd}
						{formatTime(dayStart)} – {formatTime(dayEnd)} · {formatMinutes(
							totalInstructionMinutes,
						)} of class
					{:else}
						No periods configured yet
					{/if}
				</p>
			</Card.Content>
		</Card.Root>
	</div>

	<div class="grid gap-6 lg:grid-cols-3">
		<!-- Cycle weeks card -->
		<Card.Root class="lg:col-span-1">
			<Card.Header>
				<Card.Title>Cycle weeks</Card.Title>
				<Card.Description>
					How many weeks the timetable runs before repeating. Most schools use
					1; two-week timetables are common in secondary schools.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<form
					method="POST"
					bind:this={updateCycleWeeksRepeatFormElement}
					action="?/updateCycleWeeksRepeat"
					class="space-y-4"
					use:updateCycleWeeksRepeatEnhance
				>
					<Form.Field form={updateCycleWeeksRepeatForm} name="cycleWeeksRepeat">
						<Form.Control>
							{#snippet children({ props })}
								<Label for="cycleWeeksRepeat" class="text-sm font-medium">
									Number of weeks
								</Label>
								<div class="flex items-center gap-3">
									<Input
										{...props}
										id="cycleWeeksRepeat"
										type="number"
										min="1"
										max="4"
										class="w-28"
										bind:value={$updateCycleWeeksRepeatData.cycleWeeksRepeat}
										onchange={() => {
											updateCycleWeeksRepeatFormElement.requestSubmit();
										}}
									/>
									<span class="text-muted-foreground text-sm">
										week{$updateCycleWeeksRepeatData.cycleWeeksRepeat !== 1
											? 's'
											: ''}
									</span>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<!-- Visual preview -->
					<div class="space-y-2">
						<p
							class="text-muted-foreground text-xs font-medium tracking-wide uppercase"
						>
							Cycle preview
						</p>
						<div class="space-y-2">
							{#each Array($updateCycleWeeksRepeatData.cycleWeeksRepeat) as _, weekIdx (weekIdx)}
								<div class="flex items-center gap-2">
									<span
										class="text-muted-foreground w-12 shrink-0 text-xs font-medium"
									>
										Week {weekIdx + 1}
									</span>
									<div class="flex flex-1 gap-1">
										{#each DAY_NAMES as day (day)}
											<div
												class="bg-primary/10 text-primary flex flex-1 items-center justify-center rounded-md py-1.5 text-xs font-medium"
											>
												{day}
											</div>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<!-- Periods card -->
		<Card.Root class="lg:col-span-2">
			<Card.Header>
				<Card.Title>Daily periods</Card.Title>
				<Card.Description>
					The blocks of time that make up each day. The same set of periods
					applies to every day in the cycle.
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<!-- Add period form -->
				<form
					method="POST"
					action="?/updatePeriods"
					class="space-y-3"
					use:addPeriodEnhance
				>
					<div class="flex flex-wrap items-end gap-3">
						<Form.Field form={addPeriodForm} name="start">
							<Form.Control>
								{#snippet children({ props })}
									<div class="grid gap-1.5">
										<Label for="start" class="text-xs">Start time</Label>
										<Input
											{...props}
											id="start"
											type="time"
											class="w-32"
											bind:value={$addPeriodData.start}
										/>
									</div>
								{/snippet}
							</Form.Control>
						</Form.Field>

						<Form.Field form={addPeriodForm} name="end">
							<Form.Control>
								{#snippet children({ props })}
									<div class="grid gap-1.5">
										<Label for="end" class="text-xs">End time</Label>
										<Input
											{...props}
											id="end"
											type="time"
											class="w-32"
											bind:value={$addPeriodData.end}
										/>
									</div>
								{/snippet}
							</Form.Control>
						</Form.Field>

						<div class="grid gap-1.5">
							<span class="text-xs leading-none font-medium">Duration</span>
							<div
								class="border-input bg-muted/40 flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm"
							>
								<TimerIcon class="text-muted-foreground h-3.5 w-3.5" />
								{#if livePreviewMinutes !== null}
									<span class="font-medium">
										{formatMinutes(livePreviewMinutes)}
									</span>
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</div>
						</div>

						<Button type="submit" disabled={!livePreviewMinutes}>
							<PlusIcon />
							Add period
						</Button>
					</div>

					<div class="flex flex-wrap items-center gap-2">
						<span class="text-muted-foreground text-xs font-medium">
							Quick set duration:
						</span>
						{#each PRESET_DURATIONS as mins (mins)}
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={!$addPeriodData.start}
								onclick={() => applyPreset(mins)}
							>
								{mins} min
							</Button>
						{/each}
						{#if lastPeriodEnd}
							<Separator orientation="vertical" class="h-5" />
							<Button
								type="button"
								variant="outline"
								size="sm"
								onclick={fillStartFromLastPeriod}
							>
								<Clock class="h-3.5 w-3.5" />
								Continue from {formatTime(lastPeriodEnd)}
							</Button>
						{/if}
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={!$addPeriodData.start}
							onclick={() => addMinutesToStart(5)}
						>
							+5 min start
						</Button>
					</div>

					<Form.Field form={addPeriodForm} name="start">
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field form={addPeriodForm} name="end">
						<Form.FieldErrors />
					</Form.Field>
				</form>

				<Separator />

				<!-- Periods list -->
				{#if sortedPeriods.length === 0}
					<div
						class="text-muted-foreground flex flex-col items-center gap-2 rounded-md border border-dashed py-10 text-center"
					>
						<Clock class="h-6 w-6 opacity-60" />
						<p class="text-sm font-medium">No periods yet</p>
						<p class="text-xs">
							Add your first period above to start building the day.
						</p>
					</div>
				{:else}
					<ol class="space-y-2">
						{#each sortedPeriods as period, index (period.id)}
							{@const prev = index > 0 ? sortedPeriods[index - 1] : null}
							{@const gap = prev ? gapBetween(prev, period) : 0}
							{#if gap > 0}
								<li
									class="text-muted-foreground flex items-center gap-2 px-1 py-1 text-xs"
								>
									<div class="bg-border h-px flex-1"></div>
									<span class="italic">
										{formatMinutes(gap)} break
									</span>
									<div class="bg-border h-px flex-1"></div>
								</li>
							{/if}
							<li
								class="bg-card hover:bg-accent/40 border-l-primary/60 flex items-center justify-between gap-3 rounded-md border border-l-4 px-4 py-3 transition-colors"
							>
								<div class="flex items-center gap-4">
									<div
										class="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
									>
										{index + 1}
									</div>
									<div>
										<div class="flex items-center gap-2">
											<Clock class="text-muted-foreground h-3.5 w-3.5" />
											<span class="text-sm font-semibold">
												{formatTime(period.start)} – {formatTime(period.end)}
											</span>
										</div>
										{#if period.duration !== null}
											<Badge variant="outline" class="mt-1 text-xs font-normal">
												{formatMinutes(period.duration)}
											</Badge>
										{/if}
									</div>
								</div>
								{#if data.periods.length > 1}
									<form method="POST" action="?/deletePeriod" use:enhance>
										<input type="hidden" name="periodId" value={period.id} />
										<Button
											type="submit"
											variant="ghost"
											size="icon"
											aria-label="Delete period"
										>
											<TrashIcon class="text-destructive h-4 w-4" />
										</Button>
									</form>
								{/if}
							</li>
						{/each}
					</ol>

					{#if data.periods.length === 1}
						<p class="text-muted-foreground text-xs">
							At least one period is required. Add another above before you can
							remove this one.
						</p>
					{/if}
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>

<!-- Info dialog -->
<Dialog.Root bind:open={infoDialogOpen}>
	<Dialog.Content class="md:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>About timetable times</Dialog.Title>
			<Dialog.Description>
				How cycles, days, and periods fit together in eddi.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 text-sm">
			<div class="rounded-md border p-4">
				<p class="font-medium">Cycle weeks</p>
				<p class="text-muted-foreground mt-1">
					The number of weeks the timetable runs before repeating. A "week-A /
					week-B" school uses <span class="text-foreground font-medium">2</span
					>; most use <span class="text-foreground font-medium">1</span>.
				</p>
			</div>
			<div class="rounded-md border p-4">
				<p class="font-medium">Days</p>
				<p class="text-muted-foreground mt-1">
					Five weekdays per week are scheduled automatically — that's <span
						class="text-foreground font-medium"
					>
						{$updateCycleWeeksRepeatData.cycleWeeksRepeat * 5} days
					</span> in your current cycle.
				</p>
			</div>
			<div class="rounded-md border p-4">
				<p class="font-medium">Periods</p>
				<p class="text-muted-foreground mt-1">
					The time blocks within each day. Add as many as you need. A 50-minute
					lesson grid usually has 5–7 periods. The same periods apply to every
					day in the cycle — overlaps and breaks are detected automatically.
				</p>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
