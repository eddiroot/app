import { env } from '$env/dynamic/private';
import { Google, MicrosoftEntraId } from 'arctic';

const isProd = env.APP_ENV === 'production';

export const google = new Google(
	env.GOOGLE_CLIENT_ID,
	env.GOOGLE_CLIENT_SECRET,
	isProd
		? 'https://eddi.com.au/login/google/callback'
		: 'http://localhost:5173/login/google/callback'
);

export const microsoft = new MicrosoftEntraId(
	env.MICROSOFT_TENANT_ID,
	env.MICROSOFT_CLIENT_ID,
	env.MICROSOFT_CLIENT_SECRET,
	isProd
		? 'https://eddi.com.au/login/microsoft/callback'
		: 'http://localhost:5173/login/microsoft/callback'
);
