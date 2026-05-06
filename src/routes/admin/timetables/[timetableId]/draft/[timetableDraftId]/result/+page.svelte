<script lang="ts">
	import { enhance } from '$app/forms';
	import TypeBadge from '$lib/components/type-badge.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Progress } from '$lib/components/ui/progress';
	import { Separator } from '$lib/components/ui/separator';
	import * as Tabs from '$lib/components/ui/tabs';
	import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import CalendarOff from '@lucide/svelte/icons/calendar-off';
	import Clock from '@lucide/svelte/icons/clock';
	import DoorOpen from '@lucide/svelte/icons/door-open';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Search from '@lucide/svelte/icons/search';
	import UserSearch from '@lucide/svelte/icons/user-search';
	import Users from '@lucide/svelte/icons/users';
	import * as Select from '$lib/components/ui/select';
	import type { ActionData, PageData } from './$types';
	import { studentColumns } from './student-columns';
	import StudentDataTable from './student-data-table.svelte';
	import { teacherColumns } from './teacher-columns';
	import TeacherDataTable from './teacher-data-table.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let activeSection = $state<string>('overall');
	let searchQuery = $state('');
	let isSearching = $state(false);
	let isLoadingTimetable = $state(false);
	let selectedSpaceId = $state('');
	let isLoadingRoomTimetable = $state(false);

	const navItems = [
		{ id: 'overall', label: 'Overall', icon: BarChart3 },
		{ id: 'students', label: 'Students', icon: GraduationCap },
		{ id: 'teachers', label: 'Teachers', icon: Users },
		{ id: 'student-timetable', label: 'Student Timetable', icon: CalendarDays },
		{ id: 'room-timetable', label: 'Room Timetable', icon: DoorOpen },
	] as const;

	const dayNameShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	function friendlyDayName(raw: string, dayNumber: number): string {
		if (raw && !raw.startsWith('Day ')) return raw;
		return dayNameShort[dayNumber] ?? raw;
	}

	const dayUtilEntries = $derived(
		Object.entries(data.summary?.dayUtilization ?? {}).map(([key, value]) => ({
			key,
			...value,
		})),
	);
	const maxDayHours = $derived(
		Math.max(1, ...dayUtilEntries.map((d) => d.averageStudentHours)),
	);
</script>

