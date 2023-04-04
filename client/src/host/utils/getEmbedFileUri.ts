import { Uri } from 'vscode';
import { EMBEDDED_LANGUAGE_SCHEMA } from './helpers';

export const getEmbedFileUri = (fileName: string, type: string, endOfFileExt: string) => {
	return Uri.parse(
		`${EMBEDDED_LANGUAGE_SCHEMA}://${type}/${fileName}.${endOfFileExt}`
	);
};