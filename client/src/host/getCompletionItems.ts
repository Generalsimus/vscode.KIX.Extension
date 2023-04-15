import { CompletionList, Position, Uri, commands } from 'vscode';
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbedFile';
import { TextDocumentController } from '.';

export function getCompletionItems(this: TextDocumentController, position: Position, uri: Uri, triggerCharacter: string | undefined) {
	const embedFileContentArea = this.getDocumentUpdateDocumentContentAtPositions(position);
	// console.log("🚀 --> file: getCompletionItems.ts:7 --> getCompletionItems --> embedFileContentArea:", embedFileContentArea);
	const {
		uri: embeddedUri,
		areaController
	} = embedFileContentArea;
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