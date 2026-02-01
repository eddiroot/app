<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { userPermissions, type userTypeEnum } from '$lib/enums';
	import {
		type School,
		type SchoolCampus,
		type Subject,
		type SubjectOffering,
	} from '$lib/server/db/schema';
	import { convertToFullName, getPermissions } from '$lib/utils';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import BookOpenCheckIcon from '@lucide/svelte/icons/book-open-check';
	import BookOpenTextIcon from '@lucide/svelte/icons/book-open-text';
	import BowArrowIcon from '@lucide/svelte/icons/bow-arrow';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import DoorClosed from '@lucide/svelte/icons/door-closed';
	import FileQuestionIcon from '@lucide/svelte/icons/file-question';
	import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
	import HomeIcon from '@lucide/svelte/icons/home';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import MapIcon from '@lucide/svelte/icons/map';
	import MessagesSquareIcon from '@lucide/svelte/icons/messages-square';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import OrbitIcon from '@lucide/svelte/icons/orbit';
	import PiIcon from '@lucide/svelte/icons/pi';
	import RouteIcon from '@lucide/svelte/icons/route';
	import SunIcon from '@lucide/svelte/icons/sun';
	import UserIcon from '@lucide/svelte/icons/user';
	import UsersIcon from '@lucide/svelte/icons/users';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import { resetMode, setMode } from 'mode-watcher';

	let {
		subjects,
		user,
		school,
		campuses,
	}: {
		subjects: Array<{
			subject: Subject;
			subjectOffering: SubjectOffering;
			classes: Array<{ id: number; name: string; subOfferingId: number }>;
		}>;
		user: {
			id: string;
			email: string;
			type: userTypeEnum;
			firstName: string;
			middleName: string | null;
			lastName: string;
		} | null;
		school: School | null;
		campuses: SchoolCampus[];
	} = $props();

	const headerItems = [
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: LayoutDashboardIcon,
			requiredPermission: userPermissions.viewDashboard,
		},
		{
			title: 'Admin',
			url: '/admin',
			icon: WrenchIcon,
			requiredPermission: userPermissions.viewAdmin,
		},
		{
			title: 'Calendar',
			url: '/calendar',
			icon: CalendarDaysIcon,
			requiredPermission: userPermissions.viewCalendar,
		},
		{
			title: 'Attendance',
			url: '/attendance',
			icon: UsersIcon,
			requiredPermission: userPermissions.viewGuardianAttendance,
		},
	];

	const subjectItems = [
		{ title: 'Discussion', url: 'discussion', icon: MessagesSquareIcon },
		{
			title: 'Curriculum',
			url: 'curriculum',
			icon: RouteIcon,
			requiredPermission: userPermissions.viewCourseMap,
		},
	];

	const classItems = [
		{ title: 'Home', url: '', icon: HomeIcon },
		{
			title: 'Attendance',
			url: 'attendance',
			icon: UsersIcon,
			requiredPermission: userPermissions.viewClassAttendance,
		},
		{ title: 'Tasks', url: 'tasks', icon: BookOpenCheckIcon },
		{
			title: 'Analytics',
			url: 'analytics',
			icon: BarChart3Icon,
			requiredPermission: userPermissions.viewAnalytics,
		},
	];

	const subjectNameToIcon = (name: string) => {
		if (name.toLowerCase().includes('math')) {
			return PiIcon;
		}
		if (name.toLowerCase().includes('science')) {
			return FlaskConicalIcon;
		}
		if (name.toLowerCase().includes('physics')) {
			return OrbitIcon;
		}
		if (name.toLowerCase().includes('history')) {
			return BowArrowIcon;
		}
		if (name.toLowerCase().includes('english')) {
			return BookOpenTextIcon;
		}
		if (name.toLowerCase().includes('geography')) {
			return MapIcon;
		}
		return FileQuestionIcon;
	};

	const userData = () => user;
	const sidebar = Sidebar.useSidebar();
	const fullName = convertToFullName(
		userData()?.firstName,
		userData()?.middleName,
		userData()?.lastName,
	);
	let form: HTMLFormElement | null = $state(null);
	let openSubjectIds = $state<number[]>([]);

	function getInitials(
		firstName: string | null,
		lastName: string | null,
	): string {
		return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
	}

	function isMainItemActive(itemUrl: string): boolean {
		return page.url.pathname === itemUrl;
	}

	function isSubjectActive(subjectId: string): boolean {
		return page.url.pathname.startsWith(`/subjects/${subjectId}`);
	}

	function isClassActive(subjectOfferingId: string, classId: string): boolean {
		return page.url.pathname.startsWith(
			`/subjects/${subjectOfferingId}/class/${classId}`,
		);
	}

	function isSubjectSubItemActive(subjectId: string, subUrl: string): boolean {
		const subjectBasePath = `/subjects/${subjectId}`;

		if (subUrl === '') return page.url.pathname === subjectBasePath;

		const expectedPath = `${subjectBasePath}/${subUrl}`;
		return (
			page.url.pathname === expectedPath ||
			page.url.pathname.startsWith(expectedPath + '/')
		);
	}

	function isClassSubItemActive(
		subjectOfferingId: string,
		classId: string,
		subUrl: string,
	): boolean {
		const classBasePath = `/subjects/${subjectOfferingId}/class/${classId}`;

		if (subUrl === '') return page.url.pathname === classBasePath;

		const expectedPath = `${classBasePath}/${subUrl}`;
		return (
			page.url.pathname === expectedPath ||
			page.url.pathname.startsWith(expectedPath + '/')
		);
	}

	const campusesData = () => campuses;
	let currentCampus = $state(
		campusesData().length > 0 ? campusesData()[0] : null,
	);
	const permissions = $state(getPermissions(userData()?.type));
