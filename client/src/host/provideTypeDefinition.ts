import { Definition, DefinitionLink, Location, Position, commands } from 'vscode';
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbedFile';
import { uriToString } from './utils/uriToString';

export function provideTypeDefinition(position: Position) {
	const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
	const {
		uri: embeddedUri,
		areaController
	} = positionDetails;
	const embeddedPosition = areaController?.updatePosition(position) || position;



	const redirectObject = createProxyRedirectValue(this, areaController);
	const testIfCanRedirect = (obj: Record<any, any>) => {
		
		if (obj instanceof Location) {
			const uriProp = obj["uri"];
			return uriToString(uriProp) === uriToString(embeddedUri);
		}

		return true;
	};

	return commands.executeCommand<Definition | DefinitionLink[]>(
		'vscode.executeTypeDefinitionProvider',
		embeddedUri,
		embeddedPosition,
	).then((definedType) => { 
		return proxyRedirectEmbedFile(definedType, redirectObject, testIfCanRedirect);
	}); 
}