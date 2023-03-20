/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { commands, CompletionList, ExtensionContext, Uri, workspace } from 'vscode';
import { getLanguageService } from 'vscode-html-languageservice';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
import { getCSSVirtualContent, isInsideStyleRegion } from './embeddedSupport';

let client: LanguageClient;

const htmlLanguageService = getLanguageService();

export function activate(context: ExtensionContext) {
	console.log("🚀 --> activate");
	

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

	const virtualDocumentContents = new Map<string, string>();

	workspace.registerTextDocumentContentProvider('embedded-content', {
		provideTextDocumentContent: uri => {
			console.log("🚀 --> file: extension.ts:42 --> activate --> uri:");
			const originalUri = uri.path.slice(1).slice(0, -4);
			const decodedUri = decodeURIComponent(originalUri);
			return virtualDocumentContents.get(decodedUri);
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
				console.log("🚀 --> file: extension.ts:46 --> provideCompletionItem: --> document:", document, document.getText(), document.offsetAt(position));
				
				// If not in `<style>`, do not perform request forwarding
				if (!isInsideStyleRegion(htmlLanguageService, document.getText(), document.offsetAt(position))) {
					const res = await next(document, position, context, token);
					console.log("🚀 --> file: extension.ts:60 --> provideCompletionItem: --> res:", res);
					return res
				}

				const originalUri = document.uri.toString(true);
				virtualDocumentContents.set(originalUri, getCSSVirtualContent(htmlLanguageService, document.getText()));

				const vdocUriString = `embedded-content://css/${encodeURIComponent(
					originalUri
				)}.css`;
				const vdocUri = Uri.parse(vdocUriString);
				const res222 = await commands.executeCommand<CompletionList>(
					'vscode.executeCompletionItemProvider',
					vdocUri,
					position,
					context.triggerCharacter
				);
				console.log("🚀 --> file: extension.ts:77 --> provideCompletionItem: --> res222:", res222);
				return res222;
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
	console.log("🚀 --> deactivate");
	// debugger;
	if (!client) {
		return undefined;
	}
	return client.stop();
}
