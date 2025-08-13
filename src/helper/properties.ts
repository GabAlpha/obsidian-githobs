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

const GITHUB_ISSUE_PROPERTY_CODE = 'github_issue';
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

export function readIssueId(data: string) {
	const { properties } = readProperties(data);
	if (!properties) return;

	const githubIssueProperty = properties.find((p) => p.startsWith(GITHUB_ISSUE_PROPERTY_CODE));
	if (!githubIssueProperty) return;

	const [, issueId] = githubIssueProperty.split(':');
	return issueId;
}

export function writeIssueId(data: string, issueId: string) {
	const { properties } = readProperties(data);

	return [
		PROPERTIES_DELIMITER,
		...(properties
			? [...properties.filter((p) => !p.includes(GITHUB_ISSUE_PROPERTY_CODE))]
			: []),
		`${GITHUB_ISSUE_PROPERTY_CODE}: ${issueId}`,
		PROPERTIES_DELIMITER
	].join('\n');
}
