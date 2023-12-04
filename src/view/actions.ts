import { MarkdownFile } from 'types';
import * as Api from '../api';
import * as PropertiesHelper from '../helper/properties';
import { GitHubIssueEditorSettings } from 'settings';
import { Notice, RequestUrlResponse, TFile } from 'obsidian';
import { GitHubIssueStatus } from 'view';

async function updateFile(
	file: MarkdownFile,
	res: RequestUrlResponse,
	externalData?: string,
	title?: string
) {
	try {
		const propertiesWithGithubIssue = PropertiesHelper.writeIssueId(
			externalData ?? file.data,
			res.json.number
		);

		if (title) {
			await this.app.vault.rename(
				file.file,
				file.file?.parent?.path === '/'
					? `${title}.md`
					: `${file.file?.parent?.path}/${title}.md`
			);
		}

		await this.app.vault.modify(
			file.file,
			`${propertiesWithGithubIssue}\n${PropertiesHelper.removeProperties(
				externalData ?? file.data
			)}`,
			{ mtime: new Date(res.json.updated_at).getTime() }
		);
	} catch {
		throw new Error('This issue is already tracked');
	}
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

export async function fetchIssue(
	issueId: string,
	settings: GitHubIssueEditorSettings,
	file: TFile
) {
	const res = await Api.getIssue(settings, issueId);

	const fileRead = this.app.vault.getFiles().find((f: TFile) => f.path === file.path);
	const lastDate = fileRead.stat.mtime;

	let status: GitHubIssueStatus | undefined = undefined;

	if (lastDate && new Date(res.json.updated_at) > new Date(lastDate)) {
		status = GitHubIssueStatus.CanPull;
	}

	if (lastDate && new Date(res.json.updated_at) < new Date(lastDate)) {
		status = GitHubIssueStatus.CanPush;
	}

	return { date: res.json.updated_at, status };
}

export async function pullIssue(
	issueId: string,
	file: MarkdownFile,
	settings: GitHubIssueEditorSettings
) {
	const res = await Api.getIssue(settings, issueId);
	await updateFile(file, res, res.json.body, res.json.title);
}

export async function changeIssueId(
	issueId: string,
	file: MarkdownFile,
	settings: GitHubIssueEditorSettings
) {
	try {
		await pullIssue(issueId, file, settings);

		new Notice('Issue changed!');
	} catch (err) {
		new Notice(err);
	}
}
