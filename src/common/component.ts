import * as PIXI from "pixi.js";
import { AppBase, ResizeEventData } from "./app-base";
import { TypedEmitter } from "./typed-emitter";
import { Tween } from "./tween";
import { TweenGroup } from "./tween-group";
import { TweenOptions } from "./tween-props";

// These are copied from the Container inline type.
export type ComponentDestroyOptions = {
	children?: boolean;
	texture?: boolean;
	baseTexture?: boolean;
};

/**
 * The start of a core component class.
 */
export class Component<T extends AppBase> extends PIXI.Container {
	/** Pixi application reference. */
	public app: T;

	/** Reference to audio manager instance. */
	public get audio() {
		return this.app.audio;
	}

	public readonly onInit = new TypedEmitter();
	public readonly onDestroy = new TypedEmitter();

	protected readonly tweenGroup = new TweenGroup(false, 1);

	/**
	 * Core app component class helps manage linkages to core systems.
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
			this.app.onReady.once(this.ready, this);
		}
	}

	private ready() {
		// Call init function if it exists.
		if (this.init) {
			this.onInit.emit();
			this.init();
		}

		// Call resize function if it exists.
		if (this.resize) this.resize({ width: this.app.width, height: this.app.height });

		// Add listeners
		if (this.update) this.app.onUpdate.on(this.update, this);
		if (this.resize) this.app.onResize.on(this.resize, this);
	}

	public destroy(options?: ComponentDestroyOptions) {
		if (this.update) this.app.onUpdate.off(this.update, this);
		if (this.resize) this.app.onResize.off(this.resize, this);
		if (this.cleanup) this.cleanup();
		this.clearTweens();
		this.onDestroy.emit();
		super.destroy(options);
	}

	public clearTweens() {
		this.tweenGroup.reset();
	}

	protected tween<T>(target: T, options?: TweenOptions): Tween<T> {
		const tween = this.tweenGroup.get(target, options);
		return tween;
	}

	protected delay(time: number) {
		return new Promise((resolve) => this.tween(this).wait(time).call(resolve));
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
	protected resize?(data: ResizeEventData): void;
}
