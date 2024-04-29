import { MarkdownFile } from 'types';
import * as Api from '../api';
import * as PropertiesHelper from '../helper/properties';
import { GitHobsSettings } from 'settings';
import { Notice, RequestUrlResponse, TFile } from 'obsidian';
import { GitHubIssueStatus } from 'view';

function formatUnsafeFileName(fileName: string) {
	return fileName.replace(':', ' - ').replace('|', ' -- ').replace('/', '_').replace('\\', '~');
}

async function updateFile(
	file: MarkdownFile,
	res: RequestUrlResponse,
	externalData?: string,
	title?: string
) {
	try {
		const filePropertiesString = PropertiesHelper.extractFilePropertiesString(file.data);
		let propertiesWithGithubIssueData = PropertiesHelper.writeIssueId(
			filePropertiesString + externalData ?? '',
			res.json.number
		);

		if (title) {
			const unsafeFileName =
				title.contains(':') ||
				title.contains('|') ||
				title.contains('/') ||
				title.contains('\\');
			if (unsafeFileName) {
				propertiesWithGithubIssueData = PropertiesHelper.writeIssueOriginalTitle(
					propertiesWithGithubIssueData,
					title
				);
			}
			const vaultSafeTitle = unsafeFileName ? formatUnsafeFileName(title) : title;
			await this.app.vault.rename(
				file.file,
				file.file?.parent?.path === '/'
					? `${vaultSafeTitle}.md`
					: `${file.file?.parent?.path}/${vaultSafeTitle}.md`
			);
		}

		await this.app.vault.process(
			file.file,
			(data: string) =>
				`${propertiesWithGithubIssueData}\n${PropertiesHelper.removeProperties(
					externalData ?? data
				)}`,
			{
				mtime: new Date(res.json.updated_at).getTime()
			}
		);
	} catch {
		throw new Error('This issue is already tracked');
	}
}

export async function pushIssue(
	issueId: string | undefined,
	file: MarkdownFile,
	settings: GitHobsSettings
) {
	if (issueId) {
		const filePropertiesString = PropertiesHelper.extractFilePropertiesString(file.data);
		const { properties } = PropertiesHelper.readProperties(filePropertiesString);

		let unsafeFileName = undefined;
		if (properties) {
			for (const p of properties) {
				const propDividerIndex = p.indexOf(': ');
				const propKey = p.slice(0, propDividerIndex);
				const propValue = p.slice(propDividerIndex + 2);
				if (
					propKey !== PropertiesHelper.GITHUB_ISSUE_PROPERTY_ORIGINAL_TITLE ||
					!propValue.length
				)
					continue;
				const originalIssueName = propValue.slice(1, propValue.length - 1);
				if (file.file?.basename === formatUnsafeFileName(originalIssueName)) {
					unsafeFileName = originalIssueName;
				}
			}
		}

		const res = await Api.updateIssue(settings, issueId, {
			title: unsafeFileName ?? file.file?.basename ?? '',
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

export async function fetchIssue(issueId: string, settings: GitHobsSettings, file: TFile) {
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

export async function pullIssue(issueId: string, file: MarkdownFile, settings: GitHobsSettings) {
	const res = await Api.getIssue(settings, issueId);
	await updateFile(file, res, res.json.body, res.json.title);
}

export async function changeIssueId(
	issueId: string,
	file: MarkdownFile,
	settings: GitHobsSettings
) {
	try {
		await pullIssue(issueId, file, settings);

		new Notice('Issue changed!');
	} catch (err) {
		new Notice(err);
	}
}
