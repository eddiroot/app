<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Tabs from '$lib/components/ui/tabs';
	import type { ActionData, PageData } from './$types';
	import { studentColumns } from './student-columns';
	import StudentDataTable from './student-data-table.svelte';
	import { teacherColumns } from './teacher-columns';
	import TeacherDataTable from './teacher-data-table.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Current active section
	let activeSection = $state<string>('overall');

	// User search state
	let searchQuery = $state('');
	let isSearching = $state(false);
	let isLoadingTimetable = $state(false);

	// Navigation items - typed for better type safety
	const navItems = [
		{ id: 'overall' as const, label: 'Overall Statistics', icon: '📊' },
		{ id: 'students' as const, label: 'Student Statistics', icon: '👨‍🎓' },
		{ id: 'teachers' as const, label: 'Teacher Statistics', icon: '👨‍🏫' },
		{ id: 'student-timetable' as const, label: 'Student Timetable', icon: '📅' },
		{ id: 'room-timetable' as const, label: 'Room Timetable', icon: '🏫' }
	] as const;
</script>

<div class="container mx-auto space-y-6 p-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Timetable Results</h1>
	</div>

	<Tabs.Root bind:value={activeSection}>
		<Tabs.List class="grid w-full grid-cols-5">
			{#each navItems as item (item.id)}
				<Tabs.Trigger value={item.id} class="flex items-center gap-2">
					<span>{item.icon}</span>
					<span class="hidden sm:inline">{item.label}</span>
				</Tabs.Trigger>
			{/each}
		</Tabs.List>

		<Tabs.Content value="overall" class="space-y-4">
			{#if data.summary}
				<!-- Summary Cards -->
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Total Students</Card.Title>
							<span class="text-2xl">👨‍🎓</span>
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold">{data.summary.totalStudents}</div>
							<p class="text-muted-foreground text-xs">
								Avg {data.summary.averageStudentHoursPerCycle.toFixed(1)}h per cycle
							</p>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Total Teachers</Card.Title>
							<span class="text-2xl">👨‍🏫</span>
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold">{data.summary.totalTeachers}</div>
							<p class="text-muted-foreground text-xs">
								Avg {data.summary.averageTeacherHoursPerCycle.toFixed(1)}h per cycle
							</p>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Total Classes</Card.Title>
							<span class="text-2xl">📚</span>
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold">{data.summary.totalClasses}</div>
							<p class="text-muted-foreground text-xs">Across all subject offerings</p>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- Workload Distribution -->
				<div class="grid gap-4 md:grid-cols-2">
					<Card.Root>
						<Card.Header>
							<Card.Title>Student Workload Distribution</Card.Title>
							<Card.Description>Hours per cycle across all students</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div class="space-y-2">
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Minimum</span>
									<span class="font-medium"
										>{data.summary.studentWorkloadDistribution.min.toFixed(1)}h</span
									>
								</div>
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Maximum</span>
									<span class="font-medium"
										>{data.summary.studentWorkloadDistribution.max.toFixed(1)}h</span
									>
								</div>
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Mean</span>
									<span class="font-medium"
										>{data.summary.studentWorkloadDistribution.mean.toFixed(1)}h</span
									>
								</div>
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Median</span>
									<span class="font-medium"
										>{data.summary.studentWorkloadDistribution.median.toFixed(1)}h</span
									>
								</div>
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Standard Deviation</span>
									<span class="font-medium"
										>{data.summary.studentWorkloadDistribution.standardDeviation.toFixed(1)}h</span
									>
								</div>
							</div>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Header>
							<Card.Title>Teacher Workload Distribution</Card.Title>
							<Card.Description>Hours per cycle across all teachers</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div class="space-y-2">
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Minimum</span>
									<span class="font-medium"
										>{data.summary.teacherWorkloadDistribution.min.toFixed(1)}h</span
									>
								</div>
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Maximum</span>
									<span class="font-medium"
										>{data.summary.teacherWorkloadDistribution.max.toFixed(1)}h</span
									>
								</div>
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Mean</span>
									<span class="font-medium"
										>{data.summary.teacherWorkloadDistribution.mean.toFixed(1)}h</span
									>
								</div>
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Median</span>
									<span class="font-medium"
										>{data.summary.teacherWorkloadDistribution.median.toFixed(1)}h</span
									>
								</div>
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Standard Deviation</span>
									<span class="font-medium"
										>{data.summary.teacherWorkloadDistribution.standardDeviation.toFixed(1)}h</span
									>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- Day Utilization -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Day Utilization</Card.Title>
						<Card.Description>Average hours and people scheduled per day</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-4">
							{#each Object.values(data.summary.dayUtilization) as day}
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<h4 class="font-semibold">{day.dayName}</h4>
										<div class="text-muted-foreground text-sm">
											{day.studentsScheduled} students • {day.teachersScheduled} teachers
										</div>
									</div>
									<div class="grid grid-cols-2 gap-4">
										<div class="rounded-lg border p-3">
											<div class="text-muted-foreground text-xs">Student Average</div>
											<div class="text-lg font-semibold">
												{day.averageStudentHours.toFixed(1)}h
											</div>
											<div class="text-muted-foreground text-xs">
												Total: {day.totalStudentHours.toFixed(1)}h
											</div>
										</div>
										<div class="rounded-lg border p-3">
											<div class="text-muted-foreground text-xs">Teacher Average</div>
											<div class="text-lg font-semibold">
												{day.averageTeacherHours.toFixed(1)}h
											</div>
											<div class="text-muted-foreground text-xs">
												Total: {day.totalTeacherHours.toFixed(1)}h
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			{:else}
				<Card.Root>
					<Card.Content class="py-8">
						<p class="text-muted-foreground text-center">Loading statistics...</p>
					</Card.Content>
				</Card.Root>
			{/if}
		</Tabs.Content>

		<Tabs.Content value="students" class="space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Student Statistics</Card.Title>
					<Card.Description>Detailed statistics for all students in the timetable</Card.Description>
				</Card.Header>
				<Card.Content>
					<StudentDataTable data={data.students} columns={studentColumns} />
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="teachers" class="space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Teacher Statistics</Card.Title>
					<Card.Description>Detailed statistics for all teachers in the timetable</Card.Description>
				</Card.Header>
				<Card.Content>
					<TeacherDataTable data={data.teachers} columns={teacherColumns} />
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="student-timetable" class="space-y-4">
			<!-- User Search Card -->
			<Card.Root>
				<Card.Header>
					<Card.Title>View Student Timetable</Card.Title>
					<Card.Description>Search by first name, last name, or email address</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<!-- Search Form -->
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
						<div class="flex-1">
							<Label for="search" class="sr-only">Search</Label>
							<Input
								id="search"
								name="search"
								type="text"
								placeholder="Search by name or email..."
								bind:value={searchQuery}
								required
								minlength={2}
							/>
						</div>
						<Button type="submit" disabled={isSearching}>
							{isSearching ? 'Searching...' : 'Search'}
						</Button>
					</form>

					<!-- Search Results -->
					{#if form?.users && form.users.length > 0}
						<div class="space-y-2">
							<p class="text-muted-foreground text-sm">
								Found {form.users.length} user{form.users.length !== 1 ? 's' : ''}
							</p>
							<div class="space-y-2">
								{#each form.users as user}
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
											class="w-full justify-start"
											disabled={isLoadingTimetable}
										>
											<div class="flex w-full items-center justify-between">
												<div class="text-left">
													<div class="font-medium">
														{user.firstName}
														{user.lastName}
													</div>
													<div class="text-muted-foreground text-xs">{user.email}</div>
												</div>
												<span class="bg-secondary rounded-full px-2 py-1 text-xs">{user.type}</span>
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
								No users matched your search for "{form.searchQuery}". Try a different search term.
							</Alert.Description>
						</Alert.Root>
					{/if}

					<!-- Error Message -->
					{#if form?.error}
						<Alert.Root variant="destructive">
							<Alert.Title>Error</Alert.Title>
							<Alert.Description>{form.error}</Alert.Description>
						</Alert.Root>
					{/if}
				</Card.Content>
			</Card.Root>

			<!-- User Timetable Display -->
			{#if form?.userTimetable}
				<Card.Root>
					<Card.Header>
						<Card.Title>
							{form.userTimetable.userName}'s Timetable
						</Card.Title>
						<Card.Description>
							{form.userTimetable.userType} • {form.userTimetable.totalHoursPerCycle.toFixed(1)}h
							per cycle • {form.userTimetable.averageHoursPerDay.toFixed(1)}h average per day
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
							{#each form.userTimetable.days as day}
								<div class="space-y-2">
									<div class="flex items-center justify-between border-b pb-2">
										<h3 class="text-lg font-semibold">{day.dayName}</h3>
										<span class="text-muted-foreground text-sm">
											{day.totalHours.toFixed(1)}h
										</span>
									</div>

									{#if day.sessions.length === 0}
										<p class="text-muted-foreground py-2 text-sm italic">No classes scheduled</p>
									{:else}
										<div class="space-y-2">
											{#each day.sessions as session}
												<div
													class="hover:bg-accent flex flex-col gap-2 rounded-lg border p-3 transition-colors"
												>
													<div class="flex items-center justify-between">
														<div class="text-sm font-medium">{session.startTime.slice(0, 5)}</div>
														<div class="text-muted-foreground text-sm">
															{session.endTime.slice(0, 5)}
														</div>
													</div>
													<div>
														<div class="text-sm font-medium">{session.subjectName}</div>
														<!-- {#if session.className}
															<div class="text-muted-foreground text-xs">{session.className}</div>
														{/if} -->
													</div>
													{#if session.spaceName}
														<div class="text-muted-foreground text-xs">
															🏫 {session.spaceName}
														</div>
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

		<Tabs.Content value="room-timetable" class="space-y-4">
			<!-- Space Search Card -->
			<Card.Root>
				<Card.Header>
					<Card.Title>View Room Timetable</Card.Title>
					<Card.Description>Search by room/space name or type</Card.Description>
				</Card.Header>
				<Card.Content>
					<p>TODO: This has not been implemented yet!!!!</p>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>
