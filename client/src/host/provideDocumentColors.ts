import { ColorInformation, commands } from 'vscode';
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbedFile';

export function provideDocumentColors() {
	const embedContentFiles = this.getAllEmbedFiles();
	console.log("🚀 --> embedContentFiles:", { embedContentFiles, embeddedFilesMap: this.embeddedFilesMap });
	// const editor = window.activeTextEditor;
	// console.log("🚀 --> file: index.ts:191 --> provideDocumentColors --> editor:", editor);
	return Promise.all(embedContentFiles.map((embedFileDetails) => {
		// try {
		const embeddedUri = embedFileDetails.uri;
		const areaController = embedFileDetails.areaController;

		// const embeddedRange = areaController?.updateRange(range) || range;
		console.log("🚀 --> file: --> embeddedUri:", { embeddedUri, uri: this.textdocument.uri });


		const redirectObject = createProxyRedirectValue(this, areaController);
		const testIfCanRedirect = (obj: Record<any, any>) => {
			return true;
		};

		// debugger; 
		return commands.executeCommand<ColorInformation[]>(
			'vscode.executeDocumentColorProvider',
			embeddedUri
			// new Range(0, 0, Number.MAX_VA/LUE, Number.MAX_VALUE)
		).then((documentColor) => {
			console.log("🚀 --> documentColor:", documentColor);

			return proxyRedirectEmbedFile(documentColor, redirectObject, testIfCanRedirect);
		}, (error) => {
			// Log any errors that occur
			console.error(error);
		});

	})).then((colorPresentation) => {
		return colorPresentation.flat(1);
	});
}