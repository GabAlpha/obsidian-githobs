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
		description?: string | DocumentFragment;
		placeholder?: string;
		value: keyof GitHobsSettings;
	}
) {
	const { name, description, placeholder, value } = args;

	new Setting(container)
		.setName(name)
		.setDesc(description ?? '')
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

		const createHTMLDescription = (innerHTML: string) => {
			const fragment = document.createDocumentFragment();
			const div = document.createElement('div');
			div.innerHTML = innerHTML;
			fragment.append(div);
			return fragment;
		};

		createSetting(this.plugin, containerEl, {
			name: 'Github Token',
			description: createHTMLDescription(
				'Add the github token, alternately <a href="https://github.com/settings/tokens/new">create one</a>'
			),
			placeholder: 'Enter your secret',
			value: 'token'
		});

		createSetting(this.plugin, containerEl, {
			name: 'Owner repo',
			value: 'owner'
		});

		createSetting(this.plugin, containerEl, {
			name: 'Repo name',
			value: 'repo'
		});
	}
}
