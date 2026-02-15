<script lang="ts">
	import { enhance } from '$app/forms';
	import HeroClayStudents from '$lib/assets/hero-clay-students.jpeg';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	let { form } = $props();
</script>

<div class="grid h-full lg:grid-cols-2">
	<div class="flex flex-1 items-center justify-center">
		<div class="w-full max-w-xs">
			<form method="POST" action="?/login" use:enhance>
				<div class="grid gap-6">
					<div class="flex flex-col gap-4">
						<Button href="/login/google" variant="outline" class="w-full">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 640 640"
								fill="currentColor"
								class="h-4 w-4"
								><path
									d="M564 325.8C564 467.3 467.1 568 324 568C186.8 568 76 457.2 76 320C76 182.8 186.8 72 324 72C390.8 72 447 96.5 490.3 136.9L422.8 201.8C334.5 116.6 170.3 180.6 170.3 320C170.3 406.5 239.4 476.6 324 476.6C422.2 476.6 459 406.2 464.8 369.7L324 369.7L324 284.4L560.1 284.4C562.4 297.1 564 309.3 564 325.8z"
								/></svg
							>
							Login with Google
						</Button>
						<Button href="/login/microsoft" variant="outline" class="w-full">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 640 640"
								fill="currentColor"
								class="h-4 w-4"
								><path
									d="M96 96L310.6 96L310.6 310.6L96 310.6L96 96zM329.4 96L544 96L544 310.6L329.4 310.6L329.4 96zM96 329.4L310.6 329.4L310.6 544L96 544L96 329.4zM329.4 329.4L544 329.4L544 544L329.4 544L329.4 329.4z"
								/></svg
							>
							Login with Microsoft
						</Button>
					</div>
					<div
						class="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t"
					>
						<span class="bg-card text-muted-foreground relative z-10 px-2">
							Or continue with
						</span>
					</div>
					{#if form?.message}
						<div
							class="border-destructive/30 bg-destructive/10 text-destructive rounded-md border p-4 text-sm"
						>
							{form.message}
						</div>
					{/if}
					<div class="grid gap-6">
						<div class="grid gap-3">
							<Label for="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								autocomplete="email"
								required
							/>
						</div>
						<div class="grid gap-3">
							<Label for="password">Password</Label>
							<Input
								id="password"
								name="password"
								type="password"
								autocomplete="current-password"
								required
							/>
						</div>
						<Button type="submit" class="w-full">Login</Button>
					</div>
				</div>
			</form>
		</div>
	</div>
	<div class="bg-muted relative hidden lg:block">
		<img
			src={HeroClayStudents}
			alt="students in a classroom"
			class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.4]"
		/>
	</div>
</div>
