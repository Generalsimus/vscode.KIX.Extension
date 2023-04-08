/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { getLanguageService } from 'vscode-html-languageservice';
import { createConnection, InitializedParams, InitializeParams, ProposedFeatures, TextDocuments, TextDocumentSyncKind } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
// import ts from '../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
// import { CustomLanguageServiceHost } from '../../client/src/host';




// const languageService = ts.createLanguageService(
// 	new CustomLanguageServiceHost(),
// 	ts.createDocumentRegistry(),
// 	true
// );
// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

const htmlLanguageService = getLanguageService();

connection.onInitialize((_params: InitializeParams) => {
	// console.log("🚀 --> onInitialize", _params);
	// connection.onred
	// connection.sendRequest("INITIAL_workspaceFolders", _params.workspaceFolders);
	return {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Full,
			// Tell the client that the server supports code completion
			completionProvider: {
				resolveProvider: false
			},
			definitionProvider: true,
			hoverProvider: true,
			signatureHelpProvider: {

			},
			typeDefinitionProvider: true,
			implementationProvider: true,
			referencesProvider: true,
			documentHighlightProvider: true,
			codeActionProvider: true,
			codeLensProvider: {
				resolveProvider: false
			}
		}
	};
});
// connection.onInitialized((_params: InitializedParams) => {
// 	console.log("🚀 --> onInitializedd", _params);
// 	connection.sendRequest("INITIAL_workspaceFolders", _params);
// return {
// 	capabilities: {
// 		textDocumentSync: TextDocumentSyncKind.Full,
// 		// Tell the client that the server supports code completion
// 		completionProvider: {
// 			resolveProvider: false
// 		}
// 	}
// };
// });


// connection.onCompletion(async (textDocumentPosition, token) => {
// 	const document = documents.get(textDocumentPosition.textDocument.uri);
// // 	console.log("🚀 --> onCompletion");

// 	if (!document) {
// 		return null;
// 	}
// 	// proj.getCompletionsAtPosition
// 	const res = htmlLanguageService.doComplete(
// 		document,
// 		textDocumentPosition.position,
// 		htmlLanguageService.parseHTMLDocument(document)
// 	);
// 	console.log("🚀 --> file: server.ts:99 --> connection.onCompletion --> res:", res);

// 	return res;
// });

documents.listen(connection);
connection.listen();
