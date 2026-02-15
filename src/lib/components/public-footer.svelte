<script lang="ts">
	import InstagramIcon from '@lucide/svelte/icons/instagram';
	import LinkedinIcon from '@lucide/svelte/icons/linkedin';
	import MailIcon from '@lucide/svelte/icons/mail';
	import PhoneIcon from '@lucide/svelte/icons/phone';
</script>

<footer class="bg-muted/30 border-t py-12">
	<div class="container mx-auto px-4 lg:px-8">
		<div
			class="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start"
		>
			<div class="text-center md:text-left">
				<h2 class="mb-2 text-xl font-bold">eddi</h2>
				<p class="text-muted-foreground text-sm">
					© {new Date().getFullYear()} EDDI EDUCATION PTY LTD trading as eddi. All
					rights reserved.
				</p>
			</div>
			<div class="text-muted-foreground flex flex-col gap-3 text-sm">
				<a
					href="mailto:hello@eddi.com.au"
					class="hover:text-foreground flex items-center gap-2 transition-colors"
				>
					<MailIcon class="h-4 w-4" />
					<span>hello@eddi.com.au</span>
				</a>
				<a
					href="tel:0428373729"
					class="hover:text-foreground flex items-center gap-2 transition-colors"
				>
					<PhoneIcon class="h-4 w-4" />
					<span>0428 373 729</span>
				</a>
				<a
					href="https://instagram.com/eddi.au"
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-foreground flex items-center gap-2 transition-colors"
				>
					<InstagramIcon class="h-4 w-4" />
					<span>@eddi.au</span>
				</a>
				<a
					href="https://www.linkedin.com/company/eddi-education"
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-foreground flex items-center gap-2 transition-colors"
				>
					<LinkedinIcon class="h-4 w-4" />
					<span>eddi-education</span>
				</a>
			</div>
		</div>
	</div>
</footer>
