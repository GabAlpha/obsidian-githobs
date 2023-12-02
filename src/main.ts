import { MarkdownFileInfo, MarkdownView, Plugin } from 'obsidian';

import * as PropertiesHelper from './helper/properties';
import * as Api from 'api';
import { DEFAULT_SETTINGS, GitHubIssueEditorSettings, SettingTab } from 'settings';
import { GithubIssueControlsView, GithubIssueControlsViewType } from 'view';

export default class GithubIssueEditor extends Plugin {
	settings: GitHubIssueEditorSettings;
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

		// const syncBtn = this.addRibbonIcon('upload', 'Create a github issue', async () => {
		// 	const file = this.app.workspace.activeEditor as MarkdownFileInfo & { data: string };
		// 	const issueId = PropertiesHelper.readIssueId(file.data);

		// 	if (issueId) {
		// 		await Api.updateIssue(this.settings, issueId, {
		// 			title: file.file?.basename ?? '',
		// 			body: PropertiesHelper.removeProperties(file.data)
		// 		});

		// 		return;
		// 	}

		// 	const res = await Api.createIssue(this.settings, {
		// 		title: file.file?.basename ?? '',
		// 		body: PropertiesHelper.removeProperties(file.data)
		// 	});

		// 	if (res.status === 201) {
		// 		const propertiesWithGithubIssue = PropertiesHelper.writeIssueId(
		// 			file.data!,
		// 			res.json.number
		// 		);

		// 		this.app.vault.modify(
		// 			file.file!,
		// 			`${propertiesWithGithubIssue}\n${PropertiesHelper.removeProperties(file.data)}`
		// 		);
		// 	}
		// });

		this.addRibbonIcon('github', 'Manage a github issue', async () => {
			this.toggleGitHubIssueControlsView();
		});

		this.addSettingTab(new SettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
