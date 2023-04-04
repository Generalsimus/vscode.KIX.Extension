import { TextDocument, Uri } from 'vscode';
import ts from '../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { removeAllContentFromString } from './removeAllContentFromString';
import { EMBEDDED_LANGUAGE_SCHEMA } from './helpers';
import { TextDocumentController } from '../host';

export const createStyleTagContent = (host: TextDocumentController, contentNode: ts.JsxElement) => {
	const originalUri = host.fileName;
	const textContent = host.textContent;
	let cssContent = "";
	let lastPos = 0;
	const { children } = contentNode;
	for (const child of children) {
		if (lastPos < child.pos) {
			cssContent += removeAllContentFromString(textContent, lastPos, child.pos);
			cssContent += textContent.slice(child.pos, child.end);
			lastPos = child.end;
		}
	}

	return {
		uri: Uri.parse(`${EMBEDDED_LANGUAGE_SCHEMA}://css/${encodeURIComponent(
			originalUri
		)}${contentNode.pos}.css`),
		textContent: cssContent
	};
};