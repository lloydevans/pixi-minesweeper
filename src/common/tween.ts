import { TweenOptions } from "./tween-props";
import { Ease } from "./ease";

/**
 * This serves as an alias to the namespaced Tween class.
 *
 * Experimental - Adding type safety to createjs tweenjs API.
 */
export class Tween<T = any> extends createjs.Tween {
	public static get<T>(target: T, options?: TweenOptions): Tween<T> {
		return new Tween(target, options);
	}

	constructor(target: T, options?: TweenOptions) {
		super(target, options);
	}

	wait(duration: number, passive?: boolean) {
		return super.wait(duration, passive);
	}

	to(props: Partial<T>, duration?: number, ease = Ease.sineInOut) {
		return super.to(props, duration, ease);
	}

	label(name: string) {
		return super.label(name);
	}

	call(callback: (...params: any[]) => void, params?: Partial<T>[], scope?: unknown) {
		return super.call(callback, params, scope);
	}

	set(props: Partial<T>, target?: T) {
		return super.set(props, target);
	}

	play(tween?: Tween<T>): this {
		return super.play(tween) as this;
	}

	pause(tween?: Tween<T>): this {
		return super.pause(tween) as this;
	}
}
