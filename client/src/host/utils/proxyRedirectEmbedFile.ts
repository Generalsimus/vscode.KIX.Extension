import { Position, Range, Uri } from 'vscode';
import { TextDocumentController } from '..';
import { ContentAreaController } from './contentAreaController';

export const proxyRedirectEmbedFile = <T extends Record<any, any>, A extends T | T[]>(
	target: A,
	redirectValue: (obj: any) => any,
	testIfCanRedirect: (obj: Record<any, any>) => boolean
): A => {
	if (typeof target !== 'object' || testIfCanRedirect(target) === false) {
		return target;
	}
	if (target instanceof Array) {
		return target.map((el) => proxyRedirectEmbedFile(el, redirectValue, testIfCanRedirect)) as A;
	}

	const state: any = {};
	const proxyma = new Proxy(target, {
		get(obj, prop, receiver) {
			if (prop in state) {
				return state[prop];
			}

			const value = Reflect.get(obj, prop, obj);


			if (typeof value === 'object') {
				const updateValue = redirectValue(value) || proxyRedirectEmbedFile(value, redirectValue, testIfCanRedirect);

				state[prop] = updateValue;
				return updateValue;
			}

			return value;
		},
		set(obj, prop, value, receiver) {
			state[prop] = value;
			return true;
		},
	});
	return proxyma;
};

export const createProxyRedirectValue = (textDocumentController: TextDocumentController, areaController: ContentAreaController | undefined) => {
	const redirect = (
		value: any,
	) => {
		if (areaController) {
			if (value instanceof Range) {
				return areaController.updateOriginalRange(value);
			} else if (value instanceof Position) {
				return areaController.updateOriginalPosition(value);
			}
		}
		if (value instanceof Uri) {
			return textDocumentController.textdocument.uri;
		}
		
	};
	return redirect;
}; 