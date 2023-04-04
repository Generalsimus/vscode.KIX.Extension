import { Position, TextDocument, Uri } from 'vscode';
import { removeStyleTagUnsafeContent } from './removeStyleTagUnsafeContent';
import ts from '../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { makeScriptTagsSafe } from './makeScriptTagsSafe';
import { getLineColumnFromTextPosition } from './getLineColumnFromTextPosition';
import { EMBEDDED_LANGUAGE_SCHEMA } from './helpers';
import { TextDocumentController } from '../host';

export const createScriptTagContent = ( 
	documentController: TextDocumentController,
	position: Position,
	offset: number,
) => {
	const originalUri = documentController.fileName;
	const textContent = documentController.textContent;
	const styleTagChildNodes = documentController.sourceFile.kixStyleTagChildNodes;
	const scriptTagChildNodes = documentController.sourceFile.kixScriptTagChildNodes;
	const safeTextContent = removeStyleTagUnsafeContent(textContent, styleTagChildNodes);

	const isTypescriptFile = /(\.kts)$/gim.test(originalUri);
	const fileExt = isTypescriptFile ? 'tsx' : 'jsx';

	const uri = Uri.parse(
		`${EMBEDDED_LANGUAGE_SCHEMA}://${fileExt}/${encodeURIComponent(originalUri)}.${fileExt}`
	);

	const {
		textContent: updatedTextContent,
		offset: updatedOffset,
		areaController,
	} = makeScriptTagsSafe(documentController,safeTextContent, offset  );

	const { line, column } = getLineColumnFromTextPosition(updatedTextContent, updatedOffset);

	return {
		uri,
		textContent: updatedTextContent,
		position: position.with(line, column),
		areaController,
	};
};
