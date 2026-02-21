// import { env } from '$env/dynamic/private';
// import nodemailer from 'nodemailer';

// if (!env.EMAIL_HOST) throw new Error('EMAIL_HOST is not set');
// if (!env.EMAIL_PORT) throw new Error('EMAIL_PORT is not set');
// if (!env.EMAIL_USER) throw new Error('EMAIL_USER is not set');
// if (!env.EMAIL_PASS) throw new Error('EMAIL_PASS is not set');

// const transporter = nodemailer.createTransport({
//   host: env.EMAIL_HOST,
//   port: parseInt(env.EMAIL_PORT, 10),
//   secure: true,
//   auth: {
//     user: env.EMAIL_USER,
//     pass: env.EMAIL_PASS
//   }
// });

interface SendEmailParams {
	to: string;
	subject: string;
	text: string;
}

export function sendEmail({ to, subject, text }: SendEmailParams) {
	console.log('Sending email:', { to, subject, text });
	// transporter.sendMail({
	//   from: '',
	//   to,
	//   subject,
	//   text
	// });
}
