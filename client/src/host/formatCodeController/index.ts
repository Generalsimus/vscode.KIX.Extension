import { FormattingOptions, Range, TextEdit, commands } from 'vscode';
import { TextDocumentController } from '..';
import ts from '../../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { EmbedContentUriDetails, getNodeUriDetails } from '../utils/getNodeUriDetails';
import { containNode } from '../utils/nodeContains';
import { removeAllContentFromString } from '../utils/removeAllContentFromString';
import { replaceRangeContent } from '../utils/replaceRangeContent';
import { getLineColumnFromTextPosition } from '../utils/getLineColumnFromTextPosition';


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
		// this.originalTextContent = `${this.sourceFile.text}`;

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
		this.formatElements = this.formatElements.sort((e1, e2) => (e1.formatNode.pos - e2.formatNode.pos));

		// this.options = {};
	}
	containNode = containNode
	async format(options: FormattingOptions) {
		const format = await this.formatCode(options);
		console.log("🚀 --> file: --> this.formatCode():", format);
		// console.log("🚀 --> file: index.ts:143 --> FormatCodeController --> result --> options:", options);
		const endOfPos = getLineColumnFromTextPosition(this.originalTextContent, this.sourceFile.end);
		return new TextEdit(
			new Range(
				0,
				0,
				endOfPos.line,
				endOfPos.column,
			),
			format
		);
		// return formattedTextEdits;
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
	keyIncId = 0;
	getSafeJSXChildKey() {
		return `A423FGHJ${Math.random()}KDF345${Math.random()}689${(this.keyIncId = ++this.keyIncId)}9HN`;
	}
	addTabSpaceInContent(content: string, hierarchialIndex = 0, spaceSize = 0) {
		const space = new Array(spaceSize * hierarchialIndex + 1).join(" ");

		// return "\n" + space + content.trim().split("\n").join(`\n${space}`) + "\n";
		return `\n${space}${content.trim().replace(/\n/g, `\n${space}`)}\n`;
		// return "\n" + space + content.trim().replace(/\n/g, `\n${space}`) + "\n";
	}
	async formatNode(
		element: FormatElement,
		options: FormattingOptions,
		preChildElements: FormatElement[],
		hierarchialIndex = 2,
	) {

		const nodeTextContent = this.originalTextContent.slice(element.childrenNode.pos, element.childrenNode.end);
		const updatedPreChildNodes: FormatElement[] = [];
		const childNodes: FormatElement[] = [];

		const elementChildCuts: string[] = [];

		let startPos = 0;
		parentFor: for (const child of preChildElements) {
			for (const haveParentCHild of preChildElements) {
				if (this.containNode(haveParentCHild.formatNode, child.formatNode)) {
					updatedPreChildNodes.push(child);
					continue parentFor;
					break;
				}
			}


			const { pos, end } = child.childrenNode;
			elementChildCuts.push(
				nodeTextContent.slice(startPos, pos - element.childrenNode.pos),
				nodeTextContent.slice(
					pos - element.childrenNode.pos,
					(startPos = end - element.childrenNode.pos)
				),
			);

			childNodes.push(child);

		}
		elementChildCuts.push(nodeTextContent.slice(startPos));
		const childKey = this.getSafeJSXChildKey();
		let textContent = elementChildCuts.reduce((content, el, index) => {
			return content + ((index + 1) % 2 === 0 ? childKey : el);
		}, "");
		// console.log("🚀 --> file: index.ts:118 --> FormatCodeController --> textContent --> elementChildCuts:", elementChildCuts);




		const formattedCode = await this.formatContent(textContent, options, element);
		for (const format of formattedCode) {
			textContent = replaceRangeContent(format.range, textContent, format.newText);
		}
		const sliceContent = textContent.split(childKey);


		// console.log("🚀 --> file: index.ts:174 --> sliceContent:", sliceContent);

		const result = await Promise.all(sliceContent.reduce<(string | Promise<string>)[]>((contents, el, index) => {
			contents.push(el.trim());
			const formatElement = childNodes[index];
			if (formatElement) {
				contents.push(
					this.formatNode(
						formatElement,
						options,
						updatedPreChildNodes.filter(n => this.containNode(formatElement.formatNode, n.formatNode)),
						hierarchialIndex + 1
					).then(content => {
						return this.addTabSpaceInContent(content, hierarchialIndex, options.tabSize);
					})
				);
			}
			return contents;
		}, [])).then(contents => contents.join(""));
		// console.log("🚀 --> file: index.ts:192 --> FormatCodeController --> result --> result:", result);

		return result;
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
