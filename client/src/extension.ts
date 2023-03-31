/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { commands, CompletionList, ExtensionContext, Range, workspace } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
import ts from '../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { findContentLocationNode } from './utils/findContentLocationNode';
import { createStyleTagContent } from './utils/createStyleTagContent';
import { createScriptTagContent } from './utils/createScriptTagContent';
import { EMBEDDED_LANGUAGE_SCHEMA } from './utils/helpers';

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext) {
	console.log("🚀 --> file: extension.ts:18 --> activate --> context:", context);

	const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));

	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
		}
	};


	const embeddedFilesContent = new Map<string, string>();

	workspace.registerTextDocumentContentProvider(EMBEDDED_LANGUAGE_SCHEMA, {
		provideTextDocumentContent: uri => {


			return embeddedFilesContent.get(uri.path);
		}
	});


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

					return commands.executeCommand<CompletionList>(
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


				embeddedFilesContent.set(uri.path, updatedTextContent);

				const completionList = await commands.executeCommand<CompletionList>(
					'vscode.executeCompletionItemProvider',
					uri,
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
			provideHover: (document, position, token, next) => {
				console.log("🚀 --> file: extension.ts:123 --> activate --> document:", document);
				return null as any;
			}
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
	return client?.stop();
}
