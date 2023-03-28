import { newLIneCharCode } from './helpers';


export const getLineColumnFromTextPosition = (text: string, position: number) => {
	let line = 0;
	let column = 0;
	let index = 0;

	while (index < position) {
		const charCode = text.charCodeAt(index);
		if (newLIneCharCode === charCode) {
			line++;
			column = 0;
		} else {
			column++;
		}
		index++;
	}

	return {
		line,
		column,
	};
};
