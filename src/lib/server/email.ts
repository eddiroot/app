interface SendEmailParams {
	to: string;
	subject: string;
	text: string;
	html: string;
}

export function sendEmail({ to, subject, text, html }: SendEmailParams) {
	console.log('Sending email:', { to, subject, text, html });
}

export async function sendAbsenceEmail(
	to: string,
	studentName: string,
	className: string,
	date: Date
) {
	const formattedDate = date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});

	sendEmail({
		to,
		subject: `Absence Notification for ${studentName}`,
		text: `Dear Guardian,\n\nThis is to inform you that your child, ${studentName}, was absent from class ${className} on ${formattedDate}.\n\nBest regards,\nThe eddi Team`,
		html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Absence Notification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        color: #333;
        line-height: 1.6;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f9f9f9;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .header {
        font-size: 1.5rem;
        font-weight: bold;
        color: #d25a3c;
        margin-bottom: 20px;
      }
      .content {
        font-size: 1rem;
      }
      .footer {
        margin-top: 20px;
        font-size: 0.9rem;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">Absence Notification for ${studentName}</div>
      <div class="content">
        <p>Dear Guardian,</p>
        <p>This is to inform you that your child, <strong>${studentName}</strong>, was absent from class <strong>${className}</strong> on <strong>${formattedDate}</strong>.</p>
        <p>Best regards,<br>The eddi Team</p>
      </div>
      <div class="footer">
        <p>If you have any questions, feel free to contact us.</p>
      </div>
    </div>
  </body>
</html>`
	});
}