</script>

<Sidebar.Root collapsible="icon" side="left" variant="inset">
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton
								size="lg"
								class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								{...props}
							>
								<Avatar.Root class="h-8 w-8 rounded-lg">
									<Avatar.Image
										src={school?.logoPath || '/favicon.png'}
										alt="{school?.name || 'school'} logo"
									/>
								</Avatar.Root>
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-medium"
										>{school?.name || 'No school found'}</span
									>
									<span class="truncate text-xs"
										>{currentCampus?.name || 'No campus selected'}</span
									>
								</div>
								<ChevronsUpDownIcon className="ml-auto size-4" />
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content side="bottom">
						{#each campuses as campus (campus.id)}
							<DropdownMenu.Item
								class="cursor-pointer"
								onclick={() => {
									currentCampus = campus;
								}}
							>
								<span>{campus.name}</span>
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each headerItems as item (item.url)}
						{#if !item.requiredPermission || permissions.includes(item.requiredPermission)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton
									isActive={isMainItemActive(item.url)}
									tooltipContent={item.title}
								>
									{#snippet child({ props })}
										<a href={item.url} {...props}>
											<item.icon />
											<span>{item.title}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/if}
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
		{#if subjects.length > 0}
			<Sidebar.Group>
				<Sidebar.GroupLabel class="text-lg font-semibold">
					Subjects
				</Sidebar.GroupLabel>
				<Sidebar.Menu>
					{#each subjects as subject (subject.subject.id)}
						{@const subjectOfferingId = subject.subjectOffering.id}
						<Collapsible.Root
							class="group/collapsible"
							open={openSubjectIds.includes(subjectOfferingId)}
						>
							<Collapsible.Trigger>
								{#snippet child({ props })}
									<Sidebar.MenuButton
										tooltipContent={subject.subject.name}
										isActive={isSubjectActive(
											subject.subjectOffering.id.toString(),
										)}
										{...props}
										onclick={(e) => {
											// If the sidebar is open, normal state toggling
											if (sidebar.open) {
												if (openSubjectIds.includes(subjectOfferingId)) {
													openSubjectIds = openSubjectIds.filter(
														(id) => id !== subjectOfferingId,
													);
												} else {
													openSubjectIds = [
														...openSubjectIds,
														subjectOfferingId,
													];
												}
											}

											// If the sidebar is closed but the clicked subject is not open
											if (
												!sidebar.open &&
												!openSubjectIds.includes(subjectOfferingId)
											) {
												openSubjectIds = [...openSubjectIds, subjectOfferingId];
											}

											// Open the sidebar if it's closed
											if (!sidebar.open) {
												sidebar.setOpen(true);
											}

											e.preventDefault();
										}}
									>
										{@const IconComponent = subjectNameToIcon(
											subject.subject.name,
										)}
										<IconComponent class="mr-2" />
										<span class="whitespace-nowrap">{subject.subject.name}</span
										>
										<ChevronDownIcon
											class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
										/>
									</Sidebar.MenuButton>
								{/snippet}
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{#each subjectItems as item (item.url)}
										{#if !item.requiredPermission || permissions.includes(item.requiredPermission)}
											<Sidebar.MenuSubItem>
												<Sidebar.MenuSubButton
													isActive={isSubjectSubItemActive(
														subject.subjectOffering.id.toString(),
														item.url,
													)}
												>
													{#snippet child({ props })}
														<a
															href={`/subjects/${subject.subjectOffering.id}/${item.url}`}
															{...props}
														>
															<item.icon />
															<span>{item.title}</span>
														</a>
													{/snippet}
												</Sidebar.MenuSubButton>
											</Sidebar.MenuSubItem>
										{/if}
									{/each}
									{#each subject.classes as classItem (classItem.id)}
										<Collapsible.Root class="group/collapsible-class">
											<Collapsible.Trigger>
												{#snippet child({ props })}
													<Sidebar.MenuSubButton
														isActive={isClassActive(
															subject.subjectOffering.id.toString(),
															classItem.id.toString(),
														)}
														{...props}
													>
														<DoorClosed />
														<span>Class {classItem.name}</span>
														<ChevronDownIcon
															class="ml-auto transition-transform group-data-[state=open]/collapsible-class:rotate-180"
														/>
													</Sidebar.MenuSubButton>
												{/snippet}
											</Collapsible.Trigger>
											<Collapsible.Content>
												<Sidebar.MenuSub>
													{#each classItems as item (item.url)}
														{#if !item.requiredPermission || permissions.includes(item.requiredPermission)}
															<Sidebar.MenuSubItem>
																<Sidebar.MenuSubButton
																	isActive={isClassSubItemActive(
																		subject.subjectOffering.id.toString(),
																		classItem.id.toString(),
																		item.url,
																	)}
																>
																	{#snippet child({ props })}
																		<a
																			href={`/subjects/${subject.subjectOffering.id}/class/${classItem.id}/${item.url}`}
																			{...props}
																		>
																			<item.icon />
																			<span>{item.title}</span>
																		</a>
																	{/snippet}
																</Sidebar.MenuSubButton>
															</Sidebar.MenuSubItem>
														{/if}
													{/each}
												</Sidebar.MenuSub>
											</Collapsible.Content>
										</Collapsible.Root>
									{/each}
								</Sidebar.MenuSub>
							</Collapsible.Content>
						</Collapsible.Root>
					{/each}
				</Sidebar.Menu>
			</Sidebar.Group>
		{/if}
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton
								size="lg"
								class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								{...props}
							>
								<Avatar.Root class="h-8 w-8 rounded-lg">
									<Avatar.Image alt={fullName} />
									<Avatar.Fallback class="rounded-lg"
										>{getInitials(
											user?.firstName || '?',
											user?.lastName || '?',
										)}</Avatar.Fallback
									>
								</Avatar.Root>
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-medium">{fullName}</span>
									<span class="truncate text-xs">{user?.email}</span>
								</div>
								<ChevronsUpDownIcon className="ml-auto size-4" />
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						side={sidebar.isMobile ? 'bottom' : 'right'}
						align="end"
					>
						<DropdownMenu.Item
							class="cursor-pointer"
							onclick={() => goto(`/profile/${user?.id}`)}
						>
							<UserIcon />
							Profile
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Sub>
							<DropdownMenu.SubTrigger>
								<SunIcon
									class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
								/>
								<MoonIcon
									class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
								/>
								Theme</DropdownMenu.SubTrigger
							>
							<DropdownMenu.SubContent>
								<DropdownMenu.Item onclick={() => setMode('light')}
									>Light</DropdownMenu.Item
								>
								<DropdownMenu.Item onclick={() => setMode('dark')}
									>Dark</DropdownMenu.Item
								>
								<DropdownMenu.Item onclick={() => resetMode()}
									>System</DropdownMenu.Item
								>
							</DropdownMenu.SubContent>
						</DropdownMenu.Sub>
						<DropdownMenu.Separator />
						<form method="post" action="/?/logout" bind:this={form}>
							<DropdownMenu.Item
								class="cursor-pointer"
								onclick={() => form!.submit()}
							>
								<LogOutIcon />
								<input type="submit" value="Logout" class="cursor-pointer" />
							</DropdownMenu.Item>
						</form>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
