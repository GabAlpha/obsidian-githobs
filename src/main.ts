import {
	App,
	MarkdownFileInfo,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	requestUrl
} from 'obsidian';
import { readIssueId, removeProperties, writeIssueId } from 'utils';

// Remember to rename these classes and interfaces!

interface GitHubIssueEditorSettings {
	token: string;
	owner: string;
	repo: string;
}

const DEFAULT_SETTINGS: GitHubIssueEditorSettings = {
	token: '',
	owner: '',
	repo: ''
};

export default class GithubIssueEditor extends Plugin {
	settings: GitHubIssueEditorSettings;

	async onload() {
		await this.loadSettings();

		const isOnMarkdownView = this.app.workspace.getActiveViewOfType(MarkdownView);

		const syncBtn = this.addRibbonIcon('upload', 'Create a github issue', async () => {
			const file = this.app.workspace.activeEditor as MarkdownFileInfo & { data: string };
			const issueId = readIssueId(file.data);

			if (issueId) {
				const res = await requestUrl({
					url: `https://api.github.com/repos/${this.settings.owner}/${this.settings.repo}/issues/${issueId}`,
					headers: { Authorization: `Bearer ${this.settings.token}` },
					method: 'PATCH',
					body: JSON.stringify({
						title: file.file?.basename ?? '',
						body: removeProperties(file.data)
					})
				});

				if (res.status === 200) {
					new Notice('Issue successfully updated!');
				}
				return;
			}

			const res = await requestUrl({
				url: `https://api.github.com/repos/${this.settings.owner}/${this.settings.repo}/issues`,
				headers: { Authorization: `Bearer ${this.settings.token}` },
				method: 'POST',
				body: JSON.stringify({
					title: file.file?.basename ?? '',
					body: removeProperties(file.data)
				})
			});

			if (res.status === 201) {
				new Notice('Issue successfully created');
				const propertiesWithGithubIssue = writeIssueId(file.data!, res.json.number);
				this.app.vault.modify(
					file.file!,
					`${propertiesWithGithubIssue}\n${removeProperties(file.data)}`
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

class SettingTab extends PluginSettingTab {
	plugin: GithubIssueEditor;

	constructor(app: App, plugin: GithubIssueEditor) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Github token')
			.setDesc('Add the github token')
			.addText((text) =>
				text
					.setPlaceholder('Enter your secret')
					.setValue(this.plugin.settings.token)
					.onChange(async (value) => {
						this.plugin.settings.token = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Owner repo')
			.setDesc('The owner of the repo')
			.addText((text) =>
				text
					.setPlaceholder('Enter your secret')
					.setValue(this.plugin.settings.owner)
					.onChange(async (value) => {
						this.plugin.settings.owner = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Repo name')
			.setDesc('The repo name')
			.addText((text) =>
				text
					.setPlaceholder('Enter your secret')
					.setValue(this.plugin.settings.repo)
					.onChange(async (value) => {
						this.plugin.settings.repo = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
