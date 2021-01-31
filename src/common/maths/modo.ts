/**
 * Modulus with negative values wrapped.
 *
 * @param value
 * @param length
 */
export function modo(value: number, length: number): number {
	return ((value % length) + length) % length;
}
