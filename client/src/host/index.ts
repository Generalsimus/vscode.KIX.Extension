import {
	CodeLens,
	Color,
	ColorInformation,
	ColorPresentation,
	Definition,
	FormattingOptions,
	InlayHint,
	Location,
	Position,
	Range,
	TextDocument,
	TextEdit,
	Uri,
	commands,
	window,
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
import {
	createProxyRedirectValue,
	proxyRedirectEmbedFile,
} from './utils/proxyRedirectEmbedFile';
import { provideCodeLenses } from './provideCodeLenses';
import { provideColorPresentations } from './provideColorPresentations';
import { provideDocumentColors } from './provideDocumentColors';
import { provideInlayHints } from './provideInlayHints';
import { removeAllContentFromString } from './utils/removeAllContentFromString';
import { parentPort } from 'worker_threads';
// commands.getCommands().then(red => {
// 	console.log("🚀 --> file: index.ts:30 --> commands.getCommands --> red:", red);

// });
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
	formatCode: FormatCodeController
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

		this.formatCode = new FormatCodeController(this.sourceFile);
	}
	embedFileEmitCache: Map<string, embedContentFile> = new Map();
	getAllEmbedFiles(): embedContentFile[] {
		const embedFilesContents = this.sourceFile.kixStyleTagChildNodes.map((elementNode) => {
			const styleEmbedContent = createStyleTagContent(this, elementNode);
			this.embeddedFilesMap.set(
				uriToString(styleEmbedContent.uri),
				styleEmbedContent.textContent
			);
			return styleEmbedContent;
		});
		// const embedFilesContents: embedContentFile[] = [];

		const scriptTagContent = createScriptTagContent(this);
		this.embeddedFilesMap.set(
			uriToString(scriptTagContent.uri),
			scriptTagContent.textContent
		);

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

			this.embeddedFilesMap.set(
				uriToString(scriptTagContent.uri),
				scriptTagContent.textContent
			);
			return scriptTagContent;
		}

		const styleTagContent = createStyleTagContent(this, styleContentNode);
		// console.log("🚀 --> file: --> styleTagContent:", styleTagContent.textContent);

		this.embeddedFilesMap.set(
			uriToString(styleTagContent.uri),
			styleTagContent.textContent
		);
		return styleTagContent;
	}
	getCompletionItems = getCompletionItems;
	provideDefinition = provideDefinition;
	provideHover = provideHover;
	provideSignatureHelp = provideSignatureHelp;
	provideTypeDefinition = provideTypeDefinition;
	provideImplementation = provideImplementation;
	provideReferences = provideReferences;
	provideDocumentHighlights = provideDocumentHighlights;
	provideCodeActions = provideCodeActions;
	provideCodeLenses = provideCodeLenses;
	provideColorPresentations = provideColorPresentations;
	provideDocumentColors = provideDocumentColors;
	provideInlayHints = provideInlayHints;
	provideDocumentFormattingEdits(options: FormattingOptions): TextEdit[] {
		const embedContentFiles = this.getAllEmbedFiles();
		// formatDocument(this);
		this.formatCode.format();
		return [];
		// return Promise.all(embedContentFiles.map(embedFileDetails => {
		// 	const {
		// 		uri: embeddedUri,
		// 		areaController
		// 	} = embedFileDetails;
		// 	return commands.executeCommand<TextEdit[]>(
		// 		'vscode.executeFormatDocumentProvider',
		// 		embeddedUri,
		// 		options
		// 	).then((inlayHints) => {
		// 		// console.log("🚀 --> file: index.ts:142 --> TextDocumentController --> ).then --> inlayHint:", inlayHint);
		// 		// console.log("🚀 --> file: index.ts:139 --> TextDocumentController --> ).then --> inlayHint:", inlayHint);
		// 		// // return inlayHint;
		// 		// return proxyRedirectEmbedFile(inlayHint, redirectObject, testIfCanRedirect);
		// 		return {
		// 			inlayHints,
		// 			embedFileDetails
		// 		};
		// 	});
		// })).then(embedInlineHints => {
		// 	console.log(
		// 		"🚀 --> inlayHints:",
		// 		embedInlineHints.map(e => e.inlayHints).flat(Infinity)
		// 	);
		// 	const newInlineHints: TextEdit[] = [];
		// 	for (const { embedFileDetails: currentEmbedFileDetails, inlayHints: currentInlayHints } of embedInlineHints) {

		// 		for (const currentInlayHint of currentInlayHints) {
		// 			const currentInlayHintRange = currentEmbedFileDetails.areaController?.updateRange(currentInlayHint.range) || currentInlayHint.range;
		// 			embedInlineHints.forEach(({ embedFileDetails, inlayHints }, index) => {
		// 				// for (const { embedFileDetails, inlayHints } of embedInlineHints) {
		// 				for (const inlayHint of inlayHints) {
		// 					const inlayHintRange = embedFileDetails.areaController?.updateRange(inlayHint.range) || inlayHint.range;
		// 					if (currentInlayHintRange.contains(inlayHintRange)) {
		// 						// currentInlayHint.replace
		// 					}
		// 				}
		// 				// }
		// 			});

		// 		}
		// 		// const { areaController: currentAreaController } = currentEmbedFileDetails;
		// 		// for (const embedInlineHint of embedInlineHints) {
		// 		// 	const currentRange =  currentAreaController.updateRange(currentInlayHints.)
		// 		// }
		// 	}
		// 	return newInlineHints;
		// });
	}
}


