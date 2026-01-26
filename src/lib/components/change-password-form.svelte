<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Lock from '@lucide/svelte/icons/lock';

	let {
		form,
		open = $bindable(false),
		onSuccess,
		isAdmin = false,
		isOwnProfile = true,
		targetUserName = '',
	}: {
		form: any;
		open?: boolean;
		onSuccess?: () => void;
		isAdmin?: boolean;
		isOwnProfile?: boolean;
		targetUserName?: string;
	} = $props();

	let showCurrentPassword = $state(false);
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);
	let isSubmitting = $state(false);

	function togglePasswordVisibility(field: 'current' | 'new' | 'confirm') {
		switch (field) {
			case 'current':
				showCurrentPassword = !showCurrentPassword;
				break;
			case 'new':
				showNewPassword = !showNewPassword;
				break;
			case 'confirm':
				showConfirmPassword = !showConfirmPassword;
				break;
		}
	}

	function handleClose() {
		open = false;
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
	>
		<Card class="w-full max-w-md">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Lock class="h-5 w-5" />
					{#if isOwnProfile}
						Change Password
					{:else}
						Change Password for {targetUserName}
					{/if}
				</CardTitle>
				<CardDescription>
					{#if isOwnProfile}
						Enter your current password and choose a new one.
					{:else}
						Set a new password for this user.
					{/if}
				</CardDescription>
			</CardHeader>

			<CardContent>
				<form
					method="POST"
					action="?/changePassword"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result, update }) => {
							isSubmitting = false;
							if (result.type === 'success') {
								handleClose();
								onSuccess?.();
							}
							await update();
						};
					}}
					class="space-y-4"
				>
					{#if form?.message}
						<div
							class="rounded-md p-3 text-sm {form.success
								? 'border border-green-200 bg-green-50 text-green-700'
								: 'border border-red-200 bg-red-50 text-red-700'}"
						>
							{form.message}
						</div>
					{/if}

					{#if isOwnProfile}
						<div class="space-y-2">
							<Label for="currentPassword">Current Password</Label>
							<div class="relative">
								<Input
									id="currentPassword"
									name="currentPassword"
									type={showCurrentPassword ? 'text' : 'password'}
									required
									disabled={isSubmitting}
									class="pr-10"
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									class="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
									onclick={() => togglePasswordVisibility('current')}
									disabled={isSubmitting}
								>
									{#if showCurrentPassword}
										<EyeOff />
									{:else}
										<Eye />
									{/if}
								</Button>
							</div>
						</div>
					{/if}

					<div class="space-y-2">
						<Label for="newPassword">New Password</Label>
						<div class="relative">
							<Input
								id="newPassword"
								name="newPassword"
								type={showNewPassword ? 'text' : 'password'}
								required
								disabled={isSubmitting}
								class="pr-10"
								minlength={6}
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								class="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
								onclick={() => togglePasswordVisibility('new')}
								disabled={isSubmitting}
							>
								{#if showNewPassword}
									<EyeOff />
								{:else}
									<Eye />
								{/if}
							</Button>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="confirmPassword">Confirm New Password</Label>
						<div class="relative">
							<Input
								id="confirmPassword"
								name="confirmPassword"
								type={showConfirmPassword ? 'text' : 'password'}
								required
								disabled={isSubmitting}
								class="pr-10"
								minlength={6}
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								class="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
								onclick={() => togglePasswordVisibility('confirm')}
								disabled={isSubmitting}
							>
								{#if showConfirmPassword}
									<EyeOff />
								{:else}
									<Eye />
								{/if}
							</Button>
						</div>
					</div>

					<div class="flex justify-end gap-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onclick={handleClose}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{#if isSubmitting}
								Changing...
							{:else}
								Change Password
							{/if}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	</div>
{/if}
