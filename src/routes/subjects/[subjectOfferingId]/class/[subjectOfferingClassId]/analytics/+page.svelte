<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Chart from '$lib/components/ui/chart';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Progress } from '$lib/components/ui/progress';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { formatTimestampAsDate } from '$lib/utils';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import Check from '@lucide/svelte/icons/check';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import TrendingDown from '@lucide/svelte/icons/trending-down';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import { BarChart } from 'layerchart';

	let { data } = $props();

	const analyticsData = data.analyticsData;

	const mockData = data.mockData;

	function mergeArraysUnique(base: string[], extra: string[]) {
		const set = new Set(base);
		for (const x of extra) if (!set.has(x)) base.push(x);
		return base;
	}

	function mergeAnalytics(mock: typeof mockData, real: typeof analyticsData) {
		// Student Performance
		const realSP = real.studentPerformance;
		const mockSP = mock.studentPerformance;
		// Build merged student list: start with real (enriched), then append any mock-only students
		const realByName = new Map<string, any>();
		for (const rs of realSP.students || []) {
			realByName.set(`${rs.firstName}|${rs.lastName}`.toLowerCase(), rs);
		}
		const mergedStudents = (realSP.students || []).map((rs: any) => {
			const match = mockSP.students.find(
				(ms) => ms.firstName === rs.firstName && ms.lastName === rs.lastName
			);
			return { ...match, ...rs };
		});
		for (const ms of mockSP.students) {
			const key = `${ms.firstName}|${ms.lastName}`.toLowerCase();
			if (!realByName.has(key)) mergedStudents.push(ms);
		}
		const sp = {
			keyInsights: mergeArraysUnique([...mockSP.keyInsights], realSP.keyInsights || []),
			currentAverage: realSP.currentAverage ?? mockSP.currentAverage,
			currentAverageChange: realSP.currentAverageChange ?? mockSP.currentAverageChange,
			students: mergedStudents as any
		};

		// Task Analytics
		const realTA = real.taskAnalytics;
		const mockTA = mock.taskAnalytics;
		const tasks = realTA.tasks?.length
			? realTA.tasks.map((rt) => {
					const match = mockTA.tasks.find((mt) => mt.name === rt.name || mt.id === rt.id);
					return {
						...match,
						...rt,
						averageTime: rt.averageTime || match?.averageTime || '—',
						weight: rt.weight ?? match?.weight ?? 10
					};
				})
			: mockTA.tasks;
		const ta = {
			keyInsights: mergeArraysUnique([...mockTA.keyInsights], realTA.keyInsights || []),
			submissionsDue: realTA.submissionsDue ?? mockTA.submissionsDue,
			avgGradeOverTime: realTA.avgGradeOverTime?.length
				? realTA.avgGradeOverTime
				: mockTA.avgGradeOverTime,
			tasks
		};

		// Discussion Analytics
		const realDA = real.discussionAnalytics;
		const mockDA = mock.discussionAnalytics;
		const realHasActivity = realDA.students.some(
			(s) => (s.questionsPosted || 0) + (s.questionsAnswered || 0) + (s.totalContributions || 0) > 0
		);
		const da = realHasActivity
			? {
					keyInsights: mergeArraysUnique([...mockDA.keyInsights], realDA.keyInsights || []),
					viewsOnLastAnnouncement: realDA.viewsOnLastAnnouncement,
					postsOverTime: realDA.postsOverTime?.length ? realDA.postsOverTime : mockDA.postsOverTime,
					students: realDA.students.map((rs) => {
						const match = mockDA.students.find(
							(ms) => ms.firstName === rs.firstName && ms.lastName === rs.lastName
						);
						return { ...match, ...rs };
					})
				}
			: mockDA;

		return { studentPerformance: sp, taskAnalytics: ta, discussionAnalytics: da };
	}

	const combinedData = mergeAnalytics(mockData, analyticsData);

	// Chart configs
	const gradeDistributionConfig = {
		count: { label: 'Students', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;

	const computedGradeDistribution = $derived(() => {
		const bins = [
			{ label: 'F', min: 0, max: 39, count: 0 },
			{ label: 'E', min: 40, max: 49, count: 0 },
			{ label: 'D', min: 50, max: 59, count: 0 },
			{ label: 'C', min: 60, max: 69, count: 0 },
			{ label: 'B', min: 70, max: 79, count: 0 },
			{ label: 'A', min: 80, max: 100, count: 0 }
		];
		for (const s of combinedData.studentPerformance.students) {
			const g = typeof s.grade === 'number' ? s.grade : 0;
			const bin = bins.find((b) => g >= b.min && g <= b.max);
			if (bin) bin.count += 1;
		}
		return bins.map((b) => ({ grade: b.label, count: b.count }));
	});
	const gradeOverTimeConfig = {
		grade: { label: 'Average Grade', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;
	function taskGradesByDueDate() {
		return [...combinedData.taskAnalytics.tasks]
			.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
			.map((t, idx) => ({
				order: idx + 1,
				id: t.name,
				label: t.name,
				date: new Date(t.dueDate),
				grade: t.averageGrade
			}));
	}
	const postsOverTimeConfig = {
		posts: { label: 'Posts', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;
	let activeTab = $state('student-performance');

	const spActualAverage = $derived(() => {
		const students = combinedData.studentPerformance.students;
		if (!students.length) return 0;
		const total = students.reduce((sum: number, s: any) => sum + (s.grade || 0), 0);
		return Math.round(total / students.length);
	});

	const spBreakdown = $derived(() => {
		const students = combinedData.studentPerformance.students;
		if (!students.length) return { assignments: 0, homework: 0, participation: 0 };
		const avg = (key: string) =>
			Math.round(
				students.reduce((sum: number, s: any) => sum + (s[key] || 0), 0) / students.length
			);
		return {
			assignments: avg('assignmentsCompleted'),
			homework: avg('homeworkCompleted'),
			participation: avg('participation')
		};
	});

	// ------- Shared helpers for filters/sorting -------
	function parseLastActiveToDays(s: string): number {
		const str = s.trim().toLowerCase();
		if (str.includes('hour')) {
			const n = parseFloat(str);
			return isNaN(n) ? 0.5 : Math.max(0.04, n / 24); // hours -> days
		}
		if (str.includes('<') && str.includes('day')) return 0.5;
		if (str.includes('day')) {
			const n = parseFloat(str);
			return isNaN(n) ? 1 : n;
		}
		if (str.includes('week')) {
			const n = parseFloat(str);
			return isNaN(n) ? 7 : n * 7;
		}
		return 9999; // unknown => very old
	}

	function toMinutes(s: string): number {
		const str = s.trim().toLowerCase();
		if (str.includes('hour')) {
			const n = parseFloat(str);
			return isNaN(n) ? 60 : n * 60;
		}
		if (str.includes('minute')) {
			const n = parseFloat(str);
			return isNaN(n) ? 0 : n;
		}
		return 0;
	}

	// ------- Student Performance table controls -------
	type SP_SortKey =
		| 'name'
		| 'grade'
		| 'assignments'
		| 'lessons'
		| 'homework'
		| 'lastActive'
		| 'participation';
	type SortDir = 'asc' | 'desc';
	let spSortKey = $state<SP_SortKey>('grade');
	let spSortDir = $state<SortDir>('desc');
	const spGradeBands = ['A', 'B', 'C/D', 'F'] as const;
	let spSelectedBands = $state(new Set<(typeof spGradeBands)[number]>());

	function toggleSpBand(b: (typeof spGradeBands)[number]) {
		const s = new Set(spSelectedBands);
		if (s.has(b)) s.delete(b);
		else s.add(b);
		spSelectedBands = s;
	}
	function clearSpBands() {
		spSelectedBands = new Set();
	}

	function inSelectedBand(grade: number): boolean {
		if (spSelectedBands.size === 0) return true;
		const g = grade;
		const has = (band: string) => spSelectedBands.has(band as any);
		if (g >= 85 && has('A')) return true;
		if (g >= 70 && g < 85 && has('B')) return true;
		if (g >= 50 && g < 70 && has('C/D')) return true;
		if (g < 50 && has('F')) return true;
		return false;
	}

	let spFilteredStudents = $derived(() => {
		const students = combinedData.studentPerformance.students.filter((s: any) =>
			inSelectedBand(s.grade)
		);
		const dir = spSortDir === 'asc' ? 1 : -1;
		return [...students].sort((a: any, b: any) => {
			const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
			const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
			if (spSortKey === 'name') return (nameA < nameB ? -1 : nameA > nameB ? 1 : 0) * dir;
			if (spSortKey === 'participation') return (a.participation - b.participation) * dir;
			if (spSortKey === 'grade') return (a.grade - b.grade) * dir;
			if (spSortKey === 'assignments')
				return (a.assignmentsCompleted - b.assignmentsCompleted) * dir;
			if (spSortKey === 'lessons') return (a.lessonsCompleted - b.lessonsCompleted) * dir;
			if (spSortKey === 'homework') return (a.homeworkCompleted - b.homeworkCompleted) * dir;
			const da = parseLastActiveToDays(a.lastActive);
			const db = parseLastActiveToDays(b.lastActive);
			return (da - db) * dir;
		});
	});

	// Median grade (integer) across all students
	let spMedianGrade = $derived(() => {
		const grades = combinedData.studentPerformance.students
			.map((s: any) => s.grade)
			.sort((a: number, b: number) => a - b);
		const n = grades.length;
		if (!n) return 0;
		if (n % 2 === 1) return grades[(n - 1) / 2];
		return Math.round((grades[n / 2 - 1] + grades[n / 2]) / 2);
	});

	// ---------------- Dynamic Key Insights (max 4 each) ----------------
	function limit4(list: string[]) {
		return list.filter(Boolean).slice(0, 4);
	}

	const studentPerformanceInsights = $derived(() => {
		const insights: string[] = [];
		const students = combinedData.studentPerformance.students;
		if (!students.length) return insights;
		// 1. Low participation (<60%) if more than 5 lessons (we don't have lessons count per student beyond lessonsTotal; treat lessonsTotal as number of lessons so far if >5)
		const lowPart = students.filter(
			(s: any) => (s.participation || 0) < 60 && (s.lessonsTotal || 0) > 5
		).length;
		if (lowPart >= 1)
			insights.push(`${lowPart} student${lowPart === 1 ? '' : 's'} have low participation (<60%)`);
		// 2. Last active over 1 week ago
		const inactive = students.filter((s: any) => {
			const days = parseLastActiveToDays(s.lastActive || '');
			return days > 7;
		}).length;
		if (inactive >= 1)
			insights.push(
				`${inactive} student${inactive === 1 ? '' : 's'} were last active over 1 week ago`
			);
		// 3. Low grades (<50%)
		const lowGrades = students.filter((s: any) => (s.grade || 0) < 50).length;
		if (lowGrades >= 1)
			insights.push(`${lowGrades} student${lowGrades === 1 ? '' : 's'} have low grades (<50%)`);
		// 4. High participation correlation: students with >=90% participation average X% higher grades than others; show if X>=5%
		const highPartStudents = students.filter((s: any) => (s.participation || 0) >= 90);
		const otherStudents = students.filter((s: any) => (s.participation || 0) < 90);
		if (highPartStudents.length && otherStudents.length) {
			const avg = (arr: any[]) => arr.reduce((sum, s: any) => sum + (s.grade || 0), 0) / arr.length;
			const highAvg = avg(highPartStudents);
			const otherAvg = avg(otherStudents) || 0;
			const diff = Math.round(highAvg - otherAvg);
			if (diff >= 5)
				insights.push(
					`Students with >= 90% participation average ${diff}% higher grades than those with < 90% participation`
				);
		}
		return limit4(insights);
	});

	const taskAnalyticsInsights = $derived(() => {
		const insights: string[] = [];
		const tasks = combinedData.taskAnalytics.tasks;
		if (!tasks.length) return insights;
		const now = new Date();
		const msPerDay = 86400000;
		const dueSoon = tasks.filter((t) => {
			const d = new Date(t.dueDate);
			const diff = (d.getTime() - now.getTime()) / msPerDay;
			return diff >= 0 && diff <= 7;
		}).length;
		if (dueSoon > 0) insights.push(`${dueSoon} task${dueSoon === 1 ? '' : 's'} due in next 7 days`);
		const overdue = tasks.filter(
			(t) => new Date(t.dueDate) < now && t.status !== 'completed'
		).length;
		if (overdue > 0) insights.push(`${overdue} overdue task${overdue === 1 ? '' : 's'}`);
		const avgCompletion = Math.round(
			tasks.reduce((sum, t) => sum + (t.studentsCompleted || 0), 0) / tasks.length
		);
		insights.push(`Avg completion ${avgCompletion}%`);
		const pending = tasks.filter((t) => t.status === 'due').length;
		if (pending > 0) insights.push(`${pending} pending grading`);
		return limit4(insights);
	});

	const discussionAnalyticsInsights = $derived(() => {
		const insights: string[] = [];
		const students = combinedData.discussionAnalytics.students;
		if (!students.length) return insights;
		// Approximate unanswered questions: total questionsPosted - total answers (cannot go below 0)
		const totalPosted = students.reduce((s, st) => s + (st.questionsPosted || 0), 0);
		const totalAnswered = students.reduce((s, st) => s + (st.questionsAnswered || 0), 0);
		const unanswered = Math.max(0, totalPosted - totalAnswered);
		if (unanswered >= 1)
			insights.push(
				`There ${unanswered === 1 ? 'is' : 'are'} ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}`
			);
		const active = students.filter((s) => (s.totalContributions || 0) > 0).length;
		if (active > 0) insights.push(`${active} active contributor${active === 1 ? '' : 's'}`);
		const lowActivity = students.filter((s) => (s.totalContributions || 0) === 0).length;
		if (lowActivity > 0) insights.push(`${lowActivity} with no contributions`);
		const avgContrib = active
			? Math.round(students.reduce((sum, s) => sum + (s.totalContributions || 0), 0) / active)
			: 0;
		if (avgContrib > 0) insights.push(`Avg contributions ${avgContrib}/active student`);
		return limit4(insights);
	});

	// ------- Task Analytics table controls -------
	type TA_SortKey =
		| 'name'
		| 'studentsCompleted'
		| 'averageGrade'
		| 'averageTime'
		| 'weight'
		| 'dueDate';
	let taSortKey = $state<TA_SortKey>('studentsCompleted');
	let taSortDir = $state<SortDir>('desc');
	// Type filter (multi-select)
	const taTypeOptions = ['lesson', 'homework', 'test', 'assignment'] as const;
	let taSelectedTypes = $state(new Set<(typeof taTypeOptions)[number]>());
	function toggleTaType(t: (typeof taTypeOptions)[number]) {
		const s = new Set(taSelectedTypes);
		if (s.has(t)) s.delete(t);
		else s.add(t);
		taSelectedTypes = s;
	}
	function clearTaTypes() {
		taSelectedTypes = new Set();
	}
	// Exposed filter options shown to user (graded/pending) mapped to internal statuses (completed/due)
	const taDisplayStatus = { graded: 'completed', pending: 'due' } as const;
	type TaDisplayStatusKey = keyof typeof taDisplayStatus;
	const taStatusOptions = Object.keys(taDisplayStatus) as TaDisplayStatusKey[]; // ['graded','pending']
	let taSelectedStatuses = $state(new Set<TaDisplayStatusKey>());
	function toggleTaStatus(s: TaDisplayStatusKey) {
		const set = new Set(taSelectedStatuses);
		if (set.has(s)) set.delete(s);
		else set.add(s);
		taSelectedStatuses = set;
	}
	function clearTaStatuses() {
		taSelectedStatuses = new Set();
	}

	let taFilteredTasks = $derived(() => {
		let tasks = combinedData.taskAnalytics.tasks;
		// type filter first
		if (taSelectedTypes.size > 0) {
			tasks = tasks.filter((t) => taSelectedTypes.has(t.type as any));
		}
		if (taSelectedStatuses.size > 0) {
			const internal = new Set(Array.from(taSelectedStatuses).map((d) => taDisplayStatus[d]));
			tasks = tasks.filter((t) => internal.has(t.status as any));
		}
		const dir = taSortDir === 'asc' ? 1 : -1;
		return [...tasks].sort((a, b) => {
			if (taSortKey === 'name') return a.name.localeCompare(b.name) * dir;
			if (taSortKey === 'studentsCompleted')
				return (a.studentsCompleted - b.studentsCompleted) * dir;
			if (taSortKey === 'averageGrade') return (a.averageGrade - b.averageGrade) * dir;
			if (taSortKey === 'averageTime')
				return (toMinutes(a.averageTime) - toMinutes(b.averageTime)) * dir;
			if (taSortKey === 'weight') return (a.weight - b.weight) * dir;
			return a.dueDate.localeCompare(b.dueDate) * dir; // dueDate ISO string now
		});
	});

	// Next task due
	let nextTaskDue = $derived(() => {
		const now = new Date();
		const future = combinedData.taskAnalytics.tasks
			.map((t) => ({ ...t, date: new Date(t.dueDate) }))
			.filter((t) => t.date.getTime() > now.getTime())
			.sort((a, b) => a.date.getTime() - b.date.getTime());
		const target = future[0];
		if (!target) return null;
		const msPerDay = 1000 * 60 * 60 * 24;
		const rawDiff = Math.ceil((target.date.getTime() - now.getTime()) / msPerDay);
		return { ...target, daysLeft: rawDiff, isPast: false };
	});

	// TODO: Should be using the taskTypeEnum here
	function taTypeVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (type) {
			case 'test':
			case 'assignment':
				return 'destructive';
			case 'homework':
				return 'secondary';
			case 'lesson':
				return 'outline';
			default:
				return 'outline';
		}
	}

	// ------- Discussion Analytics table controls -------
	type DA_SortKey =
		| 'name'
		| 'questionsPosted'
		| 'questionsAnswered'
		| 'totalContributions'
		| 'lastActive';
	let daSortKey = $state<DA_SortKey>('totalContributions');
	let daSortDir = $state<SortDir>('desc');

	let daFilteredStudents = $derived(() => {
		let students = combinedData.discussionAnalytics.students; // no activity filtering
		const dir = daSortDir === 'asc' ? 1 : -1;
		return [...students].sort((a, b) => {
			const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
			const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
			if (daSortKey === 'name') return (nameA < nameB ? -1 : nameA > nameB ? 1 : 0) * dir;
			if (daSortKey === 'questionsPosted') return (a.questionsPosted - b.questionsPosted) * dir;
			if (daSortKey === 'questionsAnswered')
				return (a.questionsAnswered - b.questionsAnswered) * dir;
			if (daSortKey === 'totalContributions')
				return (a.totalContributions - b.totalContributions) * dir;
			const da = parseLastActiveToDays(a.lastActive);
			const db = parseLastActiveToDays(b.lastActive);
			return (da - db) * dir;
		});
	});
</script>

<div class="space-y-4 p-4">
	<div class="space-y-1">
		<h1 class="text-2xl font-bold">{data.subject.name}</h1>
	</div>

	<!-- Tab Navigation -->
	<Tabs.Root bind:value={activeTab} class="w-full">
		<Tabs.List class="grid w-full grid-cols-3">
			<Tabs.Trigger value="student-performance">Student Performance</Tabs.Trigger>
			<Tabs.Trigger value="task-analytics">Task Analytics</Tabs.Trigger>
			<Tabs.Trigger value="discussion-analytics">Discussion Analytics</Tabs.Trigger>
		</Tabs.List>

		<!-- Student Performance Tab -->
		<Tabs.Content value="student-performance" class="space-y-6">
			<!-- Key Insights and Stats Row -->
			<div class="grid gap-3 md:grid-cols-6">
				<!-- Key Insights -->
				<Card.Root class="shadow-none md:col-span-2">
					<Card.Header>
						<Card.Title class="text-base">Key Insights</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-2">
						{#each studentPerformanceInsights() as insight}
							<div class="flex items-start gap-2">
								<AlertCircleIcon class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
								<p class="text-muted-foreground text-sm">{insight}</p>
							</div>
						{/each}
					</Card.Content>
				</Card.Root>

				<!-- Current Average + Breakdown Combined -->
				<Card.Root class="shadow-none md:col-span-2">
					<Card.Header class="pb-1">
						<Card.Title class="text-base">Current Average & Breakdown</Card.Title>
					</Card.Header>
					<Card.Content class="grid gap-6 md:grid-cols-2">
						<!-- Average -->
						<div class="space-y-4">
							<div class="text-4xl leading-none font-bold">
								{spActualAverage()}%
							</div>
							{#if combinedData.studentPerformance.currentAverageChange !== undefined}
								<div class="flex items-center gap-1 text-sm font-medium">
									{#if combinedData.studentPerformance.currentAverageChange > 0}
										<TrendingUp class="h-4 w-4 text-green-600" />
									{:else if combinedData.studentPerformance.currentAverageChange < 0}
										<TrendingDown class="h-4 w-4 text-red-600" />
									{/if}
									<span class="text-muted-foreground">
										{combinedData.studentPerformance.currentAverageChange > 0
											? '+'
											: ''}{combinedData.studentPerformance.currentAverageChange}% from last week
									</span>
								</div>
							{/if}
							<p class="text-muted-foreground mt-1 text-xs">Median: {spMedianGrade()}%</p>
						</div>
						<!-- Breakdown with progress bars -->
						<div class="space-y-4">
							{#each [{ label: 'Assignments', value: spBreakdown().assignments }, { label: 'Homework', value: spBreakdown().homework }, { label: 'Participation', value: spBreakdown().participation }] as part}
								<div class="space-y-1">
									<div class="flex items-center justify-between text-sm">
										<span>{part.label}</span>
										<span class="font-semibold">{part.value}%</span>
									</div>
									<Progress value={part.value} />
								</div>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Grade Distribution Chart -->
				<Card.Root class="shadow-none md:col-span-2">
					<Card.Header>
						<Card.Title class="text-base">Grade Distribution</Card.Title>
					</Card.Header>
					<Card.Content>
						<Chart.Container config={gradeDistributionConfig} class="aspect-auto h-[150px] w-full">
							<BarChart
								data={computedGradeDistribution()}
								x="grade"
								series={[
									{
										key: 'count',
										label: 'Students',
										color: gradeDistributionConfig.count.color
									}
								]}
								props={{
									bars: { stroke: 'none', rounded: 'none' },
									yAxis: { format: (v) => `${v}` }
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip />
								{/snippet}
							</BarChart>
						</Chart.Container>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Student Performance Table -->
			<Card.Root class="shadow-none">
				<Card.Content class="pt-0 pb-0">
					<Table.Root class="w-full">
						<Table.Header class="border-b">
							<Table.Row>
								<Table.Head class="w-52">
									<div class="flex items-center gap-1">
										<span>Student</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by name"
											onclick={() => {
												if (spSortKey === 'name') spSortDir = spSortDir === 'asc' ? 'desc' : 'asc';
												else {
													spSortKey = 'name';
													spSortDir = 'asc';
												}
											}}
										>
											{#if spSortKey === 'name'}{#if spSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-50">
									<div class="flex items-center gap-1">
										<span>Participation</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by participation"
											onclick={() => {
												if (spSortKey === 'participation')
													spSortDir = spSortDir === 'asc' ? 'desc' : 'asc';
												else {
													spSortKey = 'participation';
													spSortDir = 'desc';
												}
											}}
										>
											{#if spSortKey === 'participation'}{#if spSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-50">
									<div class="flex items-center gap-1">
										<span>Assignments</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by assignments"
											onclick={() => {
												if (spSortKey === 'assignments')
													spSortDir = spSortDir === 'asc' ? 'desc' : 'asc';
												else {
													spSortKey = 'assignments';
													spSortDir = 'desc';
												}
											}}
										>
											{#if spSortKey === 'assignments'}{#if spSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-50">
									<div class="flex items-center gap-1">
										<span>Homework</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by homework"
											onclick={() => {
												if (spSortKey === 'homework')
													spSortDir = spSortDir === 'asc' ? 'desc' : 'asc';
												else {
													spSortKey = 'homework';
													spSortDir = 'desc';
												}
											}}
										>
											{#if spSortKey === 'homework'}{#if spSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-50">
									<div class="flex items-center gap-1">
										<span>Lessons</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by lessons"
											onclick={() => {
												if (spSortKey === 'lessons')
													spSortDir = spSortDir === 'asc' ? 'desc' : 'asc';
												else {
													spSortKey = 'lessons';
													spSortDir = 'desc';
												}
											}}
										>
											{#if spSortKey === 'lessons'}{#if spSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-40">
									<div class="flex items-center gap-1">
										<span>Last Active</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by last active"
											onclick={() => {
												if (spSortKey === 'lastActive')
													spSortDir = spSortDir === 'asc' ? 'desc' : 'asc';
												else {
													spSortKey = 'lastActive';
													spSortDir = 'asc';
												}
											}}
										>
											{#if spSortKey === 'lastActive'}{#if spSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head>
									<div class="flex items-center gap-1">
										<span>Grade</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by grade"
											onclick={() => {
												if (spSortKey === 'grade') spSortDir = spSortDir === 'asc' ? 'desc' : 'asc';
												else {
													spSortKey = 'grade';
													spSortDir = 'desc';
												}
											}}
										>
											{#if spSortKey === 'grade'}{#if spSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
							</Table.Row>
						</Table.Header>
					</Table.Root>
					<div class="h-56 overflow-y-auto [scrollbar-gutter:stable]">
						<Table.Root class="w-full table-fixed">
							<Table.Body class="divide-y">
								{#each spFilteredStudents() as student}
									<Table.Row>
										<Table.Cell class="w-52">
											<!-- Fix route when implemented -->
											<a
												href={`/subjects/${data.subjectOfferingId}/class/${data.subjectOfferingClassId}/grades`}
												class="text-primary focus-visible:ring-primary/40 truncate rounded font-medium outline-none hover:underline focus:underline focus-visible:ring-1"
												>{student.firstName} {student.lastName}</a
											>
										</Table.Cell>
										<Table.Cell class="w-50">
											<div class="flex items-center gap-2">
												<Progress value={student.participation} class="w-20" />
												<span class="truncate text-sm"
													>{student.participation}% ({student.participationCompletedCount}/{student.participationTotal})</span
												>
											</div>
										</Table.Cell>
										<Table.Cell class="w-50">
											<div class="flex items-center gap-2">
												<Progress value={student.assignmentsCompleted} class="w-20" />
												<span class="truncate text-sm"
													>{student.assignmentsCompleted}% ({student.assignmentsCompletedCount}/{student.assignmentsTotal})</span
												>
											</div>
										</Table.Cell>
										<Table.Cell class="w-50">
											<div class="flex items-center gap-2">
												<Progress value={student.homeworkCompleted} class="w-20" />
												<span class="truncate text-sm"
													>{student.homeworkCompleted}% ({student.homeworkCompletedCount}/{student.homeworkTotal})</span
												>
											</div>
										</Table.Cell>
										<Table.Cell class="w-50">
											<div class="flex items-center gap-2">
												<Progress value={student.lessonsCompleted} class="w-20" />
												<span class="truncate text-sm"
													>{student.lessonsCompleted}% ({student.lessonsCompletedCount}/{student.lessonsTotal})</span
												>
											</div>
										</Table.Cell>
										<Table.Cell class="w-40">{student.lastActive}</Table.Cell>
										<Table.Cell><Badge variant="secondary">{student.grade}%</Badge></Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
					<div class="text-muted-foreground mt-2 flex justify-end text-sm">
						Showing {spFilteredStudents().length} of {combinedData.studentPerformance.students
							.length} students
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<!-- Task Analytics Tab -->
		<Tabs.Content value="task-analytics" class="space-y-6">
			<!-- Key Insights and Stats Row -->
			<div class="grid gap-3 md:grid-cols-3">
				<!-- Key Insights -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-base">Key Insights</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-2">
						{#each taskAnalyticsInsights() as insight}
							<div class="flex items-start gap-2">
								<AlertCircleIcon class="text-primary mt-0.5 h-4 w-4 shrink-0" />
								<p class="text-muted-foreground text-sm">{insight}</p>
							</div>
						{/each}
					</Card.Content>
				</Card.Root>

				<!-- Next Task Due -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-base">Next Task Due</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						{@const nt = nextTaskDue()}
						{#if nt}
							<div class="flex items-center justify-between gap-2">
								<h4 class="truncate text-xl font-bold">{nt.name}</h4>
								<Badge variant="secondary" class="shrink-0 text-xs">{nt.weight}% weight</Badge>
							</div>
							<div class="flex items-center justify-between text-sm">
								<span class="text-muted-foreground">Due {formatTimestampAsDate(nt.date)}</span>
								{#if nt.isPast}
									<span class="font-medium text-red-600">{Math.abs(nt.daysLeft)}d overdue</span>
								{:else}
									<span class="text-primary font-medium">{nt.daysLeft}d left</span>
								{/if}
							</div>
							<!-- Progress: submission completion -->
							<div class="space-y-1">
								<div class="text-muted-foreground flex justify-between text-xs tracking-wide">
									<span>Submissions</span>
									<span>{nt.completedCount}/{nt.totalStudents}</span>
								</div>
								<Progress value={nt.studentsCompleted} />
							</div>
						{:else}
							<p class="text-muted-foreground text-sm">No tasks available.</p>
						{/if}
					</Card.Content>
				</Card.Root>

				<!-- Average Score over Time Chart -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-base">Average Grade per Task over Time</Card.Title>
					</Card.Header>
					<Card.Content>
						<Chart.Container config={gradeOverTimeConfig} class="aspect-auto h-[150px] w-full">
							<BarChart
								data={taskGradesByDueDate()}
								x="id"
								series={[
									{
										key: 'grade',
										label: 'Average Grade',
										color: gradeOverTimeConfig.grade.color
									}
								]}
								props={{
									bars: { stroke: 'none', rounded: 'none' },
									xAxis: { format: () => '' },
									yAxis: { format: (v) => `${v}%` }
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip />
								{/snippet}
							</BarChart>
						</Chart.Container>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Task Performance Table (title removed for more vertical space) -->
			<Card.Root class="shadow-none">
				<Card.Content class="pt-0 pb-0">
					<!-- Header table for consistent styling -->
					<Table.Root class="w-full">
						<Table.Header class="border-b">
							<Table.Row>
								<Table.Head class="w-60">
									<div class="flex items-center gap-1">
										<span>Task</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by task"
											onclick={() => {
												if (taSortKey === 'name') taSortDir = taSortDir === 'asc' ? 'desc' : 'asc';
												else {
													taSortKey = 'name';
													taSortDir = 'asc';
												}
											}}
										>
											{#if taSortKey === 'name'}{#if taSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-32">
									<div class="flex items-center gap-1">
										<span>Type</span>
										<DropdownMenu>
											<DropdownMenuTrigger>
												<Button
													variant="ghost"
													size="sm"
													class="h-5 w-5 p-0"
													aria-label="Filter by type"
												>
													<ListFilter />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="start" class="min-w-40">
												<DropdownMenuLabel>Filter</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuItem onclick={clearTaTypes}>
													<div class="flex w-full items-center justify-between">
														<span>All</span>{#if taSelectedTypes.size === 0}<Check
																class="h-4 w-4"
															/>{/if}
													</div>
												</DropdownMenuItem>
												<DropdownMenuItem onclick={() => toggleTaType('lesson')}>
													<div class="flex w-full items-center justify-between">
														<span>Lessons</span>{#if taSelectedTypes.has('lesson')}<Check
																class="h-4 w-4"
															/>{/if}
													</div>
												</DropdownMenuItem>
												<DropdownMenuItem onclick={() => toggleTaType('homework')}>
													<div class="flex w-full items-center justify-between">
														<span>Homework</span>{#if taSelectedTypes.has('homework')}<Check
																class="h-4 w-4"
															/>{/if}
													</div>
												</DropdownMenuItem>
												<DropdownMenuItem onclick={() => toggleTaType('test')}>
													<div class="flex w-full items-center justify-between">
														<span>Tests</span>{#if taSelectedTypes.has('test')}<Check
																class="h-4 w-4"
															/>{/if}
													</div>
												</DropdownMenuItem>
												<DropdownMenuItem onclick={() => toggleTaType('assignment')}>
													<div class="flex w-full items-center justify-between">
														<span>Assignments</span>{#if taSelectedTypes.has('assignment')}<Check
																class="h-4 w-4"
															/>{/if}
													</div>
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</Table.Head>
								<Table.Head class="w-56">
									<div class="flex items-center gap-1">
										<span>Students Completed</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by students completed"
											onclick={() => {
												if (taSortKey === 'studentsCompleted')
													taSortDir = taSortDir === 'asc' ? 'desc' : 'asc';
												else {
													taSortKey = 'studentsCompleted';
													taSortDir = 'desc';
												}
											}}
										>
											{#if taSortKey === 'studentsCompleted'}{#if taSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-56">
									<div class="flex items-center gap-1">
										<span>Average Grade</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by average grade"
											onclick={() => {
												if (taSortKey === 'averageGrade')
													taSortDir = taSortDir === 'asc' ? 'desc' : 'asc';
												else {
													taSortKey = 'averageGrade';
													taSortDir = 'desc';
												}
											}}
										>
											{#if taSortKey === 'averageGrade'}{#if taSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-48">
									<div class="flex items-center gap-1">
										<span>Average Time Taken</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by average time"
											onclick={() => {
												if (taSortKey === 'averageTime')
													taSortDir = taSortDir === 'asc' ? 'desc' : 'asc';
												else {
													taSortKey = 'averageTime';
													taSortDir = 'asc';
												}
											}}
										>
											{#if taSortKey === 'averageTime'}{#if taSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-28">
									<div class="flex items-center gap-1">
										<span>Weight</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by weight"
											onclick={() => {
												if (taSortKey === 'weight')
													taSortDir = taSortDir === 'asc' ? 'desc' : 'asc';
												else {
													taSortKey = 'weight';
													taSortDir = 'desc';
												}
											}}
										>
											{#if taSortKey === 'weight'}{#if taSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-36">
									<div class="flex items-center gap-1">
										<span>Due Date</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by due date"
											onclick={() => {
												if (taSortKey === 'dueDate')
													taSortDir = taSortDir === 'asc' ? 'desc' : 'asc';
												else {
													taSortKey = 'dueDate';
													taSortDir = 'asc';
												}
											}}
										>
											{#if taSortKey === 'dueDate'}{#if taSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head>
									<div class="flex items-center gap-1">
										<span>Status</span>
										<DropdownMenu>
											<DropdownMenuTrigger>
												<Button
													variant="ghost"
													size="sm"
													class="h-5 w-5 p-0"
													aria-label="Filter by status"
												>
													<ListFilter />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="start" class="min-w-40">
												<DropdownMenuLabel>Filter</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuItem onclick={clearTaStatuses}>
													<div class="flex w-full items-center justify-between">
														<span>All</span>{#if taSelectedStatuses.size === 0}<Check
																class="h-4 w-4"
															/>{/if}
													</div>
												</DropdownMenuItem>
												<DropdownMenuItem onclick={() => toggleTaStatus('graded')}>
													<div class="flex w-full items-center justify-between">
														<span>graded</span>{#if taSelectedStatuses.has('graded')}<Check
																class="h-4 w-4"
															/>{/if}
													</div>
												</DropdownMenuItem>
												<DropdownMenuItem onclick={() => toggleTaStatus('pending')}>
													<div class="flex w-full items-center justify-between">
														<span>pending</span>{#if taSelectedStatuses.has('pending')}<Check
																class="h-4 w-4"
															/>{/if}
													</div>
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</Table.Head>
							</Table.Row>
						</Table.Header>
					</Table.Root>
					<div class="h-56 overflow-y-auto [scrollbar-gutter:stable]">
						<Table.Root class="w-full">
							<Table.Body>
								{#each taFilteredTasks() as task}
									<Table.Row>
										<Table.Cell class="w-60 font-medium">
											<a
												href={`/subjects/${data.subjectOfferingId}/class/${data.subjectOfferingClassId}/tasks/${task.id}`}
												class="text-primary focus-visible:ring-primary/40 block truncate rounded font-medium outline-none hover:underline focus:underline focus-visible:ring-1"
												>{task.name}</a
											>
										</Table.Cell>
										<Table.Cell class="w-32">
											<Badge variant={taTypeVariant(task.type)} class="capitalize"
												>{task.type}</Badge
											>
										</Table.Cell>
										<Table.Cell class="w-56">
											<div class="flex items-center gap-2">
												<Progress value={task.studentsCompleted} class="w-20" />
												<span class="truncate text-sm">
													{task.studentsCompleted}% ({task.completedCount}/{task.totalStudents})
												</span>
											</div>
										</Table.Cell>
										<Table.Cell class="w-56">
											<div class="flex items-center gap-2">
												<Progress value={task.averageGrade} class="w-20" />
												<span class="truncate text-sm">
													{task.averageGrade}% ({task.gradeCount}/{task.totalGrade})
												</span>
											</div>
										</Table.Cell>
										<Table.Cell class="w-48">{task.averageTime}</Table.Cell>
										<Table.Cell class="w-28">{task.weight}%</Table.Cell>
										<Table.Cell class="w-36"
											>{formatTimestampAsDate(new Date(task.dueDate))}</Table.Cell
										>
										<Table.Cell>
											<!-- Map internal status to graded/pending display similar to grades route -->
											{#if task.status === 'completed'}
												<Badge variant="default">graded</Badge>
											{:else}
												<Badge variant="secondary">pending</Badge>
											{/if}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
					<div class="text-muted-foreground mt-2 flex justify-end text-sm">
						Showing {taFilteredTasks().length} of {combinedData.taskAnalytics.tasks.length} tasks
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<!-- Discussion Analytics Tab -->
		<Tabs.Content value="discussion-analytics" class="space-y-6">
			<!-- Key Insights and Stats Row -->
			<div class="grid gap-3 md:grid-cols-3">
				<!-- Key Insights -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-base">Key Insights</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-2">
						{#each discussionAnalyticsInsights() as insight}
							<div class="flex items-start gap-2">
								<MessageSquareIcon class="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
								<p class="text-muted-foreground text-sm">{insight}</p>
							</div>
						{/each}
					</Card.Content>
				</Card.Root>

				<!-- Views on Last Announcement -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-base">Views on Last Announcement</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3 py-2">
						{@const v = combinedData.discussionAnalytics.viewsOnLastAnnouncement}
						{@const percent = Math.round((v.views / v.total) * 100)}
						<div class="flex items-center justify-between">
							<div>
								<div class="text-3xl leading-tight font-bold">{v.views}/{v.total}</div>
								<p class="text-muted-foreground text-xs">{percent}% viewed</p>
							</div>
						</div>
						<Progress value={percent} />
						<p class="text-muted-foreground text-xs">
							{v.total - v.views}
							{v.total - v.views === 1 ? 'student has' : 'students have'} not viewed it yet
						</p>
					</Card.Content>
				</Card.Root>

				<!-- Number of Posts over Time Chart -->
				<Card.Root class="shadow-none">
					<Card.Header>
						<Card.Title class="text-base">Number of Posts over Time</Card.Title>
					</Card.Header>
					<Card.Content>
						<Chart.Container config={postsOverTimeConfig} class="aspect-auto h-[150px] w-full">
							<BarChart
								data={combinedData.discussionAnalytics.postsOverTime}
								x="week"
								series={[
									{
										key: 'posts',
										label: 'Posts',
										color: postsOverTimeConfig.posts.color
									}
								]}
								props={{
									bars: { stroke: 'none', rounded: 'none' },
									xAxis: { format: () => '' },
									yAxis: { format: (v) => `${v}` }
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip />
								{/snippet}
							</BarChart>
						</Chart.Container>
					</Card.Content>
				</Card.Root>
			</div>

			<Card.Root class="shadow-none">
				<Card.Content class="pt-0 pb-0">
					<Table.Root class="w-full table-fixed">
						<Table.Header class="border-b">
							<Table.Row>
								<Table.Head class="w-64">
									<div class="flex items-center gap-1">
										<span>Student</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by name"
											onclick={() => {
												if (daSortKey === 'name') daSortDir = daSortDir === 'asc' ? 'desc' : 'asc';
												else {
													daSortKey = 'name';
													daSortDir = 'asc';
												}
											}}
										>
											{#if daSortKey === 'name'}{#if daSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-64">
									<div class="flex items-center gap-1">
										<span>Questions Posted</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by questions posted"
											onclick={() => {
												if (daSortKey === 'questionsPosted')
													daSortDir = daSortDir === 'asc' ? 'desc' : 'asc';
												else {
													daSortKey = 'questionsPosted';
													daSortDir = 'desc';
												}
											}}
										>
											{#if daSortKey === 'questionsPosted'}{#if daSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-64">
									<div class="flex items-center gap-1">
										<span>Questions Answered</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by questions answered"
											onclick={() => {
												if (daSortKey === 'questionsAnswered')
													daSortDir = daSortDir === 'asc' ? 'desc' : 'asc';
												else {
													daSortKey = 'questionsAnswered';
													daSortDir = 'desc';
												}
											}}
										>
											{#if daSortKey === 'questionsAnswered'}{#if daSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head class="w-64">
									<div class="flex items-center gap-1">
										<span>Total Contributions</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by total contributions"
											onclick={() => {
												if (daSortKey === 'totalContributions')
													daSortDir = daSortDir === 'asc' ? 'desc' : 'asc';
												else {
													daSortKey = 'totalContributions';
													daSortDir = 'desc';
												}
											}}
										>
											{#if daSortKey === 'totalContributions'}{#if daSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
								<Table.Head>
									<div class="flex items-center gap-1">
										<span>Last Active</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-5 w-5 p-0"
											aria-label="Sort by last active"
											onclick={() => {
												if (daSortKey === 'lastActive')
													daSortDir = daSortDir === 'asc' ? 'desc' : 'asc';
												else {
													daSortKey = 'lastActive';
													daSortDir = 'asc';
												}
											}}
										>
											{#if daSortKey === 'lastActive'}{#if daSortDir === 'asc'}<ArrowUp
														class="h-4 w-4"
													/>{:else}<ArrowDown />{/if}{:else}<ArrowUpDown class="h-4 w-4" />{/if}
										</Button>
									</div>
								</Table.Head>
							</Table.Row>
						</Table.Header>
					</Table.Root>
					<div class="h-56 overflow-y-auto [scrollbar-gutter:stable]">
						<Table.Root class="w-full table-fixed">
							<Table.Body>
								{#each daFilteredStudents() as student}
									<Table.Row>
										<Table.Cell class="w-64 font-medium">
											<Button
												variant="link"
												href={`/subjects/${data.subject.id}/class/${data.subjectOfferingClassId}/analytics/student/${student.id}`}
												class="text-primary h-auto truncate p-0 font-medium hover:underline"
											>
												{student.firstName}
												{student.lastName}
											</Button>
										</Table.Cell>
										<Table.Cell class="w-64">{student.questionsPosted}</Table.Cell>
										<Table.Cell class="w-64">{student.questionsAnswered}</Table.Cell>
										<Table.Cell class="w-64">
											<Badge variant="secondary">{student.totalContributions}</Badge>
										</Table.Cell>
										<Table.Cell>{student.lastActive}</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
					<div class="text-muted-foreground mt-2 flex justify-end text-sm">
						Showing {daFilteredStudents().length} of {combinedData.discussionAnalytics.students
							.length} students
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>
