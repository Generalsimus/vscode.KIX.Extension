import { TextDocument, Uri } from 'vscode';
import ts from '../../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { removeAllContentFromString } from './removeAllContentFromString';
import { EMBEDDED_LANGUAGE_SCHEMA } from './helpers';
import { TextDocumentController } from '..';
import { getEmbedFileUri } from './getEmbedFileUri';

export const createStyleTagContent = (originalTextContent: string, contentNode: ts.JsxElement) => {
	// const endOfFileExt = `${contentNode.pos}.css`;
	// const cached = documentController.embedFileEmitCache.get(endOfFileExt);
	// if (cached) {
	// 	return cached;
	// }
	// const originalFileName = documentController.fileName;
	// const textContent = originalTextContent
	let cssContent = "";
	let lastPos = 0;
	const { children } = contentNode;
	for (const child of children) {
		if (lastPos < child.pos) {
			cssContent += removeAllContentFromString(originalTextContent, lastPos, child.pos);
			cssContent += originalTextContent.slice(child.pos, child.end);
			lastPos = child.end;
		}
	}
	// let uri: Uri | undefined;
	// const value = {
	// 	endOfFileExt: endOfFileExt,
	// 	get uri() {
	// 		return uri ||= getEmbedFileUri(originalFileName, "css", endOfFileExt);
	// 	},
	// 	textContent: cssContent
	// };
	// documentController.embedFileEmitCache.set(endOfFileExt, value);
	return cssContent;
};