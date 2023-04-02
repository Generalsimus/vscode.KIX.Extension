
import { CodeAction, Command, commands, CompletionList, Definition, DefinitionLink, DocumentHighlight, DocumentSymbol, ExtensionContext, Hover, Location, Position, Range, SignatureHelp, SymbolInformation, TextDocument, workspace } from 'vscode';
import ts from '../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { findContentLocationNode } from './utils/findContentLocationNode';
import { createStyleTagContent } from '../utils/createStyleTagContent';
import { createScriptTagContent } from '../utils/createScriptTagContent';
import { uriToString } from './utils/uriToString';

export class TextDocumentController {
	textdocument: TextDocument
	fileName: string
	textContent: string
	sourceFile: ts.SourceFile
	embeddedFilesMap: Map<string, string>
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
	getDocumentUpdateDocumentContentAtPositions(position: Position) {
		const offset = this.textdocument.offsetAt(position);
		const styleContentNode = findContentLocationNode(offset, this.sourceFile.kixStyleTagChildNodes);
		if (styleContentNode === undefined) {
			const { uri, position: updatedPosition, textContent, areaController } = createScriptTagContent(
				this,
				position,
				offset,
			);
			return {
				uri,
				textContent,
				position: updatedPosition,
				areaController,
				isStyle: false
			} as const;
		}

		const { content, uri } = createStyleTagContent(this, styleContentNode);
		return {
			uri: uri,
			textContent: content,
			position: position,
			isStyle: true
		} as const;
	}
	getCompletionItems(position: Position, triggerCharacter: string | undefined) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
		// console.log("🚀 --> file: index.ts:56 --> TextDocumentController --> getCompletionItems --> positionDetails:", positionDetails.textContent);

		this.embeddedFilesMap.set(uriToString(positionDetails.uri), positionDetails.textContent);

		if (positionDetails.isStyle) {
			return commands.executeCommand<CompletionList>(
				'vscode.executeCompletionItemProvider',
				positionDetails.uri,
				positionDetails.position,
				triggerCharacter
			);
		}

		return commands.executeCommand<CompletionList>(
			'vscode.executeCompletionItemProvider',
			positionDetails.uri,
			positionDetails.position,
			triggerCharacter
		).then(({ items, isIncomplete }) => {
			const { areaController } = positionDetails;
			return {
				items: items.map(item => {
					const { range } = item;
					if (range) {
						if (range instanceof Range) {
							item.range = areaController.updateRange(range);
						} else {
							const { inserting, replacing } = range;
							range.inserting = areaController.updateRange(inserting);
							range.replacing = areaController.updateRange(replacing);
						}
					}
					return item;
				}),
				isIncomplete: isIncomplete
			};
		});

	}
	provideHover(position: Position) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
		const Hover = commands.executeCommand<Hover[]>(
			'vscode.executeHoverProvider',
			positionDetails.uri,
			positionDetails.position
		);
		console.log("🚀 --> file: index.ts:98 --> TextDocumentController --> provideHover --> Hover:", Hover);
		return Hover[0];
	}
	provideSignatureHelp(position: Position, triggerCharacter: string | undefined) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
		const SignatureHelp = commands.executeCommand<SignatureHelp>(
			"vscode.executeSignatureHelpProvider",
			positionDetails.uri,
			positionDetails.position,
			triggerCharacter
		);
		console.log("🚀 --> file: index.ts:112 --> TextDocumentController --> provideSignatureHelp --> SignatureHelp:", SignatureHelp);
		return SignatureHelp;
	}
	provideDefinition(position: Position) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
		const definition = commands.executeCommand<Definition | DefinitionLink[]>(
			'vscode.executeDefinitionProvider',
			positionDetails.uri,
			positionDetails.position,
		);
		console.log("🚀 --> file: index.ts:122 --> TextDocumentController --> provideDefinition --> definition:", definition);
		// რეინჯი განაახლე აქქქ
		return definition;
	}
	provideTypeDefinition(position: Position) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
		const typeDefinition = commands.executeCommand<Definition | DefinitionLink[]>(
			'vscode.executeTypeDefinitionProvider',
			positionDetails.uri,
			positionDetails.position,
		);
		console.log("🚀 --> file: index.ts:122 --> TextDocumentController --> provideDefinition --> definition:", typeDefinition);
		// რეინჯი განაახლე აქქქ
		return typeDefinition;
	}
	provideImplementation(position: Position) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
		const implementation = commands.executeCommand<Definition | DefinitionLink[]>(
			'vscode.executeTypeDefinitionProvider',
			positionDetails.uri,
			positionDetails.position,
		);
		console.log("🚀 --> file: index.ts:145 --> TextDocumentController --> provideImplementation --> implementation:", implementation);
		// რეინჯი განაახლე აქქქ
		return implementation;
	}
	provideReferences(position: Position) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
		const references = commands.executeCommand<Location[]>(
			'vscode.executeReferenceProvider',
			positionDetails.uri,
			positionDetails.position,
		);
		console.log("🚀 --> file: index.ts:155 --> TextDocumentController --> provideReferences --> references:", references);

		// რეინჯი განაახლე აქქქ
		return references;
	}
	provideDocumentHighlights(position: Position) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
		const documentHighlights = commands.executeCommand<DocumentHighlight[]>(
			'vscode.executeDocumentHighlights',
			positionDetails.uri,
			positionDetails.position,
		);
		console.log("🚀 --> file: index.ts:167 --> TextDocumentController --> provideDocumentHighlights --> documentHighlights:", documentHighlights);

		// რეინჯი განაახლე აქქქ
		return documentHighlights;
	}
	provideDocumentSymbols(position: Position) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
		const documentSymbols = commands.executeCommand<SymbolInformation[] | DocumentSymbol[]>(
			'vscode.executeDocumentSymbolProvider',
			positionDetails.uri,
		);
		console.log("🚀 --> file: index.ts:178 --> TextDocumentController --> provideDocumentSymbols --> documentSymbols:", documentSymbols);

		// რეინჯი განაახლე აქქქ
		return documentSymbols;
	}
	provideCodeActions(range: Range) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(range.start);
		if (positionDetails.isStyle === false) {
			range = positionDetails.areaController.updateRange(range);
		}
		const codeActions = commands.executeCommand<(Command | CodeAction)[]>(
			'vscode.executeCodeActionProvider',
			positionDetails.uri,
			range
		);

		return codeActions;
		// const result = await base.provideCodeActions?.(document, range, context, token);
		// console.log("provideCodeActions");
		// const textDocumentController = getTextDocumentController(document);
		// 
		// return textDocumentController.provideCodeActions(position);
		//
		// return result?.filter(codeAction => codeAction.title.indexOf('__VLS_') === -1);
	}
}