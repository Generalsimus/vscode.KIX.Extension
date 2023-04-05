import { Definition, DefinitionLink, Position, Uri, commands } from 'vscode';
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbbedFile';
import { uriToString } from './utils/uriToString';

export function provideDefinition(position: Position, uri: Uri) {
	const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
	const {
		uri: embeddedUri,
		areaController
	} = positionDetails;
	const embeddedPosition = areaController?.updatePosition(position) || position;




	const redirectObject = createProxyRedirectValue(this, areaController);
	const testIfCanRedirect = (obj: Record<any, any>) => {
		const uriProp = obj["targetUri"] || obj["uri"];

		if (uriProp instanceof Uri) {
			return uriToString(uriProp) === uriToString(embeddedUri);
		}
		return true;

	};


	return commands
		.executeCommand<Definition | DefinitionLink[]>(
			'vscode.executeDefinitionProvider',
			embeddedUri,
			embeddedPosition
		).then((definition) => {
			return proxyRedirectEmbedFile(definition, redirectObject, testIfCanRedirect);
		});
}