<div class="space-y-6 p-6">
	<div class="space-y-1">
		<h1 class="text-3xl font-bold tracking-tight">Timetable Results</h1>
		<p class="text-muted-foreground text-sm">
			Statistics and per-user schedules for the generated timetable.
		</p>
	</div>

	<Tabs.Root bind:value={activeSection}>
		<Tabs.List class="grid w-full grid-cols-5">
			{#each navItems as item (item.id)}
				<Tabs.Trigger value={item.id} class="flex items-center gap-2">
					<item.icon class="h-4 w-4" />
					<span class="hidden sm:inline">{item.label}</span>
				</Tabs.Trigger>
			{/each}
		</Tabs.List>

		<Tabs.Content value="overall" class="mt-6 space-y-6">
			{#if data.summary}
				<!-- Summary KPI cards -->
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					<Card.Root>
						<Card.Header
							class="flex flex-row items-center justify-between space-y-0 pb-2"
						>
							<Card.Title class="text-sm font-medium">Total Students</Card.Title
							>
							<div class="bg-primary/10 rounded-lg p-2">
								<GraduationCap class="text-primary h-4 w-4" />
							</div>
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold">{data.summary.totalStudents}</div>
							<p class="text-muted-foreground text-xs">
								Avg {data.summary.averageStudentHoursPerCycle.toFixed(1)}h per
								cycle
							</p>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Header
							class="flex flex-row items-center justify-between space-y-0 pb-2"
						>
							<Card.Title class="text-sm font-medium">Total Teachers</Card.Title
							>
							<div class="bg-primary/10 rounded-lg p-2">
								<Users class="text-primary h-4 w-4" />
							</div>
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold">{data.summary.totalTeachers}</div>
							<p class="text-muted-foreground text-xs">
								Avg {data.summary.averageTeacherHoursPerCycle.toFixed(1)}h per
								cycle
							</p>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Header
							class="flex flex-row items-center justify-between space-y-0 pb-2"
						>
							<Card.Title class="text-sm font-medium">Total Classes</Card.Title>
							<div class="bg-primary/10 rounded-lg p-2">
								<BookOpen class="text-primary h-4 w-4" />
							</div>
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold">{data.summary.totalClasses}</div>
							<p class="text-muted-foreground text-xs">
								Across all subject offerings
							</p>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- Workload distribution + day utilization -->
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each [{ label: 'Student', d: data.summary.studentWorkloadDistribution }, { label: 'Teacher', d: data.summary.teacherWorkloadDistribution }] as group (group.label)}
						{@const range = Math.max(group.d.max - group.d.min, 1)}
						{@const meanPct = ((group.d.mean - group.d.min) / range) * 100}
						<Card.Root>
							<Card.Header>
								<Card.Title>{group.label} Workload</Card.Title>
								<Card.Description>
									Hours per cycle across all {group.label.toLowerCase()}s
								</Card.Description>
							</Card.Header>
							<Card.Content class="space-y-4">
								<div class="space-y-2">
									<div
										class="text-muted-foreground flex justify-between text-xs"
									>
										<span>{group.d.min.toFixed(1)}h min</span>
										<span>{group.d.max.toFixed(1)}h max</span>
									</div>
									<div class="bg-muted relative h-2 rounded-full">
										<div
											class="bg-primary/30 absolute inset-x-0 inset-y-0 rounded-full"
										></div>
										<div
											class="bg-primary ring-background absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
											style="left: {meanPct}%;"
										></div>
									</div>
									<p class="text-muted-foreground text-center text-xs">
										Mean {group.d.mean.toFixed(1)}h
									</p>
								</div>
								<Separator />
								<div class="space-y-2">
									<div class="flex justify-between text-sm">
										<span class="text-muted-foreground">Mean</span>
										<span class="font-medium">{group.d.mean.toFixed(1)}h</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-muted-foreground">Median</span>
										<span class="font-medium">{group.d.median.toFixed(1)}h</span
										>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-muted-foreground">Std deviation</span>
										<span class="font-medium"
											>{group.d.standardDeviation.toFixed(1)}h</span
										>
									</div>
								</div>
							</Card.Content>
						</Card.Root>
					{/each}

					<Card.Root>
						<Card.Header>
							<Card.Title>Day Utilization</Card.Title>
							<Card.Description>Average student hours per day</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-3">
							{#each dayUtilEntries as day (day.key)}
								<div class="space-y-1">
									<div class="flex justify-between text-sm">
										<span class="font-medium">
											{friendlyDayName(day.dayName, day.dayNumber)}
										</span>
										<span class="text-muted-foreground">
											{day.averageStudentHours.toFixed(1)}h
										</span>
									</div>
									<Progress
										value={(day.averageStudentHours / maxDayHours) * 100}
										class="h-2"
									/>
								</div>
							{:else}
								<p class="text-muted-foreground text-sm">
									No utilization data available.
								</p>
							{/each}
						</Card.Content>
					</Card.Root>
				</div>
			{:else}
				<Card.Root>
					<Card.Content class="py-8">
						<p class="text-muted-foreground text-center">
							Loading statistics...
						</p>
					</Card.Content>
				</Card.Root>
			{/if}
		</Tabs.Content>

		<Tabs.Content value="students" class="mt-6 space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Student Statistics</Card.Title>
					<Card.Description>
						Detailed statistics for all students in the timetable
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<StudentDataTable data={data.students} columns={studentColumns} />
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="teachers" class="mt-6 space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Teacher Statistics</Card.Title>
					<Card.Description>
						Detailed statistics for all teachers in the timetable
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<TeacherDataTable data={data.teachers} columns={teacherColumns} />
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="student-timetable" class="mt-6 space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Find a student timetable</Card.Title>
					<Card.Description>
						Search by first name, last name, or email.
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<form
						method="POST"
						action="?/searchUser"
						use:enhance={() => {
							isSearching = true;
							return async ({ update }) => {
								await update();
								isSearching = false;
							};
						}}
						class="flex gap-2"
					>
						<div class="relative flex-1">
							<Label for="search" class="sr-only">Search</Label>
							<Search
								class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
							/>
							<Input
								id="search"
								name="search"
								type="text"
								placeholder="Search by name or email..."
								bind:value={searchQuery}
								required
								minlength={2}
								class="pl-9"
							/>
						</div>
						<Button type="submit" disabled={isSearching}>
							{isSearching ? 'Searching...' : 'Search'}
						</Button>
					</form>

					{#if form?.users && form.users.length > 0}
						<div class="space-y-2">
							<p class="text-muted-foreground text-sm">
								Found {form.users.length} user{form.users.length !== 1
									? 's'
									: ''}
							</p>
							<div class="space-y-2">
								{#each form.users as user (user.id)}
									<form
										method="POST"
										action="?/loadUserTimetable"
										use:enhance={() => {
											isLoadingTimetable = true;
											return async ({ update }) => {
												await update();
												isLoadingTimetable = false;
											};
										}}
									>
										<input type="hidden" name="userId" value={user.id} />
										<Button
											type="submit"
											variant="outline"
											class="h-auto w-full justify-start py-2"
											disabled={isLoadingTimetable}
										>
											<div
												class="flex w-full items-center justify-between gap-3"
											>
												<div class="text-left">
													<div class="font-medium">
														{user.firstName}
														{user.lastName}
													</div>
													<div class="text-muted-foreground text-xs">
														{user.email}
													</div>
												</div>
												<TypeBadge type={user.type} />
											</div>
										</Button>
									</form>
								{/each}
							</div>
						</div>
					{:else if form?.searchQuery}
						<Alert.Root>
							<Alert.Title>No users found</Alert.Title>
							<Alert.Description>
								No users matched your search for "{form.searchQuery}". Try a
								different search term.
							</Alert.Description>
						</Alert.Root>
					{:else if !form?.userTimetable}
						<div
							class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center text-sm"
						>
							<UserSearch class="h-6 w-6 opacity-60" />
							<p>
								Search for a student or teacher to view their weekly timetable.
							</p>
						</div>
					{/if}

					{#if form?.error}
						<Alert.Root variant="destructive">
							<Alert.Title>Error</Alert.Title>
							<Alert.Description>{form.error}</Alert.Description>
						</Alert.Root>
					{/if}
				</Card.Content>
			</Card.Root>

			{#if form?.userTimetable}
				<Card.Root>
					<Card.Header>
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="space-y-1">
								<Card.Title class="flex items-center gap-2">
									{form.userTimetable.userName}
									<TypeBadge type={form.userTimetable.userType} />
								</Card.Title>
								<Card.Description>Weekly schedule</Card.Description>
							</div>
							<div class="flex flex-wrap gap-2">
								<Badge variant="secondary">
									{form.userTimetable.totalHoursPerCycle.toFixed(1)}h per cycle
								</Badge>
								<Badge variant="secondary">
									{form.userTimetable.averageHoursPerDay.toFixed(1)}h avg / day
								</Badge>
							</div>
						</div>
					</Card.Header>
					<Card.Content>
						<div
							class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
						>
							{#each form.userTimetable.days as day (day.dayNumber)}
								<div class="space-y-2">
									<div class="flex items-center justify-between border-b pb-2">
										<h3 class="text-sm font-semibold tracking-wide uppercase">
											{day.dayName}
										</h3>
										<Badge variant="outline" class="text-xs">
											{day.totalHours.toFixed(1)}h
										</Badge>
									</div>

									{#if day.sessions.length === 0}
										<div
											class="text-muted-foreground flex min-h-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed py-4 text-center text-xs"
										>
											<CalendarOff class="h-4 w-4 opacity-60" />
											<span class="italic">No classes scheduled</span>
										</div>
									{:else}
										<div class="space-y-2">
											{#each day.sessions as session (session.id)}
												<div
													class="hover:bg-accent border-l-primary/60 bg-card rounded-md border border-l-4 p-3 transition-colors"
												>
													<div
														class="text-muted-foreground flex items-center gap-1.5 text-xs"
													>
														<Clock class="h-3 w-3" />
														{session.start.slice(0, 5)} – {session.end.slice(
															0,
															5,
														)}
													</div>
													<p class="mt-1 text-sm font-semibold">
														{session.subjectName}
													</p>
													{#if session.spaceName}
														<p
															class="text-muted-foreground mt-1 flex items-center gap-1 text-xs"
														>
															<MapPin class="h-3 w-3" />
															{session.spaceName}
														</p>
													{/if}
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			{/if}
		</Tabs.Content>

		<Tabs.Content value="room-timetable" class="mt-6 space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Find a room timetable</Card.Title>
					<Card.Description>
						Select a room to view its scheduled classes across the cycle.
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					{#if data.spaces.length === 0}
						<div
							class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center text-sm"
						>
							<DoorOpen class="h-6 w-6 opacity-60" />
							<p>No rooms have been configured for this school.</p>
						</div>
					{:else}
						<form
							method="POST"
							action="?/loadRoomTimetable"
							use:enhance={() => {
								isLoadingRoomTimetable = true;
								return async ({ update }) => {
									await update();
									isLoadingRoomTimetable = false;
								};
							}}
							class="flex gap-2"
						>
							<Select.Root
								type="single"
								name="spaceId"
								bind:value={selectedSpaceId}
							>
								<Select.Trigger class="flex-1">
									{selectedSpaceId
										? (data.spaces.find((s) => String(s.id) === selectedSpaceId)
												?.name ?? 'Select a room...')
										: 'Select a room...'}
								</Select.Trigger>
								<Select.Content>
									{#each data.spaces as space (space.id)}
										<Select.Item value={String(space.id)} label={space.name} />
									{/each}
								</Select.Content>
							</Select.Root>
							<Button
								type="submit"
								disabled={!selectedSpaceId || isLoadingRoomTimetable}
							>
								{isLoadingRoomTimetable ? 'Loading...' : 'Load Timetable'}
							</Button>
						</form>

						{#if form?.error && !form?.userTimetable && !form?.users}
							<Alert.Root variant="destructive">
								<Alert.Title>Error</Alert.Title>
								<Alert.Description>{form.error}</Alert.Description>
							</Alert.Root>
						{/if}
					{/if}
				</Card.Content>
			</Card.Root>

			{#if form?.roomTimetable}
				<Card.Root>
					<Card.Header>
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="space-y-1">
								<Card.Title class="flex items-center gap-2">
									<DoorOpen class="h-4 w-4" />
									{form.roomTimetable.spaceName}
									<Badge variant="secondary" class="capitalize">
										{form.roomTimetable.spaceType}
									</Badge>
								</Card.Title>
								<Card.Description>Weekly schedule</Card.Description>
							</div>
							<div class="flex flex-wrap gap-2">
								<Badge variant="secondary">
									{form.roomTimetable.totalHoursPerCycle.toFixed(1)}h per cycle
								</Badge>
								<Badge variant="secondary">
									{form.roomTimetable.averageHoursPerDay.toFixed(1)}h avg / day
								</Badge>
							</div>
						</div>
					</Card.Header>
					<Card.Content>
						<div
							class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
						>
							{#each form.roomTimetable.days as day (day.dayNumber)}
								<div class="space-y-2">
									<div class="flex items-center justify-between border-b pb-2">
										<h3 class="text-sm font-semibold tracking-wide uppercase">
											{friendlyDayName(day.dayName, day.dayNumber)}
										</h3>
										<Badge variant="outline" class="text-xs">
											{day.totalHours.toFixed(1)}h
										</Badge>
									</div>

									{#if day.sessions.length === 0}
										<div
											class="text-muted-foreground flex min-h-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed py-4 text-center text-xs"
										>
											<CalendarOff class="h-4 w-4 opacity-60" />
											<span class="italic">No classes scheduled</span>
										</div>
									{:else}
										<div class="space-y-2">
											{#each day.sessions as session (session.id)}
												<div
													class="hover:bg-accent border-l-primary/60 bg-card rounded-md border border-l-4 p-3 transition-colors"
												>
													<div
														class="text-muted-foreground flex items-center gap-1.5 text-xs"
													>
														<Clock class="h-3 w-3" />
														{session.start.slice(0, 5)} – {session.end.slice(
															0,
															5,
														)}
													</div>
													<p class="mt-1 text-sm font-semibold">
														{session.subjectName}
													</p>
													{#if session.teacherNames.length > 0}
														<p
															class="text-muted-foreground mt-1 flex items-center gap-1 text-xs"
														>
															<Users class="h-3 w-3" />
															{session.teacherNames.join(', ')}
														</p>
													{/if}
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>
