import * as PIXI from "pixi.js-legacy";

/**
 * The start of a core component class.
 */
export class Component<T extends PIXI.Application> extends PIXI.Container {
	public app: T;

	/**
	 *
	 *
	 * @param app - Pixi application reference.
	 */
	constructor(app: T) {
		super();

		this.app = app;
	}
}
