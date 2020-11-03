/**
 * Apply min and max values to a number.
 *
 * @param value
 * @param min
 * @param max
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}
