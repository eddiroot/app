<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import ContactIcon from '@lucide/svelte/icons/contact';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import SchoolIcon from '@lucide/svelte/icons/school';

	const eventTypes = [
		{
			type: 'school',
			title: 'School Events',
			description: 'e.g. end-of-year ceremonies, open days, and holidays.',
			href: '/admin/events/school',
			icon: SchoolIcon,
		},
		{
			type: 'campus',
			title: 'Campus Events',
			description: 'e.g. sports days, campus tours, and community events',
			href: '/admin/events/campus',
			icon: MapPinIcon,
		},
		{
			type: 'subject',
			title: 'Subject Events',
			description: 'e.g. year-wide exams, excursions, and presentations',
			href: '/admin/events/subject',
			icon: BookOpenIcon,
		},
		{
			type: 'class',
			title: 'Class Events',
			description: 'e.g. tests, class trips, and special activities',
			href: '/admin/events/class',
			icon: ContactIcon,
		},
	];
</script>

<div class="space-y-8">
	<h1 class="text-3xl font-bold tracking-tight">Events</h1>
	<div class="grid gap-6 md:grid-cols-2">
		{#each eventTypes as eventType}
			<a href={eventType.href} class="block">
				<Card.Root class="h-56">
					<Card.Header>
						<div class="mb-4 flex items-center justify-center">
							<div class="bg-primary rounded-2xl p-4 shadow-sm">
								<eventType.icon class="h-8 w-8 text-white" />
							</div>
						</div>
						<div class="space-y-3 text-center">
							<Card.Title class="text-xl font-semibold"
								>{eventType.title}</Card.Title
							>
							<Card.Description
								class="text-muted-foreground px-2 text-sm leading-relaxed"
							>
								{eventType.description}
							</Card.Description>
						</div>
					</Card.Header>
				</Card.Root>
			</a>
		{/each}
	</div>
</div>
