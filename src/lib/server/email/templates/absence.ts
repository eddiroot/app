import { sendEmail } from '..';

export async function sendAbsenceEmail(
	to: string,
	studentName: string,
	className: string,
	date: Date,
) {
	const formattedDate = date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	});

	sendEmail({
		to,
		subject: `Absence Notification for ${studentName}`,
		text: `Dear Guardian,\n\nThis is to inform you that your child, ${studentName}, was absent from class ${className} on ${formattedDate}.\n\nBest regards,\nThe eddi Team`,
	});
}
