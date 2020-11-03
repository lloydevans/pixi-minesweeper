/**
 *
 */
export function preventContextMenu() {
	window.addEventListener("contextmenu", (e) => e.preventDefault(), false);
}
