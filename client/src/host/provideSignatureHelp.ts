import { Position, SignatureHelp, Uri, commands } from 'vscode';
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbedFile';
import { uriToString } from './utils/uriToString';
import { TextDocumentController } from '.';

export function provideSignatureHelp(this: TextDocumentController, position: Position, triggerCharacter: string | undefined) {
	const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
	const {
		uri: embeddedUri,
		areaController
	} = positionDetails;
	const embeddedPosition = areaController?.updatePosition(position) || position;

	const SignatureHelp = commands.executeCommand<SignatureHelp>(
		"vscode.executeSignatureHelpProvider",
		embeddedUri,
		embeddedPosition,
		triggerCharacter
	);


	const redirectObject = createProxyRedirectValue(this, areaController);
	const testIfCanRedirect = (obj: Record<any, any>) => {
		const uriProp = obj["baseUri"];
		if (uriProp instanceof Uri) {
			return uriToString(uriProp) === uriToString(embeddedUri);
		}

		return true;
	};

	return SignatureHelp.then((signatureHelp) => {
		return proxyRedirectEmbedFile(signatureHelp, redirectObject, testIfCanRedirect);
	});
}
