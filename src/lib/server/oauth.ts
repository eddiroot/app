import { Google, MicrosoftEntraId } from 'arctic';
import { Resource } from 'sst';

export const google = new Google(
	Resource.GoogleClientId.value,
	Resource.GoogleClientSecret.value,
	'http://localhost:5173/login/google/callback'
);

export const microsoft = new MicrosoftEntraId(
	Resource.MicrosoftTenantId.value,
	Resource.MicrosoftClientId.value,
	Resource.MicrosoftClientSecret.value,
	'http://localhost:5173/login/microsoft/callback'
);
