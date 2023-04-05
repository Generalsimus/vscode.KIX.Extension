import {
	CodeAction,
	Command,
	commands,
	CompletionList,
	Definition,
	DefinitionLink,
	DocumentHighlight,
	DocumentSymbol,
	ExtensionContext,
	Hover,
	Location,
	LocationLink,
	Position,
	Range,
	SignatureHelp,
	SymbolInformation,
	TextDocument,
	Uri,
	workspace,
} from 'vscode';
import ts from '../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { findContentLocationNode } from './utils/findContentLocationNode';
import { createStyleTagContent } from './utils/createStyleTagContent';
import { createScriptTagContent } from './utils/createScriptTagContent';
import { uriToString } from './utils/uriToString';
import { ContentAreaController } from './utils/contentAreaController';
import { createPerfHook } from '../perf';

const createProxyRedirectValue = ({ uri, areaController }: embedFileContentFile, textDocumentController: TextDocumentController) => {
	const redirect = (
		value: any,
	) => {
		if (areaController) {
			if (value instanceof Range) {
				return areaController.updateOriginalRange(value);
			} else if (value instanceof Position) {
				return areaController.updateOriginalPosition(value);
			}
		}
		if (value instanceof Uri) {
			return textDocumentController.textdocument.uri;

		}
	};
	return redirect;
};
const proxyRedirectFile = <T extends Record<any, any>, A extends T | T[]>(
	target: A,
	redirectValue: (obj: any) => any,
	testIfCanRedirect: (obj: Record<any, any>) => boolean
): A => {
	if (Array.isArray(target)) {
		return target.map((el) => proxyRedirectFile(el, redirectValue, testIfCanRedirect)) as A;
	}

	if (typeof target !== 'object' || testIfCanRedirect(target) === false) {
		return target;
	}

	const state: Partial<T> = {};
	return new Proxy(target, {
		get(obj, prop, receiver) {
			if (prop in state) {
				return Reflect.get(state, prop);
			}
			const value = Reflect.get(obj, prop, receiver);

			const updateValue = redirectValue(value) || proxyRedirectFile(value, redirectValue, testIfCanRedirect);
			Reflect.set(state, prop, updateValue);
			return updateValue;
		},
		set(obj, prop, value, receiver) {
			return Reflect.set(state, prop, value);
		},
	});
};
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


		this.embeddedFilesMap.set(uriToString(styleTagContent.uri), styleTagContent.textContent);
		return styleTagContent;
	}
	getCompletionItems(position: Position, uri: Uri, triggerCharacter: string | undefined) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
		const {
			uri: embeddedUri,
			areaController
		} = positionDetails;
		const embeddedPosition = areaController?.updatePosition(position) || position;



		const redirectObject = createProxyRedirectValue(positionDetails, this);
		const testIfCanRedirect = () => true;

		return commands
			.executeCommand<CompletionList>(
				'vscode.executeCompletionItemProvider',
				embeddedUri,
				embeddedPosition,
				triggerCharacter
			)
			.then((completionList) => {
				return {
					items: proxyRedirectFile(completionList.items, redirectObject, testIfCanRedirect),
					isIncomplete: completionList.isIncomplete
				};
			});
	}
	provideDefinition(position: Position, uri: Uri) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
		const {
			uri: embeddedUri,
			areaController
		} = positionDetails;
		const embeddedPosition = areaController?.updatePosition(position) || position;




		const redirectObject = createProxyRedirectValue(positionDetails, this);
		const testIfCanRedirect = (obj: Record<any, any>) => {
			const uriProp = obj["targetUri"] || obj["uri"];
			return uriProp instanceof Uri && uriToString(uriProp) === uriToString(embeddedUri);
		};


		return commands
			.executeCommand<Definition | DefinitionLink[]>(
				'vscode.executeDefinitionProvider',
				embeddedUri,
				embeddedPosition
			).then((definition) => {
				return proxyRedirectFile(definition, redirectObject, testIfCanRedirect);
			});
	}
	provideHover(position: Position) {
		const positionDetails = this.getDocumentUpdateDocumentContentAtPositions(position);
		const {
			uri: embeddedUri,
			areaController
		} = positionDetails;
		const embeddedPosition = areaController?.updatePosition(position) || position;



		const redirectObject = createProxyRedirectValue(positionDetails, this);
		const testIfCanRedirect = () => true;

		return commands.executeCommand<Hover[]>(
			'vscode.executeHoverProvider',
			positionDetails.uri,
			embeddedPosition
		).then((hovered) => {
			console.log("🚀 --> file: index.ts:196 --> TextDocumentController --> ).then --> hovered:", hovered);
			
			return proxyRedirectFile(hovered[0], redirectObject, testIfCanRedirect);
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
