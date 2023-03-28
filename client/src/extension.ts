/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { commands, CompletionItem, CompletionList, ExtensionContext, Position, Range, workspace } from 'vscode';
import { getLanguageService } from 'vscode-html-languageservice';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
import ts from '../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { CustomLanguageServiceHost } from './host';
import { findContentLocationNode } from './utils/findContentLocationNode';
import { createStyleTagContent } from './utils/createStyleTagContent';
import { createScriptTagContent } from './utils/createScriptTagContent';
import { EMBEDDED_LANGUAGE_SCHEMA } from './utils/helpers';
import { getPositionFromTextLineColumn } from './utils/getPositionFromTextLineColumn';
// import { removeAllContentFromString } from './utils/removeAllContentFromString';

let client: LanguageClient | undefined;

// const htmlLanguageService = getLanguageService();
let languageService: ts.LanguageService;
export const getTSLanguageService = () => {
	if (languageService === undefined) {
		return languageService = ts.createLanguageService(
			new CustomLanguageServiceHost("./"),
			ts.createDocumentRegistry(),
			ts.LanguageServiceMode.PartialSemantic
		);
	}
	return languageService;
};
// const languageService = ;
export function activate(context: ExtensionContext) {
	console.log("🚀 --> activate", context);


	// The server is implemented in node
	const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
		}
	};
	// CompletionItemKind.
	const virtualDocumentContents = new Map<string, string>();
	const embeddedFilesContent = new Map<string, string>();

	workspace.registerTextDocumentContentProvider(EMBEDDED_LANGUAGE_SCHEMA, {
		provideTextDocumentContent: uri => {
			// console.log("🚀 --> file: extension.ts:54 --> activate --> uri:", uri);

			// console.log("🚀 --> file: --> :", uri.path, "\n", embeddedFilesContent.get(uri.path));

			return embeddedFilesContent.get(uri.path);
		}
	});
	// workspace.registerFileSystemProvider

	const clientOptions: LanguageClientOptions = {
		documentSelector: [{
			/** A language id, like `typescript`. */
			language: "kix",
			/** A Uri [scheme](#Uri.scheme), like `file` or `untitled`. */
			scheme: "file",
			/** A glob pattern, like `*.{ts,js}`. */
			// pattern: `*.{kts,kjs}`
		}],
		middleware: {
			provideCompletionItem: async (document, position, context, token, next) => {
				const originalUri = document.uri.toString(true);
				const file: ts.SourceFile = ts.createSourceFile(
					originalUri,
					document.getText(),
					ts.ScriptTarget.Latest,
					false,
					ts.ScriptKind.KTS
				);

				const offset = document.offsetAt(position);

				const contentNode = findContentLocationNode(offset, file.kixStyleTagChildNodes);
				if (contentNode !== undefined) {
					const { content, uri } = createStyleTagContent(document, contentNode);

					embeddedFilesContent.set(uri.path, content);

					return await commands.executeCommand<CompletionList>(
						'vscode.executeCompletionItemProvider',
						uri,
						position,
						context.triggerCharacter
					);
				}




				const { uri, position: updatedPosition, textContent: updatedTextContent, areaController } = createScriptTagContent(
					document,
					position,
					offset,
					file.kixStyleTagChildNodes,
					file.kixScriptTagChildNodes
				);
				// try {

				// 	console.log("🚀 -->  updatedPosition1:", updatedTextContent.split("\n")[updatedPosition.line].split("")[updatedPosition.character - 1]);
				// 	console.log("🚀 -->  updatedPosition2:", document.getText().split("\n")[position.line].split("")[position.character - 1]);

				// } catch (error) {
				// 	console.log("🚀 --> file: extension.ts:129 --> provideCompletionItem: --> error:", "error");

				// }
				// console.log({
				// 	uri,
				// 	updatedPosition,
				// 	triggerCharacter: context.triggerCharacter
				// });
				// embeddedFilesContent.set(uri.path, document.getText());
				embeddedFilesContent.set(uri.path, updatedTextContent);
				const completionList = await commands.executeCommand<CompletionList>(
					'vscode.executeCompletionItemProvider',
					uri,
					// position,
					updatedPosition,
					context.triggerCharacter
				);


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
			},
			// provideHover: (document, position, token, next) => {
			// 	console.log("🚀 --> file: AAAAAAAAAAAA:", document.getText());
			// 	return null as any;
			// },
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);


	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	console.log("🚀 --> deactivate");
	return client?.stop();
}
