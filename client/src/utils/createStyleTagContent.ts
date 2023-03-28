import { TextDocument, Uri } from 'vscode';
import ts from '../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { removeAllContentFromString } from './removeAllContentFromString';
import { EMBEDDED_LANGUAGE_SCHEMA } from './helpers';

export  	const createStyleTagContent = (document: TextDocument, contentNode: ts.JsxElement) => {
	const originalUri = document.uri.toString(true);
	const textContent = document.getText();
	let cssContent = "";
	let lastPos = 0;
	const { children } = contentNode;
	for (const child of children) {
		if (lastPos < child.pos) {
			cssContent += removeAllContentFromString(textContent.slice(lastPos, child.pos));
			cssContent += textContent.slice(child.pos, child.end);
			lastPos = child.end;
		}
	}
	
	return { 
		uri: Uri.parse(`${EMBEDDED_LANGUAGE_SCHEMA}://css/${encodeURIComponent(
			originalUri
		)}${contentNode.pos}.css`),
		content: cssContent
	};
};