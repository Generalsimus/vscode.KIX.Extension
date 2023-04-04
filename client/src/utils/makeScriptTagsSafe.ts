import ts from '../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { TextDocumentController } from '../host';
import { CreateContentAreaController } from './createContentAreaController';

export const makeScriptTagsSafe = ({ areaController, sourceFile }: TextDocumentController, textContent: string, offset: number) => {


	areaController.addContent(`<div>\n`, `\n</div>`, 0, textContent.length);
	for (const scriptTaNode of sourceFile.kixScriptTagChildNodes) {
		const { pos, end } = scriptTaNode.children;


		areaController.addContent(`{()=>{\n`, `\n}}`, pos, end);
	}
	return {
		textContent: areaController.content,
		offset: areaController.getUpdatedPosition(offset),
		areaController
	};
};