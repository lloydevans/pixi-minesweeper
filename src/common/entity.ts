import * as PIXI from "pixi.js-legacy";
import { App } from "./app";
import { TweenGroup } from "./tween-group";
import { TweenOptions } from "./tween-props";
import { Tween } from "./tween";

// These are copied from the Container inline type.
export type ComponentDestroyOptions = {
	children?: boolean;
	texture?: boolean;
	baseTexture?: boolean;
};

export class Entity<T extends App = App> extends PIXI.Container {
	/**
	 * Pixi application reference.
	 */
	public app: T;

	/**
	 * Reference to audio manager instance.
	 */
	public get audio() {
		return this.app.audio;
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
	constructor(app: T) {
		super();

		this.app = app;

		if (this.app.ready) {
			// Defer this until next update.
			this.app.ticker.addOnce(this.ready, this);
		} //
		else {
			this.app.events.ready.once(this.ready, this);
		}
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
	public destroy(options?: ComponentDestroyOptions) {
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
		let tween = this.tweenGroup.get(target, options);
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
