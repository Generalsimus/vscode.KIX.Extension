import { CodeAction, Command, Range, commands } from 'vscode';
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbedFile';
import { TextDocumentController } from '.';

export function provideCodeActions(this: TextDocumentController, range: Range) {
	const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(range.start);
	const {
		uri: embeddedUri,
		areaController
	} = positionDetails;
	const embeddedRange = areaController?.updateRange(range) || range;


	const redirectObject = createProxyRedirectValue(this, areaController);
	const testIfCanRedirect = (obj: Record<any, any>) => true;



	return commands.executeCommand<(Command | CodeAction)[]>(
		'vscode.executeCodeActionProvider',
		embeddedUri,
		embeddedRange
	).then((action) => {
		console.log("🚀 --> file: index.ts:116 --> TextDocumentController --> ).then --> action:", action);

		return proxyRedirectEmbedFile(action, redirectObject, testIfCanRedirect);
	});
}