import * as PIXI from "pixi.js-legacy";
import { App } from "../app/app";
import { Tween } from "../../tweens/tween";
import { TweenGroup } from "../../tweens/tween-group";
import { TweenOptions } from "../../tweens/tween-props";
import { Component } from "../../core/components/component";

// These are copied from the Container inline type.
export type EntityDestroyOptions = {
	children?: boolean;
	texture?: boolean;
	baseTexture?: boolean;
};

type ComponentCtor<T> = new (entity: Entity) => T;

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
	 * Reference to audio manager instance.
	 */
	public get audio() {
		return this.app.audio;
	}

	/**
	 *
	 * @param ctor
	 */
	public getComponent<T extends Component>(ctor: ComponentCtor<T>): T | undefined {
		return this.components.find((el) => el instanceof ctor) as T;
	}

	/**
	 *
	 */
	public addComponent<T extends Component>(ctor: ComponentCtor<T>): T {
		const existingComponent = this.getComponent(ctor);

		if (existingComponent) {
			throw new Error("Component already exists on entity.");
		}

		let component;

		try {
			component = new ctor(this);
		} catch (err) {
			throw new Error("Error instantiating component:\n\n" + err);
		}

		this.components.push(component);

		return component;
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

		this.ready();
	}

	/**
	 * Do stuff once ready.
	 */
	private ready() {
		// Call init function if it exists.
		this.init && this.init();
		this.emit("init");

		// Call resize function if it exists.
		this.resize && this.resize(this.app.width, this.app.height);
		this.emit("resize", this.app.width, this.app.height);

		// Add listeners
		this.update && this.app.events.update.on(this.update, this);
		this.resize && this.app.events.resize.on(this.resize, this);
	}

	/**
	 * Do some extra things on the Container destroy method.
	 *
	 * @param options - Destroy options.
	 */
	public destroy(options?: EntityDestroyOptions) {
		this.update && this.app.events.update.off(this.update, this);
		this.resize && this.app.events.resize.off(this.resize, this);
		this.cleanup && this.cleanup();
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

	/**
	 *
	 */
	protected defer() {
		return new Promise((resolve) => this.app.ticker.addOnce(resolve));
	}

	/**
	 * Init method is called after app ready event. If app is already ready, it
	 * runs during the constructor.
	 */
	protected init?(): void;

	/**
	 * Optional method called on destroy.
	 */
	protected cleanup?(): void;

	/**
	 * Optional method called on update.
	 *
	 * @param dt - Frame delta time.
	 */
	protected update?(dt: number): void;

	/**
	 * Optional method called on resize. Note, this is called once after init
	 * regardles of wether the app has resized or not.
	 *
	 * @param width - App virtual width.
	 * @param height - App virtual height.
	 */
	protected resize?(width: number, height: number): void;
}
