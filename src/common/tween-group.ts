import { Tween } from "./tween";

/**
 * This serves as an alias to the namespaced Tween class.
 */
export class TweenGroup extends createjs.TweenGroup {
	public get<T>(target: T, props?: any): Tween<T> {
		return this.add(new Tween(target, props));
	}
}
