<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Avatar,
		AvatarFallback,
		AvatarImage,
	} from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		convertToFullName,
		convertToInitials,
		formatGender,
		formatTimestampAsDate,
		formatUserType,
		getRoleBadgeVariant,
	} from '$lib/utils';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Circle from '@lucide/svelte/icons/circle';
	import Mail from '@lucide/svelte/icons/mail';
	import UserLock from '@lucide/svelte/icons/user-lock';
	import { toast } from 'svelte-sonner';

	let { data, form } = $props();

	let showChangePasswordForm = $state(false);
	let isSubmitting = $state(false);
</script>

<div class="container mx-auto max-w-6xl p-6">
	<header class="bg-card space-y-8 rounded-lg border p-6 shadow-sm">
		<div
			class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
		>
			<div class="flex items-center gap-4">
				<Avatar class="h-16 w-16 md:h-20 md:w-20">
					<AvatarImage
						src={data.profile.avatarPath}
						alt="Your profile picture"
					/>
					<AvatarFallback class="text-lg font-semibold">
						{convertToInitials(
							data.profile.firstName,
							data.profile?.middleName,
							data.profile.lastName,
						)}
					</AvatarFallback>
				</Avatar>

				<div class="flex flex-col gap-2">
					<h2 class="text-foreground text-2xl font-bold md:text-3xl">
						{convertToFullName(
							data.profile.firstName,
							data.profile.middleName,
							data.profile.lastName,
						)}
					</h2>
					<div class="text-muted-foreground flex items-center gap-2">
						<Mail />
						<span>{data.profile.email}</span>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-2 sm:flex-row">
				{@render changePasswordDialog()}
			</div>
		</div>
		<div class="flex flex-col gap-4">
			<div class="text-muted-foreground flex gap-2">
				<UserLock />
				<span>Roles:</span>
				<Badge variant={getRoleBadgeVariant(data.profile.type)}>
					{formatUserType(data.profile.type)}
				</Badge>
			</div>

			<div class="text-muted-foreground flex gap-2">
				<Calendar />
				<span>Date of birth:</span>
				<Badge variant="outline">
					{#if data.profile?.dateOfBirth}
						{formatTimestampAsDate(data.profile.dateOfBirth)}
					{:else}
						Not specified
					{/if}
				</Badge>
			</div>

			<div class="text-muted-foreground flex gap-2">
				<Circle />
				<span>Gender:</span>
				<Badge variant="outline">
					{formatGender(data.profile.gender)}
				</Badge>
			</div>
		</div>
	</header>
</div>

{#snippet changePasswordDialog()}
	<Dialog.Root bind:open={showChangePasswordForm}>
		<form
			method="POST"
			action="?/changePassword"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ result, update }) => {
					isSubmitting = false;
					if (result.type === 'success') {
						toast.success(result.data?.message as string);
						showChangePasswordForm = false;
					}
					await update();
				};
			}}
			class="space-y-4"
		>
			<Dialog.Trigger
				type="button"
				class={buttonVariants({ variant: 'outline' })}
			>
				Change Password
			</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-106.25">
				<Dialog.Header>
					<Dialog.Title>Change Password</Dialog.Title>
					<Dialog.Description>
						Enter your current password and choose a new one.
					</Dialog.Description>
				</Dialog.Header>
				{#if form?.message}
					<div
						class="rounded-md p-3 text-sm {form.success
							? 'bg-success/50 text-success border border-green-200'
							: 'bg-destructive/50 text-destructive border border-red-200'}"
					>
						{form.message}
					</div>
				{/if}
				<div class="space-y-2">
					<Label for="currentPassword">Current Password</Label>
					<Input
						id="currentPassword"
						name="currentPassword"
						type="password"
						required
						disabled={isSubmitting}
						class="pr-10"
					/>
				</div>
				<div class="space-y-2">
					<Label for="newPassword">New Password</Label>
					<Input
						id="newPassword"
						name="newPassword"
						type="password"
						required
						disabled={isSubmitting}
						class="pr-10"
						minlength={6}
					/>
				</div>
				<div class="space-y-2">
					<Label for="confirmPassword">Confirm New Password</Label>
					<Input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						required
						disabled={isSubmitting}
						class="pr-10"
						minlength={6}
					/>
				</div>
				<Dialog.Footer>
					<Dialog.Close
						type="button"
						class={buttonVariants({ variant: 'outline' })}
					>
						Cancel
					</Dialog.Close>
					<Button type="submit" disabled={isSubmitting}>
						{#if isSubmitting}
							Changing...
						{:else}
							Change
						{/if}
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</form>
	</Dialog.Root>
{/snippet}
