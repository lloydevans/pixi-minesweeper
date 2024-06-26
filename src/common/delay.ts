import { Tween } from "./tween";

const TARGET = {};

export function delay(time: number) {
	return new Promise((resolve) => Tween.get(TARGET).wait(time).call(resolve));
}
