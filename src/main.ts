import { GenericSettings, migrate } from 'helper/migrations';
import { Plugin } from 'obsidian';

import { GitHobsSettings, SettingTab } from 'settings';
import { GithubIssueControlsView, GithubIssueControlsViewType } from 'view';

export default class GitHobs extends Plugin {
	settings: GitHobsSettings;
	gitHubIssueControlsView: GithubIssueControlsView;

	private readonly toggleGitHubIssueControlsView = async (): Promise<void> => {
		const existing = this.app.workspace.getLeavesOfType(GithubIssueControlsViewType);
		if (existing.length) {
			this.app.workspace.revealLeaf(existing[0]);
			return;
		}

		await this.app.workspace.getRightLeaf(false).setViewState({
			type: GithubIssueControlsViewType,
			active: true
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(GithubIssueControlsViewType)[0]
		);
	};

	async onload() {
		await this.loadSettings();

		this.registerView(
			GithubIssueControlsViewType,
			(leaf) =>
				(this.gitHubIssueControlsView = new GithubIssueControlsView(leaf, this.settings))
		);

		this.addRibbonIcon('github', 'Manage a github issue', async () => {
			this.toggleGitHubIssueControlsView();
		});

		this.addSettingTab(new SettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on('file-open', () => this.gitHubIssueControlsView.load())
		);
	}

	onunload() {}

	async loadSettings() {
		const originalSettings: GenericSettings = await this.loadData();
		const { newSettings, migrationsApplied } = migrate(originalSettings);

		// Save settings if migrations have been applied
		if (migrationsApplied) {
			await this.saveData(newSettings);
		}

		this.settings = newSettings;

		// Debug only
		// Merge originalSettings with DEFAULT_SETTINGS
		// this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