type FormatTsNode = ts.NodeArray<ts.JsxChild> | ts.Node
type FormatElement = { formatNode: FormatTsNode, childrenNode: FormatTsNode }
const formatElements: FormatElement[] = [];

class FormatCodeController {
	sourceFile: ts.SourceFile
	formatElements: FormatElement[]
	originalTextContent: string
	constructor(sourceFile: ts.SourceFile) {
		const scriptTagChildNodes = sourceFile.kixScriptTagChildNodes;
		const styleTagChildNodes = sourceFile.kixStyleTagChildNodes;
		this.sourceFile = sourceFile;
		this.formatElements = [];
		this.originalTextContent = sourceFile.text;

		for (const el of scriptTagChildNodes) {
			this.formatElements.push({
				formatNode: el,
				childrenNode: el.children
			});
		}
		for (const el of styleTagChildNodes) {
			this.formatElements.push({
				formatNode: el,
				childrenNode: el.children
			});
		}
	}
	containNode(node: FormatTsNode, check: FormatTsNode) {
		return node.pos < check.pos && check.end < node.end;
	}
	format() {
		console.log("🚀 --> file: --> this.formatCode():", this.formatCode());
	}
	formatCode() {
		return this.formatNode(
			{
				formatNode: this.sourceFile,
				childrenNode: this.sourceFile,
			},
			this.originalTextContent,
			this.formatElements
		);
	}
	formatNode(
		element: FormatElement,
		originalTextContent: string,
		preChildElements: FormatElement[]
	) {
		let nodeTextContent = originalTextContent;
		const updatedPreChildNodes: FormatElement[] = [];
		const childNodes: FormatElement[] = [];

		parentFor: for (const child of preChildElements) {
			for (const haveParentCHild of preChildElements) {
				if (this.containNode(haveParentCHild.formatNode, child.formatNode)) {
					updatedPreChildNodes.push(child);
					continue parentFor;
					break;
				}
			}

			const { pos, end } = child.childrenNode;
			nodeTextContent = nodeTextContent.slice(0, pos) +
				removeAllContentFromString(nodeTextContent, pos, end) +
				nodeTextContent.slice(end, nodeTextContent.length);

			childNodes.push(child);

		}



		let textContent = nodeTextContent.slice(element.childrenNode.pos, element.childrenNode.end);
		console.log("🚀 --> file: index.ts:246 --> formatDocument --> textContent:", textContent);


		for (const childNode of childNodes) {
			const content = this.formatNode(childNode, originalTextContent, updatedPreChildNodes.filter(n => this.containNode(childNode.formatNode, n.formatNode)));
			textContent =
				textContent.slice(0, childNode.childrenNode.pos - element.childrenNode.pos) +
				content +
				textContent.slice(childNode.childrenNode.end - element.childrenNode.pos, textContent.length);
		}
		return textContent;
	}
}

