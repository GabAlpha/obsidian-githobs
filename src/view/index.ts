import { ItemView, WorkspaceLeaf, setIcon } from 'obsidian';
import { GitHubIssueEditorSettings } from 'settings';

export const GithubIssueControlsViewType = 'github-issue-controls-view';

export class GithubIssueControlsView extends ItemView {
	readonly settings: GitHubIssueEditorSettings;

	constructor(leaf: WorkspaceLeaf, settings: GitHubIssueEditorSettings) {
		super(leaf);
		this.settings = settings;
	}

	public getViewType(): string {
		return GithubIssueControlsViewType;
	}

	public getDisplayText(): string {
		return 'Github Issue Controls';
	}

	public getIcon(): string {
		return 'github';
	}

	public load(): void {
		super.load();
		this.draw();
	}

	private readonly draw = (): void => {
		const obContainer = this.containerEl.children[1];
		const rootElement = document.createElement('div');

		const viewContainer = createContainer(rootElement);
		createInfoSection(
			viewContainer,
			{
				info: 'Issue Editor 🦤',
				description: `Repo: <strong>${this.settings.repo}</strong>`
			},
			true
		);
		createInfoSection(viewContainer, {
			info: 'Check status',
			description: '',
			button: { icon: 'refresh-ccw', action: () => {} }
		});
		createInfoSection(viewContainer, {
			info: 'Push Issue',
			button: { icon: 'upload', action: () => {} }
		});
		createInfoSection(viewContainer, {
			info: 'Pull Issue',
			button: { icon: 'download', action: () => {} }
		});

		obContainer.empty();
		obContainer.appendChild(viewContainer);
	};
}

function createContainer(rootEl: HTMLDivElement) {
	const c = rootEl.createDiv({ cls: 'vertical-tab-content-container' });
	return c;
}

function createInfoSection(
	containerToAppend: HTMLDivElement,
	{
		info,
		description,
		button
	}: { info: string; description?: string; button?: { icon: string; action: () => void } },
	headerInfo = false
) {
	let i: HTMLDivElement;

	if (!headerInfo) {
		i = containerToAppend.createDiv({ cls: 'setting-item' });
	} else {
		i = containerToAppend.createDiv({ cls: 'setting-item setting-item-heading' });
	}

	const infoElement = i.createDiv({ cls: 'setting-item-info' });
	infoElement.createDiv({ cls: 'setting-item-name' }).innerHTML = info;

	if (description) {
		infoElement.createDiv({
			cls: 'setting-item-description'
		}).innerHTML = description;
	}

	if (button) {
		const settingControl = i.createDiv({ cls: 'setting-item-control' });
		const btn = settingControl.createEl('button');
		setIcon(btn, button.icon);
		btn.onclick = button.action;
	}

	return i;
}
