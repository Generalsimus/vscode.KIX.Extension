import { TextDocument, Uri } from 'vscode';
import ts from '../../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { removeAllContentFromString } from './removeAllContentFromString';
import { EMBEDDED_LANGUAGE_SCHEMA } from './helpers';
import { TextDocumentController } from '..';
import { getEmbedFileUri } from './getEmbedFileUri';

export const createStyleTagContent = (documentController: TextDocumentController, contentNode: ts.JsxElement) => {
	const endOfFileExt = `${contentNode.pos}.css`;
	const cached = documentController.embedFileEmitCache.get(endOfFileExt);
	if (cached) {
		return cached;
	}
	const originalFileName = documentController.fileName;
	const textContent = documentController.textContent;
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
	const value = {
		endOfFileExt: endOfFileExt,
		uri: getEmbedFileUri(originalFileName, "css", endOfFileExt),
		textContent: cssContent
	};
	documentController.embedFileEmitCache.set(endOfFileExt, value);
	return value;
};