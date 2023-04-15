import {
	FormattingOptions,
	Position,
	TextDocument,
	TextEdit,
	Uri,
	commands,
} from 'vscode';
import ts from '../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { findContentLocationArea } from './utils/findContentLocationArea';
import { createStyleTagContent } from './utils/createStyleTagContent';
import { createScriptTagContent } from './utils/createScriptTagContent';
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
import { provideCodeLenses } from './provideCodeLenses';
import { provideColorPresentations } from './provideColorPresentations';
import { provideDocumentColors } from './provideDocumentColors';
import { provideInlayHints } from './provideInlayHints';
import { removeAllContentFromString } from './utils/removeAllContentFromString';
import { EmbedContentUriDetails, getNodeUriDetails } from './utils/getNodeUriDetails';
import { containNode } from './utils/nodeContains';
// commands.getCommands().then(red => {
// 	console.log("🚀 --> file: index.ts:30 --> commands.getCommands --> red:", red);

// });
// interface embedContentFile {
// 	endOfFileExt: string;
// 	uri: Uri;
// 	textContent: string;
// 	areaController?: ContentAreaController | undefined;
// }
export interface EmbedFileContentArea extends EmbedContentUriDetails {
	node: ts.Node,
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
	styleEmbedFileContentAreas: EmbedFileContentArea[]
	// scriptEmbedFileContentAreas: EmbedFileContentArea[]
	scriptEmbedFileContentArea: EmbedFileContentArea
	constructor(document: TextDocument, embeddedFilesMap: Map<string, string>) {
		this.textdocument = document;
		this.embeddedFilesMap = embeddedFilesMap;
		this.fileName = document.uri.toString(true);
		const originalTextContent = this.textContent = document.getText();


		const sourceFile = this.sourceFile = ts.createSourceFile(
			this.fileName,
			this.textContent,
			ts.ScriptTarget.Latest,
			false,
			ts.ScriptKind.KTS
		);
		// create script tag Content
		const scriptContent = createScriptTagContent(sourceFile);
		const scriptUriDetails = getNodeUriDetails(sourceFile, this.fileName, false, "SCRIPT_TAG");
		this.scriptEmbedFileContentArea = {
			...scriptUriDetails,
			node: sourceFile,
			textContent: scriptContent.textContent,
			areaController: scriptContent.areaController,
		};
		embeddedFilesMap.set(scriptUriDetails.uriString, this.scriptEmbedFileContentArea.textContent);
		// create style tag Content
		this.styleEmbedFileContentAreas = [];
		for (const node of this.sourceFile.kixStyleTagChildNodes) {
			const styleUriDetails = getNodeUriDetails(node, this.fileName, true, "STYLE_TAG");
			const contentArea = {
				...styleUriDetails,
				node: node,
				textContent: createStyleTagContent(originalTextContent, node),
				areaController: undefined
			};
			embeddedFilesMap.set(styleUriDetails.uriString, contentArea.textContent);
			this.styleEmbedFileContentAreas.push(contentArea);
		}



		this.formatCode = new FormatCodeController(this);
	}
	// embedFileEmitCache: Map<string, embedContentFile> = new Map();
	getAllEmbedFiles(): EmbedFileContentArea[] {
		return [
			this.scriptEmbedFileContentArea,
			...this.styleEmbedFileContentAreas
		];
	}
	getDocumentUpdateDocumentContentAtPositions(position: Position): EmbedFileContentArea {
		const offset = this.textdocument.offsetAt(position);
		return findContentLocationArea(
			offset,
			this.styleEmbedFileContentAreas
		) || this.scriptEmbedFileContentArea;
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
		this.formatCode.format(options);
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


type FormatTsNode = Required<{
	pos: number,
	end: number,
}>

type FormatElement = {
	formatNode: FormatTsNode,
	formatCodeUri: EmbedContentUriDetails,
	childrenNode: FormatTsNode,
}
class FormatCodeController {
	sourceFile: ts.SourceFile
	formatElements: FormatElement[]
	scriptTagChildNodes: ts.JsxElement[]
	styleTagChildNodes: ts.JsxElement[]
	originalTextContent: string
	textDocumentController: TextDocumentController
	constructor(textDocumentController: TextDocumentController) {
		this.textDocumentController = textDocumentController;
		this.sourceFile = textDocumentController.sourceFile;
		this.scriptTagChildNodes = this.sourceFile.kixScriptTagChildNodes;
		this.styleTagChildNodes = this.sourceFile.kixStyleTagChildNodes;
		this.formatElements = [];
		this.originalTextContent = this.sourceFile.text;

		for (const el of this.scriptTagChildNodes) {
			this.formatElements.push({
				formatNode: el,
				formatCodeUri: getNodeUriDetails(el, this.textDocumentController.fileName, false, "FORMAT_SCRIPT_CODE"),
				childrenNode: el.children
			});
		}
		for (const el of this.styleTagChildNodes) {
			this.formatElements.push({
				formatNode: el,
				formatCodeUri: getNodeUriDetails(el, this.textDocumentController.fileName, true, "FORMAT_STYLE_CODE"),
				childrenNode: el.children
			});
		}

		// this.options = {};
	}
	containNode = containNode
	async format(options: FormattingOptions,) {
		console.log("🚀 --> file: --> this.formatCode():", await this.formatCode(options));
	}
	async formatCode(options: FormattingOptions) {
		return this.formatNode(
			{
				formatNode: this.sourceFile,
				formatCodeUri: getNodeUriDetails(this.sourceFile, this.textDocumentController.fileName, false, "FORMAT_SCRIPT_CODE"),
				childrenNode: this.sourceFile,
			},
			options,
			this.formatElements
		);
	}
	async formatNode(
		element: FormatElement,
		options: FormattingOptions,
		preChildElements: FormatElement[]
	) {
		let nodeTextContent = this.originalTextContent;
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
		const formateDCode = await this.formatContent(textContent, options, element);

		console.log("🚀 --> file: index.ts:269 --> FormatCodeController --> formateDCode:", formateDCode);
		// console.log("🚀 --> file: index.ts:287 --> FormatCodeController --> textContent:", textContent);



		for (const childNode of childNodes) {
			const content = await this.formatNode(childNode, options, updatedPreChildNodes.filter(n => this.containNode(childNode.formatNode, n.formatNode)));
			textContent =
				textContent.slice(0, childNode.childrenNode.pos - element.childrenNode.pos) +
				content +
				textContent.slice(childNode.childrenNode.end - element.childrenNode.pos, textContent.length);
		}
		return textContent;
	}
	async formatContent(content: string, options: FormattingOptions, element: FormatElement) {
		const embeddedUri = element.formatCodeUri;
		this.textDocumentController.embeddedFilesMap.set(embeddedUri.uriString, content);
		const format = await commands.executeCommand<TextEdit[]>(
			'vscode.executeFormatDocumentProvider',
			embeddedUri.uri,
			options
		);
		this.textDocumentController.embeddedFilesMap.delete(embeddedUri.uriString);

		return format;
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
