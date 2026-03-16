import { userGenderEnum } from '$lib/enums';

export function convertToFullName(
	firstName: string | null | undefined,
	middleName: string | null | undefined,
	lastName: string | null | undefined,
): string {
	const parts: string[] = [];
	if (firstName) {
		parts.push(firstName);
	}
	if (middleName) {
		parts.push(middleName);
	}
	if (lastName) {
		parts.push(lastName);
	}

	return parts.join(' ').trim();
}

export function convertToInitials(
	firstName: string,
	middleName: string | null,
	lastName: string,
): string {
	return `${firstName.charAt(0)}${middleName?.charAt(0) ?? ''}${lastName.charAt(0)}`.toUpperCase();
}

export function formatGender(gender: userGenderEnum) {
	if (gender == userGenderEnum.unspecified) return 'Not specified';
	return gender.charAt(0).toUpperCase() + gender.slice(1);
}
