import GithubIssueEditor from 'main';
import { App, PluginSettingTab, Setting } from 'obsidian';

export interface GitHubIssueEditorSettings {
	token: string;
	owner: string;
	repo: string;
}

export const DEFAULT_SETTINGS: GitHubIssueEditorSettings = {
	token: '',
	owner: '',
	repo: ''
};

function createSetting(
	plugin: GithubIssueEditor,
	container: HTMLElement,
	args: {
		name: string;
		description: string;
		placeholder?: string;
		value: keyof GitHubIssueEditorSettings;
	}
) {
	const { name, description, placeholder, value } = args;

	new Setting(container)
		.setName(name)
		.setDesc(description)
		.addText((text) =>
			text
				.setPlaceholder(placeholder ?? '')
				.setValue(plugin.settings[value])
				.onChange(async (val) => {
					plugin.settings[value] = val;
					await plugin.saveSettings();
				})
		);
}

export class SettingTab extends PluginSettingTab {
	plugin: GithubIssueEditor;

	constructor(app: App, plugin: GithubIssueEditor) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		createSetting(this.plugin, containerEl, {
			name: 'Github Token',
			description: 'Add the github token',
			placeholder: 'Enter your secret',
			value: 'token'
		});

		createSetting(this.plugin, containerEl, {
			name: 'Owner repo',
			description: 'The owner of the repo',
			value: 'owner'
		});

		createSetting(this.plugin, containerEl, {
			name: 'Repo name',
			description: 'The repo name',
			value: 'repo'
		});
	}
}
