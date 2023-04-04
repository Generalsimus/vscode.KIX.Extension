import ts from '../../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { ContentAreaController } from './contentAreaController';

export const makeScriptTagsSafe = (
	textContent: string,
	scriptTagChildNodes: ts.JsxElement[]
) => {
	const areaController = new ContentAreaController(textContent);
	areaController.addContent(`<div>\n`, `\n</div>`, 0, textContent.length);

	for (const scriptTaNode of scriptTagChildNodes) {
		const { pos, end } = scriptTaNode.children;


		areaController.addContent(`{()=>{\n`, `\n}}`, pos, end);
	}

	return {
		areaController,
		textContent: areaController.content
	};
};