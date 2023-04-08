import {
	CodeLens,
	Definition,
	Position,
	TextDocument,
	Uri,
	commands,
} from 'vscode';
import ts from '../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { findContentLocationNode } from './utils/findContentLocationNode';
import { createStyleTagContent } from './utils/createStyleTagContent';
import { createScriptTagContent } from './utils/createScriptTagContent';
import { uriToString } from './utils/uriToString';
import { ContentAreaController } from './utils/contentAreaController';
import { getCompletionItems } from './getCompletionItems';
import { provideDefinition } from './provideDefinition';
import { provideHover } from './provideHover';
import { provideSignatureHelp } from './provideSignatureHelp';
import { provideTypeDefinition } from './provideTypeDefinition';
import { provideImplementation } from './provideImplementation';
import { provideReferences } from './provideReferences';
import { provideDocumentHighlights } from './provideDocumentHighlights';
import { provideCodeActions } from './provideCodeActions';
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbedFile';

interface embedContentFile {
	endOfFileExt: string;
	uri: Uri;
	textContent: string;
	areaController?: ContentAreaController | undefined;
}
export class TextDocumentController {
	textdocument: TextDocument;
	fileName: string;
	textContent: string;
	sourceFile: ts.SourceFile;
	embeddedFilesMap: Map<string, string>;
	constructor(document: TextDocument, embeddedFilesMap: Map<string, string>) {
		this.textdocument = document;
		this.embeddedFilesMap = embeddedFilesMap;
		this.fileName = document.uri.toString(true);
		this.textContent = document.getText();

		this.sourceFile = ts.createSourceFile(
			this.fileName,
			this.textContent,
			ts.ScriptTarget.Latest,
			false,
			ts.ScriptKind.KTS
		);
	}
	embedFileEmitCache: Map<string, embedContentFile> = new Map();
	getAllEmbedFiles(): embedContentFile[] {
		// const embedFilesContents = this.sourceFile.kixStyleTagChildNodes.map(elementNode => {
		// 	const styleEmbedContent = createStyleTagContent(this, elementNode);
		// 	this.embeddedFilesMap.set(uriToString(styleEmbedContent.uri), styleEmbedContent.textContent);
		// 	return styleEmbedContent;
		// });
		const embedFilesContents: embedContentFile[] = [];


		const scriptTagContent = createScriptTagContent(this);
		this.embeddedFilesMap.set(uriToString(scriptTagContent.uri), scriptTagContent.textContent);

		embedFilesContents.push(scriptTagContent);
		return embedFilesContents;
	}
	getDocumentUpdateDocumentContentAtPositions(position: Position): embedContentFile {
		const offset = this.textdocument.offsetAt(position);
		const styleContentNode = findContentLocationNode(
			offset,
			this.sourceFile.kixStyleTagChildNodes
		);
		if (styleContentNode === undefined) {
			const scriptTagContent = createScriptTagContent(this);

			this.embeddedFilesMap.set(uriToString(scriptTagContent.uri), scriptTagContent.textContent);
			return scriptTagContent;
		}

		const styleTagContent = createStyleTagContent(this, styleContentNode);
		console.log("🚀 --> file: --> styleTagContent:", styleTagContent.textContent);


		this.embeddedFilesMap.set(uriToString(styleTagContent.uri), styleTagContent.textContent);
		return styleTagContent;
	}
	getCompletionItems = getCompletionItems
	provideDefinition = provideDefinition
	provideHover = provideHover
	provideSignatureHelp = provideSignatureHelp
	provideTypeDefinition = provideTypeDefinition
	provideImplementation = provideImplementation
	provideReferences = provideReferences
	provideDocumentHighlights = provideDocumentHighlights
	provideCodeActions = provideCodeActions
	provideCodeLenses() {
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
}
