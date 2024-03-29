import { Position, Range } from 'vscode';
import { getPositionFromTextLineColumn } from './getPositionFromTextLineColumn';
import { getLineColumnFromTextPosition } from './getLineColumnFromTextPosition';

export class ContentAreaController {
	content: string
	originalContent: string
	constructor(textContent: string) {
		this.originalContent = textContent;
		this.content = textContent;
	}
	plusSizePositions: [number, number][] = []
	addPlusSize(offset: number, size: number) {
		let index = 0;
		for (const [offsetPos] of this.plusSizePositions) {
			if (offsetPos < offset) {
				index++;
			}

		}
		this.plusSizePositions.splice(index, 0, [offset, size]);
	}
	addContent(startContent: string, endContent: string, pos: number, end: number) {
		const updatedPos = this.getUpdatedOffset(pos);
		const updatedEnd = this.getUpdatedOffset(end);

		this.addPlusSize(pos, startContent.length);
		this.addPlusSize(end, endContent.length);


		return this.content = (
			this.content.slice(0, updatedPos) +
			`${startContent}${this.content.slice(updatedPos, updatedEnd)}${endContent}` +
			this.content.slice(updatedEnd, this.content.length)
		);
	}
	getUpdatedOffset(originalOffset: number) {
		let newPosition = originalOffset;
		for (const [originalPos, addedSize] of this.plusSizePositions) {
			if (originalOffset > originalPos) {
				newPosition = newPosition + addedSize;
			}
		}
		return newPosition;
	}
	updatePosition(originalCodePosition: Position) {
		const updatedPositionOffset = this.getUpdatedOffset(getPositionFromTextLineColumn(this.originalContent, originalCodePosition.line, originalCodePosition.character));

		const updateStartLineColl = getLineColumnFromTextPosition(this.content, updatedPositionOffset);

		return originalCodePosition.with(
			updateStartLineColl.line,
			updateStartLineColl.column,
		);
	}
	updateRange({ start, end }: Range) {
		return new Range(
			this.updatePosition(start),
			this.updatePosition(end),
		);
	}
	getOriginalOffset(updatedOffset: number) {
		let plusSize = 0;
		for (const [originalPos, addedSize] of this.plusSizePositions) {
			if (updatedOffset > (originalPos + plusSize + addedSize)) {
				plusSize = plusSize + addedSize;
			}
		}
		return updatedOffset - plusSize;
	}
	updateOriginalPosition(updatedCodePosition: Position) {
		const updatedOffset = getPositionFromTextLineColumn(this.content, updatedCodePosition.line, updatedCodePosition.character);
		const originalPositionOffset = this.getOriginalOffset(updatedOffset);

		const updateStartLineColl = getLineColumnFromTextPosition(this.originalContent, originalPositionOffset);

		return updatedCodePosition.with(
			updateStartLineColl.line,
			updateStartLineColl.column,
		);
	}
	updateOriginalRange({ start, end }: Range) {
		return new Range(
			this.updateOriginalPosition(start),
			this.updateOriginalPosition(end),
		);
	}
} 