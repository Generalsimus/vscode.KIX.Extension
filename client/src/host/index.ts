
import { CodeAction, Command, commands, CompletionList, Definition, DefinitionLink, DocumentHighlight, DocumentSymbol, ExtensionContext, Hover, Location, LocationLink, Position, Range, SignatureHelp, SymbolInformation, TextDocument, Uri, workspace } from 'vscode';
import ts from '../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { findContentLocationNode } from './utils/findContentLocationNode';
import { createStyleTagContent } from '../utils/createStyleTagContent';
import { createScriptTagContent } from '../utils/createScriptTagContent';
import { uriToString } from './utils/uriToString';
import { CreateContentAreaController } from '../utils/createContentAreaController';
import { createPerfHook } from '../perf';

const proxyRangeUpdate = <T extends Record<any, any>, A extends T | T[]>(
	target: A,
	positionDetails: ReturnType<TextDocumentController["getDocumentUpdateDocumentContentAtPositions"]>,
	originalUri: Uri
): A => {
	if (Array.isArray(target)) {
		return target.map(el => proxyRangeUpdate(el, positionDetails, originalUri)) as A;
	}

	if (typeof target !== "object") {
		return target;
	}
	const state: Partial<T> = {};
	return new Proxy(target, {
		get(obj, prop, receiver) {
			if (prop in state) {
				return Reflect.get(state, prop);
			}
			const value = Reflect.get(obj, prop, receiver);

			if (value instanceof Range) {
				const updatedRange = positionDetails.areaController.updateRange(value);

				Reflect.set(state, prop, updatedRange);

				return updatedRange;
			} else if (value instanceof Position) {
				const updatedPosition = positionDetails.areaController.updatePosition(value);

				Reflect.set(state, prop, updatedPosition);

				return updatedPosition;
			} else if (value instanceof Uri && uriToString(positionDetails.uri) === uriToString(originalUri)) {

				Reflect.set(state, prop, originalUri);
				return originalUri;
			}

			if (typeof value === "object") {
				const proxyObject = proxyRangeUpdate(value, positionDetails, originalUri);
				Reflect.set(state, prop, proxyObject);
				return proxyObject;
			}

			return value;
		},
		set(obj, prop, value, receiver) {
			if (value instanceof Position || value instanceof Uri || value instanceof Range) {
				return Reflect.set(state, prop, value);
			}
			return Reflect.set(obj, prop, value, receiver);
		}
	});
};
export class TextDocumentController {
	textdocument: TextDocument
	fileName: string
	textContent: string
	sourceFile: ts.SourceFile
	embeddedFilesMap: Map<string, string>
	areaController: CreateContentAreaController
	constructor(document: TextDocument, embeddedFilesMap: Map<string, string>) {
		this.textdocument = document;
		this.embeddedFilesMap = embeddedFilesMap;
		this.fileName = document.uri.toString(true);
		this.textContent = document.getText();
		this.areaController = new CreateContentAreaController(this);
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
			this.embeddedFilesMap.set(uriToString(uri), textContent);
			return {
				uri,
				textContent,
				position: updatedPosition,
				areaController,
				isStyle: false
			} as const;
		}

		const { textContent, uri } = createStyleTagContent(this, styleContentNode);

		this.embeddedFilesMap.set(uriToString(uri), textContent);
		return {
			uri: uri,
			textContent: textContent,
			position: position,
			isStyle: true
		} as const;
	}
	getCompletionItems(position: Position, uri: Uri, triggerCharacter: string | undefined) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);

		console.log("🚀 --> file: index.ts:120 --> TextDocumentController --> getCompletionItems --> positionDetails:", positionDetails.textContent);

		if (positionDetails.isStyle) {
			return commands.executeCommand<CompletionList>(
				'vscode.executeCompletionItemProvider',
				positionDetails.uri,
				positionDetails.position,
				triggerCharacter
			).then((completionList) => {
				return proxyRangeUpdate(completionList, positionDetails, uri);
			});
		}
		
		return commands.executeCommand<CompletionList>(
			'vscode.executeCompletionItemProvider',
			positionDetails.uri,
			positionDetails.position,
			triggerCharacter
		).then((completionList) => {
			const comp = proxyRangeUpdate(completionList, positionDetails, uri);
			// console.log("🚀 --> file: index.ts:137 --> TextDocumentController --> ).then --> comp:", comp.items.map(e => ({ ...e })));
			// return comp;
			const { areaController } = positionDetails;
			return {
				items: completionList.items.map(item => {
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
				isIncomplete: completionList.isIncomplete
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
		// console.log("🚀 --> file: index.ts:98 --> TextDocumentController --> provideHover --> Hover:", Hover);
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
		// console.log("🚀 --> file: index.ts:112 --> TextDocumentController --> provideSignatureHelp --> SignatureHelp:", SignatureHelp);
		return SignatureHelp;
	}
	provideDefinition(position: Position, uri: Uri) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
		// const { areaController } = positionDetails;
		// console.log("🚀 --> file: index.ts:118 --> TextDocumentController --> provideDefinition --> positionDetails:", positionDetails);

		// console.log("🚀 --> file: index.ts:122 --> TextDocumentController --> provideDefinition --> definition:", definition);
		// რეინჯი განაახლე აქქქ

		// const sss = loopEach(null as (Definition | DefinitionLink[]));
		// const definitions = ;
		// console.log("🚀 --> file: index.ts:180 --> TextDocumentController --> provideDefinition --> definitions:", definitions);
		// if (areaController === undefined) {
		// 	return 
		// } 


		return commands.executeCommand<Definition | DefinitionLink[]>(
			'vscode.executeDefinitionProvider',
			positionDetails.uri,
			positionDetails.position,
		).then(definitions => {
			return proxyRangeUpdate(definitions, positionDetails, uri);
		});
	}
	provideTypeDefinition(position: Position) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
		const typeDefinition = commands.executeCommand<Definition | DefinitionLink[]>(
			'vscode.executeTypeDefinitionProvider',
			positionDetails.uri,
			positionDetails.position,
		);
		// console.log("🚀 --> file: index.ts:122 --> TextDocumentController --> provideDefinition --> definition:", typeDefinition);
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
		// console.log("🚀 --> file: index.ts:145 --> TextDocumentController --> provideImplementation --> implementation:", implementation);
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
		// console.log("🚀 --> file: index.ts:155 --> TextDocumentController --> provideReferences --> references:", references);

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
		// console.log("🚀 --> file: index.ts:167 --> TextDocumentController --> provideDocumentHighlights --> documentHighlights:", documentHighlights);

		// რეინჯი განაახლე აქქქ
		return documentHighlights;
	}
	provideDocumentSymbols(position: Position) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
		const documentSymbols = commands.executeCommand<SymbolInformation[] | DocumentSymbol[]>(
			'vscode.executeDocumentSymbolProvider',
			positionDetails.uri,
		);
		// console.log("🚀 --> file: index.ts:178 --> TextDocumentController --> provideDocumentSymbols --> documentSymbols:", documentSymbols);

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