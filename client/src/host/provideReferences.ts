import { Location, Position, commands } from 'vscode';
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbedFile';
import { uriToString } from './utils/uriToString';

export function provideReferences(position: Position) {
	const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
	const {
		uri: embeddedUri,
		areaController
	} = positionDetails;
	const embeddedPosition = areaController?.updatePosition(position) || position;

	const SignatureHelp = commands.executeCommand<Location[]>(
		'vscode.executeReferenceProvider',
		embeddedUri,
		embeddedPosition
	);


	const redirectObject = createProxyRedirectValue(this, areaController);
	const testIfCanRedirect = (obj: Record<any, any>) => {
		if (obj instanceof Location) {
			const uriProp = obj["uri"];
			return uriToString(uriProp) === uriToString(embeddedUri);
		}

		return true;
	};

	return SignatureHelp.then((signatureHelp) => {
		return proxyRedirectEmbedFile(signatureHelp, redirectObject, testIfCanRedirect);
	});
}