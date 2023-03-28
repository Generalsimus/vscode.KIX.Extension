import { newLIneCharCode } from './helpers';

export const removeAllContentFromString = (text: string) => {
	let content = "";
	let index = 0;
	const length = text.length;
	while (index <= length) {
		if (newLIneCharCode === text.charCodeAt(index)) {
			content += "\n";
		}
		index++;
	}
	return content;
	// return text.replace(/^[^(\r\n|\n|\r)]+/gm, "");
};