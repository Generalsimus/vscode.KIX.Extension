import { newLIneCharCode } from './helpers';

export const getPositionFromTextLineColumn = (text: string, line: number, column: number) => {
	let index = 0;
	let currentLine = 0;
	let currentColumn = 0;
	const length = text.length;

	while (index <= length) {
		if (currentLine === line && column === currentColumn) {
			return index;
		}
		const charCode = text.charCodeAt(index);
		if (newLIneCharCode === charCode) {
			currentLine++;
			currentColumn = 0;
		} else {
			currentColumn++;
		}
		index++;
	}

	return -1;
};