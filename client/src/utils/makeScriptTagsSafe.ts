import ts from '../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { createContentAreaController } from './createContentAreaController';

export const makeScriptTagsSafe = (textContent: string, offset: number, scriptTagChildNodes: ts.JsxElement[]) => {
	const areaController = createContentAreaController(textContent);

	areaController.addContent(`<div>\n`, `\n</div>`, 0, textContent.length);
	for (const scriptTaNode of scriptTagChildNodes) {
		const { pos, end } = scriptTaNode.children;

		areaController.addContent(`{()=>{\n`, `\n}}`, pos, end);
	}
	return {
		textContent: areaController.value,
		offset: areaController.getUpdatedPosition(offset),
		areaController
	};
};