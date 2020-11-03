export type RgbaValue = { r: number; g: number; b: number; a: number };

/**
 *
 * @param num
 */
export function numToRgba(num: number): RgbaValue {
	return {
		r: Math.floor(num / (256 * 256)) % 256,
		g: Math.floor(num / 256) % 256,
		b: num % 256,
		a: 1
	};
}

/**
 *
 * @param hex
 */
export function hexToRgba(hex: string): RgbaValue {
	const num = hexToNum(hex);
	return numToRgba(num);
}

/**
 *
 * @param rgba
 */
export function rgbToHex(rgba: RgbaValue): string {
	const rg = rgba.b | (rgba.g << 8) | (rgba.r << 16);
	return "#" + (0x1000000 + rg).toString(16).slice(1);
}

/**
 *
 * @param rgba
 */
export function rgbToNum(rgba: RgbaValue): number {
	const hex = rgbToHex(rgba);
	return hexToNum(hex);
}

/**
 *
 * @param hex
 */
export function hexToNum(hex: string): number {
	return parseInt(hex.replace("#", "0x"));
}
