import { Tween } from "./tween";

/**
 * This serves as an alias to the namespaced Tween class.
 */
export class TweenGroup extends createjs.TweenGroup {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public get<T>(target: T, props?: any): Tween<T> {
		return this.add(new Tween(target, props));
	}
}
