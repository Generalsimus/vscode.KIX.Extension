import { Uri } from 'vscode';
import { TextDocumentController } from '..';
import ts from '../../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { getEmbedFileUri } from './getEmbedFileUri';
import { uriToString } from './uriToString';

const enum FileContentTypes {
	css,
	tsx,
	jsx
}

export interface EmbedContentUriDetails {
	endOfFileExt: string
	originalFileName: string,
	type: FileContentTypes
	uri: Uri
	uriString: string
}

export const getNodeUriDetails = (node: Required<{ pos: number }>, originalFileName: string, isStyle, plusString = ""): EmbedContentUriDetails => {
	let uri: Uri | undefined;
	let uriString: string | undefined;

	if (isStyle) {
		const endOfFileExt = `${plusString}${node.pos}.css`;
		return {
			endOfFileExt: endOfFileExt,
			originalFileName: originalFileName,
			type: FileContentTypes.css,
			get uri() {
				return uri ||= getEmbedFileUri(originalFileName, "css", endOfFileExt);
			},
			get uriString() {
				return uriString ||= uriToString(this.uri);
			}
		};
	}




	const isTypescriptFile = /(\.kts)$/gim.test(originalFileName);
	const extType = isTypescriptFile ? 'tsx' : 'jsx';
	const endOfFileExt = `${plusString}${node.pos}.${extType}`;
	return {
		endOfFileExt: endOfFileExt,
		originalFileName: originalFileName,
		type: isTypescriptFile ? FileContentTypes.tsx : FileContentTypes.jsx,
		get uri() {
			return uri ||= getEmbedFileUri(originalFileName, extType, endOfFileExt);
		},
		get uriString() {
			return uriString ||= uriToString(this.uri);
		}
	};
};