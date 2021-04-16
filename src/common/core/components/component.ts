import { App } from "../app/app";
import { Entity } from "../entity/entity";

export interface ComponentOptions {
	enabled?: boolean;
}

/**
 * Base component class to enforce basic structure and provide some base functionality.
 *
 */
export abstract class Component extends PIXI.utils.EventEmitter {
	/** Component enabled state. */
	public get enabled(): boolean {
		return this._enabled;
	}

	public set enabled(value: boolean) {
		this._enabled = value;
	}

	/** Parent entity reference. */
	public readonly entity: Entity;

	/** Parent app reference. */
	protected readonly app: App;

	/** Internal component enabled state. */
	private _enabled = false;

	/**
	 * Components are instantiated via `Entity.prototype.add`.
	 *
	 * @param entity - The Entity instance this component will be added to.
	 */
	public constructor(entity: Entity) {
		super();

		this.entity = entity;

		this.app = entity.app;

		this.app.ticker.addOnce(() => this.init && this.init());
	}

	/** */
	public destroy() {
		this.cleanup && this.cleanup();
	}

	/**
	 * Init method is called after app ready event. If app is already ready, it
	 * runs during the constructor.
	 */
	public abstract init(...param: unknown[]): void;

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
	 *
	 * @param dt
	 */
	protected render?(dt: number): void;

	/**
	 *
	 * @param dt
	 */
	protected prerender?(dt: number): void;

	/**
	 *
	 * @param dt
	 */
	protected postrender?(dt: number): void;
}
