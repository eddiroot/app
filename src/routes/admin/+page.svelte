<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import BuildingIcon from '@lucide/svelte/icons/building';
	import BusIcon from '@lucide/svelte/icons/bus';
	import Calendar1 from '@lucide/svelte/icons/calendar';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import ContactIcon from '@lucide/svelte/icons/contact';
	import DoorOpenIcon from '@lucide/svelte/icons/door-open';
	import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
	import LecternIcon from '@lucide/svelte/icons/lectern';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import SchoolIcon from '@lucide/svelte/icons/school';
	import UserRoundCogIcon from '@lucide/svelte/icons/user-round-cog';
	import UsersIcon from '@lucide/svelte/icons/users';

	const { data } = $props();

	const adminSections = [
		{
			title: 'School',
			description: "Configure your school's name, logo, branding, and theme settings",
			icon: SchoolIcon,
			href: '/admin/school'
		},
		{
			title: 'Campuses',
			description: 'Manage campuses and their associated contact information',
			icon: MapPinIcon,
			href: '/admin/campuses'
		},
		{
			title: 'Terms',
			description: 'Set up terms and semesters for the school year',
			icon: Calendar1,
			href: '/admin/terms'
		},
		{
			title: 'Buildings',
			description: 'Configure the buildings on your campus',
			icon: BuildingIcon,
			href: '/admin/buildings'
		},
		{
			title: 'Spaces',
			description: 'Manage the learning and activity spaces within each building',
			icon: DoorOpenIcon,
			href: '/admin/spaces'
		},
		{
			title: 'Users',
			description: 'Manage user accounts for students, staff, guardians, and administrators',
			icon: UsersIcon,
			href: '/admin/users'
		},
		{
			title: 'Subjects',
			description: 'Define the subjects that your school offers',
			icon: BookOpenIcon,
			href: '/admin/subjects'
		},
		{
			title: 'Timetables',
			description: 'Set up school periods, schedules, and generate class timetables',
			icon: CalendarDaysIcon,
			href: '/admin/timetables'
		},
		{
			title: 'Allocations',
			description: 'Assign students and teachers to classes and manage enrollments',
			icon: ContactIcon,
			href: '/admin/allocations'
		},
		{
			title: 'Events',
			description: 'Create and manage school, campus, subject, and class-level events',
			icon: BusIcon,
			href: '/admin/events'
		},
		{
			title: 'Interviews',
			description: 'Configure and manage parent-teacher interview sessions',
			icon: MessageSquareIcon,
			href: '/admin/interviews'
		},
		{
			title: 'Behaviours',
			description: 'Configure student behaviours that teachers can quickly log',
			icon: LecternIcon,
			href: '/admin/behaviours'
		}
	];

	const stats = [
		{
			title: 'Students',
			value: data.stats.totalStudents,
			icon: UsersIcon
		},
		{
			title: 'Teachers',
			value: data.stats.totalTeachers,
			icon: GraduationCapIcon
		},
		{
			title: 'Admins',
			value: data.stats.totalAdmins,
			icon: UserRoundCogIcon
		},
		{
			title: 'Subjects',
			value: data.stats.totalSubjects,
			icon: BookOpenIcon
		}
	];
</script>

<div class="space-y-8">
	<h1 class="text-3xl font-bold tracking-tight">Admin</h1>

	<!-- Admin Sections -->
	<div class="space-y-4">
		<h2 class="text-2xl font-semibold tracking-tight">Functions</h2>
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each adminSections as section}
				<a href={section.href} class="block">
					<Card.Root class="h-40">
						<Card.Header class="gap-4">
							<div class="flex items-center gap-3">
								<div class="bg-primary rounded-lg p-2">
									<section.icon class="text-primary-foreground" />
								</div>
								<div class="flex-1">
									<Card.Title class="text-lg font-semibold">{section.title}</Card.Title>
								</div>
							</div>
							<Card.Description>{section.description}</Card.Description>
						</Card.Header>
					</Card.Root>
				</a>
			{/each}
		</div>
	</div>

	<!-- Quick Stats Section -->
	<div class="space-y-4">
		<h2 class="text-2xl font-semibold tracking-tight">Stats</h2>
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{#each stats as stat}
				<Card.Root>
					<Card.Header class="flex items-center justify-between">
						<Card.Title class="text-primary">{stat.title}</Card.Title>
						<stat.icon class="text-primary" />
					</Card.Header>
					<Card.Content>
						<p class="text-2xl font-bold">{stat.value}</p>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</div>
</div>
