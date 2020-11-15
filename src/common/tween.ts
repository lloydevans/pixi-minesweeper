import { TweenProps } from "./tween-props";
import { Ease } from "./ease";

/**
 * This serves as an alias to the namespaced Tween class.
 *
 * Experimental - Adding type safety to createjs tweenjs API.
 */
export class Tween<T = any> extends createjs.Tween {
	constructor(target: T, options?: TweenProps) {
		super(target, options);
	}

	wait(duration: number, passive?: boolean): this {
		return super.wait(duration, passive);
	}

	to(props: Partial<T>, duration?: number, ease = Ease.sineInOut): this {
		return super.to(props, duration, ease) as this;
	}

	label(name: string): this {
		return super.label(name);
	}

	call(callback: (...params: any[]) => void, params?: Partial<T>[], scope?: unknown): this {
		return super.call(callback, params, scope);
	}

	set(props: Partial<T>, target?: T): this {
		return super.set(props, target);
	}

	play(tween?: Tween<T>): this {
		return super.play(tween);
	}

	pause(tween?: Tween<T>): this {
		return super.pause(tween);
	}
}
