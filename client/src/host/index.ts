import {
	FormattingOptions,
	Position,
	Range,
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
import { newLIneCharCode } from './utils/helpers';
import { replaceRangeContent } from './utils/replaceRangeContent';
import { FormatCodeController } from './formatCodeController';
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
	provideDocumentFormattingEdits(options: FormattingOptions) {
		// const embedContentFiles = this.getAllEmbedFiles();
		// formatDocument(this);
		return this.formatCode.format(options).then(e => [e]);
		// return [await this.formatCode.format(options)];
	}
}