// let inc = 0;
// const getSelectorKey = () =>
// 	`ZAWSXDECFRVGBHNJMKLMJINHUBGYTVFRCDES${Math.random()}ZWAXSECRVTFBNHMJJINHUBHYGVTFR${++inc}SDASDSADDSAD`;
// const formatDocument = (documentController: TextDocumentController) => {
// 	const sourceFile = documentController.sourceFile;
// 	const scriptTagChildNodes = sourceFile.kixScriptTagChildNodes;
// 	const styleTagChildNodes = sourceFile.kixStyleTagChildNodes;


// 	const nodeContain = (node: N, check: N) => {
// 		return node.pos < check.pos && check.end < node.end;
// 	};

// 	const getNodeChild = (
// 		node: ts.Node | ts.NodeArray<ts.Node>,
// 		originalTextContent: string,
// 		preChildNodes: ts.NodeArray<ts.JsxChild>[]
// 	) => {
// 		let nodeTextContent = originalTextContent;
// 		const updatedPreChildNodes: ts.NodeArray<ts.JsxChild>[] = [];
// 		const childNodes: ts.NodeArray<ts.JsxChild>[] = [];

// 		parentFor: for (const child of preChildNodes) {

// 			for (const haveParentCHild of preChildNodes) {
// 				if (nodeContain(haveParentCHild, child)) {
// 					updatedPreChildNodes.push(child);
// 					continue parentFor;
// 					break;
// 				}
// 			}

// 			const { pos, end } = child;
// 			// .children;
// 			nodeTextContent = nodeTextContent.slice(0, pos) +
// 				removeAllContentFromString(nodeTextContent, pos, end) +
// 				nodeTextContent.slice(end, nodeTextContent.length);

// 			childNodes.push(child);

// 		}



// 		let textContent = nodeTextContent.slice(node.pos, node.end);
// 		console.log("🚀 --> file: index.ts:246 --> formatDocument --> textContent:", textContent);


// 		for (const childNode of childNodes) {
// 			const content = getNodeChild(childNode, originalTextContent, updatedPreChildNodes.filter(n => nodeContain(childNode, n)));
// 			textContent =
// 				textContent.slice(0, childNode.pos - node.pos) +
// 				content +
// 				textContent.slice(childNode.end - node.pos, textContent.length);
// 		}
// 		return textContent;
// 	};

// 	const resss = getNodeChild(sourceFile, sourceFile.text, tagNodes);
// 	console.log('🚀 --> file: --> resss:', resss);
// 	// const textContent = sourceFile.text;
// 	// const start = 0;
// 	// const end = textContent.length;

// 	// const content = new TextEdit()
// };
// const formatStyle = () => {


// };
// // const fromatStyle = async (node: ts.JsxElement) => {
// // 	const styleContentNode =

// // }
// /**
//  *
//  * script:=>
//  *
//  */

// // export function provideInlayHints(range: Range) {
// // 	const embedContentFiles = this.getAllEmbedFiles();
// // 	return Promise.all(embedContentFiles.map(embedFileDetails => {
// // 		const {
// // 			uri: embeddedUri,
// // 			areaController
// // 		} = embedFileDetails;
// // 		const embeddedRange = areaController?.updateRange(range) || range;

// // 		const redirectObject = createProxyRedirectValue(this, areaController);
// // 		const testIfCanRedirect = (obj: Record<any, any>) => {
// // 			if (obj instanceof Location) {
// // 				const uriProp = obj["uri"];
// // 				return uriToString(uriProp) === uriToString(embeddedUri);
// // 			}

// // 			return true;
// // 		};

// // 		return commands.executeCommand<InlayHint[]>(
// // 			'vscode.executeHoverProvider',
// // 			embeddedUri,
// // 			embeddedRange
// // 		).then((inlayHint) => {
// // 			console.log("🚀 --> file: index.ts:139 --> TextDocumentController --> ).then --> inlayHint:", inlayHint);

// // 			return proxyRedirectEmbedFile(inlayHint, redirectObject, testIfCanRedirect);
// // 		});
// // 	})).then(inlayHints => {
// // 		return inlayHints.flat(1);
// // 	});

// // }
