<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';

	interface Props {
		type: string;
	}

	const { type }: Props = $props();

	const variant = $derived(
		type === 'teacher'
			? 'default'
			: type === 'student'
				? 'success'
				: type.toLowerCase().includes('admin')
					? 'destructive'
					: 'secondary',
	);

	const spacedType = $derived(type.replace(/([a-z])([A-Z])/g, '$1 $2'));
</script>

<Badge {variant} class="capitalize">{spacedType}</Badge>
