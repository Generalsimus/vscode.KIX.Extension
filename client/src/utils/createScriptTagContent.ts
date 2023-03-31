import { Position, TextDocument, Uri } from 'vscode';
import { removeStyleTagUnsafeContent } from './removeStyleTagUnsafeContent';
import ts from '../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { makeScriptTagsSafe } from './makeScriptTagsSafe';
import { getLineColumnFromTextPosition } from './getLineColumnFromTextPosition';
import { EMBEDDED_LANGUAGE_SCHEMA } from './helpers';

export const createScriptTagContent = (
	document: TextDocument,
	position: Position,
	offset: number,
	styleTagChildNodes: ts.JsxElement[],
	scriptTagChildNodes: ts.JsxElement[]
) => {
	const originalUri = document.uri.toString(true);
	const textContent = document.getText();
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
	} = makeScriptTagsSafe(safeTextContent, offset, scriptTagChildNodes);
	
	const { line, column } = getLineColumnFromTextPosition(updatedTextContent, updatedOffset);

	return {
		uri,
		textContent: updatedTextContent,
		position: position.with(line, column),
		areaController,
	};
};
