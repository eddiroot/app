<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from '$lib/components/ui/card';
	import CheckIcon from '@lucide/svelte/icons/check';
</script>

<div class="container mx-auto px-4 py-16">
	<!-- Two Column Layout -->
	<div class="mx-auto grid max-w-6xl items-start gap-8 md:grid-cols-2">
		<!-- Pricing Card -->
		<div>
			<Card class="border-2">
				<CardHeader class="pb-8 text-center">
					<CardTitle class="mb-2 text-2xl">Standard</CardTitle>
					<CardDescription>Everything eddi has to offer</CardDescription>
					<div class="mt-4">
						<div class="flex items-baseline justify-center gap-2">
							<span class="font-mono text-5xl font-bold">$15</span>
							<span class="text-muted-foreground">per student / year</span>
						</div>
					</div>
				</CardHeader>
				<CardContent class="space-y-6">
					<ul class="grid grid-cols-2 gap-3">
						<li class="flex items-start gap-3">
							<CheckIcon class="text-primary mt-0.5 h-5 w-5 shrink-0" />
							<span>All the features on our home page</span>
						</li>
						<li class="flex items-start gap-3">
							<CheckIcon class="text-primary mt-0.5 h-5 w-5 shrink-0" />
							<span>World-class support</span>
						</li>
					</ul>

					<div class="border-t pt-4">
						<p class="text-muted-foreground text-sm">
							<strong>Note:</strong> any AI usage costs are billed separately based
							on actual consumption. We pass these costs on to you with no markup.
						</p>
					</div>

					<Button class="w-full" size="lg" href="/demo">Book a Demo</Button>
				</CardContent>
			</Card>
		</div>

		<!-- Benefits Section -->
		<Card class="border-none shadow-none">
			<CardHeader>
				<CardTitle class="text-3xl">Simple, Transparent Pricing</CardTitle>
			</CardHeader>
			<CardContent class="text-muted-foreground space-y-4 text-xl">
				<p>
					Schools have enough complexity to deal with. Your software pricing
					shouldn't be one of them. When you choose eddi, you get <strong
						>everything</strong
					> we offer.
				</p>
				<p>
					For AI features, we charge you exactly what our providers charge us.
					We believe in transparency, which is why we separate these variable
					costs rather than hiding them in inflated base pricing.
				</p>
			</CardContent>
		</Card>
	</div>
</div>
