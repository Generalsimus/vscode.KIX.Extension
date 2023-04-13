import { CodeLens, commands } from 'vscode';
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbedFile';

	
	
export function provideCodeLenses() {
	// try {
	const embedContentFiles = this.getAllEmbedFiles();
	console.log("🚀 --> file: index.ts:98 --> TextDocumentController --> provideCodeLenses --> embedContentFiles:", embedContentFiles);
	return Promise.all(embedContentFiles.map(embedFileDetails => {
		const embeddedUri = embedFileDetails.uri;
		const areaController = embedFileDetails.areaController;
		console.log("🚀 --> file: index.ts:124 --> TextDocumentController --> provideCodeLenses --> embeddedUri:", embeddedUri);

		// console.log("🚀 --> file: index.ts:123 --> TextDocumentController --> provideCodeLenses --> embedFileDetails:", embedFileDetails);
		const redirectObject = createProxyRedirectValue(this, areaController);
		const testIfCanRedirect = (obj: Record<any, any>) => {
			return true;
		};
		const commm = commands.executeCommand<CodeLens[]>(
			'vscode.executeCodeLensProvider',
			embeddedUri
		);
		// console.log("🚀 --> file: index.ts:112 --> TextDocumentController --> provideCodeLenses --> commm:", commm);
		(commm as any).catch((error: any) => {
			console.error(error);

		});
		return commm.then((codeLens) => {
			console.log("🚀 --> file: index.ts:121 --> TextDocumentController --> returncommm.then --> codeLens:", codeLens);
			return proxyRedirectEmbedFile(codeLens, redirectObject, testIfCanRedirect);
		});

	})).then((result) => {
		console.log("🚀 --> file: index.ts:114 --> TextDocumentController --> provideCodeLenses --> result:", result);
		return result.flat(1);
	});
	// } catch (error) {
	// 	console.log("🚀 --> file: index.ts:120 --> TextDocumentController --> provideCodeLenses --> error:", error);
	// 	return [];
	// }
}