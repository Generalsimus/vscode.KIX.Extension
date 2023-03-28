import { Position, Range } from 'vscode';
import { getPositionFromTextLineColumn } from './getPositionFromTextLineColumn';
import { getLineColumnFromTextPosition } from './getLineColumnFromTextPosition';

export const createContentAreaController = (content: string) => {
	const plusSizePositions: [number, number][] = [];
	const originalContent = content;
	return {
		get value() {
			return content;
		},
		addContent(startContent: string, endContent: string, pos: number, end: number) {
			const updatedPos = this.getUpdatedPosition(pos);
			const updatedEnd = this.getUpdatedPosition(end);

			plusSizePositions.push(
				[pos, startContent.length],
				[end, endContent.length]
			);

			return content = (
				content.slice(0, updatedPos) +
				`${startContent}${content.slice(updatedPos, updatedEnd)}${endContent}` +
				content.slice(updatedEnd, content.length)
			);
		},
		getUpdatedPosition(position: number) {
			let newPosition = position;
			for (const [originalPos, addedSize] of plusSizePositions) {
				if (position > originalPos) {
					newPosition = newPosition + addedSize;
				}
			}
			return newPosition;
		},
		getOriginalPosition(updatedContentPosition: number) {
			let plusSize = 0;
			for (const [originalPos, addedSize] of plusSizePositions) {
				if (updatedContentPosition > (originalPos + plusSize + addedSize)) {
					plusSize = plusSize + addedSize;
				}
			}
			return updatedContentPosition - plusSize;
		},
		updateRange({ start, end }: Range) {
			const originalStartOffset = this.getOriginalPosition(getPositionFromTextLineColumn(content, start.line, start.character));
			const originalEndOffset = this.getOriginalPosition(getPositionFromTextLineColumn(content, end.line, end.character));

			const updateStartLineColl = getLineColumnFromTextPosition(originalContent, originalStartOffset);
			const updateEndLineColl = getLineColumnFromTextPosition(originalContent, originalEndOffset);


			return new Range(
				start.with(
					updateStartLineColl.line,
					updateStartLineColl.column,
				),
				end.with(
					updateEndLineColl.line,
					updateEndLineColl.column,
				),
			);
		}
	};
};