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

/**
 * Configuration options for velocity to color conversion
 */
export interface VelocityColorConfig {
	/** Saturation value from 0-1 (default: 0.7) */
	saturation?: number;
	/** Lightness value from 0-1 (default: 0.5) */
	lightness?: number;
	/** Starting hue in degrees for velocity 0 (default: 260 - blue/purple) */
	startHue?: number;
	/** Ending hue in degrees for velocity 1 (default: 0 - red) */
	endHue?: number;
}

/**
 * Converts an HSL color to RGB
 */
function hslToRgb(h: number, s: number, l: number): RgbaObject {
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	
	let r = 0, g = 0, b = 0;
	
	if (h >= 0 && h < 60) {
		r = c; g = x; b = 0;
	} else if (h >= 60 && h < 120) {
		r = x; g = c; b = 0;
	} else if (h >= 120 && h < 180) {
		r = 0; g = c; b = x;
	} else if (h >= 180 && h < 240) {
		r = 0; g = x; b = c;
	} else if (h >= 240 && h < 300) {
		r = x; g = 0; b = c;
	} else if (h >= 300 && h < 360) {
		r = c; g = 0; b = x;
	}
	
	return {
		r: Math.round((r + m) * 255),
		g: Math.round((g + m) * 255),
		b: Math.round((b + m) * 255),
		a: 1,
	};
}

/**
 * Converts a MIDI note velocity (0-1) to a color number like piano roll editors.
 * Low velocity (0) -> Blue/Purple
 * Medium velocity (0.5) -> Green/Yellow
 * High velocity (1) -> Red
 * 
 * @param velocity - Note velocity from 0 to 1
 * @param config - Optional configuration for saturation, lightness, and hue range
 * @returns Color as a number (e.g., 0xFF0000 for red)
 * 
 * @example
 * // Default behavior
 * const color = velocityToColor(0.8); // Returns reddish-orange color
 * 
 * @example
 * // Custom saturation
 * const color = velocityToColor(0.5, { saturation: 0.9 }); // More saturated
 * 
 * @example
 * // Custom hue range
 * const color = velocityToColor(0.3, { 
 *   startHue: 240,  // Blue
 *   endHue: 0,      // Red
 *   saturation: 0.8,
 *   lightness: 0.6
 * });
 */
export function velocityToColor(velocity: number, config: VelocityColorConfig = {}): number {
	// Clamp velocity to 0-1 range
	const v = Math.max(0, Math.min(1, velocity));
	
	// Default configuration
	const saturation = config.saturation ?? 0.7;
	const lightness = config.lightness ?? 0.5;
	const startHue = config.startHue ?? 260; // Blue/purple
	const endHue = config.endHue ?? 0; // Red
	
	// Interpolate hue based on velocity
	// We need to handle the wrap-around at 360 degrees
	let hue: number;
	if (endHue < startHue) {
		// Going backwards through hue wheel (e.g., 260 to 0)
		hue = startHue - (v * (startHue - endHue));
	} else {
		// Going forwards through hue wheel
		hue = startHue + (v * (endHue - startHue));
	}
	
	// Normalize hue to 0-360 range
	hue = ((hue % 360) + 360) % 360;
	
	// Convert HSL to RGB
	const rgb = hslToRgb(hue, saturation, lightness);
	
	// Convert to color number
	return rgbToNum(rgb);
}
