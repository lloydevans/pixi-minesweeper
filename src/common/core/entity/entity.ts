import * as PIXI from "pixi.js-legacy";
import { Component } from "../../core/components/component";
import { Tween } from "../../tweens/tween";
import { TweenGroup } from "../../tweens/tween-group";
import { TweenOptions } from "../../tweens/tween-props";
import { App } from "../app/app";
import { DestroyOptions } from "./destroy-options";

type ComponentCtor<T extends Component = Component> = new (entity: Entity, ...params: unknown[]) => T;

/**
 *
 */
export class Entity extends PIXI.Container {
	/**
	 * Pixi application reference.
	 */
	public app: App;

	/** */
	private components: Component[] = [];

	/**
	 *
	 *
	 * @param app - Pixi application reference.
	 */
	public constructor(app: App = App.shared) {
		super();

		this.app = app;
	}

	/**
	 *
	 * @param componentCtor
	 */
	public get<T extends Component>(componentCtor: ComponentCtor<T>): T {
		const component = this.components.find((el) => el instanceof componentCtor) as T;

		if (!component) {
			throw new Error(`Can't find "${componentCtor.name}" component.`);
		}

		return component;
	}

	/**
	 *
	 * @param componentCtor
	 */
	public add<T extends Component>(componentCtor: ComponentCtor<T>, ...initParams: Parameters<T["init"]>): T {
		if (this.has(componentCtor)) {
			throw new Error(`Component "${componentCtor.name}" already exists on entity.`);
		}

		const instance = new componentCtor(this);

		this.components.push(instance);

		instance.init(...initParams);

		return instance;
	}

	/**
	 *
	 * @param componentCtor
	 */
	public has<T extends Component>(componentCtor: ComponentCtor<T>): boolean {
		return !!this.components.find((el) => el instanceof componentCtor);
	}

	/**
	 * Component tween group.
	 */
	protected readonly tweenGroup = new TweenGroup(false, 1);

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

	/** */
	protected tween<T>(target: T, options?: TweenOptions): Tween<T> {
		const tween = this.tweenGroup.get(target, options);
		return tween;
	}

	/** */
	protected delay(time: number) {
		return new Promise((resolve) => this.tween(this).wait(time).call(resolve));
	}
}
