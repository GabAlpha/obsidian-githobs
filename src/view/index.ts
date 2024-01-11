/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ItemView, MarkdownView, Notice, WorkspaceLeaf, setIcon } from 'obsidian';
import { GitHobsSettings } from 'settings';
import { MarkdownFile } from 'types';
import * as PropertiesHelper from '../helper/properties';
import { changeIssueId, fetchIssue, pullIssue, pushIssue } from 'view/actions';

export const GithubIssueControlsViewType = 'github-issue-controls-view';

export enum GitHubIssueStatus {
	CanPush = 'can-push',
	CanPull = 'can-pull'
}
export class GithubIssueControlsView extends ItemView {
	readonly settings: GitHobsSettings;
	fetchDate: string | undefined;
	status: GitHubIssueStatus | undefined;
	issueId: string | undefined;

	constructor(leaf: WorkspaceLeaf, settings: GitHobsSettings) {
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
		this.issueId = undefined;
		this.draw();
	}

	public setFetchDate(fetchDate: string) {
		this.fetchDate = fetchDate;
	}

	public setIssueId(issueId: string | undefined) {
		this.issueId = issueId;
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
		this.setIssueId(PropertiesHelper.readIssueId(fileOpened.data));

		const viewContainer = createContainer(rootElement);

		if (!this.settings.repo || !this.settings.owner || !this.settings.token) {
			obContainer.empty();

			createInfoSection(
				viewContainer,
				{
					info: 'Missing settings! 🚨',
					description: `Please setup settings first`
				},
				true
			);

			createInfoSection(viewContainer, {
				info: 'Reload',
				button: {
					icon: 'refresh-ccw',
					action: async () => {
						this.reload(editor);
					}
				}
			});

			obContainer.appendChild(viewContainer);
			return;
		}

		createInfoSection(
			viewContainer,
			{
				info: 'Issue Editor 🦤',
				description: 'Repo: ',
				descriptionBold: this.settings.repo
			},
			true
		);

		createInfoSection(viewContainer, {
			info: 'Issue number:',
			button: {
				icon: 'crosshair',
				action: async () => {
					if (!this.issueId) {
						new Notice('Select a issue id');
						return;
					}
					return await changeIssueId(this.issueId, fileOpened, this.settings);
				}
			},
			input: {
				value: this.issueId?.trim() ?? '',
				type: 'number',
				onChange: async (val) => this.setIssueId(val)
			}
		});

		createInfoSection(viewContainer, {
			info: 'Fetch',
			description: this.issueId ? this.fetchDate : 'First push',
			button: {
				icon: 'refresh-ccw',
				action: async () => {
					if (!this.issueId || !fileOpened.file) {
						return;
					}

					const fetchedIssue = await fetchIssue(
						this.issueId,
						this.settings,
						fileOpened.file
					);
					this.setFetchDate(fetchedIssue.date);
					this.status = fetchedIssue.status;
					this.reload(editor);
				}
			}
		});

		createInfoSection(viewContainer, {
			info: 'Push',
			description:
				this.status === GitHubIssueStatus.CanPush ? '🟢 Changes can be pushed' : '',
			button: {
				icon: 'upload',
				action: async () => {
					await pushIssue(this.issueId, fileOpened, this.settings);
					this.status = undefined;
					this.reload(editor);
				}
			}
		});

		if (this.issueId) {
			createInfoSection(viewContainer, {
				info: 'Pull',
				description:
					this.status === GitHubIssueStatus.CanPull
						? '🔴 New version available'
						: undefined,
				button: {
					icon: 'download',
					action: async () => {
						await pullIssue(this.issueId!, fileOpened, this.settings);
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
		descriptionBold,
		button,
		dropdown,
		input
	}: {
		info: string;
		description?: string;
		descriptionBold?: string;
		button?: { icon: string; action: () => Promise<void> };
		dropdown?: { items: { text: string; value: string }[] };
		input?: { type: string; value: string; onChange: (val: string) => Promise<void> };
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
	infoElement.createDiv({ cls: 'setting-item-name', text: info });

	if (description) {
		const descEl = infoElement.createDiv({
			cls: 'setting-item-description',
			text: description
		});

		if (descriptionBold) {
			descEl.createEl('strong', { text: descriptionBold });
		}
	}

	let settingControl: HTMLDivElement;

	if (button || dropdown || input) {
		settingControl = i.createDiv({ cls: 'setting-item-control' });

		if (input) {
			const inputEl = settingControl.createEl('input', { cls: 'githobs-input' });
			inputEl.setAttribute('type', input.type);
			inputEl.setAttribute('value', input.value);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			inputEl.onchange = (val: any) => {
				input.onChange(val.target.value);
			};
		}

		if (dropdown) {
			const select = settingControl.createEl('select');
			select.className = 'dropdown';
			dropdown.items.forEach((i) => {
				const o = select.createEl('option', { text: i.text });
				o.setAttribute('value', i.value);
			});
		}

		if (button) {
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
	}

	return i;
}
