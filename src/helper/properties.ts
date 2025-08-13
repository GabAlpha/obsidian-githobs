/*
Example of obsidian properties syntax
---
tags: (list | alias | tags type)
	- tag1
	- tag2
number: 3 (number type)
text: "this is text" (text type)

[and more..]
---
*/

import { MarkdownFile } from 'types';

export const PROPERTIES = {
	issue: 'github_issue',
	repo: 'github_repo'
};
const PROPERTIES_DELIMITER = '---';

export function readProperties(data: string): {
	properties: string[] | undefined;
	indexEndPropertiesLine: number | undefined;
} {
	if (!data) {
		return { properties: undefined, indexEndPropertiesLine: undefined };
	}

	const [firstLine, ...restOfLines] = data.split('\n');
	// Check if exist the property start syntax
	if (firstLine !== PROPERTIES_DELIMITER) {
		return { properties: undefined, indexEndPropertiesLine: undefined };
	}

	// Check if exist the property end syntax
	const indexEndPropertiesLine = restOfLines.indexOf(PROPERTIES_DELIMITER);
	if (!indexEndPropertiesLine) {
		return { properties: undefined, indexEndPropertiesLine: undefined };
	}

	return {
		properties: restOfLines.slice(0, indexEndPropertiesLine),
		indexEndPropertiesLine: indexEndPropertiesLine + 1
	};
}

export function removeProperties(data: string) {
	const { indexEndPropertiesLine } = readProperties(data);

	if (!indexEndPropertiesLine) return data;

	const dataSplitted = data.split('\n');
	return dataSplitted.slice(indexEndPropertiesLine + 1).join('\n');
}

export function readProperty(data: string, key: string) {
	const { properties } = readProperties(data);
	if (!properties) return;

	const githubIssueProperty = properties.find((p) => p.startsWith(key));
	if (!githubIssueProperty) return;

	const [, value] = githubIssueProperty.split(': ');
	return value;
}

export async function writeProperty(file: MarkdownFile, key: string, value: string) {
	const { properties } = readProperties(file.data);

	const newProperties = [
		PROPERTIES_DELIMITER,
		...(properties ? [...properties.filter((p) => !p.includes(key))] : []),
		`${key}: ${value}`,
		PROPERTIES_DELIMITER
	].join('\n');

	const fullFile = `${newProperties}\n${removeProperties(file.data)}`;

	await this.app.vault.modify(file.file, fullFile);

	return fullFile;
}
