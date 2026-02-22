import { modo } from "./modo";

describe("modo", () => {
	it("should behave like modulus for positive values", () => {
		expect(modo(5, 3)).toBe(2);
		expect(modo(10, 4)).toBe(2);
		expect(modo(7, 7)).toBe(0);
	});

	it("should return 0 when value is 0", () => {
		expect(modo(0, 5)).toBe(0);
		expect(modo(0, 1)).toBe(0);
	});

	it("should return 0 when value is a multiple of length", () => {
		expect(modo(6, 3)).toBe(0);
		expect(modo(10, 5)).toBe(0);
	});

	it("should wrap negative values correctly", () => {
		expect(modo(-1, 5)).toBe(4);
		expect(modo(-2, 5)).toBe(3);
		expect(modo(-5, 5)).toBe(0);
		expect(modo(-6, 5)).toBe(4);
	});

	it("should handle negative values as positive modulus", () => {
		// Standard JS % returns -1 for -1 % 5, but modo wraps it to 4
		expect(modo(-1, 3)).toBe(2);
		expect(modo(-4, 3)).toBe(2);
	});

	it("should handle length of 1", () => {
		expect(modo(0, 1)).toBe(0);
		expect(modo(5, 1)).toBe(0);
		expect(modo(-3, 1)).toBe(0);
	});

	it("should handle large values", () => {
		expect(modo(1000000, 7)).toBe(1000000 % 7);
		expect(modo(-1000000, 7)).toBe((((-1000000 % 7) + 7) % 7));
	});

	it("should handle value equal to length", () => {
		expect(modo(5, 5)).toBe(0);
		expect(modo(10, 10)).toBe(0);
	});

	it("should handle value just below length", () => {
		expect(modo(4, 5)).toBe(4);
		expect(modo(9, 10)).toBe(9);
	});
});
