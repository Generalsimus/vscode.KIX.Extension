import { FormattingOptions, TextEdit, commands } from 'vscode';
import { TextDocumentController } from '..';
import ts from '../../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { EmbedContentUriDetails, getNodeUriDetails } from '../utils/getNodeUriDetails';
import { containNode } from '../utils/nodeContains';
import { removeAllContentFromString } from '../utils/removeAllContentFromString';
import { replaceRangeContent } from '../utils/replaceRangeContent';


type FormatTsNode = Required<{
	pos: number,
	end: number,
}>

type FormatElement = {
	formatNode: FormatTsNode,
	formatCodeUri: EmbedContentUriDetails,
	childrenNode: FormatTsNode,
}
export class FormatCodeController {
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
	async format(options: FormattingOptions) {
		console.log("🚀 --> file: --> this.formatCode():", await this.formatCode(options));
		// new TextEdit()
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



		// const { pos: originalPos, end: originalEnd } = element.childrenNode;
		let textContent = nodeTextContent.slice(element.childrenNode.pos, element.childrenNode.end);
		const formattedCode = await this.formatContent(textContent, options, element);

		const BEFORE = textContent;
		for (const format of formattedCode) {
			// textContent = replaceRangeContent(format.range, textContent, format.newText);
		}
		// 	ss;
		console.log("🚀 --> file: --> BEFORE:", BEFORE);
		console.log("🚀 --> file: --> AFTER:", textContent);
		console.log("🚀 --> file: index.ts:271 --> FormatCodeController --> formattedCode:", formattedCode);
		// 	TextEdit.replace;
		// console.log("🚀 --> file: index.ts:269 --> FormatCodeController --> formateDCode:", formateDCode);
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
