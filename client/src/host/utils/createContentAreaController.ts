import { Position, Range } from 'vscode';
import { getPositionFromTextLineColumn } from './getPositionFromTextLineColumn';
import { getLineColumnFromTextPosition } from './getLineColumnFromTextPosition';
import { TextDocumentController } from '..';

export class CreateContentAreaController { 
	content: string
	documentController:TextDocumentController
	constructor(documentController:TextDocumentController) {
		this.documentController = documentController;
		this.content = documentController.textContent;
	}
	plusSizePositions: [number, number][] = []
	addContent(startContent: string, endContent: string, pos: number, end: number) {
		const updatedPos = this.getUpdatedPosition(pos);
		const updatedEnd = this.getUpdatedPosition(end);

		this.plusSizePositions.push(
			[pos, startContent.length],
			[end, endContent.length]
		);

		return this.content = (
			this.content.slice(0, updatedPos) +
			`${startContent}${this.content.slice(updatedPos, updatedEnd)}${endContent}` +
			this.content.slice(updatedEnd, this.content.length)
		);
	}
	getUpdatedPosition(position: number) {
		let newPosition = position;
		for (const [originalPos, addedSize] of this.plusSizePositions) {
			if (position > originalPos) {
				newPosition = newPosition + addedSize;
			}
		}
		return newPosition;
	}
	getOriginalPosition(updatedContentPosition: number) {
		let plusSize = 0;
		for (const [originalPos, addedSize] of this.plusSizePositions) {
			if (updatedContentPosition > (originalPos + plusSize + addedSize)) {
				plusSize = plusSize + addedSize;
			}
		}
		return updatedContentPosition - plusSize;
	}
	updatePosition(position: Position) {
		const originalPositionOffset = this.getOriginalPosition(getPositionFromTextLineColumn(this.content, position.line, position.character));

		const updateStartLineColl = getLineColumnFromTextPosition(this.documentController.textContent, originalPositionOffset);
		return position.with(
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
} 