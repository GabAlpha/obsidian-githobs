import {
	App,
	Editor,
	MarkdownFileInfo,
	MarkdownView,
	Modal,
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

export default class MyPlugin extends Plugin {
	settings: GitHubIssueEditorSettings;

	async onload() {
		await this.loadSettings();

		const isOnMarkdownView = this.app.workspace.getActiveViewOfType(MarkdownView);

		// This creates an icon in the left ribbon.
		const syncBtn = this.addRibbonIcon(
			'upload',
			'Create a github issue',
			async (evt: MouseEvent) => {
				const file = this.app.workspace.activeEditor as MarkdownFileInfo & { data: string };

				const res = await requestUrl({
					url: `https://api.github.com/repos/${this.settings.owner}/${this.settings.repo}/issues`,
					headers: { Authorization: `Bearer ${this.settings.token}` },
					method: 'POST',
					body: JSON.stringify({ title: file.file?.basename ?? '', body: file.data })
				});

				if (res.status === 201) {
					new Notice('Issue successfully created');
					const propertiesWithGithubIssue = writeIssueId(file.data!, res.json.number);
					this.app.vault.modify(
						file.file!,
						`${propertiesWithGithubIssue}\n${removeProperties(file.data)}`
					);
				}
			}
		);

		syncBtn.style.display = isOnMarkdownView ? 'inherit' : 'none';
		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				if (isOnMarkdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
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
