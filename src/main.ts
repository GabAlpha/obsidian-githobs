import { MarkdownFileInfo, MarkdownView, Plugin } from 'obsidian';

import * as PropertiesHelper from './helper/properties';
import * as Api from 'api';
import { DEFAULT_SETTINGS, GitHubIssueEditorSettings, SettingTab } from 'settings';

export default class GithubIssueEditor extends Plugin {
	settings: GitHubIssueEditorSettings;

	async onload() {
		await this.loadSettings();

		const isOnMarkdownView = this.app.workspace.getActiveViewOfType(MarkdownView);

		const syncBtn = this.addRibbonIcon('upload', 'Create a github issue', async () => {
			const file = this.app.workspace.activeEditor as MarkdownFileInfo & { data: string };
			const issueId = PropertiesHelper.readIssueId(file.data);

			if (issueId) {
				await Api.updateIssue(this.settings, issueId, {
					title: file.file?.basename ?? '',
					body: PropertiesHelper.removeProperties(file.data)
				});

				return;
			}

			const res = await Api.createIssue(this.settings, {
				title: file.file?.basename ?? '',
				body: PropertiesHelper.removeProperties(file.data)
			});

			if (res.status === 201) {
				const propertiesWithGithubIssue = PropertiesHelper.writeIssueId(
					file.data!,
					res.json.number
				);

				this.app.vault.modify(
					file.file!,
					`${propertiesWithGithubIssue}\n${PropertiesHelper.removeProperties(file.data)}`
				);
			}
		});

		syncBtn.style.display = isOnMarkdownView ? 'inherit' : 'none';

		this.addSettingTab(new SettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			syncBtn.style.display = this.app.workspace.getActiveViewOfType(MarkdownView)
				? 'inherit'
				: 'none';
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
