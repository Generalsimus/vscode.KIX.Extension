import { Range } from 'vscode';
import { newLIneCharCode } from './helpers';

export const replaceRangeContent = (range: Range, content: string, newContent: string) => {
	const startPosition = range.start;
	const endPosition = range.end;
	const contentLength = content.length;
	let currentLine = 0;
	let currentColumn = 0;
	let currentIndex = 0;
	let updatedContent = "";

	while (currentIndex <= contentLength) {
		const charCode = content.charCodeAt(currentIndex);
		if (currentLine === startPosition.line && currentColumn === startPosition.character) {
			updatedContent = content.slice(0, currentIndex) + newContent;
		} else if (currentLine === endPosition.line && currentColumn === endPosition.character) {
			updatedContent = updatedContent + content.slice(currentIndex, contentLength);
			break;
		}
		if (newLIneCharCode === charCode) {
			currentLine++;
			currentColumn = 0;
		} else {
			currentColumn++;
		}
		currentIndex++;
	}
	return updatedContent;
};