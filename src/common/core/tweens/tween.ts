import { TweenOptions } from "./tween-props";
import { Ease } from "../../ease";

/**
 *
 */
export class Tween<T = any> extends createjs.Tween {
	public static get<T>(target: T, options?: TweenOptions): Tween<T> {
		return new Tween(target, options);
	}

	public constructor(target: T, options?: TweenOptions) {
		super(target, options);
	}

	public wait(duration: number, passive?: boolean) {
		return super.wait(duration, passive);
	}

	public to(props: Partial<T>, duration?: number, ease = Ease.sineInOut) {
		return super.to(props, duration, ease);
	}

	public label(name: string) {
		return super.label(name);
	}

	public call(callback: (...params: any[]) => void, params?: Partial<T>[], scope?: unknown) {
		return super.call(callback, params, scope);
	}

	public set(props: Partial<T>, target?: T) {
		return super.set(props, target);
	}

	public play(tween?: Tween<T>): this {
		return super.play(tween) as this;
	}

	public pause(tween?: Tween<T>): this {
		return super.pause(tween) as this;
	}
}
