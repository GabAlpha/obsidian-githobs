import GitHobs from 'main';
import { App, PluginSettingTab, Setting } from 'obsidian';

export interface GitHobsSettings {
	token: string;
	owner: string;
	repo: string;
}

export const DEFAULT_SETTINGS: GitHobsSettings = {
	token: '',
	owner: '',
	repo: ''
};

function createSetting(
	plugin: GitHobs,
	container: HTMLElement,
	args: {
		name: string;
		description: string;
		placeholder?: string;
		value: keyof GitHobsSettings;
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
	plugin: GitHobs;

	constructor(app: App, plugin: GitHobs) {
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
