import { Hover, Position, Uri, commands } from 'vscode';
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbedFile';
import { uriToString } from './utils/uriToString';

export function provideHover(position: Position) {
	const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
	const {
		uri: embeddedUri,
		areaController
	} = positionDetails;
	const embeddedPosition = areaController?.updatePosition(position) || position;



	const redirectObject = createProxyRedirectValue(this, areaController);
	const testIfCanRedirect = (obj: Record<any, any>) => {
		const uriProp = obj["baseUri"];
		if (uriProp instanceof Uri) {
			return uriToString(uriProp) === uriToString(embeddedUri);
		}

		return true;
	};

	return commands.executeCommand<Hover[]>(
		'vscode.executeHoverProvider',
		embeddedUri,
		embeddedPosition
	).then((hovered) => {
		const hover = hovered[0];
		if (hover) {
			return proxyRedirectEmbedFile(hover, redirectObject, testIfCanRedirect);
		}
	});
}