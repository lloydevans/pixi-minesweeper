import { TweenProps } from "./tween-props";
import { Ease } from "./ease";

/**
 * This serves as an alias to the namespaced Tween class.
 *
 * Experimental - Adding type safety to createjs tweenjs API.
 */
export class Tween<T> extends createjs.Tween {
	constructor(target: T, options?: TweenProps) {
		super(target, options);
	}

	wait(duration: number, passive?: boolean): Tween<T> {
		return super.wait(duration, passive);
	}

	to(props: Partial<T>, duration?: number, ease = Ease.sineInOut): Tween<T> {
		return super.to(props, duration, ease);
	}

	label(name: string): Tween<T> {
		return super.label(name);
	}

	call(callback: (...params: any[]) => void, params?: Partial<T>[], scope?: unknown): Tween<T> {
		return super.call(callback, params, scope);
	}

	set(props: Partial<T>, target?: T): Tween<T> {
		return super.set(props, target);
	}

	play(tween?: Tween<T>): Tween<T> {
		return super.play(tween);
	}

	pause(tween?: Tween<T>): Tween<T> {
		return super.pause(tween);
	}
}
