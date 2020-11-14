import * as PIXI from "pixi.js-legacy";
import { AppBase } from "./app-base";
import { TweenGroup } from "./tween-group";
import { TweenProps } from "./tween-props";
import { Tween } from "./tween";

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
	/**
	 * Pixi application reference.
	 */
	public app: T;

	/**
	 * Component tween group.
	 */
	private readonly tweenGroup = new TweenGroup(false, 1);

	/**
	 * Core app component class helps manage linkages to core systems.
	 *
	 * @param app - Pixi application reference.
	 */
	constructor(app: T) {
		super();

		this.app = app;

		if (this.app.ready) {
			this.ready();
		} //
		else {
			this.app.events.once("ready", this.ready, this);
		}
	}

	/**
	 * Do stuff once ready.
	 */
	private ready() {
		// Call init function if it exists.
		this.init && this.init();

		// Call resize function if it exists.
		this.resize && this.resize(this.app.width, this.app.height);

		// Add listeners
		this.update && this.app.events.on("update", this.update, this);
		this.resize && this.app.events.on("resize", this.resize, this);
	}

	/**
	 * Do some extra things on the Container destroy method.
	 *
	 * @param options - Destroy options.
	 */
	public destroy(options?: ComponentDestroyOptions) {
		this.update && this.app.events.off("update", this.update, this);
		this.resize && this.app.events.off("resize", this.resize, this);
		this.cleanup && this.cleanup();
		this.tweenGroup.reset();
		this.emit("destroy");
		super.destroy(options);
	}

	/**
	 *
	 */
	protected tween<T>(target: T, options?: TweenProps): Tween<T> {
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
	 * Init method is called after ap ready event. If app is already ready, it
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
