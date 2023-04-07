import { Position, Range, Uri } from 'vscode';
import { TextDocumentController } from '..';
import { ContentAreaController } from './contentAreaController';

export const proxyRedirectEmbedFile = <T extends Record<any, any>, A extends T | T[]>(
	target: A,
	redirectValue: (obj: any) => any,
	testIfCanRedirect: (obj: Record<any, any>) => boolean
): A => {
	if (typeof target !== 'object') {
		return target;
	}
	// else if (testIfCanRedirect(target) === false) {
	// 	return proxyRedirectEmbedFile(target, redirectValue, testIfCanRedirect);
	// }
	if (target instanceof Array) {
		return target.map((el) => proxyRedirectEmbedFile(el, redirectValue, testIfCanRedirect)) as A;
	}


	// const ifCanRedirect = testIfCanRedirect(target

	const state: Partial<T> = {};
	return new Proxy(target, {
		get(obj, prop, receiver) {
			// console.log("🚀 --> prop:", obj, prop);
			// return  Reflect.get(obj, prop, receiver);
			if (Object.prototype.hasOwnProperty.call(state, prop)) {
				const ret = Reflect.get(state, prop);
				// console.log(
				// 	"🚀 --> prop1:",
				// 	obj,
				// 	prop,
				// 	ret,
				// 	state,
				// 	prop in state,
				// 	Object.prototype.hasOwnProperty.call(state, prop)
				// );
				return ret;
			}
			const value = Reflect.get(obj, prop, receiver);

			// if (typeof value === 'object') {
			// 	const updateValue = testIfCanRedirect(value) ? redirectValue(value) : proxyRedirectEmbedFile(value, redirectValue, testIfCanRedirect);
			// 	Reflect.set(state, prop, updateValue);
			// 	return updateValue;
			// }
			// console.log(
			// 	"🚀 --> prop1:",
			// 	obj,
			// 	prop,
			// 	{ value, obj, rrr: (obj as any)?.toJSON},
			// 	state,
			// 	prop in state,
			// 	Object.prototype.hasOwnProperty.call(state, prop)
			// );
			if (typeof value === 'object') {
				const updateValue = proxyRedirectEmbedFile(value, redirectValue, testIfCanRedirect);
				// redirectValue(value) || 
				// redirectValue(value) || 
				Reflect.set(state, prop, updateValue);
				return updateValue;
			}
			return value;

			return value;
		},
		set(obj, prop, value, receiver) {
			// console.log("🚀 --> file: proxyRedirect/EmbbedFile.ts:67 --> set --> prop:", prop);
			// return Reflect.set(obj, prop, value,receiver);
			return Reflect.set(state, prop, value);
		},
	});
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
		return value;
	};
	return redirect;
}; 