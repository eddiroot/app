<script>
	import PublicHeader from '$lib/components/public-header.svelte';

	let { children } = $props();
</script>

<PublicHeader />
{@render children()}
