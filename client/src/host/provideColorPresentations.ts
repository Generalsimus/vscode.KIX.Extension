import { Color, ColorPresentation, Range, commands } from 'vscode';
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbedFile';
import { TextDocumentController } from '.';

export function provideColorPresentations(this: TextDocumentController, color: Color, range: Range) {
	const embedContentFiles = this.getAllEmbedFiles();
	// console.log("🚀 --> file: index.ts:98 --> TextDocumentController --> provideCodeLenses --> embedContentFiles:", embedContentFiles);
	return Promise.all(embedContentFiles.map(async (embedFileDetails) => {
		console.log("🚀 --> file: index.ts:142 --> TextDocumentController --> returnPromise.all --> embedFileDetails:", embedFileDetails);
		try {
			const embeddedUri = embedFileDetails.uri;
			const areaController = embedFileDetails.areaController;

			const embeddedRange = areaController?.updateRange(range) || range;


			const redirectObject = createProxyRedirectValue(this, areaController);
			const testIfCanRedirect = (obj: Record<any, any>) => {
				return true;
			};
			// const commm = commands.executeCommand<CodeLens[]>(
			// 	'vscode.executeDocumentColorProvider',
			// 	embeddedUri
			// );
			const colorPresentations = await commands.executeCommand<ColorPresentation[]>(
				'vscode.executeColorPresentationProvider',
				color,
				{
					uri: embeddedUri,
					range: embeddedRange
				}
			).then((colorPresentation) => {
				console.log("🚀 --> file: index.ts:169 --> TextDocumentController --> returncolorPresentations.then --> colorPresentation:", colorPresentation);

				return proxyRedirectEmbedFile(colorPresentation, redirectObject, testIfCanRedirect);
			});
			console.log("🚀 --> file: index.ts:165 --> TextDocumentController --> provideColorPresentations --> colorPresentations:", colorPresentations);
			return colorPresentations;

		} catch (error) {
			console.log("🚀 --> file: index.ts:174 --> TextDocumentController --> provideColorPresentations --> error:", error);

		}
		return [];
	})).then((colorPresentation) => {
		return colorPresentation.flat(1);
	});

}