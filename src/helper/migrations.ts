import { supportMultipleRepos } from 'migrations/supportMultipleRepos';
import { DEFAULT_SETTINGS, GitHobsSettings } from 'settings';

export type GenericSettings = Record<string, unknown> & { version: number };

const MIGRATIONS: Array<(settings: GenericSettings) => GenericSettings> = [supportMultipleRepos];

export function migrate(settings: GenericSettings | undefined): {
	newSettings: GitHobsSettings;
	migrationsApplied: boolean;
} {
	// If this is your first time opening githobs
	if (!settings || Object.keys(settings).length === 0) {
		return {
			newSettings: DEFAULT_SETTINGS,
			migrationsApplied: true
		};
	}
	const migrationsToApply = MIGRATIONS.splice(settings.version ?? 0);

	if (migrationsToApply.length === 0) {
		return { newSettings: settings as unknown as GitHobsSettings, migrationsApplied: false };
	}

	let newSettings = settings;

	// Apply all migrations sequently
	for (const migration of migrationsToApply) {
		newSettings = migration(newSettings);
	}

	return { newSettings: newSettings as unknown as GitHobsSettings, migrationsApplied: true };
}
