/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { ExtensionContext, TextDocument, workspace } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { EMBEDDED_LANGUAGE_SCHEMA } from './host/utils/helpers';
import { TextDocumentController } from './host';
import { uriToString } from './host/utils/uriToString';

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


	const fileContentControllerHosts = new Map<string, TextDocumentController>();
	const embeddedFilesContent = new Map<string, string>();
	const createTextDocumentController = (document: TextDocument) => {
		const documentController = new TextDocumentController(document, embeddedFilesContent);
		fileContentControllerHosts.set(uriToString(document.uri), documentController);
		return documentController;
	};
	const getTextDocumentController = (document: TextDocument) => {

		return fileContentControllerHosts.get(uriToString(document.uri)) || createTextDocumentController(document);
	};

	workspace.registerTextDocumentContentProvider(EMBEDDED_LANGUAGE_SCHEMA, {
		provideTextDocumentContent: uri => {
			// console.log("🚀 --> file: extension.ts:44 --> activate --> uri:", uri,embeddedFilesContent.get(uriToString(uri)));
			return embeddedFilesContent.get(uriToString(uri));
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
			didOpen(document, next) {
				console.log("didOpen");
				createTextDocumentController(document);


				return next(document);
			},
			didChange(documentChangeEvent, next) {
				console.log("didChange");
				createTextDocumentController(documentChangeEvent.document);

				return next(documentChangeEvent);
			},
			provideCompletionItem(document, position, context, token, next) {
				console.log("provideCompletionItem");
				const textDocumentController = getTextDocumentController(document);

				return textDocumentController.getCompletionItems(position, document.uri, context.triggerCharacter);
			},
			provideDefinition(document, position, token, next) {
				console.log("provideDefinition");
				const textDocumentController = getTextDocumentController(document);

				return textDocumentController.provideDefinition(position, document.uri);
			},
			provideHover(document, position, token, next) {
				console.log("provideHover");
				const textDocumentController = getTextDocumentController(document);

				return textDocumentController.provideHover(position);
			},
			provideSignatureHelp(document, position, context, token, next) {
				console.log("provideSignatureHelp");
				const textDocumentController = getTextDocumentController(document);

				return textDocumentController.provideSignatureHelp(position, context.triggerCharacter);
			},
			provideTypeDefinition(document, position, token, next) {
				console.log("provideTypeDefinition");
				const textDocumentController = getTextDocumentController(document);

				return textDocumentController.provideTypeDefinition(position);

			},
			provideImplementation(document, position, token, next) {
				console.log("provideImplementation");
				const textDocumentController = getTextDocumentController(document);

				return textDocumentController.provideImplementation(position);
			},
			provideReferences(document, position, options, token, next) {
				console.log("provideReferences");
				const textDocumentController = getTextDocumentController(document);

				return textDocumentController.provideReferences(position);
			},
			provideDocumentHighlights(document, position, next) {
				console.log("provideDocumentHighlights");
				const textDocumentController = getTextDocumentController(document);

				return textDocumentController.provideDocumentHighlights(position);
			},
			provideCodeActions(document, range, context, token, next) {
				console.log("provideCodeActions");
				const textDocumentController = getTextDocumentController(document);

				return textDocumentController.provideCodeActions(range);
			},
			// TODO:FIX ME
			// provideCodeLenses(document, token, next) {
			// 	console.log("provideCodeLenses");
			// 	console.log("🚀 --> file: extension.ts:134 --> provideCodeLenses --> document:", document.uri, document.uri.toString());
			// 	const textDocumentController = getTextDocumentController(document);

			// 	return textDocumentController.provideCodeLenses();
			// }
			provideColorPresentations(color, context, token, next) {
				console.log("provideColorPresentations");
				const textDocumentController = getTextDocumentController(context.document);

				return textDocumentController.provideColorPresentations(color, context.range);
			},
			provideDocumentColors(document, token, next) {
				console.log("provideDocumentColors");
				const textDocumentController = getTextDocumentController(document);

				return textDocumentController.provideDocumentColors();
			},
			// provideDiagnostics(document, previousResultId, token, next) {

			// }
			// console.log("provideCodeActions");
			// const textDocumentController = getTextDocumentController(document);

			// return textDocumentController.provideCodeActions(range);
			// }, 
			// provideCodeLenses?: (this: void, document: TextDocument, token: CancellationToken, next: ProvideCodeLensesSignature) => ProviderResult<VCodeLens[]>;


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
