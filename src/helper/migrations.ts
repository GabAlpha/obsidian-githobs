import { supportMultipleRepos } from 'migrations/supportMultipleRepos';
import { GitHobsSettings } from 'settings';

export type GenericSettings = Record<string, unknown> & { version: number };

const MIGRATIONS: Array<(settings: GenericSettings) => GenericSettings> = [supportMultipleRepos];

export function migrate(settings: GenericSettings): GitHobsSettings {
	const migrationsToApply = MIGRATIONS.splice(settings.version ?? 0);

	let newSettings = settings;

	// Apply all migrations sequently
	for (const migration of migrationsToApply) {
		newSettings = migration(newSettings);
	}

	return newSettings as unknown as GitHobsSettings;
}
