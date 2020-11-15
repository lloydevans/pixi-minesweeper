/**
 *
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
	let _target = [...target];
	while (_target.length > 0) {
		let idx = Math.floor(Math.random() * _target.length);
		let el = _target.splice(idx, 1)[0];
		await cb(el);
	}
}
