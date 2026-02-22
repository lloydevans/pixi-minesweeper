import { lerp } from "./lerp";

describe("lerp", () => {
	it("should return a when k=0", () => {
		expect(lerp(0, 10, 0)).toBe(0);
		expect(lerp(5, 20, 0)).toBe(5);
		expect(lerp(-10, 10, 0)).toBe(-10);
	});

	it("should return b when k=1", () => {
		expect(lerp(0, 10, 1)).toBe(10);
		expect(lerp(5, 20, 1)).toBe(20);
		expect(lerp(-10, 10, 1)).toBe(10);
	});

	it("should return midpoint when k=0.5", () => {
		expect(lerp(0, 10, 0.5)).toBe(5);
		expect(lerp(0, 100, 0.5)).toBe(50);
		expect(lerp(-10, 10, 0.5)).toBe(0);
	});

	it("should interpolate at k=0.25", () => {
		expect(lerp(0, 100, 0.25)).toBe(25);
	});

	it("should interpolate at k=0.75", () => {
		expect(lerp(0, 100, 0.75)).toBe(75);
	});

	it("should handle equal values", () => {
		expect(lerp(5, 5, 0)).toBe(5);
		expect(lerp(5, 5, 0.5)).toBe(5);
		expect(lerp(5, 5, 1)).toBe(5);
	});

	it("should handle negative ranges", () => {
		expect(lerp(10, -10, 0.5)).toBe(0);
		expect(lerp(10, -10, 0)).toBe(10);
		expect(lerp(10, -10, 1)).toBe(-10);
	});

	it("should extrapolate beyond k=1", () => {
		expect(lerp(0, 10, 2)).toBe(20);
	});

	it("should extrapolate below k=0", () => {
		expect(lerp(0, 10, -1)).toBe(-10);
	});

	it("should handle zero range", () => {
		expect(lerp(0, 0, 0.5)).toBe(0);
	});

	it("should handle floating point values", () => {
		expect(lerp(0.1, 0.3, 0.5)).toBeCloseTo(0.2);
	});
});
