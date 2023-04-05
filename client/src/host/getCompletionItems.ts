import { CompletionList, Position, Uri, commands } from 'vscode';
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbbedFile';

export function getCompletionItems(position: Position, uri: Uri, triggerCharacter: string | undefined) {
	const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
	const {
		uri: embeddedUri,
		areaController
	} = positionDetails;
	const embeddedPosition = areaController?.updatePosition(position) || position;



	const redirectObject = createProxyRedirectValue(this, areaController);
	const testIfCanRedirect = () => true;

	return commands
		.executeCommand<CompletionList>(
			'vscode.executeCompletionItemProvider',
			embeddedUri,
			embeddedPosition,
			triggerCharacter
		)
		.then((completionList) => {
			return {
				items: proxyRedirectEmbedFile(completionList.items, redirectObject, testIfCanRedirect),
				isIncomplete: completionList.isIncomplete
			};
		});
}