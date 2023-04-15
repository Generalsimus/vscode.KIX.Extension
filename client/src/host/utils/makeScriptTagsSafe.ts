import ts from '../../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';
import { ContentAreaController } from './contentAreaController';

export const makeScriptTagsSafe = (
	textContent: string,
	scriptTagChildNodes: ts.JsxElement[]
) => {
	const areaController = new ContentAreaController(textContent);
	areaController.addContent(`<>\n`, `\n</>`, 0, textContent.length);

	for (const scriptTaNode of scriptTagChildNodes) {
		const { pos, end } = scriptTaNode.children;
		console.log("🚀 --> file: makeScriptTagsSafe.ts:13 --> pos, end :", pos, end );


		areaController.addContent(`{()=>{\n`, `\n}}`, pos, end);
	}

	return {
		areaController,
		textContent: areaController.content
	};
};