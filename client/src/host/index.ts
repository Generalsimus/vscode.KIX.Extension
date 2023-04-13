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
import { createProxyRedirectValue, proxyRedirectEmbedFile } from './utils/proxyRedirectEmbedFile';
import { provideCodeLenses } from './provideCodeLenses';
import { provideColorPresentations } from './provideColorPresentations';
import { provideDocumentColors } from './provideDocumentColors';
import { provideInlayHints } from './provideInlayHints';
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
		const embedFilesContents = this.sourceFile.kixStyleTagChildNodes.map(elementNode => {
			const styleEmbedContent = createStyleTagContent(this, elementNode);
			this.embeddedFilesMap.set(uriToString(styleEmbedContent.uri), styleEmbedContent.textContent);
			return styleEmbedContent;
		});
		// const embedFilesContents: embedContentFile[] = [];


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
	provideCodeLenses = provideCodeLenses
	provideColorPresentations = provideColorPresentations
	provideDocumentColors = provideDocumentColors
	provideInlayHints = provideInlayHints
	provideDocumentFormattingEdits(options: FormattingOptions) {
		const embedContentFiles = this.getAllEmbedFiles();

		return Promise.all(embedContentFiles.map(embedFileDetails => {
			const {
				uri: embeddedUri,
				areaController
			} = embedFileDetails;
			return commands.executeCommand<TextEdit[]>(
				'vscode.executeFormatDocumentProvider',
				embeddedUri,
				options
			).then((inlayHints) => {
				// console.log("🚀 --> file: index.ts:142 --> TextDocumentController --> ).then --> inlayHint:", inlayHint);
				// console.log("🚀 --> file: index.ts:139 --> TextDocumentController --> ).then --> inlayHint:", inlayHint);
				// // return inlayHint;
				// return proxyRedirectEmbedFile(inlayHint, redirectObject, testIfCanRedirect);
				return {
					inlayHints,
					embedFileDetails
				};
			});
		})).then(embedInlineHints => {
			console.log(
				"🚀 --> inlayHints:",
				embedInlineHints.map(e => e.inlayHints).flat(Infinity)
			);
			const newInlineHints: TextEdit[] = [];
			for (const { embedFileDetails: currentEmbedFileDetails, inlayHints: currentInlayHints } of embedInlineHints) {

				for (const currentInlayHint of currentInlayHints) {
					const currentInlayHintRange = currentEmbedFileDetails.areaController?.updateRange(currentInlayHint.range) || currentInlayHint.range;
					embedInlineHints.forEach(({ embedFileDetails, inlayHints }, index) => {
						// for (const { embedFileDetails, inlayHints } of embedInlineHints) {
						for (const inlayHint of inlayHints) {
							const inlayHintRange = embedFileDetails.areaController?.updateRange(inlayHint.range) || inlayHint.range;
							if (currentInlayHintRange.contains(inlayHintRange)) {
								// currentInlayHint.replace
							}
						}
						// }
					});


				}
				// const { areaController: currentAreaController } = currentEmbedFileDetails;
				// for (const embedInlineHint of embedInlineHints) {
				// 	const currentRange =  currentAreaController.updateRange(currentInlayHints.)
				// }
			}
			return newInlineHints;
		});

	}
}


let inc = 0;
const getSelectorKey = () => `ZAWSXDECFRVGBHNJMKLMJINHUBGYTVFRCDES${Math.random()}ZWAXSECRVTFBNHMJJINHUBHYGVTFR${++inc}SDASDSADDSAD`;
const formatDocument = (documentController: TextDocumentController) => {
	const sourceFile = documentController.sourceFile;
	const scriptTagChildNodes = sourceFile.kixScriptTagChildNodes;
	const styleTagChildNodes = sourceFile.kixStyleTagChildNodes;
	const tagNodes = [...scriptTagChildNodes, ...styleTagChildNodes].sort((e1, e2) => (e1.pos - e2.pos));

	const tagNodesHierarchy = new Map();
	const getChildNodes = (pos: number, end: number, tagNodes: ts.JsxElement[]) => {
		return tagNodes.filter((node) => {
			const contain = node.pos > pos && end < node.end;
			// for (const el)
			// return 
		});
	};
	// for(const tagNode of tagNodes){

	// }



	const textContent = sourceFile.text;
	const start = 0;
	const end = textContent.length;

	// const content = new TextEdit()


};
/**
 *
 * script:=>
 *
 */

// export function provideInlayHints(range: Range) {
// 	const embedContentFiles = this.getAllEmbedFiles();
// 	return Promise.all(embedContentFiles.map(embedFileDetails => {
// 		const {
// 			uri: embeddedUri,
// 			areaController
// 		} = embedFileDetails;
// 		const embeddedRange = areaController?.updateRange(range) || range;



// 		const redirectObject = createProxyRedirectValue(this, areaController);
// 		const testIfCanRedirect = (obj: Record<any, any>) => {
// 			if (obj instanceof Location) {
// 				const uriProp = obj["uri"];
// 				return uriToString(uriProp) === uriToString(embeddedUri);
// 			}

// 			return true;
// 		};

// 		return commands.executeCommand<InlayHint[]>(
// 			'vscode.executeHoverProvider',
// 			embeddedUri,
// 			embeddedRange
// 		).then((inlayHint) => {
// 			console.log("🚀 --> file: index.ts:139 --> TextDocumentController --> ).then --> inlayHint:", inlayHint);

// 			return proxyRedirectEmbedFile(inlayHint, redirectObject, testIfCanRedirect);
// 		});
// 	})).then(inlayHints => {
// 		return inlayHints.flat(1);
// 	});

// }