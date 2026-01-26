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
