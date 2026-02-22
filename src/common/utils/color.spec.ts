import { numToRgba, hexToRgba, rgbToHex, rgbToNum, hexToNum, velocityToColor } from "./color";
import type { RgbaObject } from "./color";

describe("Color utilities", () => {
	describe("hexToNum", () => {
		it("should convert #000000 to 0", () => {
			expect(hexToNum("#000000")).toBe(0);
		});

		it("should convert #FFFFFF to 16777215", () => {
			expect(hexToNum("#FFFFFF")).toBe(16777215);
		});

		it("should convert #FF0000 to 0xFF0000", () => {
			expect(hexToNum("#FF0000")).toBe(0xff0000);
		});

		it("should convert #00FF00 to 0x00FF00", () => {
			expect(hexToNum("#00FF00")).toBe(0x00ff00);
		});

		it("should convert #0000FF to 0x0000FF", () => {
			expect(hexToNum("#0000FF")).toBe(0x0000ff);
		});
	});

	describe("numToRgba", () => {
		it("should convert 0 to black", () => {
			const result = numToRgba(0);
			expect(result).toEqual({ r: 0, g: 0, b: 0, a: 1 });
		});

		it("should convert 0xFF0000 to red", () => {
			const result = numToRgba(0xff0000);
			expect(result).toEqual({ r: 255, g: 0, b: 0, a: 1 });
		});

		it("should convert 0x00FF00 to green", () => {
			const result = numToRgba(0x00ff00);
			expect(result).toEqual({ r: 0, g: 255, b: 0, a: 1 });
		});

		it("should convert 0x0000FF to blue", () => {
			const result = numToRgba(0x0000ff);
			expect(result).toEqual({ r: 0, g: 0, b: 255, a: 1 });
		});

		it("should convert 0xFFFFFF to white", () => {
			const result = numToRgba(0xffffff);
			expect(result).toEqual({ r: 255, g: 255, b: 255, a: 1 });
		});

		it("should handle mixed values", () => {
			const result = numToRgba(0x804020);
			expect(result).toEqual({ r: 128, g: 64, b: 32, a: 1 });
		});

		it("should always set alpha to 1", () => {
			expect(numToRgba(0).a).toBe(1);
			expect(numToRgba(0xffffff).a).toBe(1);
		});
	});

	describe("hexToRgba", () => {
		it("should convert #FF0000 to red rgba", () => {
			expect(hexToRgba("#FF0000")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
		});

		it("should convert #000000 to black rgba", () => {
			expect(hexToRgba("#000000")).toEqual({ r: 0, g: 0, b: 0, a: 1 });
		});

		it("should convert #FFFFFF to white rgba", () => {
			expect(hexToRgba("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
		});
	});

	describe("rgbToHex", () => {
		it("should convert red to #ff0000", () => {
			expect(rgbToHex({ r: 255, g: 0, b: 0, a: 1 })).toBe("#ff0000");
		});

		it("should convert green to #00ff00", () => {
			expect(rgbToHex({ r: 0, g: 255, b: 0, a: 1 })).toBe("#00ff00");
		});

		it("should convert blue to #0000ff", () => {
			expect(rgbToHex({ r: 0, g: 0, b: 255, a: 1 })).toBe("#0000ff");
		});

		it("should convert black to #000000", () => {
			expect(rgbToHex({ r: 0, g: 0, b: 0, a: 1 })).toBe("#000000");
		});

		it("should convert white to #ffffff", () => {
			expect(rgbToHex({ r: 255, g: 255, b: 255, a: 1 })).toBe("#ffffff");
		});
	});

	describe("rgbToNum", () => {
		it("should convert red rgba to 0xFF0000", () => {
			expect(rgbToNum({ r: 255, g: 0, b: 0, a: 1 })).toBe(0xff0000);
		});

		it("should convert black rgba to 0", () => {
			expect(rgbToNum({ r: 0, g: 0, b: 0, a: 1 })).toBe(0);
		});

		it("should round-trip through numToRgba", () => {
			const original = 0xabcdef;
			const rgba = numToRgba(original);
			const result = rgbToNum(rgba);
			expect(result).toBe(original);
		});
	});

	describe("round-trip conversions", () => {
		const testValues = [0x000000, 0xff0000, 0x00ff00, 0x0000ff, 0xffffff, 0x123456, 0xabcdef];

		it("should round-trip num -> rgba -> hex -> num", () => {
			for (const num of testValues) {
				const rgba = numToRgba(num);
				const hex = rgbToHex(rgba);
				const result = hexToNum(hex);
				expect(result).toBe(num);
			}
		});

		it("should round-trip hex -> num -> rgba -> hex", () => {
			const hexValues = ["#ff0000", "#00ff00", "#0000ff", "#000000", "#ffffff"];
			for (const hex of hexValues) {
				const num = hexToNum(hex);
				const rgba = numToRgba(num);
				const result = rgbToHex(rgba);
				expect(result).toBe(hex);
			}
		});
	});

	describe("velocityToColor", () => {
		it("should return a number", () => {
			const result = velocityToColor(0.5);
			expect(typeof result).toBe("number");
		});

		it("should clamp velocity below 0 to 0", () => {
			const atZero = velocityToColor(0);
			const belowZero = velocityToColor(-0.5);
			expect(belowZero).toBe(atZero);
		});

		it("should clamp velocity above 1 to 1", () => {
			const atOne = velocityToColor(1);
			const aboveOne = velocityToColor(1.5);
			expect(aboveOne).toBe(atOne);
		});

		it("should produce different colors for different velocities", () => {
			const low = velocityToColor(0);
			const mid = velocityToColor(0.5);
			const high = velocityToColor(1);
			// All three should be different colors
			expect(low).not.toBe(mid);
			expect(mid).not.toBe(high);
			expect(low).not.toBe(high);
		});

		it("should use custom saturation", () => {
			const defaultColor = velocityToColor(0.5);
			const highSat = velocityToColor(0.5, { saturation: 1.0 });
			const lowSat = velocityToColor(0.5, { saturation: 0.1 });
			// Different saturation should produce different colors
			expect(highSat).not.toBe(lowSat);
		});

		it("should use custom lightness", () => {
			const bright = velocityToColor(0.5, { lightness: 0.8 });
			const dark = velocityToColor(0.5, { lightness: 0.2 });
			expect(bright).not.toBe(dark);
		});

		it("should use custom hue range", () => {
			const defaultColor = velocityToColor(0.5);
			const customHue = velocityToColor(0.5, { startHue: 0, endHue: 120 });
			expect(defaultColor).not.toBe(customHue);
		});

		it("should handle forward hue direction", () => {
			// startHue < endHue
			const color = velocityToColor(0.5, { startHue: 0, endHue: 120 });
			expect(typeof color).toBe("number");
			expect(color).toBeGreaterThanOrEqual(0);
		});

		it("should handle backward hue direction (default)", () => {
			// Default: startHue=260, endHue=0 (backward)
			const color = velocityToColor(0.5);
			expect(typeof color).toBe("number");
			expect(color).toBeGreaterThanOrEqual(0);
		});

		it("should produce valid color numbers (0 to 0xFFFFFF)", () => {
			for (let v = 0; v <= 1; v += 0.1) {
				const color = velocityToColor(v);
				expect(color).toBeGreaterThanOrEqual(0);
				expect(color).toBeLessThanOrEqual(0xffffff);
			}
		});

		it("velocity 0 should produce a blue/purple hue by default", () => {
			const color = velocityToColor(0);
			const rgba = numToRgba(color);
			// At hue=260 (blue/purple), blue channel should be dominant
			expect(rgba.b).toBeGreaterThan(rgba.r);
		});

		it("velocity 1 should produce a red hue by default", () => {
			const color = velocityToColor(1);
			const rgba = numToRgba(color);
			// At hue=0 (red), red channel should be dominant
			expect(rgba.r).toBeGreaterThan(rgba.b);
			expect(rgba.r).toBeGreaterThan(rgba.g);
		});
	});
});
