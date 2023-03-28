import ts from '../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { removeAllContentFromString } from './removeAllContentFromString';

export const removeStyleTagUnsafeContent = (textContent: string, styleTagChildNodes: ts.JsxElement[]) => {
	for (const styleTagNode of styleTagChildNodes) {
		const { pos, end } = styleTagNode.children;
		textContent = textContent.slice(0, pos) +
			removeAllContentFromString(textContent.slice(pos, end)) +
			textContent.slice(end, textContent.length);

	}
	return textContent;
};