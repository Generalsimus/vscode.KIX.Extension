import { Uri } from 'vscode';
import { removeStyleTagUnsafeContent } from './removeStyleTagUnsafeContent';
import { makeScriptTagsSafe } from './makeScriptTagsSafe';
import { TextDocumentController } from '..';
import { getEmbedFileUri } from './getEmbedFileUri';
import ts from '../../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { EmbedContentUriDetails } from './getNodeUriDetails';

export const createScriptTagContent = (
	sourceFile: ts.SourceFile
) => {
	// const originalFileName = fileUriDetails.originalFileName;
	// const isTypescriptFile = /(\.kts)$/gim.test(originalFileName);
	// const filetype = isTypescriptFile ? 'tsx' : 'jsx';
	// const endOfFileExt = `${filetype}`;
	// const cached = documentController.embedFileEmitCache.get(endOfFileExt);
	// if (cached) {
	// 	return cached;
	// }

	const textContent = sourceFile.text;
	const styleTagChildNodes = sourceFile.kixStyleTagChildNodes;
	const scriptTagChildNodes = sourceFile.kixScriptTagChildNodes;
	const safeTextContent = removeStyleTagUnsafeContent(textContent, styleTagChildNodes);



	// const { areaController, textContent: updatedTextContent } = makeScriptTagsSafe(safeTextContent, scriptTagChildNodes);


	return makeScriptTagsSafe(safeTextContent, scriptTagChildNodes);
};
