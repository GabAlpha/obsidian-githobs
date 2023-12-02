import { MarkdownFile } from 'types';
import * as Api from '../api';
import * as PropertiesHelper from '../helper/properties';
import { GitHubIssueEditorSettings } from 'settings';
import { RequestUrlResponse } from 'obsidian';

async function updateFile(file: MarkdownFile, res: RequestUrlResponse, externalData?: string) {
	const propertiesWithGithubIssue = PropertiesHelper.writeIssueId(
		externalData ?? file.data,
		res.json.number
	);
	const propertiesWithLastDate = PropertiesHelper.writeIssueLastData(
		propertiesWithGithubIssue,
		res.json.updated_at
	);

	await this.app.vault.modify(
		file.file,
		`${propertiesWithLastDate}\n${PropertiesHelper.removeProperties(externalData ?? file.data)}`
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
			await updateFile(file, res);
		}
		return;
	}

	const res = await Api.createIssue(settings, {
		title: file.file?.basename ?? '',
		body: PropertiesHelper.removeProperties(file.data)
	});

	if (res.status === 201) {
		await updateFile(file, res);
	}
}

export async function checkStatus(issueId: string, settings: GitHubIssueEditorSettings) {
	const res = await Api.getIssue(settings, issueId);
	return res.json.updated_at;
}

export async function pullIssue(
	issueId: string,
	file: MarkdownFile,
	settings: GitHubIssueEditorSettings
) {
	const res = await Api.getIssue(settings, issueId);
	updateFile(file, res, res.json.body);
}
