import * as Api from '../api';
import * as PropertiesHelper from '../helper/properties';
import { GitHobsSettings } from 'settings';
import { Notice, TFile } from 'obsidian';
import { GitHubIssueStatus } from 'view';

async function updateFile(
	file: TFile,
	res: { json: { title: string; body: string; number: string; updated_at: string } } | undefined
) {
	if (res?.json.title) {
		await this.app.vault.rename(
			file,
			file?.parent?.path === '/'
				? `${res?.json.title}.md`
				: `${file?.parent?.path}/${res?.json.title}.md`
		);
	}

	if (res) {
		const contentOfFile = await this.app.vault.read(file);
		const { properties } = PropertiesHelper.readProperties(contentOfFile);

		const formattedProperties = (
			properties
				? [
						PropertiesHelper.PROPERTIES_DELIMITER,
						...properties,
						PropertiesHelper.PROPERTIES_DELIMITER
				  ]
				: []
		).join('\n');

		const propertiesWithGithubIssueNumber = await PropertiesHelper.writeProperty(
			formattedProperties,
			file,
			PropertiesHelper.PROPERTIES.issue,
			res.json.number
		);

		await this.app.vault.modify(file, `${propertiesWithGithubIssueNumber}${res.json.body}`, {
			mtime: new Date(res.json.updated_at).getTime()
		});
	}
}

export async function pushIssue(
	issueId: string | undefined,
	file: TFile,
	settings: GitHobsSettings,
	selectedRepo: string
) {
	const contentOfFile = await this.app.vault.read(file);

	if (issueId) {
		const res = await Api.updateIssue(
			settings,
			issueId,
			{
				title: file?.basename ?? '',
				body: PropertiesHelper.removeProperties(contentOfFile)
			},
			selectedRepo
		);

		if (res?.status === 200) {
			await updateFile(file, res);
		}
		return;
	}

	const res = await Api.createIssue(
		settings,
		{
			title: file?.basename ?? '',
			body: PropertiesHelper.removeProperties(contentOfFile)
		},
		selectedRepo
	);

	if (res?.status === 201) {
		await updateFile(file, res);
	}
}

export async function fetchIssue(
	issueId: string,
	settings: GitHobsSettings,
	file: TFile,
	selectedRepo: string
) {
	const res = await Api.getIssue(settings, issueId, selectedRepo);

	const fileRead = this.app.vault.getFiles().find((f: TFile) => f.path === file.path);
	const lastDate = fileRead.stat.mtime;

	let status: GitHubIssueStatus | undefined = undefined;

	if (lastDate && new Date(res?.json.updated_at) > new Date(lastDate)) {
		status = GitHubIssueStatus.CanPull;
	}

	if (lastDate && new Date(res?.json.updated_at) < new Date(lastDate)) {
		status = GitHubIssueStatus.CanPush;
	}

	return { date: res?.json.updated_at, status };
}

export async function pullIssue(
	issueId: string,
	file: TFile,
	settings: GitHobsSettings,
	selectedRepo: string
) {
	const res = await Api.getIssue(settings, issueId, selectedRepo);
	await updateFile(file, res);
}

export async function changeIssueId(
	issueId: string,
	file: TFile,
	settings: GitHobsSettings,
	selectedRepo: string
) {
	try {
		await pullIssue(issueId, file, settings, selectedRepo);

		new Notice('Issue changed!');
	} catch (err) {
		new Notice(err);
	}
}
