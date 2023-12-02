import { ItemView, WorkspaceLeaf } from 'obsidian';
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
		const container = this.containerEl.children[1];
		const rootEl = document.createElement('div');

		const firstRow = rootEl.createDiv({ cls: 'vertical-tab-content-container' });
		const secondRow = firstRow.createDiv({ cls: 'setting-item setting-item-heading' });
		const info = secondRow.createDiv({ cls: 'setting-item-info' });
		info.createDiv({ cls: 'setting-item-name' }).setText('Issue Editor 🦤');

		container.empty();
		container.appendChild(firstRow);
	};
}
