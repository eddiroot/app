<script>
	import PublicFooter from '$lib/components/public-footer.svelte';
	import PublicHeader from '$lib/components/public-header.svelte';

	let { children } = $props();
</script>

<PublicHeader />
{@render children()}
<PublicFooter />
