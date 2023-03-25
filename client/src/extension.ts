/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { commands, CompletionItemKind, CompletionList, ExtensionContext, TextDocument, Uri, workspace } from 'vscode';
import { getLanguageService } from 'vscode-html-languageservice';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
import { getCSSVirtualContent, isInsideStyleRegion } from './embeddedSupport';
import ts from '../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { CustomLanguageServiceHost } from './host';
import { findContentLocationNode } from './utils/findContentLocationNode';
import { createStyleTagContent } from './utils/createStyleTagContent';
import { removeAllContentFromString } from './utils/removeAllContentFromString';

let client: LanguageClient;

const htmlLanguageService = getLanguageService();
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

	workspace.registerTextDocumentContentProvider('embedded-content', {
		provideTextDocumentContent: uri => {
			console.log("🚀 --> file: extension.ts:51 --> activate --> uri:", uri);
			// const originalUri = uri.path.slice(1).slice(0, -4);
			// const decodedUri = decodeURIComponent(originalUri);
			// console.log("🚀 --> file: extension.ts:42 --> activate --> uri:", { uri, originalUri, decodedUri, embeddedFilesContent:embeddedFilesContent.keys() });
			// return virtualDocumentContents.get(decodedUri);

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
			// pattern: `*.{kts,kjs,ts,js}`
		}],
		middleware: {
			provideCompletionItem: async (document, position, context, token, next) => {
				const originalUri = document.uri.toString(true);
				const file: ts.SourceFile = ts.createSourceFile(
					originalUri,
					document.getText(),
					ts.ScriptTarget.Latest,
					true,
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

				const removeStyleTagUnsafeContent = (textContent: string, styleTagChildNodes: ts.JsxElement[]) => {
					for (const styleTagNode of styleTagChildNodes) {
						const { pos, end } = styleTagNode.children;
						textContent = textContent.slice(0, pos) +
							removeAllContentFromString(textContent.slice(pos, end)) +
							textContent.slice(end, textContent.length);

					}
					return textContent;
				};
				const createOffsetConteroler=()=>{
					
				}
				const makeScriptTagsSafe = (textContent: string, offset: number, scriptTagChildNodes: ts.JsxElement[]) => {
					const insideTagName = "div";
					const startTagName = `<${insideTagName}>\n`;
					const endTagName = `\n</${insideTagName}>`;
					textContent = `${startTagName}${textContent}${endTagName}`;
					// offset += startTagName.length;
					let plusSizes = 
					for (const scriptTaNode of scriptTagChildNodes) {
						const { pos, end } = scriptTaNode.children;
						textContent = textContent.slice(0, pos) +
							`removeAllContentFromString(textContent.slice(pos, end))` +
							textContent.slice(end, textContent.length);
						const ss = `{()=>{}}`;

					}

				};
				const createScriptTagContent = (document: TextDocument, styleTagChildNodes: ts.JsxElement[], scriptTagChildNodes: ts.JsxElement[]) => {
					const textContent = document.getText();
					const safeTextContent = removeStyleTagUnsafeContent(textContent, styleTagChildNodes);
					makeScriptTagsSafe(safeTextContent, offset, scriptTagChildNodes);
					// console.log("🚀 --> file: extension.ts:112 --> createScriptTagContent --> safeTextContent:", safeTextContent);
					// safeTextContent, 

				};
				createScriptTagContent(document, file.kixStyleTagChildNodes, file.kixScriptTagChildNodes);

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


	// client.onRequest("INITIAL_workspaceFolders", (aargs) => {
	// 	console.log("🚀 --> file: extension.ts:122 --> client.onRequest --> aargs:", aargs);

	// });
	client.start();
	// console.log("🚀 --> file: extension.ts:124 --> activate --> client:", client);
}

export function deactivate(): Thenable<void> | undefined {
	console.log("🚀 --> deactivate");
	// debugger;
	if (!client) {
		return undefined;
	}
	return client.stop();
}
