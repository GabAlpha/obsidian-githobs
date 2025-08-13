import GitHobs from 'main';
import { App, PluginSettingTab, Setting } from 'obsidian';

export type Repo = {
	code: string;
	owner: string;
	repo: string;
};

export interface GitHobsSettings {
	token: string;
	repos: Repo[];
}

export const DEFAULT_SETTINGS: GitHobsSettings = {
	token: '',
	repos: []
};

function createFormSetting(
	plugin: GitHobs,
	container: HTMLElement,
	args: {
		name: string;
		description?: string | DocumentFragment;
		placeholder?: string;
		value: string;
		onChange: (val: string) => void;
	}
) {
	const { name, description, placeholder } = args;
	const { value, onChange } = args;

	new Setting(container)
		.setName(name)
		.setDesc(description ?? '')
		.addText((text) =>
			text
				.setPlaceholder(placeholder ?? '')
				.setValue(value)
				.onChange(async (val) => {
					onChange(val);
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
		const { containerEl, plugin } = this;
		const settingsValues = plugin.settings;

		containerEl.empty();

		const createDescriptionWithLink = ({
			text,
			href,
			aText
		}: {
			text: string;
			href: string;
			aText: string;
		}) => {
			const fragment = document.createDocumentFragment();
			const div = fragment.createDiv({ text: text });
			div.createEl('a', { href: href, text: aText });
			fragment.append(div);
			return fragment;
		};

		createFormSetting(plugin, containerEl, {
			name: 'Github Token',
			description: createDescriptionWithLink({
				href: 'https://github.com/settings/tokens/new',
				text: 'Add the github token, alternately ',
				aText: 'create one'
			}),
			placeholder: 'Enter your secret',
			value: settingsValues.token,
			onChange: (val) => (plugin.settings.token = val)
		});

		const div = containerEl.createDiv({ cls: 'setting-item' });
		const div1 = div.createDiv({ cls: 'setting-item-info' });
		div1.createEl('strong', { text: 'Repos Manager' });
		const div2 = div.createDiv({ cls: 'settings-item-control' });
		const addRepoBtn = div2.createEl('button', { text: 'Add repo', cls: 'mod-cta' });

		addRepoBtn.onclick = async () => {
			settingsValues.repos = [...settingsValues.repos, { owner: '', repo: '', code: '' }];
			await plugin.saveSettings();
			// reload
			this.display();
		};

		settingsValues.repos.forEach((repo, idx) => {
			createFormSetting(plugin, containerEl, {
				name: 'Owner repo',
				value: repo.owner,
				onChange: (val) => {
					plugin.settings.repos[idx].owner = val.trim();
				}
			});

			createFormSetting(plugin, containerEl, {
				name: 'Repo name',
				value: repo.repo,
				onChange: (val) => {
					plugin.settings.repos[idx].repo = val.trim();
					plugin.settings.repos[idx].code = `${plugin.settings.repos[idx].owner}|${val}`;
				}
			});

			const removeRepoBtn = containerEl.createEl('button', { text: 'canc' });

			removeRepoBtn.onclick = async () => {
				settingsValues.repos = settingsValues.repos.filter((_, sIdx) => sIdx !== idx);
				await plugin.saveSettings();
				this.display();
			};
		});
	}
}
