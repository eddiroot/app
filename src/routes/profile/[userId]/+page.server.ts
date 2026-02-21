import { userTypeEnum } from '$lib/enums';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { getUserProfileById, updateUserPassword } from '$lib/server/db/service';
import { verify } from '@node-rs/argon2';
import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params, locals: { security } }) => {
	const currentUser = security.isAuthenticated().getUser();
	const targetUserId = params.userId;

	// Get the target user's profile
	const profile = await getUserProfileById(targetUserId);

	if (!profile) {
		throw error(404, 'User not found');
	}

	// Anyone can view any profile, but only owner/admin can change password
	const isOwnProfile = currentUser.id === targetUserId;
	const isAdmin = currentUser.type === userTypeEnum.admin;

	return { profile, isOwnProfile, isAdmin, currentUser };
};
export const actions = {
	changePassword: async ({ params, request, locals: { security } }) => {
		const currentUser = security.isAuthenticated().getUser();
		const targetUserId = params.userId;

		// Check permissions: user can change their own password or admin can change any password
		const isOwnProfile = currentUser.id === targetUserId;
		const isAdmin = currentUser.type === userTypeEnum.admin;

		if (!isOwnProfile && !isAdmin) {
			return fail(403, { message: 'Access denied.', success: false });
		}

		const formData = await request.formData();
		const currentPassword = formData.get('currentPassword')?.toString();
		const newPassword = formData.get('newPassword')?.toString();
		const confirmPassword = formData.get('confirmPassword')?.toString();

		// Validation
		if (!newPassword || !confirmPassword) {
			return fail(400, {
				message: 'New password and confirmation are required.',
				success: false,
			});
		}

		if (newPassword.length < 6) {
			return fail(400, {
				message: 'New password must be at least 6 characters long.',
				success: false,
			});
		}

		if (newPassword !== confirmPassword) {
			return fail(400, {
				message: 'New passwords do not match.',
				success: false,
			});
		}

		// For own profile, require current password verification
		if (isOwnProfile) {
			if (!currentPassword) {
				return fail(400, {
					message: 'Current password is required.',
					success: false,
				});
			}

			if (currentPassword === newPassword) {
				return fail(400, {
					message: 'New password must be different from current password.',
					success: false,
				});
			}

			// Get current user with password hash for verification
			const [existingUser] = await db
				.select()
				.from(table.user)
				.where(eq(table.user.id, currentUser.id))
				.limit(1);

			if (!existingUser || !existingUser.passwordHash) {
				return fail(400, {
					message: 'Unable to verify current password.',
					success: false,
				});
			}

			// Verify current password
			const validCurrentPassword = await verify(
				existingUser.passwordHash,
				currentPassword,
			);
			if (!validCurrentPassword) {
				return fail(400, {
					message: 'Current password is incorrect.',
					success: false,
				});
			}
		}

		try {
			// Update password for target user
			await updateUserPassword(targetUserId, newPassword);

			const message = isOwnProfile
				? 'Password changed successfully!'
				: `Password changed successfully for ${targetUserId}!`;

			return { message, success: true };
		} catch (error) {
			console.error('Error changing password:', error);
			return fail(500, {
				message:
					'An error occurred while changing the password. Please try again.',
				success: false,
			});
		}
	},
};
