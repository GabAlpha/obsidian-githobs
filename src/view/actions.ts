import { MarkdownFile } from 'types';
import * as Api from '../api';
import * as PropertiesHelper from '../helper/properties';
import { GitHubIssueEditorSettings } from 'settings';
import { RequestUrlResponse } from 'obsidian';

async function updateProperties(file: MarkdownFile, res: RequestUrlResponse) {
	const propertiesWithGithubIssue = PropertiesHelper.writeIssueId(file.data, res.json.number);
	const propertiesWithLastDate = PropertiesHelper.writeIssueLastData(
		propertiesWithGithubIssue,
		res.json.updated_at
	);

	await this.app.vault.modify(
		file.file,
		`${propertiesWithLastDate}\n${PropertiesHelper.removeProperties(file.data)}`
	);
}

export async function pushIssue(
	issueId: string | undefined,
	file: MarkdownFile,
	settings: GitHubIssueEditorSettings
) {
	if (issueId) {
		const res = await Api.updateIssue(settings, issueId, {
			title: file.file?.basename ?? '',
			body: PropertiesHelper.removeProperties(file.data)
		});

		if (res.status === 200) {
			await updateProperties(file, res);
		}
		return;
	}

	const res = await Api.createIssue(settings, {
		title: file.file?.basename ?? '',
		body: PropertiesHelper.removeProperties(file.data)
	});

	if (res.status === 201) {
		await updateProperties(file, res);
	}
}
