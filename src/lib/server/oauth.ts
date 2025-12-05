import { Google, MicrosoftEntraId } from 'arctic';
import { Resource } from 'sst';

let _google: Google | null = null;
export function getGoogle(): Google {
	if (!_google) {
		_google = new Google(
			Resource.GoogleClientID.value,
			Resource.GoogleClientSecret.value,
			'http://localhost:5173/login/google/callback'
		);
	}
	return _google;
}

let _microsoft: MicrosoftEntraId | null = null;
export function getMicrosoft(): MicrosoftEntraId {
	if (!_microsoft) {
		_microsoft = new MicrosoftEntraId(
			Resource.MicrosoftTenantID.value,
			Resource.MicrosoftClientID.value,
			Resource.MicrosoftClientSecret.value,
			'http://localhost:5173/login/microsoft/callback'
		);
	}
	return _microsoft;
}

// Keep backwards-compatible exports using getters
export const google = new Proxy({} as Google, {
	get(_, prop) {
		return Reflect.get(getGoogle(), prop);
	}
});

export const microsoft = new Proxy({} as MicrosoftEntraId, {
	get(_, prop) {
		return Reflect.get(getMicrosoft(), prop);
	}
});
