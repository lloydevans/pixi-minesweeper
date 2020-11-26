/**
 * Prevent contetx menu on right click anywhere on the page.
 */
export function preventContextMenu() {
	window.addEventListener("contextmenu", (e) => e.preventDefault(), false);
}

/**
 * Loop array elements in random order.
 *
 * @param target - Target array.
 * @param cb - Callback function.
 */
export async function forEachRandom<T>(target: ReadonlyArray<T>, cb: (el: T) => Promise<void>) {
	const _target = [...target];
	while (_target.length > 0) {
		const idx = Math.floor(Math.random() * _target.length);
		const el = _target.splice(idx, 1)[0];
		await cb(el);
	}
}

/**
 * Clone JSON-friendly JS objects.
 *
 * @param obj - Target object.
 */
export function jsonClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * Replacment for isEqual until lodash is imported for cloud functions.
 */
export function shallowObjectEquals(a: any, b: any) {
	for (let key in a) {
		if (!(key in b) || a[key] !== b[key]) {
			return false;
		}
	}
	for (let key in b) {
		if (!(key in a) || a[key] !== b[key]) {
			return false;
		}
	}
	return true;
}
