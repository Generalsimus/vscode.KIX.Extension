import { DefinitionLink, Definition, Location, Position, ProviderResult, Uri, commands } from 'vscode';
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbedFile';
import { uriToString } from './utils/uriToString';
import { TextDocumentController } from '.';


// TODO: იმპლემენტაცია გადასამოწმებელია დაზუსტებით
export function provideImplementation(this: TextDocumentController, position: Position) {
	const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
	const {
		uri: embeddedUri,
		areaController
	} = positionDetails;
	const embeddedPosition = areaController?.updatePosition(position) || position;



	const redirectObject = createProxyRedirectValue(this, areaController);
	const testIfCanRedirect = (obj: Record<any, any>) => {
		if (obj["targetUri"] instanceof Uri) {
			const uriProp = obj["targetUri"];
			return uriToString(uriProp) === uriToString(embeddedUri);
		}
		if (obj instanceof Location) {
			const uriProp = obj["uri"];
			return uriToString(uriProp) === uriToString(embeddedUri);
		}

		return true;
	};

	return commands.executeCommand<Definition | DefinitionLink[]>(
		'vscode.executeImplementationProvider',
		embeddedUri,
		embeddedPosition,
	).then((implementation) => {
		console.log("🚀 --> file: index.ts:110 --> TextDocumentController --> ).then --> implementation:", implementation);
		return proxyRedirectEmbedFile(implementation, redirectObject, testIfCanRedirect);
	});
}