import * as PIXI from "pixi.js-legacy";
import { Component } from "../../core/components/component";
import { Tween } from "../../tweens/tween";
import { TweenGroup } from "../../tweens/tween-group";
import { TweenOptions } from "../../tweens/tween-props";
import { App } from "../app/app";
import { DestroyOptions } from "./destroy-options";

type ComponentCtor<T> = new (entity: Entity) => T;

/**
 *
 */
export class Entity extends PIXI.Container {
	/**
	 * Pixi application reference.
	 */
	public app: App;

	/**
	 *
	 */
	private components: Component[] = [];

	/**
	 *
	 * @param componentCtor
	 */
	public get<T extends Component>(componentCtor: ComponentCtor<T>): T | undefined {
		return this.components.find((el) => el instanceof componentCtor) as T;
	}

	/**
	 *
	 */
	public add<T extends Component>(componentCtor: ComponentCtor<T>): T {
		const existingComponent = this.get(componentCtor);

		if (existingComponent) {
			throw new Error("Component already exists on entity.");
		}

		let instance;

		try {
			instance = new componentCtor(this);
		} catch (err) {
			throw new Error("Error instantiating component:\n\n" + err);
		}

		this.components.push(instance);

		return instance;
	}

	/**
	 * Component tween group.
	 */
	protected readonly tweenGroup = new TweenGroup(false, 1);

	/**
	 *
	 *
	 * @param app - Pixi application reference.
	 */
	public constructor(app: App) {
		super();

		this.app = app;
	}

	/**
	 * Do some extra things on the Container destroy method.
	 *
	 * @param options - Destroy options.
	 */
	public destroy(options?: DestroyOptions) {
		this.tweenGroup.reset();
		this.emit("destroy");
		super.destroy(options);
	}

	/**
	 *
	 */
	protected tween<T>(target: T, options?: TweenOptions): Tween<T> {
		const tween = this.tweenGroup.get(target, options);
		return tween;
	}

	/**
	 *
	 */
	protected delay(time: number) {
		return new Promise((resolve) => this.tween(this).wait(time).call(resolve));
	}
}
