
import { commands, CompletionList, ExtensionContext, Position, Range, TextDocument, workspace } from 'vscode';
import ts from '../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { findContentLocationNode } from './utils/findContentLocationNode';
import { createStyleTagContent } from '../utils/createStyleTagContent';
import { createScriptTagContent } from '../utils/createScriptTagContent';

export class DocumentHost {
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
	getCompletionItems(position: Position, triggerCharacter?: string) {
		const offset = this.textdocument.offsetAt(position);
		const styleContentNode = findContentLocationNode(offset, this.sourceFile.kixStyleTagChildNodes);

		if (styleContentNode === undefined) {
			const { uri, position: updatedPosition, textContent, areaController } = createScriptTagContent(
				this,
				position,
				offset,
			);
			this.embeddedFilesMap.set(uri.path, textContent);
			return commands.executeCommand<CompletionList>(
				'vscode.executeCompletionItemProvider',
				uri,
				updatedPosition,
				triggerCharacter
			);

		}

		const { content, uri } = createStyleTagContent(this, styleContentNode);
		this.embeddedFilesMap.set(uri.path, content);
		return commands.executeCommand<CompletionList>(
			'vscode.executeCompletionItemProvider',
			uri,
			position,
			triggerCharacter
		);
	}
}