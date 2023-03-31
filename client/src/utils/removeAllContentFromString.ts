import { newLIneCharCode } from './helpers';

export const removeAllContentFromString = (text: string, startIndex = 0, endIndex = text.length) => {
	let content = "";
	while (startIndex < endIndex) {
		if (newLIneCharCode === text.charCodeAt(startIndex)) {
			content = content + "\n";
		} else {
			content = content + " ";
		}
		startIndex++;
	}
	return content;
};