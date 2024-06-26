export type RgbaObject = { r: number; g: number; b: number; a: number };

export function numToRgba(num: number): RgbaObject {
	return {
		r: Math.floor(num / (256 * 256)) % 256,
		g: Math.floor(num / 256) % 256,
		b: num % 256,
		a: 1,
	};
}

export function hexToRgba(hex: string): RgbaObject {
	const num = hexToNum(hex);
	return numToRgba(num);
}

export function rgbToHex(rgba: RgbaObject): string {
	const rg = rgba.b | (rgba.g << 8) | (rgba.r << 16);
	return "#" + (0x1000000 + rg).toString(16).slice(1);
}

export function rgbToNum(rgba: RgbaObject): number {
	const hex = rgbToHex(rgba);
	return hexToNum(hex);
}

export function hexToNum(hex: string): number {
	return parseInt(hex.replace("#", "0x"));
}
