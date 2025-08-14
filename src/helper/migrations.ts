import { supportMultipleRepos } from 'migrations/supportMultipleRepos';
import { GitHobsSettings } from 'settings';

export type GenericSettings = Record<string, unknown> & { version: number };

const MIGRATIONS: Array<(settings: GenericSettings) => GenericSettings> = [supportMultipleRepos];

export function migrate(settings: GenericSettings): GitHobsSettings {
	const { version } = settings;

	// Apply all migrations sequently
	// Index 0
	const migrationsToApply = MIGRATIONS.splice(version - 1);

	let newSettings = settings;

	for (const migration of migrationsToApply) {
		newSettings = migration(newSettings);
	}

	return newSettings as unknown as GitHobsSettings;
}
