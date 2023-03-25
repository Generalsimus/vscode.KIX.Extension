export const removeAllContentFromString = (text: string) => {
	return text.replace(/^[^(\r\n|\n|\r)]+/gm, "");
};