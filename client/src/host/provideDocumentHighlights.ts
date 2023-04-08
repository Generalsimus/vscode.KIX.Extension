import { DocumentHighlight, Position, commands } from 'vscode';
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbedFile';
import { TextDocumentController } from '.';

export function provideDocumentHighlights(this: TextDocumentController, position: Position) {
	const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
	const {
		uri: embeddedUri,
		areaController
	} = positionDetails;
	const embeddedPosition = areaController?.updatePosition(position) || position;



	const redirectObject = createProxyRedirectValue(this, areaController);
	const testIfCanRedirect = () => true;

	return commands.executeCommand<DocumentHighlight[]>(
		'vscode.executeDocumentHighlights',
		embeddedUri,
		embeddedPosition
	).then((documentHighlight) => {
		return proxyRedirectEmbedFile(documentHighlight, redirectObject, testIfCanRedirect);
	});
}