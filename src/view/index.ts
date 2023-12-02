import { ItemView, MarkdownView, WorkspaceLeaf, setIcon } from 'obsidian';
import { GitHubIssueEditorSettings } from 'settings';
import { MarkdownFile } from 'types';
import * as PropertiesHelper from '../helper/properties';
import { fetchIssue, pullIssue, pushIssue } from 'view/actions';

export const GithubIssueControlsViewType = 'github-issue-controls-view';

export enum GitHubIssueStatus {
	CanPush = 'can-push',
	CanPull = 'can-pull'
}
export class GithubIssueControlsView extends ItemView {
	readonly settings: GitHubIssueEditorSettings;
	fetchDate: string | undefined;
	status: GitHubIssueStatus | undefined;

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
		this.fetchDate = undefined;
		this.status = undefined;
		this.draw();
	}

	public saveFetchDate(fetchDate: string) {
		this.fetchDate = fetchDate;
	}

	public reload(editor: MarkdownView | null) {
		editor?.editor.focus();
		this.draw();
	}

	private readonly draw = (): void => {
		const obContainer = this.containerEl.children[1];
		const fileOpened = this.leaf.view.app.workspace.activeEditor as MarkdownFile | null;
		const editor = this.leaf.view.app.workspace.getActiveViewOfType(MarkdownView);

		if (!fileOpened) {
			obContainer.empty();
			return;
		}

		const rootElement = document.createElement('div');
		const issueId = PropertiesHelper.readIssueId(fileOpened.data);

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
			info: 'Fetch',
			description: issueId ? this.fetchDate : 'First push',
			button: {
				icon: 'refresh-ccw',
				action: async () => {
					if (!issueId || !fileOpened.file) {
						return;
					}

					const fetchedIssue = await fetchIssue(issueId, this.settings, fileOpened.file);
					this.saveFetchDate(fetchedIssue.date);
					this.status = fetchedIssue.status;
					this.reload(editor);
				}
			}
		});

		createInfoSection(viewContainer, {
			info: 'Push',
			description: this.status === GitHubIssueStatus.CanPush ? 'Changes can be pushed' : '',
			button: {
				icon: 'upload',
				action: async () => {
					await pushIssue(issueId, fileOpened, this.settings);
					this.status = undefined;
					this.reload(editor);
				}
			}
		});

		if (issueId) {
			createInfoSection(viewContainer, {
				info: 'Pull',
				description:
					this.status === GitHubIssueStatus.CanPull ? 'New version available' : undefined,
				button: {
					icon: 'download',
					action: async () => {
						await pullIssue(issueId, fileOpened, this.settings);
						this.status = undefined;
						this.reload(editor);
					}
				}
			});
		}

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
	}: {
		info: string;
		description?: string;
		button?: { icon: string; action: () => Promise<void> };
	},
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

		btn.onclick = async () => {
			setIcon(btn, 'hourglass');
			btn.setAttr('disabled', '');
			await button.action();
			setIcon(btn, button.icon);
			btn.removeAttribute('disabled');
		};
	}

	return i;
}
