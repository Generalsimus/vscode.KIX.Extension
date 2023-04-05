import {
	commands,
	CompletionList,
	Definition,
	DefinitionLink,
	Hover,
	Position,
	TextDocument,
	Uri,
} from 'vscode';
import ts from '../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { findContentLocationNode } from './utils/findContentLocationNode';
import { createStyleTagContent } from './utils/createStyleTagContent';
import { createScriptTagContent } from './utils/createScriptTagContent';
import { uriToString } from './utils/uriToString';
import { ContentAreaController } from './utils/contentAreaController';
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbbedFile';
import { getCompletionItems } from './getCompletionItems';
import { provideDefinition } from './provideDefinition';

interface embedFileContentFile {
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
	embedFileEmitCache: Map<string, embedFileContentFile> = new Map();
	getDocumentUpdateDocumentContentAtPositions(position: Position): embedFileContentFile {
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
	provideHover(position: Position) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
		const {
			uri: embeddedUri,
			areaController
		} = positionDetails;
		const embeddedPosition = areaController?.updatePosition(position) || position;



		const redirectObject = createProxyRedirectValue(this, areaController);
		const testIfCanRedirect = (obj: Record<any, any>) => {
			const uriProp = obj["baseUri"];
			// if (uriProp instanceof Uri) {
			// 	// console.log("🚀 --> file: --> uriProp:", uriProp, uriToString(uriProp) === uriToString(embeddedUri));
			// 	return uriToString(uriProp) === uriToString(embeddedUri);
			// 	// return true;
			// }
			return true;

		};

		return commands.executeCommand<Hover[]>(
			'vscode.executeHoverProvider',
			embeddedUri,
			embeddedPosition
		).then((hovered) => {
			const hover = hovered[0];
			if (hover) {
				try {
					const ppxxxi = proxyRedirectEmbedFile(hover, redirectObject, testIfCanRedirect);
					console.log("🚀 --> file: index.ts:216 --> TextDocumentController --> ).then --> hover:", hover);
					// console.log("1:",positionDetails.textContent.split("\n")[hover.range.start.line].slice(hover.range.start.character-10,hover.range.start.character));
					// console.log("2:",this.textContent.split("\n")[ppxxxi.range.start.line].slice(ppxxxi.range.start.character-10,ppxxxi.range.start.character));
					// console.log("🚀 --> file: index.ts:212 --> TextDocumentController --> ).then --> hover1:", hover);
					// console.log("🚀 --> file: index.ts:212 --> TextDocumentController --> ).then --> hover2:", {
					// 	...proxyRedirectFile(hover, redirectObject, testIfCanRedirect)
					// });
					// return hover;

					return ppxxxi;
					return {
						...hover,
						contents: hover.contents.map(e => proxyRedirectEmbedFile(e as any, redirectObject, testIfCanRedirect)),
						range: hover.range
					};
				} catch (error) {
					console.log("🚀 --> file: --> error:", error);

				}

			}
		});
	}
	// provideSignatureHelp(position: Position, triggerCharacter: string | undefined) {
	// 	const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
	// 	const SignatureHelp = commands.executeCommand<SignatureHelp>(
	// 		"vscode.executeSignatureHelpProvider",
	// 		positionDetails.uri,
	// 		positionDetails.position,
	// 		triggerCharacter
	// 	);
	// 	// console.log("🚀 --> file: index.ts:112 --> TextDocumentController --> provideSignatureHelp --> SignatureHelp:", SignatureHelp);
	// 	return SignatureHelp;
	// }

	// provideTypeDefinition(position: Position) {
	// 	const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
	// 	const typeDefinition = commands.executeCommand<Definition | DefinitionLink[]>(
	// 		'vscode.executeTypeDefinitionProvider',
	// 		positionDetails.uri,
	// 		positionDetails.position,
	// 	);
	// 	// console.log("🚀 --> file: index.ts:122 --> TextDocumentController --> provideDefinition --> definition:", typeDefinition);
	// 	// რეინჯი განაახლე აქქქ
	// 	return typeDefinition;
	// }
	// provideImplementation(position: Position) {
	// 	const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
	// 	const implementation = commands.executeCommand<Definition | DefinitionLink[]>(
	// 		'vscode.executeTypeDefinitionProvider',
	// 		positionDetails.uri,
	// 		positionDetails.position,
	// 	);
	// 	// console.log("🚀 --> file: index.ts:145 --> TextDocumentController --> provideImplementation --> implementation:", implementation);
	// 	// რეინჯი განაახლე აქქქ
	// 	return implementation;
	// }
	// provideReferences(position: Position) {
	// 	const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
	// 	const references = commands.executeCommand<Location[]>(
	// 		'vscode.executeReferenceProvider',
	// 		positionDetails.uri,
	// 		positionDetails.position,
	// 	);
	// 	// console.log("🚀 --> file: index.ts:155 --> TextDocumentController --> provideReferences --> references:", references);

	// 	// რეინჯი განაახლე აქქქ
	// 	return references;
	// }
	// provideDocumentHighlights(position: Position) {
	// 	const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
	// 	const documentHighlights = commands.executeCommand<DocumentHighlight[]>(
	// 		'vscode.executeDocumentHighlights',
	// 		positionDetails.uri,
	// 		positionDetails.position,
	// 	);
	// 	// console.log("🚀 --> file: index.ts:167 --> TextDocumentController --> provideDocumentHighlights --> documentHighlights:", documentHighlights);

	// 	// რეინჯი განაახლე აქქქ
	// 	return documentHighlights;
	// }
	// provideDocumentSymbols(position: Position) {
	// 	const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
	// 	const documentSymbols = commands.executeCommand<SymbolInformation[] | DocumentSymbol[]>(
	// 		'vscode.executeDocumentSymbolProvider',
	// 		positionDetails.uri,
	// 	);
	// 	// console.log("🚀 --> file: index.ts:178 --> TextDocumentController --> provideDocumentSymbols --> documentSymbols:", documentSymbols);

	// 	// რეინჯი განაახლე აქქქ
	// 	return documentSymbols;
	// }
	// provideCodeActions(range: Range) {
	// 	const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(range.start);
	// 	if (positionDetails.isStyle === false) {
	// 		range = positionDetails.areaController.updateRange(range);
	// 	}
	// 	const codeActions = commands.executeCommand<(Command | CodeAction)[]>(
	// 		'vscode.executeCodeActionProvider',
	// 		positionDetails.uri,
	// 		range
	// 	);

	// 	return codeActions;
	// 	// const result = await base.provideCodeActions?.(document, range, context, token);
	// 	// console.log("provideCodeActions");
	// 	// const textDocumentController = getTextDocumentController(document);
	// 	//
	// 	// return textDocumentController.provideCodeActions(position);
	// 	//
	// 	// return result?.filter(codeAction => codeAction.title.indexOf('__VLS_') === -1);
	// }
}
