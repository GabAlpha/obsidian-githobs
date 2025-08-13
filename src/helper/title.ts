const INVALID_CHAR_OBSIDIAN_TITLE = ['/', '\\', ':'];

export function isInvalid(title: string) {
	return INVALID_CHAR_OBSIDIAN_TITLE.some((char) => title.includes(char));
}

export function sanitize(title: string) {
	if (isInvalid(title)) {
		return encodeURIComponent(title);
	}

	return decodeURIComponent(title);
}
