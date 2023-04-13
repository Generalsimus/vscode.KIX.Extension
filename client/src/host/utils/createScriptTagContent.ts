import { Uri } from 'vscode';
import { removeStyleTagUnsafeContent } from './removeStyleTagUnsafeContent';
import { makeScriptTagsSafe } from './makeScriptTagsSafe';
import { TextDocumentController } from '..';
import { getEmbedFileUri } from './getEmbedFileUri';

export const createScriptTagContent = (documentController: TextDocumentController) => {
	const originalFileName = documentController.fileName;
	const isTypescriptFile = /(\.kts)$/gim.test(originalFileName);
	const filetype = isTypescriptFile ? 'tsx' : 'jsx';
	const endOfFileExt = `${filetype}`;
	const cached = documentController.embedFileEmitCache.get(endOfFileExt);
	if (cached) {
		return cached;
	}

	const textContent = documentController.textContent;
	const styleTagChildNodes = documentController.sourceFile.kixStyleTagChildNodes;
	const scriptTagChildNodes = documentController.sourceFile.kixScriptTagChildNodes;
	const safeTextContent = removeStyleTagUnsafeContent(textContent, styleTagChildNodes);



	const { areaController, textContent: updatedTextContent } = makeScriptTagsSafe(safeTextContent, scriptTagChildNodes);


	let uri: Uri | undefined;
	const value = {
		endOfFileExt: endOfFileExt,
		get uri() {
			return uri ||= getEmbedFileUri(originalFileName, filetype, endOfFileExt);
		},
		textContent: updatedTextContent,
		areaController,
	} as const;
	documentController.embedFileEmitCache.set(endOfFileExt, value);
	return value;
};
