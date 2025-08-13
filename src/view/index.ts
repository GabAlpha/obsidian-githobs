/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ItemView, MarkdownView, Notice, WorkspaceLeaf, setIcon } from 'obsidian';
import { GitHobsSettings } from 'settings';
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
	selectedRepo: string | undefined;

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
		this.selectedRepo = undefined;
		this.draw();
	}

	public setFetchDate(fetchDate: string) {
		this.fetchDate = fetchDate;
	}

	public setIssueId(issueId: string | undefined) {
		this.issueId = issueId;
	}

	public setSelectedRepo(selectedRepo: string | undefined) {
		this.selectedRepo = selectedRepo;
	}

	public reload(editor: MarkdownView | null) {
		editor?.editor.focus();
		this.draw();
	}

	private readonly draw = async () => {
		const obContainer = this.containerEl.children[1];
		const activeFile = this.app.workspace.getActiveFile();
		const editor = this.leaf.view.app.workspace.getActiveViewOfType(MarkdownView);

		if (!activeFile) {
			obContainer.empty();
			return;
		}

		const rootElement = document.createElement('div');

		const contentOfFile = await this.app.vault.read(activeFile);

		this.setIssueId(
			PropertiesHelper.readProperty(contentOfFile, PropertiesHelper.PROPERTIES.issue)
		);
		this.setSelectedRepo(
			PropertiesHelper.readProperty(contentOfFile, PropertiesHelper.PROPERTIES.repo)
		);

		const viewContainer = createContainer(rootElement);

		if (!this.settings.token || this.settings.repos.length === 0) {
			obContainer.empty();

			createSection(
				viewContainer,
				{
					info: 'Missing settings! 🚨',
					description: { text: 'Please setup settings first' }
				},
				true
			);

			createSection(viewContainer, {
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

		createSection(
			viewContainer,
			{
				info: 'Issue Editor 🦤'
			},
			true
		);

		createSection(viewContainer, {
			info: 'Repo',
			dropdown: {
				items: this.settings.repos.map((r) => ({
					text: r.repo,
					value: r.code
				})),
				onChange: async (val) => {
					this.setSelectedRepo(val);
					const contentOfFile = await this.app.vault.read(activeFile);

					await PropertiesHelper.writeProperty(
						contentOfFile,
						activeFile,
						PropertiesHelper.PROPERTIES.repo,
						val
					);
				}
			}
		});

		createSection(viewContainer, {
			info: 'Issue number:',
			button: {
				icon: 'crosshair',
				action: async () => {
					if (!this.issueId) {
						new Notice('Select a issue id');
						return;
					}

					if (!this.selectedRepo) {
						new Notice('Select a repo');
						return;
					}

					return await changeIssueId(
						this.issueId,
						activeFile,
						this.settings,
						this.selectedRepo
					);
				}
			},
			input: {
				value: this.issueId?.trim() ?? '',
				type: 'number',
				onChange: async (val) => this.setIssueId(val)
			}
		});

		createSection(viewContainer, {
			info: 'Fetch',
			description: { text: this.issueId ? this.fetchDate : 'First push' },
			button: {
				icon: 'refresh-ccw',
				action: async () => {
					if (!this.issueId || !this.selectedRepo) {
						return;
					}

					const fetchedIssue = await fetchIssue(
						this.issueId,
						this.settings,
						activeFile,
						this.selectedRepo
					);
					this.setFetchDate(fetchedIssue.date);
					this.status = fetchedIssue.status;
					this.reload(editor);
				}
			}
		});

		createSection(viewContainer, {
			info: 'Push',
			description:
				this.status === GitHubIssueStatus.CanPush
					? { text: '🟢 Changes can be pushed' }
					: undefined,
			button: {
				icon: 'upload',
				action: async () => {
					if (!this.selectedRepo) {
						new Notice('Select a repo');
						return;
					}

					await pushIssue(this.issueId, activeFile, this.settings, this.selectedRepo);
					this.status = undefined;
					this.reload(editor);
				}
			}
		});

		if (this.issueId) {
			createSection(viewContainer, {
				info: 'Pull',
				description:
					this.status === GitHubIssueStatus.CanPull
						? { text: '🔴 New version available' }
						: undefined,
				button: {
					icon: 'download',
					action: async () => {
						if (!this.selectedRepo) {
							new Notice('Select a repo');
							return;
						}

						await pullIssue(
							this.issueId!,
							activeFile,
							this.settings,
							this.selectedRepo
						);
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

function createSection(
	containerToAppend: HTMLDivElement,
	{
		info,
		description,
		button,
		dropdown,
		input
	}: {
		info: string;
		description?: { text?: string; textBold?: string; linkText?: string; linkUrl?: string };
		button?: { icon: string; action: () => Promise<void> };
		dropdown?: {
			items: { text: string; value: string }[];
			onChange: (val: string) => Promise<void>;
		};
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

	if (description?.text) {
		const descEl = infoElement.createDiv({
			cls: 'setting-item-description',
			text: description.text
		});

		if (description.textBold) {
			descEl.createEl('strong', { text: description.textBold });
		}
	}

	let settingControl: HTMLDivElement;

	if (button || dropdown || input) {
		settingControl = i.createDiv({ cls: 'setting-item-control' });

		if (input) {
			const inputEl = settingControl.createEl('input', { cls: 'githobs-input' });
			inputEl.setAttribute('type', input.type);
			inputEl.setAttribute('value', input.value);
			inputEl.onchange = (val: any) => {
				input.onChange(val.target?.value);
			};
		}

		if (dropdown) {
			const select = settingControl.createEl('select');
			select.className = 'dropdown';
			dropdown.items.forEach((i) => {
				const o = select.createEl('option', { text: i.text });
				o.setAttribute('value', i.value);
			});
			select.onchange = (val: any) => {
				dropdown.onChange(val.target.value);
			};
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
