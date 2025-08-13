// Ref. https://forum.obsidian.md/t/valid-characters-for-file-names/55307/3
const INVALID_CHAR_OBSIDIAN_TITLE = ['/', '\\', ':', '|', '^', '#', '[', ']', '?'];

function isInvalid(title: string) {
	return INVALID_CHAR_OBSIDIAN_TITLE.some((char) => title.includes(char));
}

export function sanitize(title: string) {
	if (isInvalid(title)) {
		const allChars = title.split('');
		const sanitated = allChars.map((c) => (isInvalid(c) ? encodeURIComponent(c) : c));
		return sanitated.join('');
	}

	return decodeURIComponent(title);
}
