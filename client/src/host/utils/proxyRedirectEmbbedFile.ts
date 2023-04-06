import { Position, Range, Uri } from 'vscode';
import { TextDocumentController } from '..';
import { ContentAreaController } from './contentAreaController';

export const proxyRedirectEmbedFile = <T extends Record<any, any>, A extends T | T[]>(
	target: A,
	redirectValue: (obj: any) => any,
	testIfCanRedirect: (obj: Record<any, any>) => boolean
): A => {
	if (target instanceof Array) {
		return target.map((el) => proxyRedirectEmbedFile(el, redirectValue, testIfCanRedirect)) as A;
	}

	if (typeof target !== 'object' || testIfCanRedirect(target) === false) {
		return target;
	}
	// const ifCanRedirect = testIfCanRedirect(target

	const state: Partial<T> = {};
	return new Proxy(target, {
		get(obj, prop, receiver) {
			// console.log("🚀 --> prop:", obj, prop);
			if (prop in state) {
				const ret = Reflect.get(state, prop);
				console.log(
					"🚀 --> prop1:",
					obj,
					prop,
					ret,
					state,
					prop in state,
					Object.prototype.hasOwnProperty.call(state, prop)
				);
				return ret;
			}
			const value = Reflect.get(obj, prop, receiver);

			const updateValue = redirectValue(value) || proxyRedirectEmbedFile(value, redirectValue, testIfCanRedirect);

			try {
				console.log(
					"🚀 --> prop2:",
					obj,
					prop,
					updateValue,
					state,
					prop in state,
					Object.prototype.hasOwnProperty.call(state, prop)
				);
			} catch (e: any) { 
				console.log("🚀 --> e:", e);
				
			}

			Reflect.set(state, prop, updateValue);
			return updateValue;
		},
		set(obj, prop, value, receiver) {
			return Reflect.set(state, prop, value);
		},
	});
};

export const createProxyRedirectValue = (textDocumentController: TextDocumentController, areaController?: ContentAreaController) => {
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