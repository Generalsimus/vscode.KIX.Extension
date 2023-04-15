import { EmbedFileContentArea } from '..';

export const findContentLocationArea = (offset: number, elements: EmbedFileContentArea[]): EmbedFileContentArea | undefined => {
	for (const el of elements) {
		if (el.node.pos <= offset && el.node.end >= offset) {
			return el;
		}
	}
};