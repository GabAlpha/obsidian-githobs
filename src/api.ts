import { Notice, requestUrl } from 'obsidian';
import { GitHobsSettings } from 'settings';

export async function createIssue(
	settings: GitHobsSettings,
	body: { title: string; body: string },
	selectedRepo: string
) {
	const repo = settings.repos.find((r) => r.code === selectedRepo);

	if (!repo) {
		new Notice('Select repo!');
		return;
	}

	const res = await requestUrl({
		url: `https://api.github.com/repos/${repo.owner}/${repo.repo}/issues`,
		headers: { Authorization: `Bearer ${settings.token}` },
		method: 'POST',
		body: JSON.stringify(body)
	});

	if (res.status === 201) {
		new Notice('Issue successfully created');
	}

	return res;
}

export async function updateIssue(
	settings: GitHobsSettings,
	issueId: string,
	body: { title: string; body: string },
	selectedRepo: string
) {
	const repo = settings.repos.find((r) => r.code === selectedRepo);

	if (!repo) {
		new Notice('Select repo!');
		return;
	}

	const res = await requestUrl({
		url: `https://api.github.com/repos/${repo.owner}/${repo.repo}/issues/${issueId}`,
		headers: { Authorization: `Bearer ${settings.token}` },
		method: 'PATCH',
		body: JSON.stringify(body)
	});

	if (res.status === 200) {
		new Notice('Issue successfully updated');
	}

	return res;
}

export async function getIssue(settings: GitHobsSettings, issueId: string, selectedRepo: string) {
	const repo = settings.repos.find((r) => r.code === selectedRepo);

	if (!repo) {
		return;
	}

	const res = await requestUrl({
		url: `https://api.github.com/repos/${repo.owner}/${repo.repo}/issues/${issueId}`,
		headers: { Authorization: `Bearer ${settings.token}` },
		method: 'GET'
	});

	return res;
}
