import { GenericSettings } from 'helper/migrations';

/**
From (version 0)
{
	"token": string
	"repo": string
	"owner": string
}

To (version 1)
{
	version: number;
	token: string;
	repos: {
		code: string;
		owner: string;
		repo: string;
	}[];
}
*/
export function supportMultipleRepos(settings: GenericSettings) {
	if (settings.version) {
		return settings;
	}

	const newSettings: Partial<GenericSettings> = {};
	newSettings.token = settings.token;
	newSettings.repos = [
		{ owner: settings.owner, repo: settings.repo, code: `${settings.owner}|${settings.repo}` }
	];
	newSettings.version = 1;

	return newSettings as GenericSettings;
}
