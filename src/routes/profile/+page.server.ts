import { userTypeEnum } from '$lib/enums';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { getUserProfileById, updateUserPassword } from '$lib/server/db/service';
import { verify } from '@node-rs/argon2';
import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ locals: { security } }) => {
	const currentUser = security.isAuthenticated().getUser();
	const profile = await getUserProfileById(currentUser.id);

	if (!profile) {
		throw error(404, 'User not found');
	}

	return { profile };
};

export const actions = {
	changePassword: async ({ request, locals: { security } }) => {
		const currentUser = security.isAuthenticated().getUser();

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

		try {
			await updateUserPassword(currentUser.id, newPassword);
			const message = 'Password changed successfully!';

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
