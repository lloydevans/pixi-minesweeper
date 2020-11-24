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

export class ColorSchemes {
	public static beachRainbow = {
		green: "#C8F69B",
		yellow: "#FFEEA5",
		orange: "#FFCBA5",
		red: "#FFB1AF",
		purple: "#D6D4FF",
		blue: "#B3EEFF",
	};
	public static beachRainbowDark = {
		green: "#92B471",
		yellow: "#D0C286",
		orange: "#D2A788",
		red: "#D0908F",
		purple: "#A6A4C6",
		blue: "#8EBDCB",
	};
}
