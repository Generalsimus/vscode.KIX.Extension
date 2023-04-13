import { InlayHint, Location, Range, commands } from 'vscode';
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbedFile';
import { uriToString } from './utils/uriToString';

export function provideInlayHints(range: Range) {
	const embedContentFiles = this.getAllEmbedFiles();
	return Promise.all(embedContentFiles.map(embedFileDetails => {
		const {
			uri: embeddedUri,
			areaController
		} = embedFileDetails;
		const embeddedRange = areaController?.updateRange(range) || range;



		const redirectObject = createProxyRedirectValue(this, areaController);
		const testIfCanRedirect = (obj: Record<any, any>) => {
			if (obj instanceof Location) {
				const uriProp = obj["uri"];
				return uriToString(uriProp) === uriToString(embeddedUri);
			}

			return true;
		};

		return commands.executeCommand<InlayHint[]>(
			'vscode.executeHoverProvider',
			embeddedUri,
			embeddedRange
		).then((inlayHint) => {
			console.log("🚀 --> file: index.ts:139 --> TextDocumentController --> ).then --> inlayHint:", inlayHint);

			return proxyRedirectEmbedFile(inlayHint, redirectObject, testIfCanRedirect);
		});
	})).then(inlayHints => {
		return inlayHints.flat(1);
	});

}