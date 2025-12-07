import { building } from '$app/environment';
import { Google, MicrosoftEntraId } from 'arctic';
import { Resource } from 'sst';

let _google: Google | null = null;
let _microsoft: MicrosoftEntraId | null = null;

if (!building) {
	const isProd = ['production'].includes(Resource.App?.stage);
	_google = new Google(
		Resource.GoogleClientID.value,
		Resource.GoogleClientSecret.value,
		isProd
			? 'https://eddi.com.au/login/google/callback'
			: 'http://localhost:5173/login/google/callback'
	);

	_microsoft = new MicrosoftEntraId(
		Resource.MicrosoftTenantID.value,
		Resource.MicrosoftClientID.value,
		Resource.MicrosoftClientSecret.value,
		isProd
			? 'https://eddi.com.au/login/microsoft/callback'
			: 'http://localhost:5173/login/microsoft/callback'
	);
}

export const google = _google;
export const microsoft = _microsoft;
