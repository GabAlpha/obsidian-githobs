// const syncBtn = this.addRibbonIcon('upload', 'Create a github issue', async () => {
// 	const file = this.app.workspace.activeEditor as MarkdownFileInfo & { data: string };
// 	const issueId = PropertiesHelper.readIssueId(file.data);

import { MarkdownFile } from 'types';
import * as Api from '../api';
import * as PropertiesHelper from '../helper/properties';
import { GitHubIssueEditorSettings } from 'settings';

// 	if (issueId) {
// 		await Api.updateIssue(this.settings, issueId, {
// 			title: file.file?.basename ?? '',
// 			body: PropertiesHelper.removeProperties(file.data)
// 		});

// 		return;
// 	}

// 	c
// });

export async function pushIssue(
	issueId: string | undefined,
	file: MarkdownFile,
	settings: GitHubIssueEditorSettings
) {
	if (issueId) {
		await Api.updateIssue(settings, issueId, {
			title: file.file?.basename ?? '',
			body: PropertiesHelper.removeProperties(file.data)
		});
		return;
	}

	const res = await Api.createIssue(settings, {
		title: file.file?.basename ?? '',
		body: PropertiesHelper.removeProperties(file.data)
	});

	if (res.status === 201) {
		const propertiesWithGithubIssue = PropertiesHelper.writeIssueId(file.data, res.json.number);

		await this.app.vault.modify(
			file.file,
			`${propertiesWithGithubIssue}\n${PropertiesHelper.removeProperties(file.data)}`
		);
	}
}
