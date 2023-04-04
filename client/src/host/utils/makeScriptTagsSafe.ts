import ts from '../../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { CreateContentAreaController } from './createContentAreaController';

export const makeScriptTagsSafe = (
	areaController: CreateContentAreaController,
	scriptTagChildNodes: ts.JsxElement[],
	textContent: string
) => {
	areaController.addContent(`<div>\n`, `\n</div>`, 0, textContent.length);

	for (const scriptTaNode of scriptTagChildNodes) {
		const { pos, end } = scriptTaNode.children;


		areaController.addContent(`{()=>{\n`, `\n}}`, pos, end);
	}
	return textContent;
};