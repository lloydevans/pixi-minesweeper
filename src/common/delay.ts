import { Tween } from "./tween";

const TARGET = {};

/**
 *
 * @param time
 */
export async function delay(time: number) {
	return new Promise((resolve) => Tween.get(TARGET).wait(time).call(resolve));
}
