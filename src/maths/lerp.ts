/**
 * Interpolates between two values using a value
 *
 * @param a
 * @param b
 * @param k
 */
export function lerp(a: number, b: number, k: number): number {
	return (b - a) * k + a;
}
