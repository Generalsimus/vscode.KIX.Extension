import ts from '../../../../../../TypeScript-For-KIX/lib/tsserverlibrary';

export const findContentLocationNode = (offset: number, elements: ts.JsxElement[]): ts.JsxElement | undefined => {

	for (const node of elements) {
		if (node.pos <= offset && node.end >= offset) {
			return node;
		}
	}
};